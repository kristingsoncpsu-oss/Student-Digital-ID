import { Link } from 'react-router-dom';
import {
    ArrowRight,
    CheckCircle2,
    Circle,
    Clock3,
    CreditCard,
    FilePenLine,
    Hourglass,
    KeyRound,
    MessageSquareWarning,
    OctagonX,
    PauseCircle,
    XCircle,
} from 'lucide-react';
import DigitalIdCard from '@/components/id/DigitalIdCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import useFetch from '@/hooks/useFetch';
import { cn, formatDate, STATUS, timeAgo, yearLabel } from '@/lib/utils';

const BANNER = {
    incomplete: { icon: FilePenLine, tone: 'bg-slate-100 text-slate-700', title: 'Submit your student information', text: 'Add your student details to start your ID application.' },
    pending: { icon: Hourglass, tone: 'bg-amber-50 text-amber-800', title: 'Your application is being reviewed', text: 'A registrar will verify your information. You’ll see the result here.' },
    approved: { icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-800', title: 'Your digital ID is active', text: 'Show it on your phone or print it from the Digital ID page.' },
    rejected: { icon: XCircle, tone: 'bg-rose-50 text-rose-800', title: 'Your application was not approved', text: 'Review the reason below, correct your information, and resubmit.' },
    suspended: { icon: PauseCircle, tone: 'bg-orange-50 text-orange-800', title: 'Your digital ID is suspended', text: 'Contact the registrar’s office to resolve this.' },
    revoked: { icon: OctagonX, tone: 'bg-rose-50 text-rose-800', title: 'Your digital ID was revoked', text: 'Contact the registrar’s office. You may be able to resubmit your information.' },
};

export default function Dashboard() {
    const { user } = useAuth();
    const s = useSettings();
    const { data, loading, error, reload } = useFetch('/student/dashboard', null, { enabled: user.email_verified });

    if (!user.email_verified) {
        return (
            <div className="panel mx-auto max-w-xl p-8 text-center">
                <KeyRound className="mx-auto h-10 w-10 text-amber-500" />
                <h1 className="mt-4 font-display text-2xl font-semibold">Verify your email to continue</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Your dashboard unlocks once <strong>{user.email}</strong> is verified. Use the banner above to resend the link.
                </p>
            </div>
        );
    }

    if (loading && !data) return <PageLoader />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const { status, completion, student, activity, pending_corrections: corrections } = data;
    const banner = BANNER[status];
    const BannerIcon = banner.icon;
    const app = student?.application;
    const idCard = student?.digital_id;

    const checklist = [
        ['Account created & email verified', true],
        ['Student information submitted', !!student],
        ['Photograph added', !!student?.photo_url],
        ['Verified by staff', ['approved', 'suspended', 'revoked'].includes(status)],
    ];

    return (
        <div className="animate-fade-up">
            <div className="mb-6">
                <p className="eyebrow">Student portal</p>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
                    Welcome, {user.name.split(' ')[0]}.
                </h1>
            </div>

            <div className={cn('mb-6 flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center', banner.tone)}>
                <BannerIcon className="h-8 w-8 shrink-0" />
                <div className="flex-1">
                    <p className="font-display text-lg font-semibold">{banner.title}</p>
                    <p className="text-sm opacity-90">{banner.text}</p>
                </div>
                {status === 'incomplete' && (
                    <Link to="/portal/profile" className="btn-primary shrink-0">
                        Start now <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
                {(status === 'rejected' || status === 'revoked') && (
                    <Link to="/portal/profile" className="btn-primary shrink-0">
                        Update & resubmit
                    </Link>
                )}
                {status === 'approved' && (
                    <Link to="/portal/id" className="btn-primary shrink-0">
                        <CreditCard className="h-4 w-4" /> View my ID
                    </Link>
                )}
            </div>

            {status === 'rejected' && app?.rejection_reason && (
                <Alert tone="error" title="Reason from the registrar" className="mb-6">
                    {app.rejection_reason}
                    {app.reviewed_at && <span className="mt-1 block text-xs opacity-75">Reviewed {formatDate(app.reviewed_at)}</span>}
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    {/* Status + completion */}
                    <section className="panel p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="font-display text-lg font-semibold">Application status</h2>
                            <StatusBadge status={status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{STATUS[status].hint}</p>

                        <div className="mt-6">
                            <div className="mb-2 flex items-baseline justify-between text-sm">
                                <span className="font-semibold text-navy-800">Profile completion</span>
                                <span className="font-mono text-sm font-medium">{completion}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                                <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: `${completion}%` }} />
                            </div>
                        </div>

                        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                            {checklist.map(([label, done]) => (
                                <li key={label} className="flex items-center gap-2.5 text-sm">
                                    {done ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" size={18} /> : <Circle className="h-4.5 w-4.5 text-slate-300" size={18} />}
                                    <span className={done ? 'text-ink' : 'text-slate-500'}>{label}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Information summary */}
                    <section className="panel">
                        <div className="flex items-center justify-between border-b border-line px-6 py-4">
                            <h2 className="font-display text-lg font-semibold">Student information</h2>
                            <Link to="/portal/profile" className="text-sm font-semibold text-teal-700 hover:underline">
                                {student ? 'View / edit' : 'Add information'}
                            </Link>
                        </div>
                        {student ? (
                            <dl className="grid gap-x-8 gap-y-4 p-6 sm:grid-cols-2">
                                {[
                                    ['Name', student.full_name],
                                    ['Student number', student.student_number, true],
                                    ['Program', student.program],
                                    ['Year level', yearLabel(student.year_level)],
                                    ['School email', student.school_email],
                                    ['Contact number', student.contact_number],
                                ].map(([label, value, mono]) => (
                                    <div key={label}>
                                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
                                        <dd className={cn('mt-0.5 text-sm font-medium text-ink', mono && 'font-mono')}>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <p className="p-6 text-sm text-slate-600">You haven’t added your student information yet.</p>
                        )}
                    </section>

                    {/* Activity */}
                    <section className="panel">
                        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Recent activity</h2>
                        {activity.length ? (
                            <ol className="divide-y divide-line">
                                {activity.map((a, i) => (
                                    <li key={i} className="flex items-center gap-3 px-6 py-3.5 text-sm">
                                        <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                                        <span className="flex-1 text-ink">{a.label}</span>
                                        <time className="shrink-0 text-xs text-slate-500" dateTime={a.at}>
                                            {timeAgo(a.at)}
                                        </time>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="px-6 py-8 text-center text-sm text-slate-500">Nothing yet. Activity appears here as your application progresses.</p>
                        )}
                    </section>
                </div>

                <aside className="space-y-6">
                    {/* ID preview or pending illustration */}
                    <section className="panel overflow-hidden">
                        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                            <h2 className="font-display text-base font-semibold">Digital ID</h2>
                            {idCard && <StatusBadge status={status} />}
                        </div>
                        <div className="flex justify-center bg-gradient-to-b from-navy-50 to-white p-5">
                            {student ? (
                                <DigitalIdCard
                                    student={student}
                                    institution={s}
                                    status={idCard ? (idCard.is_expired ? 'expired' : status) : 'pending'}
                                    digitalId={idCard}
                                    verificationUrl={null}
                                    flippable={false}
                                    scale={0.78}
                                />
                            ) : (
                                <div className="flex h-[290px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-navy-200 text-center">
                                    <CreditCard className="h-10 w-10 text-navy-300" />
                                    <p className="mt-3 text-sm font-semibold text-navy-800">No ID yet</p>
                                    <p className="mt-1 max-w-[200px] text-xs text-slate-500">Submit your information to begin your ID application.</p>
                                </div>
                            )}
                        </div>
                        {idCard && (
                            <div className="border-t border-line p-4">
                                <Link to="/portal/id" className="btn-secondary w-full">
                                    Open full ID
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* Quick actions */}
                    <section className="panel p-5">
                        <h2 className="font-display text-base font-semibold">Quick actions</h2>
                        <div className="mt-3 space-y-1.5">
                            {[
                                ['/portal/profile', FilePenLine, student ? 'Edit my information' : 'Submit my information'],
                                ['/portal/id', CreditCard, 'Open my digital ID'],
                                ['/portal/security', KeyRound, 'Change password'],
                            ].map(([to, Icon, label]) => (
                                <Link key={to} to={to} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50">
                                    <Icon className="h-4.5 w-4.5 text-teal-600" size={18} />
                                    {label}
                                </Link>
                            ))}
                        </div>
                        {corrections > 0 && (
                            <p className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <MessageSquareWarning className="h-4 w-4" />
                                {corrections} correction request{corrections > 1 ? 's' : ''} awaiting review
                            </p>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
