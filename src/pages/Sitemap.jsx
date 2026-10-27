import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Globe,
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Film,
  Tv,
  BookOpen,
  Users,
  MessageSquare,
  Compass,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { buildCompleteDynamicSitemap } from '../utils/sitemapGenerator';
import { sitemapApi } from '../services/api';
import { SitemapSkeleton } from '../components/ui/Skeletons';

export default function Sitemap({ xmlMode = false }) {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState(xmlMode || searchParams.get('format') === 'xml' ? 'xml' : 'directory');
  const [copied, setCopied] = useState(false);
  const [filterQ, setFilterQ] = useState('');

  const loadSitemap = async () => {
    setLoading(true);
    try {
      const built = await buildCompleteDynamicSitemap(window.location.origin);
      setData(built);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = xmlMode
      ? 'sitemap.xml | Movies Hub SEO Crawler Index'
      : 'Dynamic SEO Sitemap & Crawler Index | Movies Hub';
    loadSitemap();
  }, [xmlMode]);

  const handleDownloadXml = () => {
    if (!data?.xmlString) return;
    const blob = new Blob([data.xmlString], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRobots = () => {
    if (!data?.robotsTxt) return;
    const blob = new Blob([data.robotsTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = () => {
    if (!data?.xmlString) return;
    navigator.clipboard.writeText(data.xmlString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !data) {
    return <SitemapSkeleton />;
  }

  if (!data) return null;

  const { sections } = data;
  const q = filterQ.trim().toLowerCase();
  const matchQ = (item) =>
    !q ||
    String(item.label || '').toLowerCase().includes(q) ||
    String(item.path || '').toLowerCase().includes(q);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-white/15 bg-[#0e131f] p-5 shadow-xl sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[11px] font-extrabold text-brand uppercase">
              <Globe size={12} /> Auto-Syncing Google Crawler Sitemap
            </div>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-extrabold text-white sm:text-3xl"
            >
              Dynamic Website Sitemap & Route Index
            </h1>
            <p className="max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Automatically indexes every static route in <code className="text-brand">App.jsx</code> &{' '}
              <code className="text-brand">constants.js</code> plus all live Movies, Web Series, TV Shows (with{' '}
              <code className="text-brand">#overview</code>, <code className="text-brand">#media</code>,{' '}
              <code className="text-brand">#box-office</code>, <code className="text-brand">#reviews</code>{' '}
              hash tabs), Editorial Blogs, Celebrities, and Community Lounges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadSitemap}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:border-brand"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-brand' : ''} />
              <span>Rescan Routes</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadXml}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-extrabold text-black hover:brightness-110"
            >
              <Download size={14} />
              <span>Download sitemap.xml</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadRobots}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:border-brand"
            >
              <Download size={13} />
              <span>robots.txt</span>
            </button>

            <a
              href={sitemapApi.getXmlUrl(window.location.origin)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-extrabold text-emerald-400 hover:bg-emerald-500/25"
            >
              <ExternalLink size={13} />
              <span>Backend Live XML Feed</span>
            </a>
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total Indexed URLs', value: data.totalUrls.toLocaleString(), color: 'text-brand' },
            { label: 'App & Filter Routes', value: sections.staticRoutes.length + sections.listRoutes.length, color: 'text-sky-400' },
            { label: 'Genre, Industry & OTT', value: sections.genreRoutes.length + sections.industryRoutes.length + sections.ottRoutes.length, color: 'text-purple-400' },
            { label: 'Movies & Series (+Tabs)', value: sections.titles.length * 6, color: 'text-emerald-400' },
            { label: 'Editorial Blog URLs', value: sections.blogs.length, color: 'text-amber-400' },
            { label: 'Celebrity Profiles', value: sections.celebrities.length, color: 'text-rose-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-[#070a10]/60 p-3">
              <p className="text-[11px] font-semibold text-zinc-400">{stat.label}</p>
              <p className={`mt-1 text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* View Switcher & Search Filter */}
        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewTab('directory')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                viewTab === 'directory'
                  ? 'bg-brand text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Compass size={14} />
              <span>HTML Crawler Link Directory</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('xml')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                viewTab === 'xml'
                  ? 'bg-brand text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <FileCode size={14} />
              <span>Raw Google XML (sitemap.xml)</span>
            </button>
          </div>

          {viewTab === 'directory' && (
            <input
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="Filter any URL or movie title in sitemap..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:border-brand focus:outline-none sm:max-w-xs"
            />
          )}
        </div>
      </div>

      {viewTab === 'xml' ? (
        /* Raw XML Sitemap Viewer */
        <div className="rounded-3xl border border-white/15 bg-[#0e131f] p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Standard Google Sitemap Protocol 0.9 (`sitemap.xml`)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Generated at {new Date(data.generatedAt).toLocaleString()} • {data.totalUrls.toLocaleString()} URLs
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyXml}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:border-brand"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied XML!' : 'Copy XML'}</span>
            </button>
          </div>
          <pre className="studio-scroll max-h-[65vh] overflow-auto rounded-2xl border border-white/10 bg-[#070a10] p-4 font-mono text-[11px] leading-relaxed text-emerald-300">
            {data.xmlString}
          </pre>
        </div>
      ) : (
        /* Interactive HTML Crawler Link Directory (Every link is a real <Link> so Googlebot crawls all pages) */
        <div className="space-y-6">
          {/* 1. Auto-Discovered Core & Router Routes */}
          <section className="rounded-3xl border border-white/15 bg-[#0e131f] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-white">
              <Sparkles size={16} className="text-brand" />
              1. Auto-Discovered Core & React Router Pages ({sections.staticRoutes.filter(matchQ).length})
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sections.staticRoutes.filter(matchQ).map((r) => (
                <Link
                  key={r.path}
                  to={r.path}
                  className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#070a10]/60 px-3.5 py-2.5 text-xs transition hover:border-brand"
                >
                  <span className="truncate font-bold text-white">{r.label}</span>
                  <code className="shrink-0 text-[10px] text-brand">{r.path}</code>
                </Link>
              ))}
            </div>
          </section>

          {/* 2. Curated Lists, Cinema Industries & OTT Platforms */}
          <section className="rounded-3xl border border-white/15 bg-[#0e131f] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-white">
              <Compass size={16} className="text-sky-400" />
              2. Cinema Industries, OTT Platforms & Genres (
              {
                [
                  ...sections.listRoutes,
                  ...sections.industryRoutes,
                  ...sections.ottRoutes,
                  ...sections.genreRoutes,
                ].filter(matchQ).length
              }
              )
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                ...sections.listRoutes,
                ...sections.industryRoutes,
                ...sections.ottRoutes,
                ...sections.genreRoutes,
              ]
                .filter(matchQ)
                .map((r) => (
                  <Link
                    key={r.path}
                    to={r.path}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#070a10]/60 p-3 text-xs transition hover:border-brand"
                  >
                    <span className="truncate font-bold text-white">{r.label}</span>
                    <code className="mt-1 truncate text-[10px] text-zinc-400">{r.path}</code>
                  </Link>
                ))}
            </div>
          </section>

          {/* 3. Movies, Web Series & TV Shows + All SEO Hash Tabs */}
          <section className="rounded-3xl border border-white/15 bg-[#0e131f] p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-white">
              <Film size={16} className="text-emerald-400" />
              3. Movies, Web Series & TV Shows + Hash-Ranked Tabs ({sections.titles.filter(matchQ).length} Titles)
            </h2>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
              {sections.titles
                .filter(matchQ)
                .slice(0, 180)
                .map((t) => (
                  <div
                    key={t.path}
                    className="rounded-2xl border border-white/10 bg-[#070a10]/60 p-3.5 transition hover:border-brand/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={t.path}
                        className="truncate text-xs font-extrabold text-white hover:text-brand"
                      >
                        {t.label}
                      </Link>
                      <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-brand uppercase">
                        {t.type}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(t.hashTabs || []).map((tabUrl) => {
                        const hashName = tabUrl.split('#')[1] || 'overview';
                        return (
                          <Link
                            key={tabUrl}
                            to={tabUrl}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 hover:border-brand hover:text-brand"
                          >
                            #{hashName}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* 4. Editorial Blogs, Celebrities & Community Lounges */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-white/15 bg-[#0e131f] p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-white">
                <BookOpen size={15} className="text-amber-400" />
                4. Editorial Blogs ({sections.blogs.filter(matchQ).length})
              </h2>
              <div className="studio-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
                {sections.blogs.filter(matchQ).map((b) => (
                  <Link
                    key={b.path}
                    to={b.path}
                    className="block rounded-xl border border-white/10 bg-[#070a10]/60 p-2.5 text-xs hover:border-brand"
                  >
                    <p className="truncate font-bold text-white">{b.label}</p>
                    <code className="text-[10px] text-zinc-400">{b.path}</code>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-[#0e131f] p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-white">
                <Users size={15} className="text-rose-400" />
                5. Actors & Filmmakers ({sections.celebrities.filter(matchQ).length})
              </h2>
              <div className="studio-scroll max-h-80 flex flex-wrap gap-1.5 overflow-y-auto pr-1">
                {sections.celebrities.filter(matchQ).map((c) => (
                  <Link
                    key={c.path}
                    to={c.path}
                    className="rounded-full border border-white/10 bg-[#070a10]/60 px-3 py-1 text-xs font-semibold text-zinc-200 hover:border-brand hover:text-brand"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-[#0e131f] p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-white">
                <MessageSquare size={15} className="text-emerald-400" />
                6. Community Chat Lounges ({sections.communityRooms.filter(matchQ).length})
              </h2>
              <div className="studio-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
                {sections.communityRooms.filter(matchQ).map((rm) => (
                  <Link
                    key={rm.path}
                    to={rm.path}
                    className="block rounded-xl border border-white/10 bg-[#070a10]/60 p-2.5 text-xs hover:border-brand"
                  >
                    <p className="truncate font-bold text-white">{rm.label}</p>
                    <code className="text-[10px] text-zinc-400">{rm.path}</code>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
