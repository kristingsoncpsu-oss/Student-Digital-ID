import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ScanLine, ShieldCheck, UserCheck } from 'lucide-react';
import { CardBack, CardFront } from '@/components/id/DigitalIdCard';
import { useSettings } from '@/context/SettingsContext';
import { SAMPLE_DIGITAL_ID, SAMPLE_STUDENT, SAMPLE_VERIFY_URL } from './sampleData';

export default function Hero() {
    const s = useSettings();

    return (
        <section id="top" className="relative overflow-hidden bg-navy-950 text-white">
            <div className="bg-grid absolute inset-0" />
            <div className="pointer-events-none absolute -right-40 top-10 h-[620px] w-[620px] rounded-full bg-teal-500/20 blur-[120px]" />
            <div className="pointer-events-none absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-navy-600/30 blur-[100px]" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
                <div className="animate-fade-up">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                        {s.institution_short} · {s.department_name}
                    </p>

                    <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.04] tracking-tight sm:text-[58px] lg:text-[66px]">
                        Your Student Identity, <span className="italic text-teal-300">Digitally</span> Connected.
                    </h1>

                    <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-navy-100">
                        A secure and convenient way to manage your student information, access your digital identification, and verify your student identity.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                        <Link to="/register" className="btn-lg btn bg-white text-navy-950 shadow-lift hover:bg-navy-50">
                            Get Started <ArrowRight className="h-4.5 w-4.5" size={18} />
                        </Link>
                        <a href="#features" className="btn-lg btn border border-white/25 text-white hover:bg-white/10">
                            Explore Features
                        </a>
                    </div>

                    <dl className="mt-12 grid max-w-xl grid-cols-1 gap-5 border-t border-white/10 pt-8 sm:grid-cols-3">
                        {[
                            [UserCheck, 'Staff-verified', 'Every ID is approved by a registrar.'],
                            [ScanLine, 'Live QR check', 'Status is read from the server.'],
                            [ShieldCheck, 'Private by design', 'Minimal data, role-based access.'],
                        ].map(([Icon, title, text]) => (
                            <div key={title}>
                                <dt className="flex items-center gap-2 text-sm font-semibold text-white">
                                    <Icon className="h-4 w-4 text-teal-300" /> {title}
                                </dt>
                                <dd className="mt-1 text-xs leading-relaxed text-navy-300">{text}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Composition: card back peeking behind the front, with a live-verify chip. */}
                <div className="relative mx-auto h-[500px] w-full max-w-[470px] sm:h-[560px]" aria-hidden="true">
                    <div className="absolute left-1/2 top-3 origin-top-left -translate-x-[8%] scale-[0.82] sm:scale-[0.9]" style={{ transform: 'translateX(2%) rotate(7deg) scale(0.86)' }}>
                        <CardBack
                            student={SAMPLE_STUDENT}
                            institution={s}
                            status="approved"
                            digitalId={SAMPLE_DIGITAL_ID}
                            verificationUrl={SAMPLE_VERIFY_URL}
                            sample
                            className="opacity-95"
                        />
                    </div>
                    <div className="absolute left-0 top-10 animate-float sm:left-4" style={{ transformOrigin: 'center' }}>
                        <div className="origin-top-left scale-[0.8] sm:scale-100">
                            <CardFront student={SAMPLE_STUDENT} institution={s} status="approved" digitalId={SAMPLE_DIGITAL_ID} sample />
                        </div>
                    </div>

                    <div className="absolute -bottom-2 right-0 flex items-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-navy-950 shadow-lift sm:right-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <BadgeCheck className="h-5 w-5" />
                        </span>
                        <div className="leading-tight">
                            <p className="text-[13px] font-bold">ID verified</p>
                            <p className="text-[11px] text-slate-500">Checked against live records</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
