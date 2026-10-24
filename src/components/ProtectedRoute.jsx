import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../config/constants';
import { notifyPatch } from '../utils/notify';

export default function ProtectedRoute({ children, roles }) {
  const { user, initializing } = useSelector((s) => s.auth);

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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#f5b942] border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROUTES.HOME} replace />;
  return children;
}
