import axios from 'axios';
import { BACKEND } from '../config/constants';

/**
 * SESSION & TOKEN LIFECYCLE:
 * - Primary Access Token lives in memory (`inMemoryAccessToken`).
 * - Tab-scoped session snapshot (`sessionStorage`) + fallback profile cache keep your login
 *   alive across manual/hard refreshes (F5 / Ctrl+R) and allow testing 2 different user accounts
 *   in 2 tabs simultaneously without cookie collisions logging you out mid-chat.
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
      const parsed = JSON.parse(tabRaw);
      if (parsed && (parsed.user || parsed.refresh || parsed.access)) return parsed;
    }
  } catch {
    /* ignore */
  }
  try {
    const fbRaw = localStorage.getItem(FALLBACK_SESSION_KEY);
    if (fbRaw) {
      const parsed = JSON.parse(fbRaw);
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
          headers: savedRefresh ? { 'x-refresh-token': savedRefresh } : {},
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
  return cfg;
});

backend.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthEndpoint = /\/auth\/(login|signup|register|refresh|logout)/.test(original?.url || '');

    if (err.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
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
        const status = refreshErr?.response?.status;
        const msg = String(refreshErr?.response?.data?.message || '').toLowerCase();
        // Only clear session if the backend explicitly rejected the refresh token as deactivated/invalid
        if (status === 403 || msg.includes('deactivated')) {
          clearSessionSnapshot();
          if (storeRef) {
            storeRef.dispatch({ type: 'auth/clearSession' });
          }
        }
      }
    }
    return Promise.reject(err);
  },
);
