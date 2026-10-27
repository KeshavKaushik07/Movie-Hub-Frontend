import { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Tv,
  Film,
  Filter,
  Flame,
  Star,
  Calendar,
} from 'lucide-react';
import {
  OTT_LIST,
  MOVIE_GENRES,
  resolveOttKey,
  getOttPath,
  toGenreSlug,
  resolveGenreId,
  resolveGenreName,
  fromBrowseTypeSlug,
  toBrowseTypeSlug,
} from '../config/constants';
import { tmdb } from '../services/api';
import MovieCard from '../components/MovieCard';
import InfoPatch from '../components/ui/InfoPatch';
import { OttGridSkeleton, OttHubPageSkeleton } from '../components/ui/Skeletons';
import { notifyPatch } from '../utils/notify';

export default function OttHub() {
  const { providerKey } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const nav = useNavigate();

  const theme = useSelector((s) => s.theme.mode);
  const isLight = theme === 'light';

  const rawProvider = providerKey || searchParams.get('provider') || 'all';
  const resolvedProvider = resolveOttKey(rawProvider);

  const rawTypeParam = searchParams.get('type') || 'all';
  const initialMediaFilter =
    rawTypeParam === 'all' ? 'all' : fromBrowseTypeSlug(rawTypeParam);

  const rawGenreParam = searchParams.get('genre') || '';
  const initialGenreName = resolveGenreName(rawGenreParam, 'movie');
  const initialGenreSlug = initialGenreName
    ? toGenreSlug(initialGenreName)
    : rawGenreParam
      ? toGenreSlug(rawGenreParam)
      : '';

  const [selectedOtt, setSelectedOtt] = useState(resolvedProvider);
  const [mediaFilter, setMediaFilter] = useState(initialMediaFilter); // 'all' | 'movie' | 'webseries' | 'tv'
  const [selectedGenre, setSelectedGenre] = useState(initialGenreSlug);
  const [sortBy, setSortBy] = useState(
    searchParams.get('sort') || 'popularity',
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync clean URL: `/ott/netflix`, `/ott/prime-video`, `/ott/jiohotstar`, etc. (never `?provider=prime`)
  const syncCleanOttUrl = (overrides = {}, replace = false) => {
    const nextOtt = overrides.ott !== undefined ? overrides.ott : selectedOtt;
    const nextType =
      overrides.type !== undefined ? overrides.type : mediaFilter;
    const nextGenre =
      overrides.genre !== undefined ? overrides.genre : selectedGenre;
    const nextSort = overrides.sort !== undefined ? overrides.sort : sortBy;

    const basePath = getOttPath(nextOtt);
    const nextSearch = new URLSearchParams();
    if (nextType && nextType !== 'all') {
      nextSearch.set('type', toBrowseTypeSlug(nextType));
    }
    if (nextGenre) {
      nextSearch.set('genre', toGenreSlug(nextGenre));
    }
    if (nextSort && nextSort !== 'popularity') {
      nextSearch.set('sort', nextSort);
    }

    const qs = nextSearch.toString();
    const targetUrl = `${basePath}${qs ? `?${qs}` : ''}`;
    const currentUrl = `${location.pathname}${location.search}`;
    if (targetUrl !== currentUrl) {
      nav(targetUrl, { replace });
    }
  };

  useEffect(() => {
    const rawOtt = providerKey || searchParams.get('provider') || 'all';
    const nextOtt = resolveOttKey(rawOtt);
    const rawType = searchParams.get('type') || 'all';
    const nextType = rawType === 'all' ? 'all' : fromBrowseTypeSlug(rawType);
    const rawGenre = searchParams.get('genre') || '';
    const gName = resolveGenreName(rawGenre, nextType === 'all' ? 'movie' : nextType);
    const nextGenre = gName
      ? toGenreSlug(gName)
      : rawGenre
        ? toGenreSlug(rawGenre)
        : '';
    const nextSort = searchParams.get('sort') || 'popularity';

    setSelectedOtt(nextOtt);
    setMediaFilter(nextType);
    setSelectedGenre(nextGenre);
    setSortBy(nextSort);
    setPage(1);

    // Normalize legacy `/ott?provider=prime` or `/ott/prime` into `/ott/prime-video`
    const canonicalBasePath = getOttPath(nextOtt);
    if (
      searchParams.has('provider') ||
      location.pathname !== canonicalBasePath ||
      (rawGenre && /^\d+$/.test(rawGenre) && nextGenre)
    ) {
      const cleanParams = new URLSearchParams();
      if (nextType !== 'all') cleanParams.set('type', toBrowseTypeSlug(nextType));
      if (nextGenre) cleanParams.set('genre', nextGenre);
      if (nextSort !== 'popularity') cleanParams.set('sort', nextSort);
      const qs = cleanParams.toString();
      const canonicalUrl = `${canonicalBasePath}${qs ? `?${qs}` : ''}`;
      if (`${location.pathname}${location.search}` !== canonicalUrl) {
        nav(canonicalUrl, { replace: true });
      }
    }
  }, [providerKey, searchParams, location.pathname, location.search, nav]);

  const handleSelectOtt = (key) => {
    const normalized = resolveOttKey(key || 'all');
    setSelectedOtt(normalized);
    setPage(1);
    syncCleanOttUrl({ ott: normalized });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const ottParam =
      selectedOtt === 'all'
        ? OTT_LIST.map((o) => o.key).join(',')
        : selectedOtt;

    const fetchPage = async () => {
      try {
        if (mediaFilter === 'all') {
          const movieGenreId = selectedGenre
            ? resolveGenreId(selectedGenre, 'movie')
            : undefined;
          const seriesGenreId = selectedGenre
            ? resolveGenreId(selectedGenre, 'webseries')
            : undefined;

          const [moviesRes, seriesRes] = await Promise.all([
            tmdb.discover('movie', {
              ott: ottParam,
              genre: movieGenreId,
              sort: sortBy,
              page,
              limit: 18,
            }),
            tmdb.discover('webseries', {
              ott: ottParam,
              genre: seriesGenreId,
              sort: sortBy,
              page,
              limit: 18,
            }),
          ]);

          if (!alive) return;
          const mList = (moviesRes?.items || moviesRes?.results || []).map(
            (x) => ({
              ...x,
              type: 'movie',
            }),
          );
          const sList = (seriesRes?.items || seriesRes?.results || []).map(
            (x) => ({
              ...x,
              type: 'webseries',
              subType: 'webseries',
            }),
          );

          // Deduplicate combined list by type:id
          const seen = new Set();
          const combined = [];
          for (const item of [...mList, ...sList]) {
            const k = `${item.type}:${item.id}`;
            if (!seen.has(k)) {
              seen.add(k);
              combined.push(item);
            }
          }

          combined.sort((a, b) => {
            if (sortBy === 'rating') {
              return (
                Number(b.siteRating || b.vote_average || 0) -
                Number(a.siteRating || a.vote_average || 0)
              );
            }
            if (sortBy === 'year') {
              return Number(b.year || 0) - Number(a.year || 0);
            }
            return Number(b.popularity || 0) - Number(a.popularity || 0);
          });

          setItems(combined);
          setTotalPages(
            Math.max(moviesRes?.totalPages || 1, seriesRes?.totalPages || 1, 1),
          );
        } else {
          const resolvedGenreId = selectedGenre
            ? resolveGenreId(selectedGenre, mediaFilter)
            : undefined;
          const res = await tmdb.discover(mediaFilter, {
            ott: ottParam,
            genre: resolvedGenreId,
            sort: sortBy,
            page,
            limit: 24,
          });
          if (!alive) return;
          setItems(res?.items || res?.results || []);
          setTotalPages(res?.totalPages || res?.total_pages || 1);
        }
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    };

    fetchPage();
    return () => {
      alive = false;
    };
  }, [selectedOtt, mediaFilter, selectedGenre, sortBy, page]);

  const activeOttMeta = OTT_LIST.find((o) => o.key === selectedOtt);

  if (loading && !hasLoadedOnce) {
    return <OttHubPageSkeleton />;
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8'>
      {/* Master OTT Hub Header — Theme-Responsive for Both Light & Dark Mode */}
      <div
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #fef3c7 100%)'
            : 'linear-gradient(135deg, #0e131f 0%, #131b2e 55%, #090d16 100%)',
        }}
        className={`relative overflow-hidden rounded-3xl border p-5 transition-colors duration-300 sm:p-8 ${
          isLight
            ? 'border-slate-200/90 text-slate-900 shadow-xl shadow-slate-900/5'
            : 'border-white/10 text-white shadow-2xl'
        }`}
      >
        <div className='flex flex-col justify-between gap-4 lg:flex-row lg:items-center'>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase ${
                isLight
                  ? 'border border-amber-300/80 bg-amber-100/90 text-amber-900'
                  : 'bg-brand/15 text-brand'
              }`}
            >
              <Tv size={13} /> Master OTT Streaming Hub
            </span>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {activeOttMeta
                ? `${activeOttMeta.label} — Movies, Web Series & TV Shows`
                : 'All OTT Platforms Catalog'}
            </h1>
            <p
              className={`mt-1 max-w-2xl text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}
            >
              Select any streaming platform below to filter movies, original
              web series, and TV shows according to your selected OTT.
            </p>
          </div>

          {/* Media Type Filter Pills — Clearly differentiates Movies, Web Series, and TV Shows */}
          <div className='flex flex-wrap items-center gap-2'>
            {[
              { id: 'all', label: '✨ All Titles' },
              { id: 'movie', label: '🎬 Movies', icon: Film },
              { id: 'webseries', label: '🔥 Web Series', icon: Tv },
              { id: 'tv', label: '📺 TV Shows', icon: Tv },
            ].map((tab) => (
              <button
                key={tab.id}
                type='button'
                onClick={() => {
                  setMediaFilter(tab.id);
                  setPage(1);
                  syncCleanOttUrl({ type: tab.id });
                }}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  mediaFilter === tab.id
                    ? 'bg-brand text-black shadow-lg shadow-brand/25'
                    : isLight
                      ? 'border border-slate-200 bg-white/90 text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950'
                      : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Master OTT Selector Grid — "All OTT" Uppermost / First */}
        <div className='mt-6'>
          <p
            className={`mb-2.5 text-[11px] font-bold tracking-wider uppercase ${
              isLight ? 'text-slate-500' : 'text-zinc-400'
            }`}
          >
            Select OTT Platform
          </p>
          <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
            {/* Uppermost / First Option: All OTT */}
            <button
              type='button'
              onClick={() => handleSelectOtt('all')}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                selectedOtt === 'all'
                  ? isLight
                    ? 'border-brand bg-amber-50/90 shadow-md shadow-brand/15'
                    : 'border-brand bg-brand/15 shadow-lg shadow-brand/10'
                  : isLight
                    ? 'border-slate-200/90 bg-white/95 shadow-2xs hover:border-brand/60 hover:bg-slate-50'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/10'
              }`}
            >
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-amber-500 text-xs font-black text-black shadow'>
                ALL
              </span>
              <div className='min-w-0 flex-1'>
                <p
                  className={`truncate text-xs font-extrabold ${
                    selectedOtt === 'all'
                      ? isLight
                        ? 'text-amber-700'
                        : 'text-brand'
                      : isLight
                        ? 'text-slate-900'
                        : 'text-white'
                  }`}
                >
                  All OTT
                </p>
                <p
                  className={`truncate text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}
                >
                  Every Platform
                </p>
              </div>
            </button>

            {OTT_LIST.map((ott) => {
              const isActive = selectedOtt === ott.key;
              return (
                <button
                  key={ott.key}
                  type='button'
                  onClick={() => handleSelectOtt(ott.key)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                    isActive
                      ? isLight
                        ? 'border-brand bg-amber-50/90 shadow-md shadow-brand/15'
                        : 'border-brand bg-brand/15 shadow-lg shadow-brand/10'
                      : isLight
                        ? 'border-slate-200/90 bg-white/95 shadow-2xs hover:border-brand/60 hover:bg-slate-50'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/10'
                  }`}
                >
                  <span
                    style={{ backgroundColor: ott.badge }}
                    className='keep-white flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow'
                  >
                    {ott.short || ott.label.slice(0, 2).toUpperCase()}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <p
                      className={`truncate text-xs font-extrabold ${
                        isActive
                          ? isLight
                            ? 'text-amber-700'
                            : 'text-brand'
                          : isLight
                            ? 'text-slate-900'
                            : 'text-white'
                      }`}
                    >
                      {ott.label}
                    </p>
                    <p
                      className={`truncate text-[10px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}
                    >
                      {ott.sub || 'Stream Originals'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Bar: Genre Slugs + Sort */}
        <div
          className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${
            isLight ? 'border-slate-200/90' : 'border-white/10'
          }`}
        >
          <div className='flex flex-wrap items-center gap-1.5'>
            <span
              className={`mr-1 inline-flex items-center gap-1 text-xs font-bold ${
                isLight ? 'text-slate-600' : 'text-zinc-400'
              }`}
            >
              <Filter size={13} /> Genre:
            </span>
            <button
              type='button'
              onClick={() => {
                setSelectedGenre('');
                setPage(1);
                syncCleanOttUrl({ genre: '' });
              }}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                !selectedGenre
                  ? 'bg-brand text-black shadow-xs'
                  : isLight
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              All Genres
            </button>
            {Object.keys(MOVIE_GENRES)
              .slice(0, 8)
              .map((gName) => {
                const gSlug = toGenreSlug(gName);
                return (
                  <button
                    key={gSlug}
                    type='button'
                    onClick={() => {
                      setSelectedGenre(gSlug);
                      setPage(1);
                      syncCleanOttUrl({ genre: gSlug });
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                      selectedGenre === gSlug
                        ? 'bg-brand text-black shadow-xs'
                        : isLight
                          ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {gName}
                  </button>
                );
              })}
          </div>

          <div className='flex items-center gap-1.5'>
            {[
              { id: 'popularity', label: 'Popular', icon: Flame },
              { id: 'rating', label: 'Top Rated', icon: Star },
              { id: 'year', label: 'Newest', icon: Calendar },
            ].map((s) => {
              const Icon = s.icon;
              const isSortActive = sortBy === s.id;
              return (
                <button
                  key={s.id}
                  type='button'
                  onClick={() => {
                    setSortBy(s.id);
                    setPage(1);
                    syncCleanOttUrl({ sort: s.id });
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    isSortActive
                      ? isLight
                        ? 'bg-brand text-black shadow-xs'
                        : 'bg-white text-black'
                      : isLight
                        ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <Icon size={12} /> {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Filtered Data Grid */}
      <div className='mt-8'>
        <div className='mb-4 flex items-center justify-between'>
          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className={`text-lg font-extrabold sm:text-xl ${isLight ? 'text-slate-900' : 'text-white'}`}
          >
            {activeOttMeta
              ? `Streaming on ${activeOttMeta.label}`
              : 'Streaming Across All OTT Platforms'}
          </h2>
          <span
            className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}
          >
            Showing {items.length} titles
          </span>
        </div>

        {loading ? (
          <OttGridSkeleton count={12} />
        ) : items.length === 0 ? (
          <InfoPatch
            type="not-found"
            title={`No Streaming Titles Found${activeOttMeta ? ` on ${activeOttMeta.label}` : ''}`}
            message="No movies, web series, or TV shows matched your current OTT platform and genre combination. Try switching to All OTT or clearing the genre filter."
            actions={[
              {
                label: 'Show All OTT Titles',
                primary: true,
                onClick: () => {
                  setSelectedOtt('all');
                  setSelectedGenre('');
                  setMediaFilter('all');
                  nav('/ott');
                  notifyPatch({
                    type: 'info',
                    title: 'OTT Filter Reset',
                    message: 'Showing releases across all OTT platforms.',
                    duration: 2600,
                  });
                },
              },
            ]}
          />
        ) : (
          <>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
              {items.map((item) => (
                <MovieCard
                  key={`${item.type || 'movie'}-${item.id}`}
                  item={item}
                  type={
                    item.subType === 'webseries'
                      ? 'webseries'
                      : item.type || 'movie'
                  }
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className='mt-8 flex items-center justify-center gap-3'>
                <button
                  type='button'
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-40 ${
                    isLight
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      : 'border-white/10 bg-[#0e131f] text-zinc-300'
                  }`}
                >
                  Previous
                </button>
                <span
                  className={`text-xs font-bold ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}
                >
                  Page {page} of {totalPages}
                </span>
                <button
                  type='button'
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className={`rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-40 ${
                    isLight
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      : 'border-white/10 bg-[#0e131f] text-zinc-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
