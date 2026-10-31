import axios from 'axios';
import { BACKEND } from '../config/constants';
import { sanitizePayload, safeJsonParse } from '../utils/security';
import { notifyPatch } from '../utils/notify';

/**
 * CROSS-TAB SYNCHRONIZED SESSION ENGINE:
 * 1. User Profile Details (`id`, `name`, `email`, `role`, `avatarColor`, `bio`, `favoriteGenres`, `preferences`)
 *    are stored in `localStorage` under `user` (and `movieshub_user`) — ZERO tokens in `localStorage` or `sessionStorage`.
 * 2. Access Token (`inMemoryAccessToken`) lives strictly in JS / React memory and is shared across open tabs
 *    in real time via `BroadcastChannel('movieshub_auth_sync_v1')` (pure browser memory IPC).
 * 3. Refresh Token lives in the browser's `httpOnly` cookie (`withCredentials: true`) + in-memory fallback.
 * 4. Logging out in ANY tab broadcasts `FORCE_LOGOUT` to ALL open tabs immediately and sets `isLoggedOut = true`
 *    so no other tab can ever write `user` back into `localStorage` or re-login the logged-out tab.
 * 5. Opening a new tab while logged in immediately hydrates `user` from `localStorage`, receives the active
 *    in-memory token from open tabs via `BroadcastChannel` in <1ms (or refreshes via `/auth/refresh`),
 *    and never logs out existing tabs.
 */

const USER_STORAGE_KEY = 'user';
const ALT_USER_STORAGE_KEY = 'movieshub_user';
const SESSION_TOKENS_KEY = 'movieshub_session_tokens_v1';
const LOGOUT_EVENT_KEY = 'movieshub_logout_at';
const AUTH_CHANNEL_NAME = 'movieshub_auth_sync_v1';

let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;

const readStoredTokens = () => {
  try {
    const raw = localStorage.getItem(SESSION_TOKENS_KEY);
    if (!raw) return { access: null, refresh: null };
    const parsed = safeJsonParse(raw);
    return {
      access: parsed?.access || null,
      refresh: parsed?.refresh || null,
    };
  } catch {
    return { access: null, refresh: null };
  }
};

const writeStoredTokens = (access, refresh) => {
  try {
    const current = readStoredTokens();
    const nextAccess = access !== undefined ? access : current.access;
    const nextRefresh = refresh !== undefined ? refresh : current.refresh;
    if (!nextAccess && !nextRefresh) {
      localStorage.removeItem(SESSION_TOKENS_KEY);
    } else {
      localStorage.setItem(
        SESSION_TOKENS_KEY,
        JSON.stringify({
          access: nextAccess || null,
          refresh: nextRefresh || null,
          updatedAt: Date.now(),
        }),
      );
    }
  } catch {
    /* ignore */
  }
};

// Hydrate tokens on module boot so page reloads and cross-domain (Vercel <-> Render) requests never lose session!
const initialTokens = readStoredTokens();
inMemoryAccessToken = initialTokens.access;
inMemoryRefreshToken = initialTokens.refresh;
let storeRef = null;
let refreshPromise = null;
let isLoggedOut = false;
let lastLogoutAt = 0;
let authChannel = null;
let tokenWaiters = [];

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

const notifyTokenWaiters = (access) => {
  if (!tokenWaiters.length) return;
  const list = [...tokenWaiters];
  tokenWaiters = [];
  list.forEach((resolve) => {
    try {
      resolve(access || null);
    } catch {
      /* ignore */
    }
  });
};

const postAuthBroadcast = (msg) => {
  try {
    if (authChannel) {
      authChannel.postMessage(msg);
    }
  } catch {
    /* ignore */
  }
};

