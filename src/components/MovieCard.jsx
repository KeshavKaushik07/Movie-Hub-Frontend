import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import SafeImage from './ui/SafeImage';
import {
  getMovieFinancials,
  getTitlePath,
  isUpcomingRelease,
} from '../utils/formatters';

export default function MovieCard({ item, type }) {
  const { region } = useSelector((s) => s.preferences);
  const isWebSeries = Boolean(
    item.isWebSeries ||
      item.subType === 'webseries' ||
      type === 'webseries' ||
      type === 'web-series',
  );
  const mediaType = isWebSeries
    ? 'webseries'
    : type === 'tv-show' || type === 'tv-shows' || type === 'tv-series'
      ? 'tv'
      : type ||
        item.type ||
        item.media_type ||
        (item.first_air_date ? 'tv' : 'movie');
  const isTvShow = !isWebSeries && mediaType === 'tv';
  const upcoming = isUpcomingRelease(item);

  const title = item.title || item.name || 'Untitled';
  const year =
    item.year || (item.release_date || item.first_air_date || '').slice(0, 4);
  const ratingNum = Number(
    item.siteRating || item.vote_average || item.rating || 0,
  );
  const posterSrc = item.posterUrl || item.poster_path;
  const fin = getMovieFinancials(item, region);

  return (
    <Link
      to={getTitlePath(item, mediaType, 'overview')}
      className="group relative flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] transition duration-300 active:scale-[0.98] hover:-translate-y-1 hover:border-brand/50 sm:w-44"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-zinc-900">
        <SafeImage
          src={posterSrc}
          alt={title}
          size="w500"
          variant="poster"
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {ratingNum > 0 && !upcoming && (
          <span className="keep-white absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-extrabold text-brand backdrop-blur-md sm:text-[11px]">
            <Star size={10} fill="currentColor" /> {ratingNum.toFixed(1)}
          </span>
        )}
        {isWebSeries ? (
          <span className="keep-white absolute top-2 left-2 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
            Web Series
          </span>
        ) : isTvShow ? (
          <span className="keep-white absolute top-2 left-2 rounded-md bg-sky-600/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
            TV Show
          </span>
        ) : upcoming ? (
          <span className="keep-white absolute top-2 left-2 rounded-md bg-amber-500/95 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-black uppercase">
            Upcoming
          </span>
        ) : null}
        {!upcoming && fin.verdict && (
          <span className="keep-white absolute bottom-2 left-2 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-extrabold text-black">
            {fin.verdict}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
        <h3 className="truncate text-xs font-bold text-white group-hover:text-brand sm:text-sm">
          {title}
        </h3>
        <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-zinc-400 sm:text-[11px]">
          <span>
            {year || (isWebSeries ? 'Web Series' : isTvShow ? 'TV Show' : 'Movie')}
          </span>
          {!upcoming && fin.hasRevenue && (
            <span className="truncate font-extrabold text-emerald-400">
              {fin.revenueText}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
