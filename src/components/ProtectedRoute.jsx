import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../config/constants';

export default function ProtectedRoute({ children, roles }) {
  const { user, initializing } = useSelector((s) => s.auth);

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
