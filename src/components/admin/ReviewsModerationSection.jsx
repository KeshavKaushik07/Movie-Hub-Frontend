import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Trash2,
  Award,
  Search,
  Edit3,
  Plus,
  MessageSquare,
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import CustomSelect from '../ui/CustomSelect';
import { formatAdminDate } from './adminHelpers';

export default function ReviewsModerationSection({
  allReviews,
  allComments,
  onSelectReviewForModal,
  onToggleHideReview,
  onDeleteReview,
  onAddCriticReview,
  onToggleHideComment,
  onDeleteComment,
}) {
  const [subTab, setSubTab] = useState('all'); // 'all' | 'critic' | 'user' | 'comments'
  const [searchQ, setSearchQ] = useState('');
  const [showAddCritic, setShowAddCritic] = useState(false);

  const [criticForm, setCriticForm] = useState({
    type: 'movie',
    tmdbId: '',
    criticName: '',
    publication: '',
    rating: 8.5,
    headline: '',
    text: '',
    externalUrl: '',
  });

  const filteredReviews = (allReviews || []).filter((r) => {
    if (subTab === 'critic' && r.reviewType !== 'critic') return false;
    if (subTab === 'user' && r.reviewType === 'critic') return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase().trim();
      const movieMatch = (r.movieTitle || '').toLowerCase().includes(q);
      const authorMatch = (r.criticName || r.user?.name || '').toLowerCase().includes(q);
      const textMatch = (r.headline || r.text || '').toLowerCase().includes(q);
      return movieMatch || authorMatch || textMatch;
    }
    return true;
  });

  const filteredComments = (allComments || []).filter((c) => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase().trim();
    return (
      (c.movieTitle || '').toLowerCase().includes(q) ||
      (c.user?.name || '').toLowerCase().includes(q) ||
      (c.body || '').toLowerCase().includes(q)
    );
  });

  const submitNewCritic = async (e) => {
    e.preventDefault();
    if (!criticForm.tmdbId || !criticForm.text.trim()) return;
    await onAddCriticReview({
      ...criticForm,
      tmdbId: Number(criticForm.tmdbId),
      rating: Number(criticForm.rating),
    });
    setCriticForm({
      type: 'movie',
      tmdbId: '',
      criticName: '',
      publication: '',
      rating: 8.5,
      headline: '',
      text: '',
      externalUrl: '',
    });
    setShowAddCritic(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar: Tabs + Publish Critic Button + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#0e131f] p-1">
          {[
            { key: 'all', label: `All Reviews (${allReviews.length})` },
            {
              key: 'critic',
              label: `Verified Critics (${allReviews.filter((r) => r.reviewType === 'critic').length})`,
            },
            {
              key: 'user',
              label: `Audience Reviews (${allReviews.filter((r) => r.reviewType !== 'critic').length})`,
            },
            { key: 'comments', label: `Comments (${allComments.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`admin-btn ${
                subTab === t.key
                  ? 'admin-btn-primary'
                  : 'admin-btn-secondary border-transparent shadow-none'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search movie, critic, or text..."
              className="w-full rounded-xl border border-white/10 bg-[#0e131f] py-2 pr-3 pl-8 text-xs text-white focus:border-[#f5b942] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddCritic((v) => !v)}
            className="admin-btn admin-btn-primary"
          >
            <Plus size={14} /> {showAddCritic ? 'Close Critic Form' : 'Publish Critic Review'}
          </button>
        </div>
      </div>

      {/* Collapsible Publish Verified Critic Review Form */}
      {showAddCritic && (
        <form
          onSubmit={submitNewCritic}
          className="space-y-3 rounded-2xl border border-[#f5b942]/35 bg-[#0e131f] p-5 shadow-xl"
        >
          <h4 className="text-sm font-extrabold text-[#f5b942]">
            Publish Official Verified Critic Review
          </h4>
          <div className="grid gap-3 sm:grid-cols-5">
            <CustomSelect
              value={criticForm.type}
              onChange={(val) => setCriticForm({ ...criticForm, type: val })}
              options={[
                { value: 'movie', label: '🎬 Movie' },
                { value: 'tv', label: '📺 Web Series / TV' },
              ]}
            />
            <input
              required
              type="number"
              placeholder="Movie TMDB ID (e.g. 550) *"
              value={criticForm.tmdbId}
              onChange={(e) => setCriticForm({ ...criticForm, tmdbId: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <input
              required
              placeholder="Critic Name (e.g. Taran Adarsh) *"
              value={criticForm.criticName}
              onChange={(e) => setCriticForm({ ...criticForm, criticName: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="Publication (e.g. Film Companion)"
              value={criticForm.publication}
              onChange={(e) => setCriticForm({ ...criticForm, publication: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <input
              required
              type="number"
              step="0.5"
              min="1"
              max="10"
              placeholder="Rating (1-10)"
              value={criticForm.rating}
              onChange={(e) => setCriticForm({ ...criticForm, rating: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Review Headline / Verdict Summary"
              value={criticForm.headline}
              onChange={(e) => setCriticForm({ ...criticForm, headline: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="External Source URL (optional)"
              value={criticForm.externalUrl}
              onChange={(e) => setCriticForm({ ...criticForm, externalUrl: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <textarea
              required
              rows={2}
              placeholder="Write the full critic review quote or analysis..."
              value={criticForm.text}
              onChange={(e) => setCriticForm({ ...criticForm, text: e.target.value })}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white"
            />
            <button type="submit" className="admin-btn admin-btn-primary self-end px-5 py-2.5">
              Publish Critic
            </button>
          </div>
        </form>
      )}

      {/* Requirement 4: Critics & Reviews Table (Click any row to open Detail & Edit Modal) */}
      {subTab !== 'comments' ? (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400">
            💡 Tip: Click any critic or audience review row below to open the full details & edit modal.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Movie / Series</th>
                  <th>Posted By</th>
                  <th>Rating & Excerpt</th>
                  <th>When Posted</th>
                  <th>Visibility</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                      <Award size={20} className="mx-auto mb-2 text-[#f5b942]" />
                      No reviews or critic posts match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((r) => {
                    const id = r._id || r.id;
                    const authorName = r.criticName || r.user?.name || 'Anonymous';
                    const isCritic = r.reviewType === 'critic';
                    return (
                      <tr
                        key={id}
                        onClick={() => onSelectReviewForModal(r)}
                        className="cursor-pointer"
                        title="Click to inspect and edit this review"
                      >
                        {/* 1. Movie Poster + Name */}
                        <td className="min-w-[190px]">
                          <div className="flex items-center gap-2.5">
                            <SafeImage
                              src={r.moviePoster}
                              alt={r.movieTitle}
                              size="w185"
                              className="h-11 w-8 shrink-0 rounded-md border border-white/10 object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-white">
                                {r.movieTitle || `${String(r.type || 'movie').toUpperCase()} #${r.tmdbId}`}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {String(r.type || 'movie').toUpperCase()} #{r.tmdbId}
                                {r.movieYear ? ` • ${r.movieYear}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Person's Name Who Posted */}
                        <td className="whitespace-nowrap">
                          <div className="leading-tight">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{authorName}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                                  isCritic
                                    ? 'bg-[#f5b942] text-black'
                                    : 'bg-sky-500/20 text-sky-300'
                                }`}
                              >
                                {isCritic ? 'Critic' : 'User'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-zinc-400">
                              {r.publication || r.user?.email || 'Movies Hub Member'}
                            </p>
                          </div>
                        </td>

                        {/* 3. Rating + Headline/Text Preview */}
                        <td className="min-w-[220px] max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#f5b942]/15 px-2 py-0.5 text-xs font-black text-[#f5b942]">
                              ★ {Number(r.rating || 0).toFixed(1)}/10
                            </span>
                            {r.headline && (
                              <span className="truncate font-bold text-white">{r.headline}</span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11px] text-zinc-300">
                            {r.text || r.body || '—'}
                          </p>
                        </td>

                        {/* 4. When Posted */}
                        <td className="whitespace-nowrap text-zinc-300">
                          {formatAdminDate(r.createdAt)}
                        </td>

                        {/* 5. Visibility Status */}
                        <td className="whitespace-nowrap">
                          <span
                            className={`admin-status-badge ${
                              r.isHidden ? 'admin-status-rose' : 'admin-status-emerald'
                            }`}
                          >
                            {r.isHidden ? 'Hidden' : 'Visible'}
                          </span>
                        </td>

                        {/* 6. Inspect/Edit, Hide & Delete Buttons */}
                        <td
                          className="whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectReviewForModal(r)}
                              className="admin-btn admin-btn-sky"
                            >
                              <Edit3 size={12} /> Inspect / Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleHideReview(r)}
                              className={`admin-btn ${
                                r.isHidden ? 'admin-btn-emerald' : 'admin-btn-amber'
                              }`}
                            >
                              {r.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                              {r.isHidden ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteReview(id)}
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
      ) : (
        /* Comments Moderation Compact Table */
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Movie / Series</th>
                <th>Posted By</th>
                <th>Comment Text</th>
                <th>When Posted</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-zinc-400">
                    <MessageSquare size={20} className="mx-auto mb-2 text-[#f5b942]" />
                    No comments found.
                  </td>
                </tr>
              ) : (
                filteredComments.map((c) => {
                  const id = c._id || c.id;
                  return (
                    <tr key={id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <SafeImage
                            src={c.moviePoster}
                            alt={c.movieTitle}
                            size="w185"
                            className="h-10 w-7 shrink-0 rounded object-cover"
                          />
                          <div>
                            <p className="font-bold text-white">
                              {c.movieTitle || `${String(c.type || 'movie').toUpperCase()} #${c.tmdbId}`}
                            </p>
                            <p className="text-[10px] text-zinc-400">#{c.tmdbId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="font-bold text-white">{c.user?.name || 'User'}</p>
                        <p className="text-[10px] text-zinc-400">{c.user?.email || ''}</p>
                      </td>
                      <td className="max-w-md">
                        <p className="line-clamp-2 text-xs text-zinc-200">{c.body}</p>
                      </td>
                      <td className="whitespace-nowrap text-zinc-400">
                        {formatAdminDate(c.createdAt)}
                      </td>
                      <td>
                        <span
                          className={`admin-status-badge ${
                            c.isHidden ? 'admin-status-rose' : 'admin-status-emerald'
                          }`}
                        >
                          {c.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleHideComment(c)}
                            className={`admin-btn ${
                              c.isHidden ? 'admin-btn-emerald' : 'admin-btn-amber'
                            }`}
                          >
                            {c.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                            {c.isHidden ? 'Unhide' : 'Hide'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteComment(id)}
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
      )}
    </div>
  );
}
