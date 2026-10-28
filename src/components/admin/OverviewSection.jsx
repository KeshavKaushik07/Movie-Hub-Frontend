import { useState } from 'react';
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
  BarChart3,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { resolveOttMeta } from './adminHelpers';

export default function OverviewSection({ stats, isSuper }) {
  const [activeTab, setActiveTab] = useState('all');

  const c = stats?.counts || {};
  const crawler = stats?.crawler || {};
  const targetCap = crawler.targetCap || 100000;
  const totalTitles = c.titles || 0;
  const pct = Math.min(100, Math.round((totalTitles / targetCap) * 100));

  const kpis = [
    {
      label: 'Feature Films',
      value: c.movies || 0,
      sub: 'Theatrical & Catalog Movies',
      icon: Film,
      to: '/admin/catalog?type=movie',
      change: '+14.2%',
      color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/15',
    },
    {
      label: 'Web Series (OTT)',
      value: c.webSeries || 0,
      sub: `${c.tvShows || 0} total series & TV`,
      icon: Tv,
      to: '/admin/catalog?type=webseries',
      change: '+8.6%',
      color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-500/15',
    },
    {
      label: 'Featured Titles',
      value: c.featuredHeroCount || 0,
      sub: 'Active on Home Carousel',
      icon: Sparkles,
      to: '/admin/featured',
      change: 'Curated',
      color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/15',
    },
    {
      label: 'Active Users',
      value: Math.max(0, (c.users || 0) - (c.admins || 0)),
      sub: `${c.activeUsers || 0} active accounts`,
      icon: Users,
      to: '/admin/users',
      change: '+12.4%',
      color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15',
    },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto studio-scroll space-y-5 pr-1">
      {/* Top Banner (Aurex Inspired Big Headline Card) */}
      <div className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-brand/15 dark:text-brand">
                <Database size={15} />
              </span>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Catalog Overview
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1b2230] dark:text-white">
                {Number(totalTitles).toLocaleString('en-IN')}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>↑ {pct}% Indexed</span>
                <span className="text-zinc-400 font-normal">of {Number(targetCap).toLocaleString('en-IN')} cap</span>
              </span>
            </div>
            <p className="text-xs text-[#4a5262] dark:text-zinc-400 max-w-lg leading-normal">
              High-speed MongoDB cache-aside storage serving verified metadata, box office verdicts, OTT providers, and trailers with zero outbound TMDB latency.
            </p>
          </div>

          <div className="lg:col-span-5 bg-slate-50 dark:bg-[#151c2c] rounded-xl border border-[#d5d9e0] dark:border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">Catalog Progress</span>
              <span className="font-bold text-[#1b2230] dark:text-white">{pct}% Complete</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                style={{ width: `${Math.max(2, pct)}%` }}
                className="h-full rounded-full bg-linear-to-r from-[#2350d8] to-emerald-500 dark:from-brand dark:to-emerald-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-zinc-400 block">Enriched Details:</span>
                <strong className="text-[#1b2230] dark:text-white font-bold">
                  {(c.enrichedTitles || 0).toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Crawler Quota:</span>
                <strong className="text-[#1b2230] dark:text-white font-bold">
                  {Number(targetCap).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Aurex Inspired) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              to={k.to}
              className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-4 shadow-xs transition hover:border-[#2350d8] dark:hover:border-brand flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.color}`}>
                  <Icon size={17} />
                </span>
                <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400">
                  {k.change}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{k.label}</p>
                <p className="mt-0.5 text-2xl font-bold text-[#1b2230] dark:text-white">
                  {Number(k.value).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-[11px] text-zinc-400 truncate">{k.sub}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Breakdowns Row (Industry & OTT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cinema Industry Breakdown */}
        <div className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d5d9e0] dark:border-white/10 mb-4">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Catalog by Cinema Industry
              </h3>
              <Link to="/admin/catalog" className="text-xs font-bold text-[#2350d8] dark:text-brand hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {(stats?.byIndustry || []).slice(0, 6).map((item) => {
                const count = Number(item.count || 0);
                const sharePct = totalTitles > 0 ? Math.round((count / totalTitles) * 100) : 0;
                return (
                  <div key={item._id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#1b2230] dark:text-white capitalize">
                        {item._id || 'Global'}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        {count.toLocaleString('en-IN')} ({sharePct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(1, sharePct)}%` }}
                        className="h-full rounded-full bg-[#2350d8] dark:bg-brand"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* OTT Streaming Breakdown */}
        <div className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#d5d9e0] dark:border-white/10 mb-4">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Streaming Platform Availability
              </h3>
              <Link to="/admin/catalog" className="text-xs font-bold text-[#2350d8] dark:text-brand hover:underline">
                View Catalog →
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {(stats?.byOtt || []).slice(0, 10).map((item) => {
                const meta = resolveOttMeta(item._id);
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-50 dark:bg-[#151c2c] text-xs"
                  >
                    <span
                      style={{ backgroundColor: meta.badge }}
                      className="h-3 w-3 rounded-full shrink-0"
                    />
                    <span className="font-bold text-[#1b2230] dark:text-white">
                      {meta.label}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {Number(item.count || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Snapshot Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/community"
          className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-4 shadow-xs transition hover:border-[#2350d8] dark:hover:border-brand"
        >
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">
            <MessageSquare size={14} className="text-[#2350d8] dark:text-brand" />
            <span>Community Chat Rooms</span>
          </div>
          <p className="text-xl font-bold text-[#1b2230] dark:text-white">
            {c.communityRoomsCount || 0} Rooms
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {c.communityMessagesCount || 0} total posts (excluding replies)
          </p>
        </Link>

        <Link
          to="/admin/reviews?tab=critic"
          className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-4 shadow-xs transition hover:border-[#2350d8] dark:hover:border-brand"
        >
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">
            <Award size={14} className="text-amber-500" />
            <span>Reviews &amp; Ratings</span>
          </div>
          <p className="text-xl font-bold text-[#1b2230] dark:text-white">
            {(c.userReviews || 0) + (c.criticReviews || 0)} Reviews
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {c.criticReviews || 0} verified critic reviews
          </p>
        </Link>

        <Link
          to="/admin/blogs"
          className="rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-4 shadow-xs transition hover:border-[#2350d8] dark:hover:border-brand"
        >
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">
            <BookOpen size={14} className="text-emerald-500" />
            <span>Editorial Articles</span>
          </div>
          <p className="text-xl font-bold text-[#1b2230] dark:text-white">
            {c.blogsCount || 0} Blogs
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {c.blogCommentsCount || 0} blog comments
          </p>
        </Link>
      </div>
    </div>
  );
}
