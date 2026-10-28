export const APP_NAME = 'Movies Hub';

export const TMDB = {
  IMG: 'https://image.tmdb.org/t/p',
};

export const BACKEND = {
  URL: import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/v1',
  ENABLED: import.meta.env?.VITE_USE_BACKEND !== 'false',
};

export const GUEST_LIMIT_MS = 15 * 60 * 1000;
export const ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  WATCHLIST: '/watchlist',
  OTT_HUB: '/otts',
  OTT_HUB_LEGACY: '/ott',
  OTT_PROVIDER: '/ott/:providerKey',
  MOVIES_CATALOG: '/movies',
  TV_SHOWS_CATALOG: '/tv-shows',
  TV_SERIES_CATALOG: '/tv-series',
  WEB_SERIES_CATALOG: '/web-series',
  MOVIES: '/movies',
  TV_SHOWS: '/tv-shows',
  TV_SERIES: '/tv-series',
  BROWSE: '/browse/:type',
  BROWSE_ROOT: '/browse',
  MOVIE_DETAIL: '/movie/:id',
  WEB_SERIES_DETAIL: '/web-series/:id',
  TV_SHOW_DETAIL: '/tv-show/:id',
  TV_SERIES_DETAIL: '/tv-series/:id',
  DETAILS: '/detail/:type/:id',
  DETAILS_LEGACY: '/details/:type/:id',
  ACTOR: '/actor/:name',
  ACTORESS: '/actoress/:name',
  ACTRESS: '/actress/:name',
  PERSON: '/person/:name',
  BLOGS: '/blogs',
  BLOG_DETAIL: '/blogs/:slug',
  COMMUNITY: '/community',
  SITEMAP: '/sitemap',
  SITEMAP_XML: '/sitemap.xml',
  ADMIN: '/admin/*',
};

export const MOVIE_GENRES = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
};

export const TV_GENRES = {
  'Action & Adventure': 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Mystery: 9648,
  Reality: 10764,
  'Sci-Fi & Fantasy': 10765,
};

export const OTT_LIST = [
  { key: 'netflix', slug: 'netflix', label: 'Netflix', sub: 'Global Blockbusters & Originals', color: 'from-red-600 to-red-800', badge: '#E50914', short: 'N', emoji: '🎬' },
  { key: 'prime', slug: 'prime-video', label: 'Prime Video', sub: 'Indian Originals & Pan-India Hits', color: 'from-sky-500 to-blue-700', badge: '#00A8E1', short: 'PV', emoji: '📺' },
  { key: 'hotstar', slug: 'jiohotstar', label: 'JioHotstar', sub: 'Marvel, Disney & Indian Specials', color: 'from-blue-700 to-indigo-950', badge: '#1d4ed8', short: 'JH', emoji: '⭐' },
  { key: 'jiocinema', slug: 'jiocinema', label: 'JioCinema', sub: 'Blockbuster Hindi & Regional Cinema', color: 'from-pink-600 to-rose-800', badge: '#D9008D', short: 'JC', emoji: '🔥' },
  { key: 'sonyliv', slug: 'sonyliv', label: 'SonyLIV', sub: 'Acclaimed Indian Web Series', color: 'from-orange-500 to-amber-700', badge: '#FF5500', short: 'SL', emoji: '🎭' },
  { key: 'zee5', slug: 'zee5', label: 'ZEE5', sub: 'Hindi & Regional Originals', color: 'from-purple-600 to-violet-900', badge: '#8230C6', short: 'Z5', emoji: '✨' },
  { key: 'apple', slug: 'apple-tv-plus', label: 'Apple TV+', sub: 'Award-Winning Sci-Fi & Drama', color: 'from-zinc-600 to-zinc-900', badge: '#52525b', short: 'TV+', emoji: '🍎' },
  { key: 'max', slug: 'hbo-max', label: 'Max (HBO)', sub: 'Prestige Series & Warner Bros.', color: 'from-blue-600 to-indigo-900', badge: '#002BE7', short: 'MAX', emoji: '👑' },
  { key: 'hulu', slug: 'hulu', label: 'Hulu', sub: 'FX Originals & US Series', color: 'from-emerald-500 to-teal-800', badge: '#10b981', short: 'HU', emoji: '🟢' },
  { key: 'crunchyroll', slug: 'crunchyroll', label: 'Crunchyroll', sub: 'Japanese Anime Simulcasts', color: 'from-orange-500 to-red-600', badge: '#F47521', short: 'CR', emoji: '🍥' },
];

