import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import SafeImage from './ui/SafeImage';
import { getMovieFinancials } from '../utils/formatters';

export default function MovieCard({ item, type }) {
  const { region } = useSelector((s) => s.preferences);
  const mediaType =
    type === 'webseries'
      ? 'tv'
      : type ||
        item.type ||
        item.media_type ||
        (item.first_air_date ? 'tv' : 'movie');
  const isWebSeries =
    item.isWebSeries || item.subType === 'webseries' || type === 'webseries';
  const title = item.title || item.name || 'Untitled';
  const year =
    item.year ||
    (item.release_date || item.first_air_date || '').slice(0, 4) ||
    '2025';
  const rating = Number(
    item.siteRating || item.vote_average || item.rating || 7.2,
  ).toFixed(1);
  const posterSrc = item.posterUrl || item.poster_path;
  const fin = getMovieFinancials(item, region);

  return (
    <Link
      to={`/details/${mediaType}/${item.id}#overview`}
      className='group relative flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] transition duration-300 active:scale-[0.98] hover:-translate-y-1 hover:border-[#f5b942]/50 sm:w-44'
    >
      <div className='relative aspect-[2/3] w-full overflow-hidden bg-zinc-900'>
        <SafeImage
          src={posterSrc}
          alt={title}
          size='w500'
          variant='poster'
          loading='lazy'
          className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
        />
        {Number(rating) > 0 && (
          <span className='keep-white absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-extrabold text-[#f5b942] backdrop-blur-md sm:text-[11px]'>
            <Star size={10} fill='currentColor' /> {rating}
          </span>
        )}
        {isWebSeries && (
          <span className='keep-white absolute top-2 left-2 rounded-md bg-rose-600/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase'>
            Series
          </span>
        )}
        {fin.verdict && (
          <span className='keep-white absolute bottom-2 left-2 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-extrabold text-black'>
            {fin.verdict}
          </span>
        )}
      </div>
      <div className='flex flex-1 flex-col justify-between p-2.5 sm:p-3'>
        <h3 className='truncate text-xs font-bold text-white group-hover:text-[#f5b942] sm:text-sm'>
          {title}
        </h3>
        <div className='mt-1 flex items-center justify-between gap-1 text-[10px] text-zinc-400 sm:text-[11px]'>
          <span>{year}</span>
          <span className='truncate font-extrabold text-emerald-400'>
            {fin.revenueText}
          </span>
        </div>
      </div>
    </Link>
  );
}
