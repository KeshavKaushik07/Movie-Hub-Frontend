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
import { getMovieFinancials, getTitlePath } from '../utils/formatters';

const AUTO_SLIDE_MS = 6500;
const MANUAL_HOLD_MS = 40000; // Stay for 40s when user clicks arrow/dot or swipes

export default function Carousel({
  items = [],
  heroSource = 'trending_multi_industry',
}) {
  // Respect all slides provided by backend (10 by default, or Admin's configured heroLimit / unlimited Admin slides)
  const slides = items.filter(
    (it) =>
      it &&
      (it.title || it.name) &&
      (it.backdropUrl || it.backdrop_path || it.posterUrl || it.poster_path),
  );
  const [i, setI] = useState(0);
  const [isManualHold, setIsManualHold] = useState(false);
  const [manualTick, setManualTick] = useState(0);
  const { region } = useSelector((s) => s.preferences);
  const touchStartX = useRef(null);

  useEffect(() => {
    setI(0);
    setIsManualHold(false);
  }, [slides.length]);

  const handleManualSlideChange = (nextIndex) => {
    if (!slides.length) return;
    const normalized =
      ((nextIndex % slides.length) + slides.length) % slides.length;
    setI(normalized);
    setIsManualHold(true);
    setManualTick((t) => t + 1);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const delay = isManualHold ? MANUAL_HOLD_MS : AUTO_SLIDE_MS;
    const t = setTimeout(() => {
      setIsManualHold(false);
      setI((p) => (p + 1) % slides.length);
    }, delay);
    return () => clearTimeout(t);
  }, [i, slides.length, isManualHold, manualTick]);

  if (!slides.length) return null;
  const cur = slides[i] || slides[0];
  const isWebSeries =
    cur.isWebSeries || cur.subType === 'webseries' || cur.type === 'webseries';
  const type = isWebSeries
    ? 'webseries'
    : cur.type || cur.media_type || (cur.first_air_date ? 'tv' : 'movie');

  // Only show disclosed metadata
  const year =
    cur.year || (cur.release_date || cur.first_air_date || '').slice(0, 4);
  const ratingNum = Number(
    cur.siteRating || cur.vote_average || cur.rating || 0,
  );
  const hasRating = ratingNum > 0;
  const backdrop =
    cur.backdropUrl || cur.backdrop_path || cur.posterUrl || cur.poster_path;
  const fin = getMovieFinancials(cur, region);

  const defaultBadgeLabel = cur.isFeaturedSlide
    ? 'Featured'
    : `Trending ${
        isWebSeries ? 'Web Series' : type === 'tv' ? 'TV Show' : 'Movie'
      }`;

  const onTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta =
      (e.changedTouches?.[0]?.clientX ?? touchStartX.current) -
      touchStartX.current;
    if (Math.abs(delta) > 45 && slides.length > 1) {
      if (delta < 0) handleManualSlideChange(i + 1);
      else handleManualSlideChange(i - 1);
    }
    touchStartX.current = null;
  };

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className='relative w-full overflow-hidden bg-[#070a10] text-white transition-colors duration-300 aspect-[16/10] min-h-[340px] sm:aspect-[16/8.5] lg:aspect-[16/7.2] lg:min-h-[580px] xl:min-h-[650px] max-h-[85vh]'
    >
      {/* Full 100% Width & Height Image — No empty left bar and no edge cutting */}
      <div className='absolute inset-0 h-full w-full'>
        <SafeImage
          key={`${cur.id}-${i}`}
          src={backdrop}
          alt={cur.title || cur.name}
          size='original'
          variant='backdrop'
          className='h-full w-full object-cover object-center transition-transform duration-700'
        />
      </div>

      {/* Bottom Vignette so buttons and indicators pop clearly */}
      <div
        style={{
          background:
            'linear-gradient(to top, rgba(7,10,16,0.96) 0%, rgba(7,10,16,0.55) 25%, rgba(7,10,16,0) 58%)',
        }}
        className='absolute inset-0 pointer-events-none'
      />

      {/* Smooth Left-to-Right Dark Gradient Over the Image for Text Readability */}
      <div
        style={{
          background:
            'linear-gradient(to right, rgba(7,10,16,0.92) 0%, rgba(7,10,16,0.72) 28%, rgba(7,10,16,0.25) 55%, rgba(7,10,16,0) 78%)',
        }}
        className='absolute inset-0 pointer-events-none'
      />

      {/* Subtle Right-Edge Vignette */}
      <div
        style={{
          background:
            'linear-gradient(to left, rgba(7,10,16,0.75) 0%, rgba(7,10,16,0) 10%)',
        }}
        className='absolute inset-0 pointer-events-none'
      />

      {/* Layer 4: Foreground Movie Info — Shifted slightly to the right using max-w-[1440px] + generous horizontal padding */}
      <div className='relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col justify-end px-5 pb-4 sm:px-12 sm:pb-8 lg:px-20 lg:pb-12 xl:px-28'>
        <div className='max-w-md sm:max-w-lg lg:max-w-xl space-y-1.5 sm:space-y-3'>
          {/* Metadata Row */}
          <div className='flex flex-wrap items-center gap-1.5 text-[10px] sm:gap-2 sm:text-xs'>
            <span className='inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 font-extrabold text-black uppercase shadow-xs sm:px-3 sm:py-1'>
              <Sparkles size={10} />
              {cur.badgeText || defaultBadgeLabel}
            </span>

            {hasRating && (
              <span className='keep-white flex items-center gap-1 rounded-full border border-white/15 bg-black/75 px-2.5 py-0.5 font-bold text-brand backdrop-blur-md sm:px-3 sm:py-1'>
                <Star size={10} fill='currentColor' /> {ratingNum.toFixed(1)}
              </span>
            )}

            {year && (
              <span className='keep-white rounded-full border border-white/15 bg-black/75 px-2.5 py-0.5 font-semibold text-white backdrop-blur-md sm:px-3 sm:py-1'>
                {year}
              </span>
            )}

            {fin.hasRevenue && (
              <span className='keep-white hidden items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300 backdrop-blur-md sm:inline-flex'>
                {region === 'IN' ? (
                  <IndianRupee size={11} />
                ) : (
                  <DollarSign size={11} />
                )}
                Box Office: {fin.revenueText}
              </span>
            )}

            {fin.verdict && (
              <span className='keep-white hidden rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white uppercase backdrop-blur-md md:inline-block'>
                {fin.verdict}
              </span>
            )}
          </div>

          {/* Movie Title */}
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className='keep-white line-clamp-1 text-xl font-extrabold tracking-tight text-white drop-shadow-lg sm:line-clamp-2 sm:text-4xl lg:text-5xl'
          >
            {cur.title || cur.name}
          </h1>

          {/* Tagline */}
          {cur.tagline && (
            <p className='hidden line-clamp-1 text-xs font-semibold text-brand italic sm:block sm:text-sm'>
              “{cur.tagline}”
            </p>
          )}

          {/* Overview */}
          {cur.overview && (
            <p className='keep-white line-clamp-2 max-w-md text-[11px] leading-relaxed text-slate-200 sm:max-w-lg sm:text-xs lg:text-sm'>
              {cur.overview}
            </p>
          )}

          {/* Action Buttons */}
          <div className='flex flex-wrap items-center justify-between gap-2 pt-1.5 sm:pt-3'>
            <div className='flex items-center gap-2.5 sm:gap-3.5'>
              <Link
                to={getTitlePath(cur, type, 'media')}
                className='inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-extrabold text-black shadow-md shadow-brand/25 transition hover:brightness-110 active:scale-95 sm:px-5 sm:py-2.5 sm:text-xs'
              >
                <Play size={13} fill='currentColor' />
                <span className='sm:hidden'>Trailer</span>
                <span className='hidden sm:inline'>Watch Trailer & Songs</span>
              </Link>

              <Link
                to={getTitlePath(cur, type, 'overview')}
                className='keep-white inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95 sm:px-5 sm:py-2.5 sm:text-xs'
              >
                <Info size={13} />
                <span className='sm:hidden'>Details</span>
                <span className='hidden sm:inline'>
                  {isWebSeries
                    ? 'Web Series Details'
                    : type === 'tv'
                      ? 'TV Show Details'
                      : 'Movie Details'}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators (Left) & Prev/Next Arrows (Right) */}
        <div className='mt-3 flex w-full items-center justify-between sm:mt-6'>
          <div className='flex flex-wrap items-center gap-1.5'>
            {slides.map((s, idx) => (
              <button
                key={`${s.id || idx}-${idx}`}
                type='button'
                onClick={() => handleManualSlideChange(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i
                    ? 'w-6 bg-brand sm:w-7'
                    : 'w-2 bg-white/35 hover:bg-white/65'
                }`}
              />
            ))}
          </div>

          {slides.length > 1 && (
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => handleManualSlideChange(i - 1)}
                aria-label='Previous slide'
                className='keep-white flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md transition hover:bg-white/20 sm:h-9 sm:w-9'
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type='button'
                onClick={() => handleManualSlideChange(i + 1)}
                aria-label='Next slide'
                className='keep-white flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md transition hover:bg-white/20 sm:h-9 sm:w-9'
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