export const INDUSTRY_LIST = [
  { key: 'bollywood', label: 'Bollywood (Hindi)', lang: 'hi', emoji: '🇮🇳', region: 'IN' },
  { key: 'tollywood', label: 'Tollywood (Telugu)', lang: 'te', emoji: '🔥', region: 'IN' },
  { key: 'kollywood', label: 'Kollywood (Tamil)', lang: 'ta', emoji: '🎭', region: 'IN' },
  { key: 'mollywood', label: 'Mollywood (Malayalam)', lang: 'ml', emoji: '🌴', region: 'IN' },
  { key: 'sandalwood', label: 'Sandalwood (Kannada)', lang: 'kn', emoji: '👑', region: 'IN' },
  { key: 'hollywood', label: 'Hollywood (English)', lang: 'en', emoji: '🎬', region: 'GLOBAL' },
  { key: 'korean', label: 'Korean (K-Drama & Film)', lang: 'ko', emoji: '🇰🇷', region: 'GLOBAL' },
  { key: 'japanese', label: 'Japanese & Anime', lang: 'ja', emoji: '🇯🇵', region: 'GLOBAL' },
  { key: 'spanish', label: 'Spanish Cinema', lang: 'es', emoji: '🇪🇸', region: 'GLOBAL' },
  { key: 'french', label: 'French Cinema', lang: 'fr', emoji: '🇫🇷', region: 'GLOBAL' },
];

export const BLOG_CATEGORIES = [
  'Editorial',
  'Review',
  'Box Office',
  'News',
  'OTT Release',
  'Interview',
  'Listicle',
  'Explained',
];

export const BOX_OFFICE_VERDICTS = [
  '',
  'All-Time Blockbuster',
  'Blockbuster',
  'Super Hit',
  'Hit',
  'Above Average',
  'Average',
  'Flop',
  'Disaster',
];

/**
 * Converts a genre name ("Thriller", "Sci-Fi", "Action & Adventure") or numeric ID (53, 878)
 * into a clean bot-friendly URL slug ("thriller", "sci-fi", "action-and-adventure").
 */
