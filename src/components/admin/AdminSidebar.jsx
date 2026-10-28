import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserX,
  UserPlus,
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
  PlusCircle,
  ListFilter,
  Edit3,
  MessageCircle,
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

  // Track which dropdown menus are expanded (only for items with dropdown: true)
  const [openMenus, setOpenMenus] = useState(() => ({
    reviews: activeSection === 'reviews',
    users: activeSection === 'users',
    blogs: activeSection === 'blogs',
    staff: activeSection === 'staff',
  }));

  useEffect(() => {
    if (['reviews', 'users', 'blogs', 'staff'].includes(activeSection)) {
      setOpenMenus((prev) => ({ ...prev, [activeSection]: true }));
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
          label: 'Analytics Overview',
          icon: LayoutDashboard,
          dropdown: false,
        },
        {
          key: 'featured',
          to: '/admin/featured',
          label: 'Featured Hero Carousel',
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
          to: '/admin/reviews?tab=all',
          label: 'Critics & Moderation',
          icon: Award,
          badge: reviewsBadge,
          dropdown: true,
          compactDropdown: true, // Half-length compact dropdown
          subItems: [
            {
              label: 'Reviews & Critics',
              to: '/admin/reviews?tab=all',
              icon: ListFilter,
              badge: liveCounts.reviews,
              isActive:
                activeSection === 'reviews' &&
                (!currentTab || ['all', 'critic', 'user'].includes(currentTab)),
            },
            {
              label: 'Comments',
              to: '/admin/reviews?tab=comments',
              icon: MessageCircle,
              badge: liveCounts.comments,
              isActive:
                activeSection === 'reviews' && currentTab === 'comments',
            },
            {
              label: 'Publish Critic',
              to: '/admin/reviews?tab=publish',
              icon: PlusCircle,
              isActive: activeSection === 'reviews' && currentTab === 'publish',
            },
          ],
        },
        {
          key: 'users',
          to: '/admin/users?tab=all',
          label: 'User Management',
          icon: Users,
          badge: regularUsersBadge,
          dropdown: true,
          subItems: [
            {
              label: 'All Regular Users',
              to: '/admin/users?tab=all',
              icon: Users,
              badge: regularUsersBadge,
              isActive:
                activeSection === 'users' &&
                (currentTab === 'all' || !currentTab),
            },
            {
              label: 'Active Users',
              to: '/admin/users?tab=active',
              icon: UserCheck,
              badge: liveCounts.activeRegularUsers,
              isActive: activeSection === 'users' && currentTab === 'active',
            },
            {
              label: 'Suspended Users',
              to: '/admin/users?tab=suspended',
              icon: UserX,
              badge: liveCounts.suspendedRegularUsers,
              isActive: activeSection === 'users' && currentTab === 'suspended',
            },
            {
              label: 'Create Regular User',
              to: '/admin/users?tab=create',
              icon: UserPlus,
              isActive: activeSection === 'users' && currentTab === 'create',
            },
          ],
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
          to: '/admin/blogs?tab=editor',
          label: 'Blog',
          icon: BookOpen,
          badge: blogsBadge,
          dropdown: true,
          subItems: [
            {
              label: 'Write / Edit Article',
              to: '/admin/blogs?tab=editor',
              icon: Edit3,
              isActive:
                activeSection === 'blogs' &&
                (currentTab === 'editor' || !currentTab),
            },
            {
              label: 'Published & Draft Articles',
              to: '/admin/blogs?tab=list',
              icon: ListFilter,
              badge: blogsBadge,
              isActive: activeSection === 'blogs' && currentTab === 'list',
            },
          ],
        },
      ],
    },
    {
      title: 'System & Security',
      items: [
        {
          key: 'staff',
          to: '/admin/staff?tab=admin',
          label: 'Staff',
          icon: ShieldAlert,
          badge: staffBadge,
          dropdown: true,
          subItems: [
            {
              label: 'Admin',
              to: '/admin/staff?tab=admin',
              icon: Shield,
              badge: adminUsersBadge,
              isActive:
                activeSection === 'staff' &&
                (currentTab === 'admin' ||
                  currentTab === 'manage' ||
                  !currentTab),
            },
            {
              label: 'Super Admins',
              to: '/admin/staff?tab=superadmin',
              icon: Crown,
              badge: superAdminUsersBadge,
              isActive:
                activeSection === 'staff' && currentTab === 'superadmin',
            },
          ],
        },
        {
          key: 'api-keys',
          to: '/admin/api-keys',
          label: 'API key',
          icon: KeyRound,
          badge: liveCounts.apiKeys,
          dropdown: false,
        },
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
          className='fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden'
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#0e131f] transition-transform duration-300 lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className='flex items-center justify-between border-b border-white/10 px-4 py-4'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-amber-500 text-black shadow-lg shadow-brand/25'>
              <Shield size={20} />
            </span>
            <div>
              <h1
                style={{ fontFamily: 'var(--font-display)' }}
                className='text-base font-extrabold text-white'
              >
                Movies Hub Studio
              </h1>
              <span
                className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                  isSuper ? 'bg-brand text-black' : 'admin-status-emerald'
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

        {/* 3-Section Navigation Links with Smooth Expandable Dropdown Menus */}
        <div className='studio-scroll flex-1 space-y-5 overflow-y-auto px-3 py-4'>
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className='mb-2 px-3 text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase'>
                {group.title}
              </p>
              <hr className='mb-2 font-extrabold tracking-widest text-zinc-500' />
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
                        className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 ${
                          active
                            ? 'bg-linear-to-r from-brand to-amber-400 text-black shadow-md shadow-brand/20'
                            : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className='flex items-center gap-2.5 truncate'>
                          <Icon size={15} className='shrink-0' />
                          <span className='truncate'>{item.label}</span>
                        </span>
                        {item.badge !== undefined && item.badge !== null && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                              active
                                ? 'bg-black/20 text-black'
                                : 'bg-white/10 text-zinc-300'
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
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all duration-200 ${
                          active
                            ? 'bg-linear-to-r from-brand to-amber-400 text-black shadow-md shadow-brand/20'
                            : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className='flex min-w-0 items-center gap-2.5 truncate'>
                          <Icon size={15} className='shrink-0' />
                          <span className='truncate'>{item.label}</span>
                        </span>
                        <span className='flex shrink-0 items-center gap-1.5'>
                          {item.badge !== undefined && item.badge !== null && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                                active
                                  ? 'bg-black/20 text-black'
                                  : 'bg-white/10 text-zinc-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-300 ease-in-out ${
                              active ? 'text-black' : 'text-zinc-400'
                            } ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                          />
                        </span>
                      </button>

                      {/* Smooth Accordion Dropdown Sub-Items */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isExpanded
                            ? 'mt-1 grid-rows-[1fr] opacity-100'
                            : 'pointer-events-none grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className='overflow-hidden'>
                          <div
                            className={`ml-4 border-l border-white/10 pl-2.5 ${
                              item.compactDropdown
                                ? 'space-y-0.5 py-0.5'
                                : 'space-y-1 py-1'
                            }`}
                          >
                            {item.subItems.map((sub) => {
                              const SubIcon = sub.icon;
                              return (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center justify-between gap-2 rounded-lg px-2.5 font-semibold transition-all duration-150 ${
                                    item.compactDropdown
                                      ? 'py-1.5 text-[10.5px]'
                                      : 'py-2 text-[11px]'
                                  } ${
                                    sub.isActive
                                      ? 'border border-brand/35 bg-brand/15 font-extrabold text-brand'
                                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <span className='flex items-center gap-2 truncate'>
                                    {SubIcon && (
                                      <SubIcon
                                        size={12}
                                        className={
                                          sub.isActive
                                            ? 'shrink-0 text-brand'
                                            : 'shrink-0 text-zinc-500'
                                        }
                                      />
                                    )}
                                    <span className='truncate'>
                                      {sub.label}
                                    </span>
                                  </span>
                                  {sub.badge !== undefined &&
                                    sub.badge !== null && (
                                      <span
                                        className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold ${
                                          sub.isActive
                                            ? 'bg-brand text-black'
                                            : 'bg-white/10 text-zinc-400'
                                        }`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className='space-y-2 border-t border-white/10 p-3.5'>
          <Link to='/' className='admin-btn admin-btn-secondary w-full py-2.5'>
            <ArrowLeft size={14} /> Exit to User App
          </Link>
          <button
            type='button'
            onClick={onLogout}
            className='admin-btn admin-btn-danger w-full py-2.5'
          >
            <LogOut size={14} /> Sign Out ({user?.name?.split(' ')[0]})
          </button>
        </div>
      </aside>
    </>
  );
}
