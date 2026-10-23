import React from 'react';
import {
  ROUTES,
  MOVIE_GENRES,
  TV_GENRES,
  INDUSTRY_LIST,
  OTT_LIST,
  NAV_MENU,
} from '../config/constants';
import { sitemapApi, tmdb, blogApi, communityApi } from '../services/api';
import { toSlug } from './formatters';

/**
 * ============================================================================
 * SELF-UPDATING FRONTEND ROUTE REGISTRY & SITEMAP GENERATOR
 * File: src/utils/sitemapGenerator.js
 * ============================================================================
 * Automatically stays in sync whenever new routes are added later:
 * 1. Auto-Scans `ROUTES` (`src/config/constants.js`)
 * 2. Auto-Scans React Router `<Route>` elements in `src/App.jsx` (`registerRoutesFromReactTree`)
 * 3. Auto-Expands All Genre, Industry & OTT Filter Routes (`MOVIE_GENRES`, `TV_GENRES`, `INDUSTRY_LIST`, `OTT_LIST`)
 * 4. Auto-Fetches All Live Backend Entities (Movies, Web Series, TV Shows + all 6 SEO `#hash` tabs,
 *    Blogs `/blogs/:slug`, Celebrities `/person/:name`, and Community Lounges).
 */

const discoveredRouterPaths = new Map();

const formatPathLabel = (path) => {
  if (path === '/') return 'Home — Indian & Global Cinema Feed';
  return path
    .replace(/^\/+/, '')
    .split(/[/?=&]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).replace(/[-_]/g, ' '))
    .join(' • ');
};

export const registerSitemapRoute = (path, meta = {}) => {
  if (!path || typeof path !== 'string') return;
  const clean = path.trim();
  if (!clean.startsWith('/') || clean.includes('*') || clean.startsWith('/admin')) return;
  if (!discoveredRouterPaths.has(clean)) {
    discoveredRouterPaths.set(clean, {
      path: clean,
      label: meta.label || formatPathLabel(clean),
      priority: meta.priority || (clean === '/' ? '1.0' : '0.8'),
      changefreq: meta.changefreq || 'daily',
      isParameterized: clean.includes(':'),
    });
  }
};

