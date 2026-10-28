import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  ShieldAlert,
  Crown,
  Database,
  KeyRound,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  ArrowLeft,
  LogOut,
  X,
  ChevronDown,
  Settings,
} from 'lucide-react';

export default function AdminSidebar({
  user,
  isSuper,
  activeSection,
  sidebarOpen,
  setSidebarOpen,
  onLogout,
  stats,
  liveCounts = {},
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || '';

  const c = stats?.counts || {};

  const featuredBadge =
    liveCounts.featured !== undefined
      ? liveCounts.featured
      : c.featuredHeroCount;
  const blogsBadge =
    liveCounts.blogs !== undefined ? liveCounts.blogs : c.blogsCount;
  const communityBadge =
    liveCounts.community !== undefined
      ? liveCounts.community
      : c.communityRoomsCount;
  const reviewsBadge =
    liveCounts.reviews !== undefined ? liveCounts.reviews : c.reviews;
  const regularUsersBadge =
    liveCounts.regularUsers !== undefined ? liveCounts.regularUsers : c.users;
  const staffBadge =
    liveCounts.staffUsers !== undefined ? liveCounts.staffUsers : c.admins;
  const adminUsersBadge =
    liveCounts.adminUsers !== undefined ? liveCounts.adminUsers : undefined;
  const superAdminUsersBadge =
    liveCounts.superAdminUsers !== undefined
      ? liveCounts.superAdminUsers
      : undefined;

  const rawTitlesTotal =
    liveCounts.titles !== undefined ? liveCounts.titles : c.titles;
  const titlesBadge =
    rawTitlesTotal !== undefined && rawTitlesTotal !== null
      ? rawTitlesTotal >= 1000
        ? `${Math.round((rawTitlesTotal / 1000) * 10) / 10}k`
        : rawTitlesTotal
      : undefined;

  // Track which dropdown menus are expanded (only for Staff under System & Security)
  const [openMenus, setOpenMenus] = useState(() => ({
    staff: activeSection === 'staff',
  }));

  useEffect(() => {
    if (activeSection === 'staff') {
      setOpenMenus((prev) => ({ ...prev, staff: true }));
    }
  }, [activeSection]);

  const toggleMenu = (key, defaultTo) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    if (activeSection !== key && defaultTo) {
      navigate(defaultTo);
    }
  };

  const navGroups = [
    {
      title: 'Platform Management',
      items: [
        {
          key: 'overview',
          to: '/admin',
          label: 'Overview',
          icon: LayoutDashboard,
          dropdown: false,
        },
        {
          key: 'featured',
          to: '/admin/featured',
          label: 'Featured',
          icon: Sparkles,
          badge: featuredBadge,
          dropdown: false,
        },
        {
          key: 'community',
          to: '/admin/community',
          label: 'Community',
          icon: MessageSquare,
          badge: communityBadge,
          dropdown: false,
        },
        {
          key: 'reviews',
          to: '/admin/reviews',
          label: 'Critics & Moderation',
          icon: Award,
          badge: reviewsBadge,
          dropdown: false, // Dropdown removed; inner filters used instead
        },
        {
          key: 'users',
          to: '/admin/users',
          label: 'User Management',
          icon: Users,
          badge: regularUsersBadge,
          dropdown: false, // Dropdown removed; inner filters used instead
        },
      ],
    },
    {
      title: 'Content Management',
      items: [
        {
          key: 'catalog',
          to: '/admin/catalog',
          label: 'Media & Box Office',
          icon: Database,
          badge: titlesBadge,
          dropdown: false,
        },
        {
          key: 'blogs',
          to: '/admin/blogs',
          label: 'Blog Studio',
          icon: BookOpen,
          badge: blogsBadge,
          dropdown: false,
        },
      ],
    },
    {
      title: 'Staff & Security',
      items: [
        {
          key: 'staff',
          to: '/admin/staff',
          label: 'Staff Management',
          icon: ShieldAlert,
          badge: staffBadge,
          dropdown: false,
        },
        ...(isSuper
          ? [
              {
                key: 'api-keys',
                to: '/admin/api-keys',
                label: 'API Keys',
                icon: KeyRound,
                badge: liveCounts.apiKeys,
                dropdown: false,
              },
            ]
          : []),
        {
          key: 'settings',
          to: '/admin/settings',
          label: 'Settings',
          icon: Settings,
          dropdown: false,
        },
      ],
    },
  ];

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className='fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden'
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] transition-transform duration-300 lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className='flex items-center justify-between border-b border-[#d5d9e0] dark:border-white/10 px-5 py-4'>
          <div className='flex items-center gap-3'>
            <span className='keep-white flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 dark:bg-brand text-white dark:text-black font-extrabold shadow-sm'>
              <Shield size={18} />
            </span>
            <div>
              <h1 className='text-sm font-bold text-[#1b2230] dark:text-white leading-tight'>
                Movies Hub Studio
              </h1>
              <span
                className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase ${
                  isSuper
                    ? 'bg-amber-100 text-amber-800 dark:bg-brand dark:text-black'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                }`}
              >
                {user?.role} Console
              </span>
            </div>
          </div>
          <button
            type='button'
            onClick={() => setSidebarOpen(false)}
            className='admin-btn admin-btn-secondary admin-btn-icon lg:hidden'
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className='studio-scroll flex-1 space-y-5 overflow-y-auto px-3 py-4'>
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className='mb-2 px-3 text-[10px] font-bold tracking-wider text-[#4a5262] dark:text-zinc-500 uppercase'>
                {group.title}
              </p>
              <div className='space-y-1'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.key;
                  const hasDropdown =
                    item.dropdown &&
                    Array.isArray(item.subItems) &&
                    item.subItems.length > 0;
                  const isExpanded = Boolean(openMenus[item.key]);

                  if (!hasDropdown) {
                    return (
                      <Link
                        key={item.key}
                        to={item.to}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#2350d8] text-white shadow-xs font-bold dark:bg-brand dark:text-black keep-white'
                            : 'text-[#4a5262] dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#1b2230] dark:hover:text-white'
                        }`}
                      >
                        <span className='flex items-center gap-2.5 truncate'>
                          <Icon size={16} className='shrink-0' />
                          <span className='truncate'>{item.label}</span>
                        </span>
                        {item.badge !== undefined && item.badge !== null && (
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                              active
                                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                                : 'bg-slate-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  }

                  return (
                    <div key={item.key}>
                      <button
                        type='button'
                        onClick={() => toggleMenu(item.key, item.to)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#2350d8] text-white font-bold dark:bg-brand dark:text-black'
                            : 'text-[#4a5262] dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#1b2230] dark:hover:text-white'
                        }`}
                      >
                        <span className='flex min-w-0 items-center gap-2.5 truncate'>
                          <Icon size={16} className='shrink-0' />
                          <span className='truncate'>{item.label}</span>
                        </span>
                        <span className='flex shrink-0 items-center gap-1.5'>
                          {item.badge !== undefined && item.badge !== null && (
                            <span
                              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                                active
                                  ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                                  : 'bg-slate-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${
                              isExpanded ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </span>
                      </button>

                      {/* Dropdown Sub-Items */}
                      {isExpanded && (
                        <div className='ml-4 mt-1 border-l border-[#d5d9e0] dark:border-white/10 pl-2.5 space-y-0.5 py-0.5'>
                          {item.subItems.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <Link
                                key={sub.to}
                                to={sub.to}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                  sub.isActive
                                    ? 'bg-blue-50 text-blue-700 dark:bg-brand/15 dark:text-brand font-bold'
                                    : 'text-[#4a5262] dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[#1b2230] dark:hover:text-white'
                                }`}
                              >
                                <span className='flex items-center gap-2 truncate'>
                                  {SubIcon && (
                                    <SubIcon size={13} className='shrink-0' />
                                  )}
                                  <span className='truncate'>{sub.label}</span>
                                </span>
                                {sub.badge !== undefined &&
                                  sub.badge !== null && (
                                    <span className='rounded px-1.5 py-0.2 text-[9px] font-bold bg-slate-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'>
                                      {sub.badge}
                                    </span>
                                  )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className='space-y-2 border-t border-[#d5d9e0] dark:border-white/10 p-3.5'>
          <Link to='/' className='admin-btn admin-btn-secondary w-full'>
            <ArrowLeft size={14} /> Exit to User App
          </Link>
          <button
            type='button'
            onClick={onLogout}
            className='admin-btn admin-btn-danger w-full'
          >
            <LogOut size={14} /> Sign Out ({user?.name?.split(' ')[0]})
          </button>
        </div>
      </aside>
    </>
  );
}
