import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  ExternalLink,
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
} from 'lucide-react';
import { getMovieFinancials, getTitlePath } from '../../utils/formatters';
import SafeImage from '../ui/SafeImage';
import { resolveOttMeta, formatAdminDateTime } from './adminHelpers';

export const CATALOG_SORT_OPTIONS = [
  { value: 'updated', label: '🕒 Recently Updated', shortLabel: 'Updated' },
  { value: 'popularity', label: '🔥 Most Popular', shortLabel: 'Popular' },
  { value: 'trending', label: '⚡ Trending First', shortLabel: 'Trending' },
  { value: 'newest', label: '📅 Newest Releases', shortLabel: 'Newest' },
  { value: 'oldest', label: '🕰️ Oldest Releases', shortLabel: 'Oldest' },
  { value: 'rating', label: '⭐ Highest Rating', shortLabel: 'Top Rated' },
  {
    value: 'revenue',
    label: '💰 Highest Box Office',
    shortLabel: 'Box Office',
  },
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

  const handleLimitSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(limitInput, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLimitInput(String(visibleLimit));
      return;
    }
    const clamped = Math.min(pageSize, Math.max(1, parsed));
    setLimitInput(String(clamped));
    if (onChangeVisibleLimit) onChangeVisibleLimit(clamped);
  };

  const fromIndex = totalItems ? (safePage - 1) * pageSize + 1 : 0;
  const toIndex = Math.min(
    totalItems || 0,
    (safePage - 1) * pageSize + displayedCount,
  );

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 text-xs'>
      {/* Items Range & Loaded Count */}
      <div className='flex flex-wrap items-center gap-2 text-zinc-500 dark:text-zinc-400'>
        <span>
          Showing{' '}
          <strong className='text-[#1b2230] dark:text-white font-bold'>
            {fromIndex}–{toIndex}
          </strong>{' '}
          of{' '}
          <strong className='text-[#1b2230] dark:text-white font-bold'>
            {(totalItems || 0).toLocaleString()}
          </strong>{' '}
          titles
        </span>
        {displayedCount < pageLoadedCount && (
          <span className='rounded bg-blue-100 text-blue-700 dark:bg-brand/20 dark:text-brand px-1.5 py-0.5 text-[10px] font-bold'>
            Displaying {displayedCount} of {pageLoadedCount} loaded
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className='flex items-center gap-1.5'>
        <button
          type='button'
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1 || loading}
          className='admin-btn admin-btn-secondary admin-btn-sm'
          title='First page'
        >
          <ChevronsLeft size={13} />
        </button>
        <button
          type='button'
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1 || loading}
          className='admin-btn admin-btn-secondary admin-btn-sm'
          title='Previous page'
        >
          <ChevronLeft size={13} />
        </button>

        <form
          onSubmit={handleJumpSubmit}
          className='flex items-center gap-1 px-1'
        >
          <input
            type='number'
            min={1}
            max={safeTotalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            className='h-7 w-12 rounded border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-center text-xs font-bold text-[#1b2230] dark:text-white'
          />
          <span className='text-zinc-400 text-xs font-medium'>
            / {safeTotalPages}
          </span>
          <button
            type='submit'
            className='admin-btn admin-btn-secondary admin-btn-sm h-7 px-2 text-[10px]'
            title='Jump to page'
          >
            Go
          </button>
        </form>

        <button
          type='button'
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages || loading}
          className='admin-btn admin-btn-secondary admin-btn-sm'
          title='Next page'
        >
          <ChevronRight size={13} />
        </button>
        <button
          type='button'
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safePage >= safeTotalPages || loading}
          className='admin-btn admin-btn-secondary admin-btn-sm'
          title='Last page'
        >
          <ChevronsRight size={13} />
        </button>
      </div>

      {/* Per Page Limit */}
      <div className='flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs'>
        <span className='text-[11px]'>Show:</span>
        <div className='flex items-center gap-1'>
          {DISPLAY_LIMIT_PRESETS.map((preset) => (
            <button
              key={preset}
              type='button'
              onClick={() =>
                onChangeVisibleLimit && onChangeVisibleLimit(preset)
              }
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition ${
                visibleLimit === preset
                  ? 'bg-[#2350d8] text-white dark:bg-brand dark:text-black font-bold keep-white'
                  : 'hover:bg-slate-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CatalogSection({
  dbTitles = [],
  featuredItems = [],
  region = 'IN',
  titleQuery = '',
  setTitleQuery = () => {},
  titleTypeFilter = '',
  onChangeTypeFilter = () => {},
  catalogSort = 'updated',
  onChangeSort = () => {},
  catalogPage = 1,
  catalogTotalPages = 1,
  catalogTotalItems = 0,
  catalogPageSize = 100,
  catalogVisibleLimit = 100,
  onChangeVisibleLimit = () => {},
  catalogLoading = false,
  onPageChange = () => {},
  onSearchCatalog = () => {},
  onEditTitle = () => {},
  onCreateNewTitle = () => {},
  onSyncTitle = () => {},
  onDeleteTitle = () => {},
  onQuickAddToFeatured = () => {},
}) {
  const featuredSet = useMemo(() => {
    const set = new Set();
    (featuredItems || []).forEach((item) => {
      const numId = Number(item.tmdbId || item.id);
      const rawType = item.type || item.mediaType || 'movie';
      set.add(`${rawType}:${numId}`);
    });
    return set;
  }, [featuredItems]);

  const sortedAndFilteredTitles = useMemo(() => {
    let filtered = [...dbTitles];

    if (titleTypeFilter) {
      if (titleTypeFilter === 'webseries') {
        filtered = filtered.filter(
          (t) => t.subType === 'webseries' || t.isWebSeries,
        );
      } else if (titleTypeFilter === 'tv') {
        filtered = filtered.filter(
          (t) =>
            (t.mediaType === 'tv' || t.type === 'tv') &&
            t.subType !== 'webseries' &&
            !t.isWebSeries,
        );
      } else if (titleTypeFilter === 'movie') {
        filtered = filtered.filter(
          (t) =>
            (t.mediaType === 'movie' || t.type === 'movie' || !t.mediaType) &&
            t.subType !== 'webseries' &&
            !t.isWebSeries,
        );
      }
    }

    const getNumericRevenue = (item) =>
      Number(item.revenue ?? item.boxOffice?.worldwideCollection ?? 0) || 0;
    const getNumericBudget = (item) =>
      Number(item.budget ?? item.boxOffice?.budget ?? 0) || 0;

    filtered.sort((a, b) => {
      switch (catalogSort) {
        case 'popularity':
          return (Number(b.popularity) || 0) - (Number(a.popularity) || 0);
        case 'trending': {
          const aTrend =
            a.isTrending || (a.listTags || []).includes('trending') ? 1 : 0;
          const bTrend =
            b.isTrending || (b.listTags || []).includes('trending') ? 1 : 0;
          return (
            bTrend - aTrend ||
            (Number(b.popularity) || 0) - (Number(a.popularity) || 0)
          );
        }
        case 'newest': {
          const aDate = a.releaseDate
            ? new Date(a.releaseDate).getTime()
            : a.year || 0;
          const bDate = b.releaseDate
            ? new Date(b.releaseDate).getTime()
            : b.year || 0;
          return bDate - aDate;
        }
        case 'oldest': {
          const aDate = a.releaseDate
            ? new Date(a.releaseDate).getTime()
            : a.year || 9999;
          const bDate = b.releaseDate
            ? new Date(b.releaseDate).getTime()
            : b.year || 9999;
          return aDate - bDate;
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
          return (
            bUp - aUp ||
            (Number(b.popularity) || 0) - (Number(a.popularity) || 0)
          );
        }
      }
    });

    return filtered;
  }, [dbTitles, titleTypeFilter, catalogSort]);

  const safeVisibleLimit = Math.min(
    catalogPageSize,
    Math.max(1, Number(catalogVisibleLimit) || catalogPageSize),
  );
  const displayedTitles = useMemo(
    () => sortedAndFilteredTitles.slice(0, safeVisibleLimit),
    [sortedAndFilteredTitles, safeVisibleLimit],
  );

  return (
    <div
      id='admin-catalog-top'
      className='flex-1 min-h-0 flex flex-col overflow-hidden'
    >
      {/* ==================== PINNED TOOLBAR (FILTERS, SEARCH, SORT) ==================== */}
      <div className='shrink-0 mb-3 space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-2.5 shadow-xs'>
          {/* Media Type Tabs */}
          <div className='flex flex-wrap items-center gap-1 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-100 dark:bg-[#070a10] p-1'>
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
                  type='button'
                  onClick={() => onChangeTypeFilter(tab.value)}
                  className={`admin-btn admin-btn-sm ${
                    active
                      ? 'admin-btn-primary font-bold'
                      : 'admin-btn-secondary border-transparent shadow-none'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selection Pills */}
          <div className='flex flex-wrap items-center gap-1 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-100 dark:bg-[#070a10] px-2 py-1'>
            <span className='mr-1 flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-brand uppercase'>
              <ArrowUpDown size={11} /> Sort:
            </span>
            {CATALOG_SORT_OPTIONS.map((opt) => {
              const active = catalogSort === opt.value;
              return (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => onChangeSort(opt.value)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    active
                      ? 'bg-[#2350d8] keep-white dark:bg-brand dark:text-black font-bold shadow-xs'
                      : 'text-[#4a5262] dark:text-zinc-400 hover:text-[#1b2230] dark:hover:text-white'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Search + Create Custom */}
          <div className='flex flex-1 flex-wrap items-center justify-end gap-2'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchCatalog(1);
              }}
              className='flex min-w-48 flex-1 items-center gap-1.5 sm:max-w-xs'
            >
              <div className='relative flex-1'>
                <Search
                  size={13}
                  className='absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400'
                />
                <input
                  type='text'
                  placeholder='Search title, ID...'
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  className='w-full h-8 pl-8 pr-7 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white'
                />
                {titleQuery && (
                  <button
                    type='button'
                    onClick={() => {
                      setTitleQuery('');
                      onSearchCatalog(1, { q: '' });
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

            <button
              type='button'
              onClick={onCreateNewTitle}
              className='admin-btn admin-btn-primary admin-btn-sm'
            >
              <Plus size={13} />
              <span className='hidden sm:inline'>Create Custom Title</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================== TABLE CONTAINER CARD (SCROLLS INTERNALLY) ==================== */}
      <div className='flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] shadow-xs'>
        {/* Scrollable Table Area */}
        <div className='flex-1 min-h-0 overflow-x-auto overflow-y-auto studio-scroll'>
          <table className='admin-table w-full text-left'>
            <thead className='sticky top-0 z-10 bg-slate-50 dark:bg-[#0e131f] border-b border-[#d5d9e0] dark:border-white/10 shadow-xs'>
              <tr>
                <th className='w-12'>#</th>
                <th>Movie / Series</th>
                <th>Type</th>
                <th>Year</th>
                <th>Rating / Pop</th>
                <th>Budget / Box Office ({region === 'IN' ? '₹' : '$'})</th>
                <th>OTT Platforms</th>
                <th>Created &amp; Updated</th>
                <th>Featured</th>
                <th className='text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTitles.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className='py-12 text-center text-xs text-zinc-400'
                  >
                    <Database
                      size={22}
                      className='mx-auto mb-2 text-[#2350d8] dark:text-brand'
                    />
                    No titles matched your current filter or search query.
                  </td>
                </tr>
              ) : (
                displayedTitles.map((t, idx) => {
                  const rowNumber =
                    (catalogPage - 1) * catalogPageSize + idx + 1;
                  const fin = getMovieFinancials(t, region);
                  const ottList = Array.isArray(t.ottProviders)
                    ? t.ottProviders
                    : [];
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
                      {/* 1. Normal ID (#ID / Row Number) */}
                      <td className='whitespace-nowrap font-mono text-[11px] font-bold text-zinc-500'>
                        #{t.id || rowNumber}
                      </td>

                      {/* 2. Movie Poster + Clickable Title Link */}
                      <td className='overflow-hidden max-w-xs'>
                        <a
                          href={getTitlePath(t)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='group flex min-w-0 items-center gap-2.5 overflow-hidden hover:opacity-90 transition-opacity'
                          title={t.title}
                        >
                          <SafeImage
                            src={t.posterUrl || t.backdropUrl}
                            alt={t.title}
                            size='w185'
                            className='h-10 w-7 shrink-0 rounded border border-[#d5d9e0] dark:border-white/10 object-cover shadow-xs group-hover:border-blue-500 dark:group-hover:border-brand transition-colors'
                          />
                          <div className='min-w-0 flex-1 overflow-hidden'>
                            <div className='flex items-center gap-1 overflow-hidden'>
                              <p
                                className='truncate text-xs font-bold text-[#1b2230] dark:text-white group-hover:text-blue-600 dark:group-hover:text-brand transition-colors'
                                title={t.title}
                              >
                                {t.title}
                              </p>
                              <ExternalLink
                                size={10}
                                className='shrink-0 text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity'
                              />
                            </div>
                            <div className='mt-0.5 flex items-center gap-1.5 overflow-hidden text-[10px] text-zinc-400'>
                              <span className='shrink-0 font-mono'>
                                #{t.id}
                              </span>
                              {(t.isTrending ||
                                (t.listTags || []).includes('trending')) && (
                                <span className='shrink-0 rounded bg-amber-100 text-amber-800 dark:bg-brand/20 dark:text-brand px-1 text-[8px] font-bold uppercase'>
                                  Hot
                                </span>
                              )}
                              {t.lockedFields?.length > 0 && (
                                <span className='shrink-0 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 px-1 text-[8px] font-bold'>
                                  Edited
                                </span>
                              )}
                            </div>
                          </div>
                        </a>
                      </td>

                      {/* 3. Type */}
                      <td className='whitespace-nowrap'>
                        <span
                          className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                            displayType === 'webseries'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                              : displayType === 'tv'
                                ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                          }`}
                        >
                          {displayType === 'webseries'
                            ? 'Web Series'
                            : displayType === 'tv'
                              ? 'TV Show'
                              : 'Movie'}
                        </span>
                      </td>

                      {/* 4. Year */}
                      <td className='whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-300'>
                        {t.year ||
                          (t.releaseDate ? t.releaseDate.slice(0, 4) : '—')}
                      </td>

                      {/* 5. Rating & Popularity */}
                      <td className='whitespace-nowrap'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold text-xs text-amber-600 dark:text-brand'>
                            ★{' '}
                            {(Number(t.voteAverage ?? t.rating) || 0).toFixed(
                              1,
                            )}
                          </span>
                          <span className='text-[10px] text-zinc-400'>
                            (
                            {(
                              Number(t.voteCount ?? t.votes) || 0
                            ).toLocaleString()}
                            )
                          </span>
                        </div>
                      </td>

                      {/* 6. Budget & Box Office */}
                      <td className='whitespace-nowrap text-xs'>
                        <div>
                          <p className='font-bold text-emerald-600 dark:text-emerald-400'>
                            {fin.revenueText || '—'}
                          </p>
                          <p className='text-[10px] text-zinc-400'>
                            Bud: {fin.budgetText || '—'}
                          </p>
                          {fin.verdict && fin.verdict !== 'TBA' && (
                            <p className='text-[9px] font-semibold text-blue-600 dark:text-brand mt-0.5'>
                              {fin.verdict}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 7. OTT Platforms */}
                      <td className='overflow-hidden max-w-36'>
                        {ottList.length === 0 ? (
                          <span className='text-[11px] text-zinc-400'>
                            ____
                          </span>
                        ) : (
                          <div
                            className='flex items-center gap-1 overflow-hidden'
                            title={allOttNames}
                          >
                            {ottList.slice(0, 2).map((ottKey) => {
                              const meta = resolveOttMeta(ottKey);
                              return (
                                <span
                                  key={ottKey}
                                  style={{ backgroundColor: meta.badge }}
                                  className='keep-white inline-block max-w-16 truncate rounded px-1.5 py-0.2 text-[9px] font-bold text-white shadow-2xs'
                                >
                                  {meta.label}
                                </span>
                              );
                            })}
                            {ottList.length > 2 && (
                              <span className='shrink-0 rounded bg-slate-100 dark:bg-white/10 px-1 text-[9px] font-bold text-zinc-600 dark:text-zinc-400'>
                                +{ottList.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 8. Created & Updated */}
                      <td className='whitespace-nowrap text-[11px] leading-tight'>
                        <div className='text-zinc-800 dark:text-zinc-200 font-medium'>
                          <span className='text-zinc-400 text-[10px]'>
                            Upd:{' '}
                          </span>
                          {formatAdminDateTime(t.updatedAt || t.releaseDate)}
                        </div>
                        <div className='text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5'>
                          <span className='text-zinc-400 text-[9px]'>
                            Cre:{' '}
                          </span>
                          {formatAdminDateTime(t.createdAt || t.releaseDate)}
                        </div>
                      </td>

                      {/* 9. Featured Carousel (Requirement 10: "write featured insted of just hero") */}
                      <td className='whitespace-nowrap'>
                        {isAlreadyFeatured ? (
                          <span className='admin-status-badge admin-status-emerald text-[10px]'>
                            <Check size={11} /> Featured
                          </span>
                        ) : (
                          <button
                            type='button'
                            onClick={() => onQuickAddToFeatured(t)}
                            className='admin-btn admin-btn-amber admin-btn-sm'
                            title='Add this title to Featured Carousel on Home Feed'
                          >
                            <Sparkles size={11} /> + Featured
                          </button>
                        )}
                      </td>

                      {/* 10. Actions */}
                      <td className='whitespace-nowrap text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            type='button'
                            onClick={() => onEditTitle(t)}
                            className='admin-btn admin-btn-primary admin-btn-sm'
                            title='Edit Title, Box Office & Songs'
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                          <button
                            type='button'
                            onClick={() => onSyncTitle(t)}
                            title='Sync official data from TMDB'
                            className='admin-btn admin-btn-sky admin-btn-sm'
                          >
                            <RefreshCw size={11} /> Sync
                          </button>
                          <button
                            type='button'
                            onClick={() => onDeleteTitle(t)}
                            title='Delete Title from Database'
                            className='admin-btn admin-btn-danger admin-btn-sm px-2'
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

        {/* Docked Pagination Bar inside table card */}
        <div className='shrink-0 border-t border-[#d5d9e0] dark:border-white/10 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02]'>
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
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
