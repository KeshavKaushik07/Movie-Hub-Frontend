import { ArrowUp, ArrowDown, Trash2, Sparkles, Search, Plus } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import CustomSelect from '../ui/CustomSelect';
import InfoPatch from '../ui/InfoPatch';

export default function FeaturedSection({
  featuredItems,
  featSearchQ,
  setFeatSearchQ,
  featSearchResults,
  setFeatSearchResults,
  featSearchAttempted,
  setFeatSearchAttempted,
  featForm,
  setFeatForm,
  searchMovieForFeatured,
  handleAddFeatured,
  moveFeaturedItem,
  onToggleFeaturedActive,
  onRemoveFeatured,
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand/30 bg-[#0e131f] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Home Page Featured Hero Carousel
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              When active slides exist below, <b className="text-brand">only these selected titles</b> appear on the Home Hero Carousel.
            </p>
          </div>
          <span className="rounded-xl bg-brand/15 px-3 py-1 text-xs font-extrabold text-brand">
            {featuredItems.length} Active / Total Slides
          </span>
        </div>

        {/* Search Movie to Add */}
        <form onSubmit={searchMovieForFeatured} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={featSearchQ}
              onChange={(e) => setFeatSearchQ(e.target.value)}
              placeholder="Search any movie or web series by title to add to Featured Carousel..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-4 pl-9 text-xs text-white focus:border-brand focus:outline-none"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary px-4">
            <Search size={13} /> Search Catalog
          </button>
        </form>

        {featSearchAttempted && featSearchResults.length === 0 && (
          <InfoPatch
            compact
            type="not-found"
            title={`No Titles Found for "${featSearchQ}"`}
            message="Try another movie title or enter the TMDB ID directly below."
            onClose={() => setFeatSearchAttempted(false)}
            className="mt-3"
          />
        )}

        {featSearchResults.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-2">
            {featSearchResults.map((m) => (
              <button
                key={`${m.type}-${m.id}`}
                type="button"
                onClick={() => {
                  setFeatForm({
                    ...featForm,
                    tmdbId: m.id,
                    type: m.isWebSeries ? 'webseries' : m.type || 'movie',
                    customTitle: m.title || m.name,
                  });
                  setFeatSearchResults([]);
                  setFeatSearchAttempted(false);
                }}
                className="flex shrink-0 items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 p-2 text-left text-xs transition hover:border-brand"
              >
                <SafeImage src={m.posterUrl} alt={m.title} className="h-12 w-8 rounded object-cover" />
                <div>
                  <p className="font-bold text-white">{m.title || m.name}</p>
                  <p className="text-[10px] text-zinc-400">
                    ID: #{m.id} • {m.year || '—'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAddFeatured} className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-4">
          <input
            required
            type="number"
            placeholder="Movie TMDB ID (e.g. 550)"
            value={featForm.tmdbId}
            onChange={(e) => setFeatForm({ ...featForm, tmdbId: e.target.value })}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
          />
          <CustomSelect
            value={featForm.type}
            onChange={(val) => setFeatForm({ ...featForm, type: val })}
            options={[
              { value: 'movie', label: '🎬 Movie' },
              { value: 'webseries', label: '🔥 Web Series' },
              { value: 'tv', label: '📺 TV Show' },
            ]}
          />
          <input
            placeholder="Badge Text (e.g. Featured on Movies Hub)"
            value={featForm.badgeText}
            onChange={(e) => setFeatForm({ ...featForm, badgeText: e.target.value })}
            className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
          />
          <button type="submit" className="admin-btn admin-btn-primary">
            <Plus size={14} /> Add to Hero Carousel
          </button>
        </form>
      </div>

      {/* Compact Featured Slides Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Movie / Web Series</th>
              <th>TMDB ID</th>
              <th>Type</th>
              <th>Year</th>
              <th>Spotlight Badge</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {featuredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-zinc-400">
                  <Sparkles size={20} className="mx-auto mb-2 text-brand" />
                  No custom Featured slides set — Home page is showing Trending Movies & Series automatically.
                </td>
              </tr>
            ) : (
              featuredItems.map((item, idx) => (
                <tr key={item.featuredId || item.id}>
                  <td className="whitespace-nowrap">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-black text-black">
                      {idx + 1}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <SafeImage
                        src={item.posterUrl || item.backdropUrl}
                        alt={item.title}
                        size="w185"
                        className="h-11 w-8 shrink-0 rounded-md border border-white/10 object-cover"
                      />
                      <span className="font-bold text-white">{item.title}</span>
                    </div>
                  </td>
                  <td className="font-mono text-zinc-400">#{item.id}</td>
                  <td>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {item.subType || item.type || 'movie'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-zinc-300">{item.year || '—'}</td>
                  <td>
                    <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                      {item.badgeText || 'Featured'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-status-badge ${
                        item.isActive ? 'admin-status-emerald' : 'admin-status-amber'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveFeaturedItem(idx, -1)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="admin-btn admin-btn-secondary admin-btn-icon disabled:opacity-35"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeaturedItem(idx, 1)}
                        disabled={idx === featuredItems.length - 1}
                        title="Move Down"
                        className="admin-btn admin-btn-secondary admin-btn-icon disabled:opacity-35"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFeaturedActive(item)}
                        className={`admin-btn ${
                          item.isActive ? 'admin-btn-emerald' : 'admin-btn-secondary'
                        }`}
                      >
                        {item.isActive ? 'Visible' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFeatured(item.featuredId)}
                        className="admin-btn admin-btn-danger"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
