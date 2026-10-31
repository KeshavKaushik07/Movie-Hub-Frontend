import { backend, readSavedUser } from './backendApi';
import {
  resolveImage,
  resolveSlugMapping,
  registerSlugMapping,
  toSlug,
} from '../utils/formatters';

const CACHE_PREFIX = 'movieshub_cache_v8:';
const MAX_CACHE_ENTRIES = 100;
// Minimum interval before re-checking `/discover/sync-check` for the same cached key (unless a mutation occurred)
const SYNC_CHECK_COOLDOWN_MS = 0;

// Fast 1st-tier in-memory cache so navigating Back between pages is 0ms without JSON.parse overhead
const memoryCache = new Map();
const inFlightRequests = new Map();
const inFlightSyncChecks = new Map();
const cacheSubscribers = new Set();
let lastGlobalSyncCheckAt = 0;

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

/**
 * Subscribe to background Delta-Sync or Full-Refresh cache updates.
 * Listeners receive `{ key, data, mode }`.
 */
export const subscribeCacheUpdates = (listener) => {
  if (typeof listener !== 'function') return () => {};
  cacheSubscribers.add(listener);
  return () => {
    cacheSubscribers.delete(listener);
  };
};

const notifyCacheSubscribers = (key, data, mode = 'delta') => {
  cacheSubscribers.forEach((listener) => {
    try {
      listener({ key, data, mode });
    } catch {
      /* ignore listener errors */
    }
  });
};

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

// Clear all cached catalog/detail responses in memory, localStorage & sessionStorage (used only for bulk resets)
export const clearCatalogCache = () => {
  memoryCache.clear();
  lastGlobalSyncCheckAt = 0;
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

const readCacheEntry = (key) => {
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data !== undefined) {
      const entry = {
        savedAt: Number(parsed.savedAt) || Date.now(),
        lastCheckedAt: Number(parsed.lastCheckedAt || parsed.savedAt) || Date.now(),
        data: parsed.data,
      };
      memoryCache.set(key, entry);
      return entry;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const readCache = (key) => readCacheEntry(key)?.data ?? null;

export const peekCache = (key) => readCache(key);

const writeCache = (key, data, savedAt = Date.now()) => {
  const entry = {
    savedAt,
    lastCheckedAt: Date.now(),
    data,
  };
  memoryCache.set(key, entry);

  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    localStorage.setItem(fullKey, JSON.stringify(entry));
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
        if (!item.k.includes('home')) {
          localStorage.removeItem(item.k);
        }
      }
    }
  } catch {
    /* ignore storage quota */
  }
};

const touchCacheEntryChecked = (key, serverTime = Date.now()) => {
  const entry = readCacheEntry(key);
  if (!entry) return;
  entry.lastCheckedAt = Date.now();
  if (serverTime) entry.savedAt = serverTime;
  memoryCache.set(key, entry);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
};

/**
 * Patches ONLY the changed items (1..10 titles/details/blogs) in-place across all cached
 * Home feeds, Browse grids, OTT Hub lists, Person filmographies, and Detail entries
 * WITHOUT re-fetching the whole page!
 */
