import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star,
  Bookmark,
  Trash2,
  Lock,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  Shield,
  LogOut,
} from 'lucide-react';
import { updateProfile, deleteMyAccount, openLogoutModal } from '../store/authSlice';
import { openPreferenceModal } from '../store/preferencesSlice';
import { authService } from '../services/authService';
import { reviewService } from '../services/reviewService';
import { MOVIE_GENRES, ROLES } from '../config/constants';
import SafeImage from '../components/ui/SafeImage';

export default function Profile({ defaultTab = 'overview' }) {
  const user = useSelector((s) => s.auth.user);
  const prefs = useSelector((s) => s.preferences);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const [tab, setTab] = useState(defaultTab);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [favoriteGenres, setFavoriteGenres] = useState(user?.favoriteGenres || []);
  const [saved, setSaved] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwMsg, setPwMsg] = useState('');

  // Delete Account state (allowed for all users & admins; blocked for superadmin)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watchFilter, setWatchFilter] = useState('');

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!user) return;
    reviewService.byUser().then(setReviews).catch(() => {});
    reviewService.watchlist.list().then(setWatchlist).catch(() => {});
  }, [user]);

  const toggleGenre = (g) => {
    setFavoriteGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g].slice(0, 10),
    );
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile({ id: user.id, name, bio, favoriteGenres }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await authService.changePassword(pwForm);
      setPwForm({ currentPassword: '', newPassword: '' });
      setPwMsg('Password updated!');
    } catch (err) {
      setPwMsg(err.response?.data?.message || err.message);
    }
  };

  const handleConfirmDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleting(true);
    setDeleteError('');
    const res = await dispatch(deleteMyAccount(deletePassword));
    setDeleting(false);
    if (res.meta.requestStatus === 'fulfilled') {
      nav('/', { replace: true });
    } else {
      setDeleteError(res.payload || 'Failed to delete account');
    }
  };

  const filteredWatchlist = watchFilter
    ? watchlist.filter((w) => w.status === watchFilter)
    : watchlist;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Profile Hero Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-[#0e131f] p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            style={{ backgroundColor: user.avatarColor || '#f5b942' }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg"
          >
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-extrabold">
                {user.name}
              </h1>
              <span className="rounded-full bg-[#f5b942]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#f5b942] uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{user.email}</p>
            {user.bio && <p className="mt-1 text-xs text-zinc-300">{user.bio}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role) && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-xl bg-[#f5b942] px-4 py-2 text-xs font-extrabold text-black"
            >
              <Shield size={14} /> Open {user.role === ROLES.SUPERADMIN ? 'SuperAdmin' : 'Admin'} Studio
            </Link>
          )}
          <button
            type="button"
            onClick={() => dispatch(openPreferenceModal())}
            className="flex items-center gap-1.5 rounded-xl border border-[#f5b942]/30 bg-[#f5b942]/10 px-4 py-2 text-xs font-bold text-[#f5b942]"
          >
            <Sparkles size={14} /> Taste & Currency ({prefs.currency})
          </button>
          <button
            type="button"
            onClick={() => dispatch(openLogoutModal())}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'overview', label: 'Profile & Taste', icon: UserIcon },
          { id: 'watchlist', label: `My Watchlist (${watchlist.length})`, icon: Bookmark },
          { id: 'reviews', label: `My Reviews (${reviews.length})`, icon: Star },
          { id: 'security', label: 'Security & Account', icon: Lock },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                tab === t.id
                  ? 'bg-[#f5b942] text-black'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <form onSubmit={saveProfile} className="space-y-4 rounded-3xl border border-white/10 bg-[#0e131f] p-6">
          <h2 className="text-sm font-bold text-white">Edit Profile & Favorite Genres</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-[#f5b942] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Short Bio</label>
              <input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community what kind of cinema you love..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white focus:border-[#f5b942] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-zinc-400">Favorite Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(MOVIE_GENRES).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    favoriteGenres.includes(g)
                      ? 'bg-[#f5b942] text-black'
                      : 'border border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button className="rounded-full bg-[#f5b942] px-6 py-2.5 text-xs font-extrabold text-black hover:brightness-110">
              Save Profile Changes
            </button>
            {saved && <span className="text-xs font-semibold text-emerald-400">Saved!</span>}
          </div>
        </form>
      )}

      {tab === 'watchlist' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['', 'planned', 'watching', 'completed', 'favorite', 'dropped'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setWatchFilter(st)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                  watchFilter === st
                    ? 'bg-[#f5b942] text-black'
                    : 'border border-white/10 bg-[#0e131f] text-zinc-300'
                }`}
              >
                {st || 'All Saved'}
              </button>
            ))}
          </div>

          {filteredWatchlist.length === 0 ? (
            <p className="rounded-3xl border border-white/10 bg-[#0e131f] p-10 text-center text-xs text-zinc-500">
              Your watchlist is empty for this filter.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {filteredWatchlist.map((w) => {
                const t = w.title || {};
                return (
                  <div
                    key={w.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e131f]"
                  >
                    <Link to={`/details/${w.type}/${w.tmdbId}#overview`}>
                      <SafeImage
                        src={t.posterUrl}
                        alt={t.title}
                        size="w342"
                        variant="poster"
                        className="aspect-[2/3] w-full object-cover"
                      />
                    </Link>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-bold text-white">{t.title || `#${w.tmdbId}`}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 capitalize text-[#f5b942]">
                          {w.status}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            reviewService.watchlist
                              .remove(w.type, w.tmdbId)
                              .then(() => setWatchlist(watchlist.filter((x) => x.id !== w.id)))
                          }
                          className="text-zinc-400 hover:text-rose-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="rounded-3xl border border-white/10 bg-[#0e131f] p-10 text-center text-xs text-zinc-500">
              You haven’t posted any reviews yet.
            </p>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0e131f] p-4 text-xs"
              >
                <div>
                  <Link
                    to={`/details/${r.type}/${r.tmdbId}#reviews`}
                    className="text-sm font-bold text-[#f5b942] hover:underline"
                  >
                    {r.title?.title || `${r.type.toUpperCase()} #${r.tmdbId}`}
                  </Link>
                  <p className="mt-1 text-zinc-300">{r.text}</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[#f5b942]/15 px-3 py-1 font-bold text-[#f5b942]">
                  <Star size={12} fill="currentColor" /> {r.rating}/10
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <form onSubmit={handlePasswordChange} className="max-w-md space-y-3 rounded-3xl border border-white/10 bg-[#0e131f] p-6">
            <h2 className="text-sm font-bold text-white">Change Account Password</h2>
            <input
              required
              type="password"
              placeholder="Current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="New password (min 6 chars)"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white"
            />
            <button className="rounded-full bg-[#f5b942] px-5 py-2 text-xs font-extrabold text-black">
              Update Password
            </button>
            {pwMsg && <p className="text-xs text-amber-300">{pwMsg}</p>}
          </form>

          {/* Delete My Account Card (Available for all users & admins; Protected for SuperAdmin) */}
          <div className="max-w-xl rounded-3xl border border-rose-500/30 bg-rose-500/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="shrink-0 text-rose-400" />
              <div>
                <h3 className="text-sm font-extrabold text-rose-400">Danger Zone — Delete Account</h3>
                {user.role === ROLES.SUPERADMIN ? (
                  <p className="mt-1 text-xs text-zinc-400">
                    Your account has the <b className="text-[#f5b942]">SuperAdmin</b> role. Primary SuperAdmin accounts are protected and cannot be deleted.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-zinc-400">
                      Permanently delete your Movies Hub account along with your watchlist, reviews, and chat messages. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-5 py-2 text-xs font-extrabold text-white hover:bg-rose-600"
                    >
                      <Trash2 size={14} /> Delete My Account Permanently
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalOpen && user.role !== ROLES.SUPERADMIN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <form
            onSubmit={handleConfirmDeleteAccount}
            className="w-full max-w-md space-y-4 rounded-3xl border border-rose-500/40 bg-[#0e131f] p-6 text-white shadow-2xl"
          >
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={22} />
              <h3 className="text-lg font-extrabold">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-300">
              Please enter your current password to confirm permanent deletion of <b className="text-white">{user.email}</b>.
            </p>
            {deleteError && (
              <p className="rounded-xl bg-rose-500/15 p-2.5 text-xs text-rose-300">{deleteError}</p>
            )}
            <input
              required
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs text-white focus:border-rose-400 focus:outline-none"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting}
                className="rounded-xl bg-rose-500 px-5 py-2 text-xs font-extrabold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