export const toGenreSlug = (labelOrId, mediaType = 'movie') => {
  if (labelOrId === null || labelOrId === undefined || labelOrId === '') return '';
  const combined =
    mediaType === 'movie'
      ? { ...TV_GENRES, ...MOVIE_GENRES }
      : { ...MOVIE_GENRES, ...TV_GENRES };

  const num = Number(labelOrId);
  if (Number.isInteger(num) && num > 0) {
    const found = Object.entries(combined).find(([, id]) => id === num);
    if (found) {
      return found[0]
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  return String(labelOrId)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Resolves a genre URL slug ("thriller", "sci-fi", "action-and-adventure") or numeric ID ("53")
 * back to its numeric TMDB Genre ID (53, 878, 10759) for internal API calls.
 */
export const resolveGenreId = (slugOrId, mediaType = 'movie') => {
  if (slugOrId === null || slugOrId === undefined || slugOrId === '') return '';
  const num = Number(slugOrId);
  if (Number.isInteger(num) && num > 0) return String(num);

  const cleanSlug = toGenreSlug(slugOrId, mediaType);
  const primaryMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const secondaryMap = mediaType === 'movie' ? TV_GENRES : MOVIE_GENRES;

  for (const [name, id] of Object.entries(primaryMap)) {
    if (toGenreSlug(name) === cleanSlug) return String(id);
  }
  for (const [name, id] of Object.entries(secondaryMap)) {
    if (toGenreSlug(name) === cleanSlug) return String(id);
  }

  // Cross-type friendly aliases (e.g. "action" on tv/web-series -> 10759, "sci-fi" on tv/web-series -> 10765)
  if (mediaType !== 'movie') {
    if (cleanSlug === 'action' || cleanSlug === 'adventure') return '10759';
    if (cleanSlug === 'sci-fi' || cleanSlug === 'scifi' || cleanSlug === 'fantasy') return '10765';
  } else {
    if (cleanSlug === 'action-and-adventure') return '28';
    if (cleanSlug === 'sci-fi-and-fantasy') return '878';
  }

  return String(slugOrId);
};

/**
 * Returns the display name ("Thriller", "Sci-Fi") for any genre slug or numeric ID.
 */
export const resolveGenreName = (slugOrId, mediaType = 'movie') => {
  if (!slugOrId) return '';
  const resolvedId = Number(resolveGenreId(slugOrId, mediaType));
  const primaryMap = mediaType === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const secondaryMap = mediaType === 'movie' ? TV_GENRES : MOVIE_GENRES;

  const matchPrimary = Object.entries(primaryMap).find(([, id]) => id === resolvedId);
  if (matchPrimary) return matchPrimary[0];
  const matchSecondary = Object.entries(secondaryMap).find(([, id]) => id === resolvedId);
  if (matchSecondary) return matchSecondary[0];
  return String(slugOrId)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Resolves any OTT key or full slug ('prime' or 'prime-video', 'hotstar' or 'jiohotstar')
 * to the full SEO slug ('prime-video', 'jiohotstar', 'netflix', etc.).
 */
export const getOttSlug = (keyOrSlug = '') => {
  const clean = String(keyOrSlug || '').toLowerCase().trim();
  if (!clean || clean === 'all') return '';
  const match = OTT_LIST.find((o) => o.key === clean || o.slug === clean);
  return match ? match.slug : clean;
};

/**
 * Resolves any OTT URL slug ('prime-video', 'jiohotstar', 'apple-tv-plus', 'hbo-max')
 * back to the internal backend key ('prime', 'hotstar', 'apple', 'max').
 */
export const resolveOttKey = (slugOrKey = '') => {
  const clean = String(slugOrKey || '').toLowerCase().trim();
  if (!clean || clean === 'all') return clean;
  const match = OTT_LIST.find((o) => o.slug === clean || o.key === clean);
  if (match) return match.key;
  if (clean.includes('prime')) return 'prime';
  if (clean.includes('hotstar')) return 'hotstar';
  if (clean.includes('jio')) return 'jiocinema';
  if (clean.includes('sony')) return 'sonyliv';
  if (clean.includes('zee')) return 'zee5';
  if (clean.includes('apple')) return 'apple';
  if (clean.includes('max') || clean.includes('hbo')) return 'max';
  return clean;
};

/**
 * Builds the clean bot-friendly OTT URL:
 * - Master All-OTT Page (plural): `/otts`
 * - Specific OTT Platform (singular): `/ott/prime-video`, `/ott/jiohotstar`, `/ott/netflix`
 */
export const getOttPath = (keyOrSlug = '', extraQuery = {}) => {
  const slug = getOttSlug(keyOrSlug);
  const basePath = slug ? `/ott/${slug}` : '/otts';
  const qs = new URLSearchParams();
  Object.entries(extraQuery || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && k !== 'provider') {
      qs.set(k, k === 'genre' ? toGenreSlug(v) : String(v));
    }
  });
  const qStr = qs.toString();
  return qStr ? `${basePath}?${qStr}` : basePath;
};

/**
 * Converts internal type ('movie', 'webseries', 'tv') to plural collection slug ('movies', 'web-series', 'tv-shows').
 */
export const toBrowseTypeSlug = (type = 'movie') => {
  const clean = String(type || 'movie').toLowerCase().trim();
  if (clean === 'webseries' || clean === 'web-series') return 'web-series';
  if (['tv', 'tv-show', 'tv-shows', 'tv-series'].includes(clean)) return 'tv-shows';
  return 'movies';
};

/**
 * Converts URL collection or singular slug ('movies', 'movie', 'web-series', 'webseries', 'tv-shows', 'tv-show', 'tv')
 * back to internal mediaType ('movie', 'webseries', 'tv').
 */
export const fromBrowseTypeSlug = (slug = 'movies') => {
  const clean = String(slug || 'movies').toLowerCase().trim();
  if (clean === 'webseries' || clean === 'web-series') return 'webseries';
  if (['tv', 'tv-show', 'tv-shows', 'tv-series'].includes(clean)) return 'tv';
  return 'movie';
};

/**
 * Builds a clean plural browse URL (e.g. `/browse/movies?genre=thriller`, `/browse/web-series`, `/browse/tv-shows`).
 */
export const getBrowsePath = (type = 'movie', params = {}) => {
  const typeSlug = toBrowseTypeSlug(type);
  const internalType = fromBrowseTypeSlug(type);
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (k === 'genre') {
      qs.set('genre', toGenreSlug(v, internalType));
    } else if (k === 'ott') {
      qs.set('ott', getOttSlug(v));
    } else {
      qs.set(k, String(v));
    }
  });
  const qStr = qs.toString();
  return `/browse/${typeSlug}${qStr ? `?${qStr}` : ''}`;
};

