import { Suspense, lazy } from 'react';
import { Link, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ToastProvider } from '@/context/ToastContext';
import { GuestOnly, RequireAdmin, RequireAuth } from '@/components/RouteGuards';
import { PageLoader } from '@/components/ui/Feedback';
import StudentShell from '@/layouts/StudentShell';
import StaffShell from '@/layouts/StaffShell';

import Landing from '@/pages/landing/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import VerifyPage from '@/pages/VerifyPage';
import LegalPage from '@/pages/LegalPage';

// Authenticated areas are code-split so the public site stays light.
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const StudentProfile = lazy(() => import('@/pages/student/Profile'));
const StudentDigitalId = lazy(() => import('@/pages/student/DigitalId'));
const Security = lazy(() => import('@/pages/student/Security'));

const Overview = lazy(() => import('@/pages/admin/Overview'));
const Students = lazy(() => import('@/pages/admin/Students'));
const StudentDetail = lazy(() => import('@/pages/admin/StudentDetail'));
const StudentEdit = lazy(() => import('@/pages/admin/StudentEdit'));
const Applications = lazy(() => import('@/pages/admin/Applications'));
const ApplicationReview = lazy(() => import('@/pages/admin/ApplicationReview'));
const DigitalIds = lazy(() => import('@/pages/admin/DigitalIds'));
const Staff = lazy(() => import('@/pages/admin/Staff'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));
const Settings = lazy(() => import('@/pages/admin/Settings'));

function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
            <p className="eyebrow">404</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Page not found</h1>
            <p className="mt-2 text-slate-600">The page you’re looking for doesn’t exist or has moved.</p>
            <Link to="/" className="btn-primary mt-6">
                Back to home
            </Link>
        </div>
    );
}

function Root() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Outlet />
        </Suspense>
    );
}

const router = createBrowserRouter([
    {
        element: <Root />,
        children: [
            { path: '/', element: <Landing /> },
            { path: '/verify/:token', element: <VerifyPage /> },
            { path: '/privacy', element: <LegalPage kind="privacy" /> },
            { path: '/terms', element: <LegalPage kind="terms" /> },
            { path: '/verify-email', element: <VerifyEmail /> },

            {
                element: <GuestOnly />,
                children: [
                    { path: '/login', element: <Login /> },
                    { path: '/register', element: <Register /> },
                    { path: '/forgot-password', element: <ForgotPassword /> },
                    { path: '/reset-password', element: <ResetPassword /> },
                ],
            },

            {
                element: <RequireAuth roles={['student']} />,
                children: [
                    {
                        path: '/portal',
                        element: <StudentShell />,
                        children: [
                            { index: true, element: <StudentDashboard /> },
                            { path: 'profile', element: <StudentProfile /> },
                            { path: 'id', element: <StudentDigitalId /> },
                            { path: 'security', element: <Security /> },
                        ],
                    },
                ],
            },

            {
                element: <RequireAuth roles={['staff', 'admin']} />,
                children: [
                    {
                        path: '/admin',
                        element: <StaffShell />,
                        children: [
                            { index: true, element: <Overview /> },
                            { path: 'students', element: <Students /> },
                            { path: 'students/new', element: <StudentEdit /> },
                            { path: 'students/:id', element: <StudentDetail /> },
                            { path: 'students/:id/edit', element: <StudentEdit /> },
                            { path: 'applications', element: <Applications /> },
                            { path: 'applications/:id', element: <ApplicationReview /> },
                            { path: 'ids', element: <DigitalIds /> },
                            { path: 'audit', element: <AuditLogs /> },
                            { path: 'security', element: <Security /> },
                            {
                                element: <RequireAdmin />,
                                children: [
                                    { path: 'staff', element: <Staff /> },
                                    { path: 'settings', element: <Settings /> },
                                ],
                            },
                        ],
                    },
                ],
            },

            { path: '*', element: <NotFound /> },
        ],
    },
]);

export default function App() {
    return (
        <SettingsProvider>
            <ToastProvider>
                <AuthProvider>
                    <RouterProvider router={router} />
                </AuthProvider>
            </ToastProvider>
        </SettingsProvider>
    );
}