export const applyDeltaSyncToCache = ({
  updatedTitles = [],
  updatedDetails = [],
  updatedBlogs = [],
  serverTime = Date.now(),
} = {}) => {
  if (
    !updatedTitles.length &&
    !updatedDetails.length &&
    !updatedBlogs.length
  ) {
    return;
  }

  const titlePatchMap = new Map();
  for (const t of updatedTitles) {
    if (!t?.id && !t?.tmdbId) continue;
    const id = Number(t.id || t.tmdbId);
    const baseType = (t.type || t.media_type) === 'tv' ? 'tv' : 'movie';
    titlePatchMap.set(`${baseType}:${id}`, t);
    titlePatchMap.set(`id:${id}`, t);
  }

  const detailPatchMap = new Map();
  for (const rawD of updatedDetails) {
    const d = normalizeDetailData(rawD);
    if (!d?.id && !d?.tmdbId) continue;
    const id = Number(d.id || d.tmdbId);
    const baseType = (d.type || d.media_type) === 'tv' ? 'tv' : 'movie';
    detailPatchMap.set(`${baseType}:${id}`, d);
    detailPatchMap.set(`id:${id}`, d);
    if (!titlePatchMap.has(`${baseType}:${id}`)) {
      titlePatchMap.set(`${baseType}:${id}`, d);
      titlePatchMap.set(`id:${id}`, d);
    }
  }

  const blogPatchMap = new Map();
  for (const b of updatedBlogs) {
    if (!b?.id && !b?.slug) continue;
    if (b.id) blogPatchMap.set(`id:${b.id}`, b);
    if (b.slug) blogPatchMap.set(`slug:${String(b.slug).toLowerCase()}`, b);
  }

  const patchItemArray = (arr) => {
    if (!Array.isArray(arr) || !titlePatchMap.size) return { list: arr, changed: false };
    let changed = false;
    const nextList = arr.map((item) => {
      if (!item || (!item.id && !item.tmdbId)) return item;
      const id = Number(item.id || item.tmdbId);
      const itemType =
        (item.type || item.media_type) === 'tv' || item.subType === 'webseries'
          ? 'tv'
          : 'movie';
      const patch =
        titlePatchMap.get(`${itemType}:${id}`) || titlePatchMap.get(`id:${id}`);
      if (!patch) return item;
      changed = true;
      return {
        ...item,
        ...patch,
        // Preserve rank or featured slide flags if present in a Hero or Top 10 list
        ...(item.rank !== undefined ? { rank: item.rank } : {}),
        ...(item.isFeaturedSlide !== undefined
          ? { isFeaturedSlide: item.isFeaturedSlide }
          : {}),
      };
    });
    return { list: changed ? nextList : arr, changed };
  };

  const patchBlogArray = (arr) => {
    if (!Array.isArray(arr) || !blogPatchMap.size) return { list: arr, changed: false };
    let changed = false;
    const nextList = arr.map((b) => {
      if (!b) return b;
      const patch =
        (b.id && blogPatchMap.get(`id:${b.id}`)) ||
        (b.slug && blogPatchMap.get(`slug:${String(b.slug).toLowerCase()}`));
      if (!patch) return b;
      changed = true;
      return { ...b, ...patch };
    });
    return { list: changed ? nextList : arr, changed };
  };

  // Collect all cache keys across memoryCache and localStorage
  const allKeys = new Set(memoryCache.keys());
  try {
    for (const fullKey of Object.keys(localStorage)) {
      if (fullKey.startsWith(CACHE_PREFIX)) {
        allKeys.add(fullKey.slice(CACHE_PREFIX.length));
      }
    }
  } catch {
    /* ignore */
  }

  for (const key of allKeys) {
    const entry = readCacheEntry(key);
    if (!entry || !entry.data || typeof entry.data !== 'object') continue;
    const data = entry.data;
    let entryChanged = false;
    let nextData = data;

    if (key.startsWith('detail:')) {
      const id = Number(data.id || data.tmdbId);
      const baseType = (data.type || data.media_type) === 'tv' ? 'tv' : 'movie';
      const detailPatch =
        detailPatchMap.get(`${baseType}:${id}`) || detailPatchMap.get(`id:${id}`);
      if (detailPatch) {
        nextData = normalizeDetailData({
          ...data,
          ...detailPatch,
          similar: detailPatch.similar || data.similar,
          criticReviews: detailPatch.criticReviews || data.criticReviews,
        });
        entryChanged = true;
      }
      // Also patch any updated movies inside this movie's `similar` list (e.g. when a Similar Movie was clicked and enriched from TMDB!)
      if (nextData?.similar) {
        const simResults = patchItemArray(nextData.similar.results);
        const simItems = patchItemArray(nextData.similar.items);
        if (simResults.changed || simItems.changed) {
          nextData = {
            ...nextData,
            similar: {
              ...nextData.similar,
              ...(Array.isArray(nextData.similar.results)
                ? { results: simResults.list }
                : {}),
              ...(Array.isArray(nextData.similar.items)
                ? { items: simItems.list }
                : {}),
            },
          };
          entryChanged = true;
        }
      }
    } else if (key.startsWith('home:')) {
      const heroRes = patchItemArray(data.hero);
      const upcomingRes = patchItemArray(data.upcoming?.items);
      const todayRes = patchItemArray(data.top10Today);
      const weekRes = patchItemArray(data.top10Week);
      const blogsRes = patchBlogArray(data.blogs);
      let rowsChanged = false;
      const nextRows = Array.isArray(data.rows)
        ? data.rows.map((r) => {
            const res = patchItemArray(r.items);
            if (res.changed) {
              rowsChanged = true;
              return { ...r, items: res.list };
            }
            return r;
          })
        : data.rows;

      if (
        heroRes.changed ||
        upcomingRes.changed ||
        todayRes.changed ||
        weekRes.changed ||
        blogsRes.changed ||
        rowsChanged
      ) {
        nextData = {
          ...data,
          hero: heroRes.list,
          upcoming: data.upcoming
            ? { ...data.upcoming, items: upcomingRes.list }
            : data.upcoming,
          top10Today: todayRes.list,
          top10Week: weekRes.list,
          blogs: blogsRes.list,
          rows: nextRows,
        };
        entryChanged = true;
      }
    } else if (key.startsWith('blogs:list:')) {
      const itemsRes = patchBlogArray(data.items);
      if (itemsRes.changed) {
        nextData = { ...data, items: itemsRes.list };
        entryChanged = true;
      }
    } else {
      const itemsRes = patchItemArray(data.items);
      const resultsRes = patchItemArray(data.results);
      if (itemsRes.changed || resultsRes.changed) {
        nextData = {
          ...data,
          ...(Array.isArray(data.items) ? { items: itemsRes.list } : {}),
          ...(Array.isArray(data.results) ? { results: resultsRes.list } : {}),
        };
        entryChanged = true;
      }
    }

    if (entryChanged) {
      // Preserve the entry's original savedAt during in-place delta patches so subsequent sync-checks
      // for that page/movie never miss backend updates that occurred since the page was originally loaded!
      const preservedSavedAt = entry.savedAt || serverTime;
      writeCache(key, nextData, preservedSavedAt);
      notifyCacheSubscribers(key, nextData, 'delta');
    }
  }
};

