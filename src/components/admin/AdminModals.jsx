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
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { formatAdminDate } from './adminHelpers';

export function ReviewDetailEditModal({
  review,
  onClose,
  onSaveReview,
  onDeleteReview,
}) {
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

  return (
    <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md'>
      <div className='relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0e131f] text-white shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 px-6 py-4'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/15 text-brand'>
              <Award size={20} />
            </span>
            <div>
              <h3 className='text-base font-extrabold text-white'>
                {isCritic
                  ? 'Inspect & Edit Critic Review'
                  : 'Inspect & Moderate User Review'}
              </h3>
              <p className='text-xs text-zinc-400'>
                Posted on {formatAdminDate(review.createdAt)} by{' '}
                <b className='text-white'>
                  {review.criticName || review.user?.name || 'Member'}
                </b>
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='admin-btn admin-btn-secondary admin-btn-icon'
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className='studio-scroll flex-1 space-y-4 overflow-y-auto p-6'
        >
          {/* Movie Info Banner */}
          <div className='flex items-center gap-3.5 rounded-2xl border border-white/10 bg-[#070a10] p-3.5'>
            <SafeImage
              src={review.moviePoster}
              alt={review.movieTitle}
              size='w185'
              className='h-16 w-11 shrink-0 rounded-lg object-cover'
            />
            <div className='min-w-0 flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                    isCritic
                      ? 'bg-brand text-black'
                      : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {isCritic ? 'Verified Critic' : 'Audience Review'}
                </span>
                <span className='font-mono text-xs text-zinc-400'>
                  {String(review.type || 'movie').toUpperCase()} #
                  {review.tmdbId}
                </span>
              </div>
              <h4 className='mt-1 truncate text-base font-extrabold text-white'>
                {review.movieTitle || `Title #${review.tmdbId}`}
              </h4>
              {review.user?.email && (
                <p className='text-[11px] text-zinc-400'>
                  Author Email: {review.user.email}
                </p>
              )}
            </div>
          </div>

          <div className='grid gap-3.5 sm:grid-cols-3'>
            <div>
              <label className='mb-1 block text-xs font-semibold text-zinc-400'>
                Rating (1 – 10) *
              </label>
              <input
                required
                type='number'
                step='0.5'
                min='1'
                max='10'
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-extrabold text-brand'
              />
            </div>
            <div className='sm:col-span-2'>
              <label className='mb-1 block text-xs font-semibold text-zinc-400'>
                Headline / Summary
              </label>
              <input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder='Review headline...'
                className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white'
              />
            </div>
          </div>

          {isCritic && (
            <div className='grid gap-3.5 sm:grid-cols-3'>
              <div>
                <label className='mb-1 block text-xs font-semibold text-zinc-400'>
                  Critic Name
                </label>
                <input
                  value={form.criticName}
                  onChange={(e) =>
                    setForm({ ...form, criticName: e.target.value })
                  }
                  className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-semibold text-zinc-400'>
                  Publication
                </label>
                <input
                  value={form.publication}
                  onChange={(e) =>
                    setForm({ ...form, publication: e.target.value })
                  }
                  className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-semibold text-zinc-400'>
                  External Review Link
                </label>
                <input
                  value={form.externalUrl}
                  onChange={(e) =>
                    setForm({ ...form, externalUrl: e.target.value })
                  }
                  className='w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white'
                />
              </div>
            </div>
          )}

          <div>
            <label className='mb-1 block text-xs font-semibold text-zinc-400'>
              Full Review Body *
            </label>
            <textarea
              required
              rows={5}
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className='w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs leading-relaxed text-white focus:border-brand focus:outline-none'
            />
          </div>

          {/* Toggles */}
          <div className='flex flex-wrap items-center gap-5 rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-xs'>
            <label className='flex items-center gap-2 text-zinc-200'>
              <input
                type='checkbox'
                checked={form.isHidden}
                onChange={(e) =>
                  setForm({ ...form, isHidden: e.target.checked })
                }
                className='accent-brand'
              />
              Hide from Public Page
            </label>
            <label className='flex items-center gap-2 text-zinc-200'>
              <input
                type='checkbox'
                checked={form.spoiler}
                onChange={(e) =>
                  setForm({ ...form, spoiler: e.target.checked })
                }
                className='accent-brand'
              />
              Contains Spoilers
            </label>
            <label className='flex items-center gap-2 text-zinc-200'>
              <input
                type='checkbox'
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
                className='accent-brand'
              />
              Featured Review
            </label>
          </div>

          {/* Footer Buttons */}
          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4'>
            <button
              type='button'
              onClick={async () => {
                await onDeleteReview(id);
                onClose();
              }}
              className='admin-btn admin-btn-lg admin-btn-danger'
            >
              <Trash2 size={15} /> Delete Review
            </button>

            <div className='flex items-center gap-2.5'>
              <button
                type='button'
                onClick={onClose}
                className='admin-btn admin-btn-lg admin-btn-secondary'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={saving}
                className='admin-btn admin-btn-lg admin-btn-primary'
              >
                <Save size={15} />{' '}
                {saving ? 'Saving...' : 'Save Review Changes'}
              </button>
            </div>
          </div>
        </form>
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
    <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md'>
      <div className='relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0e131f] p-6 text-white shadow-2xl'>
        <button
          type='button'
          onClick={onClose}
          className='admin-btn admin-btn-secondary admin-btn-icon absolute top-4 right-4'
        >
          <X size={15} />
        </button>

        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand'>
          <KeyRound size={22} />
        </div>

        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-center text-lg font-extrabold'
        >
          Change User Password
        </h3>
        <p className='mt-1.5 text-center text-xs leading-relaxed text-zinc-400'>
          Set a new password for{' '}
          <b className='text-white'>{passwordModalUser.name}</b> (
          {passwordModalUser.email})
        </p>

        <form onSubmit={onSubmitPasswordChange} className='mt-5 space-y-3.5'>
          {passwordError && (
            <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400'>
              {passwordError}
            </div>
          )}

          <div>
            <label className='mb-1 block text-xs font-semibold text-zinc-400'>
              New Password *
            </label>
            <div className='relative'>
              <input
                required
                type={showNewPassword ? 'text' : 'password'}
                minLength={6}
                placeholder='Enter new password (min 6 chars)'
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className='w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 pr-9 text-xs text-white focus:border-brand focus:outline-none'
              />
              <button
                type='button'
                onClick={() => setShowNewPassword((v) => !v)}
                className='absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400'
              >
                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className='mb-1 block text-xs font-semibold text-zinc-400'>
              Confirm New Password *
            </label>
            <input
              required
              type={showNewPassword ? 'text' : 'password'}
              minLength={6}
              placeholder='Re-enter new password'
              value={confirmUserPassword}
              onChange={(e) => setConfirmUserPassword(e.target.value)}
              className='w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-brand focus:outline-none'
            />
          </div>

          <div className='mt-6 grid grid-cols-2 gap-3 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='admin-btn admin-btn-lg admin-btn-secondary'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={passwordSaving}
              className='admin-btn admin-btn-lg admin-btn-primary'
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
    <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md'>
      <div className='relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0e131f] p-6 text-white shadow-2xl'>
        <button
          type='button'
          onClick={onClose}
          className='admin-btn admin-btn-secondary admin-btn-icon absolute top-4 right-4'
        >
          <X size={15} />
        </button>

        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500'>
          <AlertTriangle size={22} />
        </div>

        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-center text-lg font-extrabold'
        >
          Delete User Account?
        </h3>
        <p className='mt-2 text-center text-xs leading-relaxed text-zinc-400'>
          Are you sure you want to permanently delete{' '}
          <b className='text-white'>{userToDelete.name}</b> (
          {userToDelete.email}) and all their reviews, comments, and watchlist
          items?
        </p>

        <div className='mt-6 grid grid-cols-2 gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='admin-btn admin-btn-lg admin-btn-secondary'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirmDelete}
            className='admin-btn admin-btn-lg admin-btn-danger'
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
    <div className='fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md'>
      <div className='relative w-full max-w-sm rounded-3xl border border-white/15 bg-[#0e131f] p-6 text-white shadow-2xl'>
        <button
          type='button'
          onClick={onClose}
          className='admin-btn admin-btn-secondary admin-btn-icon absolute top-4 right-4'
        >
          <X size={15} />
        </button>

        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500'>
          <Trash2 size={22} />
        </div>

        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-center text-lg font-extrabold'
        >
          Delete Community Room?
        </h3>
        <p className='mt-2 text-center text-xs leading-relaxed text-zinc-400'>
          Are you sure you want to permanently delete{' '}
          <b className='text-white'>
            {roomToDelete.icon} {roomToDelete.name}
          </b>{' '}
          and all {roomToDelete.messageCount || 0} chat messages inside it?
        </p>

        <div className='mt-6 grid grid-cols-2 gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='admin-btn admin-btn-lg admin-btn-secondary'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirmDelete}
            className='admin-btn admin-btn-lg admin-btn-danger'
          >
            <Trash2 size={14} /> Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
