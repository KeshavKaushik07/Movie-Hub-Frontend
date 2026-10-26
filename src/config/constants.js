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
  OTT_HUB: '/ott',
  OTT_PROVIDER: '/ott/:providerKey',
  BROWSE: '/browse/:type',
  BROWSE_ROOT: '/browse',
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
  { key: 'netflix', label: 'Netflix', sub: 'Global Blockbusters & Originals', color: 'from-red-600 to-red-800', badge: '#E50914', short: 'N', emoji: '🎬' },
  { key: 'prime', label: 'Prime Video', sub: 'Indian Originals & Pan-India Hits', color: 'from-sky-500 to-blue-700', badge: '#00A8E1', short: 'PV', emoji: '📺' },
  { key: 'hotstar', label: 'JioHotstar', sub: 'Marvel, Disney & Indian Specials', color: 'from-blue-700 to-indigo-950', badge: '#1d4ed8', short: 'JH', emoji: '⭐' },
  { key: 'jiocinema', label: 'JioCinema', sub: 'Blockbuster Hindi & Regional Cinema', color: 'from-pink-600 to-rose-800', badge: '#D9008D', short: 'JC', emoji: '🔥' },
  { key: 'sonyliv', label: 'SonyLIV', sub: 'Acclaimed Indian Web Series', color: 'from-orange-500 to-amber-700', badge: '#FF5500', short: 'SL', emoji: '🎭' },
  { key: 'zee5', label: 'ZEE5', sub: 'Hindi & Regional Originals', color: 'from-purple-600 to-violet-900', badge: '#8230C6', short: 'Z5', emoji: '✨' },
  { key: 'apple', label: 'Apple TV+', sub: 'Award-Winning Sci-Fi & Drama', color: 'from-zinc-600 to-zinc-900', badge: '#52525b', short: 'TV+', emoji: '🍎' },
  { key: 'max', label: 'Max (HBO)', sub: 'Prestige Series & Warner Bros.', color: 'from-blue-600 to-indigo-900', badge: '#002BE7', short: 'MAX', emoji: '👑' },
  { key: 'hulu', label: 'Hulu', sub: 'FX Originals & US Series', color: 'from-emerald-500 to-teal-800', badge: '#10b981', short: 'HU', emoji: '🟢' },
  { key: 'crunchyroll', label: 'Crunchyroll', sub: 'Japanese Anime Simulcasts', color: 'from-orange-500 to-red-600', badge: '#F47521', short: 'CR', emoji: '🍥' },
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

const genreLinks = (type, map) =>
  Object.entries(map)
    .slice(0, 8)
    .map(([label, id]) => ({
      label,
      to: `/browse/${type}?genre=${id}`,
    }));

// Requirement 12: Desktop Navbar shows Movies, Web Series, and OTT (with "All OTT" uppermost)
export const NAV_MENU = [
  {
    key: 'movies',
    label: 'Movies',
    items: [
      { label: '🎬 All Movies', to: '/browse/movie' },
      { label: '📅 Upcoming Movies', to: '/browse/movie?list=upcoming' },
      { label: '🔥 Trending Movies', to: '/browse/movie?list=trending' },
      { label: '💰 Top Box Office', to: '/browse/movie?sort=revenue' },
      ...genreLinks('movie', MOVIE_GENRES),
    ],
  },
  {
    key: 'webseries',
    label: 'Web Series',
    items: [
      { label: '📺 All Web Series (OTT)', to: '/browse/webseries' },
      { label: '🔥 Trending Web Series', to: '/browse/webseries?list=trending' },
      { label: '📡 All TV Shows', to: '/browse/tv' },
      ...genreLinks('tv', TV_GENRES),
    ],
  },
  {
    key: 'ott',
    label: 'OTT',
    items: [
      { label: '✨ All OTT', to: '/ott', isMaster: true },
      ...OTT_LIST.map((o) => ({
        label: `${o.emoji || '📺'} ${o.label}`,
        to: `/ott?provider=${o.key}`,
        badgeColor: o.badge,
      })),
    ],
  },
];
