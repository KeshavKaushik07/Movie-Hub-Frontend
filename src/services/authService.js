import { backend, setInMemoryAccessToken } from './backendApi';

export const authService = {
  async login(payload) {
    const { data } = await backend.post('/auth/login', payload);
    setInMemoryAccessToken(data.access);
    return data;
  },

  async signup(payload) {
    const { data } = await backend.post('/auth/register', payload);
    setInMemoryAccessToken(data.access);
    return data;
  },

  async restoreSession() {
    // Uses the httpOnly refresh cookie to obtain a new in-memory access token + user profile
    const { data } = await backend.post('/auth/refresh', {});
    setInMemoryAccessToken(data.access);
    if (data.user) return data;
    const meRes = await backend.get('/auth/me');
    return { access: data.access, user: meRes.data.user };
  },

  async me() {
    const { data } = await backend.get('/auth/me');
    return data.user;
  },

  async logout() {
    try {
      await backend.post('/auth/logout', {});
    } finally {
      setInMemoryAccessToken(null);
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
    setInMemoryAccessToken(null);
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
};
