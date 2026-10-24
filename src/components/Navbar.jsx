import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Film,
  Search,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Bookmark,
  Sun,
  Moon,
  Sparkles,
  MessageSquare,
  BookOpen,
  SlidersHorizontal,
  Tv,
  X,
} from 'lucide-react';
import {
  APP_NAME,
  NAV_MENU,
  OTT_LIST,
  ROLES,
  ROUTES,
} from '../config/constants';
import { openLogoutModal } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';
import {
  setRegionAndCurrency,
  openPreferenceModal,
} from '../store/preferencesSlice';

export default function Navbar() {
  const [q, setQ] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.theme.mode);
  const { region, currency } = useSelector((s) => s.preferences);

  const dispatch = useDispatch();
  const nav = useNavigate();
  const loc = useLocation();
  const profileRef = useRef(null);

  const isStaff = user && [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user.role);
  const isLight = theme === 'light';

  useEffect(() => {
    setOpenMenu(null);
    setProfileOpen(false);
    setMobileSearchOpen(false);
  }, [loc.pathname, loc.search]);

  useEffect(() => {
    const onOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/browse/movie?q=${encodeURIComponent(q.trim())}`);
    setQ('');
    setMobileSearchOpen(false);
  };

  // ---- Active tab detection (based on current URL) ----
  const currentParams = new URLSearchParams(loc.search);
  const getActiveItemTo = (items = []) => {
    let best = null;
    let bestScore = -1;
    items.forEach((it) => {
      const [path, query = ''] = String(it.to).split('?');
      if (path !== loc.pathname) return;
      let ok = true;
      let score = 0;
      new URLSearchParams(query).forEach((v, k) => {
        if (currentParams.get(k) === v) score += 1;
        else ok = false;
      });
      if (ok && score > bestScore) {
        best = it.to;
        bestScore = score;
      }
    });
    return best;
  };

  return (
    <header
      className={`sticky top-0 z-[200] w-full border-b backdrop-blur-xl transition-colors duration-300 ${
        isLight
          ? 'border-slate-200/90 bg-white/95 text-slate-900 shadow-xs'
          : 'border-white/10 bg-[#070a10]/95 text-white'
      }`}
    >
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-1.5 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3'>
        {/* Brand Logo (Never wraps) */}
        <Link
          to={ROUTES.HOME}
          className='flex min-w-0 shrink items-center gap-2 whitespace-nowrap font-extrabold tracking-tight sm:mr-8 sm:shrink-0'
        >
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-amber-500  shadow-md shadow-brand/20 sm:h-9 sm:w-9 rounded-xl overflow-hidden'>
            <img src='/movie-icon.png' alt='' className='object-cover' />
          </span>
          <span
            style={{ fontFamily: 'var(--font-display)' }}
            className='truncate text-sm font-extrabold sm:overflow-visible sm:text-base lg:text-sm xl:text-base'
          >
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Navigation — Movies, Web Series, OTT (with All OTT uppermost), Blogs & Community */}
        <nav className='hidden items-center gap-0.5 lg:flex'>
          {NAV_MENU.map((m) => {
            const isOttMenu = m.key === 'ott' || m.label === 'OTT';
            const activeItemTo = isOttMenu ? null : getActiveItemTo(m.items);
            const isMenuActive = isOttMenu
              ? loc.pathname.startsWith('/ott')
              : Boolean(activeItemTo);
            const activeProvider = loc.pathname.startsWith('/ott')
              ? currentParams.get('provider')
              : null;
            return (
              <div
                key={m.key || m.label}
                className='relative shrink-0'
                onMouseEnter={() => setOpenMenu(m.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type='button'
                  onClick={() => {
                    if (isOttMenu) {
                      nav('/ott');
                      setOpenMenu(null);
                    } else {
                      setOpenMenu(openMenu === m.label ? null : m.label);
                    }
                  }}
                  className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                    openMenu === m.label || isMenuActive
                      ? 'bg-brand/15 text-brand'
                      : isLight
                        ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isOttMenu && (
                    <Tv size={13} className='shrink-0 text-brand' />
                  )}
                  <span>{m.label}</span>
                  <ChevronDown
                    size={13}
                    className={`shrink-0 transition-transform duration-200 ${
                      openMenu === m.label ? 'rotate-180 text-brand' : ''
                    } ${isMenuActive && openMenu !== m.label ? 'text-brand' : ''}`}
                  />
                </button>

                {openMenu === m.label && (
                  <div className='absolute top-full left-0 z-[210] w-64 pt-1.5'>
                    <div
                      style={{
                        backgroundColor: isLight ? '#ffffff' : '#0b101b',
                      }}
                      className={`rounded-2xl border p-2 shadow-lg ${
                        isLight
                          ? 'border-slate-200 bg-white text-slate-900'
                          : 'border-white/15 bg-[#0b101b] text-zinc-100'
                      }`}
                    >
                      {isOttMenu ? (
                        <div className='space-y-1'>
                          {/* Uppermost Item: All OTT Master Page */}
                          <Link
                            to='/ott'
                            onClick={() => setOpenMenu(null)}
                            className='flex items-center justify-between rounded-xl bg-brand px-3 py-2 text-xs font-extrabold text-black shadow-sm transition hover:brightness-105'
                          >
                            <span className='flex items-center gap-1.5'>
                              <Sparkles size={13} /> All OTT
                            </span>
                            <span className='rounded bg-black/15 px-1.5 py-0.5 text-[9px] font-black uppercase'>
                              Master Page
                            </span>
                          </Link>
                          <div
                            className={`my-1 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}
                          />
                          <div className='studio-scroll max-h-64 space-y-0.5 overflow-y-auto pr-1'>
                            {OTT_LIST.map((ott) => (
                              <Link
                                key={ott.key}
                                to={`/ott?provider=${ott.key}`}
                                onClick={() => setOpenMenu(null)}
                                aria-current={
                                  activeProvider === ott.key
                                    ? 'page'
                                    : undefined
                                }
                                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                  activeProvider === ott.key
                                    ? 'bg-brand/15 text-brand'
                                    : isLight
                                      ? 'text-slate-800 hover:bg-amber-50 hover:text-amber-700'
                                      : 'text-zinc-200 hover:bg-brand/15 hover:text-brand'
                                }`}
                              >
                                <span
                                  style={{ backgroundColor: ott.badge }}
                                  className='keep-white flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-black text-white'
                                >
                                  {ott.short ||
                                    ott.label.slice(0, 2).toUpperCase()}
                                </span>
                                <span>{ott.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        m.items.map((it) => (
                          <Link
                            key={it.to}
                            to={it.to}
                            onClick={() => setOpenMenu(null)}
                            aria-current={
                              activeItemTo === it.to ? 'page' : undefined
                            }
                            className={`block whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                              activeItemTo === it.to
                                ? 'bg-brand/15 text-brand'
                                : isLight
                                  ? 'text-slate-800 hover:bg-amber-50 hover:text-amber-700'
                                  : 'text-zinc-200 hover:bg-brand/15 hover:text-brand'
                            }`}
                          >
                            {it.label}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Link
            to='/blogs'
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-bold transition ${
              loc.pathname.startsWith('/blogs')
                ? 'bg-brand/15 text-brand'
                : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BookOpen size={14} className='shrink-0 text-brand' />
            <span>Blogs</span>
          </Link>

          <Link
            to='/community'
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-bold transition ${
              loc.pathname.startsWith('/community')
                ? 'bg-brand/15 text-brand'
                : isLight
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <MessageSquare size={14} className='shrink-0 text-emerald-500' />
            <span>Community</span>
          </Link>
        </nav>

        {/* Fixed-Width Desktop Search Bar (`w-[220px] xl:w-[260px] shrink-0 grow-0` — NEVER changes width on click!) */}
        <form
          onSubmit={onSearch}
          className='relative hidden w-[220px] shrink-0 grow-0 lg:block xl:w-[260px]'
        >
          <Search
            size={14}
            className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400'
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search movies, actors...'
            className={`h-9 w-full rounded-full border pr-4 pl-9 text-xs transition-colors focus:border-brand focus:outline-none ${
              isLight
                ? 'border-slate-200 bg-slate-100 text-slate-900 placeholder-slate-400 focus:bg-white'
                : 'border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:bg-[#0e131f]'
            }`}
          />
        </form>

        {/* Right Controls */}
        <div className='flex shrink-0 items-center gap-1 sm:gap-2'>
          {/* Mobile Search Button */}
          <button
            type='button'
            onClick={() => setMobileSearchOpen((v) => !v)}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border lg:hidden ${
              isLight
                ? 'border-slate-200 bg-slate-100 text-slate-700'
                : 'border-white/10 bg-white/5 text-zinc-200'
            }`}
            aria-label='Search'
          >
            {mobileSearchOpen ? <X size={15} /> : <Search size={15} />}
          </button>

          {/* Region & Rupees/USD Toggle Pill */}
          <button
            type='button'
            onClick={() =>
              dispatch(setRegionAndCurrency(region === 'IN' ? 'GLOBAL' : 'IN'))
            }
            title='Switch Region & Currency (India ₹ INR / Global $ USD)'
            className={`flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-extrabold transition ${
              isLight
                ? 'border-slate-200 bg-slate-100 text-slate-800 hover:border-brand'
                : 'border-white/10 bg-white/5 text-zinc-200 hover:border-brand/50'
            }`}
          >
            <span>{region === 'IN' ? '🇮🇳' : '🌍'}</span>
            <span className='hidden min-[420px]:inline'>
              {region === 'IN' ? '₹ INR' : '$ USD'}
            </span>
          </button>

          {/* Taste Preferences Trigger */}
          <button
            type='button'
            onClick={() => dispatch(openPreferenceModal())}
            title='Customize Taste & Region'
            className='flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brand/40 bg-brand/15 px-2.5 text-[11px] font-extrabold text-brand hover:bg-brand/25'
          >
            <SlidersHorizontal size={13} />
            <span className='hidden md:inline'>Taste</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type='button'
            onClick={() => dispatch(toggleTheme())}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
              isLight
                ? 'border-slate-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'border-white/10 bg-white/5 text-brand hover:bg-white/10'
            }`}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Admin / SuperAdmin Studio Button */}
          {isStaff && (
            <Link
              to='/admin'
              className='hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-brand to-amber-500 px-3 py-1.5 text-xs font-extrabold text-black shadow-sm hover:brightness-110 xl:flex'
            >
              <Shield size={13} />
              <span>
                {user.role === ROLES.SUPERADMIN ? 'SuperAdmin' : 'Admin'} Studio
              </span>
            </Link>
          )}

          {/* User Profile Menu or Compact Auth Buttons */}
          {user ? (
            <div ref={profileRef} className='relative shrink-0'>
              <button
                type='button'
                onClick={() => setProfileOpen((v) => !v)}
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border p-0.5 pr-1.5 text-xs font-bold sm:gap-1.5 sm:p-1 sm:pr-2 ${
                  isLight
                    ? 'border-slate-200 bg-slate-100 text-slate-900'
                    : 'border-white/10 bg-white/5 text-white'
                }`}
              >
                <span
                  style={{ backgroundColor: user.avatarColor || '#f5b942' }}
                  className='keep-white flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white'
                >
                  {(user.name || 'U')[0].toUpperCase()}
                </span>
                <span className='hidden max-w-[80px] truncate sm:inline'>
                  {user.name}
                </span>
                <ChevronDown size={12} className='shrink-0 text-zinc-400' />
              </button>

              {profileOpen && (
                <div
                  style={{
                    backgroundColor: isLight ? '#ffffff' : '#0b101b',
                  }}
                  className={`absolute right-0 z-[210] mt-2 w-60 rounded-2xl border p-2 shadow-[0_24px_60px_rgba(0,0,0,0.65)] ${
                    isLight
                      ? 'border-slate-200 bg-white text-slate-900'
                      : 'border-white/15 bg-[#0b101b] text-white'
                  }`}
                >
                  <div
                    className={`mb-1.5 border-b px-3 py-2 ${isLight ? 'border-slate-200' : 'border-white/10'}`}
                  >
                    <p className='truncate text-xs font-extrabold'>
                      {user.name}
                    </p>
                    <p
                      className={`truncate text-[11px] ${isLight ? 'text-slate-500' : 'text-zinc-400'}`}
                    >
                      {user.email}
                    </p>
                    <span className='mt-1 inline-block rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-brand uppercase'>
                      {user.role}
                    </span>
                  </div>

                  {isStaff && (
                    <Link
                      to='/admin'
                      className='flex items-center gap-2.5 rounded-xl bg-brand/15 px-3 py-2 text-xs font-extrabold text-brand hover:bg-brand/25'
                    >
                      <Shield size={14} />
                      Open{' '}
                      {user.role === ROLES.SUPERADMIN
                        ? 'SuperAdmin'
                        : 'Admin'}{' '}
                      Studio
                    </Link>
                  )}

                  <Link
                    to={ROUTES.PROFILE}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                      isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <User size={14} /> Profile & Settings
                  </Link>
                  <Link
                    to={ROUTES.WATCHLIST}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                      isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <Bookmark size={14} /> My Watchlist
                  </Link>
                  <Link
                    to='/ott'
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold ${
                      isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <Tv size={14} /> Master OTT Page
                  </Link>
                  <button
                    type='button'
                    onClick={() => {
                      setProfileOpen(false);
                      dispatch(openPreferenceModal());
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                      isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <Sparkles size={14} className='text-brand' /> Taste &
                    Region ({currency})
                  </button>
                  <button
                    type='button'
                    onClick={() => {
                      setProfileOpen(false);
                      dispatch(openLogoutModal());
                    }}
                    className={`mt-1 flex w-full items-center gap-2.5 rounded-xl border-t px-3 py-2 text-left text-xs font-extrabold text-rose-500 hover:bg-rose-500/10 ${
                      isLight ? 'border-slate-200' : 'border-white/10'
                    }`}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className='flex shrink-0 items-center gap-1'>
              <Link
                to={ROUTES.LOGIN}
                className='whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-bold hover:bg-white/10'
              >
                Log in
              </Link>
              <Link
                to={ROUTES.SIGNUP}
                className='whitespace-nowrap rounded-full bg-brand px-3 py-1.5 text-xs font-extrabold text-black shadow-xs hover:brightness-110'
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Drawer */}
      {mobileSearchOpen && (
        <div
          className={`border-t px-3 py-2.5 lg:hidden ${
            isLight
              ? 'border-slate-200 bg-slate-50'
              : 'border-white/10 bg-[#0e131f]'
          }`}
        >
          <form onSubmit={onSearch} className='relative'>
            <Search
              size={15}
              className='absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-400'
            />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search movies, web series, actors...'
              className={`w-full rounded-full border py-2 pr-4 pl-9 text-xs focus:border-brand focus:outline-none ${
                isLight
                  ? 'border-slate-300 bg-white text-slate-900'
                  : 'border-white/15 bg-white/5 text-white'
              }`}
            />
          </form>
        </div>
      )}
    </header>
  );
}
