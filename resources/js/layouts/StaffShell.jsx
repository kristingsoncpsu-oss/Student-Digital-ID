import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    BadgeCheck,
    ClipboardCheck,
    CreditCard,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    ScrollText,
    Settings,
    Users,
    X,
} from 'lucide-react';
import Brand from '@/components/ui/Brand';
import { useAuth } from '@/context/AuthContext';
import { cn, initials } from '@/lib/utils';

const NAV = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/students', label: 'Student Records', icon: GraduationCap },
    { to: '/admin/applications', label: 'ID Applications', icon: ClipboardCheck },
    { to: '/admin/ids', label: 'Digital IDs', icon: CreditCard },
    { to: '/admin/staff', label: 'Staff Management', icon: Users, adminOnly: true },
    { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

function SidebarContent({ items, user, onNavigate, onLogout }) {
    return (
        <div className="flex h-full flex-col bg-navy-950 text-white">
            <div className="border-b border-white/10 px-5 py-5">
                <Brand to="/admin" tone="light" />
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5" aria-label="Administration">
                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-navy-400">Workspace</p>
                {items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                                isActive
                                    ? 'bg-white/10 text-white shadow-[inset_3px_0_0_0_theme(colors.teal.400)]'
                                    : 'text-navy-200 hover:bg-white/5 hover:text-white',
                            )
                        }
                    >
                        <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-200">
                        {initials(user.name)}
                    </span>
                    <div className="min-w-0 leading-tight">
                        <Link to="/admin/security" onClick={onNavigate} title="Change password" className="block truncate text-sm font-semibold hover:underline">{user.name}</Link>
                        <p className="flex items-center gap-1 text-[11px] text-navy-300">
                            <BadgeCheck className="h-3 w-3 text-teal-300" /> {user.role_label}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-navy-200 hover:bg-white/5 hover:text-white"
                >
                    <LogOut className="h-4 w-4" /> Log out
                </button>
            </div>
        </div>
    );
}

export default function StaffShell() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    // Navigation is filtered for convenience only; every route is also enforced by the API.
    const items = NAV.filter((i) => !i.adminOnly || isAdmin);

    const signOut = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-paper lg:pl-64">
            <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
                <SidebarContent items={items} user={user} onLogout={signOut} />
            </aside>

            {open && (
                <div className="no-print fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-72 animate-slide-in">
                        <SidebarContent items={items} user={user} onNavigate={() => setOpen(false)} onLogout={signOut} />
                        <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded p-1.5 text-navy-200 hover:bg-white/10" aria-label="Close menu">
                            <X className="h-5 w-5" />
                        </button>
                    </aside>
                </div>
            )}

            <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
                <button onClick={() => setOpen(true)} className="rounded-md p-2 text-navy-800 hover:bg-navy-50" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                </button>
                <Brand to="/admin" compact />
                <span className="font-display text-sm font-semibold">Administration</span>
            </header>

            <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Outlet />
            </main>
        </div>
    );
}
