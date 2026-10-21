import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Play,
  Info,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  IndianRupee,
  DollarSign,
} from 'lucide-react';
import SafeImage from './ui/SafeImage';
import { getMovieFinancials } from '../utils/formatters';

export default function Carousel({ items = [], heroSource = 'trending_fallback' }) {
  const slides = items.slice(0, 8);
  const [i, setI] = useState(0);
  const { region } = useSelector((s) => s.preferences);
  const touchStartX = useRef(null);

  useEffect(() => {
    setI(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (!slides.length) return null;
  const cur = slides[i] || slides[0];
  const type =
    cur.subType === 'webseries'
      ? 'tv'
      : cur.type || cur.media_type || (cur.first_air_date ? 'tv' : 'movie');
  const year = cur.year || (cur.release_date || cur.first_air_date || '').slice(0, 4) || '2025';
  const rating = Number(cur.siteRating || cur.vote_average || cur.rating || 7.8).toFixed(1);
  const backdrop = cur.backdropUrl || cur.backdrop_path || cur.posterUrl || cur.poster_path;
  const fin = getMovieFinancials(cur, region);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = (e.changedTouches?.[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (Math.abs(delta) > 45 && slides.length > 1) {
      if (delta < 0) setI((i + 1) % slides.length);
      else setI((i - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
  };

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="hero-keep-white relative h-[480px] w-full overflow-hidden bg-[#070a10] sm:h-[560px] lg:h-[640px]"
    >
      {/* Background Image — Strictly `absolute inset-0` so it NEVER pushes text/buttons down! */}
      <SafeImage
        key={`${cur.id}-${i}`}
        src={backdrop}
        alt={cur.title || cur.name}
        size="w1280"
        variant="backdrop"
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700"
      />

      {/* Cinematic Dark Overlays (Kept dark in both Light & Dark theme so Hero text/buttons pop) */}
      <div
        style={{
          background:
            'linear-gradient(to top, rgba(7,10,16,0.98) 0%, rgba(7,10,16,0.72) 48%, rgba(7,10,16,0.25) 100%)',
        }}
        className="absolute inset-0"
      />
      <div
        style={{
          background:
            'linear-gradient(to right, rgba(7,10,16,0.92) 0%, rgba(7,10,16,0.45) 55%, rgba(7,10,16,0.1) 100%)',
        }}
        className="absolute inset-0"
      />

      {/* Foreground Movie Details & Action Buttons (`relative z-10`) */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-12">
        <div className="max-w-2xl space-y-2.5 sm:space-y-3.5">
          {/* Metadata Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f5b942] px-2.5 py-1 font-extrabold text-black uppercase shadow-md">
              <Sparkles size={11} />
              {cur.badgeText ||
                (heroSource === 'superadmin_featured'
                  ? 'Featured Spotlight'
                  : `Trending ${cur.subType === 'webseries' ? 'Web Series' : type === 'tv' ? 'Series' : 'Movie'}`)}
            </span>

            <span className="keep-white flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 font-bold text-[#f5b942] backdrop-blur-md">
              <Star size={12} fill="currentColor" /> {rating}
            </span>

            <span className="keep-white rounded-full bg-black/65 px-2.5 py-1 font-semibold text-white backdrop-blur-md">
              {year}
            </span>

            <span className="keep-white flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300 backdrop-blur-md">
              {region === 'IN' ? <IndianRupee size={11} /> : <DollarSign size={11} />}
              Box Office: {fin.revenueText}
            </span>

            {fin.verdict && (
              <span className="keep-white hidden rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white uppercase backdrop-blur-md sm:inline-block">
                {fin.verdict}
              </span>
            )}
          </div>

          {/* Movie Title */}
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="keep-white line-clamp-2 text-2xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl"
          >
            {cur.title || cur.name}
          </h1>

          {/* Optional Tagline */}
          {cur.tagline && (
            <p className="line-clamp-1 text-xs font-semibold italic text-[#f5b942] sm:text-sm">
              “{cur.tagline}”
            </p>
          )}

          {/* Movie Overview / Synopsis */}
          <p className="keep-white line-clamp-2 max-w-xl text-xs leading-relaxed text-zinc-200 sm:line-clamp-3 sm:text-sm">
            {cur.overview || 'Explore full cast, official trailers, songs, critic reviews, and box office collections.'}
          </p>

          {/* Primary Action Buttons (Always visible on mobile & desktop) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1.5 sm:gap-3 sm:pt-2">
            <Link
              to={`/details/${type}/${cur.id}#media`}
              className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-4 py-2.5 text-xs font-extrabold text-black shadow-lg shadow-[#f5b942]/30 transition active:scale-95 hover:brightness-110 sm:px-6 sm:py-3 sm:text-sm"
            >
              <Play size={15} fill="currentColor" />
              <span>Watch Trailer & Songs</span>
            </Link>

            <Link
              to={`/details/${type}/${cur.id}#overview`}
              className="keep-white inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2.5 text-xs font-extrabold text-white backdrop-blur-md transition active:scale-95 hover:bg-white/25 sm:px-6 sm:py-3 sm:text-sm"
            >
              <Info size={15} />
              <span>Movie Details & {region === 'IN' ? '₹' : '$'} Box Office</span>
            </Link>
          </div>
        </div>

        {/* Slide Indicators & Prev/Next Arrows */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? 'w-7 bg-[#f5b942]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {slides.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setI((i - 1 + slides.length) % slides.length)}
                aria-label="Previous slide"
                className="keep-white flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md hover:bg-white/20 sm:h-9 sm:w-9"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => setI((i + 1) % slides.length)}
                aria-label="Next slide"
                className="keep-white flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md hover:bg-white/20 sm:h-9 sm:w-9"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
