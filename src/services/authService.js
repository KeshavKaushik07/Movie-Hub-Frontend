import {
  backend,
  setInMemoryAccessToken,
  saveSessionSnapshot,
  clearSessionSnapshot,
  readSavedSession,
  performTokenRefresh,
  getRefreshToken,
} from './backendApi';

export const authService = {
  async login(payload) {
    const { data } = await backend.post('/auth/login', payload);
    setInMemoryAccessToken(data.access, data.refresh, data.user);
    saveSessionSnapshot({
      user: data.user,
      access: data.access,
      refresh: data.refresh,
    });
    return data;
  },

  async signup(payload) {
    const { data } = await backend.post('/auth/register', payload);
    setInMemoryAccessToken(data.access, data.refresh, data.user);
    saveSessionSnapshot({
      user: data.user,
      access: data.access,
      refresh: data.refresh,
    });
    return data;
  },

  async restoreSession() {
    const saved = readSavedSession();
    try {
      const data = await performTokenRefresh();
      let user = data?.user || saved?.user || null;
      if (!user && data?.access) {
        const meRes = await backend.get('/auth/me');
        user = meRes.data?.user || null;
      }
      if (user) {
        saveSessionSnapshot({
          user,
          access: data?.access || saved?.access,
          refresh: data?.refresh || saved?.refresh,
        });
      }
      return {
        access: data?.access || saved?.access || null,
        refresh: data?.refresh || saved?.refresh || null,
        user,
      };
    } catch (err) {
      // If we already have a valid access token in this tab, verify via /auth/me before giving up
      if (saved?.access) {
        try {
          const meRes = await backend.get('/auth/me');
          if (meRes.data?.user) {
            saveSessionSnapshot({
              user: meRes.data.user,
              access: saved.access,
              refresh: saved.refresh,
            });
            return {
              access: saved.access,
              refresh: saved.refresh,
              user: meRes.data.user,
            };
          }
        } catch (meErr) {
          if (
            meErr?.response?.status === 401 ||
            meErr?.response?.status === 403
          ) {
            clearSessionSnapshot();
            throw meErr;
          }
        }
        // Network error / server restarting: keep cached user session alive
        if (!err?.response && saved?.user) {
          return saved;
        }
      }
      clearSessionSnapshot();
      throw err;
    }
  },

  async me() {
    const { data } = await backend.get('/auth/me');
    if (data?.user) saveSessionSnapshot({ user: data.user });
    return data.user;
  },

  async logout() {
    const refresh = getRefreshToken();
    try {
      await backend.post('/auth/logout', refresh ? { refresh } : {});
    } finally {
      clearSessionSnapshot();
    }
  },

  async updateProfile(payload) {
    const { data } = await backend.patch('/users/me', payload);
    if (data?.user) saveSessionSnapshot({ user: data.user });
    return data.user;
  },

  async changePassword(payload) {
    const { data } = await backend.patch('/users/me/password', payload);
    if (data.access) setInMemoryAccessToken(data.access, data.refresh);
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
