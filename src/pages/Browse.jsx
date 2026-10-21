import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw, Sparkles } from 'lucide-react';
import { tmdb } from '../services/api';
import { MOVIE_GENRES, TV_GENRES, OTT_LIST, INDUSTRY_LIST } from '../config/constants';
import MovieCard from '../components/MovieCard';
import CustomSelect from '../components/ui/CustomSelect';

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
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
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
    setPage(1);
  }, [type, params]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

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
        setTotalPages(Math.min(d?.total_pages || d?.totalPages || 1, 500));
        setTotalResults(d?.total_results || d?.total || list.length);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [mediaType, listPreset, q, genre, year, industry, ott, minRating, sort, page]);

  const reset = () => {
    setListPreset('');
    setGenre('');
    setYear('');
    setIndustry('');
    setOtt('');
    setMinRating('');
    setSort('popularity');
    setPage(1);
    setParams({});
  };

  const titleLabel = q
    ? `Search results for “${q}”`
    : listPreset === 'upcoming'
      ? 'Upcoming Movies & Theatrical Calendar'
      : listPreset === 'trending'
        ? 'Trending This Week'
        : industry
          ? `${INDUSTRY_LIST.find((i) => i.key === industry)?.label || industry} Catalog`
          : ott
            ? `Streaming on ${OTT_LIST.find((o) => o.key === ott)?.label || ott}`
            : mediaType === 'webseries'
              ? 'Web Series (OTT Originals)'
              : mediaType === 'tv'
                ? 'TV Shows Catalog'
                : 'Movies Catalog';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header + Format Tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#f5b942] uppercase">
            <Sparkles size={13} /> Discover & Filter
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="mt-1 text-2xl font-extrabold sm:text-3xl">
            {titleLabel}
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Showing {items.length} of {totalResults.toLocaleString()} titles
          </p>
        </div>

        <div className="flex rounded-full border border-white/10 bg-[#0e131f] p-1">
          {[
            { key: 'movie', label: '🎬 Movies' },
            { key: 'webseries', label: '🔥 Web Series' },
            { key: 'tv', label: '📺 TV Shows' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setMediaType(t.key);
                setGenre('');
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                mediaType === t.key
                  ? 'bg-[#f5b942] text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modified Custom Dropdown Filter Bar */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-[#0e131f] p-4 shadow-xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <CustomSelect
            label="Collection / List"
            value={listPreset}
            onChange={(v) => {
              setListPreset(v);
              setPage(1);
            }}
            options={LIST_PRESETS}
          />

          <CustomSelect
            label="Cinema Industry"
            value={industry}
            onChange={(v) => {
              setIndustry(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Industries' },
              ...INDUSTRY_LIST.map((i) => ({ value: i.key, label: i.label, emoji: i.emoji })),
            ]}
          />

          <CustomSelect
            label="OTT Platform"
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
            label="Genre"
            value={genre}
            onChange={(v) => {
              setGenre(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Genres' },
              ...Object.entries(genreMap).map(([name, id]) => ({ value: String(id), label: name })),
            ]}
          />

          <CustomSelect
            label="Release Year"
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
            label="Minimum Rating"
            value={minRating}
            onChange={(v) => {
              setMinRating(v);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Any Rating' },
              ...[9, 8, 7, 6, 5].map((r) => ({ value: String(r), label: `★ ${r}+ & Above` })),
            ]}
          />

          <CustomSelect
            label="Sort By"
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={SORTS}
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {OTT_LIST.slice(0, 7).map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  setOtt(ott === o.key ? '' : o.key);
                  setPage(1);
                }}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                  ott === o.key
                    ? 'border-[#f5b942] bg-[#f5b942] text-black'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={reset}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0e131f] p-12 text-center text-sm text-zinc-400">
          No titles matched your filter criteria. Try resetting one or more filters above.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((it) => (
              <MovieCard key={`${it.type || mediaType}-${it.id}`} item={it} type={mediaType} />
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-white/15 bg-[#0e131f] px-5 py-2.5 font-bold hover:border-[#f5b942] disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="rounded-full bg-white/5 px-4 py-2 font-semibold text-zinc-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-white/15 bg-[#0e131f] px-5 py-2.5 font-bold hover:border-[#f5b942] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
