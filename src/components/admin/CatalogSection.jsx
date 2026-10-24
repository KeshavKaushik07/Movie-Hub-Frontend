import {
  Plus,
  Edit3,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  Search,
} from 'lucide-react';
import { getMovieFinancials } from '../../utils/formatters';
import SafeImage from '../ui/SafeImage';
import CustomSelect from '../ui/CustomSelect';
import { resolveOttMeta } from './adminHelpers';

export default function CatalogSection({
  dbTitles,
  featuredItems,
  region,
  titleQuery,
  setTitleQuery,
  titleTypeFilter,
  setTitleTypeFilter,
  onSearchCatalog,
  onCreateNewTitle,
  onEditTitle,
  onSyncTitle,
  onDeleteTitle,
  onQuickAddToFeatured,
}) {
  const featuredSet = new Set(
    (featuredItems || []).map((f) => `${f.type || 'movie'}:${f.id}`),
  );

  return (
    <div className="space-y-5">
      {/* Top Search & Add Custom Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-4 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchCatalog();
          }}
          className="flex flex-1 flex-wrap items-center gap-2.5"
        >
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              placeholder="Search title name or TMDB ID..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3.5 pl-9 text-xs text-white focus:border-[#f5b942] focus:outline-none"
            />
          </div>
          <div className="w-40">
            <CustomSelect
              value={titleTypeFilter}
              onChange={setTitleTypeFilter}
              options={[
                { value: '', label: 'All Types' },
                { value: 'movie', label: '🎬 Movies' },
                { value: 'webseries', label: '🔥 Web Series' },
                { value: 'tv', label: '📺 TV Shows' },
              ]}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            <Search size={13} /> Search DB
          </button>
        </form>

        <button
          type="button"
          onClick={onCreateNewTitle}
          className="admin-btn admin-btn-emerald"
        >
          <Plus size={14} /> Add Custom Movie / Series
        </button>
      </div>

      {/* Requirement 7: Media & Box Office DB Table
          Columns: Poster + Name | Type | Year | Budget / Box Office (₹) | OTT Present | Featured Carousel | Actions */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Movie / Series</th>
              <th>Type</th>
              <th>Year</th>
              <th>Budget / Box Office ({region === 'IN' ? '₹' : '$'})</th>
              <th>OTT Platforms</th>
              <th>Featured Carousel</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dbTitles || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-zinc-400">
                  No titles matched your database search.
                </td>
              </tr>
            ) : (
              dbTitles.map((t) => {
                const fin = getMovieFinancials(t, region);
                const ottList = Array.isArray(t.ottProviders) ? t.ottProviders : [];
                const isAlreadyFeatured =
                  featuredSet.has(`${t.type || 'movie'}:${t.id}`) ||
                  featuredSet.has(`tv:${t.id}`) ||
                  featuredSet.has(`movie:${t.id}`);

                return (
                  <tr key={`${t.type}-${t.id}`}>
                    {/* 1. Movie Poster + Name (Just like Featured section) */}
                    <td className="min-w-[210px]">
                      <div className="flex items-center gap-2.5">
                        <SafeImage
                          src={t.posterUrl || t.backdropUrl}
                          alt={t.title}
                          size="w185"
                          className="h-12 w-8 shrink-0 rounded-md border border-white/10 object-cover shadow"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-extrabold text-white">{t.title}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                            <span className="font-mono">TMDB #{t.id}</span>
                            {t.lockedFields?.length > 0 && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                                {t.lockedFields.length} edited
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Type */}
                    <td className="whitespace-nowrap">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-zinc-200">
                        {t.subType || t.type}
                      </span>
                    </td>

                    {/* 3. Year */}
                    <td className="whitespace-nowrap font-semibold text-zinc-300">
                      {t.year || '—'}
                    </td>

                    {/* 4. Budget / Box Office (₹ / $) */}
                    <td className="whitespace-nowrap">
                      <div className="leading-tight">
                        <span className="font-bold text-[#f5b942]">{fin.budgetText}</span>
                        <span className="mx-1 text-zinc-500">/</span>
                        <span className="font-extrabold text-emerald-400">{fin.revenueText}</span>
                        {fin.verdict && fin.verdict !== 'TBA' && (
                          <p className="mt-0.5 text-[10px] font-semibold text-zinc-400">
                            {fin.verdict}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 5. On Which OTT It Is Present */}
                    <td className="min-w-[140px]">
                      {ottList.length === 0 ? (
                        <span className="text-[11px] text-zinc-500">Theatrical / TBA</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {ottList.slice(0, 4).map((ottKey) => {
                            const meta = resolveOttMeta(ottKey);
                            return (
                              <span
                                key={ottKey}
                                style={{ backgroundColor: meta.badge }}
                                className="keep-white inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold text-white shadow-2xs"
                              >
                                {meta.label}
                              </span>
                            );
                          })}
                          {ottList.length > 4 && (
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                              +{ottList.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 6. Direct Add to Featured Carousel Button */}
                    <td className="whitespace-nowrap">
                      {isAlreadyFeatured ? (
                        <span className="admin-status-badge admin-status-emerald">
                          <Check size={13} /> In Featured
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onQuickAddToFeatured(t)}
                          className="admin-btn admin-btn-amber"
                          title="Add this title directly to the Home Featured Hero Carousel"
                        >
                          <Sparkles size={12} /> + Featured
                        </button>
                      )}
                    </td>

                    {/* 7. Actions: Edit, Sync TMDB, Delete */}
                    <td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditTitle(t)}
                          className="admin-btn admin-btn-primary"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onSyncTitle(t)}
                          title="Reset manual edits and pull fresh official data from TMDB"
                          className="admin-btn admin-btn-sky"
                        >
                          <RefreshCw size={12} /> Sync TMDB
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTitle(t)}
                          className="admin-btn admin-btn-danger"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
