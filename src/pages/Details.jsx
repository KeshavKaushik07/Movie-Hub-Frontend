import { useEffect, useState, useRef } from 'react';
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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Users,
  Clapperboard,
} from 'lucide-react';
import { tmdb, featuredApi, communityApi } from '../services/api';
import { reviewService } from '../services/reviewService';
import { OTT_LIST, ROLES, ROUTES } from '../config/constants';
import { getMovieFinancials, registerSlugMapping } from '../utils/formatters';
import MovieRow from '../components/MovieRow';
import Reviews from '../components/Reviews';
import TitleEditorModal from '../components/TitleEditorModal';
import SafeImage from '../components/ui/SafeImage';
import InfoPatch from '../components/ui/InfoPatch';
import { notifyPatch } from '../utils/notify';
import CustomSelect from '../components/ui/CustomSelect';

const isValidYoutubeKey = (key) =>
  typeof key === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(key.trim());

export default function Details() {
  const { type = 'movie', id } = useParams();
  const location = useLocation();
  const nav = useNavigate();

  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const { region, currency } = useSelector((s) => s.preferences);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);
  const isSuperAdmin = user?.role === ROLES.SUPERADMIN;
  const isLight = theme === 'light';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoKey, setActiveVideoKey] = useState(null);
  const [deadMediaKeys, setDeadMediaKeys] = useState({});
  const [deadActorIds, setDeadActorIds] = useState({});
  const [deadCrewIds, setDeadCrewIds] = useState({});
  const [creditsFilter, setCreditsFilter] = useState('all'); // 'all' | 'cast' | 'crew'
  const castCarouselRef = useRef(null);
  const crewCarouselRef = useRef(null);

  const scrollCarousel = (ref, dir) => {
    if (!ref?.current) return;
    ref.current.scrollBy({ left: dir * 560, behavior: 'smooth' });
  };
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
        if (d) registerSlugMapping(d);
        setActiveVideoKey(null);
        setDeadMediaKeys({});
        setDeadActorIds({});
        setDeadCrewIds({});
        if (d?.seasons?.length) {
          const firstS =
            d.seasons.find((s) => (s.seasonNumber ?? s.season_number) > 0) ||
            d.seasons[0];
          if (firstS)
            setSelectedSeason(firstS.seasonNumber ?? firstS.season_number);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadDetail();
  }, [type, id]); // eslint-disable-line

  const resolvedId =
    data?.id ||
    data?.tmdbId ||
    (Number.isFinite(Number(id)) ? Number(id) : null);
  const resolvedType =
    data?.type === 'tv' || type === 'tv' || type === 'webseries'
      ? 'tv'
      : 'movie';

  // Requirement 1 & 5: Check whether financials & media are actually available
  const fin = getMovieFinancials(data || {}, region);
  const hasFinancialsTab = Boolean(fin.hasFinancials);

  const rawVideos = (data?.videoList || data?.videos?.results || []).filter(
    (v) => v && isValidYoutubeKey(v.key) && !deadMediaKeys[v.key],
  );
  const rawSongs = (data?.songs || []).filter(
    (s) => s && isValidYoutubeKey(s.youtubeKey) && !deadMediaKeys[s.youtubeKey],
  );
  const defaultTrailer =
    (isValidYoutubeKey(data?.trailerKey) && !deadMediaKeys[data?.trailerKey]
      ? data.trailerKey
      : null) ||
    rawVideos.find((v) => v.type === 'Trailer')?.key ||
    rawVideos[0]?.key ||
    rawSongs[0]?.youtubeKey ||
    null;
  const currentVideoKey =
    activeVideoKey && !deadMediaKeys[activeVideoKey]
      ? activeVideoKey
      : defaultTrailer;
  const totalMediaCount =
    rawVideos.length + rawSongs.length || (currentVideoKey ? 1 : 0);
  const hasMediaTab = totalMediaCount > 0;

  const rawHash = (location.hash || '#overview').replace('#', '').toLowerCase();
  const normalizedHash = rawHash === 'critics' ? 'reviews' : rawHash;
  const activeTab =
    normalizedHash === 'box-office' && !hasFinancialsTab
      ? 'overview'
      : normalizedHash === 'media' && !hasMediaTab
        ? 'overview'
        : [
              'overview',
              'media',
              'box-office',
              'seasons',
              'reviews',
              'comments',
              'live-chat',
            ].includes(normalizedHash)
          ? normalizedHash
          : 'overview';

  const setTabWithHash = (nextTab) => {
    nav(`${location.pathname}#${nextTab}`, { replace: true });
  };

  useEffect(() => {
    if (!data) return;
    const titleName = data.title || data.name || 'Title';
    const yr =
      data.year || (data.release_date || data.first_air_date || '').slice(0, 4);
    const tabLabels = {
      overview: 'Cast, Synopsis & Where to Watch',
      media: 'Official Trailer, Songs & Videos',
      'box-office': `Budget & Box Office Collection in ${region === 'IN' ? '₹ Rupees' : '$ USD'}`,
      seasons: 'Seasons & Episode Guide',
      reviews: 'Audience & Verified Critic Reviews',
      comments: 'Fan Discussion & Comments',
      'live-chat': 'Live Fan Chat Room',
    };
    document.title = `${titleName} (${yr}) — ${tabLabels[activeTab] || 'Details'} | Movies Hub`;
  }, [data, activeTab, region]);

  useEffect(() => {
    if (!user || !resolvedId) return;
    reviewService.watchlist
      .list()
      .then((items) => {
        const found = items.find(
          (w) => Number(w.tmdbId) === Number(resolvedId),
        );
        setWatchStatus(found?.status || '');
      })
      .catch(() => {});
  }, [user, resolvedId]);

  useEffect(() => {
    const isSeries =
      type === 'tv' || type === 'webseries' || data?.type === 'tv';
    if (!isSeries || !resolvedId || activeTab !== 'seasons') return;
    setSeasonLoading(true);
    tmdb
      .season(resolvedId, selectedSeason)
      .then(setSeasonData)
      .catch(() => setSeasonData(null))
      .finally(() => setSeasonLoading(false));
  }, [type, resolvedId, selectedSeason, activeTab, data?.type]);

  useEffect(() => {
    if (activeTab !== 'live-chat' || !resolvedId) return;
    communityApi
      .getOrCreateMovieRoom(resolvedType, resolvedId)
      .then((room) => {
        setMovieRoom(room);
        return communityApi.listMessages(room.id);
      })
      .then((res) => {
        setChatMessages(res.messages || []);
      })
      .catch(() => {});
  }, [activeTab, resolvedType, resolvedId]);

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
    if (!user) {
      notifyPatch({
        type: 'warning',
        title: 'Sign In Required',
        message:
          'Please sign in to save movies and web series to your Watchlist.',
      });
      nav(ROUTES.LOGIN);
      return;
    }
    if (!resolvedId) return;
    try {
      if (!newStatus || newStatus === watchStatus) {
        await reviewService.watchlist.remove(resolvedType, resolvedId);
        setWatchStatus('');
        notifyPatch({
          type: 'info',
          title: 'Removed from Watchlist',
          message: `"${data?.title || data?.name || 'Title'}" was removed from your watchlist.`,
        });
      } else {
        await reviewService.watchlist.save(resolvedType, resolvedId, newStatus);
        setWatchStatus(newStatus);
        const statusLabels = {
          planned: 'Plan to Watch',
          watching: 'Currently Watching',
          completed: 'Completed',
          favorite: 'Favorite',
          dropped: 'Dropped',
        };
        const label = statusLabels[newStatus] || 'Watchlist';
        notifyPatch({
          type: 'success',
          title: 'Watchlist Updated',
          message: `"${data?.title || data?.name || 'Title'}" saved under "${label}".`,
        });
      }
    } catch {
      notifyPatch({
        type: 'error',
        title: 'Watchlist Update Failed',
        message: 'Could not update your watchlist right now. Please try again.',
      });
    }
  };

  const handleAddToFeatured = async () => {
    if (!resolvedId) return;
    try {
      await featuredApi.add({
        tmdbId: Number(resolvedId),
        type: data.subType === 'webseries' ? 'webseries' : resolvedType,
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

  // Requirement 5: Auto-detect dead/unavailable YouTube video & song thumbnails
  const handleMediaThumbLoad = (e, ytKey) => {
    if (e?.currentTarget?.naturalWidth && e.currentTarget.naturalWidth <= 120) {
      setDeadMediaKeys((prev) => ({ ...prev, [ytKey]: true }));
    }
  };
  const handleMediaThumbError = (ytKey) => {
    setDeadMediaKeys((prev) => ({ ...prev, [ytKey]: true }));
  };

  if (loading) {
    return (
      <div className='flex h-[70vh] items-center justify-center'>
        <div className='h-10 w-10 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent' />
      </div>
    );
  }
  if (!data) {
    return (
      <div className='mx-auto max-w-4xl px-4 py-14 sm:px-6'>
        <InfoPatch
          type='not-found'
          title='Movie or Web Series Not Found'
          message={`We couldn't find details for "${decodeURIComponent(id || '').replace(/-/g, ' ')}". It may have been moved or is not yet indexed in our catalog.`}
          actions={[
            {
              label: 'Browse Popular Movies',
              primary: true,
              onClick: () => nav('/browse/movie?category=popular'),
            },
            {
              label: 'Explore Master OTT Hub',
              onClick: () => nav('/ott'),
            },
            {
              label: 'Back to Home',
              onClick: () => nav('/'),
            },
          ]}
        />
      </div>
    );
  }

  const title = data.title || data.name;
  const year =
    data.year || (data.release_date || data.first_air_date || '').slice(0, 4);
  const runtime = data.runtime || data.episode_run_time?.[0];
  const ratingNum = Number(
    data.siteRating || data.vote_average || data.rating || 0,
  );
  const hasRating = ratingNum > 0;

  // Requirement 6: Cast & Crew lists prepared for horizontal carousels (never strip actors without photos; show clean fallback portrait)
  const cast = (data.cast || data.credits?.cast || [])
    .filter((c) => Boolean(c && c.name))
    .slice(0, 65);

  // Build deduplicated Crew list combining data.crew / data.credits.crew + directors/musicDirectors/writers/producers
  const crewMap = new Map();
  const addCrewEntry = (
    person,
    fallbackJob = 'Crew',
    fallbackDept = 'Production',
  ) => {
    if (!person) return;
    const obj =
      typeof person === 'string'
        ? { name: person, job: fallbackJob, department: fallbackDept }
        : person;
    const name = String(obj.name || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const photoSrc =
      obj.profileUrl ||
      obj.photoUrl ||
      obj.profilePath ||
      obj.profile_path ||
      null;
    const job = obj.job || obj.department || fallbackJob;
    const dept = obj.department || fallbackDept;

    if (!crewMap.has(key)) {
      crewMap.set(key, {
        id: obj.id || null,
        name,
        jobs: job ? [job] : [],
        department: dept,
        photoSrc,
      });
    } else {
      const existing = crewMap.get(key);
      if (job && !existing.jobs.includes(job)) existing.jobs.push(job);
      if (!existing.id && obj.id) existing.id = obj.id;
      if (!existing.photoSrc && photoSrc) existing.photoSrc = photoSrc;
    }
  };

  (data.directors || []).forEach((d) =>
    addCrewEntry(d, 'Director', 'Directing'),
  );
  (data.musicDirectors || []).forEach((m) =>
    addCrewEntry(m, 'Music Director', 'Sound'),
  );
  (data.writers || []).forEach((w) => addCrewEntry(w, 'Writer', 'Writing'));
  (data.producers || []).forEach((p) =>
    addCrewEntry(p, 'Producer', 'Production'),
  );
  (data.crew || data.credits?.crew || []).forEach((c) =>
    addCrewEntry(c, c.job || 'Crew', c.department || 'Crew'),
  );

  const crew = Array.from(crewMap.values())
    .sort((a, b) => {
      const aHasPhoto = Boolean(a.photoSrc && !deadCrewIds[a.id || a.name])
        ? 1
        : 0;
      const bHasPhoto = Boolean(b.photoSrc && !deadCrewIds[b.id || b.name])
        ? 1
        : 0;
      if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;
      const priorityJob = (jobs) => {
        const joined = jobs.join(' ').toLowerCase();
        if (joined.includes('director') && !joined.includes('music')) return 1;
        if (joined.includes('music') || joined.includes('composer')) return 2;
        if (
          joined.includes('writer') ||
          joined.includes('screenplay') ||
          joined.includes('story')
        )
          return 3;
        if (joined.includes('producer')) return 4;
        return 5;
      };
      return priorityJob(a.jobs) - priorityJob(b.jobs);
    })
    .slice(0, 50);

  const similar = data.similar?.results || data.similar?.items || [];

  // Requirement 7: Specific "Where to Watch" providers & OTT badges
  const wp = data.watchProviders || {};
  const flatrate = wp.flatrate || [];
  const freeProviders = wp.free || [];
  const rentProviders = wp.rent || [];
  const buyProviders = wp.buy || [];
  const matchedOttBadges = OTT_LIST.filter((o) =>
    (data.ottProviders || [])
      .map((k) => String(k).toLowerCase())
      .includes(o.key),
  );
  const hasWhereToWatch =
    matchedOttBadges.length > 0 ||
    flatrate.length > 0 ||
    freeProviders.length > 0 ||
    rentProviders.length > 0 ||
    buyProviders.length > 0;

  const isSeries =
    type === 'tv' ||
    type === 'webseries' ||
    data.type === 'tv' ||
    data.isWebSeries;

  return (
    <div className='pb-10'>
      {/* Hero Banner:
          Requirement 9 fix:
          - Outer Hero div does NOT have `overflow-hidden` so the Add to Watchlist dropdown
            menu is never clipped behind the lower sticky tab bar!
          - Background image wrapper has `overflow-hidden`.
          - Foreground content has `relative z-40` (above the sticky tab bar's `z-30`). */}
      <div className='hero-keep-white relative z-40 min-h-[48vh] w-full bg-[#070a10]'>
        <div className='pointer-events-none absolute inset-0 overflow-hidden'>
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
            className='h-full w-full object-cover opacity-35'
          />
          <div
            style={{
              background:
                'linear-gradient(to top, rgba(7,10,16,0.98) 0%, rgba(7,10,16,0.82) 55%, rgba(7,10,16,0.45) 100%)',
            }}
            className='absolute inset-0'
          />
        </div>

        <div className='relative z-40 mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-5 pb-8 sm:gap-7 sm:px-6 md:flex-row md:items-end'>
          <div className='relative shrink-0 self-center md:self-end'>
            <SafeImage
              src={data.posterUrl || data.poster_path}
              alt={title}
              size='w500'
              variant='poster'
              className='w-36 rounded-2xl border border-white/15 object-contain shadow-2xl sm:w-52'
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
                      to={`/admin/blogs?tmdbId=${resolvedId}&type=${data.subType || resolvedType}&title=${encodeURIComponent(title)}`}
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

            {/* Disclosed Badges Only (Requirement 1) */}
            <div className='flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-200 md:justify-start'>
              {hasRating && (
                <span className='flex items-center gap-1 rounded-full bg-[#f5b942] px-2.5 py-0.5 font-extrabold text-black'>
                  <Star size={12} fill='currentColor' /> {ratingNum.toFixed(1)}
                </span>
              )}
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
              {runtime > 0 && (
                <span className='keep-white flex items-center gap-1'>
                  <Clock size={12} /> {runtime} min
                </span>
              )}
              {fin.verdict && (
                <span className='rounded-full bg-emerald-500/25 px-2.5 py-0.5 font-extrabold text-emerald-300'>
                  {fin.verdict}
                </span>
              )}
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
                  to={`/browse/${resolvedType}?genre=${g.id}`}
                  className='keep-white rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-[#f5b942]'
                >
                  {g.name || g}
                </Link>
              ))}
            </div>

            <div className='flex flex-wrap items-center justify-center gap-2.5 pt-2 md:justify-start'>
              {hasMediaTab && (
                <button
                  type='button'
                  onClick={() => setTabWithHash('media')}
                  className='inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-5 py-2.5 text-xs font-extrabold text-black shadow-lg hover:brightness-110'
                >
                  <Play size={15} fill='currentColor' /> Trailer & Songs (
                  {totalMediaCount})
                </button>
              )}

              {/* Requirement 1: Only show Budget/Box Office button when disclosed */}
              {hasFinancialsTab && (
                <button
                  type='button'
                  onClick={() => setTabWithHash('box-office')}
                  className='keep-white inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-xs font-extrabold text-white backdrop-blur-md hover:bg-white/25'
                >
                  {region === 'IN' ? (
                    <IndianRupee size={14} className='text-[#f5b942]' />
                  ) : (
                    <DollarSign size={14} className='text-[#f5b942]' />
                  )}
                  <span>
                    {fin.hasBudget ? `Budget: ${fin.budgetText}` : ''}
                    {fin.hasBudget && fin.hasRevenue ? ' • ' : ''}
                    {fin.hasRevenue ? `Gross: ${fin.revenueText}` : ''}
                  </span>
                </button>
              )}

              {/* Requirement 9: Theme-aware & unclipped Watchlist Dropdown (`z-50` inside `z-40` Hero) */}
              <div className='relative z-50 w-52'>
                <CustomSelect
                  icon={watchStatus ? Check : Bookmark}
                  value={watchStatus}
                  onChange={handleWatchlist}
                  placeholder='+ Add to Watchlist'
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
            </div>
          </div>
        </div>
      </div>

      {/* SEO Hash-Routed Navigation Tabs:
          - Requirement 1: Hides `box-office` tab if `!hasFinancialsTab`
          - Requirement 5: Hides `media` tab if `!hasMediaTab`
          - Requirement 8: Merges Critic and Review tab into single `Reviews & Critics` (`#reviews`) tab */}
      <div
        className={`sticky top-[53px] z-20 border-b backdrop-blur-xl sm:top-[61px] ${
          isLight
            ? 'border-slate-200 bg-white/95 text-slate-900'
            : 'border-white/10 bg-[#070a10]/95 text-white'
        }`}
      >
        <div className='no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 sm:px-6'>
          {[
            { id: 'overview', label: 'Overview, Cast & Crew', icon: Film },
            ...(hasMediaTab
              ? [
                  {
                    id: 'media',
                    label: `Trailers & Songs (${totalMediaCount})`,
                    icon: Music,
                  },
                ]
              : []),
            ...(hasFinancialsTab
              ? [
                  {
                    id: 'box-office',
                    label: `Box Office (${currency === 'INR' ? '₹' : '$'})`,
                    icon: DollarSign,
                  },
                ]
              : []),
            ...(isSeries && (data.seasons || []).length > 0
              ? [
                  {
                    id: 'seasons',
                    label: `Seasons (${data.numberOfSeasons || data.seasons?.length || 1})`,
                    icon: Tv,
                  },
                ]
              : []),
            { id: 'reviews', label: 'Reviews & Critics', icon: Star },
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
      <div className='relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8'>
        {activeTab === 'overview' && (
          <div className='space-y-8'>
            <div className='grid gap-6 md:grid-cols-3'>
              <div className='space-y-6 md:col-span-2'>
                {data.overview && (
                  <div>
                    <h2 className='text-lg font-extrabold'>
                      Storyline & Synopsis
                    </h2>
                    <p className='mt-2 text-sm leading-relaxed text-zinc-300'>
                      {data.overview}
                    </p>
                  </div>
                )}

                {/* Requirement 7: Specific "Where to Watch" Section on Movie Details Page */}
                <div className='rounded-2xl border border-white/10 bg-[#0e131f] p-5'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <h3 className='flex items-center gap-2 text-base font-extrabold text-white'>
                        <Tv size={17} className='text-[#f5b942]' /> Where to
                        Watch {title}
                      </h3>
                      <p className='text-xs text-zinc-400'>
                        Official OTT streaming, free, rental & digital purchase
                        options
                      </p>
                    </div>
                    <Link
                      to='/ott'
                      className='inline-flex items-center gap-1 rounded-full bg-[#f5b942]/15 px-3 py-1.5 text-xs font-extrabold text-[#f5b942] hover:bg-[#f5b942] hover:text-black'
                    >
                      Master OTT Hub <ExternalLink size={12} />
                    </Link>
                  </div>

                  {hasWhereToWatch ? (
                    <div className='mt-4 space-y-4'>
                      {matchedOttBadges.length > 0 && (
                        <div>
                          <p className='mb-2 text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
                            Available on OTT Platforms
                          </p>
                          <div className='flex flex-wrap gap-2'>
                            {matchedOttBadges.map((ott) => (
                              <Link
                                key={ott.key}
                                to={`/ott?provider=${ott.key}`}
                                className='flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white transition hover:border-[#f5b942]'
                              >
                                <span
                                  style={{ backgroundColor: ott.badge }}
                                  className='keep-white flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black text-white'
                                >
                                  {ott.short ||
                                    ott.label.slice(0, 2).toUpperCase()}
                                </span>
                                <span>{ott.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {flatrate.length > 0 && (
                        <div>
                          <p className='mb-2 text-[11px] font-bold tracking-wider text-emerald-400 uppercase'>
                            Stream with Subscription
                          </p>
                          <div className='flex flex-wrap gap-2.5'>
                            {flatrate.map((p) => (
                              <Link
                                key={p.providerId || p.id || p.name}
                                to='/ott'
                                className='flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold hover:border-[#f5b942]'
                              >
                                {(p.logoUrl || p.logoPath) && (
                                  <SafeImage
                                    src={p.logoUrl || p.logoPath}
                                    alt={p.name}
                                    className='h-6 w-6 rounded-md'
                                  />
                                )}
                                <span>{p.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {freeProviders.length > 0 && (
                        <div>
                          <p className='mb-2 text-[11px] font-bold tracking-wider text-sky-400 uppercase'>
                            Watch Free
                          </p>
                          <div className='flex flex-wrap gap-2.5'>
                            {freeProviders.map((p) => (
                              <div
                                key={`free-${p.providerId || p.id || p.name}`}
                                className='flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold'
                              >
                                {(p.logoUrl || p.logoPath) && (
                                  <SafeImage
                                    src={p.logoUrl || p.logoPath}
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

                      {(rentProviders.length > 0 ||
                        buyProviders.length > 0) && (
                        <div>
                          <p className='mb-2 text-[11px] font-bold tracking-wider text-amber-400 uppercase'>
                            Rent or Buy Digitally
                          </p>
                          <div className='flex flex-wrap gap-2.5'>
                            {[...rentProviders, ...buyProviders]
                              .filter(
                                (v, idx, arr) =>
                                  arr.findIndex((x) => x.name === v.name) ===
                                  idx,
                              )
                              .slice(0, 8)
                              .map((p) => (
                                <div
                                  key={`rent-${p.providerId || p.id || p.name}`}
                                  className='flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold'
                                >
                                  {(p.logoUrl || p.logoPath) && (
                                    <SafeImage
                                      src={p.logoUrl || p.logoPath}
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
                  ) : (
                    <div className='mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-zinc-400'>
                      <span>
                        OTT streaming platform availability has not been
                        announced yet for this title.
                      </span>
                      <Link
                        to='/ott'
                        className='font-bold text-[#f5b942] hover:underline'
                      >
                        Browse All OTT Titles →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Key Credits & Disclosed Financials Only (Requirement 1) */}
              <div className='space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5 text-xs'>
                <h3 className='text-sm font-extrabold text-white'>
                  Key Credits & Release Info
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
                {data.musicDirectors?.length > 0 && (
                  <div>
                    <span className='text-zinc-400'>Music / Composer: </span>
                    <div className='mt-1 flex flex-wrap gap-1.5'>
                      {data.musicDirectors.slice(0, 4).map((m) => (
                        <Link
                          key={m}
                          to={`/person/${encodeURIComponent(m)}`}
                          className='rounded-lg bg-emerald-500/15 px-2 py-0.5 font-bold text-emerald-400 hover:underline'
                        >
                          {m}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {data.writers?.length > 0 && (
                  <div>
                    <span className='text-zinc-400'>Writers: </span>
                    <div className='mt-1 flex flex-wrap gap-1.5'>
                      {data.writers.slice(0, 4).map((w) => (
                        <Link
                          key={w}
                          to={`/person/${encodeURIComponent(w)}`}
                          className='rounded-lg bg-white/10 px-2 py-0.5 font-semibold text-zinc-200 hover:underline'
                        >
                          {w}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {data.status && (
                  <div className='flex items-center justify-between border-t border-white/10 pt-2.5'>
                    <span className='text-zinc-400'>Status:</span>
                    <b className='text-white'>{data.status}</b>
                  </div>
                )}
                {(data.originalLanguage || data.original_language) && (
                  <div className='flex items-center justify-between'>
                    <span className='text-zinc-400'>Language:</span>
                    <b className='uppercase text-white'>
                      {data.originalLanguage || data.original_language}
                    </b>
                  </div>
                )}
                {fin.hasBudget && (
                  <div className='flex items-center justify-between border-t border-white/10 pt-2.5'>
                    <span className='text-zinc-400'>
                      Budget ({region === 'IN' ? '₹ INR' : '$ USD'}):
                    </span>
                    <b className='text-sm text-[#f5b942]'>{fin.budgetText}</b>
                  </div>
                )}
                {fin.hasRevenue && (
                  <div className='flex items-center justify-between'>
                    <span className='text-zinc-400'>Worldwide Gross:</span>
                    <b className='text-sm text-emerald-400'>
                      {fin.revenueText}
                    </b>
                  </div>
                )}
                {fin.indiaNetText && (
                  <div className='flex items-center justify-between'>
                    <span className='text-zinc-400'>India Net Collection:</span>
                    <b className='text-white'>{fin.indiaNetText}</b>
                  </div>
                )}
                {fin.openingWeekendText && (
                  <div className='flex items-center justify-between'>
                    <span className='text-zinc-400'>Opening Weekend:</span>
                    <b className='text-white'>{fin.openingWeekendText}</b>
                  </div>
                )}
                {fin.verdict && (
                  <div className='flex items-center justify-between'>
                    <span className='text-zinc-400'>Trade Verdict:</span>
                    <span className='rounded-md bg-emerald-500/20 px-2 py-0.5 font-extrabold text-emerald-400'>
                      {fin.verdict}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cast & Crew Horizontal Carousels with Smooth Scroll Controls & Filter Pills */}
            {(cast.length > 0 || crew.length > 0) && (
              <div className='space-y-7'>
                {/* Filter Pill Bar: All Cast & Crew | Cast Only | Crew Only */}
                <div className='flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3'>
                  <div>
                    <h2
                      style={{ fontFamily: 'var(--font-display)' }}
                      className='text-lg font-extrabold sm:text-xl'
                    >
                      Cast & Crew
                    </h2>
                    <p className='text-xs text-zinc-400'>
                      Swipe or use arrows to browse actors, directors,
                      composers, and crew
                    </p>
                  </div>

                  <div className='flex items-center gap-1.5'>
                    {[
                      {
                        id: 'all',
                        label: `All (${cast.length + crew.length})`,
                      },
                      ...(cast.length > 0
                        ? [{ id: 'cast', label: `Cast (${cast.length})` }]
                        : []),
                      ...(crew.length > 0
                        ? [{ id: 'crew', label: `Crew (${crew.length})` }]
                        : []),
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        type='button'
                        onClick={() => setCreditsFilter(pill.id)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                          creditsFilter === pill.id
                            ? 'bg-[#f5b942] text-black shadow-sm'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Cast & Actors Horizontal Carousel */}
                {cast.length > 0 &&
                  (creditsFilter === 'all' || creditsFilter === 'cast') && (
                    <div>
                      <div className='mb-3 flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <span className='flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5b942]/15 text-[#f5b942]'>
                            <Users size={15} />
                          </span>
                          <div>
                            <h3 className='text-sm font-extrabold sm:text-base'>
                              Top Cast & Actors ({cast.length})
                            </h3>
                            <p className='text-[11px] text-zinc-400'>
                              Click any actor to explore their full filmography
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-1.5'>
                          <button
                            type='button'
                            onClick={() => scrollCarousel(castCarouselRef, -1)}
                            aria-label='Scroll cast left'
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0e131f] text-zinc-300 transition hover:border-[#f5b942] hover:text-[#f5b942]'
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type='button'
                            onClick={() => scrollCarousel(castCarouselRef, 1)}
                            aria-label='Scroll cast right'
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0e131f] text-zinc-300 transition hover:border-[#f5b942] hover:text-[#f5b942]'
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      <div
                        ref={castCarouselRef}
                        className='no-scrollbar flex gap-3.5 overflow-x-auto scroll-smooth pb-2 sm:gap-4'
                      >
                        {cast.map((c) => {
                          const photoSrc =
                            c.profileUrl ||
                            c.photoUrl ||
                            c.profilePath ||
                            c.profile_path;
                          const hasPhoto =
                            Boolean(photoSrc) && !deadActorIds[c.id || c.name];
                          return (
                            <Link
                              key={`cast-${c.id || c.name}-${c.character || ''}`}
                              to={`/person/${encodeURIComponent(c.name)}${c.id ? `?id=${c.id}` : ''}`}
                              className='group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] text-center transition duration-300 active:scale-95 hover:-translate-y-1 hover:border-[#f5b942] sm:w-44'
                            >
                              <div className='relative aspect-[2/3] w-full overflow-hidden bg-zinc-950'>
                                {hasPhoto ? (
                                  <img
                                    src={
                                      String(photoSrc).startsWith('http')
                                        ? photoSrc
                                        : `https://image.tmdb.org/t/p/h632${photoSrc}`
                                    }
                                    alt={c.name}
                                    loading='lazy'
                                    onError={() =>
                                      setDeadActorIds((prev) => ({
                                        ...prev,
                                        [c.id || c.name]: true,
                                      }))
                                    }
                                    className='h-full w-full object-contain object-center transition duration-500 group-hover:scale-105'
                                  />
                                ) : (
                                  <SafeImage
                                    src={null}
                                    alt={c.name}
                                    variant='poster'
                                    className='h-full w-full object-contain object-center transition duration-500 group-hover:scale-105'
                                  />
                                )}
                              </div>
                              <div className='flex flex-1 flex-col justify-between p-2.5'>
                                <div>
                                  <p className='truncate text-xs font-bold text-white group-hover:text-[#f5b942] sm:text-sm'>
                                    {c.name}
                                  </p>
                                  {c.character && (
                                    <p className='mt-0.5 truncate text-[11px] text-zinc-400'>
                                      as {c.character}
                                    </p>
                                  )}
                                </div>
                                <span className='mt-2 inline-block self-center rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase'>
                                  Cast
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 2. Crew & Filmmakers Horizontal Carousel */}
                {crew.length > 0 &&
                  (creditsFilter === 'all' || creditsFilter === 'crew') && (
                    <div>
                      <div className='mb-3 flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <span className='flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400'>
                            <Clapperboard size={15} />
                          </span>
                          <div>
                            <h3 className='text-sm font-extrabold sm:text-base'>
                              Crew & Filmmakers ({crew.length})
                            </h3>
                            <p className='text-[11px] text-zinc-400'>
                              Directors, music composers, writers, producers &
                              technical crew
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-1.5'>
                          <button
                            type='button'
                            onClick={() => scrollCarousel(crewCarouselRef, -1)}
                            aria-label='Scroll crew left'
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0e131f] text-zinc-300 transition hover:border-[#f5b942] hover:text-[#f5b942]'
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type='button'
                            onClick={() => scrollCarousel(crewCarouselRef, 1)}
                            aria-label='Scroll crew right'
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0e131f] text-zinc-300 transition hover:border-[#f5b942] hover:text-[#f5b942]'
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      <div
                        ref={crewCarouselRef}
                        className='no-scrollbar flex gap-3.5 overflow-x-auto scroll-smooth pb-2 sm:gap-4'
                      >
                        {crew.map((member) => {
                          const hasPhoto =
                            Boolean(member.photoSrc) &&
                            !deadCrewIds[member.id || member.name];
                          const roleText =
                            member.jobs.slice(0, 2).join(' • ') ||
                            member.department ||
                            'Crew';
                          return (
                            <Link
                              key={`crew-${member.id || member.name}`}
                              to={`/person/${encodeURIComponent(member.name)}${member.id ? `?id=${member.id}` : ''}`}
                              className='group flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f] text-center transition duration-300 active:scale-95 hover:-translate-y-1 hover:border-[#f5b942] sm:w-44'
                            >
                              <div className='relative aspect-[2/3] w-full overflow-hidden bg-zinc-950'>
                                {hasPhoto ? (
                                  <img
                                    src={
                                      String(member.photoSrc).startsWith('http')
                                        ? member.photoSrc
                                        : `https://image.tmdb.org/t/p/h632${member.photoSrc}`
                                    }
                                    alt={member.name}
                                    loading='lazy'
                                    onError={() =>
                                      setDeadCrewIds((prev) => ({
                                        ...prev,
                                        [member.id || member.name]: true,
                                      }))
                                    }
                                    className='h-full w-full object-contain object-center transition duration-500 group-hover:scale-105'
                                  />
                                ) : (
                                  <SafeImage
                                    src={null}
                                    alt={member.name}
                                    variant='poster'
                                    className='h-full w-full object-contain object-center transition duration-500 group-hover:scale-105'
                                  />
                                )}
                              </div>
                              <div className='flex flex-1 flex-col justify-between p-2.5'>
                                <div>
                                  <p className='truncate text-xs font-bold text-white group-hover:text-[#f5b942] sm:text-sm'>
                                    {member.name}
                                  </p>
                                  <p className='mt-0.5 line-clamp-1 text-[11px] font-semibold text-[#f5b942]'>
                                    {roleText}
                                  </p>
                                </div>
                                <span className='mt-2 inline-block self-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 uppercase'>
                                  {member.department || 'Crew'}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Requirement 5: Music & Trailer section automatically removes dead/broken thumbnails */}
        {activeTab === 'media' && hasMediaTab && (
          <div className='space-y-8'>
            {currentVideoKey && (
              <div className='overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl'>
                <iframe
                  key={currentVideoKey}
                  src={`https://www.youtube.com/embed/${currentVideoKey}`}
                  title='Video Player'
                  allowFullScreen
                  className='aspect-video w-full'
                />
              </div>
            )}

            {rawSongs.length > 0 && (
              <div>
                <h3 className='mb-3 flex items-center gap-2 text-base font-extrabold text-[#f5b942]'>
                  <Music size={18} /> Official Songs & Soundtrack (
                  {rawSongs.length})
                </h3>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {rawSongs.map((s, idx) => (
                    <button
                      key={s.id || s.youtubeKey || idx}
                      type='button'
                      onClick={() => setActiveVideoKey(s.youtubeKey)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        currentVideoKey === s.youtubeKey
                          ? 'border-[#f5b942] bg-[#f5b942]/15'
                          : 'border-white/10 bg-[#0e131f] hover:border-white/30'
                      }`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${s.youtubeKey}/hqdefault.jpg`}
                        alt={s.title}
                        loading='lazy'
                        onLoad={(e) => handleMediaThumbLoad(e, s.youtubeKey)}
                        onError={() => handleMediaThumbError(s.youtubeKey)}
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

            {rawVideos.length > 0 && (
              <div>
                <h3 className='mb-3 flex items-center gap-2 text-base font-extrabold'>
                  <Film size={18} /> Official Trailers & Videos (
                  {rawVideos.length})
                </h3>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {rawVideos.map((v) => (
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
                        src={`https://img.youtube.com/vi/${v.key}/hqdefault.jpg`}
                        alt={v.name}
                        loading='lazy'
                        onLoad={(e) => handleMediaThumbLoad(e, v.key)}
                        onError={() => handleMediaThumbError(v.key)}
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

        {/* Requirement 1: Box Office Tab only renders when disclosed financials exist */}
        {activeTab === 'box-office' && hasFinancialsTab && (
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#f5b942]/30 bg-[#0e131f] p-4 sm:p-5'>
              <div>
                <h2 className='text-base font-extrabold sm:text-lg'>
                  Disclosed Budget & Box Office Report (
                  {region === 'IN'
                    ? '🇮🇳 Indian Rupees ₹ Crore'
                    : '🌍 US Dollars $'}
                  )
                </h2>
                <p className='text-xs text-zinc-400'>
                  Official disclosed financials in{' '}
                  {region === 'IN'
                    ? 'Indian Rupees (₹ Crore / ₹ Lakh)'
                    : 'International USD ($ Million / $ Billion)'}
                  .
                </p>
              </div>
              {fin.verdict && (
                <div className='flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2 text-emerald-400'>
                  <TrendingUp size={18} />
                  <div>
                    <div className='text-[10px] font-bold uppercase'>
                      Verdict{' '}
                      {fin.roiPercent !== null
                        ? `(${fin.roiPercent}% ROI)`
                        : ''}
                    </div>
                    <div className='text-sm font-extrabold'>{fin.verdict}</div>
                  </div>
                </div>
              )}
            </div>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4'>
              {[
                fin.hasBudget && {
                  label: 'Production Budget',
                  value: fin.budgetText,
                  sub:
                    region === 'IN'
                      ? fin.usdBudgetSub
                      : 'Total Production Cost',
                },
                fin.hasRevenue && {
                  label: 'Worldwide Box Office',
                  value: fin.revenueText,
                  sub:
                    region === 'IN'
                      ? fin.usdRevenueSub
                      : 'Global Theatrical Gross',
                  highlight: true,
                },
                fin.indiaNetText && {
                  label: 'India Net Collection',
                  value: fin.indiaNetText,
                  sub: fin.indiaGrossText
                    ? `India Gross: ${fin.indiaGrossText}`
                    : 'Domestic Territory',
                },
                fin.openingWeekendText && {
                  label: 'Opening Weekend',
                  value: fin.openingWeekendText,
                  sub: fin.openingDayText
                    ? `Day 1: ${fin.openingDayText}`
                    : 'First Weekend',
                },
                fin.domesticText && {
                  label: 'Domestic Collection',
                  value: fin.domesticText,
                  sub: 'Home Market Share',
                },
                fin.internationalText && {
                  label: 'International Overseas',
                  value: fin.internationalText,
                  sub: 'Overseas Theatrical',
                },
                fin.profitText && {
                  label: 'Theatrical Net Profit',
                  value: fin.profitText,
                  sub:
                    fin.roiPercent !== null
                      ? `ROI: +${fin.roiPercent}%`
                      : 'Revenue minus Budget',
                },
                fin.verdict && {
                  label: 'Box Office Status',
                  value: fin.verdict,
                  sub: 'Official Trade Verdict',
                },
              ]
                .filter(Boolean)
                .map((card) => (
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
                  options={(data.seasons || []).map((s) => {
                    const sNum = s.seasonNumber ?? s.season_number;
                    const epCount = s.episodeCount ?? s.episode_count ?? 0;
                    return {
                      value: sNum,
                      label: `${s.name || `Season ${sNum}`} (${epCount} eps)`,
                    };
                  })}
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
                    key={ep.episodeNumber || ep.episode_number}
                    className='flex gap-3.5 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5'
                  >
                    <SafeImage
                      src={ep.stillUrl || ep.stillPath || ep.still_path}
                      alt={ep.name}
                      size='w300'
                      variant='backdrop'
                      className='h-20 w-32 shrink-0 rounded-xl object-cover'
                    />
                    <div className='min-w-0 flex-1'>
                      <span className='text-xs font-bold text-[#f5b942]'>
                        E{ep.episodeNumber || ep.episode_number} • {ep.name}
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

        {['reviews', 'comments'].includes(activeTab) && (
          <Reviews
            tmdbId={resolvedId}
            type={resolvedType}
            activeSubTab={activeTab === 'comments' ? 'comments' : 'reviews'}
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

      {similar.length > 0 && (
        <MovieRow
          title={`Similar to ${title}`}
          subtitle='Matched by era, language, director & genres'
          items={similar}
          type={resolvedType}
          seeAllTo={`/browse/${resolvedType}?genre=${data.genres?.[0]?.id || ''}`}
        />
      )}

      {editingTitle && (
        <TitleEditorModal
          title={data}
          onClose={() => setEditingTitle(false)}
          onSaved={(updated) => {
            if (updated)
              setData((prev) => ({
                ...prev,
                ...updated,
                boxOffice: updated.boxOffice,
                songs: updated.songs || [],
                videos: updated.videos || { results: [] },
                videoList: updated.videoList || [],
              }));
            else loadDetail();
          }}
        />
      )}
    </div>
  );
}
