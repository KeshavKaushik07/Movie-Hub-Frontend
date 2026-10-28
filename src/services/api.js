import { backend, readSavedUser } from './backendApi';
import {
  resolveImage,
  resolveSlugMapping,
  registerSlugMapping,
  toSlug,
} from '../utils/formatters';

const CACHE_PREFIX = 'movieshub_cache_v6:';

// Automatically purge older cache versions or any broken season:undefined entries on load
try {
  for (const k of Object.keys(localStorage)) {
    if (
      (k.startsWith('movieshub_cache') && !k.startsWith(CACHE_PREFIX)) ||
      k.includes(':undefined') ||
      k.includes(':NaN')
    ) {
      localStorage.removeItem(k);
    }
  }
} catch {
  /* ignore */
}

// Unwraps Mongoose subdocument wrapper objects ({ _doc: { ... }, posterUrl: ... }) if returned by backend
export const unwrapSubdoc = (item) => {
  if (!item || typeof item !== 'object') return item;
  if (item._doc && typeof item._doc === 'object') {
    const { _doc, $__, $isNew, ...rest } = item;
    return { ...rest, ..._doc };
  }
  return item;
};

export const normalizeSeasonData = (rawSeason, fallbackSeasonNumber = 1) => {
  if (!rawSeason || typeof rawSeason !== 'object') return null;
  const s = unwrapSubdoc(rawSeason.season || rawSeason);
  const sNum =
    s.seasonNumber !== undefined && s.seasonNumber !== null
      ? Number(s.seasonNumber)
      : s.season_number !== undefined && s.season_number !== null
        ? Number(s.season_number)
        : Number(fallbackSeasonNumber) || 1;
  const posterPath = s.posterPath || s.poster_path || '';
  const airDate = s.airDate || s.air_date || '';
  const episodes = (Array.isArray(s.episodes) ? s.episodes : []).map((rawEp, idx) => {
    const ep = unwrapSubdoc(rawEp) || {};
    const epNum =
      ep.episodeNumber !== undefined && ep.episodeNumber !== null
        ? Number(ep.episodeNumber)
        : ep.episode_number !== undefined && ep.episode_number !== null
          ? Number(ep.episode_number)
          : idx + 1;
    const stillPath = ep.stillPath || ep.still_path || '';
    const epAirDate = ep.airDate || ep.air_date || '';
    const voteAverage = Number(ep.voteAverage ?? ep.vote_average ?? 0);
    return {
      ...ep,
      episodeNumber: epNum,
      episode_number: epNum,
      name: ep.name || `Episode ${epNum}`,
      overview: ep.overview || '',
      airDate: epAirDate,
      air_date: epAirDate,
      runtime: ep.runtime || null,
      stillPath,
      still_path: stillPath,
      stillUrl:
        ep.stillUrl ||
        (stillPath
          ? stillPath.startsWith('http')
            ? stillPath
            : `https://image.tmdb.org/t/p/w300${stillPath}`
          : null),
      voteAverage,
      vote_average: voteAverage,
    };
  });

  return {
    ...s,
    seasonNumber: sNum,
    season_number: sNum,
    name: s.name || (sNum === 0 ? 'Specials' : `Season ${sNum}`),
    overview: s.overview || '',
    airDate,
    air_date: airDate,
    posterPath,
    poster_path: posterPath,
    posterUrl:
      s.posterUrl ||
      (posterPath
        ? posterPath.startsWith('http')
          ? posterPath
          : `https://image.tmdb.org/t/p/w342${posterPath}`
        : null),
    voteAverage: Number(s.voteAverage ?? s.vote_average ?? 0),
    episodeCount: episodes.length || Number(s.episodeCount ?? s.episode_count ?? 0),
    episodes,
  };
};

