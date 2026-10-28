import { Menu, Sun, Moon, RefreshCw } from 'lucide-react';

const SECTION_META = {
  overview: {
    title: 'Overview',
    subtitle:
      'Live catalog health, user activity, box office coverage & crawler metrics',
  },
  featured: {
    title: 'Featured Titles',
    subtitle: 'Curate spotlight movies & series for the Home Featured Carousel',
  },
  blogs: {
    title: 'Blog Studio & Editorial CMS',
    subtitle:
      'Auto-fetch movie stills and publish rich film essays & box office reports',
  },
  community: {
    title: 'Community Lounges',
    subtitle:
      'Manage official community rooms, symbols, members, Room Admins & moderation blocks',
  },
  reviews: {
    title: 'Critics & Moderation',
    subtitle:
      'Moderate verified critic reviews, audience reviews, and user comments',
  },
  users: {
    title: 'User Management',
    subtitle:
      'Manage registered user accounts, status filters, password reset & suspension',
  },
  staff: {
    title: 'Staff Management',
    subtitle: 'Provision and manage Admin moderators and Super Admin accounts',
  },
  catalog: {
    title: 'Media & Box Office Database',
    subtitle:
      'Filter Movies, Web Series & TV Shows, edit trade verdicts & collections',
  },
  crawler: {
    title: '1-Lakh Crawler Engine',
    subtitle: 'Quota-balanced, year-interleaved TMDB ingestion engine',
  },
  'api-keys': {
    title: 'API Keys',
    subtitle:
      'AES-256-GCM encrypted TMDB key rotation pool with automatic rate-limit failover',
  },
  settings: {
    title: 'Admin Settings',
    subtitle: 'Manage personal profile details and account password',
  },
};

export default function AdminTopbar({
  activeSection,
  user,
  theme,
  toast,
  onOpenSidebar,
  onToggleTheme,
  onRefreshActiveSection,
}) {
  const meta = SECTION_META[activeSection] || {
    title: activeSection.replace('-', ' '),
    subtitle: 'Movies Hub Administration Console',
  };

  return (
    <header className='sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#d5d9e0] dark:border-white/10 bg-white/95 dark:bg-[#070a10]/95 px-4 py-2.5 backdrop-blur-xl sm:px-6 shrink-0'>
      <div className='flex min-w-0 items-center gap-3'>
        <button
          type='button'
          onClick={onOpenSidebar}
          className='admin-btn admin-btn-secondary admin-btn-icon lg:hidden'
          aria-label='Open Studio Menu'
        >
          <Menu size={16} />
        </button>
        <div className='min-w-0'>
          <h2 className='truncate text-base sm:text-lg font-bold text-[#1b2230] dark:text-white leading-tight'>
            {meta.title}
          </h2>
          <p className='truncate text-[11px] text-[#4a5262] dark:text-zinc-400'>
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {toast && (
          <span className='admin-status-badge admin-status-emerald hidden sm:inline-flex text-[11px]'>
            {toast}
          </span>
        )}

        <button
          type='button'
          onClick={onRefreshActiveSection}
          title='Refresh current section data'
          className='admin-btn admin-btn-secondary'
        >
          <RefreshCw size={13} />
          <span className='hidden sm:inline'>Refresh</span>
        </button>

        <button
          type='button'
          onClick={onToggleTheme}
          title={
            theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
          }
          className='admin-btn admin-btn-secondary admin-btn-icon'
        >
          {theme === 'dark' ? (
            <Sun size={15} className='text-amber-500 dark:text-brand' />
          ) : (
            <Moon size={15} />
          )}
        </button>

        <div className='hidden items-center gap-2 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-1 md:flex'>
          <span
            style={{ backgroundColor: user?.avatarColor || '#2350d8' }}
            className='flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black text-white keep-white'
          >
            {(user?.name || 'A')[0].toUpperCase()}
          </span>
          <div className='leading-tight'>
            <p className='text-[11px] font-bold text-[#1b2230] dark:text-white'>
              {user?.name}
            </p>
            <p className='text-[9px] font-semibold text-blue-600 dark:text-brand uppercase'>
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
