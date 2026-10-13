import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/Feedback';

/** Requires a logged-in user, optionally restricted to roles. Client-side convenience only; the API enforces access. */
export function RequireAuth({ roles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <PageLoader label="Checking your session…" />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;

    return <Outlet />;
}

/** Login / register pages: bounce authenticated users to their home. */
export function GuestOnly() {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (user) return <Navigate to={homeFor(user)} replace />;
    return <Outlet />;
}

export function RequireAdmin() {
    const { user } = useAuth();
    if (user?.role !== 'admin') return <Navigate to="/admin" replace />;
    return <Outlet />;
}
