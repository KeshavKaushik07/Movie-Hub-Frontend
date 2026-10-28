import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Shield,
  SlidersHorizontal,
  Database,
  Cpu,
  Play,
  Square,
  Save,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Ban,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
  Crown,
  Users,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react';
import { ROLES } from '../../config/constants';
import { authService } from '../../services/authService';
import { clearCatalogCache } from '../../services/api';
import { formatAdminDate, formatShortId } from './adminHelpers';

const APP_SETTINGS_STORAGE_KEY = 'movieshub_admin_system_settings_v1';

const DEFAULT_APP_SETTINGS = {
  siteName: 'Movies Hub',
  siteTagline: 'India & Global Cinema, OTT & Box Office Intelligence',
  autoApproveReviews: true,
  enforceSpoilerBlur: true,
  publicRegistration: true,
  showBoxOfficeVerdicts: true,
  defaultCommunitySlowMode: 0,
  maintenanceMode: false,
};

export default function SettingsSection({
  user,
  isSuper,
  theme,
  onToggleTheme,
  users = [],
  stats,
  heroLimit = 10,
  onUpdateHeroLimit,
  catalogVisibleLimit = 100,
  onChangeCatalogVisibleLimit,
  crawler,
  quotaForm,
  setQuotaForm,
  onStartCrawler,
  onStopCrawler,
  onSaveQuotas,
  featuredItems = [],
  blogs = [],
  commRooms = [],
  keys = [],
  onOpenPasswordModal,
  onToggleActive,
  onRefreshAll,
  notify,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'security'; // 'security' | 'app' | 'data'
  const [activeTab, setActiveTab] = useState(urlTab);

  // 1. Passwords & Security State
  const [accountRoleFilter, setAccountRoleFilter] = useState('all'); // 'all' | 'user' | 'admin' | 'superadmin'
  const [passwordSearchQ, setPasswordSearchQ] = useState('');
  const [myProfileForm, setMyProfileForm] = useState({
    name: user?.name || '',
    location: user?.location || 'India (IN)',
  });
  const [myPasswordForm, setMyPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showMyPasswords, setShowMyPasswords] = useState(false);
  const [savingMyPassword, setSavingMyPassword] = useState(false);
  const [savingMyProfile, setSavingMyProfile] = useState(false);

  // 2. Whole App Configuration State
  const [limitInput, setLimitInput] = useState(heroLimit || 10);
  const [catalogLimitInput, setCatalogLimitInput] = useState(
    catalogVisibleLimit || 100,
  );
  const [appConfig, setAppConfig] = useState(() => {
    try {
      const raw = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      return raw ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) } : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  });

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'security');
  }, [searchParams]);

  useEffect(() => {
    setLimitInput(heroLimit || 10);
  }, [heroLimit]);

  useEffect(() => {
    setCatalogLimitInput(catalogVisibleLimit || 100);
  }, [catalogVisibleLimit]);

  useEffect(() => {
    if (user) {
      setMyProfileForm({
        name: user.name || '',
        location: user.location || 'India (IN)',
      });
    }
  }, [user]);

  const handleSwitchTab = (nextTab) => {
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  // Filter accounts for Central Password & Security Vault
  const filteredAccounts = (users || []).filter((u) => {
    if (accountRoleFilter !== 'all' && u.role !== accountRoleFilter) return false;
    if (passwordSearchQ.trim()) {
      const q = passwordSearchQ.toLowerCase().trim();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveMyProfile = async (e) => {
    e.preventDefault();
    if (!myProfileForm.name.trim()) return;
    setSavingMyProfile(true);
    try {
      await authService.updateProfile({
        name: myProfileForm.name.trim(),
        location: myProfileForm.location.trim(),
      });
      if (notify) notify('Admin profile details updated!');
    } catch (err) {
      if (notify) {
        notify(err.response?.data?.message || 'Failed to update profile', 'error');
      }
    } finally {
      setSavingMyProfile(false);
    }
  };

  const handleSaveMyPassword = async (e) => {
    e.preventDefault();
    if (myPasswordForm.newPassword.trim().length < 6) {
      if (notify) notify('New password must be at least 6 characters', 'error');
      return;
    }
    if (myPasswordForm.newPassword.trim() !== myPasswordForm.confirmPassword.trim()) {
      if (notify) notify('New passwords do not match', 'error');
      return;
    }
    setSavingMyPassword(true);
    try {
      await authService.changePassword({
        currentPassword: myPasswordForm.currentPassword,
        newPassword: myPasswordForm.newPassword.trim(),
      });
      setMyPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      if (notify) notify('Your admin account password has been updated!');
    } catch (err) {
      if (user?.id) {
        try {
          await authService.adminChangePassword(
            user.id,
            myPasswordForm.newPassword.trim(),
          );
          setMyPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          if (notify) notify('Your admin password has been updated!');
          return;
        } catch {
          /* ignore fallback error */
        }
      }
      if (notify) {
        notify(err.response?.data?.message || 'Failed to change password', 'error');
      }
    } finally {
      setSavingMyPassword(false);
    }
  };

  const handleSaveAppConfig = (e) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(appConfig));
    } catch {
      /* ignore */
    }
    const parsedLimit = Math.max(1, Math.min(100, Number(limitInput) || 10));
    setLimitInput(parsedLimit);
    const parsedCatLimit = Math.max(
      1,
      Math.min(100, Number(catalogLimitInput) || 100),
    );
    setCatalogLimitInput(parsedCatLimit);
    if (onChangeCatalogVisibleLimit && parsedCatLimit !== Number(catalogVisibleLimit)) {
      onChangeCatalogVisibleLimit(parsedCatLimit);
    }
    if (onUpdateHeroLimit && parsedLimit !== Number(heroLimit)) {
      onUpdateHeroLimit(parsedLimit);
    } else if (notify) {
      notify('Platform & application configuration saved!');
    }
  };

  const handleResetAppConfig = () => {
    setAppConfig(DEFAULT_APP_SETTINGS);
    try {
      localStorage.setItem(
        APP_SETTINGS_STORAGE_KEY,
        JSON.stringify(DEFAULT_APP_SETTINGS),
      );
    } catch {
      /* ignore */
    }
    if (notify) notify('Application settings restored to defaults');
  };

  const handleExportPlatformData = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      platform: appConfig.siteName || 'Movies Hub',
      counts: stats?.counts || {},
      crawler: crawler || stats?.crawler || {},
      heroLimit,
      catalogVisibleLimit,
      featuredSlidesCount: featuredItems.length,
      featuredSlides: featuredItems,
      blogsCount: blogs.length,
      communityRoomsCount: commRooms.length,
      apiKeysCount: keys.length,
      appConfiguration: appConfig,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movies-hub-platform-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (notify) notify('Exported platform data snapshot JSON!');
  };

  const c = stats?.counts || {};
  const regularCount = (users || []).filter((u) => u.role === ROLES.USER).length;
  const adminCount = (users || []).filter((u) => u.role === ROLES.ADMIN).length;
  const superAdminCount = (users || []).filter(
    (u) => u.role === ROLES.SUPERADMIN,
  ).length;

  return (
    <div className="space-y-5">
      {/* Frozen Inner Selection / Filter Tabs Bar */}
      <div className="admin-sticky-bar">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 shadow-lg">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#070a10] p-1">
            {[
              {
                key: 'security',
                label: 'Passwords & Account Security',
                icon: KeyRound,
              },
              {
                key: 'app',
                label: 'Whole App Configuration',
                icon: SlidersHorizontal,
              },
              {
                key: 'data',
                label: 'Data, Backups & Crawler Engine',
                icon: Database,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleSwitchTab(tab.key)}
                  className={`admin-btn ${
                    active
                      ? 'admin-btn-primary'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-brand/15 px-3 py-1.5 text-xs font-extrabold text-brand">
              System & Security Control Center
            </span>
          </div>
        </div>
      </div>

      {/* ==================== TAB 1: PASSWORDS & ACCOUNT SECURITY ==================== */}
      {activeTab === 'security' && (
        <div className="space-y-5">
          {/* My Admin Profile & Self Password Update Cards */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* My Admin Profile Card */}
            <form
              onSubmit={handleSaveMyProfile}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg"
            >
              <div>
                <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3.5">
                  <span
                    style={{ backgroundColor: user?.avatarColor || '#f5b942' }}
                    className="keep-white flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow"
                  >
                    {(user?.name || 'A')[0].toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      My Administrator Profile
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Signed in as <b className="text-white">{user?.email}</b> ({user?.role})
                    </p>
                  </div>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-300">
                      Display Name
                    </label>
                    <input
                      required
                      value={myProfileForm.name}
                      onChange={(e) =>
                        setMyProfileForm({ ...myProfileForm, name: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-300">
                      Region / Location Label
                    </label>
                    <input
                      value={myProfileForm.location}
                      onChange={(e) =>
                        setMyProfileForm({ ...myProfileForm, location: e.target.value })
                      }
                      placeholder="India (IN)"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5">
                <span className="text-[11px] text-zinc-400">
                  Role:{' '}
                  <b className="text-brand uppercase">{user?.role || 'admin'}</b>
                </span>
                <button
                  type="submit"
                  disabled={savingMyProfile}
                  className="admin-btn admin-btn-primary"
                >
                  <Save size={13} />
                  {savingMyProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>

            {/* Change My Own Password Card */}
            <form
              onSubmit={handleSaveMyPassword}
              className="flex flex-col justify-between rounded-2xl border border-brand/25 bg-[#0e131f] p-5 shadow-lg"
            >
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                      <Lock size={19} />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        Change My Console Password
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Update your personal administrator login credentials
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMyPasswords((v) => !v)}
                    className="admin-btn admin-btn-secondary admin-btn-icon"
                    title={showMyPasswords ? 'Hide Passwords' : 'Show Passwords'}
                  >
                    {showMyPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-300">
                      Current Password
                    </label>
                    <input
                      type={showMyPasswords ? 'text' : 'password'}
                      placeholder="Current password"
                      value={myPasswordForm.currentPassword}
                      onChange={(e) =>
                        setMyPasswordForm({
                          ...myPasswordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-300">
                      New Password *
                    </label>
                    <input
                      required
                      minLength={6}
                      type={showMyPasswords ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={myPasswordForm.newPassword}
                      onChange={(e) =>
                        setMyPasswordForm({
                          ...myPasswordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-zinc-300">
                      Confirm Password *
                    </label>
                    <input
                      required
                      minLength={6}
                      type={showMyPasswords ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={myPasswordForm.confirmPassword}
                      onChange={(e) =>
                        setMyPasswordForm({
                          ...myPasswordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5">
                <span className="text-[11px] text-zinc-400">
                  Rotates session tokens automatically
                </span>
                <button
                  type="submit"
                  disabled={savingMyPassword}
                  className="admin-btn admin-btn-primary"
                >
                  <KeyRound size={13} />
                  {savingMyPassword ? 'Updating...' : 'Update My Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Central User & Staff Password Reset Vault */}
          <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <KeyRound size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Central User & Staff Password Manager ({filteredAccounts.length})
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Reset passwords or toggle account security status for any Regular User, Admin, or Super Admin
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070a10] p-1">
                  {[
                    { key: 'all', label: `All (${users.length})`, icon: Users },
                    { key: ROLES.USER, label: `Users (${regularCount})`, icon: UserCheck },
                    { key: ROLES.ADMIN, label: `Admin (${adminCount})`, icon: Shield },
                    {
                      key: ROLES.SUPERADMIN,
                      label: `Super Admins (${superAdminCount})`,
                      icon: Crown,
                    },
                  ].map((rTab) => {
                    const Icon = rTab.icon;
                    return (
                      <button
                        key={rTab.key}
                        type="button"
                        onClick={() => setAccountRoleFilter(rTab.key)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                          accountRoleFilter === rTab.key
                            ? 'bg-brand font-extrabold text-black'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Icon size={11} className="mr-1 inline" />
                        {rTab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-56 sm:w-64">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={passwordSearchQ}
                    onChange={(e) => setPasswordSearchQ(e.target.value)}
                    placeholder="Find account to reset password..."
                    className="w-full rounded-xl border border-white/10 bg-[#070a10] py-2 pr-8 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                  />
                  {passwordSearchQ && (
                    <button
                      type="button"
                      onClick={() => setPasswordSearchQ('')}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Security Status</th>
                    <th className="text-right">Password & Security Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                        No accounts match your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.slice(0, 25).map((u) => {
                      const canManageUser =
                        u.id !== user?.id &&
                        u.role !== ROLES.SUPERADMIN &&
                        (isSuper || u.role === ROLES.USER);
                      const canChangePassword =
                        isSuper || u.role === ROLES.USER || u.id === user?.id;

                      return (
                        <tr key={u.id}>
                          <td className="whitespace-nowrap font-mono text-[11px] text-zinc-400">
                            {formatShortId(u.id)}
                          </td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span
                                style={{ backgroundColor: u.avatarColor || '#f5b942' }}
                                className="keep-white flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                              >
                                {(u.name || 'U')[0].toUpperCase()}
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-white">{u.name}</p>
                                <p className="text-[10px] text-zinc-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                u.role === ROLES.SUPERADMIN
                                  ? 'bg-brand text-black'
                                  : u.role === ROLES.ADMIN
                                    ? 'bg-sky-500/20 text-sky-300'
                                    : 'bg-white/10 text-zinc-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-zinc-400">
                            {formatAdminDate(u.createdAt)}
                          </td>
                          <td>
                            <span
                              className={`admin-status-badge ${
                                u.isActive !== false
                                  ? 'admin-status-emerald'
                                  : 'admin-status-rose'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Suspended'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canChangePassword && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPasswordModal(u)}
                                  className="admin-btn admin-btn-amber admin-btn-sm"
                                >
                                  <KeyRound size={12} /> Reset Password
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
        </div>
      )}

      {/* ==================== TAB 2: WHOLE APP CONFIGURATION ==================== */}
      {activeTab === 'app' && (
        <form onSubmit={handleSaveAppConfig} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Global Branding & Hero / Catalog Display Limits */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Platform Identity, Hero & Catalog Display Limits
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Manage global platform title, Hero Carousel slide count & Media DB visible rows per page
                  </p>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-300">
                    Platform Name
                  </label>
                  <input
                    value={appConfig.siteName}
                    onChange={(e) =>
                      setAppConfig({ ...appConfig, siteName: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-zinc-300">
                    Default Community Slow-Mode (sec)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={appConfig.defaultCommunitySlowMode}
                    onChange={(e) =>
                      setAppConfig({
                        ...appConfig,
                        defaultCommunitySlowMode: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-300">
                  Platform Tagline
                </label>
                <input
                  value={appConfig.siteTagline}
                  onChange={(e) =>
                    setAppConfig({ ...appConfig, siteTagline: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
                />
              </div>

              {/* Media & Box Office Visible Data Per Page (X out of 100) */}
              <div className="rounded-2xl border border-brand/25 bg-[#070a10] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      Media & Box Office Visible Data Per Page ({catalogLimitInput} / 100)
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Control how many items out of 100 are displayed on each Catalog page (e.g. 20 or 30 out of 100)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[10, 20, 30, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setCatalogLimitInput(preset);
                          if (onChangeCatalogVisibleLimit) {
                            onChangeCatalogVisibleLimit(preset);
                          }
                        }}
                        className={`rounded-lg px-2 py-1 text-xs font-bold transition ${
                          Number(catalogLimitInput) === preset
                            ? 'bg-brand text-black'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={catalogLimitInput}
                      onChange={(e) => setCatalogLimitInput(e.target.value)}
                      className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-center text-xs font-bold text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Carousel Slide Limit */}
              <div className="rounded-2xl border border-white/10 bg-[#070a10] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-white">
                      Home Hero Carousel Slide Count
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Controls total spotlight slides displayed on the user Home page
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[8, 10, 12, 15, 20].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLimitInput(preset)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          Number(limitInput) === preset
                            ? 'bg-brand text-black'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-center text-xs font-bold text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#070a10] p-4">
                <div>
                  <p className="text-xs font-extrabold text-white">
                    Application Theme Mode
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Current active theme: <b className="text-brand uppercase">{theme}</b>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="admin-btn admin-btn-secondary"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun size={14} className="text-brand" /> Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon size={14} /> Switch to Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Platform Feature Toggles & Governance */}
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <SlidersHorizontal size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    App Feature Toggles & Moderation Rules
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Control review publishing, spoiler protection, box office badges & signups
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'autoApproveReviews',
                    title: 'Auto-Publish Audience Reviews',
                    desc: 'Allow verified users to publish ratings and reviews immediately without manual queue hold',
                  },
                  {
                    key: 'enforceSpoilerBlur',
                    title: 'Enforce Spoiler Blur Protection',
                    desc: 'Automatically blur reviews and community messages flagged as containing spoilers',
                  },
                  {
                    key: 'showBoxOfficeVerdicts',
                    title: 'Show Box Office Collection & Verdicts',
                    desc: 'Display budget, worldwide gross, and Hit/Blockbuster badges on movie detail pages',
                  },
                  {
                    key: 'publicRegistration',
                    title: 'Allow New Public User Signups',
                    desc: 'Enable new visitors to register standard user accounts on the Auth page',
                  },
                  {
                    key: 'maintenanceMode',
                    title: 'Maintenance Notice Banner',
                    desc: 'Show a scheduled maintenance notification banner to non-admin visitors',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#070a10] p-3.5 transition hover:border-brand/40"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-white">{item.title}</p>
                      <p className="text-[11px] text-zinc-400">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(appConfig[item.key])}
                      onChange={(e) =>
                        setAppConfig({ ...appConfig, [item.key]: e.target.checked })
                      }
                      className="h-4 w-4 shrink-0 accent-brand"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-4 shadow-lg">
            <button
              type="button"
              onClick={handleResetAppConfig}
              className="admin-btn admin-btn-secondary"
            >
              <RefreshCw size={13} /> Restore Default App Settings
            </button>
            <button type="submit" className="admin-btn admin-btn-primary px-6 py-2.5">
              <Save size={14} /> Save All App Settings
            </button>
          </div>
        </form>
      )}

      {/* ==================== TAB 3: DATA, BACKUPS & CRAWLER ENGINE ==================== */}
      {activeTab === 'data' && (
        <div className="space-y-5">
          {/* Database Collections Health & Quick Utilities */}
          <div className="rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Database size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Whole App Data, Cache & Backup Operations
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Inspect live MongoDB collection totals, purge caches, or download a JSON snapshot of your platform
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCatalogCache();
                    if (notify) notify('Purged frontend catalog & discovery cache!');
                  }}
                  className="admin-btn admin-btn-amber"
                >
                  <Trash2 size={13} /> Purge Catalog Cache
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onRefreshAll) onRefreshAll();
                    if (notify) notify('Synchronized all studio datasets with MongoDB!');
                  }}
                  className="admin-btn admin-btn-secondary"
                >
                  <RefreshCw size={13} /> Sync All Data
                </button>
                <button
                  type="button"
                  onClick={handleExportPlatformData}
                  className="admin-btn admin-btn-primary"
                >
                  <Download size={13} /> Export Data Snapshot (JSON)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {[
                { label: 'Total Titles', value: c.titles || 0 },
                { label: 'Movies', value: c.movies || 0 },
                { label: 'Web Series', value: c.webSeries || 0 },
                { label: 'TV Shows', value: c.tvShows || 0 },
                { label: 'Enriched Details', value: c.enrichedTitles || 0 },
                { label: 'Hero Slides', value: featuredItems.length || c.featuredHeroCount || 0 },
                { label: 'Blog Articles', value: blogs.length || c.blogsCount || 0 },
                { label: 'Community Rooms', value: commRooms.length || c.communityRoomsCount || 0 },
                { label: 'Chat Messages', value: c.communityMessagesCount || 0 },
                { label: 'Total Reviews', value: (c.userReviews || 0) + (c.criticReviews || 0) },
                { label: 'Total Comments', value: c.comments || 0 },
                { label: 'API Keys in Pool', value: keys.length || 0 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-[#070a10] p-3.5"
                >
                  <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {Number(stat.value).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Lakh Crawler Engine Live Controls & Quotas */}
          <div className="space-y-5 rounded-2xl border border-brand/30 bg-[#0e131f] p-5 shadow-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                  <Cpu size={22} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    1-Lakh Quota-Balanced TMDB Crawler Engine
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Status:{' '}
                    <b className="text-brand">
                      {crawler?.running ? 'RUNNING' : 'IDLE'}
                    </b>{' '}
                    • Indexed:{' '}
                    <b className="text-white">
                      {Number(crawler?.titlesStored ?? c.titles ?? 0).toLocaleString('en-IN')}
                    </b>{' '}
                    /{' '}
                    {Number(
                      crawler?.targetCap ?? quotaForm?.maxTitles ?? 100000,
                    ).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onStartCrawler}
                  className="admin-btn admin-btn-emerald px-4 py-2"
                >
                  <Play size={13} fill="currentColor" /> Start / Resume Crawler
                </button>
                <button
                  type="button"
                  onClick={onStopCrawler}
                  className="admin-btn admin-btn-danger px-4 py-2"
                >
                  <Square size={13} fill="currentColor" /> Stop Crawler
                </button>
              </div>
            </div>

            {quotaForm && setQuotaForm && (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    ['Total Catalog Cap', 'maxTitles'],
                    ['Movie Quota', 'movieQuota'],
                    ['Web Series Quota', 'webSeriesQuota'],
                    ['TV Shows Quota', 'tvQuota'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                        {label}
                      </label>
                      <input
                        type="number"
                        value={quotaForm[key]}
                        onChange={(e) =>
                          setQuotaForm({
                            ...quotaForm,
                            [key]: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white focus:border-brand focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={onSaveQuotas}
                    className="admin-btn admin-btn-primary px-5 py-2.5"
                  >
                    <Save size={14} /> Save Crawler Quotas
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
