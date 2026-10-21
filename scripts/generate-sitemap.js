/**
 * ============================================================================
 * AUTOMATIC BUILD-TIME & CLI SITEMAP GENERATOR (`frontend/scripts/generate-sitemap.js`)
 * ============================================================================
 * Usage: `node scripts/generate-sitemap.js`
 * - Automatically parses `src/config/constants.js` and `src/App.jsx` to detect any
 *   newly added frontend routes, genres, industries, and OTT platforms.
 * - Fetches live Movies, Web Series, TV Shows, Blogs, Celebrities, and Community Rooms
 *   from your backend (`/api/v1/sitemap.json`) if running.
 * - Writes `public/sitemap.xml` and `public/robots.txt` so static hosting/crawlers
 *   always have a complete, up-to-date sitemap file.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ROUTES,
  MOVIE_GENRES,
  TV_GENRES,
  INDUSTRY_LIST,
  OTT_LIST,
  NAV_MENU,
} from '../src/config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const publicDir = path.join(frontendRoot, 'public');

const SITE_URL = (process.env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/+$/, '');
const API_URL = (process.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, '');

const escapeXml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

async function generate() {
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const discoveredPaths = new Set(['/', '/browse', '/browse/movie', '/browse/webseries', '/browse/tv', '/blogs', '/community', '/sitemap']);

  // 1. Add all static routes from ROUTES & NAV_MENU in src/config/constants.js
  for (const val of Object.values(ROUTES || {})) {
    if (typeof val === 'string' && val.startsWith('/') && !val.includes(':') && !val.includes('*') && !val.startsWith('/admin')) {
      discoveredPaths.add(val);
    }
  }
  for (const group of NAV_MENU || []) {
    for (const item of group.items || []) {
      if (item?.to) discoveredPaths.add(item.to);
    }
  }

  // 2. Add all Movie & TV Genres, Industries, and OTT Platforms from src/config/constants.js
  for (const id of Object.values(MOVIE_GENRES || {})) {
    discoveredPaths.add(`/browse/movie?genre=${id}`);
  }
  for (const id of Object.values(TV_GENRES || {})) {
    discoveredPaths.add(`/browse/tv?genre=${id}`);
  }
  for (const ind of INDUSTRY_LIST || []) {
    discoveredPaths.add(`/browse/movie?industry=${ind.key}`);
    discoveredPaths.add(`/browse/webseries?industry=${ind.key}`);
  }
  for (const ott of OTT_LIST || []) {
    discoveredPaths.add(`/browse/movie?ott=${ott.key}`);
    discoveredPaths.add(`/browse/webseries?ott=${ott.key}`);
  }

  // 3. Also scan src/App.jsx for any new <Route path="/..." /> added directly in JSX
  const appPath = path.join(frontendRoot, 'src/App.jsx');
  if (fs.existsSync(appPath)) {
    const code = fs.readFileSync(appPath, 'utf8');
    const matches = code.matchAll(/path=["'](\/[a-zA-Z0-9_\-/?=&]+)["']/g);
    for (const m of matches) {
      const p = m[1];
      if (p && !p.includes(':') && !p.includes('*') && !p.startsWith('/admin')) {
        discoveredPaths.add(p);
      }
    }
  }

  // 4. Try fetching live dynamic URLs from the backend `/sitemap.json`
  try {
    const res = await fetch(`${API_URL}/sitemap.json?siteUrl=${encodeURIComponent(SITE_URL)}`);
    if (res.ok) {
      const data = await res.json();
      const s = data.sections || {};
      [
        ...(s.staticRoutes || []),
        ...(s.curatedLists || []),
        ...(s.industries || []),
        ...(s.ottPlatforms || []),
        ...(s.blogs || []),
        ...(s.celebrities || []),
        ...(s.communityRooms || []),
      ].forEach((item) => {
        if (item?.path) discoveredPaths.add(item.path);
      });
      for (const t of s.titles || []) {
        if (t?.path) discoveredPaths.add(t.path);
        if (Array.isArray(t?.hashTabs)) {
          t.hashTabs.forEach((ht) => discoveredPaths.add(ht));
        }
      }
    }
  } catch {
    console.log('[Sitemap CLI] Backend offline — generated sitemap from discovered frontend routes & catalog filters.');
  }

  const nowIso = new Date().toISOString();
  const xmlUrls = Array.from(discoveredPaths).map((p) => {
    const loc = `${SITE_URL}${p.startsWith('/') ? p : `/${p}`}`;
    const priority = p === '/' ? '1.0' : p.startsWith('/details') ? '0.85' : '0.8';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${nowIso}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls.join('\n')}\n</urlset>\n`;
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${SITE_URL}/sitemap.xml\n`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');
  console.log(`[Sitemap CLI] Wrote ${xmlUrls.length} URLs to public/sitemap.xml and public/robots.txt`);
}

generate();
