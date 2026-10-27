import { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';
import {
  RotateCcw,
  Sparkles,
  Search,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { tmdb } from '../services/api';
import {
  MOVIE_GENRES,
  TV_GENRES,
  OTT_LIST,
  INDUSTRY_LIST,
  toGenreSlug,
  resolveGenreId,
  resolveGenreName,
  getOttSlug,
  resolveOttKey,
  toBrowseTypeSlug,
  fromBrowseTypeSlug,
} from '../config/constants';
import MovieCard from '../components/MovieCard';
import CustomSelect from '../components/ui/CustomSelect';
import InfoPatch from '../components/ui/InfoPatch';
import SafeImage from '../components/ui/SafeImage';
import { BrowseGridSkeleton, BrowsePageSkeleton } from '../components/ui/Skeletons';
import { getPersonPath, isUpcomingRelease } from '../utils/formatters';
import { notifyPatch } from '../utils/notify';
import { sanitizeText } from '../utils/security';

const YEARS = Array.from({ length: 75 }, (_, i) => 2026 - i);

const SORTS = [
  { value: 'popularity', label: '🔥 Most Popular' },
  { value: 'rating', label: '⭐ Top Rated (TMDB)' },
  { value: 'site_rating', label: '🏆 Community Top Rated' },
  { value: 'newest', label: '📅 Newest Releases' },
  { value: 'revenue', label: '💰 Highest Box Office' },
];

const LIST_PRESETS = [
  { value: '', label: 'All Catalog Titles' },
  { value: 'upcoming', label: '🗓️ Upcoming Releases' },
  { value: 'trending', label: '🔥 Trending This Week' },
  { value: 'popular', label: '🌟 Popular Releases' },
  { value: 'top-rated', label: '🏆 All-Time Top Rated' },
  { value: 'now-playing', label: '🎟️ Now Playing in Cinemas' },
  { value: 'community-top', label: '💎 Community Top Rated' },
];

export default function Browse() {
  const { type: routeTypeParam } = useParams();
  const location = useLocation();
  const [params] = useSearchParams();
  const nav = useNavigate();

  // Support both `/browse/:type` (`/browse/movies`, `/browse/web-series`, `/browse/tv-shows`)
  // and top-level plural paths (`/movies`, `/web-series`, `/tv-shows`)
  const rawRouteSegment =
    routeTypeParam ||
    location.pathname.replace(/^\/browse\/?/, '').replace(/^\/+/, '') ||
    'movies';
  const normalizedMediaType = fromBrowseTypeSlug(rawRouteSegment);
  const canonicalBrowseSegment = toBrowseTypeSlug(normalizedMediaType);

  const initialGenreRaw = params.get('genre') || '';
  const initialGenreName = resolveGenreName(initialGenreRaw, normalizedMediaType);
  const initialGenreSlug = initialGenreName
    ? toGenreSlug(initialGenreName)
    : initialGenreRaw
      ? toGenreSlug(initialGenreRaw)
      : '';

  const initialOttRaw = params.get('ott') || params.get('provider') || '';
  const initialOttKey = initialOttRaw ? resolveOttKey(initialOttRaw) : '';

  const [mediaType, setMediaType] = useState(normalizedMediaType);
  const [listPreset, setListPreset] = useState(params.get('list') || '');
  const [genre, setGenre] = useState(initialGenreSlug);
  const [year, setYear] = useState(params.get('year') || '');
  const [industry, setIndustry] = useState(params.get('industry') || '');
  const [ott, setOtt] = useState(initialOttKey === 'all' ? '' : initialOttKey);
  const [minRating, setMinRating] = useState(params.get('minRating') || '');
  const [sort, setSort] = useState(params.get('sort') || 'popularity');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [matchedPerson, setMatchedPerson] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const q = sanitizeText(params.get('q') || '', 120);
  const [searchInput, setSearchInput] = useState(q);
  const genreMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

  // Helper to build clean, bot-friendly plural URLs with human-readable slugs (`?genre=thriller`, `?ott=prime-video`)
  const syncCleanBrowseUrl = (overrides = {}, replace = false) => {
    const nextMediaType = overrides.mediaType ?? mediaType;
    const nextList = overrides.list !== undefined ? overrides.list : listPreset;
    const nextGenre = overrides.genre !== undefined ? overrides.genre : genre;
    const nextYear = overrides.year !== undefined ? overrides.year : year;
    const nextIndustry =
      overrides.industry !== undefined ? overrides.industry : industry;
    const nextOtt = overrides.ott !== undefined ? overrides.ott : ott;
    const nextMinRating =
      overrides.minRating !== undefined ? overrides.minRating : minRating;
    const nextSort = overrides.sort !== undefined ? overrides.sort : sort;
    const nextQ = overrides.q !== undefined ? overrides.q : q;

    const search = new URLSearchParams();
    if (nextQ) search.set('q', nextQ);
    if (nextList) search.set('list', nextList);
    if (nextGenre) {
      const gName = resolveGenreName(nextGenre, nextMediaType);
      search.set('genre', gName ? toGenreSlug(gName) : toGenreSlug(nextGenre));
    }
    if (nextIndustry) search.set('industry', nextIndustry);
    if (nextOtt) search.set('ott', getOttSlug(nextOtt));
    if (nextYear) search.set('year', nextYear);
    if (nextMinRating) search.set('minRating', nextMinRating);
    if (nextSort && nextSort !== 'popularity') search.set('sort', nextSort);

    const targetBasePath = `/browse/${toBrowseTypeSlug(nextMediaType)}`;
    const qs = search.toString();
    const targetUrl = `${targetBasePath}${qs ? `?${qs}` : ''}`;
    const currentUrl = `${location.pathname}${location.search}`;
    if (targetUrl !== currentUrl) {
      nav(targetUrl, { replace });
    }
  };

  // Sync state when route or search params change, and normalize legacy URLs (e.g. `/browse/movie?genre=53` -> `/browse/movies?genre=thriller`)
  useEffect(() => {
    const nextType = fromBrowseTypeSlug(rawRouteSegment);
    const rawGenre = params.get('genre') || '';
    const gName = resolveGenreName(rawGenre, nextType);
    const cleanGenreSlug = gName
      ? toGenreSlug(gName)
      : rawGenre
        ? toGenreSlug(rawGenre)
        : '';

    const rawOtt = params.get('ott') || params.get('provider') || '';
    const resolvedOtt = rawOtt ? resolveOttKey(rawOtt) : '';
    const cleanOttKey = resolvedOtt === 'all' ? '' : resolvedOtt;

    setMediaType(nextType);
    setListPreset(params.get('list') || '');
    setGenre(cleanGenreSlug);
    setYear(params.get('year') || '');
    setIndustry(params.get('industry') || '');
    setOtt(cleanOttKey);
    setMinRating(params.get('minRating') || '');
    setSort(params.get('sort') || 'popularity');
    setSearchInput(sanitizeText(params.get('q') || '', 120));
    setPage(1);

    // If URL used singular `/browse/movie` or numeric `?genre=53`, silently replace with canonical `/browse/movies?genre=thriller`
    const isSingularBrowsePath =
      location.pathname === '/browse' ||
      location.pathname === '/browse/movie' ||
      location.pathname === '/browse/webseries' ||
      location.pathname === '/browse/tv';
    const hasNumericGenre = rawGenre && /^\d+$/.test(rawGenre) && cleanGenreSlug;
    const hasShortOtt =
      rawOtt && cleanOttKey && rawOtt !== getOttSlug(cleanOttKey);

    if (isSingularBrowsePath || hasNumericGenre || hasShortOtt) {
      const canonicalSearch = new URLSearchParams(params);
      canonicalSearch.delete('provider');
      if (cleanGenreSlug) canonicalSearch.set('genre', cleanGenreSlug);
      if (cleanOttKey) canonicalSearch.set('ott', getOttSlug(cleanOttKey));
      const qs = canonicalSearch.toString();
      const canonicalPath = `/browse/${toBrowseTypeSlug(nextType)}${qs ? `?${qs}` : ''}`;
      if (`${location.pathname}${location.search}` !== canonicalPath) {
        nav(canonicalPath, { replace: true });
      }
    }
  }, [rawRouteSegment, params, location.pathname, location.search, nav]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFetchError('');
    if (!q) setMatchedPerson(null);

    // Internally resolve clean genre slug (`thriller`) to TMDB numeric ID (`53`) and OTT slug (`prime-video`) to backend key (`prime`)
    const resolvedGenreId = genre
      ? resolveGenreId(genre, mediaType) || genre
      : undefined;
    const resolvedOttKey = ott ? resolveOttKey(ott) : undefined;

    const filterParams = {
      page,
      sort,
      genre: resolvedGenreId,
      year: year || undefined,
      industry: industry || undefined,
      ott: resolvedOttKey,
      minRating: minRating || undefined,
      list: listPreset || undefined,
    };

    const req = q
      ? tmdb.search(q, { type: mediaType, ...filterParams })
      : listPreset && !genre && !year && !industry && !ott
        ? tmdb.list(mediaType, listPreset, filterParams)
        : tmdb.discover(mediaType, filterParams);

    req
      .then((d) => {
        if (!alive) return;
        const rawList = d?.results || d?.items || [];
        // Strictly ensure only genuinely unreleased titles appear when browsing `list=upcoming`
        const list =
          listPreset === 'upcoming'
            ? rawList.filter((it) => isUpcomingRelease(it))
            : rawList;

        setItems(list);
        setMatchedPerson(q ? d?.matchedPerson || null : null);
        setTotalPages(Math.min(d?.total_pages || d?.totalPages || 1, 500));
        setTotalResults(
          listPreset === 'upcoming'
            ? list.length
            : d?.total_results || d?.total || list.length,
        );
        setLoading(false);
        setHasLoadedOnce(true);

        if (page === 1 && q) {
          if (list.length === 0) {
            notifyPatch({
              type: 'not-found',
              title: 'No Matching Titles Found',
              message: `No movies, web series, or TV shows matched "${q}".`,
            });
          } else {
            notifyPatch({
              type: 'info',
              title: d?.matchedPerson?.name
                ? `${d.matchedPerson.name} — Verified Credits Loaded`
                : 'Search Results Loaded',
              message: d?.matchedPerson?.name
                ? `Showing ${d?.total_results || d?.total || list.length} titles featuring ${d.matchedPerson.name} in Cast or Crew.`
                : `Found ${d?.total_results || d?.total || list.length} matching titles for "${q}".`,
              duration: 2600,
            });
          }
        }
      })
      .catch((err) => {
        if (!alive) return;
        setFetchError(
          err?.response?.data?.message ||
            'Unable to load catalog titles right now.',
        );
        setLoading(false);
        setHasLoadedOnce(true);
      });

    return () => {
      alive = false;
    };
  }, [
    mediaType,
    listPreset,
    q,
    genre,
    year,
    industry,
    ott,
    minRating,
    sort,
    page,
  ]);

  const reset = () => {
    setListPreset('');
    setGenre('');
    setYear('');
    setIndustry('');
    setOtt('');
    setMinRating('');
    setSort('popularity');
    setSearchInput('');
    setMatchedPerson(null);
    setPage(1);
    nav(`/browse/${canonicalBrowseSegment}`);
    notifyPatch({
      type: 'info',
      title: 'Filters Reset',
      message: 'Showing all catalog titles.',
      duration: 2400,
    });
  };

  const handleInlineSearch = (e) => {
    e.preventDefault();
    const cleaned = sanitizeText(searchInput.trim(), 120);
    setPage(1);
    syncCleanBrowseUrl({ q: cleaned });
  };

  const genreName = resolveGenreName(genre, mediaType);
  const industryLabel = INDUSTRY_LIST.find((i) => i.key === industry)?.label;
  const ottLabel = OTT_LIST.find((o) => o.key === ott)?.label;
  const hasActiveFilters = Boolean(
    q || listPreset || genre || year || industry || ott || minRating,
  );

  const titleLabel = q
    ? matchedPerson?.name
      ? `Movies & Series featuring ${matchedPerson.name}`
      : `Search results for “${q}”`
    : listPreset === 'upcoming'
      ? 'Upcoming Releases & Theatrical Calendar'
      : listPreset === 'trending'
        ? 'Trending This Week'
        : genreName
          ? `${genreName} ${
              mediaType === 'webseries'
                ? 'Web Series'
                : mediaType === 'tv'
                  ? 'TV Shows'
                  : 'Movies'
            }`
          : industry
            ? `${industryLabel || industry} ${
                mediaType === 'webseries'
                  ? 'Web Series'
                  : mediaType === 'tv'
                    ? 'TV Shows'
                    : 'Movies'
              }`
            : ott
              ? `${
                  mediaType === 'webseries'
                    ? 'Web Series'
                    : mediaType === 'tv'
                      ? 'TV Shows'
                      : 'Movies'
                } on ${ottLabel || ott}`
              : mediaType === 'webseries'
                ? 'Web Series (OTT Originals)'
                : mediaType === 'tv'
                  ? 'TV Shows Catalog'
                  : 'Movies Catalog';

  if (loading && !hasLoadedOnce) {
    return <BrowsePageSkeleton />;
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6'>
      {/* Header + Format Tabs */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2 text-xs font-bold text-brand uppercase'>
            <Sparkles size={13} /> Discover & Filter
          </div>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className='mt-1 text-2xl font-extrabold sm:text-3xl'
          >
            {titleLabel}
          </h1>
          <p className='mt-1 text-xs text-zinc-400'>
            Showing {items.length} of {totalResults.toLocaleString()} titles
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2.5'>
          {/* Quick Inline Search Bar */}
          <form
            onSubmit={handleInlineSearch}
            className='relative flex items-center'
          >
            <Search
              size={14}
              className='pointer-events-none absolute left-3 text-zinc-400'
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Search title, actor, director...'
              className='w-52 rounded-full border border-white/10 bg-[#0e131f] py-1.5 pr-16 pl-8 text-xs text-white focus:border-brand focus:outline-none sm:w-60'
            />
            <button
              type='submit'
              className='cursor-pointer absolute right-1 rounded-full bg-brand px-3 py-1 text-[11px] font-extrabold text-black hover:brightness-110'
            >
              Find
            </button>
          </form>

          {/* Clearly Differentiated Plural Browse Tabs: /browse/movies, /browse/web-series, /browse/tv-shows */}
          <div className='flex rounded-full border border-white/10 bg-[#0e131f] p-1'>
            {[
              { key: 'movie', label: '🎬 Movies' },
              { key: 'webseries', label: '🔥 Web Series' },
              { key: 'tv', label: '📺 TV Shows' },
            ].map((t) => (
              <button
                key={t.key}
                type='button'
                onClick={() => {
                  setMediaType(t.key);
                  setGenre('');
                  setPage(1);
                  syncCleanBrowseUrl({ mediaType: t.key, genre: '' });
                }}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  mediaType === t.key
                    ? 'bg-brand text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matched Actor / Director Profile Banner when searching for a person */}
      {!loading && q && matchedPerson?.name && (
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-brand/30 bg-gradient-to-r from-[#0e131f] via-[#131b2e] to-[#0e131f] p-4 shadow-xl sm:p-5'>
          <div className='flex items-center gap-4'>
            <div className='h-16 w-14 shrink-0 overflow-hidden rounded-2xl border border-brand/50 bg-zinc-950 shadow-md'>
              <SafeImage
                src={matchedPerson.profileUrl}
                alt={matchedPerson.name}
                size='w185'
                variant='poster'
                className='h-full w-full object-cover object-center'
              />
            </div>
            <div>
              <span className='inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-brand uppercase'>
                <UserCheck size={11} /> Verified{' '}
                {matchedPerson.knownForDepartment || 'Cast & Crew'} Match
              </span>
              <h2 className='mt-1 text-base font-extrabold text-white sm:text-lg'>
                {matchedPerson.name}
              </h2>
              <p className='text-xs text-zinc-400'>
                Showing verified titles where {matchedPerson.name} appears in
                Cast or Crew
              </p>
            </div>
          </div>

          <Link
            to={getPersonPath(matchedPerson, matchedPerson.id, matchedPerson.gender)}
            className='inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-extrabold text-black shadow-md transition hover:brightness-105'
          >
            Full Filmography & Biography <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Custom Dropdown Filter Bar */}
      <div className='mb-6 rounded-3xl border border-white/10 bg-[#0e131f] p-4 shadow-xl sm:p-5'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7'>
          <CustomSelect
            label='Collection / List'
            value={listPreset}
            onChange={(v) => {
              setListPreset(v);
              setPage(1);
              syncCleanBrowseUrl({ list: v });
            }}
            options={LIST_PRESETS}
          />

          <CustomSelect
            label='Cinema Industry'
            value={industry}
            onChange={(v) => {
              setIndustry(v);
              setPage(1);
              syncCleanBrowseUrl({ industry: v });
            }}
            options={[
              { value: '', label: 'All Industries' },
              ...INDUSTRY_LIST.map((i) => ({
                value: i.key,
                label: i.label,
                emoji: i.emoji,
              })),
            ]}
          />

          <CustomSelect
            label='OTT Platform'
            value={ott}
            onChange={(v) => {
              setOtt(v);
              setPage(1);
              syncCleanBrowseUrl({ ott: v });
            }}
            options={[
              { value: '', label: 'All OTT Platforms' },
              ...OTT_LIST.map((o) => ({ value: o.key, label: o.label })),
            ]}
          />

          <CustomSelect
            label='Genre'
            value={genre}
            onChange={(v) => {
              setGenre(v);
              setPage(1);
              syncCleanBrowseUrl({ genre: v });
            }}
            options={[
              { value: '', label: 'All Genres' },
              ...Object.keys(genreMap).map((name) => ({
                value: toGenreSlug(name),
                label: name,
              })),
            ]}
          />

          <CustomSelect
            label='Release Year'
            value={year}
            onChange={(v) => {
              setYear(v);
              setPage(1);
              syncCleanBrowseUrl({ year: v });
            }}
            searchable
            options={[
              { value: '', label: 'All Years' },
              ...YEARS.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />

          <CustomSelect
            label='Minimum Rating'
            value={minRating}
            onChange={(v) => {
              setMinRating(v);
              setPage(1);
              syncCleanBrowseUrl({ minRating: v });
            }}
            options={[
              { value: '', label: 'Any Rating' },
              ...[9, 8, 7, 6, 5].map((r) => ({
                value: String(r),
                label: `★ ${r}+ & Above`,
              })),
            ]}
          />

          <CustomSelect
            label='Sort By'
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
              syncCleanBrowseUrl({ sort: v });
            }}
            options={SORTS}
          />
        </div>

        <div className='mt-4 flex items-center justify-between border-t border-white/10 pt-3'>
          <div className='no-scrollbar flex gap-2 overflow-x-auto'>
            {OTT_LIST.slice(0, 7).map((o) => (
              <button
                key={o.key}
                type='button'
                onClick={() => {
                  const nextOtt = ott === o.key ? '' : o.key;
                  setOtt(nextOtt);
                  setPage(1);
                  syncCleanBrowseUrl({ ott: nextOtt });
                }}
                className={`cursor-pointer shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                  ott === o.key
                    ? 'border-brand bg-brand text-black'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            type='button'
            onClick={reset}
            className='cursor-pointer flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white'
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>
      </div>

      {/* Active Search / Filter Status Information Patch */}
      {!loading && hasActiveFilters && items.length > 0 && (
        <InfoPatch
          compact
          type='info'
          title={
            q
              ? matchedPerson?.name
                ? `Found ${totalResults.toLocaleString()} verified titles with ${matchedPerson.name} in Cast or Crew`
                : `Found ${totalResults.toLocaleString()} matching titles for "${q}"`
              : `Filtered View Active (${totalResults.toLocaleString()} matching titles)`
          }
          message={
            [
              industryLabel && `Industry: ${industryLabel}`,
              ottLabel && `OTT: ${ottLabel}`,
              genreName && `Genre: ${genreName}`,
              year && `Year: ${year}`,
              minRating && `Rating: ★ ${minRating}+`,
            ]
              .filter(Boolean)
              .join(' • ') ||
            'Select any card below to view full details, trailers, cast, and box office.'
          }
          actions={[
            {
              label: 'Clear All Filters',
              onClick: reset,
            },
          ]}
          className='mb-6'
        />
      )}

      {fetchError && (
        <InfoPatch
          type='error'
          title='Could Not Load Catalog Titles'
          message={fetchError}
          actions={[
            {
              label: 'Retry Now',
              primary: true,
              onClick: () => setPage(1),
            },
            {
              label: 'Reset Filters',
              onClick: reset,
            },
          ]}
          className='mb-6'
        />
      )}

      {/* Results Grid or Rich Not Found Information Patch */}
      {loading ? (
        <BrowseGridSkeleton count={18} />
      ) : items.length === 0 ? (
        <InfoPatch
          type='not-found'
          title={
            q
              ? `No Titles Found for "${q}"`
              : 'No Titles Matched Your Selected Filters'
          }
          message={
            q
              ? `We searched the catalog for "${q}" in ${mediaType === 'webseries' ? 'Web Series' : mediaType === 'tv' ? 'TV Shows' : 'Movies'} and found no matches. Try checking the spelling, switching the format tab above, or resetting active filters.`
              : 'Try resetting one or more filters (Industry, OTT Platform, Genre, Release Year, or Minimum Rating) to see available releases.'
          }
          subtitle='Tip: You can also browse streaming originals across Netflix, Prime Video, JioHotstar, ZEE5, and SonyLIV in the Master OTT Hub.'
          actions={[
            {
              label: 'Reset All Filters',
              primary: true,
              onClick: reset,
            },
            {
              label: 'Open Master OTT Hub',
              onClick: () => nav('/ott'),
            },
          ]}
        />
      ) : (
        <>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {items.map((it) => (
              <MovieCard
                key={`${it.type || mediaType}-${it.id}`}
                item={it}
                type={mediaType}
              />
            ))}
          </div>

          <div className='mt-10 flex items-center justify-center gap-3 text-xs'>
            <button
              type='button'
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className='cursor-pointer rounded-full border border-white/15 bg-[#0e131f] px-5 py-2.5 font-bold hover:border-brand disabled:opacity-40'
            >
              ← Previous
            </button>
            <span className='rounded-full bg-white/5 px-4 py-2 font-semibold text-zinc-300'>
              Page {page} of {totalPages}
            </span>
            <button
              type='button'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className='cursor-pointer rounded-full border border-white/15 bg-[#0e131f] px-5 py-2.5 font-bold hover:border-brand disabled:opacity-40'
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
