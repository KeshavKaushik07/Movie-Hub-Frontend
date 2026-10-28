import { useState, useMemo } from 'react';
import {
  Award,
  Search,
  Eye,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { formatAdminDateTime } from './adminHelpers';

export default function ReviewsModerationSection({
  allReviews = [],
  onSelectReviewForModal = () => {},
  onToggleHideReview = () => {},
  onDeleteReview = () => {},
}) {
  const [searchQ, setSearchQ] = useState('');

  const filteredReviews = useMemo(() => {
    let list = [...(allReviews || [])];
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.movieTitle || '').toLowerCase().includes(q) ||
          (r.criticName || '').toLowerCase().includes(q) ||
          (r.user?.name || '').toLowerCase().includes(q) ||
          (r.headline || '').toLowerCase().includes(q) ||
          (r.text || '').toLowerCase().includes(q) ||
          String(r.tmdbId).includes(q),
      );
    }
    return list;
  }, [allReviews, searchQ]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Pinned Toolbar: Title & Search Input Only */}
      <div className="shrink-0 mb-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] p-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-brand/15 dark:text-brand">
              <Award size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1b2230] dark:text-white">
                All Critics &amp; Reviews
              </h3>
              <p className="text-[11px] text-[#4a5262] dark:text-zinc-400">
                Click any review to open details &amp; movie comments
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-56 max-w-sm flex-1 sm:flex-initial">
            <Search
              size={13}
              className="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search reviews, movie, critic..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white"
            />
            {searchQ && (
              <button
                type="button"
                onClick={() => setSearchQ('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-white dark:bg-[#0e131f] shadow-xs">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto studio-scroll">
          <table className="admin-table w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#0e131f] border-b border-[#d5d9e0] dark:border-white/10 shadow-xs">
              <tr>
                <th className="w-12">#</th>
                <th>Movie / Series</th>
                <th>Posted By</th>
                <th>Rating &amp; Excerpt</th>
                <th>When Posted &amp; Updated</th>
                <th>Visibility</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400">
                    <Award size={22} className="mx-auto mb-2 text-[#2350d8] dark:text-brand" />
                    No reviews or critic posts match this query.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r, idx) => {
                  const id = r._id || r.id;
                  const authorName = r.criticName || r.user?.name || 'Anonymous';
                  const isCritic = r.reviewType === 'critic';
                  return (
                    <tr
                      key={id}
                      onClick={() => onSelectReviewForModal(r)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                      title="Click to view full review details and movie comments"
                    >
                      {/* 1. Normal ID */}
                      <td className="whitespace-nowrap font-mono text-[11px] font-bold text-zinc-500">
                        #{idx + 1}
                      </td>

                      {/* 2. Movie Info */}
                      <td className="max-w-xs overflow-hidden">
                        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                          <SafeImage
                            src={r.moviePoster}
                            alt={r.movieTitle}
                            size="w185"
                            className="h-10 w-7 shrink-0 rounded object-cover border border-[#d5d9e0] dark:border-white/10 shadow-2xs"
                          />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="truncate text-xs font-bold text-[#1b2230] dark:text-white">
                              {r.movieTitle || `Title #${r.tmdbId}`}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {String(r.type || 'movie').toUpperCase()} #{r.tmdbId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Posted By */}
                      <td className="whitespace-nowrap text-xs">
                        <p className="font-bold text-[#1b2230] dark:text-white">
                          {authorName}
                        </p>
                        <span
                          className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold uppercase mt-0.5 ${
                            isCritic
                              ? 'bg-blue-100 text-blue-700 dark:bg-brand dark:text-black'
                              : 'bg-slate-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {isCritic ? 'Verified Critic' : 'Audience User'}
                        </span>
                      </td>

                      {/* 4. Rating & Excerpt */}
                      <td className="max-w-xs overflow-hidden text-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-amber-600 dark:text-brand">
                            ★ {r.rating}/10
                          </span>
                          {r.headline && (
                            <span className="font-semibold text-[#1b2230] dark:text-white truncate">
                              {r.headline}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {r.text}
                        </p>
                      </td>

                      {/* 5. When Posted & Updated */}
                      <td className="whitespace-nowrap text-[11px] leading-tight">
                        <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                          <span className="text-zinc-400 text-[10px]">Posted: </span>
                          {formatAdminDateTime(r.createdAt)}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <span className="text-zinc-400 text-[9px]">Updated: </span>
                          {formatAdminDateTime(r.updatedAt || r.createdAt)}
                        </div>
                      </td>

                      {/* 6. Visibility */}
                      <td className="whitespace-nowrap">
                        <span
                          className={`admin-status-badge ${
                            r.isHidden ? 'admin-status-rose' : 'admin-status-emerald'
                          }`}
                        >
                          {r.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td
                        className="whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onToggleHideReview(r)}
                            className={`admin-btn admin-btn-sm ${
                              r.isHidden ? 'admin-btn-emerald' : 'admin-btn-secondary'
                            }`}
                          >
                            {r.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                            {r.isHidden ? 'Unhide' : 'Hide'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReview(id)}
                            className="admin-btn admin-btn-danger admin-btn-sm px-2"
                            title="Delete Review"
                          >
                            <Trash2 size={12} />
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

        <div className="shrink-0 border-t border-[#d5d9e0] dark:border-white/10 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] text-xs text-zinc-500 flex justify-between items-center">
          <span>Showing {filteredReviews.length} of {allReviews.length} reviews</span>
          <span className="text-[11px] text-zinc-400">💡 Click any review to open details &amp; movie comments</span>
        </div>
      </div>
    </div>
  );
}
