import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Ban,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    CreditCard,
    Database,
    EyeOff,
    FileCheck2,
    History,
    IdCard,
    Lock,
    LockKeyhole,
    QrCode,
    ShieldCheck,
    UserPlus,
    UserRoundCheck,
    UserRoundCog,
} from 'lucide-react';
import DigitalIdCard from '@/components/id/DigitalIdCard';
import { Pill } from '@/components/ui/Badge';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils';
import { SAMPLE_DIGITAL_ID, SAMPLE_STUDENT, SAMPLE_VERIFY_URL } from './sampleData';

/* ------------------------------------------------------------------ Features */

export function Features() {
    return (
        <section id="features" className="bg-paper py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-end">
                    <div>
                        <p className="eyebrow">Features</p>
                        <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
                            Everything an ID office needs, in one record of truth.
                        </h2>
                    </div>
                    <p className="max-w-xl text-[17px] leading-relaxed text-slate-600">
                        Students manage their own details. Registrars verify and approve. The digital ID always reflects what the school’s
                        records say right now.
                    </p>
                </div>

                <div className="mt-12 grid gap-5 lg:grid-cols-12">
                    {/* Large: digital ID */}
                    <article className="relative overflow-hidden rounded-xl bg-navy-900 p-7 text-white lg:col-span-7 sm:p-9">
                        <div className="bg-grid absolute inset-0 opacity-60" />
                        <div className="relative grid gap-6 sm:grid-cols-[1.1fr_0.9fr] sm:items-center">
                            <div>
                                <IdCard className="h-8 w-8 text-teal-300" />
                                <h3 className="mt-5 font-display text-2xl font-semibold">Digital Student ID</h3>
                                <p className="mt-3 text-[15px] leading-relaxed text-navy-100">
                                    A real identification card, issued only after approval — with your photo, program, student number and a
                                    QR code. Print it or show it on your phone.
                                </p>
                            </div>
                            <div className="mx-auto w-full max-w-[210px] rotate-3 rounded-xl border border-white/15 bg-white/95 p-4 text-navy-950 shadow-lift">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-12 w-10 rounded bg-navy-200" />
                                    <div className="min-w-0 space-y-1.5">
                                        <div className="h-2.5 w-24 rounded bg-navy-900" />
                                        <div className="h-2 w-16 rounded bg-navy-200" />
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2">
                                    <div className="space-y-1.5">
                                        <div className="h-2 w-full rounded bg-navy-100" />
                                        <div className="h-2 w-3/4 rounded bg-navy-100" />
                                    </div>
                                    <QrCode className="h-11 w-11 text-navy-900" strokeWidth={1.4} />
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* QR verification */}
                    <article className="rounded-xl border border-line bg-white p-7 shadow-card lg:col-span-5 sm:p-9">
                        <div className="flex items-start justify-between">
                            <QrCode className="h-8 w-8 text-teal-600" />
                            <Pill tone="emerald">Live status</Pill>
                        </div>
                        <h3 className="mt-5 font-display text-2xl font-semibold text-ink">QR-Based ID Verification</h3>
                        <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                            Scanning opens a verification page that reads the current status from the server. A suspended or revoked ID
                            fails immediately, even if the QR was generated earlier.
                        </p>
                        <ul className="mt-5 space-y-2 text-sm text-slate-700">
                            {['Random, non-guessable code', 'Minimal details shown to verifiers', 'Rate-limited public endpoint'].map((t) => (
                                <li key={t} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-teal-600" /> {t}
                                </li>
                            ))}
                        </ul>
                    </article>

                    {/* Ledger row */}
                    <div className="grid divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-card sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:col-span-12">
                        {[
                            [LockKeyhole, 'Secure Student Profiles', 'Profiles are private to the student and authorized staff. Protected fields can only change through a correction request.'],
                            [FileCheck2, 'Student Information Management', 'Submit your details once, keep contact information current, and track your application status at any time.'],
                            [ClipboardCheck, 'Application Approval', 'Registrars review each submission, record notes, and approve or reject with a reason you can read.'],
                        ].map(([Icon, title, text], i) => (
                            <article key={title} className="p-7">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs font-medium text-slate-400">0{i + 3}</span>
                                    <Icon className="h-5 w-5 text-navy-700" />
                                </div>
                                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                            </article>
                        ))}
                    </div>

                    {/* Wide: records */}
                    <article className="overflow-hidden rounded-xl border border-line bg-white shadow-card lg:col-span-12">
                        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                            <div className="p-7 sm:p-9">
                                <Database className="h-8 w-8 text-navy-700" />
                                <h3 className="mt-5 font-display text-2xl font-semibold text-ink">Centralized Student Records</h3>
                                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                                    One directory for the registrar: search by name or number, filter by program, year level and ID status, and
                                    see every change in the audit trail. Records are archived, never silently deleted.
                                </p>
                            </div>
                            <div className="border-t border-line bg-slate-50 p-5 lg:border-l lg:border-t-0">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Sample data · fictional</p>
                                <div className="overflow-hidden rounded-lg border border-line bg-white text-sm">
                                    {[
                                        ['DEMO-2026-0001', 'Alden Abello', 'BSIT', 'emerald', 'Approved'],
                                        ['DEMO-2026-0002', 'Bianca Bautista', 'BSCS', 'amber', 'Pending review'],
                                        ['DEMO-2026-0004', 'Dana Dizon', 'BSIS', 'orange', 'Suspended'],
                                    ].map(([num, name, prog, tone, label]) => (
                                        <div key={num} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-0 sm:grid-cols-[130px_1fr_60px_auto]">
                                            <span className="hidden font-mono text-xs text-slate-500 sm:block">{num}</span>
                                            <span className="truncate font-semibold text-ink">{name}</span>
                                            <span className="hidden text-xs text-slate-500 sm:block">{prog}</span>
                                            <Pill tone={tone}>{label}</Pill>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------- How it works */

const STEPS = [
    [UserPlus, 'Create an account', 'Register with your name and email, then verify your address.'],
    [FileCheck2, 'Submit student information', 'Fill in your student number, program and year level, and add a photo.'],
    [UserRoundCheck, 'Wait for staff verification', 'A registrar checks your details against school records.'],
    [CreditCard, 'Access your digital ID', 'Once approved, your ID and QR code are ready to show or print.'],
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="bg-white py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <div className="max-w-2xl">
                    <p className="eyebrow">How it works</p>
                    <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
                        From sign-up to a verified ID in four steps.
                    </h2>
                </div>

                <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
                    <div className="absolute left-[27px] top-4 hidden h-[calc(100%-2rem)] w-px bg-line max-md:block" />
                    <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-navy-200 to-transparent md:block" />

                    {STEPS.map(([Icon, title, text], i) => (
                        <li key={title} className="relative flex gap-5 md:block">
                            <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-navy-900 bg-white font-display text-xl font-semibold text-navy-900">
                                {i + 1}
                            </span>
                            <div className="md:mt-6">
                                <Icon className="hidden h-6 w-6 text-teal-600 md:block" />
                                <h3 className="font-display text-lg font-semibold text-ink md:mt-3">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------ ID showcase / about */

export function Showcase() {
    const s = useSettings();

    return (
        <section id="about" className="relative overflow-hidden bg-paper py-20 sm:py-28">
            <div className="bg-dots-light absolute inset-0 opacity-60" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
                <div className="mx-auto">
                    <DigitalIdCard
                        student={SAMPLE_STUDENT}
                        institution={s}
                        status="approved"
                        digitalId={SAMPLE_DIGITAL_ID}
                        verificationUrl={SAMPLE_VERIFY_URL}
                        sample
                        scale={1}
                    />
                </div>

                <div>
                    <p className="eyebrow">About the ID</p>
                    <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
                        Built like an institutional card, not a profile page.
                    </h2>
                    <p className="mt-5 text-[17px] leading-relaxed text-slate-600">
                        {s.institution_name}’s {s.department_name} issues digital IDs from the same records the registrar maintains. Flip the sample
                        card to see the QR side.
                    </p>
                    <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                        {[
                            ['Photograph', 'Uploaded by you, reviewed by staff.'],
                            ['Identity', 'Full name, student number, program, year level.'],
                            ['Status', 'Valid, suspended or revoked — always current.'],
                            ['Validity', 'Issue date and an expiry set by your institution.'],
                        ].map(([t, d]) => (
                            <div key={t} className="border-l-2 border-teal-500 pl-4">
                                <dt className="text-sm font-bold text-ink">{t}</dt>
                                <dd className="mt-0.5 text-sm text-slate-600">{d}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------- Security & privacy */

export function Security() {
    return (
        <section id="security" className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-28">
            <div className="bg-grid absolute inset-0" />
            <div className="relative mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_1.05fr]">
                <div>
                    <p className="eyebrow !text-teal-300">Security & privacy</p>
                    <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">
                        Student data is personal data. We treat it that way.
                    </h2>
                    <ul className="mt-9 space-y-6">
                        {[
                            [UserRoundCog, 'Role-based access', 'Students see only their own record. Staff and administrators are limited by role, enforced on the server.'],
                            [EyeOff, 'Minimal public verification', 'A scan reveals only whether the ID is valid and a masked identity — never contact details or addresses.'],
                            [History, 'Auditable actions', 'Approvals, suspensions and edits are recorded with who did it and when.'],
                            [Lock, 'Private photographs', 'Photos are stored privately and delivered only to the owner and authorized staff.'],
                        ].map(([Icon, title, text]) => (
                            <li key={title} className="flex gap-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <div>
                                    <h3 className="font-semibold">{title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-navy-200">{text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="self-center">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900/80 shadow-lift">
                        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                            <ShieldCheck className="h-4 w-4 text-teal-300" />
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-200">What a verifier sees</p>
                        </div>
                        <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                            <div className="bg-navy-900 p-5">
                                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4" /> Shown
                                </p>
                                <ul className="space-y-2 font-mono text-[13px] text-navy-100">
                                    <li>valid: <span className="text-emerald-300">true</span></li>
                                    <li>name: <span className="text-teal-200">“Juan Dela Cruz”</span></li>
                                    <li>student_no: <span className="text-teal-200">“••••••0000”</span></li>
                                    <li>program: <span className="text-teal-200">“BS IT”</span></li>
                                    <li>status: <span className="text-teal-200">“active”</span></li>
                                </ul>
                            </div>
                            <div className="bg-navy-900 p-5">
                                <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                                    <Ban className="h-4 w-4" /> Never exposed
                                </p>
                                <ul className="space-y-2 font-mono text-[13px] text-navy-400 line-through decoration-navy-600">
                                    <li>contact_number</li>
                                    <li>home_address</li>
                                    <li>school_email</li>
                                    <li>review_notes</li>
                                    <li>database ids</li>
                                </ul>
                            </div>
                        </div>
                        <p className="border-t border-white/10 px-5 py-3 text-xs text-navy-300">
                            Suspended and revoked IDs return only “not valid” — no personal details at all.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------------ FAQ */

const FAQS = [
    ['Who can register?', 'Any student can create an account with their name and email. Registrar and administrator accounts are created by an administrator — they can never be created through public sign-up.'],
    ['Why do I need to verify my email?', 'Verification confirms that the address is yours. Until you verify, you can log in but cannot submit information or view an ID.'],
    ['How long does approval take?', 'That depends on your registrar’s office. You can follow your application status on your dashboard, and a rejection always includes a reason so you can fix it and resubmit.'],
    ['Can I change my name or program after approval?', 'Contact details can be edited directly. Details verified by the registrar are protected; use the correction request form and staff will review it.'],
    ['What happens if my ID is suspended?', 'The ID card shows a suspended state and its QR code stops verifying right away. Contact the registrar to resolve the reason.'],
    ['What can someone learn by scanning my QR code?', 'Only whether the ID is valid and a minimal identity (name and a masked student number, depending on school policy). Never your contact details or address.'],
];

export function Faq() {
    const [open, setOpen] = useState(0);

    return (
        <section id="faq" className="bg-white py-20 sm:py-28">
            <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                    <p className="eyebrow">FAQ</p>
                    <h2 className="mt-3 font-display text-[34px] font-semibold leading-tight tracking-tight text-ink sm:text-[42px]">
                        Questions, answered.
                    </h2>
                    <p className="mt-4 text-slate-600">Can’t find what you need? Contact the registrar’s office using the details in the footer.</p>
                </div>

                <div className="divide-y divide-line border-y border-line">
                    {FAQS.map(([q, a], i) => {
                        const isOpen = open === i;
                        return (
                            <div key={q}>
                                <h3>
                                    <button
                                        className="flex w-full items-center justify-between gap-4 py-5 text-left"
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-${i}`}
                                        onClick={() => setOpen(isOpen ? -1 : i)}
                                    >
                                        <span className="font-display text-[17px] font-semibold text-ink">{q}</span>
                                        <ChevronDown className={cn('h-5 w-5 shrink-0 text-navy-500 transition-transform', isOpen && 'rotate-180')} />
                                    </button>
                                </h3>
                                <div id={`faq-${i}`} hidden={!isOpen} className="pb-5 pr-9 text-[15px] leading-relaxed text-slate-600">
                                    {a}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------ Final CTA */

export function FinalCta() {
    return (
        <section className="bg-paper px-5 py-16 sm:px-8 sm:py-24">
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-navy-900 px-7 py-14 text-center text-white sm:px-14 sm:py-20">
                <div className="bg-grid absolute inset-0" />
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />
                <div className="relative mx-auto max-w-2xl">
                    <h2 className="font-display text-[34px] font-semibold leading-tight tracking-tight sm:text-[44px]">
                        Ready to get your digital student ID?
                    </h2>
                    <p className="mt-4 text-[17px] text-navy-100">Create your account, submit your information, and get verified by the registrar.</p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link to="/register" className="btn btn-lg bg-white text-navy-950 hover:bg-navy-50">
                            Create your account <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link to="/login" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                            I already have an account
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
