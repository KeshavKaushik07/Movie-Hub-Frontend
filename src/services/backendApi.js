import axios from 'axios';
import { BACKEND } from '../config/constants';
import { sanitizePayload, safeJsonParse } from '../utils/security';
import { notifyPatch } from '../utils/notify';

/**
 * SESSION & TOKEN LIFECYCLE + SECURITY & STATUS PATCH INTERCEPTOR:
 * - Primary Access Token lives in memory (`inMemoryAccessToken`).
 * - Tab-scoped session snapshot (`sessionStorage`) + fallback profile cache keep your login
 *   alive across manual/hard refreshes (F5 / Ctrl+R) and allow testing 2 different user accounts
 *   in 2 tabs simultaneously without cookie collisions logging you out mid-chat.
 * - Sanitizes all outgoing payloads against XSS & NoSQL prototype keys.
 * - Emits Frontend Information Patches (`notifyPatch`) for mutating actions & errors.
 */
const TAB_SESSION_KEY = 'movieshub_tab_session_v6';
const FALLBACK_SESSION_KEY = 'movieshub_session_backup_v6';

let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;
let storeRef = null;
let refreshPromise = null;

export const readSavedSession = () => {
  try {
    const tabRaw = sessionStorage.getItem(TAB_SESSION_KEY);
    if (tabRaw) {
      const parsed = safeJsonParse(tabRaw);
      if (parsed && (parsed.user || parsed.refresh || parsed.access)) return parsed;
    }
  } catch {
    /* ignore */
  }
  try {
    const fbRaw = localStorage.getItem(FALLBACK_SESSION_KEY);
    if (fbRaw) {
      const parsed = safeJsonParse(fbRaw);
      if (parsed && (parsed.user || parsed.refresh || parsed.access)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
};

export const saveSessionSnapshot = ({ user, access, refresh } = {}) => {
  const existing = readSavedSession() || {};
  const next = {
    user: user !== undefined ? user : existing.user || null,
    access: access !== undefined ? access : inMemoryAccessToken || existing.access || null,
    refresh: refresh !== undefined ? refresh : inMemoryRefreshToken || existing.refresh || null,
    updatedAt: Date.now(),
  };
  if (next.access) inMemoryAccessToken = next.access;
  if (next.refresh) inMemoryRefreshToken = next.refresh;
  try {
    sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

export const clearSessionSnapshot = () => {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  try {
    sessionStorage.removeItem(TAB_SESSION_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(FALLBACK_SESSION_KEY);
  } catch {
    /* ignore */
  }
};

// Initialize from existing tab/fallback snapshot on module load so hard refresh is instant
const bootSession = readSavedSession();
if (bootSession?.access) inMemoryAccessToken = bootSession.access;
if (bootSession?.refresh) inMemoryRefreshToken = bootSession.refresh;

// Clean up any legacy timer keys
try {
  localStorage.removeItem('guest_started_at');
  localStorage.removeItem('guest_started_at_v4');
} catch {
  /* ignore */
}

export const setInMemoryAccessToken = (token, refresh = undefined, user = undefined) => {
  inMemoryAccessToken = token || null;
  if (refresh !== undefined) inMemoryRefreshToken = refresh || null;
  if (token || refresh || user) {
    saveSessionSnapshot({ access: token, refresh, user });
  }
};

export const getInMemoryAccessToken = () =>
  inMemoryAccessToken || storeRef?.getState()?.auth?.access || readSavedSession()?.access || null;

export const getRefreshToken = () =>
  inMemoryRefreshToken || readSavedSession()?.refresh || null;

export const injectStore = (s) => {
  storeRef = s;
};

export const backend = axios.create({
  baseURL: BACKEND.URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export const performTokenRefresh = async () => {
  if (!refreshPromise) {
    const savedRefresh = getRefreshToken();
    refreshPromise = axios
      .post(
        `${BACKEND.URL}/auth/refresh`,
        savedRefresh ? { refresh: savedRefresh } : {},
        {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(savedRefresh ? { 'x-refresh-token': savedRefresh } : {}),
          },
        },
      )
      .then((res) => {
        const data = res.data || {};
        if (data.access) {
          saveSessionSnapshot({
            access: data.access,
            refresh: data.refresh || savedRefresh,
            user: data.user,
          });
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
  const rToken = getRefreshToken();
  if (rToken) {
    cfg.headers['x-refresh-token'] = rToken;
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

    if (['post', 'put', 'patch', 'delete'].includes(method) && !res.config?.silentPatch && !isSilentAuth) {
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

    if (status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const data = await performTokenRefresh();
        if (data?.access) {
          if (storeRef) {
            storeRef.dispatch({ type: 'auth/setSessionFromRefresh', payload: data });
          }
          original.headers.Authorization = `Bearer ${data.access}`;
          return backend(original);
        }
      } catch (refreshErr) {
        const rStatus = refreshErr?.response?.status;
        const msg = String(refreshErr?.response?.data?.message || '').toLowerCase();
        // Only clear session if the backend explicitly rejected the refresh token as deactivated/invalid
        if (rStatus === 403 || msg.includes('deactivated')) {
          clearSessionSnapshot();
          if (storeRef) {
            storeRef.dispatch({ type: 'auth/clearSession' });
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
                  : 'Action Failed',
        message: errMsg,
      });
    }

    return Promise.reject(err);
  },
);

export default backend;
