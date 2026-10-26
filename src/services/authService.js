import {
  backend,
  readSavedUser,
  saveSessionSnapshot,
  setInMemoryAccessToken,
  getInMemoryAccessToken,
  requestTokenFromOpenTabs,
  clearSessionSnapshot,
  performTokenRefresh,
} from './backendApi';

export const authService = {
  async login(payload) {
    const { data } = await backend.post('/auth/login', payload);
    saveSessionSnapshot({
      user: data.user,
      access: data.access,
      refresh: data.refresh,
      isLoginOrSignup: true,
    });
    return {
      user: data.user,
      access: data.access,
    };
  },

  async signup(payload) {
    const { data } = await backend.post('/auth/register', payload);
    saveSessionSnapshot({
      user: data.user,
      access: data.access,
      refresh: data.refresh,
      isLoginOrSignup: true,
    });
    return {
      user: data.user,
      access: data.access,
    };
  },

  /**
   * Restores session when opening a new tab or refreshing:
   * - Rule 2: If `localStorage` has no user details (`!savedUser`), returns `{ user: null, access: null }`.
   * - Multi-Tab Sync: First checks if another open tab already has the active in-memory token via BroadcastChannel.
   * - Rule 3: Otherwise calls `POST /auth/refresh` using the `httpOnly` refreshToken cookie.
   *   Logs out all tabs only if `/auth/refresh` returns 401/403 and no open tab holds a valid token.
   */
  async restoreSession() {
    const savedUser = readSavedUser();
    if (!savedUser) {
      clearSessionSnapshot({ broadcast: false });
      return { user: null, access: null };
    }

    // 1. Ask any other open tab for the active in-memory token via BroadcastChannel (<100ms)
    const tabToken = await requestTokenFromOpenTabs(100);
    if (tabToken && readSavedUser()) {
      return {
        access: tabToken,
        user: readSavedUser() || savedUser,
      };
    }

    // 2. Otherwise refresh from the backend httpOnly refreshToken cookie
    try {
      const data = await performTokenRefresh();
      let user = data?.user || readSavedUser() || savedUser;
      if (!data?.user && data?.access) {
        try {
          const meRes = await backend.get('/auth/me', {
            silentPatch: true,
            _skipPreRefresh: true,
            headers: { Authorization: `Bearer ${data.access}` },
          });
          if (meRes.data?.user) user = meRes.data.user;
        } catch {
          user = readSavedUser() || savedUser;
        }
      }
      if (readSavedUser()) {
        saveSessionSnapshot({
          user,
          access: data?.access || null,
          refresh: data?.refresh,
        });
      }
      return {
        access: data?.access || null,
        user: readSavedUser() ? user : null,
      };
    } catch (err) {
      // Check if another open tab provided a token while `/auth/refresh` was in flight
      const lateTabToken = getInMemoryAccessToken() || (await requestTokenFromOpenTabs(60));
      if (lateTabToken && readSavedUser()) {
        return {
          access: lateTabToken,
          user: readSavedUser() || savedUser,
        };
      }

      const status = err?.response?.status;
      // Rule 3: Refresh token is expired, invalid, or user account is unauthorized/deactivated
      if (status === 401 || status === 403) {
        clearSessionSnapshot({ broadcast: true });
        const authErr = new Error(
          err?.response?.data?.message || 'Session expired, please log in again',
        );
        authErr.unauthorized = true;
        throw authErr;
      }

      return {
        access: getInMemoryAccessToken(),
        user: readSavedUser() || savedUser,
      };
    }
  },

  async me() {
    const { data } = await backend.get('/auth/me');
    if (data?.user && readSavedUser()) {
      saveSessionSnapshot({ user: data.user });
    }
    return data.user;
  },

  async logout() {
    // Immediately clear localStorage and broadcast FORCE_LOGOUT to all open tabs first
    clearSessionSnapshot({ broadcast: true });
    try {
      await backend.post(
        '/auth/logout',
        {},
        { silentPatch: true, _skipPreRefresh: true },
      );
    } catch {
      /* ignore */
    }
  },

  async updateProfile(payload) {
    const { data } = await backend.patch('/users/me', payload);
    if (data?.user && readSavedUser()) {
      saveSessionSnapshot({ user: data.user });
    }
    return data.user;
  },

  async changePassword(payload) {
    const { data } = await backend.patch('/users/me/password', payload);
    if (data.access) setInMemoryAccessToken(data.access, data.refresh);
    return data;
  },

  async deleteMyAccount(password = '') {
    const { data } = await backend.delete('/users/me', { data: { password } });
    clearSessionSnapshot({ broadcast: true });
    return data;
  },

  // Admin & SuperAdmin User Management
  async users(params = {}) {
    const { data } = await backend.get('/admin/users', { params });
    const list = Array.isArray(data) ? data : data.users || [];
    return list.map((u) => ({ ...u, id: u.id ?? u._id }));
  },

  async createStaff(payload) {
    const { data } = await backend.post('/superadmin/users', payload);
    return data.user;
  },

  async removeUser(id) {
    return backend.delete(`/admin/users/${id}`);
  },

  async setRole(id, role) {
    const { data } = await backend.patch(`/admin/users/${id}/role`, { role });
    return data.user;
  },

  async setActive(id, isActive, reason = '') {
    const { data } = await backend.patch(`/admin/users/${id}/active`, {
      isActive,
      reason,
    });
    return data.user;
  },

  async adminChangePassword(id, newPassword) {
    const { data } = await backend.patch(`/admin/users/${id}/password`, {
      newPassword,
    });
    return data;
  },
};
