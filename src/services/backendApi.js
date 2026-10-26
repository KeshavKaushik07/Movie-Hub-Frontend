import axios from 'axios';
import { BACKEND } from '../config/constants';
import { sanitizePayload, safeJsonParse } from '../utils/security';
import { notifyPatch } from '../utils/notify';

/**
 * HYBRID PERSISTENT USER PROFILE + IN-MEMORY ACCESS TOKEN + HTTPONLY REFRESH COOKIE ENGINE:
 * 1. User Profile Details (`id`, `name`, `email`, `role`, `avatarColor`, `bio`, `favoriteGenres`, `preferences`)
 *    are stored in `localStorage` under `user` (and `movieshub_user`) so closing and reopening a tab
 *    keeps the user signed in seamlessly.
 * 2. Access Token (`access`) is stored STRICTLY in React / JS memory (`inMemoryAccessToken` & `state.auth.access`)
 *    — NEVER in `localStorage` or `sessionStorage`.
 * 3. Refresh Token (`refreshToken`) is stored STRICTLY in the browser's `httpOnly` cookie (`withCredentials: true`)
 *    — NEVER in `localStorage` or `sessionStorage`.
 * 4. The user is ONLY logged out when:
 *    (a) They manually click Logout,
 *    (b) `localStorage` is cleared and user details (`user` / `movieshub_user`) cannot be found, or
 *    (c) The `refreshToken` cookie is expired, revoked, or unauthorized (`401` / `403` from `/auth/refresh`).
 */

const USER_STORAGE_KEY = 'user';
const ALT_USER_STORAGE_KEY = 'movieshub_user';

let inMemoryAccessToken = null;
let storeRef = null;
let refreshPromise = null;

/**
 * Strips any token or sensitive fields and returns only safe user profile details for `localStorage`.
 */
export const sanitizeUserForStorage = (u) => {
  if (!u || typeof u !== 'object') return null;
  const raw = u._doc ? { ...u, ...u._doc } : u;
  const id = raw.id || raw._id || null;
  const email = raw.email || '';
  if (!id && !email) return null;
  return {
    id: id ? String(id) : null,
    name: raw.name || '',
    email,
    role: raw.role || 'user',
    avatarColor: raw.avatarColor || '#f5b942',
    bio: raw.bio || '',
    location: raw.location || '',
    favoriteGenres: Array.isArray(raw.favoriteGenres) ? raw.favoriteGenres : [],
    preferences: raw.preferences || undefined,
    isActive: raw.isActive !== false,
    createdAt: raw.createdAt || undefined,
  };
};

/**
 * Migrates any existing user object from legacy storage keys into `user` / `movieshub_user`,
 * and purges all `access` and `refresh` tokens from `localStorage` and `sessionStorage`.
 */
const migrateAndPurgeLegacyTokenKeys = () => {
  const legacySessionKeys = [
    'movieshub_session_backup_v6',
    'movieshub_tab_session_v6',
  ];
  const pureTokenKeys = [
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
    // If `user` is not yet stored under USER_STORAGE_KEY, rescue `user` profile from legacy session backup
    const existingRaw =
      localStorage.getItem(USER_STORAGE_KEY) ||
      localStorage.getItem(ALT_USER_STORAGE_KEY);
    if (!existingRaw) {
      for (const k of legacySessionKeys) {
        const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
        if (raw) {
          const parsed = safeJsonParse(raw);
          const cleanUser = sanitizeUserForStorage(parsed?.user || parsed);
          if (cleanUser) {
            const serialized = JSON.stringify(cleanUser);
            localStorage.setItem(USER_STORAGE_KEY, serialized);
            localStorage.setItem(ALT_USER_STORAGE_KEY, serialized);
            break;
          }
        }
      }
    } else {
      // Ensure existing `user` in localStorage has zero token fields
      const parsed = safeJsonParse(existingRaw);
      const cleanUser = sanitizeUserForStorage(parsed?.user || parsed);
      if (cleanUser) {
        const serialized = JSON.stringify(cleanUser);
        localStorage.setItem(USER_STORAGE_KEY, serialized);
        localStorage.setItem(ALT_USER_STORAGE_KEY, serialized);
      }
    }
  } catch {
    /* ignore */
  }

  try {
    [...legacySessionKeys, ...pureTokenKeys].forEach((k) =>
      localStorage.removeItem(k),
    );
  } catch {
    /* ignore */
  }
  try {
    [...legacySessionKeys, ...pureTokenKeys].forEach((k) =>
      sessionStorage.removeItem(k),
    );
  } catch {
    /* ignore */
  }
};

migrateAndPurgeLegacyTokenKeys();

/**
 * Reads the persisted User Details from `localStorage`.
 * Returns `null` if `localStorage` was cleared or user is not logged in.
 */
