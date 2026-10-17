import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Lock, X } from 'lucide-react';
import { GUEST_LIMIT_MS, ROUTES } from '../config/constants';

const KEY = 'guest_started_at_v4';

export default function GuestGate() {
  const user = useSelector((s) => s.auth.user);
  const { pathname } = useLocation();
  const [expired, setExpired] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      setExpired(false);
      return;
    }
    const start = Number(localStorage.getItem(KEY)) || Date.now();
    localStorage.setItem(KEY, String(start));

    const check = () => setExpired(Date.now() - start >= GUEST_LIMIT_MS);
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [user]);

  const onAuthPage = pathname === ROUTES.LOGIN || pathname === ROUTES.SIGNUP;
  if (user || !expired || onAuthPage || dismissed) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md'>
      <div className='relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0e131f] p-7 text-center shadow-2xl'>
        <button
          type='button'
          onClick={() => setDismissed(true)}
          className='absolute top-4 right-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white'
        >
          <X size={16} />
        </button>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5b942]/15 text-[#f5b942]'>
          <Lock size={22} />
        </div>
        <h2
          style={{ fontFamily: 'var(--font-display)' }}
          className='text-xl font-bold'
        >
          Unlock Full Movies Hub Access
        </h2>
        <p className='mt-2 text-xs text-zinc-400'>
          Create a free account to sync your cinema preferences, join live
          community chat rooms, save your watchlist, and rate movies.
        </p>
        <div className='mt-6 flex gap-3'>
          <Link
            to={ROUTES.LOGIN}
            className='flex-1 rounded-full border border-white/15 py-2.5 text-xs font-semibold hover:bg-white/10'
          >
            Log in
          </Link>
          <Link
            to={ROUTES.SIGNUP}
            className='flex-1 rounded-full bg-[#f5b942] py-2.5 text-xs font-bold text-black hover:brightness-110'
          >
            Sign up Free
          </Link>
        </div>
      </div>
    </div>
  );
}
