import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Trophy, Star, ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
import SafeImage from './ui/SafeImage';
import { getTitlePath } from '../utils/formatters';

/**
 * Top10Showcase — A distinctively designed Top 10 Leaderboard component
 * with giant stylized rank numbers (01 - 10) and a smooth toggle between
 * "Top 10 Today" and "Top 10 This Week".
 */
export default function Top10Showcase({ today = [], week = [], region = 'IN' }) {
  const [tab, setTab] = useState('today');
  const scrollRef = useRef(null);

  const list = (tab === 'today' ? today : week).slice(0, 10);
  if (!list.length) return null;

  const slide = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 680, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto my-8 max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-[#0e131f] via-[#131b2e] to-[#090d16] p-5 shadow-2xl sm:p-7">
        {/* Header + Today / Week Switcher */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-amber-500 text-black shadow-lg shadow-brand/25">
              {tab === 'today' ? <Flame size={22} /> : <Trophy size={22} />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
                >
                  Top 10 {tab === 'today' ? 'Today' : 'This Week'} in {region === 'IN' ? 'India 🇮🇳' : 'The World 🌍'}
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Most watched & highest-momentum movies and series ranked live
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Switch Pill */}
            <div className="flex rounded-full border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                onClick={() => setTab('today')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  tab === 'today'
                    ? 'bg-brand text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flame size={13} /> Top 10 Today
              </button>
              <button
                type="button"
                onClick={() => setTab('week')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  tab === 'week'
                    ? 'bg-brand text-black shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Trophy size={13} /> Top 10 This Week
              </button>
            </div>

            <Link
              to="/browse/movie?list=trending"
              className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-brand hover:bg-white/10"
            >
              See All <ArrowRight size={13} />
            </Link>

            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => slide(-1)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => slide(1)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Ranked Cards */}
        <div ref={scrollRef} className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
          {list.map((item, idx) => {
            const rank = idx + 1;
            const type = item.subType === 'webseries' ? 'tv' : item.type || 'movie';
            const rating = Number(item.siteRating || item.vote_average || item.rating || 0).toFixed(1);
            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={getTitlePath(item, type, 'overview')}
                className="group relative flex w-60 shrink-0 items-end sm:w-64"
              >
                {/* Giant Outlined Rank Number */}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    WebkitTextStroke: '2px rgba(245, 185, 66, 0.55)',
                  }}
                  className="pointer-events-none z-10 -mr-5 select-none text-7xl font-black leading-none text-transparent drop-shadow-lg transition-transform duration-300 group-hover:scale-110 sm:text-8xl"
                >
                  {rank}
                </span>

                {/* Card Body */}
                <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f19] shadow-xl transition duration-300 group-hover:-translate-y-1.5 group-hover:border-brand/50">
                  <div className="relative aspect-[2/3] w-full overflow-hidden">
                    <SafeImage
                      src={item.posterUrl || item.poster_path}
                      alt={item.title || item.name}
                      size="w500"
                      variant="poster"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    <div className="keep-white absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-bold text-brand backdrop-blur-md">
                      <Star size={11} fill="currentColor" /> {rating}
                    </div>

                    <span className="keep-white absolute top-2.5 left-2.5 rounded-md bg-brand px-2 py-0.5 text-[10px] font-extrabold text-black uppercase">
                      #{rank}
                    </span>

                    <div className="keep-white absolute right-3 bottom-3 left-3">
                      <p className="truncate text-sm font-bold text-white">{item.title || item.name}</p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-300">
                        <span>{item.year || (item.release_date || '').slice(0, 4) || '2025'}</span>
                        <span className="flex items-center gap-1 font-semibold text-brand">
                          <Play size={11} fill="currentColor" /> Watch
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