export const normalizeDetailData = (rawDetail) => {
  if (!rawDetail || typeof rawDetail !== 'object') return rawDetail;
  const d = unwrapSubdoc(rawDetail);

  const rawSeasons = Array.isArray(d.seasons) ? d.seasons : [];
  let seasons = rawSeasons
    .map((rawS, idx) => {
      const s = unwrapSubdoc(rawS) || {};
      const parsedNum = Number(s.seasonNumber ?? s.season_number);
      const sNum = Number.isInteger(parsedNum) && parsedNum >= 0 ? parsedNum : idx + 1;
      const epCount = Number(s.episodeCount ?? s.episode_count ?? 0);
      const posterPath = s.posterPath || s.poster_path || d.poster_path || '';
      const airDate = s.airDate || s.air_date || '';
      const voteAvg = Number(s.voteAverage ?? s.vote_average ?? 0);
      return {
        ...s,
        seasonNumber: sNum,
        season_number: sNum,
        name: s.name || (sNum === 0 ? 'Specials' : `Season ${sNum}`),
        episodeCount: epCount,
        episode_count: epCount,
        airDate,
        air_date: airDate,
        posterPath,
        poster_path: posterPath,
        posterUrl:
          s.posterUrl ||
          (posterPath
            ? posterPath.startsWith('http')
              ? posterPath
              : `https://image.tmdb.org/t/p/w342${posterPath}`
            : null),
        overview: s.overview || '',
        voteAverage: voteAvg,
        vote_average: voteAvg,
      };
    })
    .sort((a, b) => {
      if (a.seasonNumber === 0 && b.seasonNumber !== 0) return 1;
      if (b.seasonNumber === 0 && a.seasonNumber !== 0) return -1;
      return a.seasonNumber - b.seasonNumber;
    });

  const isTv = d.type === 'tv' || d.media_type === 'tv' || d.subType === 'webseries' || d.isWebSeries;
  const fallbackTotalSeasons =
    Number(d.numberOfSeasons || d.number_of_seasons) ||
    seasons.filter((s) => s.seasonNumber > 0).length ||
    seasons.length ||
    (isTv ? 1 : 0);

  if (isTv && seasons.length === 0 && fallbackTotalSeasons > 0) {
    seasons = Array.from({ length: fallbackTotalSeasons }, (_, i) => ({
      seasonNumber: i + 1,
      season_number: i + 1,
      name: `Season ${i + 1}`,
      episodeCount: Number(d.numberOfEpisodes || d.number_of_episodes) || 0,
      episode_count: Number(d.numberOfEpisodes || d.number_of_episodes) || 0,
      airDate: d.first_air_date || '',
      air_date: d.first_air_date || '',
      posterPath: d.poster_path || '',
      poster_path: d.poster_path || '',
      posterUrl: d.posterUrl || null,
      overview: d.overview || '',
      voteAverage: Number(d.rating || d.vote_average) || 0,
      vote_average: Number(d.rating || d.vote_average) || 0,
    }));
  }

  const rawVideos = d.videoList || d.videos?.results || [];
  const videos = rawVideos
    .map((rawV) => {
      const v = unwrapSubdoc(rawV) || {};
      const key =
        v.key ||
        (typeof v.url === 'string' && v.url.includes('v=')
          ? v.url.split('v=')[1]?.split('&')[0]
          : null);
      if (!key) return null;
      return {
        ...v,
        id: v.id || key,
        key,
        name: v.name || v.type || 'Official Video',
        site: v.site || 'YouTube',
        type: v.type || 'Trailer',
        url: v.url || `https://www.youtube.com/watch?v=${key}`,
        embedUrl: v.embedUrl || `https://www.youtube.com/embed/${key}`,
        thumbnailUrl: v.thumbnailUrl || `https://img.youtube.com/vi/${key}/hqdefault.jpg`,
      };
    })
    .filter(Boolean);

  const unwrapList = (arr) => (Array.isArray(arr) ? arr.map(unwrapSubdoc) : []);
  const wp = d.watchProviders || {};

  return {
    ...d,
    numberOfSeasons: fallbackTotalSeasons || d.numberOfSeasons,
    number_of_seasons: fallbackTotalSeasons || d.number_of_seasons,
    seasons,
    seasonsDetails: Array.isArray(d.seasonsDetails)
      ? d.seasonsDetails.map((sd) => normalizeSeasonData(sd)).filter(Boolean)
      : [],
    videoList: videos,
    videos: { results: videos },
    productionCompanies: unwrapList(d.productionCompanies),
    networks: unwrapList(d.networks),
    tmdbReviews: unwrapList(d.tmdbReviews),
    watchProviders: {
      ...wp,
      flatrate: unwrapList(wp.flatrate),
      free: unwrapList(wp.free),
      rent: unwrapList(wp.rent),
      buy: unwrapList(wp.buy),
    },
  };
};