export const registerRoutesFromReactTree = (node, parentPath = '') => {
  if (!node) return;
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    const { path, children } = child.props || {};
    let fullPath = parentPath;
    if (typeof path === 'string' && path.trim()) {
      fullPath = path.startsWith('/')
        ? path
        : `${parentPath.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
      registerSitemapRoute(fullPath);
    }
    if (children) {
      registerRoutesFromReactTree(children, fullPath);
    }
  });
};

export const getAutoDiscoveredFrontendRoutes = () => {
  Object.entries(ROUTES || {}).forEach(([key, path]) => {
    if (typeof path === 'string') {
      registerSitemapRoute(path, {
        label: `${key.replace(/_/g, ' ')} (${path})`,
      });
    }
  });

  (NAV_MENU || []).forEach((group) => {
    (group.items || []).forEach((item) => {
      if (item?.to) {
        registerSitemapRoute(item.to, { label: `${group.label} — ${item.label}` });
      }
    });
  });

  const all = Array.from(discoveredRouterPaths.values());
  return {
    staticRoutes: all.filter((r) => !r.isParameterized),
    parameterizedTemplates: all.filter((r) => r.isParameterized),
  };
};

export const buildCatalogFilterRoutes = () => {
  const listRoutes = [
    { path: '/browse/movie', label: 'All Movies Catalog', priority: '0.9', changefreq: 'daily' },
    { path: '/browse/webseries', label: 'All OTT Web Series Catalog', priority: '0.9', changefreq: 'daily' },
    { path: '/browse/tv', label: 'All TV Shows Catalog', priority: '0.9', changefreq: 'daily' },
    { path: '/browse/movie?list=trending', label: 'Trending Movies This Week', priority: '0.9', changefreq: 'daily' },
    { path: '/browse/movie?list=popular', label: 'Popular Movies', priority: '0.85', changefreq: 'daily' },
    { path: '/browse/movie?list=top-rated', label: 'All-Time Top Rated Movies', priority: '0.85', changefreq: 'weekly' },
    { path: '/browse/movie?list=upcoming', label: 'Upcoming Movies Calendar', priority: '0.9', changefreq: 'daily' },
    { path: '/browse/movie?sort=revenue', label: 'Top Box Office Collection Movies (₹ Crore / $)', priority: '0.85', changefreq: 'daily' },
    { path: '/browse/tv?list=trending', label: 'Trending TV Series', priority: '0.85', changefreq: 'daily' },
    { path: '/browse/webseries?list=trending', label: 'Trending Web Series', priority: '0.85', changefreq: 'daily' },
  ];

  const genreRoutes = [
    ...Object.entries(MOVIE_GENRES || {}).map(([name, id]) => ({
      path: `/browse/movie?genre=${id}`,
      label: `${name} Movies`,
      priority: '0.8',
      changefreq: 'daily',
    })),
    ...Object.entries(TV_GENRES || {}).map(([name, id]) => ({
      path: `/browse/tv?genre=${id}`,
      label: `${name} TV & Web Series`,
      priority: '0.8',
      changefreq: 'daily',
    })),
  ];

  const industryRoutes = (INDUSTRY_LIST || []).flatMap((ind) => [
    {
      path: `/browse/movie?industry=${ind.key}`,
      label: `${ind.emoji} ${ind.label} — Movies`,
      priority: '0.85',
      changefreq: 'daily',
    },
    {
      path: `/browse/webseries?industry=${ind.key}`,
      label: `${ind.emoji} ${ind.label} — Web Series`,
      priority: '0.8',
      changefreq: 'daily',
    },
  ]);

  const ottRoutes = (OTT_LIST || []).flatMap((ott) => [
    {
      path: `/browse/movie?ott=${ott.key}`,
      label: `${ott.label} — Streaming Movies`,
      priority: '0.85',
      changefreq: 'daily',
    },
    {
      path: `/browse/webseries?ott=${ott.key}`,
      label: `${ott.label} — Original Web Series`,
      priority: '0.85',
      changefreq: 'daily',
    },
  ]);

  return { listRoutes, genreRoutes, industryRoutes, ottRoutes };
};

const escapeXml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildCompleteDynamicSitemap = async (siteUrl = window.location.origin) => {
  const cleanOrigin = String(siteUrl || 'http://localhost:5173').replace(/\/+$/, '');
  const nowIso = new Date().toISOString();

  const { staticRoutes, parameterizedTemplates } = getAutoDiscoveredFrontendRoutes();
  const { listRoutes, genreRoutes, industryRoutes, ottRoutes } = buildCatalogFilterRoutes();

  let dbSections = {
    titles: [],
    blogs: [],
    celebrities: [],
    communityRooms: [],
  };

  try {
    const backendData = await sitemapApi.getJson(cleanOrigin);
    if (backendData?.sections) {
      dbSections = {
        titles: backendData.sections.titles || [],
        blogs: backendData.sections.blogs || [],
        celebrities: backendData.sections.celebrities || [],
        communityRooms: backendData.sections.communityRooms || [],
      };
    }
  } catch {
    const [homeRes, blogsRes, celebsIN, celebsGlobal, roomsRes] = await Promise.all([
      tmdb.home({ region: 'IN' }).catch(() => null),
      blogApi.list({ limit: 50 }).catch(() => ({ blogs: [] })),
      tmdb.celebrities('IN').catch(() => []),
      tmdb.celebrities('GLOBAL').catch(() => []),
      communityApi.listRooms().catch(() => []),
    ]);

    const titleMap = new Map();
    const collectTitles = (arr = []) => {
      for (const item of arr) {
        if (!item?.id) continue;
        const rType = (item.type || item.media_type) === 'tv' ? 'tv' : 'movie';
        const key = `${rType}:${item.id}`;
        if (!titleMap.has(key)) {
          const slug = item.slug || toSlug(item.title || item.name) || item.id;
          const basePath = `/detail/${rType}/${slug}`;
          titleMap.set(key, {
            path: basePath,
            label: `${item.title || item.name} (${item.year || '2025'})`,
            type: item.subType || rType,
            tmdbId: item.id,
            lastmod: nowIso,
            priority: '0.85',
            changefreq: 'weekly',
            hashTabs: [
              `${basePath}#overview`,
              `${basePath}#media`,
              `${basePath}#box-office`,
              ...(rType === 'tv' ? [`${basePath}#seasons`] : []),
              `${basePath}#reviews`,
              `${basePath}#comments`,
            ],
          });
        }
      }
    };

    if (homeRes) {
      collectTitles(homeRes.hero);
      collectTitles(homeRes.top10Today);
      collectTitles(homeRes.top10Week);
      collectTitles(homeRes.upcoming?.items);
      (homeRes.rows || []).forEach((r) => collectTitles(r.items));
    }

    dbSections.titles = Array.from(titleMap.values());
    dbSections.blogs = (blogsRes?.blogs || []).map((b) => ({
      path: `/blogs/${b.slug}`,
      label: b.title,
      category: b.category,
      lastmod: b.updatedAt || nowIso,
      priority: '0.8',
      changefreq: 'weekly',
    }));

    const celebNames = new Set(
      [...(celebsIN || []), ...(celebsGlobal || [])].map((c) => c.name).filter(Boolean),
    );
    dbSections.celebrities = Array.from(celebNames).map((name) => ({
      path: `/person/${encodeURIComponent(name)}`,
      label: name,
      priority: '0.7',
      changefreq: 'weekly',
    }));

    dbSections.communityRooms = (roomsRes || []).map((r) => ({
      path: `/community?room=${encodeURIComponent(r.slug || r.id)}`,
      label: r.name,
      roomType: r.roomType,
      lastmod: nowIso,
      priority: '0.65',
      changefreq: 'daily',
    }));
  }

  const uniqueUrls = new Map();
  const addUrl = (path, priority = '0.7', changefreq = 'weekly', lastmod = nowIso, label = '') => {
    if (!path) return;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullLoc = `${cleanOrigin}${normalizedPath}`;
    if (!uniqueUrls.has(fullLoc)) {
      uniqueUrls.set(fullLoc, {
        path: normalizedPath,
        loc: fullLoc,
        label: label || formatPathLabel(normalizedPath),
        priority,
        changefreq,
        lastmod,
      });
    }
  };

  staticRoutes.forEach((r) => addUrl(r.path, r.priority, r.changefreq, nowIso, r.label));
  listRoutes.forEach((r) => addUrl(r.path, r.priority, r.changefreq, nowIso, r.label));
  genreRoutes.forEach((r) => addUrl(r.path, r.priority, r.changefreq, nowIso, r.label));
  industryRoutes.forEach((r) => addUrl(r.path, r.priority, r.changefreq, nowIso, r.label));
  ottRoutes.forEach((r) => addUrl(r.path, r.priority, r.changefreq, nowIso, r.label));
  dbSections.blogs.forEach((b) => addUrl(b.path, b.priority, b.changefreq, b.lastmod, b.label));
  dbSections.celebrities.forEach((c) => addUrl(c.path, c.priority, c.changefreq, nowIso, c.label));
  dbSections.communityRooms.forEach((rm) => addUrl(rm.path, rm.priority, rm.changefreq, rm.lastmod, rm.label));

  for (const t of dbSections.titles) {
    addUrl(t.path, t.priority, t.changefreq, t.lastmod, t.label);
    if (Array.isArray(t.hashTabs)) {
      for (const tabPath of t.hashTabs) {
        addUrl(tabPath, '0.75', 'weekly', t.lastmod, `${t.label} (${tabPath.split('#')[1]})`);
      }
    }
  }

  const xmlRows = Array.from(uniqueUrls.values()).map(
    (u) =>
      `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>\n    <changefreq>${escapeXml(u.changefreq)}</changefreq>\n    <priority>${escapeXml(u.priority)}</priority>\n  </url>`,
  );

  const xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlRows.join('\n')}\n</urlset>`;

  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    `Sitemap: ${cleanOrigin}/sitemap.xml`,
    '',
  ].join('\n');

  return {
    siteUrl: cleanOrigin,
    generatedAt: nowIso,
    totalUrls: uniqueUrls.size,
    xmlString,
    robotsTxt,
    parameterizedTemplates,
    sections: {
      staticRoutes,
      listRoutes,
      genreRoutes,
      industryRoutes,
      ottRoutes,
      titles: dbSections.titles,
      blogs: dbSections.blogs,
      celebrities: dbSections.celebrities,
      communityRooms: dbSections.communityRooms,
    },
  };
};
