import {
  backend,
  setInMemoryAccessToken,
  clearSessionSnapshot,
  performTokenRefresh,
} from './backendApi';

export const authService = {
  async login(payload) {
    const { data } = await backend.post('/auth/login', payload);
    setInMemoryAccessToken(data.access);
    return {
      user: data.user,
      access: data.access,
    };
  },

  async signup(payload) {
    const { data } = await backend.post('/auth/register', payload);
    setInMemoryAccessToken(data.access);
    return {
      user: data.user,
      access: data.access,
    };
  },

  /**
   * Restores user session on app mount by sending the httpOnly Refresh Token cookie
   * to `POST /auth/refresh`, receiving a fresh Access Token in memory.
   */
  async restoreSession() {
    try {
      const data = await performTokenRefresh();
      let user = data?.user || null;
      if (!user && data?.access) {
        const meRes = await backend.get('/auth/me');
        user = meRes.data?.user || null;
      }
      if (data?.access) {
        setInMemoryAccessToken(data.access);
      }
      return {
        access: data?.access || null,
        user,
      };
    } catch (err) {
      clearSessionSnapshot();
      throw err;
    }
  },

  async me() {
    const { data } = await backend.get('/auth/me');
    return data.user;
  },

  async logout() {
    try {
      await backend.post('/auth/logout', {});
    } finally {
      clearSessionSnapshot();
    }
  },

  async updateProfile(payload) {
    const { data } = await backend.patch('/users/me', payload);
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
