import { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Trash2,
  Award,
  Save,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { formatAdminDateTime } from './adminHelpers';
import { reviewService } from '../../services/reviewService';

export function ReviewDetailEditModal({
  review,
  onClose,
  onSaveReview,
  onDeleteReview,
}) {
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'comments'

  const [form, setForm] = useState({
    rating: 8,
    headline: '',
    text: '',
    criticName: '',
    publication: '',
    externalUrl: '',
    spoiler: false,
    isFeatured: false,
    isHidden: false,
  });
  const [saving, setSaving] = useState(false);

  // Comments for this movie
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!review) return;
    setForm({
      rating: review.rating ?? 8,
      headline: review.headline || review.title || '',
      text: review.text || review.body || '',
      criticName: review.criticName || '',
      publication: review.publication || '',
      externalUrl: review.externalUrl || '',
      spoiler: Boolean(review.spoiler),
      isFeatured: Boolean(review.isFeatured),
      isHidden: Boolean(review.isHidden),
    });

    // Auto-fetch comments for this movie
    const fetchMovieComments = async () => {
      if (!review.tmdbId) return;
      setCommentsLoading(true);
      try {
        const type = review.type || 'movie';
        const res = await reviewService.commentsForTitle(type, review.tmdbId);
        setComments(Array.isArray(res) ? res : []);
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchMovieComments();
  }, [review]);

  if (!review) return null;
  const id = review._id || review.id;
  const isCritic = review.reviewType === 'critic';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveReview(id, {
        ...form,
        rating: Number(form.rating),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHideComment = async (commentItem) => {
    const cId = commentItem._id || commentItem.id;
    const nextHidden = !commentItem.isHidden;
    try {
      await reviewService.admin.moderateComment(cId, { isHidden: nextHidden });
      setComments((prev) =>
        prev.map((c) =>
          (c._id || c.id) === cId ? { ...c, isHidden: nextHidden } : c,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await reviewService.admin.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => (c._id || c.id) !== commentId));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#0e131f] text-[#1b2230] dark:text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#d5d9e0] dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-brand/15 dark:text-brand">
              <Award size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-[#1b2230] dark:text-white">
                {isCritic ? 'Critic Review Inspection' : 'Audience Review Inspection'}
              </h3>
              <p className="text-xs text-[#4a5262] dark:text-zinc-400">
                Posted on {formatAdminDateTime(review.createdAt)} by{' '}
                <b className="text-[#1b2230] dark:text-white">
                  {review.criticName || review.user?.name || 'Member'}
                </b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary admin-btn-icon"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2 Tabs: Review Details vs Movie Comments */}
        <div className="flex border-b border-[#d5d9e0] dark:border-white/10 px-6 gap-3 shrink-0 bg-slate-50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setModalTab('details')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              modalTab === 'details'
                ? 'border-[#2350d8] text-[#2350d8] dark:border-brand dark:text-brand'
                : 'border-transparent text-[#4a5262] dark:text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Review Details
          </button>
          <button
            type="button"
            onClick={() => setModalTab('comments')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              modalTab === 'comments'
                ? 'border-[#2350d8] text-[#2350d8] dark:border-brand dark:text-brand'
                : 'border-transparent text-[#4a5262] dark:text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare size={13} />
            <span>Movie Comments ({comments.length})</span>
          </button>
        </div>

        {/* TAB 1: REVIEW DETAILS */}
        {modalTab === 'details' ? (
          <form onSubmit={handleSubmit} className="studio-scroll flex-1 space-y-4 overflow-y-auto p-6">
            {/* Movie Info Banner */}
            <div className="flex items-center gap-3.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-slate-50 dark:bg-[#151c2c] p-3.5">
              <SafeImage
                src={review.moviePoster}
                alt={review.movieTitle}
                size="w185"
                className="h-16 w-11 shrink-0 rounded-md object-cover border border-[#d5d9e0] dark:border-white/10"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                      isCritic
                        ? 'bg-blue-100 text-blue-700 dark:bg-brand dark:text-black'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                    }`}
                  >
                    {isCritic ? 'Verified Critic' : 'Audience Review'}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {String(review.type || 'movie').toUpperCase()} #{review.tmdbId}
                  </span>
                </div>
                <h4 className="mt-1 truncate text-sm font-bold text-[#1b2230] dark:text-white">
                  {review.movieTitle || `Title #${review.tmdbId}`}
                </h4>
                {review.user?.email && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Author Email: {review.user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                  Rating (1 – 10) *
                </label>
                <input
                  required
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm font-bold text-[#2350d8] dark:text-brand"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                  Headline / Summary
                </label>
                <input
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Review headline..."
                  className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white"
                />
              </div>
            </div>

            {isCritic && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                    Critic Name
                  </label>
                  <input
                    value={form.criticName}
                    onChange={(e) => setForm({ ...form, criticName: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                    Publication
                  </label>
                  <input
                    value={form.publication}
                    onChange={(e) => setForm({ ...form, publication: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                    External Review Link
                  </label>
                  <input
                    value={form.externalUrl}
                    onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                Full Review Body *
              </label>
              <textarea
                required
                rows={4}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                className="w-full p-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-sm text-[#1b2230] dark:text-white"
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#d5d9e0] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#1b2230] dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.isHidden}
                  onChange={(e) => setForm({ ...form, isHidden: e.target.checked })}
                  className="accent-[#2350d8] dark:accent-brand"
                />
                Hide from Public Page
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#1b2230] dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.spoiler}
                  onChange={(e) => setForm({ ...form, spoiler: e.target.checked })}
                  className="accent-[#2350d8] dark:accent-brand"
                />
                Contains Spoilers
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[#1b2230] dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="accent-[#2350d8] dark:accent-brand"
                />
                Featured Review
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d5d9e0] dark:border-white/10 pt-4">
              <button
                type="button"
                onClick={async () => {
                  await onDeleteReview(id);
                  onClose();
                }}
                className="admin-btn admin-btn-danger"
              >
                <Trash2 size={14} /> Delete Review
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="admin-btn admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="admin-btn admin-btn-primary"
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Review Changes'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* TAB 2: MOVIE COMMENTS */
          <div className="studio-scroll flex-1 space-y-3 overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#d5d9e0] dark:border-white/10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                All comments posted for <b className="text-[#1b2230] dark:text-white">{review.movieTitle || `#${review.tmdbId}`}</b>
              </p>
              <span className="text-xs font-bold text-[#2350d8] dark:text-brand">
                {comments.length} total comments
              </span>
            </div>

            {commentsLoading ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                Loading movie comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                <MessageCircle size={22} className="mx-auto mb-2 text-zinc-400" />
                No user comments posted for this movie yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {comments.map((c) => {
                  const cId = c._id || c.id;
                  return (
                    <div
                      key={cId}
                      className="p-3.5 rounded-xl border border-[#d5d9e0] dark:border-white/10 bg-slate-50 dark:bg-[#151c2c] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1b2230] dark:text-white">
                            {c.user?.name || 'User'}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {c.user?.email || ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {formatAdminDateTime(c.createdAt)}
                          </span>
                          <span
                            className={`admin-status-badge text-[9px] ${
                              c.isHidden ? 'admin-status-rose' : 'admin-status-emerald'
                            }`}
                          >
                            {c.isHidden ? 'Hidden' : 'Visible'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#1b2230] dark:text-zinc-200 leading-normal">
                        {c.body || c.text}
                      </p>

                      <div className="flex justify-end gap-2 pt-1 border-t border-[#d5d9e0] dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => handleToggleHideComment(c)}
                          className={`admin-btn admin-btn-sm ${
                            c.isHidden ? 'admin-btn-emerald' : 'admin-btn-secondary'
                          }`}
                        >
                          {c.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                          {c.isHidden ? 'Unhide' : 'Hide'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(cId)}
                          className="admin-btn admin-btn-danger admin-btn-sm px-2"
                          title="Delete comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChangePasswordModal({
  passwordModalUser,
  onClose,
  newUserPassword,
  setNewUserPassword,
  confirmUserPassword,
  setConfirmUserPassword,
  showNewPassword,
  setShowNewPassword,
  passwordError,
  passwordSaving,
  onSubmitPasswordChange,
}) {
  if (!passwordModalUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#0e131f] p-6 text-[#1b2230] dark:text-white shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="admin-btn admin-btn-secondary admin-btn-icon absolute top-4 right-4"
        >
          <X size={15} />
        </button>

        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-brand/15 dark:text-brand">
          <KeyRound size={20} />
        </div>

        <h3 className="text-center text-lg font-bold">
          Change User Password
        </h3>
        <p className="mt-1 text-center text-xs text-[#4a5262] dark:text-zinc-400">
          Set a new password for <b className="text-[#1b2230] dark:text-white">{passwordModalUser.name}</b> ({passwordModalUser.email})
        </p>

        <form onSubmit={onSubmitPasswordChange} className="mt-4 space-y-3">
          {passwordError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
              New Password *
            </label>
            <div className="relative">
              <input
                required
                type={showNewPassword ? 'text' : 'password'}
                minLength={6}
                placeholder="Enter new password (min 6 chars)"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full h-10 px-3 pr-9 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
              Confirm New Password *
            </label>
            <input
              required
              type={showNewPassword ? 'text' : 'password'}
              minLength={6}
              placeholder="Re-enter new password"
              value={confirmUserPassword}
              onChange={(e) => setConfirmUserPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#151c2c] text-xs text-[#1b2230] dark:text-white"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordSaving}
              className="admin-btn admin-btn-primary"
            >
              <Check size={14} />
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteUserConfirmModal({
  userToDelete,
  onClose,
  onConfirmDelete,
}) {
  if (!userToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#0e131f] p-6 text-[#1b2230] dark:text-white shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="admin-btn admin-btn-secondary admin-btn-icon absolute top-4 right-4"
        >
          <X size={15} />
        </button>

        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-500">
          <AlertTriangle size={20} />
        </div>

        <h3 className="text-center text-lg font-bold">
          Delete User Account?
        </h3>
        <p className="mt-1.5 text-center text-xs text-[#4a5262] dark:text-zinc-400 leading-normal">
          Are you sure you want to permanently delete <b className="text-[#1b2230] dark:text-white">{userToDelete.name}</b> ({userToDelete.email}) and all their reviews, comments, and watchlist items?
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="admin-btn admin-btn-danger"
          >
            <Trash2 size={14} /> Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteRoomConfirmModal({
  roomToDelete,
  onClose,
  onConfirmDelete,
}) {
  if (!roomToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-[#d5d9e0] dark:border-white/15 bg-white dark:bg-[#0e131f] p-6 text-[#1b2230] dark:text-white shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="admin-btn admin-btn-secondary admin-btn-icon absolute top-4 right-4"
        >
          <X size={15} />
        </button>

        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-500">
          <Trash2 size={20} />
        </div>

        <h3 className="text-center text-lg font-bold">
          Delete Community Room?
        </h3>
        <p className="mt-1.5 text-center text-xs text-[#4a5262] dark:text-zinc-400 leading-normal">
          Are you sure you want to permanently delete <b className="text-[#1b2230] dark:text-white">{roomToDelete.icon} {roomToDelete.name}</b> and all {roomToDelete.messageCount || 0} chat messages inside it?
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmDelete}
            className="admin-btn admin-btn-danger"
          >
            <Trash2 size={14} /> Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
