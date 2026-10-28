import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit3,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Film,
  Flame,
  Tv,
  Database,
  X,
  CornerDownLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { getMovieFinancials } from '../../utils/formatters';
import SafeImage from '../ui/SafeImage';
import { resolveOttMeta } from './adminHelpers';

export const CATALOG_SORT_OPTIONS = [
  { value: 'updated', label: '🕒 Recently Updated', shortLabel: 'Updated' },
  { value: 'popularity', label: '🔥 Most Popular', shortLabel: 'Popular' },
  { value: 'trending', label: '⚡ Trending First', shortLabel: 'Trending' },
  { value: 'newest', label: '📅 Newest Releases', shortLabel: 'Newest' },
  { value: 'oldest', label: '🕰️ Oldest Releases', shortLabel: 'Oldest' },
  { value: 'rating', label: '⭐ Highest Rating', shortLabel: 'Top Rated' },
  { value: 'revenue', label: '💰 Highest Box Office', shortLabel: 'Box Office' },
  { value: 'budget', label: '💵 Highest Budget', shortLabel: 'Budget' },
  { value: 'title_asc', label: '🔤 Title (A → Z)', shortLabel: 'A–Z' },
];

const DISPLAY_LIMIT_PRESETS = [10, 20, 30, 50, 75, 100];

