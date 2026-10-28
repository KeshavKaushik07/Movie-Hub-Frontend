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
  X,
  Save,
} from 'lucide-react';
import { ROLES } from '../../config/constants';
import CustomSelect from '../ui/CustomSelect';
import { formatAdminDateTime } from './adminHelpers';

export default function UsersSection({
  mode = 'users', // 'users' (Regular Users ONLY) | 'staff' (Staff: Admin & Super Admins)
  users = [],
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
    } else if (
      !isStaffMode &&
      subTab === 'create' &&
      newStaff.role !== ROLES.USER
    ) {
      setNewStaff((prev) => ({ ...prev, role: ROLES.USER }));
    }
  }, [isStaffMode, subTab]); // eslint-disable-line

  const handleSwitchTab = (nextTab) => {
    setSubTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const regularUsers = (users || []).filter((u) => u.role === ROLES.USER);
  const adminAccounts = (users || []).filter((u) => u.role === ROLES.ADMIN);
  const superAdminAccounts = (users || []).filter(
    (u) => u.role === ROLES.SUPERADMIN,
  );
  const staffAccounts = (users || []).filter((u) =>
    [ROLES.ADMIN, ROLES.SUPERADMIN].includes(u.role),
  );

  let visibleAccounts = [];
  if (!isStaffMode) {
    if (subTab === 'active') {
      visibleAccounts = regularUsers.filter((u) => u.isActive !== false);
    } else if (subTab === 'suspended') {
      visibleAccounts = regularUsers.filter((u) => u.isActive === false);
    } else {
      visibleAccounts = regularUsers;
    }
  } else {
    if (subTab === 'superadmin') {
      visibleAccounts = superAdminAccounts;
    } else {
      visibleAccounts = adminAccounts;
    }
  }

  const resolveUserLocation = (u) => {
    const prefReg = String(
      u.preferredRegion || u.region || u.country || '',
    ).toUpperCase();
    if (prefReg.includes('IN') || prefReg.includes('INDIA'))
      return 'India (IN)';
    if (prefReg.includes('US')) return 'United States (US)';
    if (prefReg.includes('GB') || prefReg.includes('UK'))
      return 'United Kingdom (GB)';
    if (prefReg) return prefReg;
    return 'India (IN)';
  };

  return (
    <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
      {/* ==================== PINNED TOOLBAR ==================== */}
      <div className='shrink-0 mb-3 space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-2.5 shadow-xs'>
          {/* Inner Filter Tabs */}
          <div className='flex flex-wrap items-center gap-1 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-100 dark:bg-[#070a10] p-1'>
            {!isStaffMode ? (
              <>
                <button
                  type='button'
                  onClick={() => handleSwitchTab('all')}
                  className={`admin-btn admin-btn-sm ${
                    subTab === 'all'
                      ? 'admin-btn-primary font-bold'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <Users size={13} />
                  All Users ({regularUsers.length})
                </button>
                <button
                  type='button'
                  onClick={() => handleSwitchTab('active')}
                  className={`admin-btn admin-btn-sm ${
                    subTab === 'active'
                      ? 'admin-btn-primary font-bold'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <UserCheck size={13} />
                  Active (
                  {regularUsers.filter((u) => u.isActive !== false).length})
                </button>
                <button
                  type='button'
                  onClick={() => handleSwitchTab('suspended')}
                  className={`admin-btn admin-btn-sm ${
                    subTab === 'suspended'
                      ? 'admin-btn-primary font-bold'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <UserX size={13} />
                  Suspended (
                  {regularUsers.filter((u) => u.isActive === false).length})
                </button>
                <button
                  type='button'
                  onClick={() => handleSwitchTab('create')}
                  className={`admin-btn admin-btn-sm ${
                    subTab === 'create'
                      ? 'admin-btn-primary font-bold'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <UserPlus size={13} />+ Create User
                </button>
              </>
            ) : (
              <>
                <button
                  type='button'
                  onClick={() => handleSwitchTab('admin')}
                  className={`admin-btn admin-btn-sm ${
                    subTab === 'admin'
                      ? 'admin-btn-primary font-bold'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <Shield size={13} />
                  Admins ({adminAccounts.length})
                </button>
                {isSuper && (
                  <button
                    type='button'
                    onClick={() => handleSwitchTab('superadmin')}
                    className={`admin-btn admin-btn-sm ${
                      subTab === 'superadmin'
                        ? 'admin-btn-primary font-bold'
                        : 'admin-btn-secondary border-transparent shadow-none'
                    }`}
                  >
                    <Crown size={13} />
                    Super Admins ({superAdminAccounts.length})
                  </button>
                )}
              </>
            )}
          </div>

          {/* Search + Action Buttons */}
          <div className='flex flex-1 flex-wrap items-center justify-end gap-2'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchUsers(userSearch);
              }}
              className='flex min-w-44 flex-1 items-center gap-1.5 sm:max-w-xs'
            >
              <div className='relative flex-1'>
                <Search
                  size={13}
                  className='absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400'
                />
                <input
                  type='text'
                  placeholder='Search name, email...'
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className='w-full h-8 pl-8 pr-7 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white'
                />
                {userSearch && (
                  <button
                    type='button'
                    onClick={() => {
                      setUserSearch('');
                      onSearchUsers('');
                    }}
                    className='absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600'
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type='submit'
                className='admin-btn admin-btn-secondary admin-btn-sm'
              >
                Search
              </button>
            </form>

            {isStaffMode && isSuper && (
              <button
                type='button'
                onClick={() => setShowCreateStaffDrawer((v) => !v)}
                className='admin-btn admin-btn-primary admin-btn-sm'
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
      </div>

      {/* ==================== CREATE ACCOUNT DRAWER / VIEW ==================== */}
      {(subTab === 'create' || (isStaffMode && showCreateStaffDrawer)) && (
        <form
          onSubmit={async (e) => {
            await onCreateStaff(e);
            setShowCreateStaffDrawer(false);
            if (!isStaffMode) {
              handleSwitchTab('all');
            }
          }}
          className='shrink-0 mb-3 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-4 shadow-xs'
        >
          <div className='mb-3 flex items-center justify-between border-b border-[#d5d9e0] dark:border-white/10 pb-2.5'>
            <h3 className='text-sm font-bold text-[#1b2230] dark:text-white'>
              {isStaffMode
                ? subTab === 'superadmin'
                  ? 'Provision Super Admin Account'
                  : 'Provision Admin Account'
                : 'Create Regular User Account'}
            </h3>
            <button
              type='button'
              onClick={() => {
                if (isStaffMode) setShowCreateStaffDrawer(false);
                else handleSwitchTab('all');
              }}
              className='text-zinc-400 hover:text-zinc-600 text-xs'
            >
              ✕ Cancel
            </button>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Full Name *
              </label>
              <input
                required
                placeholder='e.g. Aryan Sharma'
                value={newStaff.name}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, name: e.target.value })
                }
                className='w-full h-9 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Email Address *
              </label>
              <input
                required
                type='email'
                placeholder='e.g. aryan@example.com'
                value={newStaff.email}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, email: e.target.value })
                }
                className='w-full h-9 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white'
              />
            </div>

            <div>
              <label className='block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400'>
                Initial Password *
              </label>
              <input
                required
                type='password'
                minLength={6}
                placeholder='Min 6 characters'
                value={newStaff.password}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, password: e.target.value })
                }
                className='w-full h-9 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white'
              />
            </div>
          </div>

          <div className='mt-3 flex justify-end gap-2'>
            <button
              type='submit'
              className='admin-btn admin-btn-primary admin-btn-sm'
            >
              <Save size={13} /> Create Account
            </button>
          </div>
        </form>
      )}

      {/* ==================== DIRECTORY TABLE CARD ==================== */}
      {subTab !== 'create' && (
        <div className='flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] shadow-xs'>
          <div className='flex-1 min-h-0 overflow-x-auto overflow-y-auto studio-scroll'>
            <table className='admin-table w-full text-left'>
              <thead className='sticky top-0 z-10 bg-slate-50 dark:bg-[#0e131f] border-b border-[#d5d9e0] dark:border-white/10 shadow-xs'>
                <tr>
                  <th className='w-12'>id</th>
                  <th>{isStaffMode ? 'Staff Account' : 'User'}</th>
                  <th>Created &amp; Updated</th>
                  <th>Location</th>
                  <th>Role &amp; Status</th>
                  <th className='text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='py-12 text-center text-xs text-zinc-400'
                    >
                      {isStaffMode ? (
                        <>
                          <Shield
                            size={22}
                            className='mx-auto mb-2 text-[#2350d8] dark:text-brand'
                          />
                          No {subTab === 'superadmin' ? 'Super Admin' : 'Admin'}{' '}
                          accounts match this filter.
                        </>
                      ) : (
                        <>
                          <Users
                            size={22}
                            className='mx-auto mb-2 text-[#2350d8] dark:text-brand'
                          />
                          No regular user accounts match this filter.
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  visibleAccounts.map((u, idx) => {
                    const canManageUser =
                      u.id !== currentUser?.id &&
                      u.role !== ROLES.SUPERADMIN &&
                      (isSuper || u.role === ROLES.USER);
                    const canChangePassword =
                      isSuper ||
                      u.role === ROLES.USER ||
                      u.id === currentUser?.id;
                    const locLabel = resolveUserLocation(u);
                    const isIndia = locLabel.toLowerCase().includes('in');

                    return (
                      <tr key={u.id}>
                        {/* 1. Normal Row ID */}
                        <td className='whitespace-nowrap font-mono text-[11px] font-bold text-zinc-500'>
                          #{idx + 1}
                        </td>

                        {/* 2. User Info */}
                        <td className='max-w-xs overflow-hidden'>
                          <div className='flex min-w-0 items-start gap-2.5 overflow-hidden'>
                            <span
                              style={{
                                backgroundColor: u.avatarColor || '#2350d8',
                              }}
                              className='keep-white mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs'
                            >
                              {(u.name || 'U')[0].toUpperCase()}
                            </span>
                            <div className='min-w-0 flex-1 overflow-hidden'>
                              <div className='flex items-center gap-1.5 overflow-hidden'>
                                <p className='truncate text-xs font-bold text-[#1b2230] dark:text-white'>
                                  {u.name}
                                </p>
                                <span
                                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                    u.isActive !== false
                                      ? 'bg-emerald-500'
                                      : 'bg-rose-500'
                                  }`}
                                  title={
                                    u.isActive !== false
                                      ? 'Active'
                                      : 'Suspended'
                                  }
                                />
                              </div>
                              <p className='mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400'>
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 3. Created & Updated */}
                        <td className='whitespace-nowrap text-[11px] leading-tight'>
                          <div className='text-zinc-800 dark:text-zinc-200 font-medium'>
                            <span className='text-zinc-400 text-[10px]'>
                              Cre:{' '}
                            </span>
                            {formatAdminDateTime(u.createdAt)}
                          </div>
                          <div className='text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5'>
                            <span className='text-zinc-400 text-[9px]'>
                              Upd:{' '}
                            </span>
                            {formatAdminDateTime(
                              u.updatedAt || u.lastLoginAt || u.createdAt,
                            )}
                          </div>
                        </td>

                        {/* 4. Location */}
                        <td className='whitespace-nowrap'>
                          <span className='inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300'>
                            <MapPin
                              size={11}
                              className='text-[#2350d8] dark:text-brand'
                            />
                            {isIndia ? '🇮🇳' : '🌍'} {locLabel}
                          </span>
                        </td>

                        {/* 5. Role & Status */}
                        <td className='whitespace-nowrap'>
                          <div className='flex items-center gap-2'>
                            {isSuper &&
                            u.role !== ROLES.SUPERADMIN &&
                            u.id !== currentUser?.id ? (
                              <div className='w-36'>
                                <CustomSelect
                                  value={u.role}
                                  onChange={(val) => onChangeRole(u.id, val)}
                                  options={[
                                    { value: ROLES.USER, label: '👤 User' },
                                    { value: ROLES.ADMIN, label: '🛡️ Admin' },
                                    {
                                      value: ROLES.SUPERADMIN,
                                      label: '👑 Super Admin',
                                    },
                                  ]}
                                />
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  u.role === ROLES.SUPERADMIN
                                    ? 'bg-amber-100 text-amber-800 dark:bg-brand dark:text-black'
                                    : u.role === ROLES.ADMIN
                                      ? 'bg-blue-100 text-blue-800 dark:bg-sky-500/20 dark:text-sky-300'
                                      : 'bg-slate-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {u.role === ROLES.SUPERADMIN ? (
                                  <Crown size={10} />
                                ) : null}
                                {u.role}
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

                        {/* 6. Actions */}
                        <td className='whitespace-nowrap text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            {canChangePassword && (
                              <button
                                type='button'
                                onClick={() => onOpenPasswordModal(u)}
                                className='admin-btn admin-btn-amber admin-btn-sm'
                                title='Change Password'
                              >
                                <KeyRound size={12} /> Password
                              </button>
                            )}
                            {canManageUser && (
                              <button
                                type='button'
                                onClick={() => onToggleActive(u)}
                                className={`admin-btn admin-btn-sm ${
                                  u.isActive === false
                                    ? 'admin-btn-emerald'
                                    : 'admin-btn-secondary'
                                }`}
                              >
                                {u.isActive === false ? 'Activate' : 'Suspend'}
                              </button>
                            )}
                            {isSuper && u.id !== currentUser?.id && (
                              <button
                                type='button'
                                onClick={() => onRequestDeleteUser(u)}
                                className='admin-btn admin-btn-danger admin-btn-sm px-2'
                                title='Delete User Account'
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

          <div className='shrink-0 border-t border-[#d5d9e0] dark:border-white/10 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] text-xs text-zinc-500 flex justify-between items-center'>
            <span>Showing {visibleAccounts.length} accounts</span>
            <span>Total registered: {users.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