/**
 * Targeted single-title cache update (used when SuperAdmin edits a movie or a user posts a review).
 * Updates ONLY that movie across all cached pages without wiping unrelated cached pages!
 */
export const patchSingleTitleInCache = (updatedTitleOrDetail) => {
  if (!updatedTitleOrDetail) return;
  applyDeltaSyncToCache({
    updatedTitles: [updatedTitleOrDetail],
    updatedDetails: [updatedTitleOrDetail],
    serverTime: Date.now(),
  });
};

/**
 * Forces the next visit/check for a specific movie detail to re-verify against the backend
 * (e.g. after a user submits a review or comment on that movie).
 */
export const markTitleForDeltaSync = (type, tmdbId) => {
  lastGlobalSyncCheckAt = 0;
  for (const [key, entry] of memoryCache.entries()) {
    if (key.includes(String(tmdbId).toLowerCase()) || key.startsWith('detail:')) {
      entry.lastCheckedAt = 0;
      entry.savedAt = Math.max(1, (entry.savedAt || Date.now()) - 60_000);
    }
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

/**
 * Runs a lightweight background `/discover/sync-check` against the backend:
 * - `mode === 'none'`: 0 items changed -> do nothing!
 * - `mode === 'delta'`: 1..10 items changed -> patch ONLY those changed items in-place!
 * - `mode === 'full'`: >10 items changed ("a lot of data changed") -> re-fetch full page in background!
 */
const revalidateKeyWithDeltaCheck = async (
  cacheKey,
  cachedEntry,
  requestFn,
  detailMeta = null,
) => {
  const now = Date.now();
  const lastCheck = cachedEntry.lastCheckedAt || cachedEntry.savedAt || 0;
  if (
    now - lastCheck < SYNC_CHECK_COOLDOWN_MS &&
    (! !detailMeta || now - lastGlobalSyncCheckAt < SYNC_CHECK_COOLDOWN_MS)
  ) {
    return;
  }

  const syncLockKey = detailMeta?.tmdbId
    ? `detail:${detailMeta.type}:${detailMeta.tmdbId}`
    : 'catalog_global';

  if (inFlightSyncChecks.has(syncLockKey)) {
    return inFlightSyncChecks.get(syncLockKey);
  }

  const syncPromise = (async () => {
    try {
      const payload = {
        since: cachedEntry.savedAt || now - 60_000,
        ...(detailMeta ? detailMeta : {}),
      };
      const res = await backend
        .post('/discover/sync-check', payload, { silentPatch: true })
        .then((r) => r.data);

      lastGlobalSyncCheckAt = Date.now();

      if (!res || !res.changed || res.mode === 'none') {
        // Nothing changed on backend — keep cached page as-is!
        touchCacheEntryChecked(cacheKey, res?.serverTime || Date.now());
        return;
      }

      if (res.mode === 'delta') {
        // Only specific items changed on backend — patch ONLY those items in-place!
        applyDeltaSyncToCache(res);
        return;
      }

      if (res.mode === 'full') {
        // A lot of data changed on backend (>10 items or structural update) — re-fetch full page!
        const freshData = await requestFn();
        if (freshData) {
          writeCache(cacheKey, freshData, res.serverTime || Date.now());
          notifyCacheSubscribers(cacheKey, freshData, 'full');
        }
      }
    } catch {
      /* ignore background sync check network errors */
    } finally {
      inFlightSyncChecks.delete(syncLockKey);
    }
  })();

  inFlightSyncChecks.set(syncLockKey, syncPromise);
  return syncPromise;
};

/**
 * Cache-First + Selective Delta-Sync Request Engine:
 * 1. If `cacheKey` is already in cache (e.g. navigating Back to Home/Browse/OTT or re-opening a Movie),
 *    returns the cached data IMMEDIATELY (0ms wait, zero skeleton flash) and triggers a background
 *    `sync-check` that only fetches changed items (or re-fetches all only if a lot of data changed).
 * 2. If `cacheKey` is not in cache yet, fetches from backend, caches, and returns.
 */
const requestBackendWithCache = async (
  cacheKey,
  requestFn,
  offlineSynthesizer = null,
  options = {},
) => {
  const { forceRefresh = false, detailMeta = null } = options;
  const cachedEntry = !forceRefresh ? readCacheEntry(cacheKey) : null;

  const isIncompleteDetail =
    cacheKey.startsWith('detail:') &&
    cachedEntry?.data &&
    cachedEntry.data.hasFullDetails === false;

  if (
    cachedEntry &&
    cachedEntry.data !== null &&
    cachedEntry.data !== undefined &&
    !isIncompleteDetail
  ) {
    const resolvedDetailMeta =
      cacheKey.startsWith('detail:')
        ? {
            type:
              detailMeta?.type ||
              ((cachedEntry.data.type || cachedEntry.data.media_type) === 'tv'
                ? 'tv'
                : 'movie'),
            tmdbId: Number(
              detailMeta?.tmdbId ||
                cachedEntry.data.id ||
                cachedEntry.data.tmdbId ||
                0,
            ),
            cachedUpdatedAt: cachedEntry.data.updatedAt || null,
            hasFullDetails: Boolean(cachedEntry.data.hasFullDetails),
            cachedBudget: Number(cachedEntry.data.budget || 0),
            cachedRevenue: Number(cachedEntry.data.revenue || 0),
            cachedSiteRating: Number(cachedEntry.data.siteRating || 0),
          }
        : detailMeta;
    // Trigger non-blocking selective delta check in the background
    revalidateKeyWithDeltaCheck(
      cacheKey,
      cachedEntry,
      requestFn,
      resolvedDetailMeta,
    );
    return cachedEntry.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const reqPromise = (async () => {
    try {
      const data = await requestFn();
      if (data) writeCache(cacheKey, data);
      return data;
    } catch (err) {
      const fallbackCached = readCache(cacheKey);
      if (fallbackCached) return fallbackCached;
      if (offlineSynthesizer) {
        const fallback = offlineSynthesizer();
        if (fallback) return fallback;
      }
      throw err;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, reqPromise);
  return reqPromise;
};

export const stableParamsKey = (params = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

export const buildDetailCacheKey = (type, slugOrId) => {
  const rawTypeStr = String(type || '').toLowerCase().trim();
  const cleanType = [
    'webseries',
    'web-series',
    'tv',
    'tv-show',
    'tv-shows',
    'tv-series',
    'series',
  ].includes(rawTypeStr)
    ? 'tv'
    : 'movie';
  const rawParam = decodeURIComponent(String(slugOrId || '')).trim();
  const isNumeric = /^\d+$/.test(rawParam);
  const mapped = !isNumeric ? resolveSlugMapping(rawParam) : null;
  const effectiveType = mapped?.type || cleanType;
  const key = `detail:${effectiveType}:${rawParam.toLowerCase()}`;
  return { key, effectiveType, rawParam, isNumeric, mapped };
};

export const tmdb = {
  peekHome: (params = {}) => readCache(`home:${stableParamsKey(params)}`),

  home: (params = {}, options = {}) => {
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
      options,
    );
  },

  peekTrending: (type = 'movie') => readCache(`trending:${type}`),

  trending: (type = 'movie', options = {}) =>
    requestBackendWithCache(
      `trending:${type}`,
      () =>
        backend
          .get('/discover/lists/trending', { params: { type } })
          .then((r) => r.data),
      () => filterOfflineTitles(type),
      options,
    ),

  peekList: (type, category, params = {}) => {
    const normalized = String(category).replace('_', '-');
    return readCache(`list:${type}:${normalized}:${stableParamsKey(params)}`);
  },

  list: (type, category, params = {}, options = {}) => {
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
      options,
    );
  },

  peekDiscover: (type, params = {}) =>
    readCache(`discover:${type}:${stableParamsKey(params)}`),

  discover: (type, params = {}, options = {}) => {
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
      options,
    );
  },

  peekSearch: (q, params = {}) =>
    readCache(`search:${q}:${stableParamsKey(params)}`),

  search: (q, params = {}, options = {}) => {
    const key = `search:${q}:${stableParamsKey(params)}`;
    return requestBackendWithCache(
      key,
      () =>
        backend
          .get('/discover/search', { params: { q, ...params } })
          .then((r) => r.data),
      () => filterOfflineTitles(params.type, { ...params, q }),
      options,
    );
  },

  peekDetail: (type, slugOrId) => {
    const { key, effectiveType, rawParam, mapped } = buildDetailCacheKey(
      type,
      slugOrId,
    );
    const direct = readCache(key);
    if (direct) return normalizeDetailData(direct);
    if (mapped?.id) {
      const byId = readCache(`detail:${effectiveType}:${mapped.id}`);
      if (byId) return normalizeDetailData(byId);
    }
    for (const [k, entry] of memoryCache.entries()) {
      if (!k.startsWith('detail:') || !entry?.data) continue;
      const d = entry.data;
      if (
        String(d.id || d.tmdbId) === rawParam ||
        toSlug(d.title || d.name) === rawParam.toLowerCase()
      ) {
        return normalizeDetailData(d);
      }
    }
    return null;
  },

  detail: async (type, slugOrId, options = {}) => {
    const { key, effectiveType, rawParam, isNumeric, mapped } =
      buildDetailCacheKey(type, slugOrId);
    const targetId = isNumeric ? Number(rawParam) : mapped?.id ? Number(mapped.id) : null;

    return requestBackendWithCache(
      key,
      async () => {
        if (targetId) {
          try {
            const r = await backend.get(`/titles/${effectiveType}/${targetId}`);
            const d = normalizeDetailData(r.data.detail || r.data.titleObj || r.data);
            if (d?.id) {
              const slug = toSlug(d.title || d.name);
              registerSlugMapping(slug, d);
              writeCache(`detail:${effectiveType}:${d.id}`, d);
              if (slug) writeCache(`detail:${effectiveType}:${slug}`, d);
              patchSingleTitleInCache(d);
            }
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
          if (d?.id) {
            const slug = toSlug(d.title || d.name);
            registerSlugMapping(slug, d);
            writeCache(`detail:${effectiveType}:${d.id}`, d);
            if (slug) writeCache(`detail:${effectiveType}:${slug}`, d);
            patchSingleTitleInCache(d);
          }
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
            if (d3?.id) {
              registerSlugMapping(rawParam.toLowerCase(), d3);
              writeCache(`detail:${bestType}:${d3.id}`, d3);
              patchSingleTitleInCache(d3);
            }
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
      {
        ...options,
        detailMeta: targetId ? { type: effectiveType, tmdbId: targetId } : null,
      },
    ).then((res) => normalizeDetailData(res));
  },

  peekSeason: (tvId, seasonNumber = 1) => {
    const parsed = Number(seasonNumber);
    const safeSeason = Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
    const cached = readCache(`season:${tvId}:${safeSeason}`);
    return cached ? normalizeSeasonData(cached, safeSeason) : null;
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

  peekPerson: (name, id = null) =>
    readCache(`person:${String(name || '').toLowerCase()}:${id || ''}`) ||
    readCache(`person:${String(name || '').toLowerCase()}:`),

  person: (name, id = null) => {
    const cleanNameKey = String(name || '').toLowerCase();
    const params = { name, ...(id ? { id } : {}) };
    const key = `person:${cleanNameKey}:${id || ''}`;
    return requestBackendWithCache(key, async () => {
      const data = await backend.get('/discover/person', { params }).then((r) => r.data);
      // Also alias under both `:id` and `:` so canonical URL replacement never re-fetches!
      writeCache(`person:${cleanNameKey}:`, data);
      if (data?.person?.id) {
        writeCache(`person:${cleanNameKey}:${data.person.id}`, data);
      }
      return data;
    });
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

// Blog & Editorial CMS API (Public + Admin/SuperAdmin) with Smart Delta Caching
export const blogApi = {
  peekList: (params = {}) => readCache(`blogs:list:${stableParamsKey(params)}`),
  list: (params = {}, options = {}) => {
    const key = `blogs:list:${stableParamsKey(params)}`;
    return requestBackendWithCache(
      key,
      () => backend.get('/blogs', { params }).then((r) => r.data),
      null,
      options,
    );
  },
  peekGet: (slugOrId) => readCache(`blogs:detail:${String(slugOrId || '').toLowerCase()}`),
  get: (slugOrId, options = {}) => {
    const key = `blogs:detail:${String(slugOrId || '').toLowerCase()}`;
    return requestBackendWithCache(
      key,
      () => backend.get(`/blogs/${slugOrId}`).then((r) => r.data),
      null,
      options,
    );
  },
  previewMovieAssets: (type, tmdbId) =>
    backend
      .get(`/blogs/movie-assets/${type}/${tmdbId}`)
      .then((r) => r.data.assets),
  create: (payload) =>
    backend.post('/blogs', payload).then((r) => {
      const blog = r.data.blog;
      if (blog) applyDeltaSyncToCache({ updatedBlogs: [blog] });
      return blog;
    }),
  update: (id, payload) =>
    backend.patch(`/blogs/${id}`, payload).then((r) => {
      const blog = r.data.blog;
      if (blog) {
        applyDeltaSyncToCache({ updatedBlogs: [blog] });
        if (blog.slug) {
          writeCache(`blogs:detail:${String(blog.slug).toLowerCase()}`, {
            success: true,
            blog,
          });
        }
      }
      return blog;
    }),
  remove: (id) =>
    backend.delete(`/blogs/${id}`).then((r) => {
      clearCatalogCache();
      return r.data;
    }),
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
