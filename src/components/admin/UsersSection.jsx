import { useState } from 'react';
import {
  KeyRound,
  Trash2,
  UserPlus,
  Search,
  Shield,
  Users,
  MapPin,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { ROLES } from '../../config/constants';
import CustomSelect from '../ui/CustomSelect';
import { formatAdminDate, formatShortId } from './adminHelpers';

export default function UsersSection({
  users,
  currentUser,
  isSuper,
  userSearch,
  setUserSearch,
  onSearchUsers,
  newStaff,
  setNewStaff,
  onCreateStaff,
  onChangeRole,
  onToggleActive,
  onOpenPasswordModal,
  onRequestDeleteUser,
}) {
  // Requirement 6: Dedicated tabs for Users, Admins, and Everyone
  const [roleTab, setRoleTab] = useState('user'); // 'user' | 'admin' | 'all'

  const regularUsersCount = (users || []).filter((u) => u.role === ROLES.USER).length;
  const adminsCount = (users || []).filter((u) =>
    [ROLES.ADMIN, ROLES.SUPERADMIN].includes(u.role),
  ).length;

  const filteredUsers = (users || []).filter((u) => {
    if (roleTab === 'user') return u.role === ROLES.USER;
    if (roleTab === 'admin') return [ROLES.ADMIN, ROLES.SUPERADMIN].includes(u.role);
    return true;
  });

  const resolveUserLocation = (u) => {
    if (u.location && u.location.trim()) return u.location;
    const reg = u.preferences?.region || 'IN';
    return reg === 'IN' ? 'India (IN)' : 'Global';
  };

  return (
    <div className="space-y-5">
      {/* SuperAdmin Create Account Bar */}
      {isSuper && (
        <form
          onSubmit={onCreateStaff}
          className="rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Create New User or Staff Account
              </h3>
              <p className="text-[11px] text-zinc-400">
                Provision a new Admin moderator or standard User account directly.
              </p>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-5">
            <input
              required
              placeholder="Full Name *"
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <input
              required
              type="email"
              placeholder="Email Address *"
              value={newStaff.email}
              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="Password (min 6 chars) *"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <CustomSelect
              value={newStaff.role}
              onChange={(val) => setNewStaff({ ...newStaff, role: val })}
              options={[
                { value: ROLES.ADMIN, label: '🛡️ Admin Staff' },
                { value: ROLES.USER, label: '👤 Regular User' },
              ]}
            />
            <button type="submit" className="admin-btn admin-btn-primary">
              <UserPlus size={14} /> Create Account
            </button>
          </div>
        </form>
      )}

      {/* Requirement 6: Role Tabs (Users | Admins | Everyone) + Search Input */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#0e131f] p-1">
          <button
            type="button"
            onClick={() => setRoleTab('user')}
            className={`admin-btn ${
              roleTab === 'user'
                ? 'admin-btn-primary'
                : 'admin-btn-secondary border-transparent shadow-none'
            }`}
          >
            <Users size={13} /> Users ({regularUsersCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('admin')}
            className={`admin-btn ${
              roleTab === 'admin'
                ? 'admin-btn-primary'
                : 'admin-btn-secondary border-transparent shadow-none'
            }`}
          >
            <Shield size={13} /> Admins & Staff ({adminsCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('all')}
            className={`admin-btn ${
              roleTab === 'all'
                ? 'admin-btn-primary'
                : 'admin-btn-secondary border-transparent shadow-none'
            }`}
          >
            Everyone ({users.length})
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchUsers();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative w-56 sm:w-64">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-xl border border-white/10 bg-[#0e131f] py-2 pr-3 pl-8 text-xs text-white focus:border-[#f5b942] focus:outline-none"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Requirement 6: Redesigned Compact User & Staff Table
          Columns: ID | User (Icon + Name on top, Email underneath) | Created | Location | Role | Actions */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Created</th>
              <th>Location</th>
              <th>Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                  No accounts found in this tab.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const canManageUser =
                  u.id !== currentUser?.id &&
                  u.role !== ROLES.SUPERADMIN &&
                  (isSuper || u.role === ROLES.USER);
                const canChangePassword =
                  isSuper || u.role === ROLES.USER || u.id === currentUser?.id;
                const locLabel = resolveUserLocation(u);
                const isIndia = locLabel.toLowerCase().includes('in');

                return (
                  <tr key={u.id}>
                    {/* 1. ID */}
                    <td className="whitespace-nowrap">
                      <span
                        title={`Full ID: ${u.id}`}
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] font-bold text-zinc-300"
                      >
                        {formatShortId(u.id)}
                      </span>
                    </td>

                    {/* 2. User Icon + Name on top, Email underneath */}
                    <td className="min-w-[210px]">
                      <div className="flex items-start gap-2.5">
                        <span
                          style={{ backgroundColor: u.avatarColor || '#f5b942' }}
                          className="keep-white mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow"
                        >
                          {(u.name || 'U')[0].toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-extrabold text-white">
                              {u.name}
                            </p>
                            <span
                              className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                u.isActive !== false ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                              title={u.isActive !== false ? 'Active Account' : 'Suspended Account'}
                            />
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 3. When User Was Created */}
                    <td className="whitespace-nowrap text-zinc-300">
                      {formatAdminDate(u.createdAt)}
                    </td>

                    {/* 4. Location */}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                        <MapPin size={11} className="text-[#f5b942]" />
                        {isIndia ? '🇮🇳' : '🌍'} {locLabel}
                      </span>
                    </td>

                    {/* 5. Role */}
                    <td className="whitespace-nowrap">
                      {isSuper && u.role !== ROLES.SUPERADMIN && u.id !== currentUser?.id ? (
                        <div className="w-32">
                          <CustomSelect
                            value={u.role}
                            onChange={(val) => onChangeRole(u.id, val)}
                            options={[
                              { value: ROLES.USER, label: '👤 User' },
                              { value: ROLES.ADMIN, label: '🛡️ Admin' },
                            ]}
                          />
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                            u.role === ROLES.SUPERADMIN
                              ? 'bg-[#f5b942] text-black'
                              : u.role === ROLES.ADMIN
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-white/10 text-zinc-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* 6. Actions: Change Password, Suspend/Activate, Delete */}
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canChangePassword && (
                          <button
                            type="button"
                            onClick={() => onOpenPasswordModal(u)}
                            className="admin-btn admin-btn-amber"
                          >
                            <KeyRound size={12} /> Change Password
                          </button>
                        )}
                        {canManageUser && (
                          <button
                            type="button"
                            onClick={() => onToggleActive(u)}
                            className={`admin-btn ${
                              u.isActive === false ? 'admin-btn-emerald' : 'admin-btn-secondary'
                            }`}
                          >
                            {u.isActive === false ? (
                              <>
                                <CheckCircle2 size={12} /> Activate
                              </>
                            ) : (
                              <>
                                <Ban size={12} /> Suspend
                              </>
                            )}
                          </button>
                        )}
                        {canManageUser && (
                          <button
                            type="button"
                            onClick={() => onRequestDeleteUser(u)}
                            title="Delete User"
                            className="admin-btn admin-btn-danger"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
