import axios from 'axios';
import { BACKEND } from '../config/constants';

/**
 * SECURITY ARCHITECTURE:
 * - Access Token is stored STRICTLY IN MEMORY (`inMemoryAccessToken`) — NEVER in localStorage or sessionStorage.
 * - Refresh Token is stored in the backend's `httpOnly` cookie (`withCredentials: true`).
 * - On page reload or 401 expiration, `POST /api/v1/auth/refresh` silently issues a fresh in-memory Access Token.
 */
let inMemoryAccessToken = null;
let storeRef = null;
let refreshPromise = null;

export const setInMemoryAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};

export const getInMemoryAccessToken = () => inMemoryAccessToken;

export const injectStore = (s) => {
  storeRef = s;
};

// Proactively remove any legacy token keys from localStorage if they existed from older versions
try {
  localStorage.removeItem('auth');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
} catch {
  /* ignore */
}

export const backend = axios.create({
  baseURL: BACKEND.URL,
  withCredentials: true, // Always send & receive httpOnly refresh token cookie
});

backend.interceptors.request.use((cfg) => {
  const token = inMemoryAccessToken || storeRef?.getState()?.auth?.access;
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

backend.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthEndpoint =
      /\/auth\/(login|signup|register|refresh|logout)/.test(
        original?.url || '',
      );

    if (err.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BACKEND.URL}/auth/refresh`, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        setInMemoryAccessToken(data.access);
        if (storeRef) {
          storeRef.dispatch({
            type: 'auth/setSessionFromRefresh',
            payload: data,
          });
        }
        original.headers.Authorization = `Bearer ${data.access}`;
        return backend(original);
      } catch {
        setInMemoryAccessToken(null);
        if (storeRef) {
          storeRef.dispatch({ type: 'auth/clearSession' });
        }
      }
    }
    return Promise.reject(err);
  },
);
