import { Play, Square, Save, Cpu } from 'lucide-react';

export default function CrawlerSection({
  crawler,
  quotaForm,
  setQuotaForm,
  onStartCrawler,
  onStopCrawler,
  onSaveQuotas,
}) {
  if (!crawler) return null;

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0e131f] p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5b942]/15 text-[#f5b942]">
            <Cpu size={22} />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-white">
              Quota-Balanced & Year-Interleaved 1-Lakh Crawler
            </h3>
            <p className="text-xs text-zinc-400">
              Status: <b className="text-[#f5b942]">{crawler.running ? 'RUNNING' : 'IDLE'}</b> • Stored:{' '}
              <b className="text-white">{(crawler.titlesStored || 0).toLocaleString('en-IN')}</b> /{' '}
              {(crawler.targetCap || 100000).toLocaleString('en-IN')}
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
        {[
          ['Total Catalog Cap', 'maxTitles'],
          ['Movie Quota', 'movieQuota'],
          ['Web Series Quota', 'webSeriesQuota'],
          ['TV Shows Quota', 'tvQuota'],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-semibold text-zinc-400">{label}</label>
            <input
              type="number"
              value={quotaForm[key]}
              onChange={(e) => setQuotaForm({ ...quotaForm, [key]: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-white"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSaveQuotas}
          className="admin-btn admin-btn-primary px-5 py-2.5"
        >
          <Save size={14} /> Save Crawler Quotas
        </button>
      </div>
    </div>
  );
}
