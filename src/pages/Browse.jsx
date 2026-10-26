import { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  useNavigate,
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
} from '../config/constants';
import MovieCard from '../components/MovieCard';
import CustomSelect from '../components/ui/CustomSelect';
import InfoPatch from '../components/ui/InfoPatch';
import SafeImage from '../components/ui/SafeImage';
import { getPersonPath } from '../utils/formatters';
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
  const { type = 'movie' } = useParams();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();

  const [mediaType, setMediaType] = useState(type);
  const [listPreset, setListPreset] = useState(params.get('list') || '');
  const [genre, setGenre] = useState(params.get('genre') || '');
  const [year, setYear] = useState(params.get('year') || '');
  const [industry, setIndustry] = useState(params.get('industry') || '');
  const [ott, setOtt] = useState(params.get('ott') || '');
  const [minRating, setMinRating] = useState(params.get('minRating') || '');
  const [sort, setSort] = useState(params.get('sort') || 'popularity');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [matchedPerson, setMatchedPerson] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const q = sanitizeText(params.get('q') || '', 120);
  const [searchInput, setSearchInput] = useState(q);
  const genreMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;

  useEffect(() => {
    setMediaType(type);
    setListPreset(params.get('list') || '');
    setGenre(params.get('genre') || '');
    setYear(params.get('year') || '');
    setIndustry(params.get('industry') || '');
    setOtt(params.get('ott') || '');
    setMinRating(params.get('minRating') || '');
    setSort(params.get('sort') || 'popularity');
    setSearchInput(sanitizeText(params.get('q') || '', 120));
    setPage(1);
  }, [type, params]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFetchError('');
    if (!q) setMatchedPerson(null);

    const filterParams = {
      page,
      sort,
      genre: genre || undefined,
      year: year || undefined,
      industry: industry || undefined,
      ott: ott || undefined,
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
        const list = d?.results || d?.items || [];
        setItems(list);
        setMatchedPerson(q ? d?.matchedPerson || null : null);
        setTotalPages(Math.min(d?.total_pages || d?.totalPages || 1, 500));
        setTotalResults(d?.total_results || d?.total || list.length);
        setLoading(false);

        if (page === 1 && q) {
          if (list.length === 0) {
            notifyPatch({
              type: 'not-found',
              title: 'No Matching Titles Found',
              message: `No movies or web series matched "${q}".`,
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
    setParams({});
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
    const next = new URLSearchParams(params);
    if (cleaned) next.set('q', cleaned);
    else next.delete('q');
    setParams(next);
  };

  const genreName = Object.entries(genreMap).find(
    ([, id]) => String(id) === String(genre),
  )?.[0];
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
      ? 'Upcoming Movies & Theatrical Calendar'
      : listPreset === 'trending'
        ? 'Trending This Week'
        : industry
          ? `${industryLabel || industry} Catalog`
          : ott
            ? `Streaming on ${ottLabel || ott}`
            : mediaType === 'webseries'
              ? 'Web Series (OTT Originals)'
              : mediaType === 'tv'
                ? 'TV Shows Catalog'
                : 'Movies Catalog';

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
            }}
            options={LIST_PRESETS}
          />

          <CustomSelect
            label='Cinema Industry'
            value={industry}
            onChange={(v) => {
              setIndustry(v);
              setPage(1);
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
            }}
            options={[
              { value: '', label: 'All Genres' },
              ...Object.entries(genreMap).map(([name, id]) => ({
                value: String(id),
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
                  setOtt(ott === o.key ? '' : o.key);
                  setPage(1);
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
        <div className='flex h-60 items-center justify-center'>
          <div className='h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent' />
        </div>
      ) : items.length === 0 ? (
        <InfoPatch
          type='not-found'
          title={
            q
              ? `No Movies or Web Series Found for "${q}"`
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
