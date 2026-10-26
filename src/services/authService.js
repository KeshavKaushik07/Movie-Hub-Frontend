import {
  backend,
  readSavedUser,
  saveSessionSnapshot,
  setInMemoryAccessToken,
  clearSessionSnapshot,
  performTokenRefresh,
} from './backendApi';

export const authService = {
  async login(payload) {
    const { data } = await backend.post('/auth/login', payload);
    saveSessionSnapshot({ user: data.user, access: data.access });
    return {
      user: data.user,
      access: data.access,
    };
  },

  async signup(payload) {
    const { data } = await backend.post('/auth/register', payload);
    saveSessionSnapshot({ user: data.user, access: data.access });
    return {
      user: data.user,
      access: data.access,
    };
  },

  /**
   * Restores session when reopening a tab or refreshing:
   * - Rule 2: If `localStorage` was cleared and has no user details (`!savedUser`),
   *   clears any lingering cookie and returns `{ user: null, access: null }`.
   * - Rule 3: If `localStorage` has user details, calls `POST /auth/refresh` using the
   *   `httpOnly` refreshToken cookie to get a fresh in-memory `access` token.
   *   Only logs out if `/auth/refresh` returns 401/403 (expired or unauthorized refresh token).
   */
  async restoreSession() {
    const savedUser = readSavedUser();
    if (!savedUser) {
      clearSessionSnapshot();
      backend.post('/auth/logout', {}, { silentPatch: true }).catch(() => {});
      return { user: null, access: null };
    }

    try {
      const data = await performTokenRefresh();
      let user = data?.user || savedUser;
      if (!data?.user && data?.access) {
        try {
          const meRes = await backend.get('/auth/me', {
            silentPatch: true,
            _skipPreRefresh: true,
            headers: { Authorization: `Bearer ${data.access}` },
          });
          if (meRes.data?.user) user = meRes.data.user;
        } catch {
          user = savedUser;
        }
      }
      saveSessionSnapshot({ user, access: data?.access || null });
      return {
        access: data?.access || null,
        user,
      };
    } catch (err) {
      const status = err?.response?.status;
      // Rule 3: Refresh token is expired, invalid, missing, or user account is unauthorized/deactivated
      if (status === 401 || status === 403) {
        clearSessionSnapshot();
        const authErr = new Error(
          err?.response?.data?.message || 'Session expired, please log in again',
        );
        authErr.unauthorized = true;
        throw authErr;
      }
      // Network hiccup / server restarting: keep savedUser so closing/reopening tab doesn't log out
      return {
        access: null,
        user: savedUser,
      };
    }
  },

  async me() {
    const { data } = await backend.get('/auth/me');
    if (data?.user) {
      saveSessionSnapshot({ user: data.user });
    }
    return data.user;
  },

  async logout() {
    try {
      await backend.post('/auth/logout', {}, { silentPatch: true });
    } finally {
      clearSessionSnapshot();
    }
  },

  async updateProfile(payload) {
    const { data } = await backend.patch('/users/me', payload);
    if (data?.user) {
      saveSessionSnapshot({ user: data.user });
    }
    return data.user;
  },

  async changePassword(payload) {
    const { data } = await backend.patch('/users/me/password', payload);
    if (data.access) setInMemoryAccessToken(data.access);
    return data;
  },

  async deleteMyAccount(password = '') {
    const { data } = await backend.delete('/users/me', { data: { password } });
    clearSessionSnapshot();
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
