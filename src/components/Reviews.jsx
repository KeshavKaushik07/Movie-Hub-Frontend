import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Star,
  Trash2,
  MessageSquare,
  Send,
  ThumbsUp,
  Award,
  Reply,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { reviewService } from '../services/reviewService';
import { ROLES, ROUTES } from '../config/constants';
import CustomSelect from './ui/CustomSelect';

const ensureExternalHref = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(trimmed)) return `https://${trimmed}`;
  return '';
};

export default function Reviews({ tmdbId, type, activeSubTab = 'reviews' }) {
  const user = useSelector((s) => s.auth.user);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);

  const [subTab, setSubTab] = useState(activeSubTab === 'comments' ? 'comments' : 'reviews');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'critics' | 'audience'
  const [userReviews, setUserReviews] = useState([]);
  const [criticReviews, setCriticReviews] = useState([]);
  const [rating, setRating] = useState(8);
  const [headline, setHeadline] = useState('');
  const [text, setText] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  const [showCriticForm, setShowCriticForm] = useState(false);
  const [criticForm, setCriticForm] = useState({
    criticName: '',
    publication: '',
    rating: 8,
    headline: '',
    text: '',
    externalUrl: '',
  });

  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setSubTab(activeSubTab === 'comments' ? 'comments' : 'reviews');
  }, [activeSubTab]);

  const loadReviews = () => {
    if (!tmdbId) return Promise.resolve();
    return reviewService
      .forTitle(type, tmdbId)
      .then((data) => {
        setUserReviews(data.reviews || []);
        setCriticReviews(data.criticReviews || []);
        if (data.mine) {
          setRating(data.mine.rating);
          setHeadline(data.mine.headline || '');
          setText(data.mine.text || '');
          setSpoiler(!!data.mine.spoiler);
        }
      })
      .catch(() => {});
  };

  const loadComments = () => {
    if (!tmdbId) return Promise.resolve();
    return reviewService
      .commentsForTitle(type, tmdbId)
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    loadReviews();
    loadComments();
  }, [tmdbId, type, user?.id]); // eslint-disable-line

  const submitReview = async (e) => {
    e.preventDefault();
    if (!text.trim() || !tmdbId) return;
    setError(null);
    try {
      await reviewService.save({
        tmdbId: Number(tmdbId),
        type,
        rating: Number(rating),
        headline: headline.trim(),
        text: text.trim(),
        spoiler,
      });
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const submitCriticReview = async (e) => {
    e.preventDefault();
    if (!criticForm.text.trim() || !tmdbId) return;
    setError(null);
    try {
      await reviewService.addCriticReview({
        type,
        tmdbId: Number(tmdbId),
        ...criticForm,
      });
      setCriticForm({ criticName: '', publication: '', rating: 8, headline: '', text: '', externalUrl: '' });
      setShowCriticForm(false);
      await loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const submitComment = async (e, parentId = null) => {
    e.preventDefault();
    const body = parentId ? replyBody : commentBody;
    if (!body.trim() || !tmdbId) return;
    try {
      await reviewService.addComment({
        type,
        tmdbId: Number(tmdbId),
        body: body.trim(),
        parent: parentId,
      });
      if (parentId) {
        setReplyBody('');
        setReplyTo(null);
      } else {
        setCommentBody('');
      }
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const avg = userReviews.length
    ? (userReviews.reduce((s, r) => s + Number(r.rating), 0) / userReviews.length).toFixed(1)
    : null;
  const criticAvg = criticReviews.length
    ? (criticReviews.reduce((s, r) => s + Number(r.rating), 0) / criticReviews.length).toFixed(1)
    : null;

  const topLevelComments = comments.filter((c) => !c.parent);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parent) {
      acc[c.parent] = acc[c.parent] || [];
      acc[c.parent].push(c);
    }
    return acc;
  }, {});

  const totalCombined = userReviews.length + criticReviews.length;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      {/* Requirement 8: Merged Reviews & Critics Tab + Discussion Tab */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('reviews')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              subTab === 'reviews'
                ? 'bg-[#f5b942] text-black'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <Star size={14} /> Reviews & Critics ({totalCombined})
            {avg && <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px]">Audience ★ {avg}</span>}
            {criticAvg && <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px]">Critics ★ {criticAvg}</span>}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('comments')}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
              subTab === 'comments'
                ? 'bg-sky-400 text-black'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <MessageSquare size={14} /> Discussion ({comments.length})
          </button>
        </div>

        {subTab === 'reviews' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${totalCombined})` },
              { id: 'critics', label: `Critics (${criticReviews.length})` },
              { id: 'audience', label: `Audience (${userReviews.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  filterMode === f.id
                    ? 'border border-[#f5b942]/40 bg-[#f5b942]/15 text-[#f5b942]'
                    : 'bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}

            {isStaff && (
              <button
                type="button"
                onClick={() => setShowCriticForm(!showCriticForm)}
                className="ml-2 rounded-full bg-emerald-400 px-3.5 py-1 text-[11px] font-bold text-black"
              >
                {showCriticForm ? 'Close Critic Form' : '+ Add Critic Review'}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {error}
        </p>
      )}

      {subTab === 'reviews' && (
        <div className="space-y-6">
          {showCriticForm && isStaff && (
            <form onSubmit={submitCriticReview} className="space-y-3 rounded-2xl border border-emerald-500/30 bg-[#0e131f] p-5">
              <h4 className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
                Publish Official Critic Review
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  required
                  placeholder="Critic Name (e.g. Taran Adarsh)"
                  value={criticForm.criticName}
                  onChange={(e) => setCriticForm({ ...criticForm, criticName: e.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                />
                <input
                  required
                  placeholder="Publication (e.g. Film Companion)"
                  value={criticForm.publication}
                  onChange={(e) => setCriticForm({ ...criticForm, publication: e.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                />
                <CustomSelect
                  value={criticForm.rating}
                  onChange={(v) => setCriticForm({ ...criticForm, rating: Number(v) })}
                  options={[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
                    value: n,
                    label: `Critic Score: ${n}/10`,
                  }))}
                />
              </div>
              <input
                placeholder="Headline / Pull Quote"
                value={criticForm.headline}
                onChange={(e) => setCriticForm({ ...criticForm, headline: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
              />
              <textarea
                required
                rows={3}
                placeholder="Critic review excerpt..."
                value={criticForm.text}
                onChange={(e) => setCriticForm({ ...criticForm, text: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white"
              />
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  placeholder="https://variety.com/... (Optional full article URL)"
                  value={criticForm.externalUrl}
                  onChange={(e) => setCriticForm({ ...criticForm, externalUrl: e.target.value })}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                />
                <button className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-black">
                  Save Critic Review
                </button>
              </div>
            </form>
          )}

          {/* Verified Critic Reviews */}
          {(filterMode === 'all' || filterMode === 'critics') && criticReviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-emerald-400 uppercase">
                <Award size={14} /> Verified Critic Reviews ({criticReviews.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {criticReviews.map((c) => {
                  const safeHref = ensureExternalHref(c.externalUrl);
                  return (
                    <div key={c.id} className="flex flex-col justify-between rounded-2xl border border-emerald-500/20 bg-[#0e131f] p-5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                              <Award size={11} /> {c.publication || 'Verified Critic'}
                            </span>
                            <h4 className="mt-1 text-sm font-bold text-white">{c.criticName}</h4>
                          </div>
                          <span className="rounded-xl bg-emerald-400 px-2.5 py-1 text-xs font-extrabold text-black">
                            {c.rating}/10
                          </span>
                        </div>
                        {c.headline && <p className="mt-3 text-xs font-bold text-zinc-200">“{c.headline}”</p>}
                        <p className="mt-2 text-xs leading-relaxed text-zinc-300">{c.text}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-zinc-500">
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-3">
                          {safeHref && (
                            <a
                              href={safeHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:underline"
                            >
                              Full Review <ExternalLink size={11} />
                            </a>
                          )}
                          {isStaff && (
                            <button
                              type="button"
                              onClick={() => reviewService.remove(c.id).then(loadReviews)}
                              className="text-zinc-400 hover:text-rose-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audience Reviews */}
          {(filterMode === 'all' || filterMode === 'audience') && (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-[#f5b942] uppercase">
                <Star size={14} /> Audience Reviews ({userReviews.length})
              </h3>
              {user ? (
                <form onSubmit={submitReview} className="space-y-3 rounded-2xl border border-white/10 bg-[#0e131f] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-zinc-300">
                      Posting as <b className="text-white">{user.name}</b>
                    </span>
                    <div className="w-40">
                      <CustomSelect
                        value={rating}
                        onChange={(v) => setRating(Number(v))}
                        options={[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
                          value: n,
                          label: `★ ${n} / 10`,
                        }))}
                      />
                    </div>
                  </div>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Review headline (optional)..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white focus:border-[#f5b942] focus:outline-none"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your honest thoughts on the story, performances, music, and direction..."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white focus:border-[#f5b942] focus:outline-none"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        checked={spoiler}
                        onChange={(e) => setSpoiler(e.target.checked)}
                        className="accent-[#f5b942]"
                      />
                      Contains spoilers
                    </label>
                    <button className="rounded-full bg-[#f5b942] px-5 py-2 text-xs font-bold text-black hover:brightness-110">
                      Publish Review
                    </button>
                  </div>
                </form>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-[#0e131f] p-4 text-xs text-zinc-400">
                  Please <Link to={ROUTES.LOGIN} className="font-bold text-[#f5b942] underline">log in</Link> to rate and review this title.
                </p>
              )}

              <div className="space-y-3">
                {userReviews.map((r) => {
                  const isSpoilerHidden = r.spoiler && !revealedSpoilers[r.id];
                  return (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-[#0e131f] p-5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: r.user?.avatarColor || '#f5b942' }}
                            className="keep-white flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          >
                            {(r.user?.name || 'U')[0].toUpperCase()}
                          </span>
                          <b className="text-white">{r.user?.name || 'User'}</b>
                          <span>• {new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 rounded-full bg-[#f5b942]/15 px-2.5 py-0.5 font-bold text-[#f5b942]">
                            <Star size={12} fill="currentColor" /> {r.rating}/10
                          </span>
                          {(user?.id === r.user?.id || isStaff) && (
                            <button
                              type="button"
                              onClick={() => reviewService.remove(r.id).then(loadReviews)}
                              className="text-zinc-400 hover:text-rose-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {r.headline && <h4 className="mt-2.5 text-sm font-bold text-white">{r.headline}</h4>}
                      {isSpoilerHidden ? (
                        <button
                          type="button"
                          onClick={() => setRevealedSpoilers({ ...revealedSpoilers, [r.id]: true })}
                          className="mt-2 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"
                        >
                          <AlertTriangle size={14} /> Spoiler warning — click to reveal review
                        </button>
                      ) : (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-300">{r.text}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'comments' && (
        <div className="space-y-4">
          {user && (
            <form onSubmit={(e) => submitComment(e, null)} className="flex gap-2 rounded-2xl border border-white/10 bg-[#0e131f] p-3">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Start a discussion thread about this title..."
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button className="flex items-center gap-1.5 rounded-full bg-sky-400 px-4 py-2 text-xs font-bold text-black">
                <Send size={13} /> Post
              </button>
            </form>
          )}
          <div className="space-y-3">
            {topLevelComments.map((c) => {
              const replies = repliesByParent[c.id] || [];
              return (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-[#0e131f] p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-bold text-white">{c.user?.name || 'User'}</span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-200">{c.text || c.body}</p>
                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-zinc-400">
                    <button
                      type="button"
                      onClick={() => user && reviewService.toggleLike(c.id).then(loadComments)}
                      className={`flex items-center gap-1 ${c.liked ? 'text-sky-400' : 'hover:text-white'}`}
                    >
                      <ThumbsUp size={12} /> {c.likeCount ?? c.likesCount ?? 0}
                    </button>
                    {user && (
                      <button
                        type="button"
                        onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        <Reply size={12} /> Reply
                      </button>
                    )}
                  </div>
                  {replyTo === c.id && (
                    <form onSubmit={(e) => submitComment(e, c.id)} className="mt-3 flex gap-2 pl-4">
                      <input
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder={`Reply to ${c.user?.name || 'user'}...`}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                      />
                      <button className="rounded-xl bg-sky-400 px-3 py-1.5 text-xs font-bold text-black">
                        Reply
                      </button>
                    </form>
                  )}
                  {replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-white/10 pl-4">
                      {replies.map((rep) => (
                        <div key={rep.id} className="rounded-xl bg-white/[0.03] p-2.5 text-xs">
                          <span className="font-bold text-white">{rep.user?.name || 'User'}</span>
                          <p className="mt-1 text-zinc-300">{rep.text || rep.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
