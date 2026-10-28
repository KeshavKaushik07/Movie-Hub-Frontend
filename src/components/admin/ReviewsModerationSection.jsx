import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Trash2,
  Award,
  Search,
  Edit3,
  Plus,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { tmdb } from '../../services/api';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') || 'all'; // 'all' | 'critic' | 'user' | 'comments' | 'publish'

  const [subTab, setSubTab] = useState(urlTab);
  const [reviewTypeFilter, setReviewTypeFilter] = useState(
    urlTab === 'critic' ? 'critic' : urlTab === 'user' ? 'user' : 'all',
  );
  const [searchQ, setSearchQ] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'visible' | 'hidden'

  // Quick movie search inside Publish Critic Review form
  const [criticMovieQ, setCriticMovieQ] = useState('');
  const [criticMovieHits, setCriticMovieHits] = useState([]);

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

  useEffect(() => {
    const nextTab = searchParams.get('tab') || 'all';
    setSubTab(nextTab);
    if (nextTab === 'critic' || nextTab === 'user' || nextTab === 'all') {
      setReviewTypeFilter(nextTab);
    }
  }, [searchParams]);

  const handleSwitchTab = (nextTab) => {
    setSubTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const criticReviewsCount = (allReviews || []).filter(
    (r) => r.reviewType === 'critic',
  ).length;
  const audienceReviewsCount = (allReviews || []).filter(
    (r) => r.reviewType !== 'critic',
  ).length;

  const filteredReviews = (allReviews || []).filter((r) => {
    if (reviewTypeFilter === 'critic' && r.reviewType !== 'critic') return false;
    if (reviewTypeFilter === 'user' && r.reviewType === 'critic') return false;
    if (visibilityFilter === 'visible' && r.isHidden) return false;
    if (visibilityFilter === 'hidden' && !r.isHidden) return false;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase().trim();
      const movieMatch = (r.movieTitle || '').toLowerCase().includes(q);
      const authorMatch = (r.criticName || r.user?.name || '')
        .toLowerCase()
        .includes(q);
      const textMatch = (r.headline || r.text || '').toLowerCase().includes(q);
      return movieMatch || authorMatch || textMatch;
    }
    return true;
  });

  const filteredComments = (allComments || []).filter((c) => {
    if (visibilityFilter === 'visible' && c.isHidden) return false;
    if (visibilityFilter === 'hidden' && !c.isHidden) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase().trim();
    return (
      (c.movieTitle || '').toLowerCase().includes(q) ||
      (c.user?.name || '').toLowerCase().includes(q) ||
      (c.body || '').toLowerCase().includes(q)
    );
  });

  const searchMovieForCritic = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!criticMovieQ.trim()) return;
    try {
      const res = await tmdb.search(criticMovieQ.trim());
      setCriticMovieHits((res.items || res.results || []).slice(0, 6));
    } catch {
      setCriticMovieHits([]);
    }
  };

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
    handleSwitchTab('all');
    setReviewTypeFilter('critic');
  };

  return (
    <div className="space-y-5">
      {/* Frozen Contextual Filter & Search Bar */}
      <div className="admin-sticky-bar">
        {subTab !== 'publish' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e131f] p-3.5 shadow-lg">
            {subTab !== 'comments' ? (
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#070a10] p-1">
                {[
                  { key: 'all', label: `All Reviews (${allReviews.length})`, icon: Award },
                  { key: 'critic', label: `Critics (${criticReviewsCount})`, icon: Award },
                  { key: 'user', label: `Audience (${audienceReviewsCount})`, icon: Users },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = reviewTypeFilter === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setReviewTypeFilter(t.key)}
                      className={`admin-btn ${
                        active
                          ? 'admin-btn-primary'
                          : 'admin-btn-secondary border-transparent shadow-none'
                      }`}
                    >
                      <Icon size={13} /> {t.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <MessageSquare size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Comments Moderation ({allComments.length})
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Inspect, hide, or permanently delete user comments across titles
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#070a10] p-1">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'visible', label: 'Visible' },
                  { value: 'hidden', label: 'Hidden' },
                ].map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVisibilityFilter(v.value)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                      visibilityFilter === v.value
                        ? 'bg-brand/20 font-extrabold text-brand'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <div className="relative w-56 sm:w-64">
                <Search
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search movie, critic, user, text..."
                  className="w-full rounded-xl border border-white/10 bg-[#070a10] py-2 pr-8 pl-8 text-xs text-white focus:border-brand focus:outline-none"
                />
                {searchQ && (
                  <button
                    type="button"
                    onClick={() => setSearchQ('')}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-[#0e131f] p-3.5 shadow-lg">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-extrabold text-brand">
                <Award size={16} /> Publish Official Verified Critic Review
              </h4>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Search for a movie or web series below to auto-fill its TMDB ID, then enter the critic review details.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                handleSwitchTab('all');
                setReviewTypeFilter('critic');
              }}
              className="admin-btn admin-btn-secondary"
            >
              View Verified Critics ({criticReviewsCount})
            </button>
          </div>
        )}
      </div>

      {/* ==================== PUBLISH VERIFIED CRITIC REVIEW SUB-VIEW ==================== */}
      {subTab === 'publish' ? (
        <div className="rounded-2xl border border-brand/35 bg-[#0e131f] p-5 shadow-xl sm:p-6">
          {/* Quick Movie Lookup to Auto-Fill TMDB ID */}
          <form onSubmit={searchMovieForCritic} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={criticMovieQ}
                onChange={(e) => setCriticMovieQ(e.target.value)}
                placeholder="Search movie or series by title to auto-fill TMDB ID..."
                className="w-full rounded-xl border border-white/10 bg-[#070a10] py-2 pr-4 pl-9 text-xs text-white focus:border-brand focus:outline-none"
              />
            </div>
            <button type="submit" className="admin-btn admin-btn-secondary px-4">
              Find Title
            </button>
          </form>

          {criticMovieHits.length > 0 && (
            <div className="no-scrollbar mb-4 flex gap-2.5 overflow-x-auto pb-2">
              {criticMovieHits.map((m) => (
                <button
                  key={`${m.type}-${m.id}`}
                  type="button"
                  onClick={() => {
                    setCriticForm({
                      ...criticForm,
                      tmdbId: m.id,
                      type: m.type === 'tv' ? 'tv' : 'movie',
                    });
                    setCriticMovieHits([]);
                  }}
                  className="flex shrink-0 items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 p-2 text-left text-xs transition hover:border-brand"
                >
                  <SafeImage
                    src={m.posterUrl}
                    alt={m.title}
                    className="h-11 w-8 rounded object-cover"
                  />
                  <div>
                    <p className="font-bold text-white">{m.title || m.name}</p>
                    <p className="text-[10px] text-brand">
                      TMDB #{m.id} • {m.year || '—'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submitNewCritic} className="space-y-4">
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
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
              <input
                required
                placeholder="Critic Name (e.g. Taran Adarsh) *"
                value={criticForm.criticName}
                onChange={(e) =>
                  setCriticForm({ ...criticForm, criticName: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
              <input
                placeholder="Publication (e.g. Film Companion)"
                value={criticForm.publication}
                onChange={(e) =>
                  setCriticForm({ ...criticForm, publication: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
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
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Review Headline / Verdict Summary"
                value={criticForm.headline}
                onChange={(e) => setCriticForm({ ...criticForm, headline: e.target.value })}
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
              <input
                placeholder="External Source URL (optional)"
                value={criticForm.externalUrl}
                onChange={(e) =>
                  setCriticForm({ ...criticForm, externalUrl: e.target.value })
                }
                className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
              />
            </div>

            <textarea
              required
              rows={4}
              placeholder="Write the full critic review quote or analysis..."
              value={criticForm.text}
              onChange={(e) => setCriticForm({ ...criticForm, text: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white"
            />

            <div className="flex justify-end border-t border-white/10 pt-3">
              <button type="submit" className="admin-btn admin-btn-primary px-6 py-2.5">
                <Plus size={14} /> Publish Verified Critic Review
              </button>
            </div>
          </form>
        </div>
      ) : subTab !== 'comments' ? (
        /* ==================== REVIEWS TABLE ==================== */
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-[11px] text-zinc-400">
              💡 Tip: Click any critic or audience review row below to open the full details & edit modal.
            </p>
            <span className="text-[11px] font-bold text-zinc-400">
              Showing <b className="text-white">{filteredReviews.length}</b> reviews
            </span>
          </div>

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
                      <Award size={20} className="mx-auto mb-2 text-brand" />
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
                        <td className="max-w-52 overflow-hidden">
                          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                            <SafeImage
                              src={r.moviePoster}
                              alt={r.movieTitle}
                              size="w185"
                              className="h-11 w-8 shrink-0 rounded-md border border-white/10 object-cover"
                            />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p
                                className="truncate font-extrabold text-white"
                                title={r.movieTitle}
                              >
                                {r.movieTitle ||
                                  `${String(r.type || 'movie').toUpperCase()} #${r.tmdbId}`}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {String(r.type || 'movie').toUpperCase()} #{r.tmdbId}
                                {r.movieYear ? ` • ${r.movieYear}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap">
                          <div className="leading-tight">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{authorName}</span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                                  isCritic
                                    ? 'bg-brand text-black'
                                    : 'bg-sky-500/20 text-sky-300'
                                }`}
                              >
                                {isCritic ? 'Critic' : 'Audience'}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-zinc-400">
                              {r.publication || r.user?.email || 'Movies Hub Member'}
                            </p>
                          </div>
                        </td>

                        <td className="max-w-xs overflow-hidden">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand/15 px-2 py-0.5 text-xs font-black text-brand">
                              ★ {Number(r.rating || 0).toFixed(1)}/10
                            </span>
                            {r.headline && (
                              <span className="truncate font-bold text-white">
                                {r.headline}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-[11px] text-zinc-300">
                            {r.text || r.body || '—'}
                          </p>
                        </td>

                        <td className="whitespace-nowrap text-zinc-300">
                          {formatAdminDate(r.createdAt)}
                        </td>

                        <td className="whitespace-nowrap">
                          <span
                            className={`admin-status-badge ${
                              r.isHidden ? 'admin-status-rose' : 'admin-status-emerald'
                            }`}
                          >
                            {r.isHidden ? 'Hidden' : 'Visible'}
                          </span>
                        </td>

                        <td
                          className="whitespace-nowrap text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectReviewForModal(r)}
                              className="admin-btn admin-btn-sky admin-btn-sm"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleHideReview(r)}
                              className={`admin-btn admin-btn-sm ${
                                r.isHidden ? 'admin-btn-emerald' : 'admin-btn-amber'
                              }`}
                            >
                              {r.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                              {r.isHidden ? 'Unhide' : 'Hide'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteReview(id)}
                              className="admin-btn admin-btn-danger admin-btn-sm px-2"
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
        </div>
      ) : (
        /* ==================== COMMENTS MODERATION TABLE ==================== */
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
                    <MessageSquare size={20} className="mx-auto mb-2 text-brand" />
                    No comments found.
                  </td>
                </tr>
              ) : (
                filteredComments.map((c) => {
                  const id = c._id || c.id;
                  return (
                    <tr key={id}>
                      <td className="max-w-52 overflow-hidden">
                        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                          <SafeImage
                            src={c.moviePoster}
                            alt={c.movieTitle}
                            size="w185"
                            className="h-10 w-7 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="truncate font-bold text-white" title={c.movieTitle}>
                              {c.movieTitle ||
                                `${String(c.type || 'movie').toUpperCase()} #${c.tmdbId}`}
                            </p>
                            <p className="text-[10px] text-zinc-400">#{c.tmdbId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="font-bold text-white">{c.user?.name || 'User'}</p>
                        <p className="text-[10px] text-zinc-400">{c.user?.email || ''}</p>
                      </td>
                      <td className="max-w-xs overflow-hidden">
                        <p className="truncate text-xs text-zinc-200">{c.body}</p>
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
                            className={`admin-btn admin-btn-sm ${
                              c.isHidden ? 'admin-btn-emerald' : 'admin-btn-amber'
                            }`}
                          >
                            {c.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                            {c.isHidden ? 'Unhide' : 'Hide'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteComment(id)}
                            className="admin-btn admin-btn-danger admin-btn-sm px-2"
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
      )}
    </div>
  );
}