function CatalogPaginationBar({
  page,
  totalPages,
  totalItems,
  pageSize = 100,
  pageLoadedCount = 0,
  visibleLimit = 100,
  onChangeVisibleLimit,
  displayedCount = 0,
  loading = false,
  onPageChange,
  compact = false,
}) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.min(safeTotalPages, Math.max(1, Number(page) || 1));
  const [jumpInput, setJumpInput] = useState(String(safePage));
  const [limitInput, setLimitInput] = useState(String(visibleLimit || 100));

  useEffect(() => {
    setJumpInput(String(safePage));
  }, [safePage]);

  useEffect(() => {
    setLimitInput(String(visibleLimit || 100));
  }, [visibleLimit]);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput, 10);
    if (!Number.isFinite(parsed)) {
      setJumpInput(String(safePage));
      return;
    }
    const clamped = Math.min(safeTotalPages, Math.max(1, parsed));
    setJumpInput(String(clamped));
    if (clamped !== safePage && onPageChange) {
      onPageChange(clamped);
    }
  };

  const handleCustomLimitSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const parsed = parseInt(limitInput, 10);
    if (!Number.isFinite(parsed)) {
      setLimitInput(String(visibleLimit || 100));
      return;
    }
    const clamped = Math.min(pageSize, Math.max(1, parsed));
    setLimitInput(String(clamped));
    if (onChangeVisibleLimit) onChangeVisibleLimit(clamped);
  };

  // Build visible page numbers window around current page
  const pageNumbers = useMemo(() => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, safePage - delta);
    const right = Math.min(safeTotalPages, safePage + delta);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push('ellipsis-left');
    }
    for (let i = left; i <= right; i += 1) {
      pages.push(i);
    }
    if (right < safeTotalPages) {
      if (right < safeTotalPages - 1) pages.push('ellipsis-right');
      pages.push(safeTotalPages);
    }
    return pages;
  }, [safePage, safeTotalPages]);

  const pageCapacity = pageLoadedCount > 0 ? pageLoadedCount : pageSize;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-[#0e131f] px-3.5 shadow-lg ${
        compact ? 'py-2' : 'py-2.5'
      }`}
    >
      {/* Left: Page Badge + "Showing X out of 100 data on Page Y" */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        <span className="rounded-lg bg-brand/15 px-2.5 py-1 font-extrabold text-brand">
          Page {safePage.toLocaleString('en-IN')} / {safeTotalPages.toLocaleString('en-IN')}
        </span>
        <span className="text-[11px] sm:text-xs">
          Showing{' '}
          <b className="text-brand">{displayedCount.toLocaleString('en-IN')}</b> out of{' '}
          <b className="text-white">{pageCapacity.toLocaleString('en-IN')}</b> data on Page{' '}
          <b className="text-white">{safePage}</b>{' '}
          <span className="hidden text-zinc-500 xl:inline">
            (Total DB: {(totalItems || pageLoadedCount).toLocaleString('en-IN')})
          </span>
        </span>
      </div>

      {/* Center-Left: SuperAdmin Visible Data Limit Controller (e.g. 20/100 on Page 1, 30/100 on Page 4) */}
      {onChangeVisibleLimit && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-brand/25 bg-[#070a10] px-2.5 py-1">
          <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-wider text-brand uppercase">
            <SlidersHorizontal size={11} /> Show:
          </span>
          <div className="flex items-center gap-1">
            {DISPLAY_LIMIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeVisibleLimit(preset)}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold transition ${
                  Number(visibleLimit) === preset
                    ? 'bg-brand text-black shadow-xs'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
                title={`Show ${preset} out of ${pageSize} data items on Page ${safePage}`}
              >
                {preset}
              </button>
            ))}
          </div>
          <form onSubmit={handleCustomLimitSubmit} className="flex items-center gap-1 pl-1">
            <input
              type="number"
              min={1}
              max={pageSize}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              onBlur={handleCustomLimitSubmit}
              title="Enter custom number of items (1–100) to display on this page"
              className="h-6 w-12 rounded-md border border-white/15 bg-white/5 px-1.5 text-center text-[11px] font-extrabold text-white focus:border-brand focus:outline-none"
            />
            <span className="text-[10px] font-bold text-zinc-500">/{pageSize}</span>
          </form>
        </div>
      )}

      {/* Center-Right: Page Number Buttons */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1 || loading}
          onClick={() => onPageChange(1)}
          title="First Page"
          className="admin-btn admin-btn-secondary admin-btn-sm px-2 disabled:opacity-35"
        >
          <ChevronsLeft size={12} />
        </button>
        <button
          type="button"
          disabled={safePage <= 1 || loading}
          onClick={() => onPageChange(safePage - 1)}
          className="admin-btn admin-btn-secondary admin-btn-sm px-2 disabled:opacity-35"
        >
          <ChevronLeft size={12} /> Prev
        </button>

        {pageNumbers.map((item) =>
          typeof item === 'string' ? (
            <span key={item} className="px-1 text-xs font-bold text-zinc-500">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(item)}
              className={`min-w-7 rounded-lg px-2 py-1 text-[11px] font-extrabold transition ${
                item === safePage
                  ? 'bg-brand text-black shadow-sm shadow-brand/25'
                  : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-brand/40 hover:text-white'
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={safePage >= safeTotalPages || loading}
          onClick={() => onPageChange(safePage + 1)}
          className="admin-btn admin-btn-secondary admin-btn-sm px-2 disabled:opacity-35"
        >
          Next <ChevronRight size={12} />
        </button>
        <button
          type="button"
          disabled={safePage >= safeTotalPages || loading}
          onClick={() => onPageChange(safeTotalPages)}
          title="Last Page"
          className="admin-btn admin-btn-secondary admin-btn-sm px-2 disabled:opacity-35"
        >
          <ChevronsRight size={12} />
        </button>
      </div>

      {/* Right: Direct Page Jump Input Bar */}
      <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
        <label className="text-[10px] font-bold whitespace-nowrap text-zinc-400">
          Page:
        </label>
        <input
          type="number"
          min={1}
          max={safeTotalPages}
          value={jumpInput}
          onChange={(e) => setJumpInput(e.target.value)}
          placeholder={String(safePage)}
          className="h-7 w-14 rounded-lg border border-white/15 bg-[#070a10] px-2 text-center text-xs font-extrabold text-white focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="admin-btn admin-btn-primary admin-btn-sm h-7 px-2.5"
          title="Jump directly to this page"
        >
          Go <CornerDownLeft size={10} />
        </button>
      </form>
    </div>
  );
}

