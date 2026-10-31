import { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { ArrowLeft, Film, Tv, Sparkles, MapPin, Calendar } from 'lucide-react';
import { tmdb } from '../services/api';
import MovieCard from '../components/MovieCard';
import SafeImage from '../components/ui/SafeImage';
import InfoPatch from '../components/ui/InfoPatch';
import { PersonSkeleton } from '../components/ui/Skeletons';
import {
  getPersonPath,
  parsePersonSlugToName,
  resolvePersonRoleSegment,
  resolvePersonSlugMapping,
} from '../utils/formatters';

export default function Person() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const mappedSlugInfo = resolvePersonSlugMapping(name || '');
  const personId = searchParams.get('id') || mappedSlugInfo?.id || null;
  const nav = useNavigate();
  const location = useLocation();

  // Convert hyphenated slug ("Shiva-Rajkumar") or URL-encoded spaces ("Shiva%20Rajkumar") into clean display/search name ("Shiva Rajkumar")
  const decodedName = parsePersonSlugToName(name || '');
  const [data, setData] = useState(() => tmdb.peekPerson(decodedName, personId));
  const [loading, setLoading] = useState(() => !tmdb.peekPerson(decodedName, personId));
  const [filter, setFilter] = useState('all');

  // Immediately normalize `/person/Shiva%20Rajkumar` -> `/actor/Shiva-Rajkumar` or `/actoress/Deepika-Padukone` on mount
  useEffect(() => {
    if (!decodedName) return;
    const initialPath = getPersonPath({ name: decodedName, id: personId }, personId);
    const currentFull = `${location.pathname}${location.search}`;
    if (
      location.pathname.startsWith('/person/') ||
      location.pathname.includes('%20') ||
      location.pathname.includes(' ')
    ) {
      if (currentFull !== initialPath) {
        nav(initialPath, { replace: true });
      }
    }
  }, [decodedName, personId, location.pathname, location.search, nav]);

  useEffect(() => {
    const cached = tmdb.peekPerson(decodedName, personId);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      window.scrollTo(0, 0);
      setLoading(true);
    }
    tmdb
      .person(decodedName, personId)
      .then((res) => {
        setData(res);
        const resolvedPerson = res?.person || { name: decodedName };
        const roleLabel =
          resolvePersonRoleSegment(resolvedPerson) === 'actoress'
            ? 'Actoress'
            : 'Actor';
        document.title = `${resolvedPerson.name || decodedName} (${roleLabel}) — Movies, Web Series & TV Shows Filmography | Movies Hub`;

        // Keep the exact same name slug (`decodedName`) so `:name` never changes (zero loop!),
        // while updating the URL role segment (`/actor/...` <-> `/actoress/...`) to match the person's gender/biography!
        const canonicalRoleUrl = getPersonPath(
          { ...resolvedPerson, name: decodedName },
          resolvedPerson.id || personId,
          resolvedPerson.gender,
        );
        if (canonicalRoleUrl && window.location.pathname !== canonicalRoleUrl) {
          nav(`${canonicalRoleUrl}${window.location.search || ''}`, { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [decodedName, personId, nav]);

  if (loading) {
    return <PersonSkeleton />;
  }

  const person = data?.person || {
    name: decodedName,
    knownForDepartment: 'Acting',
  };
  const roleSegment = resolvePersonRoleSegment(person);
  const allItems = data?.items || [];
  const filtered = allItems.filter((it) => {
    const isWebSeries = Boolean(it.isWebSeries || it.subType === 'webseries');
    if (filter === 'movie') return (it.type || 'movie') === 'movie';
    if (filter === 'webseries') return isWebSeries;
    if (filter === 'tv') return it.type === 'tv' && !isWebSeries;
    return true;
  });

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6'>
      <button
        type='button'
        onClick={() => nav(-1)}
        className='mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white'
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Actor / Actoress Profile Hero Card */}
      <div className='mb-8 flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0e131f] p-6 sm:flex-row sm:items-start sm:p-8'>
        {person.profileUrl && (
          <div className='aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-[#f5b942]/50 bg-zinc-950 shadow-2xl sm:w-48'>
            <SafeImage
              src={person.profileUrl}
              alt={person.name}
              size='h632'
              variant='poster'
              className='h-full w-full object-contain object-center'
            />
          </div>
        )}

        <div className='flex-1 text-center sm:text-left'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-[#f5b942]/15 px-3 py-1 text-xs font-bold text-[#f5b942]'>
            <Sparkles size={12} />{' '}
            {roleSegment === 'actoress'
              ? 'Actoress'
              : person.knownForDepartment &&
                  person.knownForDepartment !== 'Acting'
                ? person.knownForDepartment
                : 'Actor'}
          </span>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className='mt-2 text-2xl font-extrabold text-white sm:text-4xl'
          >
            {person.name}
          </h1>

          <div className='mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 sm:justify-start'>
            <span>🎬 {allItems.length} Titles in Catalog</span>
            {person.birthday && (
              <span className='flex items-center gap-1'>
                <Calendar size={13} /> Born: {person.birthday}
              </span>
            )}
            {person.placeOfBirth && (
              <span className='flex items-center gap-1'>
                <MapPin size={13} /> {person.placeOfBirth}
              </span>
            )}
          </div>

          {person.biography && (
            <p className='mt-4 line-clamp-4 max-w-3xl text-xs leading-relaxed text-zinc-300 sm:text-sm'>
              {person.biography}
            </p>
          )}
        </div>
      </div>

      {/* Filter Tabs — Clearly Differentiating Movies, Web Series, and TV Shows */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <h2
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-xl font-extrabold'
        >
          Available Filmography ({filtered.length})
        </h2>
        <div className='flex flex-wrap gap-2'>
          {[
            { key: 'all', label: `All (${allItems.length})` },
            { key: 'movie', label: '🎬 Movies', icon: Film },
            { key: 'webseries', label: '🔥 Web Series', icon: Tv },
            { key: 'tv', label: '📺 TV Shows', icon: Tv },
          ].map((tab) => (
            <button
              key={tab.key}
              type='button'
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === tab.key
                  ? 'bg-[#f5b942] text-black'
                  : 'border border-white/10 bg-[#0e131f] text-zinc-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <InfoPatch
          type='not-found'
          title={`No ${
            filter === 'movie'
              ? 'Movies'
              : filter === 'webseries'
                ? 'Web Series'
                : filter === 'tv'
                  ? 'TV Shows'
                  : 'Titles'
          } Found for ${person.name}`}
          message='Try switching the filter tab to All Titles or browse the main catalog.'
          actions={[
            ...(filter !== 'all'
              ? [
                  {
                    label: `Show All (${allItems.length})`,
                    primary: true,
                    onClick: () => setFilter('all'),
                  },
                ]
              : []),
            {
              label: 'Browse Catalog',
              onClick: () => nav('/browse/movies'),
            },
          ]}
        />
      ) : (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
          {filtered.map((it) => (
            <MovieCard
              key={`${it.type}-${it.id}`}
              item={it}
              type={it.isWebSeries || it.subType === 'webseries' ? 'webseries' : it.type}
            />
          ))}
        </div>
      )}
    </div>
  );
}