// Clear all cached catalog/detail responses in localStorage & sessionStorage after edits/syncs
export const clearCatalogCache = () => {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(CACHE_PREFIX) || k.startsWith('movieshub_cache')) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
  try {
    for (const k of Object.keys(sessionStorage)) {
      if (k.startsWith('mh_api_cache:')) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
};

const MAX_CACHE_ENTRIES = 60;

const writeCache = (key, data) => {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    localStorage.setItem(
      fullKey,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
    const allKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX),
    );
    if (allKeys.length > MAX_CACHE_ENTRIES) {
      const sorted = allKeys
        .map((k) => {
          try {
            return { k, t: JSON.parse(localStorage.getItem(k))?.savedAt || 0 };
          } catch {
            return { k, t: 0 };
          }
        })
        .sort((a, b) => a.t - b.t);
      for (const item of sorted.slice(0, allKeys.length - MAX_CACHE_ENTRIES)) {
        if (!item.k.includes('home')) localStorage.removeItem(item.k);
      }
    }
  } catch {
    /* ignore storage quota */
  }
};

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw)?.data ?? null) : null;
  } catch {
    return null;
  }
};

const getAllCachedTitles = () => {
  const map = new Map();
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(CACHE_PREFIX)) continue;
      const parsed = JSON.parse(localStorage.getItem(k))?.data;
      if (!parsed) continue;
      const addList = (arr) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
          if (item?.id)
            map.set(
              `${item.type || item.media_type || 'movie'}:${item.id}`,
              item,
            );
        }
      };
      addList(parsed.hero);
      addList(parsed.items);
      addList(parsed.results);
      addList(parsed.top10Today);
      addList(parsed.top10Week);
      addList(parsed.upcoming?.items);
      if (Array.isArray(parsed.rows))
        parsed.rows.forEach((r) => addList(r.items));
      if (parsed.id && (parsed.title || parsed.name)) {
        map.set(
          `${parsed.type || parsed.media_type || 'movie'}:${parsed.id}`,
          parsed,
        );
      }
    }
  } catch {
    /* ignore */
  }
  return Array.from(map.values());
};

const filterOfflineTitles = (type, params = {}) => {
  let list = getAllCachedTitles();
  if (type === 'webseries') {
    list = list.filter(
      (m) =>
        m.isWebSeries ||
        m.subType === 'webseries' ||
        (m.type || m.media_type) === 'tv',
    );
  } else if (type === 'movie' || type === 'tv') {
    list = list.filter((m) => (m.type || m.media_type || 'movie') === type);
  }
  if (params.q) {
    const q = String(params.q).toLowerCase().trim();
    list = list.filter(
      (m) =>
        (m.title || m.name || '').toLowerCase().includes(q) ||
        (m.originalTitle || '').toLowerCase().includes(q),
    );
  }
  return {
    items: list,
    results: list,
    page: 1,
    total: list.length,
    totalPages: 1,
    source: 'offline_browser_cache',
  };
};