const genreLinks = (typeSlug, map) =>
  Object.entries(map)
    .slice(0, 8)
    .map(([label]) => ({
      label,
      to: `/browse/${typeSlug}?genre=${toGenreSlug(label)}`,
    }));

// Desktop Navbar with dedicated separate tabs for Movies, Web Series, TV Shows, and OTT (/otts)
export const NAV_MENU = [
  {
    key: 'movies',
    label: 'Movies',
    items: [
      { label: '🎬 All Movies', to: '/browse/movies' },
      { label: '📅 Upcoming Movies', to: '/browse/movies?list=upcoming' },
      { label: '🔥 Trending Movies', to: '/browse/movies?list=trending' },
      { label: '💰 Top Box Office', to: '/browse/movies?sort=revenue' },
      ...genreLinks('movies', MOVIE_GENRES),
    ],
  },
  {
    key: 'webseries',
    label: 'Web Series',
    items: [
      { label: '🔥 All Web Series (OTT)', to: '/browse/web-series' },
      { label: '📅 Upcoming Web Series', to: '/browse/web-series?list=upcoming' },
      { label: '⚡ Trending Web Series', to: '/browse/web-series?list=trending' },
      { label: '🏆 Top Rated Web Series', to: '/browse/web-series?list=top-rated' },
      ...genreLinks('web-series', TV_GENRES),
    ],
  },
  {
    key: 'tvshows',
    label: 'TV Shows',
    items: [
      { label: '📺 All TV Shows', to: '/browse/tv-shows' },
      { label: '📅 Upcoming TV Shows', to: '/browse/tv-shows?list=upcoming' },
      { label: '📡 Trending TV Shows', to: '/browse/tv-shows?list=trending' },
      { label: '🌟 Popular TV Shows', to: '/browse/tv-shows?list=popular' },
      { label: '🏆 Top Rated TV Shows', to: '/browse/tv-shows?list=top-rated' },
      ...genreLinks('tv-shows', TV_GENRES),
    ],
  },
  {
    key: 'ott',
    label: 'OTT',
    items: [
      { label: '✨ All OTT', to: '/otts', isMaster: true },
      ...OTT_LIST.map((o) => ({
        label: `${o.emoji || '📺'} ${o.label}`,
        to: `/ott/${o.slug}`,
        badgeColor: o.badge,
      })),
    ],
  },
];
