import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Menu, Phone, X } from 'lucide-react';
import Brand from '@/components/ui/Brand';
import { homeFor, useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils';

const LINKS = [
    ['Home', '#top'],
    ['Features', '#features'],
    ['How It Works', '#how-it-works'],
    ['About', '#about'],
];
  
export function Nav() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-50 border-b transition-colors',
                scrolled || open ? 'border-white/10 bg-navy-950/95 backdrop-blur' : 'border-transparent bg-navy-950',
            )}
        >
            <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
                <Brand tone="light" />

                <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
                    {LINKS.map(([label, href]) => (
                        <a key={label} href={href} className="rounded-md px-3.5 py-2 text-sm font-medium text-navy-100 transition hover:bg-white/5 hover:text-white">
                            {label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-2 lg:flex">
                    {user ? (
                        <Link to={homeFor(user)} className="btn bg-teal-500 text-white hover:bg-teal-400">
                            Open dashboard <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="btn text-white hover:bg-white/10">
                                Log In
                            </Link>
                            <Link to="/register" className="btn bg-white text-navy-950 hover:bg-navy-50">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                <button
                    className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
                    onClick={() => setOpen((o) => !o)}
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                >
                    {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {open && (
                <div id="mobile-menu" className="border-t border-white/10 px-5 pb-5 pt-3 lg:hidden">
                    <nav className="flex flex-col" aria-label="Mobile">
                        {LINKS.map(([label, href]) => (
                            <a key={label} href={href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-[15px] font-medium text-navy-100 hover:bg-white/5">
                                {label}
                            </a>
                        ))}
                    </nav>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {user ? (
                            <Link to={homeFor(user)} className="btn col-span-2 bg-teal-500 text-white">
                                Open dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn border border-white/20 text-white">
                                    Log In
                                </Link>
                                <Link to="/register" className="btn bg-white text-navy-950">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export function Footer() {
    const s = useSettings();

    return (
        <footer className="bg-navy-950 text-navy-200">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                    <Brand tone="light" />
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-300">
                        The student identity platform of the {s.department_name}, {s.institution_name}. Submit your information,
                        get verified by authorized staff, and carry a digital ID that can be checked in seconds.
                    </p>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Navigate</h3>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        {LINKS.map(([label, href]) => (
                            <li key={label}>
                                <a href={href} className="hover:text-white">
                                    {label}
                                </a>
                            </li>
                        ))}
                        <li>
                            <Link to="/login" className="hover:text-white">
                                Log In
                            </Link>
                        </li>
                        <li>
                            <Link to="/register" className="hover:text-white">
                                Create account
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Help & contact</h3>
                    <ul className="mt-4 space-y-3 text-sm">
                        <li className="flex items-start gap-2.5">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                            <span className="break-all">{s.support_email || 'registrar@your-school.edu'}</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                            <span>{s.support_phone || '+00 000 000 0000'}</span>
                        </li>
                        <li className="text-navy-400"></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white">Legal</h3>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        <li>
                            <Link to="/privacy" className="hover:text-white">
                                Privacy Policy
                            </Link>
                        </li>
                        <li>
                            <Link to="/terms" className="hover:text-white">
                                Terms of Use
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-navy-400 sm:flex-row sm:justify-between sm:px-8">
                    <p>
                        {s.institution_name} · {s.department_name}. For CCIT-01 project use only.
                    </p>
                    <p>Student Digital ID Management System</p>
                </div>
            </div>
        </footer>
    );
}