const requestBackendWithCache = async (
  cacheKey,
  requestFn,
  offlineSynthesizer = null,
) => {
  try {
    const data = await requestFn();
    if (data) writeCache(cacheKey, data);
    return data;
  } catch (err) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
    if (offlineSynthesizer) {
      const fallback = offlineSynthesizer();
      if (fallback) return fallback;
    }
    throw err;
  }
};

const stableParamsKey = (params = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

export const tmdb = {
  home: (params = {}) => {
    const key = `home:${stableParamsKey(params)}`;
    return requestBackendWithCache(
      key,
      () => backend.get('/discover/home', { params }).then((r) => r.data),
      () => {
        const all = getAllCachedTitles();
        if (!all.length) return null;
        return {
          hero: all.slice(0, 6),
          upcoming: { title: 'Upcoming Releases', items: all.slice(0, 10) },
          top10Today: all.slice(0, 10).map((x, i) => ({ ...x, rank: i + 1 })),
          top10Week: all.slice(0, 10).map((x, i) => ({ ...x, rank: i + 1 })),
          celebrities: [],
          blogs: [],
          rows: [
            {
              key: 'cached',
              title: 'Cached Titles (Backend Offline)',
              items: all.slice(0, 20),
            },
          ],
        };
      },
    );
  },

  trending: (type = 'movie') =>
    requestBackendWithCache(
      `trending:${type}`,
      () =>
        backend
          .get('/discover/lists/trending', { params: { type } })
          .then((r) => r.data),
      () => filterOfflineTitles(type),
    ),

  list: (type, category, params = {}) => {
    const normalized = String(category).replace('_', '-');
    const key = `list:${type}:${normalized}:${stableParamsKey(params)}`;
    return requestBackendWithCache(
      key,
      async () => {
        const r = await backend.get(`/discover/lists/${normalized}`, {
          params: { type, ...params },
        });
        const data = r.data || {};
        const items = data.items || data.results || [];
        if (type === 'tv' && items.length < 8) {
          try {
            const fallbackRes = await backend.get(`/discover/lists/${normalized}`, {
              params: { type: 'webseries', ...params },
            });
            const extra = (fallbackRes.data?.items || fallbackRes.data?.results || []).map((x) => ({
              ...x,
              type: 'tv',
              subType: 'tv',
              isWebSeries: false,
            }));
            const seen = new Set(items.map((i) => i.id));
            const merged = [
              ...items.map((x) => ({ ...x, type: 'tv', subType: 'tv', isWebSeries: false })),
              ...extra.filter((x) => !seen.has(x.id)),
            ];
            return {
              ...data,
              items: merged,
              results: merged,
              total: Math.max(data.total || 0, fallbackRes.data?.total || merged.length),
              total_results: Math.max(
                data.total_results || 0,
                fallbackRes.data?.total_results || merged.length,
              ),
              totalPages: Math.max(data.totalPages || 1, fallbackRes.data?.totalPages || 1),
              total_pages: Math.max(data.total_pages || 1, fallbackRes.data?.total_pages || 1),
            };
          } catch {
            /* ignore fallback error */
          }
        }
        return data;
      },
      () => filterOfflineTitles(type, params),
    );
  },

  discover: (type, params = {}) => {
    const key = `discover:${type}:${stableParamsKey(params)}`;
    return requestBackendWithCache(
      key,
      async () => {
        const r = await backend.get('/discover', { params: { type, ...params } });
        const data = r.data || {};
        const items = data.items || data.results || [];
        if (type === 'tv' && items.length < 8) {
          try {
            const fallbackRes = await backend.get('/discover', {
              params: { type: 'webseries', ...params },
            });
            const extra = (fallbackRes.data?.items || fallbackRes.data?.results || []).map((x) => ({
              ...x,
              type: 'tv',
              subType: 'tv',
              isWebSeries: false,
            }));
            const seen = new Set(items.map((i) => i.id));
            const merged = [
              ...items.map((x) => ({ ...x, type: 'tv', subType: 'tv', isWebSeries: false })),
              ...extra.filter((x) => !seen.has(x.id)),
            ];
            return {
              ...data,
              items: merged,
              results: merged,
              total: Math.max(data.total || 0, fallbackRes.data?.total || merged.length),
              total_results: Math.max(
                data.total_results || 0,
                fallbackRes.data?.total_results || merged.length,
              ),
              totalPages: Math.max(data.totalPages || 1, fallbackRes.data?.totalPages || 1),
              total_pages: Math.max(data.total_pages || 1, fallbackRes.data?.total_pages || 1),
            };
          } catch {
            /* ignore fallback error */
          }
        }
        return data;
      },
      () => filterOfflineTitles(type, params),
    );
  },

  search: (q, params = {}) => {
    const key = `search:${q}:${stableParamsKey(params)}`;
    return requestBackendWithCache(
      key,
      () =>
        backend
          .get('/discover/search', { params: { q, ...params } })
          .then((r) => r.data),
      () => filterOfflineTitles(params.type, { ...params, q }),
    );
  },

  detail: async (type, slugOrId) => {
    const rawTypeStr = String(type || '').toLowerCase().trim();
    const cleanType = ['webseries', 'web-series', 'tv', 'tv-show', 'tv-shows', 'tv-series', 'series'].includes(rawTypeStr)
      ? 'tv'
      : 'movie';
    const rawParam = decodeURIComponent(String(slugOrId || '')).trim();
    const isNumeric = /^\d+$/.test(rawParam);
    const mapped = !isNumeric ? resolveSlugMapping(rawParam) : null;
    const effectiveType = mapped?.type || cleanType;
    const key = `detail:${effectiveType}:${rawParam.toLowerCase()}`;

    return requestBackendWithCache(
      key,
      async () => {
        const targetId = isNumeric ? rawParam : mapped?.id;
        if (targetId) {
          try {
            const r = await backend.get(`/titles/${effectiveType}/${targetId}`);
            const d = normalizeDetailData(r.data.detail || r.data.titleObj || r.data);
            if (d?.id) registerSlugMapping(toSlug(d.title || d.name), d);
            return d;
          } catch {
            /* fall through */
          }
        }
        try {
          const r = await backend.get(
            `/titles/${effectiveType}/${encodeURIComponent(rawParam)}`,
          );
          const d = normalizeDetailData(r.data.detail || r.data.titleObj || r.data);
          if (d?.id) registerSlugMapping(toSlug(d.title || d.name), d);
          return d;
        } catch (err) {
          const searchWords = rawParam.replace(/-/g, ' ').trim();
          const sRes = await backend.get('/discover/search', {
            params: { q: searchWords },
          });
          const candidates = sRes.data?.items || sRes.data?.results || [];
          const best =
            candidates.find(
              (c) => toSlug(c.title || c.name) === rawParam.toLowerCase(),
            ) || candidates[0];
          if (best?.id) {
            const bestType =
              (best.type || best.media_type) === 'tv' ? 'tv' : 'movie';
            const r3 = await backend.get(`/titles/${bestType}/${best.id}`);
            const d3 = normalizeDetailData(r3.data.detail || r3.data.titleObj || r3.data);
            if (d3?.id) registerSlugMapping(rawParam.toLowerCase(), d3);
            return d3;
          }
          throw err;
        }
      },
      () => {
        const all = getAllCachedTitles();
        const found =
          all.find(
            (m) =>
              String(m.id) === rawParam ||
              toSlug(m.title || m.name) === rawParam.toLowerCase(),
          ) || null;
        return found ? normalizeDetailData(found) : null;
      },
    ).then((res) => normalizeDetailData(res));
  },

  season: (tvId, seasonNumber = 1) => {
    const parsed = Number(seasonNumber);
    const safeSeason = Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
    const key = `season:${tvId}:${safeSeason}`;
    return requestBackendWithCache(key, () =>
      backend
        .get(`/titles/tv/${tvId}/season/${safeSeason}`)
        .then((r) => normalizeSeasonData(r.data?.season || r.data, safeSeason)),
    ).then((res) => normalizeSeasonData(res, safeSeason));
  },

  person: (name, id = null) => {
    const params = { name, ...(id ? { id } : {}) };
    const key = `person:${name}:${id || ''}`;
    return requestBackendWithCache(key, () =>
      backend.get('/discover/person', { params }).then((r) => r.data),
    );
  },

  celebrities: (region = 'IN') =>
    requestBackendWithCache(`celebrities:${region}`, () =>
      backend
        .get('/discover/celebrities', { params: { region } })
        .then((r) => r.data.celebrities || []),
    ),
};

// Featured Hero Carousel API (Public + Admin/SuperAdmin)
export const featuredApi = {
  listPublic: () => backend.get('/featured').then((r) => r.data.items || []),
  listAdmin: () =>
    backend.get('/featured/admin').then((r) => r.data.items || []),
  listAdminFull: () =>
    backend.get('/featured/admin').then((r) => r.data || { items: [], heroLimit: 10 }),
  updateConfig: (heroLimit) =>
    backend.patch('/featured/config', { heroLimit }).then((r) => {
      clearCatalogCache();
      return r.data;
    }),
  add: (payload) =>
    backend.post('/featured', payload).then((r) => {
      clearCatalogCache();
      return r.data.item;
    }),
  update: (id, payload) =>
    backend.patch(`/featured/${id}`, payload).then((r) => {
      clearCatalogCache();
      return r.data.item;
    }),
  reorder: (orderedIds) =>
    backend
      .put('/featured/reorder', { orderedIds })
      .then((r) => {
        clearCatalogCache();
        return r.data.items || [];
      }),
  remove: (id) =>
    backend.delete(`/featured/${id}`).then((r) => {
      clearCatalogCache();
      return r.data;
    }),
};

// Blog & Editorial CMS API (Public + Admin/SuperAdmin)
export const blogApi = {
  list: (params = {}) => backend.get('/blogs', { params }).then((r) => r.data),
  get: (slugOrId) => backend.get(`/blogs/${slugOrId}`).then((r) => r.data),
  previewMovieAssets: (type, tmdbId) =>
    backend
      .get(`/blogs/movie-assets/${type}/${tmdbId}`)
      .then((r) => r.data.assets),
  create: (payload) => backend.post('/blogs', payload).then((r) => r.data.blog),
  update: (id, payload) =>
    backend.patch(`/blogs/${id}`, payload).then((r) => r.data.blog),
  remove: (id) => backend.delete(`/blogs/${id}`).then((r) => r.data),
  toggleLike: (id) => backend.post(`/blogs/${id}/like`).then((r) => r.data),
  listComments: (blogId) =>
    backend.get(`/blogs/${blogId}/comments`).then((r) => r.data.comments || []),
  addComment: (blogId, payload) =>
    backend.post(`/blogs/${blogId}/comments`, payload).then((r) => r.data),
  toggleCommentLike: (commentId) =>
    backend.post(`/blogs/comments/${commentId}/like`).then((r) => r.data),
  moderateComment: (commentId, payload) =>
    backend.patch(`/blogs/comments/${commentId}`, payload).then((r) => r.data),
  deleteComment: (commentId) =>
    backend.delete(`/blogs/comments/${commentId}`).then((r) => r.data),
};

export const GROUP_SYMBOLS = [
  '🎬',
  '🍿',
  '🎥',
  '🎞️',
  '📽️',
  '🎭',
  '📺',
  '🔥',
  '⭐',
  '🌟',
  '💎',
  '🏆',
  '👑',
  '🚀',
  '💬',
  '🗣️',
  '📢',
  '🎧',
  '🎵',
  '🎸',
  '🕹️',
  '👾',
  '🦸',
  '🦹',
  '🕵️',
  '👻',
  '👽',
  '🤖',
  '🐉',
  '⚔️',
  '🛡️',
  '🇮🇳',
  '🌍',
  '🌸',
  '⛩️',
  '💰',
  '📈',
  '❤️',
  '⚡',
  '🌙',
];

export const COMMUNITY_TOPICS = [
  { value: 'general', label: 'General Cinema' },
  { value: 'bollywood', label: 'Bollywood & Indian' },
  { value: 'hollywood', label: 'Hollywood & Global' },
  { value: 'tollywood', label: 'Pan-India & South' },
  { value: 'webseries', label: 'Web Series & OTT' },
  { value: 'boxoffice', label: 'Box Office & Trade' },
  { value: 'anime', label: 'Anime & K-Drama' },
  { value: 'spoilers', label: 'Spoilers & Theories' },
  { value: 'fanclub', label: 'Fan Club' },
];

const LEFT_ROOMS_STORAGE_PREFIX = 'movieshub_left_rooms_v1:';

const getLeftRoomSet = (userId) => {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(`${LEFT_ROOMS_STORAGE_PREFIX}${userId}`);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

const markRoomLeft = (userId, roomId, left = true) => {
  if (!userId || !roomId) return;
  try {
    const set = getLeftRoomSet(userId);
    if (left) set.add(String(roomId));
    else set.delete(String(roomId));
    localStorage.setItem(`${LEFT_ROOMS_STORAGE_PREFIX}${userId}`, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
};

// Community Chat Groups API (User & Admin Communities, Join/Leave, Multiple/Transferable Admins, Moderation)
export const communityApi = {
  getTopics: () =>
    backend
      .get('/community/topics')
      .then((r) => r.data?.topics || [])
      .catch(() => []),
  getSymbols: () =>
    backend
      .get('/community/symbols')
      .then((r) => r.data?.symbols || GROUP_SYMBOLS)
      .catch(() => GROUP_SYMBOLS),
  listRooms: async (params = {}) => {
    const r = await backend.get('/community/rooms', { params });
    const rawRooms = Array.isArray(r.data?.rooms) ? r.data.rooms : [];
    const currentUser = readSavedUser();
    const uid = currentUser?.id ? String(currentUser.id) : null;
    const isStaff = currentUser && ['admin', 'superadmin'].includes(currentUser.role);
    const leftSet = getLeftRoomSet(uid);

    // If an Admin/SuperAdmin is logged in and any official/admin-created room in DB has 0 members
    // (e.g. seeded lounges before an admin was linked), automatically assign the creator/admin in DB!
    if (uid && isStaff) {
      const unseededRooms = rawRooms.filter(
        (rm) =>
          (!rm.memberCount || rm.memberCount === 0 || !rm.admins?.length) &&
          !leftSet.has(String(rm.id)) &&
          (rm.isOfficial || !rm.createdBy || String(rm.createdBy?.id) === uid),
      );
      if (unseededRooms.length > 0) {
        await Promise.all(
          unseededRooms.map(async (rm) => {
            const targetAdminId = rm.createdBy?.id || uid;
            try {
              const updated = await backend
                .post(
                  `/community/rooms/${rm.id}/admins`,
                  { userId: targetAdminId, transfer: false },
                  { silentPatch: true },
                )
                .then((res) => res.data?.room);
              if (updated) {
                Object.assign(rm, updated);
              }
            } catch {
              /* ignore */
            }
          }),
        );
      }
    }

    return rawRooms.map((rm) => {
      if (uid && leftSet.has(String(rm.id))) {
        const filteredMembers = Array.isArray(rm.memberIds)
          ? rm.memberIds.filter((id) => String(id) !== uid)
          : [];
        return {
          ...rm,
          memberIds: filteredMembers,
          isMember: false,
          isRoomAdmin: false,
        };
      }
      return rm;
    });
  },
  getOrCreateMovieRoom: (type, tmdbId) =>
    backend
      .post(`/community/rooms/movie/${type}/${tmdbId}`, {}, { silentPatch: true })
      .then((r) => r.data.room),
  createRoom: (payload) =>
    backend.post('/community/rooms', payload).then((r) => {
      const currentUser = readSavedUser();
      if (currentUser?.id && r.data?.room?.id) {
        markRoomLeft(currentUser.id, r.data.room.id, false);
      }
      return r.data.room;
    }),
  updateRoom: (roomId, payload) =>
    backend
      .patch(`/community/rooms/${roomId}`, payload)
      .then((r) => r.data.room),
  deleteRoom: (roomId) =>
    backend.delete(`/community/rooms/${roomId}`).then((r) => r.data),
  joinRoom: (roomId) => {
    const currentUser = readSavedUser();
    if (currentUser?.id) markRoomLeft(currentUser.id, roomId, false);
    return backend
      .post(`/community/rooms/${roomId}/join`, {}, { silentPatch: true })
      .then((r) => r.data.room);
  },
  leaveRoom: (roomId) => {
    const currentUser = readSavedUser();
    if (currentUser?.id) markRoomLeft(currentUser.id, roomId, true);
    return backend
      .post(`/community/rooms/${roomId}/leave`, {}, { silentPatch: true })
      .then((r) => r.data.room);
  },
  getRoomMembers: (roomId) =>
    backend.get(`/community/rooms/${roomId}/members`).then((r) => r.data),
  promoteOrTransferAdmin: (roomId, payload) =>
    backend
      .post(`/community/rooms/${roomId}/admins`, payload, { silentPatch: true })
      .then((r) => r.data.room),
  removeAdmin: (roomId, targetUserId) =>
    backend
      .delete(`/community/rooms/${roomId}/admins/${targetUserId}`, { silentPatch: true })
      .then((r) => r.data.room),
  blockUser: (roomId, userId) =>
    backend
      .post(`/community/rooms/${roomId}/block-user`, { userId }, { silentPatch: true })
      .then((r) => r.data),
  unblockUser: (roomId, userId) =>
    backend
      .post(`/community/rooms/${roomId}/unblock-user`, { userId }, { silentPatch: true })
      .then((r) => r.data),
  listMessages: (roomId, params = {}) =>
    backend
      .get(`/community/rooms/${roomId}/messages`, { params })
      .then((r) => r.data),
  sendMessage: (roomId, payload) =>
    backend
      .post(`/community/rooms/${roomId}/messages`, payload, { silentPatch: true })
      .then((r) => r.data?.chatMessage || r.data?.message),
  toggleLike: (messageId) =>
    backend
      .post(`/community/messages/${messageId}/like`, {}, { silentPatch: true })
      .then((r) => r.data),
  updateMessage: (messageId, payload) =>
    backend
      .patch(`/community/messages/${messageId}`, payload, { silentPatch: true })
      .then((r) => r.data?.chatMessage || r.data?.message),
  deleteMessage: (messageId) =>
    backend
      .delete(`/community/messages/${messageId}`, { silentPatch: true })
      .then((r) => r.data),
  searchUsers: (q = '') =>
    backend
      .get('/community/users', { params: { q } })
      .then((r) => r.data.users || []),
};

export const img = (
  path,
  size = 'w500',
  label = 'Movies Hub',
  variant = 'poster',
) => resolveImage(path, size, label, variant);

// Dynamic Sitemap API (Fetches all DB titles, blogs, celebrities & rooms for /sitemap & /sitemap.xml)
export const sitemapApi = {
  getJson: (siteUrl = window.location.origin) =>
    backend.get('/sitemap.json', { params: { siteUrl } }).then((r) => r.data),
  getXmlUrl: (siteUrl = window.location.origin) =>
    `${backend.defaults.baseURL}/sitemap.xml?siteUrl=${encodeURIComponent(siteUrl)}`,
};
