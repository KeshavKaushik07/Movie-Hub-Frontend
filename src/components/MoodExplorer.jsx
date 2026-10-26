import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { tmdb } from '../services/api';
import { resolveGenreId, toBrowseTypeSlug } from '../config/constants';
import MovieCard from './MovieCard';

const MOODS = [
  {
    key: 'adrenaline',
    emoji: '🔥',
    title: 'Adrenaline Rush',
    sub: 'Action & Explosive Thrills',
    type: 'movie',
    params: { genre: 'action', sort: 'popularity' },
  },
  {
    key: 'mind-bending',
    emoji: '🧠',
    title: 'Mind-Bending',
    sub: 'Sci-Fi & Mystery Twists',
    type: 'movie',
    params: { genre: 'sci-fi', sort: 'rating' },
  },
  {
    key: 'feel-good',
    emoji: '😂',
    title: 'Feel-Good & Laughs',
    sub: 'Comedy & Lighthearted Fun',
    type: 'movie',
    params: { genre: 'comedy', sort: 'popularity' },
  },
  {
    key: 'thriller',
    emoji: '🕵️',
    title: 'Dark & Gritty',
    sub: 'Crime & Edge-of-Seat Suspense',
    type: 'movie',
    params: { genre: 'thriller', sort: 'popularity' },
  },
  {
    key: 'romance',
    emoji: '❤️',
    title: 'Romantic Evening',
    sub: 'Love Stories & Musicals',
    type: 'movie',
    params: { genre: 'romance', sort: 'popularity' },
  },
  {
    key: 'desi-mass',
    emoji: '🇮🇳',
    title: 'Desi Mass Entertainer',
    sub: 'Bollywood & South Blockbusters',
    type: 'movie',
    params: { industry: 'bollywood', sort: 'popularity' },
  },
  {
    key: 'binge-series',
    emoji: '📺',
    title: 'Weekend OTT Binge',
    sub: 'Top Web Series & Originals',
    type: 'webseries',
    params: { sort: 'popularity' },
  },
  {
    key: 'chills',
    emoji: '👻',
    title: 'Late-Night Chills',
    sub: 'Horror & Supernatural',
    type: 'movie',
    params: { genre: 'horror', sort: 'popularity' },
  },
];

/**
 * MoodExplorer — Displays all 8 Moods in a stacked multi-row grid on mobile & desktop
 * (NEVER requires horizontal x-axis scrolling to pick a mood!).
 */
export default function MoodExplorer() {
  const [selected, setSelected] = useState(MOODS[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const apiParams = {
      ...selected.params,
      genre: selected.params.genre
        ? resolveGenreId(selected.params.genre, selected.type)
        : undefined,
      limit: 12,
    };
    tmdb
      .discover(selected.type, apiParams)
      .then((res) => {
        if (alive) {
          setItems((res?.items || res?.results || []).slice(0, 12));
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selected]);

  const seeAllHref =
    selected.type === 'webseries'
      ? '/browse/web-series'
      : `/browse/${toBrowseTypeSlug(selected.type)}?${new URLSearchParams(selected.params).toString()}`;

  return (
    <section className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
      <div className="rounded-3xl border border-white/10 bg-[#0e131f] p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Sparkles size={18} />
            </span>
            <div>
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-base font-extrabold sm:text-xl"
              >
                Watch by Your Mood Tonight
              </h2>
              <p className="text-[11px] text-zinc-400">
                Tap any mood tile below to instantly load matching movies & web series
              </p>
            </div>
          </div>

          <Link
            to={seeAllHref}
            className="flex items-center gap-1 rounded-full bg-brand/15 px-3.5 py-1.5 text-xs font-extrabold text-brand hover:bg-brand hover:text-black"
          >
            <span>See All {selected.title}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Stacked Multi-Row Grid on Mobile (2 cols on mobile, 4 cols on tablet/desktop — NO X-Axis Scroll!) */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {MOODS.map((m) => {
            const active = selected.key === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelected(m)}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                  active
                    ? 'border-brand bg-brand/15 shadow-md shadow-brand/10'
                    : 'border-white/10 bg-white/3 hover:bg-white/10'
                }`}
              >
                <span className="text-xl sm:text-2xl">{m.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-extrabold ${active ? 'text-brand' : 'text-white'}`}>
                    {m.title}
                  </p>
                  <p className="truncate text-[10px] text-zinc-400">{m.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Matching Mood Results */}
        <div className="mt-5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : items.length > 0 ? (
            <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-2">
              {items.map((it) => (
                <MovieCard key={`${selected.key}-${it.id}`} item={it} type={selected.type} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
