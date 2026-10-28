import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROLES, ROUTES } from './config/constants';
import { restoreSession, syncUserFromStorage } from './store/authSlice';
import { readSavedUser } from './services/backendApi';
import { registerRoutesFromReactTree } from './utils/sitemapGenerator';

import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import PreferenceModal from './components/PreferenceModal';
import { GlobalStatusPatch, AppErrorBoundary } from './components/ui/InfoPatch';
import LogoutConfirmModal from './components/LogoutConfirmModal';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

import Home from './pages/Home';
import Browse from './pages/Browse';
import OttHub from './pages/OttHub';
import Details from './pages/Details';
import Person from './pages/Person';
import Blogs from './pages/Blogs';
import BlogDetail from './pages/BlogDetail';
import Community from './pages/Community';
import Sitemap from './pages/Sitemap';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Define user routes JSX once so `registerRoutesFromReactTree` automatically indexes
// any new <Route> added here in the future without manual sitemap edits!
const userRoutesTree = (
  <>
    <Route path={ROUTES.HOME} element={<Home />} />
    <Route path={ROUTES.OTT_HUB} element={<OttHub />} />
    <Route path={ROUTES.OTT_HUB_LEGACY} element={<OttHub />} />
    <Route path={ROUTES.OTT_PROVIDER} element={<OttHub />} />
    <Route path={ROUTES.BROWSE_ROOT} element={<Browse />} />
    <Route path={ROUTES.BROWSE} element={<Browse />} />
    <Route path={ROUTES.MOVIES_CATALOG} element={<Browse />} />
    <Route path={ROUTES.WEB_SERIES_CATALOG} element={<Browse />} />
    <Route path={ROUTES.TV_SHOWS_CATALOG} element={<Browse />} />
    <Route path={ROUTES.TV_SERIES_CATALOG} element={<Browse />} />
    <Route path={ROUTES.MOVIE_DETAIL} element={<Details />} />
    <Route path={ROUTES.WEB_SERIES_DETAIL} element={<Details />} />
    <Route path={ROUTES.TV_SHOW_DETAIL} element={<Details />} />
    <Route path='/tv-shows/:id' element={<Details />} />
    <Route path={ROUTES.TV_SERIES_DETAIL} element={<Details />} />
    <Route path={ROUTES.DETAILS} element={<Details />} />
    <Route path={ROUTES.DETAILS_LEGACY} element={<Details />} />
    <Route path={ROUTES.ACTOR} element={<Person />} />
    <Route path={ROUTES.ACTORESS} element={<Person />} />
    <Route path={ROUTES.ACTRESS} element={<Person />} />
    <Route path={ROUTES.PERSON} element={<Person />} />
    <Route path={ROUTES.BLOGS} element={<Blogs />} />
    <Route path={ROUTES.BLOG_DETAIL} element={<BlogDetail />} />
    <Route path={ROUTES.COMMUNITY} element={<Community />} />
    <Route
      path={ROUTES.SITEMAP}
      element={
        <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPERADMIN]}>
          <Sitemap />
        </ProtectedRoute>
      }
    />
    <Route path={ROUTES.SITEMAP_XML} element={<Sitemap xmlMode />} />
    <Route path={ROUTES.LOGIN} element={<Auth mode='login' />} />
    <Route path={ROUTES.SIGNUP} element={<Auth mode='signup' />} />
    <Route
      path={ROUTES.PROFILE}
      element={
        <ProtectedRoute>
          <Profile defaultTab='overview' />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.WATCHLIST}
      element={
        <ProtectedRoute>
          <Profile defaultTab='watchlist' />
        </ProtectedRoute>
      }
    />
  </>
);

// Automatically scan and register all <Route> paths from userRoutesTree into the Sitemap Engine
registerRoutesFromReactTree(userRoutesTree);

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.theme.mode);
  const { pathname } = useLocation();

  useEffect(() => {
    dispatch(restoreSession());

    const checkLocalUserStorage = () => {
      if (!readSavedUser()) {
        dispatch(syncUserFromStorage());
      }
    };

    window.addEventListener('focus', checkLocalUserStorage);
    document.addEventListener('visibilitychange', checkLocalUserStorage);
    return () => {
      window.removeEventListener('focus', checkLocalUserStorage);
      document.removeEventListener('visibilitychange', checkLocalUserStorage);
    };
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const isAdminStudioRoute = pathname.startsWith('/admin');

  if (isAdminStudioRoute) {
    return (
      <div className='min-h-screen w-full max-w-[100vw] overflow-x-clip bg-slate-50 dark:bg-[#070a10] text-[#1b2230] dark:text-white'>
        <GlobalStatusPatch />
        <LogoutConfirmModal />
        <AppErrorBoundary>
          <Routes>
            <Route
              path='/admin/*'
              element={
                <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPERADMIN]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppErrorBoundary>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip bg-[#070a10] pb-16 text-white lg:pb-0'>
      <Navbar />
      <PreferenceModal />
      <GlobalStatusPatch />
      <LogoutConfirmModal />

      <main className='min-h-screen flex-1'>
        <AppErrorBoundary>
          <Routes>{userRoutesTree}</Routes>
        </AppErrorBoundary>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