export default function CatalogSection({
  dbTitles,
  featuredItems,
  region,
  titleQuery,
  setTitleQuery,
  titleTypeFilter,
  onChangeTypeFilter,
  catalogSort = 'updated',
  onChangeSort,
  catalogPage = 1,
  catalogTotalPages = 1,
  catalogTotalItems = 0,
  catalogPageSize = 100,
  catalogVisibleLimit = 100,
  onChangeVisibleLimit,
  catalogLoading = false,
  onPageChange,
  onSearchCatalog,
  onCreateNewTitle,
  onEditTitle,
  onSyncTitle,
  onDeleteTitle,
  onQuickAddToFeatured,
}) {
  const featuredSet = new Set(
    (featuredItems || []).map((f) => `${f.type || 'movie'}:${f.id}`),
  );

  // Instant client-side sort & type filter safeguard
  const sortedAndFilteredTitles = useMemo(() => {
    const list = Array.isArray(dbTitles) ? [...dbTitles] : [];

    const filtered = list.filter((t) => {
      if (!titleTypeFilter) return true;
      const isWeb =
        t.subType === 'webseries' || t.isWebSeries === true || t.type === 'webseries';
      if (titleTypeFilter === 'movie') {
        return (t.type === 'movie' || t.mediaType === 'movie') && !isWeb;
      }
      if (titleTypeFilter === 'webseries') {
        return isWeb;
      }
      if (titleTypeFilter === 'tv') {
        return (t.type === 'tv' || t.mediaType === 'tv') && !isWeb;
      }
      return true;
    });

    const getNumericRevenue = (item) =>
      Number(item.revenue) ||
      Number(item.boxOffice?.worldwideCollection) ||
      Number(item.boxOffice?.indiaGrossCollection) ||
      0;

    const getNumericBudget = (item) => Number(item.budget) || 0;

    const getReleaseTimestamp = (item) => {
      if (item.releaseDate) {
        const ts = new Date(item.releaseDate).getTime();
        if (Number.isFinite(ts)) return ts;
      }
      if (item.year) return new Date(`${item.year}-01-01`).getTime();
      return 0;
    };

    filtered.sort((a, b) => {
      switch (catalogSort) {
        case 'popularity':
          return (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
        case 'trending': {
          const aTrend = a.isTrending || (a.listTags || []).includes('trending') ? 1 : 0;
          const bTrend = b.isTrending || (b.listTags || []).includes('trending') ? 1 : 0;
          if (bTrend !== aTrend) return bTrend - aTrend;
          return (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
        }
        case 'newest':
          return (
            (Number(b.year) || 0) - (Number(a.year) || 0) ||
            getReleaseTimestamp(b) - getReleaseTimestamp(a)
          );
        case 'oldest': {
          const aYear = Number(a.year) || 9999;
          const bYear = Number(b.year) || 9999;
          return aYear - bYear || getReleaseTimestamp(a) - getReleaseTimestamp(b);
        }
        case 'rating':
          return (
            (Number(b.voteAverage ?? b.rating) || 0) -
              (Number(a.voteAverage ?? a.rating) || 0) ||
            (Number(b.popularity) || 0) - (Number(a.popularity) || 0)
          );
        case 'revenue':
          return getNumericRevenue(b) - getNumericRevenue(a);
        case 'budget':
          return getNumericBudget(b) - getNumericBudget(a);
        case 'title_asc':
          return String(a.title || '').localeCompare(String(b.title || ''));
        case 'updated':
        default: {
          const aUp = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bUp = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bUp - aUp || (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
        }
      }
    });

    return filtered;
  }, [dbTitles, titleTypeFilter, catalogSort]);

  // Slice visible titles on current page according to SuperAdmin's `catalogVisibleLimit` (e.g. 20 or 30 out of 100)
  const safeVisibleLimit = Math.min(
    catalogPageSize,
    Math.max(1, Number(catalogVisibleLimit) || catalogPageSize),
  );
  const displayedTitles = useMemo(
    () => sortedAndFilteredTitles.slice(0, safeVisibleLimit),
    [sortedAndFilteredTitles, safeVisibleLimit],
  );

  return (
    <div id="admin-catalog-top" className="space-y-4">
      {/* ==================== FROZEN INNER BARS (FILTER + SORT + PAGINATION/LIMIT) ==================== */}
      <div className="admin-sticky-bar space-y-2.5">
        {/* 1. Filter by Media Type Selection Tabs + Search + Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-[#0e131f] p-3 shadow-lg">
          {/* Media Type Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070a10] p-1">
            {[
              { value: '', label: 'All Media', icon: Database },
              { value: 'movie', label: 'Movies', icon: Film },
              { value: 'webseries', label: 'Web Series', icon: Flame },
              { value: 'tv', label: 'TV Shows', icon: Tv },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = titleTypeFilter === tab.value;
              return (
                <button
                  key={tab.value || 'all'}
                  type="button"
                  onClick={() => onChangeTypeFilter(tab.value)}
                  className={`admin-btn admin-btn-sm ${
                    active
                      ? 'admin-btn-primary'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selection Pills */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#070a10] px-2 py-1">
            <span className="mr-1 flex items-center gap-1 text-[10px] font-extrabold text-brand uppercase">
              <ArrowUpDown size={11} /> Sort:
            </span>
            {CATALOG_SORT_OPTIONS.map((opt) => {
              const active = catalogSort === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeSort(opt.value)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                    active
                      ? 'bg-brand font-extrabold text-black shadow-xs'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Search Input + Add Custom Title */}
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchCatalog(1);
              }}
              className="flex min-w-52 flex-1 items-center gap-1.5 sm:max-w-xs"
            >
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  placeholder="Search title or TMDB ID..."
                  className="h-8 w-full rounded-xl border border-white/10 bg-[#070a10] pr-7 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                />
                {titleQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleQuery('');
                      onSearchCatalog(1, { q: '' });
                    }}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm h-8">
                Search
              </button>
            </form>

            <button
              type="button"
              onClick={onCreateNewTitle}
              className="admin-btn admin-btn-emerald admin-btn-sm h-8"
            >
              <Plus size={13} /> Add Title
            </button>
          </div>
        </div>

        {/* 2. Top Pagination + SuperAdmin "Show X out of 100" Limit Bar */}
        <CatalogPaginationBar
          compact
          page={catalogPage}
          totalPages={catalogTotalPages}
          totalItems={catalogTotalItems}
          pageSize={catalogPageSize}
          pageLoadedCount={sortedAndFilteredTitles.length}
          visibleLimit={safeVisibleLimit}
          onChangeVisibleLimit={onChangeVisibleLimit}
          displayedCount={displayedTitles.length}
          loading={catalogLoading}
          onPageChange={onPageChange}
        />
      </div>

      {/* ==================== FIXED-STRUCTURE MEDIA & BOX OFFICE TABLE ==================== */}
      <div
        className={`admin-table-wrap transition-opacity duration-200 ${
          catalogLoading ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <table className="admin-table admin-table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-56" />
            <col className="w-24" />
            <col className="w-14" />
            <col className="w-24" />
            <col className="w-40" />
            <col className="w-36" />
            <col className="w-28" />
            <col className="w-44" />
          </colgroup>
          <thead>
            <tr>
              <th>#</th>
              <th>Movie / Series</th>
              <th>Type</th>
              <th>Year</th>
              <th>Rating / Pop</th>
              <th>Budget / Box Office ({region === 'IN' ? '₹' : '$'})</th>
              <th>OTT Platforms</th>
              <th>Featured</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedTitles.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs text-zinc-400">
                  <Database size={22} className="mx-auto mb-2 text-brand" />
                  No titles matched your current filter or search query.
                </td>
              </tr>
            ) : (
              displayedTitles.map((t, idx) => {
                const rowNumber = (catalogPage - 1) * catalogPageSize + idx + 1;
                const fin = getMovieFinancials(t, region);
                const ottList = Array.isArray(t.ottProviders) ? t.ottProviders : [];
                const isAlreadyFeatured =
                  featuredSet.has(`${t.type || 'movie'}:${t.id}`) ||
                  featuredSet.has(`tv:${t.id}`) ||
                  featuredSet.has(`movie:${t.id}`);
                const displayType =
                  t.subType === 'webseries' || t.isWebSeries
                    ? 'webseries'
                    : t.subType || t.type || 'movie';
                const allOttNames = ottList
                  .map((k) => resolveOttMeta(k).label)
                  .join(', ');

                return (
                  <tr key={`${t.type}-${t.id}`}>
                    {/* 1. Row Index */}
                    <td className="whitespace-nowrap font-mono text-[11px] font-bold text-zinc-500">
                      {rowNumber}
                    </td>

                    {/* 2. Movie Poster + Strictly Truncated Name */}
                    <td className="overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                        <SafeImage
                          src={t.posterUrl || t.backdropUrl}
                          alt={t.title}
                          size="w185"
                          className="h-11 w-7.5 shrink-0 rounded-md border border-white/10 object-cover shadow"
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            className="truncate text-xs font-extrabold text-white"
                            title={t.title}
                          >
                            {t.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-[10px] text-zinc-400">
                            <span className="shrink-0 font-mono">#{t.id}</span>
                            {(t.isTrending ||
                              (t.listTags || []).includes('trending')) && (
                              <span className="shrink-0 rounded bg-brand/20 px-1 py-0.2 text-[8px] font-black text-brand uppercase">
                                Hot
                              </span>
                            )}
                            {t.lockedFields?.length > 0 && (
                              <span className="shrink-0 rounded bg-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-300">
                                Edited
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Type */}
                    <td className="whitespace-nowrap">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          displayType === 'webseries'
                            ? 'bg-amber-500/20 text-amber-300'
                            : displayType === 'tv'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {displayType === 'webseries'
                          ? 'Series'
                          : displayType === 'tv'
                            ? 'TV Show'
                            : 'Movie'}
                      </span>
                    </td>

                    {/* 4. Year */}
                    <td className="whitespace-nowrap font-semibold text-zinc-300">
                      {t.year || '—'}
                    </td>

                    {/* 5. Rating & Popularity */}
                    <td className="whitespace-nowrap">
                      <div className="leading-tight">
                        <span className="font-extrabold text-brand">
                          ★ {Number(t.voteAverage ?? t.rating ?? 0).toFixed(1)}
                        </span>
                        <p className="truncate text-[10px] text-zinc-400">
                          Pop: {Math.round(Number(t.popularity) || 0)}
                        </p>
                      </div>
                    </td>

                    {/* 6. Budget / Box Office (Strictly Constrained) */}
                    <td className="overflow-hidden whitespace-nowrap">
                      <div
                        className="min-w-0 overflow-hidden leading-tight"
                        title={`Budget: ${fin.budgetText} | Worldwide/Gross: ${fin.revenueText}${
                          fin.verdict ? ` (${fin.verdict})` : ''
                        }`}
                      >
                        <p className="truncate text-[11px]">
                          <span className="font-bold text-brand">{fin.budgetText}</span>
                          <span className="mx-1 text-zinc-500">/</span>
                          <span className="font-extrabold text-emerald-400">
                            {fin.revenueText}
                          </span>
                        </p>
                        {fin.verdict && fin.verdict !== 'TBA' && (
                          <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-400">
                            {fin.verdict}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 7. OTT Platforms (Compact Max 2 Pills + Counter so it never breaks layout) */}
                    <td className="overflow-hidden">
                      {ottList.length === 0 ? (
                        <span className="text-[11px] text-zinc-500">Theatrical</span>
                      ) : (
                        <div
                          className="flex items-center gap-1 overflow-hidden"
                          title={allOttNames}
                        >
                          {ottList.slice(0, 2).map((ottKey) => {
                            const meta = resolveOttMeta(ottKey);
                            return (
                              <span
                                key={ottKey}
                                style={{ backgroundColor: meta.badge }}
                                className="keep-white inline-block max-w-16 truncate rounded-md px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-2xs"
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                          {ottList.length > 2 && (
                            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-extrabold text-zinc-300">
                              +{ottList.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 8. Featured Carousel */}
                    <td className="whitespace-nowrap">
                      {isAlreadyFeatured ? (
                        <span className="admin-status-badge admin-status-emerald px-2 py-0.5 text-[10px]">
                          <Check size={11} /> Featured
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onQuickAddToFeatured(t)}
                          className="admin-btn admin-btn-amber admin-btn-sm"
                          title="Add this title directly to the Home Featured Hero Carousel"
                        >
                          <Sparkles size={11} /> + Hero
                        </button>
                      )}
                    </td>

                    {/* 9. Actions: Edit, Sync, Delete */}
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTitle(t)}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          title="Edit Title & Box Office"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onSyncTitle(t)}
                          title="Reset manual edits and pull fresh official data from TMDB"
                          className="admin-btn admin-btn-sky admin-btn-sm"
                        >
                          <RefreshCw size={11} /> Sync
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTitle(t)}
                          title="Delete Title from Database"
                          className="admin-btn admin-btn-danger admin-btn-sm px-2"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== BOTTOM PAGINATION & DISPLAY LIMIT BAR ==================== */}
      <CatalogPaginationBar
        page={catalogPage}
        totalPages={catalogTotalPages}
        totalItems={catalogTotalItems}
        pageSize={catalogPageSize}
        pageLoadedCount={sortedAndFilteredTitles.length}
        visibleLimit={safeVisibleLimit}
        onChangeVisibleLimit={onChangeVisibleLimit}
        displayedCount={displayedTitles.length}
        loading={catalogLoading}
        onPageChange={(nextPage) => {
          onPageChange(nextPage);
          const scroller = document.getElementById('admin-main-scroll');
          if (scroller) {
            scroller.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            const el = document.getElementById('admin-catalog-top');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />
    </div>
  );
}