export const readSavedUser = () => {
  try {
    const raw =
      localStorage.getItem(USER_STORAGE_KEY) ||
      localStorage.getItem(ALT_USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    return sanitizeUserForStorage(parsed?.user || parsed);
  } catch {
    return null;
  }
};

export const readSavedSession = () => {
  const user = readSavedUser();
  return user ? { user, access: inMemoryAccessToken } : null;
};

/**
 * Saves the User Details to `localStorage` (NEVER tokens) and keeps `access` strictly in JS memory.
 */
export const saveSessionSnapshot = ({ user, access } = {}) => {
  if (access !== undefined) {
    inMemoryAccessToken = access || null;
  }
  if (user !== undefined) {
    const cleanUser = sanitizeUserForStorage(user);
    try {
      if (cleanUser) {
        const serialized = JSON.stringify(cleanUser);
        localStorage.setItem(USER_STORAGE_KEY, serialized);
        localStorage.setItem(ALT_USER_STORAGE_KEY, serialized);
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(ALT_USER_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }
};

/**
 * Completely clears in-memory access token and removes User Details from `localStorage`.
 */
export const clearSessionSnapshot = () => {
  inMemoryAccessToken = null;
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ALT_USER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  migrateAndPurgeLegacyTokenKeys();
};

export const setInMemoryAccessToken = (token, _refresh = undefined, user = undefined) => {
  inMemoryAccessToken = token || null;
  if (user !== undefined) {
    saveSessionSnapshot({ user, access: inMemoryAccessToken });
  }
};

export const getInMemoryAccessToken = () =>
  inMemoryAccessToken || storeRef?.getState()?.auth?.access || null;

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
 * Requests a fresh Access Token using the browser's `httpOnly` refreshToken cookie.
 * Concurrent callers share the same in-flight `refreshPromise`.
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
        if (data.user) {
          saveSessionSnapshot({ user: data.user, access: data.access });
        }
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

backend.interceptors.request.use(async (cfg) => {
  const url = cfg?.url || '';
  const isAuthEndpoint = /\/auth\/(login|signup|register|refresh|logout)/.test(url);

  // Rule 2: If the user was logged in in Redux memory, but `localStorage` was cleared
  // (so user details no longer exist in localStorage), log out immediately!
  const savedUser = readSavedUser();
  if (!isAuthEndpoint && !savedUser && (inMemoryAccessToken || storeRef?.getState()?.auth?.user)) {
    inMemoryAccessToken = null;
    if (storeRef) {
      storeRef.dispatch({ type: 'auth/clearSession' });
    }
  }

  // If `localStorage` has user details (e.g. tab was just reopened) but `inMemoryAccessToken`
  // is not yet in memory, silently refresh it from the httpOnly cookie before sending protected requests
  let token = getInMemoryAccessToken();
  if (!token && savedUser && !isAuthEndpoint && !cfg._skipPreRefresh) {
    try {
      const refreshed = await performTokenRefresh();
      if (refreshed?.access) {
        token = refreshed.access;
        if (storeRef) {
          storeRef.dispatch({
            type: 'auth/setSessionFromRefresh',
            payload: { access: refreshed.access, user: refreshed.user || savedUser },
          });
        }
      }
    } catch (refreshErr) {
      const rStatus = refreshErr?.response?.status;
      if (rStatus === 401 || rStatus === 403) {
        clearSessionSnapshot();
        if (storeRef) {
          storeRef.dispatch({ type: 'auth/clearSession' });
        }
      }
    }
  }

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

    // When Access Token expires (401), request a new Access Token using the httpOnly Refresh Token cookie,
    // store the new Access Token in memory, and retry the original request!
    if (status === 401 && !original?._retry && !isAuthEndpoint) {
      // Only attempt refresh if user details exist in localStorage (Rule 2)
      const savedUser = readSavedUser();
      if (!savedUser) {
        clearSessionSnapshot();
        if (storeRef) {
          storeRef.dispatch({ type: 'auth/clearSession' });
        }
      } else {
        original._retry = true;
        original._skipPreRefresh = true;
        try {
          const data = await performTokenRefresh();
          if (data?.access) {
            setInMemoryAccessToken(data.access);
            if (storeRef) {
              storeRef.dispatch({
                type: 'auth/setSessionFromRefresh',
                payload: { access: data.access, user: data.user || savedUser },
              });
            }
            original.headers = {
              ...(original.headers || {}),
              Authorization: `Bearer ${data.access}`,
            };
            return backend(original);
          }
        } catch (refreshErr) {
          const rStatus = refreshErr?.response?.status;
          // Rule 3: If Refresh Token is expired or unauthorized (401/403), log the user out!
          if (rStatus === 401 || rStatus === 403) {
            clearSessionSnapshot();
            if (storeRef) {
              storeRef.dispatch({ type: 'auth/clearSession' });
            }
          }
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

export default backend;