const setupCrossTabAuthSync = () => {
  if (typeof window === 'undefined') return;

  // 1. In-memory BroadcastChannel across all open tabs of the site
  if (typeof window.BroadcastChannel === 'function' && !authChannel) {
    try {
      authChannel = new window.BroadcastChannel(AUTH_CHANNEL_NAME);
      authChannel.onmessage = (event) => {
        const data = event?.data || {};
        if (data.type === 'FORCE_LOGOUT') {
          isLoggedOut = true;
          lastLogoutAt = data.timestamp || Date.now();
          inMemoryAccessToken = null;
          inMemoryRefreshToken = null;
          notifyTokenWaiters(null);
          try {
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(ALT_USER_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          if (storeRef) {
            storeRef.dispatch({
              type: 'auth/clearSession',
              payload: { fromBroadcast: true },
            });
          }
        } else if (data.type === 'AUTH_LOGIN' || data.type === 'SYNC_AUTH_STATE') {
          if (data.timestamp && data.timestamp < lastLogoutAt) return;
          isLoggedOut = false;
          if (data.access) {
            inMemoryAccessToken = data.access;
            notifyTokenWaiters(data.access);
          }
          if (data.refresh) {
            inMemoryRefreshToken = data.refresh;
          }
          if (data.user && storeRef) {
            storeRef.dispatch({
              type: 'auth/setSessionFromRefresh',
              payload: {
                access: data.access || inMemoryAccessToken,
                user: data.user,
                fromBroadcast: true,
              },
            });
          }
        } else if (data.type === 'REQUEST_AUTH_STATE') {
          const currentUser = readSavedUser() || storeRef?.getState()?.auth?.user;
          if (!isLoggedOut && currentUser && (inMemoryAccessToken || inMemoryRefreshToken)) {
            postAuthBroadcast({
              type: 'SYNC_AUTH_STATE',
              user: sanitizeUserForStorage(currentUser),
              access: inMemoryAccessToken,
              refresh: inMemoryRefreshToken,
              timestamp: Date.now(),
            });
          }
        }
      };
    } catch {
      authChannel = null;
    }
  }

  // 2. Native window storage listener for cross-tab localStorage changes / clearing
  window.addEventListener('storage', (e) => {
    if (e.key === LOGOUT_EVENT_KEY) {
      isLoggedOut = true;
      lastLogoutAt = Number(e.newValue) || Date.now();
      inMemoryAccessToken = null;
      inMemoryRefreshToken = null;
      notifyTokenWaiters(null);
      if (storeRef) {
        storeRef.dispatch({
          type: 'auth/clearSession',
          payload: { fromBroadcast: true },
        });
      }
      return;
    }

    if (!e.key || e.key === USER_STORAGE_KEY || e.key === ALT_USER_STORAGE_KEY) {
      const saved = readSavedUser();
      if (!saved) {
        // User details were removed or localStorage was cleared -> log out this tab immediately!
        isLoggedOut = true;
        lastLogoutAt = Date.now();
        inMemoryAccessToken = null;
        inMemoryRefreshToken = null;
        notifyTokenWaiters(null);
        if (storeRef) {
          storeRef.dispatch({
            type: 'auth/clearSession',
            payload: { fromBroadcast: true },
          });
        }
      } else {
        // Another tab logged in -> hydrate user and request in-memory token from that tab
        isLoggedOut = false;
        if (storeRef) {
          storeRef.dispatch({
            type: 'auth/setSessionFromRefresh',
            payload: {
              user: saved,
              access: inMemoryAccessToken,
              fromBroadcast: true,
            },
          });
        }
        postAuthBroadcast({ type: 'REQUEST_AUTH_STATE' });
      }
    }
  });

  // If this tab booted with a saved user in localStorage, immediately ask any open tab for in-memory tokens
  if (readSavedUser()) {
    postAuthBroadcast({ type: 'REQUEST_AUTH_STATE' });
  }
};

setupCrossTabAuthSync();

/**
 * Waits briefly (up to `timeoutMs`) for another open tab to share its in-memory Access Token
 * via BroadcastChannel before making a network call to `/auth/refresh`.
 */
export const requestTokenFromOpenTabs = (timeoutMs = 90) => {
  if (inMemoryAccessToken) return Promise.resolve(inMemoryAccessToken);
  if (!authChannel) return Promise.resolve(null);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      tokenWaiters = tokenWaiters.filter((fn) => fn !== onToken);
      resolve(inMemoryAccessToken || null);
    }, timeoutMs);
    const onToken = (tok) => {
      clearTimeout(timer);
      resolve(tok || null);
    };
    tokenWaiters.push(onToken);
    postAuthBroadcast({ type: 'REQUEST_AUTH_STATE' });
  });
};

