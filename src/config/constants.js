export const APP_NAME = 'Movies Hub';

export const TMDB = {
  IMG: 'https://image.tmdb.org/t/p',
};

export const BACKEND = {
  URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  ENABLED: import.meta.env.VITE_USE_BACKEND !== 'false',
};

export const GUEST_LIMIT_MS = 15 * 60 * 1000;
export const ROLES = { USER: 'user', ADMIN: 'admin', SUPERADMIN: 'superadmin' };

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile',
  WATCHLIST: '/watchlist',
  BROWSE: '/browse/:type',
  BROWSE_ROOT: '/browse',
  DETAILS: '/details/:type/:id',
  PERSON: '/person/:name',
  BLOGS: '/blogs',
  BLOG_DETAIL: '/blogs/:slug',
  COMMUNITY: '/community',
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
  { key: 'netflix', label: 'Netflix', color: 'from-red-600 to-red-800', badge: '#E50914' },
  { key: 'prime', label: 'Prime Video', color: 'from-sky-500 to-blue-700', badge: '#00A8E1' },
  { key: 'hotstar', label: 'JioHotstar', color: 'from-blue-700 to-indigo-950', badge: '#1d4ed8' },
  { key: 'jiocinema', label: 'JioCinema', color: 'from-pink-600 to-rose-800', badge: '#D9008D' },
  { key: 'sonyliv', label: 'SonyLIV', color: 'from-orange-500 to-amber-700', badge: '#FF5500' },
  { key: 'zee5', label: 'ZEE5', color: 'from-purple-600 to-violet-900', badge: '#8230C6' },
  { key: 'apple', label: 'Apple TV+', color: 'from-zinc-600 to-zinc-900', badge: '#52525b' },
  { key: 'max', label: 'Max (HBO)', color: 'from-blue-600 to-indigo-900', badge: '#002BE7' },
  { key: 'hulu', label: 'Hulu', color: 'from-emerald-500 to-teal-800', badge: '#10b981' },
  { key: 'crunchyroll', label: 'Crunchyroll', color: 'from-orange-500 to-red-600', badge: '#F47521' },
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

export const NAV_MENU = [
  {
    label: 'Movies',
    items: [
      { label: 'All Movies', to: '/browse/movie' },
      { label: 'Upcoming Movies', to: '/browse/movie?list=upcoming' },
      { label: 'Trending Movies', to: '/browse/movie?list=trending' },
      { label: 'Top Box Office', to: '/browse/movie?sort=revenue' },
      ...genreLinks('movie', MOVIE_GENRES),
    ],
  },
  {
    label: 'Web Series & TV',
    items: [
      { label: 'All Web Series (OTT)', to: '/browse/webseries' },
      { label: 'All TV Shows', to: '/browse/tv' },
      { label: 'Trending Series', to: '/browse/tv?list=trending' },
      ...genreLinks('tv', TV_GENRES),
    ],
  },
  {
    label: 'Indian & Global',
    items: INDUSTRY_LIST.map((ind) => ({
      label: `${ind.emoji} ${ind.label}`,
      to: `/browse/movie?industry=${ind.key}`,
    })),
  },
  {
    label: 'OTT Platforms',
    items: OTT_LIST.slice(0, 8).map((o) => ({
      label: o.label,
      to: `/browse/movie?ott=${o.key}`,
    })),
  },
];
