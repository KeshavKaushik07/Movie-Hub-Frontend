import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Trash2,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  Crown,
  Users,
  UserCheck,
  UserX,
  MapPin,
  Ban,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ROLES } from '../../config/constants';
import CustomSelect from '../ui/CustomSelect';
import { formatAdminDate, formatShortId } from './adminHelpers';

export default function UsersSection({
  mode = 'users', // 'users' (Regular Users ONLY) | 'staff' (Staff: Admin & Super Admins)
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
  const [searchParams, setSearchParams] = useSearchParams();
  const isStaffMode = mode === 'staff';
  const defaultTab = isStaffMode ? 'admin' : 'all';
  const rawUrlTab = searchParams.get('tab') || defaultTab;
  const normalizedTab =
    isStaffMode && rawUrlTab === 'manage' ? 'admin' : rawUrlTab;

  const [subTab, setSubTab] = useState(normalizedTab);
  const [showCreateStaffDrawer, setShowCreateStaffDrawer] = useState(false);

  useEffect(() => {
    const raw = searchParams.get('tab') || (isStaffMode ? 'admin' : 'all');
    const next = isStaffMode && raw === 'manage' ? 'admin' : raw;
    setSubTab(next);
    if (isStaffMode && raw === 'create') {
      setShowCreateStaffDrawer(true);
    } else {
      setShowCreateStaffDrawer(false);
    }
  }, [searchParams, isStaffMode]);

  useEffect(() => {
    if (isStaffMode) {
      const targetRole =
        subTab === 'superadmin' ? ROLES.SUPERADMIN : ROLES.ADMIN;
      if (newStaff.role !== targetRole) {
        setNewStaff((prev) => ({ ...prev, role: targetRole }));
      }
    } else if (!isStaffMode && subTab === 'create' && newStaff.role !== ROLES.USER) {
      setNewStaff((prev) => ({ ...prev, role: ROLES.USER }));
    }
  }, [isStaffMode, subTab]); // eslint-disable-line

  const handleSwitchTab = (nextTab) => {
    setSubTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  // Separate Regular Users, Admin Staff, and Super Admins
  const regularUsers = (users || []).filter((u) => u.role === ROLES.USER);
  const adminAccounts = (users || []).filter((u) => u.role === ROLES.ADMIN);
  const superAdminAccounts = (users || []).filter(
    (u) => u.role === ROLES.SUPERADMIN,
  );

  const activeRegularCount = regularUsers.filter((u) => u.isActive !== false).length;
  const suspendedRegularCount = regularUsers.filter((u) => u.isActive === false).length;

  const basePool = isStaffMode
    ? subTab === 'superadmin'
      ? superAdminAccounts
      : adminAccounts
    : regularUsers;

  const visibleAccounts = basePool.filter((u) => {
    if (!isStaffMode) {
      if (subTab === 'active' && u.isActive === false) return false;
      if (subTab === 'suspended' && u.isActive !== false) return false;
    }
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase().trim();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchId = String(u.id || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchId;
    }
    return true;
  });

  const resolveUserLocation = (u) => {
    if (u.location && u.location.trim()) return u.location;
    const reg = u.preferences?.region || 'IN';
    return reg === 'IN' ? 'India (IN)' : 'Global';
  };

  const viewMeta = isStaffMode
    ? subTab === 'superadmin'
      ? {
          title: `Super Admins (${superAdminAccounts.length})`,
          subtitle: 'Root system owners and highest-privilege accounts',
          icon: Crown,
        }
      : {
          title: `Admin Staff (${adminAccounts.length})`,
          subtitle: 'Platform moderators & content studio administrators',
          icon: Shield,
        }
    : subTab === 'active'
      ? {
          title: `Active Regular Users (${activeRegularCount})`,
          subtitle: 'Verified active member accounts with community & review access',
          icon: UserCheck,
        }
      : subTab === 'suspended'
        ? {
            title: `Suspended Users (${suspendedRegularCount})`,
            subtitle: 'Blocked or deactivated member accounts',
            icon: UserX,
          }
        : {
            title: `All Regular Users (${regularUsers.length})`,
            subtitle: `Total ${regularUsers.length} registered members (${activeRegularCount} active, ${suspendedRegularCount} suspended)`,
            icon: Users,
          };

  const HeaderIcon = viewMeta.icon;

  return (
    <div className="space-y-5">
      {/* Frozen Inner Contextual Header & Search Bar */}
      <div className="admin-sticky-bar">
        {subTab !== 'create' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <HeaderIcon size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">{viewMeta.title}</h3>
                <p className="text-[11px] text-zinc-400">{viewMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSearchUsers();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative w-56 sm:w-64">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={
                      isStaffMode
                        ? 'Search staff name or email...'
                        : 'Search user name or email...'
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#070a10] py-2 pr-8 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button type="submit" className="admin-btn admin-btn-secondary">
                  Search
                </button>
              </form>

              {isStaffMode && (
                <button
                  type="button"
                  onClick={() => setShowCreateStaffDrawer((v) => !v)}
                  className="admin-btn admin-btn-primary"
                >
                  <UserPlus size={13} />
                  {showCreateStaffDrawer
                    ? 'Close Form'
                    : subTab === 'superadmin'
                      ? '+ Add Super Admin'
                      : '+ Add Admin'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-[#0e131f] p-3.5 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <UserPlus size={18} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  Create New Regular User Account
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Register a standard user account with instant community and watchlist access
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchTab('all')}
              className="admin-btn admin-btn-secondary"
            >
              Back to Users List ({regularUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* ==================== CREATE ACCOUNT VIEW ==================== */}
      {(subTab === 'create' || (isStaffMode && showCreateStaffDrawer)) && (
        <form
          onSubmit={async (e) => {
            await onCreateStaff(e);
            setShowCreateStaffDrawer(false);
            if (!isStaffMode) {
              handleSwitchTab('all');
            }
          }}
          className="rounded-2xl border border-brand/30 bg-[#0e131f] p-6 shadow-xl"
        >
          {isStaffMode && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                  <ShieldAlert size={20} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {subTab === 'superadmin'
                      ? 'Provision New Super Admin Account'
                      : 'Provision New Admin Account'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Onboard new Admin moderators or Super Admins with full console access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateStaffDrawer(false)}
                className="admin-btn admin-btn-secondary"
              >
                Hide Form
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Full Name *
              </label>
              <input
                required
                placeholder="e.g. Aryan Sharma"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Email Address *
              </label>
              <input
                required
                type="email"
                placeholder="e.g. staff@movieshub.in"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Password (min 6 chars) *
              </label>
              <input
                required
                type="password"
                minLength={6}
                placeholder="••••••••"
                value={newStaff.password}
                onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-zinc-300">
                Account Role
              </label>
              <CustomSelect
                value={newStaff.role}
                onChange={(val) => setNewStaff({ ...newStaff, role: val })}
                options={
                  isStaffMode
                    ? [
                        { value: ROLES.ADMIN, label: '🛡️ Admin' },
                        { value: ROLES.SUPERADMIN, label: '👑 Super Admin' },
                      ]
                    : [
                        { value: ROLES.USER, label: '👤 Regular User' },
                        { value: ROLES.ADMIN, label: '🛡️ Admin Staff' },
                      ]
                }
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-white/10 pt-4">
            <button type="submit" className="admin-btn admin-btn-primary px-6 py-2.5">
              <UserPlus size={14} />{' '}
              {isStaffMode
                ? newStaff.role === ROLES.SUPERADMIN
                  ? 'Create Super Admin Account'
                  : 'Create Admin Account'
                : 'Create User Account'}
            </button>
          </div>
        </form>
      )}

      {/* ==================== SEPARATED DIRECTORY TABLE ==================== */}
      {subTab !== 'create' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{isStaffMode ? 'Staff Account' : 'User'}</th>
                <th>Created</th>
                <th>Location</th>
                <th>Role & Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                    {isStaffMode ? (
                      <>
                        <Shield size={20} className="mx-auto mb-2 text-brand" />
                        No {subTab === 'superadmin' ? 'Super Admin' : 'Admin'} accounts match this filter.
                      </>
                    ) : (
                      <>
                        <Users size={20} className="mx-auto mb-2 text-brand" />
                        No regular user accounts match this filter.
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                visibleAccounts.map((u) => {
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
                      <td className="whitespace-nowrap">
                        <span
                          title={`Full ID: ${u.id}`}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] font-bold text-zinc-300"
                        >
                          {formatShortId(u.id)}
                        </span>
                      </td>

                      <td className="max-w-60 overflow-hidden">
                        <div className="flex min-w-0 items-start gap-2.5 overflow-hidden">
                          <span
                            style={{ backgroundColor: u.avatarColor || '#f5b942' }}
                            className="keep-white mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow"
                          >
                            {(u.name || 'U')[0].toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <p className="truncate text-xs font-extrabold text-white">
                                {u.name}
                              </p>
                              <span
                                className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                  u.isActive !== false ? 'bg-emerald-400' : 'bg-rose-500'
                                }`}
                                title={
                                  u.isActive !== false
                                    ? 'Active Account'
                                    : 'Suspended Account'
                                }
                              />
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap text-zinc-300">
                        {formatAdminDate(u.createdAt)}
                      </td>

                      <td className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                          <MapPin size={11} className="text-brand" />
                          {isIndia ? '🇮🇳' : '🌍'} {locLabel}
                        </span>
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isSuper &&
                          u.role !== ROLES.SUPERADMIN &&
                          u.id !== currentUser?.id ? (
                            <div className="w-40">
                              <CustomSelect
                                value={u.role}
                                onChange={(val) => onChangeRole(u.id, val)}
                                options={[
                                  { value: ROLES.USER, label: '👤 Regular User' },
                                  { value: ROLES.ADMIN, label: '🛡️ Admin' },
                                  { value: ROLES.SUPERADMIN, label: '👑 Super Admin' },
                                ]}
                              />
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                                u.role === ROLES.SUPERADMIN
                                  ? 'bg-brand text-black'
                                  : u.role === ROLES.ADMIN
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-white/10 text-zinc-300'
                              }`}
                            >
                              {u.role === ROLES.SUPERADMIN ? (
                                <>
                                  <Crown size={10} /> Super Admin
                                </>
                              ) : (
                                u.role
                              )}
                            </span>
                          )}
                          <span
                            className={`admin-status-badge ${
                              u.isActive !== false
                                ? 'admin-status-emerald'
                                : 'admin-status-rose'
                            }`}
                          >
                            {u.isActive !== false ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canChangePassword && (
                            <button
                              type="button"
                              onClick={() => onOpenPasswordModal(u)}
                              className="admin-btn admin-btn-amber admin-btn-sm"
                            >
                              <KeyRound size={12} /> Password
                            </button>
                          )}
                          {canManageUser && (
                            <button
                              type="button"
                              onClick={() => onToggleActive(u)}
                              className={`admin-btn admin-btn-sm ${
                                u.isActive === false
                                  ? 'admin-btn-emerald'
                                  : 'admin-btn-secondary'
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
                              title="Delete Account"
                              className="admin-btn admin-btn-danger admin-btn-sm px-2"
                            >
                              <Trash2 size={12} />
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
      )}
    </div>
  );
}
