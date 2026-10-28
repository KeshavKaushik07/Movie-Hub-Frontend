import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Database,
  Cpu,
  KeyRound,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  ArrowLeft,
  LogOut,
  X,
  Shield,
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
  const c = stats?.counts || {};

  const featuredBadge =
    liveCounts.featured !== undefined ? liveCounts.featured : c.featuredHeroCount;
  const blogsBadge =
    liveCounts.blogs !== undefined ? liveCounts.blogs : c.blogsCount;
  const communityBadge =
    liveCounts.community !== undefined ? liveCounts.community : c.communityRoomsCount;
  const reviewsBadge =
    liveCounts.reviews !== undefined ? liveCounts.reviews : c.reviews;
  const usersBadge =
    liveCounts.users !== undefined ? liveCounts.users : c.users;
  const rawTitlesTotal =
    liveCounts.titles !== undefined ? liveCounts.titles : c.titles;
  const titlesBadge =
    rawTitlesTotal !== undefined && rawTitlesTotal !== null
      ? rawTitlesTotal >= 1000
        ? `${Math.round((rawTitlesTotal / 1000) * 10) / 10}k`
        : rawTitlesTotal
      : undefined;

  const navGroups = [
    {
      title: 'Management Studio',
      items: [
        {
          key: 'overview',
          to: '/admin',
          label: 'Analytics Overview',
          icon: LayoutDashboard,
        },
        {
          key: 'featured',
          to: '/admin/featured',
          label: 'Featured Hero Carousel',
          icon: Sparkles,
          badge: featuredBadge,
        },
        {
          key: 'blogs',
          to: '/admin/blogs',
          label: 'Blog Studio & Editor',
          icon: BookOpen,
          badge: blogsBadge,
        },
        {
          key: 'community',
          to: '/admin/community',
          label: 'Community & Chat Rooms',
          icon: MessageSquare,
          badge: communityBadge,
        },
        {
          key: 'reviews',
          to: '/admin/reviews',
          label: 'Critics & Moderation',
          icon: Award,
          badge: reviewsBadge,
        },
        {
          key: 'users',
          to: '/admin/users',
          label: isSuper ? 'Users & Staff Roles' : 'User Management',
          icon: Users,
          badge: usersBadge,
        },
      ],
    },
    ...(isSuper
      ? [
          {
            title: 'SuperAdmin Exclusive',
            items: [
              {
                key: 'catalog',
                to: '/admin/catalog',
                label: 'Media & Box Office DB',
                icon: Database,
                badge: titlesBadge,
              },
              {
                key: 'crawler',
                to: '/admin/crawler',
                label: '1-Lakh Crawler Engine',
                icon: Cpu,
              },
              {
                key: 'api-keys',
                to: '/admin/api-keys',
                label: 'TMDB API Key Pool',
                icon: KeyRound,
                badge: liveCounts.apiKeys,
              },
            ],
          },
        ]
      : []),
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
        className={`fixed inset-y-0 left-0 z-50 flex w-68 shrink-0 flex-col border-r border-white/10 bg-[#0e131f] transition-transform duration-300 lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:translate-x-0 ${
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

        {/* Navigation Links */}
        <div className='studio-scroll flex-1 space-y-5 overflow-y-auto px-3 py-4'>
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className='mb-2 px-3 text-[10px] font-extrabold tracking-widest text-zinc-500 uppercase'>
                {group.title}
              </p>
              <div className='space-y-1'>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.key;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
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
