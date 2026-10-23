import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Tv, Sparkles, MapPin, Calendar } from 'lucide-react';
import { tmdb } from '../services/api';
import MovieCard from '../components/MovieCard';
import SafeImage from '../components/ui/SafeImage';

export default function Person() {
  const { name } = useParams();
  const [searchParams] = useSearchParams();
  const personId = searchParams.get('id');
  const nav = useNavigate();

  const decodedName = decodeURIComponent(name || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    tmdb
      .person(decodedName, personId)
      .then((res) => {
        setData(res);
        document.title = `${res?.person?.name || decodedName} — Movies & Web Series Filmography | Movies Hub`;
      })
      .finally(() => setLoading(false));
  }, [decodedName, personId]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent" />
      </div>
    );
  }

  const person = data?.person || { name: decodedName, knownForDepartment: 'Acting' };
  const allItems = data?.items || [];
  const filtered = allItems.filter((it) => {
    if (filter === 'movie') return (it.type || 'movie') === 'movie';
    if (filter === 'series') return it.isWebSeries || it.subType === 'webseries' || it.type === 'tv';
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => nav(-1)}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Actor / Director Profile Hero Card */}
      <div className="mb-8 flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-[#0e131f] p-6 sm:flex-row sm:items-start sm:p-8">
        {person.profileUrl && (
          <div className="aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-[#f5b942]/50 bg-zinc-950 shadow-2xl sm:w-48">
            <SafeImage
              src={person.profileUrl}
              alt={person.name}
              size="h632"
              variant="poster"
              className="h-full w-full object-contain object-center"
            />
          </div>
        )}

        <div className="flex-1 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5b942]/15 px-3 py-1 text-xs font-bold text-[#f5b942]">
            <Sparkles size={12} /> {person.knownForDepartment || 'Acting & Cinema'}
          </span>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="mt-2 text-2xl font-extrabold text-white sm:text-4xl"
          >
            {person.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 sm:justify-start">
            <span>🎬 {allItems.length} Titles in Catalog</span>
            {person.birthday && (
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Born: {person.birthday}
              </span>
            )}
            {person.placeOfBirth && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {person.placeOfBirth}
              </span>
            )}
          </div>

          {person.biography && (
            <p className="mt-4 line-clamp-4 max-w-3xl text-xs leading-relaxed text-zinc-300 sm:text-sm">
              {person.biography}
            </p>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-extrabold">
          Available Movies & Web Series ({filtered.length})
        </h2>
        <div className="flex gap-2">
          {[
            { key: 'all', label: `All (${allItems.length})` },
            { key: 'movie', label: '🎬 Movies', icon: Film },
            { key: 'series', label: '📺 Web Series & TV', icon: Tv },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
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
        <div className="rounded-3xl border border-white/10 bg-[#0e131f] p-12 text-center text-sm text-zinc-400">
          No titles found for {person.name} in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((it) => (
            <MovieCard key={`${it.type}-${it.id}`} item={it} type={it.type} />
          ))}
        </div>
      )}
    </div>
  );
}
