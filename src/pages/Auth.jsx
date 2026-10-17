import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Film, ShieldCheck } from 'lucide-react';
import { login, signup, clearError } from '../store/authSlice';
import { APP_NAME, ROLES, ROUTES } from '../config/constants';

export default function Auth({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { user, loading, error } = useSelector((s) => s.auth);
  const prefs = useSelector((s) => s.preferences);
  const dispatch = useDispatch();
  const nav = useNavigate();

  useEffect(() => {
    dispatch(clearError());
  }, [mode, dispatch]);

  useEffect(() => {
    if (user) {
      // Redirect Admin & SuperAdmin directly to their dedicated Sidebar Studio Panel!
      if ([ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role)) {
        nav('/admin', { replace: true });
      } else {
        nav(ROUTES.HOME, { replace: true });
      }
    }
  }, [user, nav]);

  const submit = (e) => {
    e.preventDefault();
    const { modalOpen, ...cleanPreferences } = prefs;
    const payload = {
      ...form,
      preferences: cleanPreferences,
    };
    dispatch(isLogin ? login(payload) : signup(payload));
  };

  return (
    <div className='flex min-h-[82vh] items-center justify-center px-4 py-10'>
      <div className='w-full max-w-md rounded-3xl border border-white/15 bg-[#0e131f] p-7 shadow-2xl sm:p-8'>
        <div className='mb-6 flex items-center gap-2.5 text-lg font-extrabold'>
          <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5b942] text-black'>
            <Film size={18} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)' }}>{APP_NAME}</span>
        </div>

        <h1
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-2xl font-extrabold'
        >
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className='mt-1 text-xs text-zinc-400'>
          {isLogin
            ? 'Sign in to sync your cinema preferences, join live chats, and manage your watchlist.'
            : 'Your saved region and genre preferences will automatically sync to your new account.'}
        </p>

        {error && (
          <p className='mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300'>
            {error}
          </p>
        )}

        <form onSubmit={submit} className='mt-5 space-y-3.5 text-xs'>
          {!isLogin && (
            <div>
              <label className='mb-1 block text-zinc-400'>Full Name</label>
              <input
                required
                placeholder='Your name'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white focus:border-[#f5b942] focus:outline-none'
              />
            </div>
          )}
          <div>
            <label className='mb-1 block text-zinc-400'>Email Address</label>
            <input
              required
              type='email'
              placeholder='you@example.com'
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white focus:border-[#f5b942] focus:outline-none'
            />
          </div>
          <div>
            <label className='mb-1 block text-zinc-400'>Password</label>
            <input
              required
              type='password'
              minLength={6}
              placeholder='••••••••'
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className='w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white focus:border-[#f5b942] focus:outline-none'
            />
          </div>
          <button
            disabled={loading}
            className='w-full rounded-full bg-[#f5b942] py-3 text-xs font-extrabold text-black shadow-lg shadow-[#f5b942]/20 hover:brightness-110 disabled:opacity-50'
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Sign In'
                : 'Create Account'}
          </button>
        </form>

        <div className='mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-zinc-400'>
          <ShieldCheck size={16} className='shrink-0 text-emerald-400' />
          <span>
            Protected by <b className='text-zinc-200'>in-memory Access JWT</b> &{' '}
            <b className='text-zinc-200'>httpOnly Refresh Cookie</b> (zero
            tokens stored in localStorage).
          </span>
        </div>

        <p className='mt-5 text-center text-xs text-zinc-400'>
          {isLogin ? 'New to Movies Hub? ' : 'Already have an account? '}
          <Link
            to={isLogin ? ROUTES.SIGNUP : ROUTES.LOGIN}
            className='font-bold text-[#f5b942]'
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
