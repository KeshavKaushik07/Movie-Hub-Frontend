import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Star,
  Calendar,
  Clock,
  ArrowLeft,
  Play,
  Bookmark,
  Check,
  Music,
  DollarSign,
  TrendingUp,
  Film,
  Tv,
  Edit3,
  Award,
  Sparkles,
  BookOpen,
  MessageSquare,
  Send,
  IndianRupee,
} from 'lucide-react';
import { tmdb, featuredApi, communityApi } from '../services/api';
import { reviewService } from '../services/reviewService';
import { ROLES } from '../config/constants';
import { getMovieFinancials } from '../utils/formatters';
import MovieRow from '../components/MovieRow';
import Reviews from '../components/Reviews';
import TitleEditorModal from '../components/TitleEditorModal';
import SafeImage from '../components/ui/SafeImage';
import CustomSelect from '../components/ui/CustomSelect';

const VALID_TABS = [
  'overview',
  'media',
  'box-office',
  'seasons',
  'reviews',
  'critics',
  'comments',
  'live-chat',
];

export default function Details() {
  const { type, id } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const { region, currency } = useSelector((s) => s.preferences);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);
  const isSuperAdmin = user?.role === ROLES.SUPERADMIN;
  const isLight = theme === 'light';

  const rawHash = (location.hash || '#overview').replace('#', '').toLowerCase();
  const activeTab = VALID_TABS.includes(rawHash) ? rawHash : 'overview';

  const setTabWithHash = (nextTab) => {
    nav(`${location.pathname}#${nextTab}`, { replace: true });
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoKey, setActiveVideoKey] = useState(null);
  const [watchStatus, setWatchStatus] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [featuredMsg, setFeaturedMsg] = useState('');

  const [movieRoom, setMovieRoom] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');

  const loadDetail = () => {
    setLoading(true);
    tmdb
      .detail(type, id)
      .then((d) => {
        setData(d);
        setActiveVideoKey(null);
        if (d?.seasons?.length) {
          const firstS =
            d.seasons.find((s) => s.seasonNumber > 0) || d.seasons[0];
          if (firstS) setSelectedSeason(firstS.seasonNumber);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadDetail();
  }, [type, id]); // eslint-disable-line

  useEffect(() => {
    if (!data) return;
    const titleName = data.title || data.name || 'Title';
    const yr =
      data.year || (data.release_date || data.first_air_date || '').slice(0, 4);
    const tabLabels = {
      overview: 'Cast, Synopsis & Streaming',
      media: 'Official Trailer, Songs & Videos',
      'box-office': `Budget & Box Office Collection in ${region === 'IN' ? '₹ Rupees' : '$ USD'}`,
      seasons: 'Seasons & Episode Guide',
      reviews: 'Audience Reviews & Ratings',
      critics: 'Verified Critic Reviews',
      comments: 'Fan Discussion & Comments',
      'live-chat': 'Live Fan Chat Room',
    };
    document.title = `${titleName} (${yr}) — ${tabLabels[activeTab] || 'Details'} | Movies Hub`;
  }, [data, activeTab, region]);

  useEffect(() => {
    if (!user) return;
    reviewService.watchlist
      .list()
      .then((items) => {
        const found = items.find((w) => Number(w.tmdbId) === Number(id));
        setWatchStatus(found?.status || '');
      })
      .catch(() => {});
  }, [user, id]);

  useEffect(() => {
    const isSeries =
      type === 'tv' || type === 'webseries' || data?.type === 'tv';
    if (!isSeries || !id || activeTab !== 'seasons') return;
    setSeasonLoading(true);
    tmdb
      .season(id, selectedSeason)
      .then(setSeasonData)
      .catch(() => setSeasonData(null))
      .finally(() => setSeasonLoading(false));
  }, [type, id, selectedSeason, activeTab, data?.type]);

  useEffect(() => {
    if (activeTab !== 'live-chat' || !id) return;
    communityApi
      .getOrCreateMovieRoom(type, id)
      .then((room) => {
        setMovieRoom(room);
        return communityApi.listMessages(room.id);
      })
      .then((res) => {
        setChatMessages(res.messages || []);
      })
      .catch(() => {});
  }, [activeTab, type, id]);

  const sendMovieChat = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !movieRoom) return;
    try {
      const msg = await communityApi.sendMessage(movieRoom.id, {
        text: chatText.trim(),
      });
      setChatMessages((prev) => [...prev, msg]);
      setChatText('');
    } catch {
      /* ignore */
    }
  };

  const handleWatchlist = async (newStatus) => {
    if (!user) return;
    if (!newStatus || newStatus === watchStatus) {
      await reviewService.watchlist.remove(type, id);
      setWatchStatus('');
    } else {
      await reviewService.watchlist.save(type, id, newStatus);
      setWatchStatus(newStatus);
    }
  };

  const handleAddToFeatured = async () => {
    try {
      await featuredApi.add({
        tmdbId: Number(id),
        type: data.subType === 'webseries' ? 'webseries' : type,
        badgeText: 'Featured on Movies Hub',
      });
      setFeaturedMsg('Added to Home Featured Hero Carousel!');
      setTimeout(() => setFeaturedMsg(''), 4000);
    } catch (err) {
      setFeaturedMsg(
        err.response?.data?.message || 'Could not add to Featured',
      );
    }
  };

  if (loading) {
    return (
      <div className='flex h-[70vh] items-center justify-center'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent' />
      </div>
    );
  }
  if (!data)
    return <p className='p-10 text-center text-zinc-400'>Title not found.</p>;

  const title = data.title || data.name;
  const year =
    data.year || (data.release_date || data.first_air_date || '').slice(0, 4);
  const runtime = data.runtime || data.episode_run_time?.[0];
  const rating = Number(
    data.siteRating || data.vote_average || data.rating || 7.5,
  ).toFixed(1);

  const videos = data.videoList || data.videos?.results || [];
  const songs = data.songs || [];
  const defaultTrailer =
    data.trailerKey ||
    videos.find((v) => v.type === 'Trailer')?.key ||
    videos[0]?.key ||
    songs[0]?.youtubeKey;
  const currentVideoKey = activeVideoKey || defaultTrailer;

  const cast = (data.cast || data.credits?.cast || []).slice(0, 16);
  const similar = data.similar?.results || data.similar?.items || [];
  const flatrate = data.watchProviders?.flatrate || [];

  // Complete Rupees (₹ Cr) / USD ($) financials for this movie
  const fin = getMovieFinancials(data, region);
  const isSeries =
    type === 'tv' ||
    type === 'webseries' ||
    data.type === 'tv' ||
    data.isWebSeries;

  return (
    <div className='pb-10'>
      {/* Hero Banner */}
      <div className='hero-keep-white relative min-h-[48vh] w-full overflow-hidden bg-[#070a10]'>
        <SafeImage
          src={
            data.backdropUrl ||
            data.backdrop_path ||
            data.posterUrl ||
            data.poster_path
          }
          alt={title}
          size='w1280'
          variant='backdrop'
          className='absolute inset-0 h-full w-full object-cover opacity-35'
        />
        <div
          style={{
            background:
              'linear-gradient(to top, rgba(7,10,16,0.98) 0%, rgba(7,10,16,0.82) 55%, rgba(7,10,16,0.45) 100%)',
          }}
          className='absolute inset-0'
        />

        <div className='relative z-10 mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-5 pb-8 sm:gap-7 sm:px-6 md:flex-row md:items-end'>
          <div className='relative shrink-0 self-center md:self-end'>
            <SafeImage
              src={data.posterUrl || data.poster_path}
              alt={title}
              size='w500'
              variant='poster'
              className='w-36 rounded-2xl border border-white/15 shadow-2xl sm:w-52'
            />
            {data.isWebSeries && (
              <span className='keep-white absolute top-2.5 left-2.5 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase shadow'>
                Web Series
              </span>
            )}
          </div>

          <div className='flex-1 space-y-3 text-center md:text-left'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <button
                type='button'
                onClick={() => nav(-1)}
                className='keep-white inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25'
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className='flex flex-wrap items-center gap-1.5'>
                {isStaff && (
                  <>
                    <button
                      type='button'
                      onClick={handleAddToFeatured}
                      className='inline-flex items-center gap-1 rounded-full border border-[#f5b942]/40 bg-[#f5b942]/20 px-3 py-1.5 text-[11px] font-bold text-[#f5b942]'
                    >
                      <Sparkles size={12} /> Feature on Home
                    </button>
                    <Link
                      to={`/admin/blogs?tmdbId=${id}&type=${data.subType || type}&title=${encodeURIComponent(title)}`}
                      className='inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-300'
                    >
                      <BookOpen size={12} /> Write Blog
                    </Link>
                  </>
                )}
                {isSuperAdmin && (
                  <button
                    type='button'
                    onClick={() => setEditingTitle(true)}
                    className='inline-flex items-center gap-1 rounded-full bg-[#f5b942] px-3.5 py-1.5 text-[11px] font-extrabold text-black shadow-lg'
                  >
                    <Edit3 size={12} /> Edit Title / ₹
                  </button>
                )}
              </div>
            </div>

            {featuredMsg && (
              <p className='rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300'>
                {featuredMsg}
              </p>
            )}

            <div className='flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-200 md:justify-start'>
              <span className='flex items-center gap-1 rounded-full bg-[#f5b942] px-2.5 py-0.5 font-extrabold text-black'>
                <Star size={12} fill='currentColor' /> {rating}
              </span>
              {data.criticRating > 0 && (
                <span className='flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 font-semibold text-emerald-300'>
                  <Award size={12} /> Critics:{' '}
                  {Number(data.criticRating).toFixed(1)}/10
                </span>
              )}
              {year && (
                <span className='keep-white flex items-center gap-1'>
                  <Calendar size={12} /> {year}
                </span>
              )}
              {runtime && (
                <span className='keep-white flex items-center gap-1'>
                  <Clock size={12} /> {runtime} min
                </span>
              )}
              <span className='rounded-full bg-emerald-500/25 px-2.5 py-0.5 font-extrabold text-emerald-300'>
                {fin.verdict}
              </span>
            </div>

            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className='keep-white text-2xl font-extrabold text-white sm:text-4xl lg:text-5xl'
            >
              {title}
            </h1>
            {data.tagline && (
              <p className='text-xs italic text-[#f5b942] sm:text-sm'>
                “{data.tagline}”
              </p>
            )}

            <div className='flex flex-wrap justify-center gap-1.5 md:justify-start'>
              {(data.genres || []).map((g) => (
                <Link
                  key={g.id || g.name}
                  to={`/browse/${type}?genre=${g.id}`}
                  className='keep-white rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-[#f5b942]'
                >
                  {g.name || g}
                </Link>
              ))}
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2.5 pt-2 md:justify-start'>
              <button
                type='button'
                onClick={() => setTabWithHash('media')}
                className='inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-5 py-2.5 text-xs font-extrabold text-black shadow-lg hover:brightness-110'
              >
                <Play size={15} fill='currentColor' /> Trailer & Songs (
                {videos.length + songs.length})
              </button>

              <button
                type='button'
                onClick={() => setTabWithHash('box-office')}
                className=' inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-xs font-extrabold text-white backdrop-blur-md hover:bg-white/25'
              >
                {region === 'IN' ? (
                  <IndianRupee size={14} className='text-[#f5b942]' />
                ) : (
                  <DollarSign size={14} className='text-[#f5b942]' />
                )}
                <span>
                  Budget: {fin.budgetText} • Gross: {fin.revenueText}
                </span>
              </button>

              {user && (
                <div className='w-48'>
                  <CustomSelect
                    icon={watchStatus ? Check : Bookmark}
                    value={watchStatus}
                    onChange={handleWatchlist}
                    placeholder='+ Watchlist'
                    options={[
                      { value: '', label: '+ Add to Watchlist' },
                      { value: 'planned', label: '📌 Plan to Watch' },
                      { value: 'watching', label: '▶️ Currently Watching' },
                      { value: 'completed', label: '✅ Completed' },
                      { value: 'favorite', label: '❤️ Favorite' },
                      { value: 'dropped', label: '⏹️ Dropped' },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Hash-Routed Navigation Tabs */}
      <div
        className={`sticky top-[53px] z-30 border-b backdrop-blur-xl sm:top-[61px] ${
          isLight
            ? 'border-slate-200 bg-white/95 text-slate-900'
            : 'border-white/10 bg-[#070a10]/95 text-white'
        }`}
      >
        <div className='no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-6'>
          {[
            { id: 'overview', label: 'Overview & Cast', icon: Film },
            {
              id: 'media',
              label: `Trailers & Songs (${videos.length + songs.length})`,
              icon: Music,
            },
            {
              id: 'box-office',
              label: `Box Office (${currency === 'INR' ? '₹' : '$'})`,
              icon: DollarSign,
            },
            ...(isSeries
              ? [
                  {
                    id: 'seasons',
                    label: `Seasons (${data.numberOfSeasons || data.seasons?.length || 1})`,
                    icon: Tv,
                  },
                ]
              : []),
            { id: 'reviews', label: 'Reviews', icon: Star },
            {
              id: 'critics',
              label: `Critics (${data.criticReviews?.length || 0})`,
              icon: Award,
            },
            { id: 'comments', label: 'Comments', icon: MessageSquare },
            { id: 'live-chat', label: 'Live Chat', icon: Sparkles },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type='button'
                onClick={() => setTabWithHash(t.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-xs font-extrabold transition ${
                  activeTab === t.id
                    ? 'border-[#f5b942] text-[#f5b942]'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='space-y-4 md:col-span-2'>
                <h2 className='text-lg font-extrabold'>Storyline & Synopsis</h2>
                <p className='text-sm leading-relaxed text-zinc-300'>
                  {data.overview || 'No synopsis available for this title.'}
                </p>

                {flatrate.length > 0 && (
                  <div className='pt-2'>
                    <h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-400 uppercase'>
                      Streaming On
                    </h3>
                    <div className='flex flex-wrap gap-2.5'>
                      {flatrate.map((p) => (
                        <div
                          key={p.providerId || p.name}
                          className='flex items-center gap-2 rounded-xl border border-white/10 bg-[#0e131f] px-3 py-1.5 text-xs font-medium'
                        >
                          {p.logoUrl && (
                            <SafeImage
                              src={p.logoUrl}
                              alt={p.name}
                              className='h-6 w-6 rounded-md'
                            />
                          )}
                          <span>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial & Credit Summary Box */}
              <div className='space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 text-xs'>
                <h3 className='text-sm font-extrabold text-white'>
                  Key Credits & {region === 'IN' ? '₹' : '$'} Summary
                </h3>
                {data.directors?.length > 0 && (
                  <div>
                    <span className='text-zinc-400'>Director: </span>
                    <div className='mt-1 flex flex-wrap gap-1.5'>
                      {data.directors.map((d) => (
                        <Link
                          key={d}
                          to={`/person/${encodeURIComponent(d)}`}
                          className='rounded-lg bg-[#f5b942]/15 px-2 py-0.5 font-bold text-[#f5b942] hover:underline'
                        >
                          {d}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <div className='flex items-center justify-between border-t border-white/10 pt-2.5'>
                  <span className='text-zinc-400'>
                    Budget ({region === 'IN' ? '₹ INR' : '$ USD'}):
                  </span>
                  <b className='text-sm text-[#f5b942]'>{fin.budgetText}</b>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-zinc-400'>Worldwide Gross:</span>
                  <b className='text-sm text-emerald-400'>{fin.revenueText}</b>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-zinc-400'>India Net Collection:</span>
                  <b className='text-white'>{fin.indiaNetText}</b>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-zinc-400'>Opening Weekend:</span>
                  <b className='text-white'>{fin.openingWeekendText}</b>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-zinc-400'>Trade Verdict:</span>
                  <span className='rounded-md bg-emerald-500/20 px-2 py-0.5 font-extrabold text-emerald-400'>
                    {fin.verdict}
                  </span>
                </div>
              </div>
            </div>

            {cast.length > 0 && (
              <div>
                <h2
                  style={{ fontFamily: 'var(--font-display)' }}
                  className='mb-1 text-lg font-extrabold'
                >
                  Cast & Actors (Tap Any Actor for Full Filmography)
                </h2>
                <p className='mb-3 text-xs text-zinc-400'>
                  Click any actor to view all their movies and web series
                </p>
                <div className='no-scrollbar flex gap-3 overflow-x-auto pb-2'>
                  {cast.map((c) => (
                    <Link
                      key={`${c.id}-${c.name}`}
                      to={`/person/${encodeURIComponent(c.name)}${c.id ? `?id=${c.id}` : ''}`}
                      className='group w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] p-2.5 text-center transition duration-300 active:scale-95 hover:-translate-y-1 hover:border-[#f5b942] sm:w-32'
                    >
                      <div className='mx-auto h-20 w-20 overflow-hidden rounded-full border border-white/10 sm:h-24 sm:w-24'>
                        <SafeImage
                          src={c.profileUrl || c.profilePath || c.profile_path}
                          alt={c.name}
                          size='w342'
                          variant='avatar'
                          className='h-full w-full object-cover transition duration-500 group-hover:scale-110'
                        />
                      </div>
                      <p className='mt-2 truncate text-xs font-bold text-white group-hover:text-[#f5b942]'>
                        {c.name}
                      </p>
                      <p className='truncate text-[10px] text-zinc-400'>
                        {c.character || 'Actor'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className='space-y-8'>
            {currentVideoKey ? (
              <div className='overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl'>
                <iframe
                  key={currentVideoKey}
                  src={`https://www.youtube.com/embed/${currentVideoKey}`}
                  title='Video Player'
                  allowFullScreen
                  className='aspect-video w-full'
                />
              </div>
            ) : (
              <p className='rounded-2xl border border-white/10 bg-[#0e131f] p-8 text-center text-sm text-zinc-400'>
                No trailers or songs available yet.
              </p>
            )}

            {songs.length > 0 && (
              <div>
                <h3 className='mb-3 flex items-center gap-2 text-base font-extrabold text-[#f5b942]'>
                  <Music size={18} /> Official Songs & Soundtrack (
                  {songs.length})
                </h3>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {songs.map((s, idx) => (
                    <button
                      key={s.id || idx}
                      type='button'
                      onClick={() => setActiveVideoKey(s.youtubeKey)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        currentVideoKey === s.youtubeKey
                          ? 'border-[#f5b942] bg-[#f5b942]/15'
                          : 'border-white/10 bg-[#0e131f] hover:border-white/30'
                      }`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${s.youtubeKey}/mqdefault.jpg`}
                        alt={s.title}
                        className='h-14 w-24 shrink-0 rounded-xl object-cover'
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-xs font-bold text-white'>
                          {s.title}
                        </p>
                        {s.artist && (
                          <p className='truncate text-[11px] text-zinc-400'>
                            {s.artist}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h3 className='mb-3 flex items-center gap-2 text-base font-extrabold'>
                  <Film size={18} /> Official Trailers & Videos ({videos.length}
                  )
                </h3>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {videos.map((v) => (
                    <button
                      key={v.key}
                      type='button'
                      onClick={() => setActiveVideoKey(v.key)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        currentVideoKey === v.key
                          ? 'border-[#f5b942] bg-[#f5b942]/15'
                          : 'border-white/10 bg-[#0e131f] hover:border-white/30'
                      }`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                        alt={v.name}
                        className='h-14 w-24 shrink-0 rounded-xl object-cover'
                      />
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-xs font-bold text-white'>
                          {v.name}
                        </p>
                        <p className='text-[10px] text-zinc-400 uppercase'>
                          {v.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GUARANTEED RUPEES (₹ CRORE) BUDGET & BOX OFFICE FOR EVERY MOVIE */}
        {activeTab === 'box-office' && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#f5b942]/30 bg-[#0e131f] p-4 sm:p-5'>
              <div>
                <h2 className='text-base font-extrabold sm:text-lg'>
                  Budget & Box Office Report (
                  {region === 'IN'
                    ? '🇮🇳 Indian Rupees ₹ Crore'
                    : '🌍 US Dollars $'}
                  )
                </h2>
                <p className='text-xs text-zinc-400'>
                  {region === 'IN'
                    ? 'All figures converted & formatted in Indian Rupees (₹ Crore / ₹ Lakh).'
                    : 'All figures formatted in International USD ($ Million / $ Billion).'}
                </p>
              </div>
              <div className='flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2 text-emerald-400'>
                <TrendingUp size={18} />
                <div>
                  <div className='text-[10px] font-bold uppercase'>
                    Verdict ({fin.roiPercent}% ROI)
                  </div>
                  <div className='text-sm font-extrabold'>{fin.verdict}</div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'>
              {[
                {
                  label: 'Production Budget',
                  value: fin.budgetText,
                  sub:
                    region === 'IN'
                      ? fin.usdBudgetSub
                      : 'Total Production Cost',
                },
                {
                  label: 'Worldwide Box Office',
                  value: fin.revenueText,
                  sub:
                    region === 'IN'
                      ? fin.usdRevenueSub
                      : 'Global Theatrical Gross',
                  highlight: true,
                },
                {
                  label: 'India Net Collection',
                  value: fin.indiaNetText,
                  sub: `India Gross: ${fin.indiaGrossText}`,
                },
                {
                  label: 'Opening Weekend',
                  value: fin.openingWeekendText,
                  sub: `Day 1: ${fin.openingDayText}`,
                },
                {
                  label: 'Domestic Collection',
                  value: fin.domesticText,
                  sub: 'Home Market Share',
                },
                {
                  label: 'International Overseas',
                  value: fin.internationalText,
                  sub: 'Overseas Theatrical',
                },
                {
                  label: 'Estimated Net Profit',
                  value: fin.profitText,
                  sub: `ROI: +${fin.roiPercent}%`,
                },
                {
                  label: 'Box Office Status',
                  value: fin.verdict,
                  sub: fin.isEstimated
                    ? 'Estimated Trade Figure'
                    : 'Official Trade Figure',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`rounded-2xl border p-4 sm:p-5 ${
                    card.highlight
                      ? 'border-[#f5b942]/45 bg-[#f5b942]/10'
                      : 'border-white/10 bg-[#0e131f]'
                  }`}
                >
                  <p className='text-[11px] font-semibold text-zinc-400 sm:text-xs'>
                    {card.label}
                  </p>
                  <p className='mt-1.5 text-lg font-extrabold text-white sm:text-2xl'>
                    {card.value}
                  </p>
                  <p className='mt-1 text-[10px] text-zinc-500 sm:text-[11px]'>
                    {card.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'seasons' && isSeries && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <h2 className='text-lg font-extrabold'>
                Seasons & Episode Guide
              </h2>
              <div className='w-56'>
                <CustomSelect
                  value={selectedSeason}
                  onChange={(v) => setSelectedSeason(Number(v))}
                  options={(data.seasons || []).map((s) => ({
                    value: s.seasonNumber,
                    label: `${s.name || `Season ${s.seasonNumber}`} (${s.episodeCount || 0} eps)`,
                  }))}
                />
              </div>
            </div>

            {seasonLoading ? (
              <div className='flex h-40 items-center justify-center'>
                <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent' />
              </div>
            ) : seasonData?.episodes?.length ? (
              <div className='grid gap-3 sm:grid-cols-2'>
                {seasonData.episodes.map((ep) => (
                  <div
                    key={ep.episodeNumber}
                    className='flex gap-3.5 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5'
                  >
                    <SafeImage
                      src={ep.stillUrl || ep.stillPath}
                      alt={ep.name}
                      size='w300'
                      variant='backdrop'
                      className='h-20 w-32 shrink-0 rounded-xl object-cover'
                    />
                    <div className='min-w-0 flex-1'>
                      <span className='text-xs font-bold text-[#f5b942]'>
                        E{ep.episodeNumber} • {ep.name}
                      </span>
                      <p className='mt-1 line-clamp-2 text-xs text-zinc-400'>
                        {ep.overview || 'No episode synopsis available.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-xs text-zinc-400'>
                No episodes found for this season.
              </p>
            )}
          </div>
        )}

        {['reviews', 'critics', 'comments'].includes(activeTab) && (
          <Reviews
            tmdbId={id}
            type={type}
            activeSubTab={
              activeTab === 'critics'
                ? 'critics'
                : activeTab === 'comments'
                  ? 'comments'
                  : 'audience'
            }
          />
        )}

        {activeTab === 'live-chat' && (
          <div className='rounded-3xl border border-white/10 bg-[#0e131f] p-4 sm:p-5'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3'>
              <div>
                <h3 className='text-sm font-extrabold text-white sm:text-base'>
                  🎬 Live Fan Chat Room: {title}
                </h3>
                <p className='text-xs text-zinc-400'>
                  Chat live with other fans watching {title}
                </p>
              </div>
              <Link
                to='/community'
                className='rounded-full bg-[#f5b942]/15 px-3.5 py-1.5 text-xs font-bold text-[#f5b942]'
              >
                Open Community Hub →
              </Link>
            </div>

            <div className='studio-scroll mb-4 max-h-80 space-y-2.5 overflow-y-auto pr-1'>
              {chatMessages.length === 0 ? (
                <p className='py-10 text-center text-xs text-zinc-500'>
                  No messages in this movie room yet — start the conversation
                  below!
                </p>
              ) : (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className='rounded-2xl bg-white/[0.04] p-3 text-xs'
                  >
                    <div className='flex items-center justify-between text-zinc-400'>
                      <b className='text-[#f5b942]'>
                        {m.sender?.name || 'Fan'}
                      </b>
                      <span className='text-[10px]'>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className='mt-1 text-zinc-200'>{m.text}</p>
                  </div>
                ))
              )}
            </div>

            {user ? (
              <form onSubmit={sendMovieChat} className='flex gap-2'>
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={`Message fans of ${title}...`}
                  className='flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white focus:border-[#f5b942] focus:outline-none'
                />
                <button className='flex items-center gap-1.5 rounded-full bg-[#f5b942] px-5 py-2 text-xs font-extrabold text-black'>
                  <Send size={13} /> Send
                </button>
              </form>
            ) : (
              <p className='text-center text-xs text-zinc-400'>
                Please{' '}
                <Link
                  to='/login'
                  className='font-bold text-[#f5b942] underline'
                >
                  log in
                </Link>{' '}
                to send messages in live chat.
              </p>
            )}
          </div>
        )}
      </div>

      <MovieRow
        title={`Similar to ${title}`}
        subtitle='Matched by era, language, director & genres'
        items={similar}
        type={type}
        seeAllTo={`/browse/${type}?genre=${data.genres?.[0]?.id || ''}`}
      />

      {editingTitle && (
        <TitleEditorModal
          title={data}
          onClose={() => setEditingTitle(false)}
          onSaved={(updated) => setData((prev) => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  );
}
