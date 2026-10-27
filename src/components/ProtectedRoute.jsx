import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../config/constants';
import { notifyPatch } from '../utils/notify';
import {
  AdminShellSkeleton,
  SitemapSkeleton,
  ProfileSkeleton,
} from './ui/Skeletons';

export default function ProtectedRoute({ children, roles }) {
  const { user, initializing } = useSelector((s) => s.auth);
  const { pathname } = useLocation();

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      notifyPatch({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to access this page.',
      });
    } else if (roles && !roles.includes(user.role)) {
      notifyPatch({
        type: 'error',
        title: 'Access Restricted',
        message: 'Your account role does not have permission to view that section.',
      });
    }
  }, [initializing, user, roles]);

  if (initializing) {
    if (pathname.startsWith('/admin')) return <AdminShellSkeleton />;
    if (pathname.startsWith('/sitemap')) return <SitemapSkeleton />;
    return <ProfileSkeleton />;
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROUTES.HOME} replace />;
  return children;
}
