import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Home,
  Compass,
  MessageSquare,
  BookOpen,
  User,
  Shield,
  LogOut,
} from 'lucide-react';
import { ROLES } from '../config/constants';
import { openLogoutModal } from '../store/authSlice';

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);
  const isLight = theme === 'light';

  const navItems = [
    { to: '/', label: 'Home', icon: Home, active: pathname === '/' },
    {
      to: '/browse/movie',
      label: 'Explore',
      icon: Compass,
      active: pathname.startsWith('/browse'),
    },
    {
      to: '/community',
      label: 'Chat',
      icon: MessageSquare,
      active: pathname.startsWith('/community'),
    },
    {
      to: '/blogs',
      label: 'Blogs',
      icon: BookOpen,
      active: pathname.startsWith('/blogs'),
    },
    ...(isStaff
      ? [
          {
            to: '/admin',
            label: 'Studio',
            icon: Shield,
            active: pathname.startsWith('/admin'),
            highlight: true,
          },
        ]
      : []),
    {
      to: user ? '/profile' : '/login',
      label: user ? 'Profile' : 'Sign In',
      icon: User,
      active:
        pathname.startsWith('/profile') ||
        pathname.startsWith('/watchlist') ||
        pathname === '/login',
    },
  ];

  return (
    <nav
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      className={`fixed right-0 bottom-0 left-0 z-40 border-t px-1.5 py-1.5 backdrop-blur-xl transition-colors duration-300 lg:hidden ${
        isLight
          ? 'border-slate-200/90 bg-white/95 text-slate-800 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]'
          : 'border-white/10 bg-[#070a10]/95 text-zinc-300 shadow-[0_-4px_24px_rgba(0,0,0,0.6)]'
      }`}
    >
      <div className='mx-auto flex max-w-md items-center justify-around'>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-bold transition active:scale-95 ${
                item.active
                  ? 'text-[#d97706] dark:text-[#f5b942]'
                  : item.highlight
                    ? 'text-amber-500'
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900'
                      : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  item.active
                    ? 'bg-[#f5b942]/25 text-[#d97706] dark:text-[#f5b942]'
                    : item.highlight
                      ? 'bg-amber-500/15 text-amber-500'
                      : ''
                }`}
              >
                <Icon size={17} />
              </span>
              <span className='whitespace-nowrap'>{item.label}</span>
            </Link>
          );
        })}

        {/* Quick Logout Button on Mobile Lower Navbar when logged in */}
        {user && (
          <button
            type='button'
            onClick={() => dispatch(openLogoutModal())}
            className='flex min-w-[46px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] font-bold text-rose-500 active:scale-95'
          >
            <span className='flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10'>
              <LogOut size={15} />
            </span>
            <span className='whitespace-nowrap'>Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
