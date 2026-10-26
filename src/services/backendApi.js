import axios from 'axios';
import { BACKEND } from '../config/constants';
import { sanitizePayload } from '../utils/security';
import { notifyPatch } from '../utils/notify';

/**
 * PURE IN-MEMORY ACCESS TOKEN + HTTPONLY REFRESH COOKIE ENGINE:
 * - Access Token is stored ONLY in JavaScript / React (Redux) memory (`inMemoryAccessToken` & `state.auth.access`).
 * - Refresh Token is stored ONLY in the browser's `httpOnly` cookie (`withCredentials: true`).
 * - ZERO tokens (`access` or `refresh`) are ever stored in `localStorage` or `sessionStorage`.
 * - When an API request returns 401 (expired access token), the interceptor automatically calls
 *   `POST /auth/refresh` (sending the `httpOnly` refresh cookie), stores the new access token
 *   in memory, and retries the original request seamlessly.
 */

let inMemoryAccessToken = null;
let storeRef = null;
let refreshPromise = null;

// Purge any legacy token or session keys from localStorage and sessionStorage immediately on load
const purgeLegacyTokenStorage = () => {
  const legacyKeys = [
    'movieshub_tab_session_v6',
    'movieshub_session_backup_v6',
    'accessToken',
    'refreshToken',
    'access',
    'refresh',
    'token',
    'auth',
    'guest_started_at',
    'guest_started_at_v4',
  ];
  try {
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  try {
    legacyKeys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};

purgeLegacyTokenStorage();

export const setInMemoryAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};

export const getInMemoryAccessToken = () =>
  inMemoryAccessToken || storeRef?.getState()?.auth?.access || null;

// Compatibility helpers (strictly in-memory; never write to localStorage or sessionStorage)
export const readSavedSession = () => null;

export const saveSessionSnapshot = ({ access } = {}) => {
  if (access !== undefined) {
    inMemoryAccessToken = access || null;
  }
};

export const clearSessionSnapshot = () => {
  inMemoryAccessToken = null;
  purgeLegacyTokenStorage();
};

export const getRefreshToken = () => null;

export const injectStore = (s) => {
  storeRef = s;
};

export const backend = axios.create({
  baseURL: BACKEND.URL,
  withCredentials: true, // Always send httpOnly refreshToken cookie
  timeout: 15000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

/**
 * Requests a new Access Token using the browser's httpOnly refreshToken cookie.
 * Concurrent 401 responses share a single in-flight `refreshPromise`.
 */
export const performTokenRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${BACKEND.URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        },
      )
      .then((res) => {
        const data = res.data || {};
        if (data.access) {
          setInMemoryAccessToken(data.access);
        }
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

backend.interceptors.request.use((cfg) => {
  const token = getInMemoryAccessToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  cfg.headers['X-Requested-With'] = 'XMLHttpRequest';

  if (cfg.data && typeof cfg.data === 'object') {
    cfg.data = sanitizePayload(cfg.data);
  }
  if (cfg.params && typeof cfg.params === 'object') {
    cfg.params = sanitizePayload(cfg.params);
  }
  return cfg;
});

backend.interceptors.response.use(
  (res) => {
    const method = (res.config?.method || 'get').toLowerCase();
    const url = res.config?.url || '';
    const isSilentAuth = /\/auth\/(refresh|me)/.test(url);

    if (
      ['post', 'put', 'patch', 'delete'].includes(method) &&
      !res.config?.silentPatch &&
      !isSilentAuth
    ) {
      const serverMsg = res.data?.message;
      if (serverMsg) {
        notifyPatch({
          type: 'success',
          title: 'Action Completed',
          message: serverMsg,
        });
      }
    }
    return res;
  },
  async (err) => {
    const original = err.config || {};
    const status = err.response?.status;
    const method = (original.method || 'get').toLowerCase();
    const url = original?.url || '';
    const isAuthEndpoint = /\/auth\/(login|signup|register|refresh|logout)/.test(url);

    // If Access Token is expired (401), automatically request a new Access Token using
    // the httpOnly Refresh Token cookie, store it in memory, and retry the original request!
    if (status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const data = await performTokenRefresh();
        if (data?.access) {
          setInMemoryAccessToken(data.access);
          if (storeRef) {
            storeRef.dispatch({
              type: 'auth/setSessionFromRefresh',
              payload: { access: data.access, user: data.user },
            });
          }
          original.headers = {
            ...(original.headers || {}),
            Authorization: `Bearer ${data.access}`,
          };
          return backend(original);
        }
      } catch {
        clearSessionSnapshot();
        if (storeRef) {
          storeRef.dispatch({ type: 'auth/clearSession' });
        }
      }
    }

    // Show Frontend Information Patch for failed operations
    const isSilentCheck = /\/auth\/(refresh|me)/.test(url);
    const isHandledInlineGet404 = method === 'get' && status === 404;
    if (!original.silentPatch && !isSilentCheck && !isHandledInlineGet404 && status) {
      const errMsg =
        err.response?.data?.message ||
        (status === 404
          ? 'The requested item was not found.'
          : status === 403
            ? 'You do not have permission to perform this action.'
            : status === 429
              ? 'Too many requests. Please wait a moment and try again.'
              : status === 401
                ? 'Please sign in to continue.'
                : 'Request could not be completed.');

      notifyPatch({
        type: status === 404 ? 'not-found' : status === 429 ? 'warning' : 'error',
        title:
          status === 404
            ? 'Not Found'
            : status === 403
              ? 'Access Restricted'
              : status === 429
                ? 'Rate Limit Reached'
                : status === 401
                  ? 'Authentication Required'
                  : 'Operation Failed',
        message: errMsg,
      });
    }

    return Promise.reject(err);
  },
);
