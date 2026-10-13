import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, GraduationCap, OctagonX, RefreshCw, ShieldAlert } from 'lucide-react';
import Brand from '@/components/ui/Brand';
import Button from '@/components/ui/Button';
import { PageLoader, ErrorState } from '@/components/ui/Feedback';
import useFetch from '@/hooks/useFetch';
import { formatDate, formatDateTime } from '@/lib/utils';

const REASONS = {
    suspended: 'This ID is suspended.',
    revoked: 'This ID has been revoked.',
    expired: 'This ID has expired.',
    unknown: 'This code is not recognised.',
};

/** Public QR verification result. Shows the minimum information the server chooses to reveal. */
export default function VerifyPage() {
    const { token } = useParams();
    const { data, loading, error, reload } = useFetch(`/verify/${encodeURIComponent(token)}`);

    return (
        <div className="min-h-screen bg-paper">
            <header className="border-b border-line bg-white">
                <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
                    <Brand />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">ID verification</span>
                </div>
            </header>

            <main className="mx-auto max-w-xl px-5 py-10">
                {loading && !data && <PageLoader label="Checking ID…" />}
                {error && !data && <ErrorState error={error} onRetry={reload} />}

                {data && data.valid && (
                    <div className="animate-fade-up overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-card">
                        <div className="flex items-center gap-3 bg-emerald-600 px-6 py-5 text-white">
                            <BadgeCheck className="h-9 w-9" />
                            <div>
                                <p className="font-display text-2xl font-semibold leading-tight">Valid student ID</p>
                                <p className="text-sm text-emerald-50">{data.institution}</p>
                            </div>
                        </div>
                        <dl className="divide-y divide-line px-6">
                            {data.student?.name && (
                                <Row label="Name" value={data.student.name} strong />
                            )}
                            <Row label="Student number" value={data.student?.student_number} mono />
                            {data.student?.program && <Row label="Program" value={data.student.program} />}
                            <Row label="Enrollment" value={data.student?.enrollment_status} />
                            {data.valid_until && <Row label="Valid until" value={formatDate(data.valid_until)} />}
                        </dl>
                        <p className="border-t border-line bg-slate-50 px-6 py-3 text-xs text-slate-500">
                            Checked {formatDateTime(data.checked_at)} against live records. Compare the person and photo ID if identity
                            matters.
                        </p>
                    </div>
                )}

                {data && !data.valid && (
                    <div className="animate-fade-up overflow-hidden rounded-xl border border-rose-200 bg-white shadow-card">
                        <div className="flex items-center gap-3 bg-rose-600 px-6 py-5 text-white">
                            {data.status === 'unknown' ? <ShieldAlert className="h-9 w-9" /> : <OctagonX className="h-9 w-9" />}
                            <div>
                                <p className="font-display text-2xl font-semibold leading-tight">Not valid</p>
                                <p className="text-sm text-rose-50">{REASONS[data.status] || data.message}</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 text-sm text-slate-600">
                            <p>
                                Do not accept this ID as proof of enrollment. If you believe this is a mistake, ask the student to contact the
                                registrar’s office.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex items-center justify-between text-sm">
                    <Link to="/" className="font-semibold text-teal-700 hover:underline">
                        <GraduationCap className="mr-1.5 inline h-4 w-4" />
                        About Student Digital ID
                    </Link>
                    {data && (
                        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={reload} loading={loading}>
                            Check again
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
}

function Row({ label, value, strong, mono }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-3.5">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</dt>
            <dd className={`text-right ${strong ? 'font-display text-lg font-semibold' : 'text-sm font-medium'} ${mono ? 'font-mono tracking-wider' : ''} text-ink`}>
                {value || '—'}
            </dd>
        </div>
    );
}
