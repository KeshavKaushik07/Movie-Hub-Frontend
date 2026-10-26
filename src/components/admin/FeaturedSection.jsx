import { useState, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles,
  Search,
  Plus,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import CustomSelect from '../ui/CustomSelect';
import InfoPatch from '../ui/InfoPatch';

export default function FeaturedSection({
  featuredItems,
  heroLimit = 10,
  onUpdateHeroLimit,
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
  const [limitInput, setLimitInput] = useState(heroLimit || 10);

  useEffect(() => {
    setLimitInput(heroLimit || 10);
  }, [heroLimit]);

  const activeAdminCount = (featuredItems || []).filter(
    (item) => item && item.isActive !== false,
  ).length;
  const effectiveHeroTotal = Math.max(Number(heroLimit) || 10, activeAdminCount);
  const trendingBlendCount = Math.max(0, effectiveHeroTotal - activeAdminCount);

  const handleSaveLimit = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const parsed = Math.max(1, Math.min(100, Number(limitInput) || 10));
    setLimitInput(parsed);
    if (onUpdateHeroLimit) onUpdateHeroLimit(parsed);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand/30 bg-[#0e131f] p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Home Page Featured Hero Carousel
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Admin slides appear first ({activeAdminCount} active) +{' '}
              <b className="text-brand">{trendingBlendCount} Multi-Industry Trending</b>{' '}
              slides = <b className="text-white">{effectiveHeroTotal} Total Slides</b> on Home.
              You can add unlimited Admin slides (even more than 10).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-brand/15 px-3 py-1 text-xs font-extrabold text-brand">
              {activeAdminCount} Admin + {trendingBlendCount} Trending = {effectiveHeroTotal} Slides
            </span>
          </div>
        </div>

        {/* Configurable Home Hero Carousel Count Control */}
        <form
          onSubmit={handleSaveLimit}
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <SlidersHorizontal size={15} />
            </span>
            <div>
              <p className="text-xs font-extrabold text-white">
                Home Hero Carousel Slide Count (Default: 10)
              </p>
              <p className="text-[11px] text-zinc-400">
                Choose how many slides appear on the Home Carousel. If you add fewer Admin slides, the remaining slots are filled with Trending movies & series from all industries.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[8, 10, 12, 15, 20].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setLimitInput(preset);
                  if (onUpdateHeroLimit) onUpdateHeroLimit(preset);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  Number(limitInput) === preset
                    ? 'bg-brand text-black'
                    : 'border border-white/10 bg-white/5 text-zinc-300 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={100}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="w-20 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-center text-xs font-bold text-white focus:border-brand focus:outline-none"
            />
            <button type="submit" className="admin-btn admin-btn-primary">
              <Check size={13} /> Save Count
            </button>
          </div>
        </form>

        {/* Search Movie to Add */}
        <form onSubmit={searchMovieForFeatured} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              value={featSearchQ}
              onChange={(e) => setFeatSearchQ(e.target.value)}
              placeholder="Search any movie, web series, or TV show by title to add to Featured Carousel..."
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
                  No custom Featured slides set — Home page is showing {effectiveHeroTotal} Multi-Industry Trending Movies & Series automatically.
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
