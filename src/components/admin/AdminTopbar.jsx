import { Menu, Sun, Moon, RefreshCw } from 'lucide-react';

const SECTION_META = {
  overview: {
    title: 'Analytics & Studio Overview',
    subtitle: 'Live catalog health, user activity, box office coverage & crawler metrics',
  },
  featured: {
    title: 'Featured Hero Carousel Manager',
    subtitle: 'Curate and reorder spotlight movies & web series on the Home Hero banner',
  },
  blogs: {
    title: 'Editorial Blog Studio & CMS',
    subtitle: 'Auto-fetch movie stills and publish rich film essays & box office reports',
  },
  community: {
    title: 'Community & Chat Rooms Directory',
    subtitle: 'Create official topic lounges, inspect room creators & moderate chat status',
  },
  reviews: {
    title: 'Critics & Audience Moderation',
    subtitle: 'Click any critic or review row to inspect, edit, feature, hide, or delete',
  },
  users: {
    title: 'Users & Staff Role Directory',
    subtitle: 'Manage regular users and administrators with role filters, password reset & suspension',
  },
  catalog: {
    title: 'Media & Box Office Database',
    subtitle: 'Edit budgets, ₹ Crore collections, OTT streaming badges & promote to Featured Carousel',
  },
  crawler: {
    title: '1-Lakh Crawler Engine',
    subtitle: 'Quota-balanced, year-interleaved TMDB ingestion engine',
  },
  'api-keys': {
    title: 'Encrypted TMDB API Key Pool',
    subtitle: 'AES-256-GCM encrypted key rotation pool with automatic rate-limit failover',
  },
};

export default function AdminTopbar({
  activeSection,
  user,
  region,
  theme,
  toast,
  onOpenSidebar,
  onToggleRegion,
  onToggleTheme,
  onRefreshActiveSection,
}) {
  const meta = SECTION_META[activeSection] || {
    title: activeSection.replace('-', ' '),
    subtitle: 'Movies Hub Administration Console',
  };

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#070a10]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="admin-btn admin-btn-secondary admin-btn-icon admin-mobile-only lg:hidden"
          aria-label="Open Studio Menu"
        >
          <Menu size={17} />
        </button>
        <div className="min-w-0">
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="truncate text-base font-extrabold text-white sm:text-lg"
          >
            {meta.title}
          </h2>
          <p className="truncate text-[11px] text-zinc-400">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {toast && (
          <span className="admin-status-badge admin-status-emerald hidden sm:inline-flex">
            {toast}
          </span>
        )}

        <button
          type="button"
          onClick={onRefreshActiveSection}
          title="Refresh current section data"
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          type="button"
          onClick={onToggleRegion}
          title="Switch display currency between Indian Rupees (₹ Crore) and US Dollars ($)"
          className="admin-btn admin-btn-secondary"
        >
          {region === 'IN' ? '🇮🇳 ₹ INR' : '🌍 $ USD'}
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="admin-btn admin-btn-secondary admin-btn-icon"
        >
          {theme === 'dark' ? <Sun size={15} className="text-brand" /> : <Moon size={15} />}
        </button>

        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 md:flex">
          <span
            style={{ backgroundColor: user?.avatarColor || '#f5b942' }}
            className="keep-white flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white"
          >
            {(user?.name || 'A')[0].toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-extrabold text-white">{user?.name}</p>
            <p className="text-[9px] font-bold tracking-wider text-brand uppercase">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
