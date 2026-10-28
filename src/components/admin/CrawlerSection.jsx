import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Square, Save, Cpu, SlidersHorizontal } from 'lucide-react';
import { AdminCrawlerSkeleton } from '../ui/Skeletons';

export default function CrawlerSection({
  crawler,
  quotaForm,
  setQuotaForm,
  onStartCrawler,
  onStopCrawler,
  onSaveQuotas,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'status'; // 'status' | 'quotas'
  const [subTab, setSubTab] = useState(urlTab);

  useEffect(() => {
    setSubTab(searchParams.get('tab') || 'status');
  }, [searchParams]);

  const handleSwitchTab = (nextTab) => {
    setSubTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  if (!crawler) return <AdminCrawlerSkeleton />;

  return (
    <div className="space-y-5">
      {/* Frozen Inner Sub-View Switcher Bar */}
      <div className="admin-sticky-bar">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 shadow-lg">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#070a10] p-1">
            <button
              type="button"
              onClick={() => handleSwitchTab('status')}
              className={`admin-btn ${
                subTab === 'status'
                  ? 'admin-btn-primary'
                  : 'admin-btn-secondary border-transparent shadow-none'
              }`}
            >
              <Cpu size={13} /> Live Status & Controls
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('quotas')}
              className={`admin-btn ${
                subTab === 'quotas'
                  ? 'admin-btn-primary'
                  : 'admin-btn-secondary border-transparent shadow-none'
              }`}
            >
              <SlidersHorizontal size={13} /> Configure Quotas & Caps
            </button>
          </div>

          <span
            className={`admin-status-badge ${
              crawler.running ? 'admin-status-emerald' : 'admin-status-amber'
            }`}
          >
            {crawler.running ? 'RUNNING' : 'IDLE'} •{' '}
            {(crawler.titlesStored || 0).toLocaleString('en-IN')} /{' '}
            {(crawler.targetCap || 100000).toLocaleString('en-IN')} Stored
          </span>
        </div>
      </div>

      {subTab === 'status' ? (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0e131f] p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <Cpu size={22} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Quota-Balanced & Year-Interleaved 1-Lakh Crawler
                </h3>
                <p className="text-xs text-zinc-400">
                  Status: <b className="text-brand">{crawler.running ? 'RUNNING' : 'IDLE'}</b> • Stored:{' '}
                  <b className="text-white">
                    {(crawler.titlesStored || 0).toLocaleString('en-IN')}
                  </b>{' '}
                  / {(crawler.targetCap || 100000).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onStartCrawler}
                className="admin-btn admin-btn-emerald px-4 py-2"
              >
                <Play size={13} fill="currentColor" /> Start / Resume Crawler
              </button>
              <button
                type="button"
                onClick={onStopCrawler}
                className="admin-btn admin-btn-danger px-4 py-2"
              >
                <Square size={13} fill="currentColor" /> Stop Crawler
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#070a10] p-4">
              <p className="text-[11px] font-bold text-zinc-400 uppercase">Total Stored</p>
              <p className="mt-1 text-2xl font-black text-white">
                {(crawler.titlesStored || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#070a10] p-4">
              <p className="text-[11px] font-bold text-zinc-400 uppercase">Movies Cap</p>
              <p className="mt-1 text-2xl font-black text-emerald-400">
                {(quotaForm.movieQuota || 50000).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#070a10] p-4">
              <p className="text-[11px] font-bold text-zinc-400 uppercase">Web Series Cap</p>
              <p className="mt-1 text-2xl font-black text-brand">
                {(quotaForm.webSeriesQuota || 25000).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#070a10] p-4">
              <p className="text-[11px] font-bold text-zinc-400 uppercase">TV Shows Cap</p>
              <p className="mt-1 text-2xl font-black text-sky-400">
                {(quotaForm.tvQuota || 25000).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 rounded-2xl border border-brand/30 bg-[#0e131f] p-6 shadow-xl">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Configure Crawler Quotas & Target Caps
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Adjust total catalog limits and per-format quotas for Movies, Web Series, and TV Shows.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ['Total Catalog Cap', 'maxTitles'],
              ['Movie Quota', 'movieQuota'],
              ['Web Series Quota', 'webSeriesQuota'],
              ['TV Shows Quota', 'tvQuota'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  {label}
                </label>
                <input
                  type="number"
                  value={quotaForm[key]}
                  onChange={(e) =>
                    setQuotaForm({ ...quotaForm, [key]: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onSaveQuotas}
              className="admin-btn admin-btn-primary px-5 py-2.5"
            >
              <Save size={14} /> Save Crawler Quotas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