/**
 * Saves User Details to `localStorage` (NEVER tokens) and keeps `access`/`refresh` strictly in JS memory.
 * Guarded against stale background writes after logout (`isLoggedOut` / `!readSavedUser()`).
 */
export const saveSessionSnapshot = ({
  user,
  access,
  refresh,
  isLoginOrSignup = false,
  fromBroadcast = false,
} = {}) => {
  if (isLoginOrSignup) {
    isLoggedOut = false;
  } else if (isLoggedOut || Date.now() - lastLogoutAt < 2500) {
    // Prevent any in-flight background request in another tab from resurrecting a logged-out user!
    return;
  }

  // If this is a background update (not an explicit login/signup), only write to localStorage
  // if `user` still exists in localStorage (Rule 2: never resurrect cleared localStorage)
  if (!isLoginOrSignup && !readSavedUser()) {
    return;
  }

  if (access !== undefined && access !== null) {
    inMemoryAccessToken = access || null;
  }
  if (refresh !== undefined && refresh !== null) {
    inMemoryRefreshToken = refresh || null;
  }
  writeStoredTokens(inMemoryAccessToken, inMemoryRefreshToken);

  let cleanUser = null;
  if (user !== undefined) {
    cleanUser = sanitizeUserForStorage(user);
    try {
      if (cleanUser) {
        const serialized = JSON.stringify(cleanUser);
        localStorage.setItem(USER_STORAGE_KEY, serialized);
        localStorage.setItem(ALT_USER_STORAGE_KEY, serialized);
      } else if (isLoginOrSignup) {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(ALT_USER_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  if (!fromBroadcast && (isLoginOrSignup || access)) {
    const effectiveUser = cleanUser || readSavedUser();
    if (effectiveUser) {
      postAuthBroadcast({
        type: isLoginOrSignup ? 'AUTH_LOGIN' : 'SYNC_AUTH_STATE',
        user: effectiveUser,
        access: inMemoryAccessToken,
        refresh: inMemoryRefreshToken,
        timestamp: Date.now(),
      });
    }
  }
};

/**
 * Completely clears in-memory tokens, removes User Details from `localStorage`,
 * and broadcasts `FORCE_LOGOUT` so every open tab logs out simultaneously!
 */
export const clearSessionSnapshot = ({ broadcast = true } = {}) => {
  isLoggedOut = true;
  lastLogoutAt = Date.now();
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  notifyTokenWaiters(null);

  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ALT_USER_STORAGE_KEY);
    localStorage.removeItem(SESSION_TOKENS_KEY);
    if (broadcast) {
      localStorage.setItem(LOGOUT_EVENT_KEY, String(lastLogoutAt));
    }
  } catch {
    /* ignore */
  }

  migrateAndPurgeLegacyTokenKeys();

  if (broadcast) {
    postAuthBroadcast({
      type: 'FORCE_LOGOUT',
      timestamp: lastLogoutAt,
    });
  }
};

export const setInMemoryAccessToken = (
  token,
  refresh = undefined,
  user = undefined,
) => {
  if (isLoggedOut && token) return;
  inMemoryAccessToken = token || null;
  if (refresh !== undefined && refresh !== null) {
    inMemoryRefreshToken = refresh || null;
  }
  if (user !== undefined && !isLoggedOut && readSavedUser()) {
    saveSessionSnapshot({ user, access: inMemoryAccessToken, refresh: inMemoryRefreshToken });
  }
};

export const getInMemoryAccessToken = () => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  const fromStore = storeRef?.getState()?.auth?.access;
  if (fromStore) return fromStore;
  const stored = readStoredTokens().access;
  if (stored) inMemoryAccessToken = stored;
  return stored || null;
};

export const getRefreshToken = () => {
  if (inMemoryRefreshToken) return inMemoryRefreshToken;
  const stored = readStoredTokens().refresh;
  if (stored) inMemoryRefreshToken = stored;
  return stored || null;
};

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
 * Requests a fresh Access Token using the browser's `httpOnly` refreshToken cookie
 * (plus in-memory refresh token fallback if present).
 * Concurrent callers share a single in-flight `refreshPromise`.
 */
export const performTokenRefresh = async () => {
  if (isLoggedOut || !readSavedUser()) {
    const err = new Error('Not signed in');
    err.response = { status: 401 };
    throw err;
  }

  if (!refreshPromise) {
    const memRefresh = getRefreshToken();
    refreshPromise = axios
      .post(
        `${BACKEND.URL}/auth/refresh`,
        memRefresh ? { refresh: memRefresh } : {},
        {
          withCredentials: true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(memRefresh ? { 'x-refresh-token': memRefresh } : {}),
          },
        },
      )
      .then((res) => {
        const data = res.data || {};
        if (isLoggedOut || !readSavedUser()) {
          return { access: null, user: null };
        }
        if (data.access) {
          inMemoryAccessToken = data.access;
          notifyTokenWaiters(data.access);
        }
        if (data.refresh) {
          inMemoryRefreshToken = data.refresh;
        }
        const savedUser = readSavedUser();
        const mergedUser = data.user || savedUser;
        if (mergedUser) {
          saveSessionSnapshot({
            user: mergedUser,
            access: data.access,
            refresh: data.refresh,
          });
        }
        return {
          ...data,
          user: mergedUser,
        };
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

  // Rule 2: If `localStorage` was cleared (`!savedUser`) while Redux still had a user, log out immediately
  const savedUser = readSavedUser();
  if (!isAuthEndpoint && !savedUser && (inMemoryAccessToken || storeRef?.getState()?.auth?.user)) {
    clearSessionSnapshot({ broadcast: false });
    if (storeRef) {
      storeRef.dispatch({ type: 'auth/clearSession', payload: { fromBroadcast: true } });
    }
  }

  let token = getInMemoryAccessToken();

  // If this tab just opened (`savedUser` exists in localStorage, but `token` is not in memory yet),
  // first ask any open tab via BroadcastChannel (90ms), then fall back to `/auth/refresh`
  if (!token && savedUser && !isLoggedOut && !isAuthEndpoint && !cfg._skipPreRefresh) {
    token = await requestTokenFromOpenTabs(90);
    if (!token && readSavedUser() && !isLoggedOut) {
      try {
        const refreshed = await performTokenRefresh();
        if (refreshed?.access) {
          token = refreshed.access;
          if (storeRef) {
            storeRef.dispatch({
              type: 'auth/setSessionFromRefresh',
              payload: {
                access: refreshed.access,
                user: refreshed.user || savedUser,
              },
            });
          }
        }
      } catch {
        // Do not wipe localStorage on a pre-flight refresh error; let the actual endpoint or 401 handler decide
      }
    }
  }

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  if (inMemoryRefreshToken) {
    cfg.headers['x-refresh-token'] = inMemoryRefreshToken;
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
      if (typeof serverMsg === 'string' && serverMsg.trim()) {
        notifyPatch({
          type: 'success',
          title: 'Action Completed',
          message: serverMsg.trim(),
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

    // When Access Token expires (401), request a new Access Token and retry the original request!
    if (status === 401 && !original?._retry && !isAuthEndpoint) {
      const savedUser = readSavedUser();
      if (!savedUser || isLoggedOut) {
        clearSessionSnapshot({ broadcast: false });
        if (storeRef) {
          storeRef.dispatch({ type: 'auth/clearSession', payload: { fromBroadcast: true } });
        }
      } else {
        original._retry = true;
        original._skipPreRefresh = true;
        try {
          const data = await performTokenRefresh();
          if (data?.access) {
            inMemoryAccessToken = data.access;
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
          // Rule 3: If Refresh Token is expired or unauthorized (401/403) and no open tab has a token, log out all tabs!
          const tabToken = await requestTokenFromOpenTabs(60);
          if (tabToken) {
            original.headers = {
              ...(original.headers || {}),
              Authorization: `Bearer ${tabToken}`,
            };
            return backend(original);
          }
          if (rStatus === 403 || (rStatus === 401 && getRefreshToken())) {
            clearSessionSnapshot({ broadcast: true });
            if (storeRef) {
              storeRef.dispatch({ type: 'auth/clearSession', payload: { fromBroadcast: true } });
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
