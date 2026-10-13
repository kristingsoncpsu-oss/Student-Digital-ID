import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CreditCard, LayoutDashboard, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import Brand from '@/components/ui/Brand';
import { Alert } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn, initials } from '@/lib/utils';
import api, { parseError } from '@/lib/api';

const NAV = [
    { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/portal/profile', label: 'My information', icon: UserRound },
    { to: '/portal/id', label: 'Digital ID', icon: CreditCard },
    { to: '/portal/security', label: 'Security', icon: ShieldCheck },
];

export default function StudentShell() {
    const { user, logout, refresh } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [sending, setSending] = useState(false);

    const resend = async () => {
        setSending(true);
        try {
            const { data } = await api.post('/email/verification-notification');
            toast.success(data.message);
            refresh();
        } catch (e) {
            toast.error(parseError(e).message);
        } finally {
            setSending(false);
        }
    };

    const signOut = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-paper">
            <header className="no-print sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
                    <Brand to="/portal" />

                    <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Student portal">
                        {NAV.map(({ to, label, icon: Icon, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition',
                                        isActive ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-navy-50 hover:text-navy-900',
                                    )
                                }
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="ml-auto flex items-center gap-3">
                        <div className="hidden items-center gap-2.5 sm:flex">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                                {initials(user.name)}
                            </span>
                            <span className="max-w-[160px] truncate text-sm font-semibold text-ink">{user.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" icon={LogOut} onClick={signOut} className="hidden sm:inline-flex">
                            Log out
                        </Button>
                        <button className="rounded-md p-2 text-navy-800 hover:bg-navy-50 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
                            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {open && (
                    <nav className="border-t border-line bg-white px-4 py-3 md:hidden" aria-label="Student portal">
                        {NAV.map(({ to, label, icon: Icon, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    cn('flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold', isActive ? 'bg-navy-50 text-navy-900' : 'text-slate-600')
                                }
                            >
                                <Icon className="h-4.5 w-4.5" size={18} />
                                {label}
                            </NavLink>
                        ))}
                        <button onClick={signOut} className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-rose-700">
                            <LogOut size={18} /> Log out
                        </button>
                    </nav>
                )}
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                {!user.email_verified && (
                    <Alert
                        tone="warning"
                        title="Verify your email address"
                        className="no-print mb-6"
                        action={
                            <Button size="sm" variant="secondary" loading={sending} onClick={resend}>
                                Resend link
                            </Button>
                        }
                    >
                        We sent a verification link to <strong>{user.email}</strong>. Submitting information and accessing your ID unlock after you verify.
                    </Alert>
                )}
                <Outlet />
            </main>
        </div>
    );
}
