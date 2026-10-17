import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { closeLogoutModal, logout } from '../store/authSlice';

/**
 * LogoutConfirmModal — Triggered by EVERY Logout / Sign Out button across
 * Navbar, MobileBottomNav, Profile, and Admin Studio Sidebar.
 */
export default function LogoutConfirmModal() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { logoutModalOpen, user } = useSelector((s) => s.auth);
  const theme = useSelector((s) => s.theme.mode);

  if (!logoutModalOpen) return null;

  const handleConfirm = () => {
    dispatch(logout());
    dispatch(closeLogoutModal());
    nav('/', { replace: true });
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md'>
      <div
        className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${
          theme === 'light'
            ? 'border-slate-200 bg-white text-slate-900'
            : 'border-white/15 bg-[#0e131f] text-white'
        }`}
      >
        <button
          type='button'
          onClick={() => dispatch(closeLogoutModal())}
          className='absolute top-4 right-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/10'
        >
          <X size={16} />
        </button>

        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500'>
          <LogOut size={22} />
        </div>

        <h3
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-center text-lg font-extrabold'
        >
          Sign Out of Movies Hub?
        </h3>
        <p className='mt-2 text-center text-xs leading-relaxed text-zinc-400'>
          Are you sure you want to log out
          {user?.name ? ` of ${user.name}'s account` : ''}? You can sign back in
          anytime.
        </p>

        <div className='mt-6 grid grid-cols-2 gap-3'>
          <button
            type='button'
            onClick={() => dispatch(closeLogoutModal())}
            className='rounded-2xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold hover:bg-white/10'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleConfirm}
            className=' keep-white flex items-center justify-center gap-1.5 rounded-2xl bg-rose-500 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600'
          >
            <LogOut size={14} /> Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
