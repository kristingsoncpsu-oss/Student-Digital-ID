import { Link } from 'react-router-dom';
import { Fingerprint, Lock, QrCode } from 'lucide-react';
import Brand from '@/components/ui/Brand';
import { useSettings } from '@/context/SettingsContext';

export default function AuthLayout({ title, subtitle, children, footer }) {
    const s = useSettings();

    return (
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            {/* Brand panel */}
            <aside className="relative hidden overflow-hidden bg-navy-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div className="bg-grid absolute inset-0" />
                <div className="absolute -bottom-40 -left-24 h-[460px] w-[460px] rounded-full border border-white/10" />
                <div className="absolute -bottom-24 -left-8 h-[300px] w-[300px] rounded-full border border-white/10" />

                <Brand tone="light" className="relative" />

                <div className="relative max-w-md">
                    <p className="eyebrow !text-teal-300">{s.department_name}</p>
                    <h2 className="mt-4 font-display text-[40px] font-semibold leading-[1.1] tracking-tight">
                        One identity.
                        <br />
                        Verified at the source.
                    </h2>
                    <ul className="mt-8 space-y-4 text-sm text-navy-100">
                        {[
                            [Fingerprint, 'Your records are reviewed and approved by authorized staff.'],
                            [QrCode, 'Your QR code is checked live, so a suspended ID can’t pass as valid.'],
                            [Lock, 'Only the minimum information is ever shown to a verifier.'],
                        ].map(([Icon, text]) => (
                            <li key={text} className="flex gap-3">
                                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-navy-300">
                    {s.institution_name} · {s.campus_note}
                </p>
            </aside>

            {/* Form */}
            <main className="flex flex-col bg-paper">
                <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3.5 lg:hidden">
                    <Brand />
                </div>
                <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
                    <div className="w-full max-w-[420px] animate-fade-up">
                        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
                        {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
                        <div className="mt-7">{children}</div>
                        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
                    </div>
                </div>
                <p className="px-5 pb-6 text-center text-xs text-slate-400">
                    <Link to="/" className="hover:text-navy-700">
                        ← Back to home
                    </Link>
                </p>
            </main>
        </div>
    );
}
