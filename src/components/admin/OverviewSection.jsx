import { Link } from 'react-router-dom';
import {
  Film,
  Tv,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  Users,
  Database,
  ArrowUpRight,
  Cpu,
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { formatAdminDate } from './adminHelpers';

export default function OverviewSection({ stats, isSuper }) {
  const c = stats?.counts || {};
  const crawler = stats?.crawler || {};
  const pct = Math.min(
    100,
    Math.round(((c.titles || 0) / (crawler.targetCap || 100000)) * 100),
  );

  const kpis = [
    {
      label: 'Total Catalog',
      value: c.titles || 0,
      sub: `${c.enrichedTitles || 0} full details cached`,
      icon: Database,
      to: isSuper ? '/admin/catalog' : '/browse/movies',
      accent: 'text-brand bg-brand/15',
    },
    {
      label: 'Movies',
      value: c.movies || 0,
      sub: 'Feature Films',
      icon: Film,
      to: isSuper ? '/admin/catalog' : '/browse/movies',
      accent: 'text-sky-400 bg-sky-500/15',
    },
    {
      label: 'Web Series (OTT)',
      value: c.webSeries || 0,
      sub: `${c.tvShows || 0} total TV & series`,
      icon: Tv,
      to: '/browse/web-series',
      accent: 'text-purple-400 bg-purple-500/15',
    },
    {
      label: 'Featured Hero Slides',
      value: c.featuredHeroCount || 0,
      sub: 'Active on Home Carousel',
      icon: Sparkles,
      to: '/admin/featured',
      accent: 'text-amber-400 bg-amber-500/15',
    },
    {
      label: 'Published Blogs',
      value: c.blogsCount || 0,
      sub: `${c.blogCommentsCount || 0} article comments`,
      icon: BookOpen,
      to: '/admin/blogs',
      accent: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      label: 'Community Rooms',
      value: c.communityRoomsCount || 0,
      sub: `${c.communityMessagesCount || 0} live chat posts`,
      icon: MessageSquare,
      to: '/admin/community',
      accent: 'text-pink-400 bg-pink-500/15',
    },
    {
      label: 'Reviews & Critics',
      value: (c.userReviews || 0) + (c.criticReviews || 0),
      sub: `${c.criticReviews || 0} critic • ${c.userReviews || 0} user`,
      icon: Award,
      to: '/admin/reviews',
      accent: 'text-orange-400 bg-orange-500/15',
    },
    {
      label: 'Registered Users',
      value: c.users || 0,
      sub: `${c.activeUsers || 0} active • ${c.admins || 0} staff`,
      icon: Users,
      to: '/admin/users',
      accent: 'text-teal-400 bg-teal-500/15',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              to={k.to}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-4 shadow-lg transition hover:-translate-y-0.5 hover:border-brand/50"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.accent}`}>
                  <Icon size={17} />
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-zinc-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"
                />
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-zinc-400">{k.label}</p>
                <p className="mt-0.5 text-2xl font-extrabold text-white">
                  {Number(k.value).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 truncate text-[10px] text-zinc-400">{k.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 1-Lakh Crawler Progress Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#0e131f] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Cpu size={19} />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                1,00,000 Catalog Ingestion Progress ({pct}%)
              </h3>
              <p className="text-xs text-zinc-400">
                {Number(c.titles || 0).toLocaleString('en-IN')} of{' '}
                {Number(crawler.targetCap || 100000).toLocaleString('en-IN')} titles indexed in MongoDB
              </p>
            </div>
          </div>
          {isSuper && (
            <Link to="/admin/crawler" className="admin-btn admin-btn-primary">
              Manage Crawler Quotas
            </Link>
          )}
        </div>
        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            style={{ width: `${Math.max(2, pct)}%` }}
            className="h-full rounded-full bg-linear-to-r from-brand to-emerald-400 transition-all duration-500"
          />
        </div>
      </div>

      {/* Two Compact Overview Tables: Top Reviewed Titles & Recent Users */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top Reviewed Titles */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Top Reviewed Movies & Series</h3>
            <Link to="/admin/reviews" className="text-xs font-bold text-brand hover:underline">
              Moderate Reviews →
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Movie / Series</th>
                  <th>Type</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.topReviewed || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-zinc-400">
                      No reviewed titles yet.
                    </td>
                  </tr>
                ) : (
                  (stats?.topReviewed || []).slice(0, 6).map((t) => (
                    <tr key={`${t.mediaType}-${t.tmdbId}`}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <SafeImage
                            src={t.posterPath}
                            alt={t.title}
                            size="w185"
                            className="h-10 w-7 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{t.title}</p>
                            <p className="text-[10px] text-zinc-400">{t.year || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                          {t.subType || t.mediaType}
                        </span>
                      </td>
                      <td className="font-extrabold text-brand">
                        ★ {Number(t.siteRating || 0).toFixed(1)}
                      </td>
                      <td className="text-zinc-300">{t.siteReviewCount || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Joined Users */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Recently Joined Accounts</h3>
            <Link to="/admin/users" className="text-xs font-bold text-brand hover:underline">
              All Users & Staff →
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentUsers || []).slice(0, 6).map((u) => (
                  <tr key={u.id || u._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span
                          style={{ backgroundColor: u.avatarColor || '#f5b942' }}
                          className="keep-white flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                        >
                          {(u.name || 'U')[0].toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{u.name}</p>
                          <p className="truncate text-[10px] text-zinc-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-zinc-400">
                      {formatAdminDate(u.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`admin-status-badge ${
                          u.isActive !== false ? 'admin-status-emerald' : 'admin-status-rose'
                        }`}
                      >
                        {u.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
