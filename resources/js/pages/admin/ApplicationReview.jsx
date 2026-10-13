import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CheckCircle2, CircleHelp, ShieldAlert, UserRound, X, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Field';
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf, parseError } from '@/lib/api';
import { cn, formatDateTime, yearLabel } from '@/lib/utils';

export default function ApplicationReview() {
    const { id } = useParams();
    const toast = useToast();
    const { data, loading, error, reload } = useFetch(`/admin/applications/${id}`);
    const [notes, setNotes] = useState('');
    const [dialog, setDialog] = useState(null);

    if (loading && !data) return <PageLoader />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const { application: app, student: s, registry_check: reg, history } = data;
    const pending = app.status === 'pending';
    const regOk = reg.status === 'matched';

    const decide = (type) => async (reason) => {
        try {
            await ensureCsrf();
            const body = type === 'approve' ? { review_notes: notes || null } : { rejection_reason: reason, review_notes: notes || null };
            const { data: res } = await api.post(`/admin/applications/${id}/${type}`, body);
            toast.success(res.message);
            reload();
        } catch (e) {
            const err = parseError(e);
            if (err.status === 409) reload(); // someone else already decided
            throw new Error(err.fields.registry || err.fields.rejection_reason || err.message);
        }
    };

    const rows = [
        ['Student number', s.student_number, 'font-mono'],
        ['Full name', s.full_name],
        ['Program', s.program],
        ['Year level', yearLabel(s.year_level)],
        ['School email', s.school_email],
        ['Contact number', s.contact_number],
        ['Login account', s.account ? `${s.account.email}${s.account.email_verified ? ' ✓' : ' (email unverified)'}` : 'No account linked'],
    ];

    return (
        <div className="animate-fade-up">
            <Link to="/admin/applications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">
                <ArrowLeft className="h-4 w-4" /> Applications
            </Link>
            <PageHeader
                eyebrow={`Application #${app.id}`}
                title={s.full_name}
                description={`Submitted ${formatDateTime(app.submitted_at)}`}
                actions={<StatusBadge status={app.status} />}
            />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-6">
                    <section className="panel">
                        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Submitted information</h2>
                        <div className="flex flex-col gap-6 p-6 sm:flex-row">
                            <div className="flex h-52 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-navy-50">
                                {s.photo_url ? <img src={s.photo_url} alt={`Submitted photo of ${s.full_name}`} className="h-full w-full object-cover" /> : (
                                    <div className="text-center text-navy-300">
                                        <UserRound className="mx-auto h-14 w-14" strokeWidth={1.25} />
                                        <p className="mt-1 text-xs font-semibold text-slate-500">No photo</p>
                                    </div>
                                )}
                            </div>
                            <dl className="grid flex-1 gap-4 sm:grid-cols-2">
                                {rows.map(([k, v, cls]) => (
                                    <div key={k} className={cn('min-w-0', k === 'Program' && 'sm:col-span-2')}>
                                        <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                                        <dd className={cn('mt-0.5 break-words text-sm font-medium text-ink', cls)}>{v}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>

                    <section className="panel">
                        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Previous applications</h2>
                        <ul className="divide-y divide-line">
                            {history.map((h) => (
                                <li key={h.id} className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm">
                                    <div>
                                        <p className="font-medium">
                                            #{h.id} · {formatDateTime(h.submitted_at)} {h.id === app.id && <span className="text-xs text-teal-700">(this one)</span>}
                                        </p>
                                        {h.rejection_reason && <p className="text-xs text-slate-500">Reason: {h.rejection_reason}</p>}
                                    </div>
                                    <StatusBadge status={h.status} />
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                <aside className="space-y-6">
                    <section className={cn('panel p-6', regOk ? 'border-emerald-200' : 'border-amber-200')}>
                        <h2 className="font-display text-lg font-semibold">Registry verification</h2>
                        <div className="mt-3 flex gap-3">
                            {regOk ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : reg.status === 'mismatch' ? <XCircle className="h-5 w-5 shrink-0 text-rose-600" /> : <CircleHelp className="h-5 w-5 shrink-0 text-amber-600" />}
                            <div className="text-sm">
                                <p className="font-semibold">{{ matched: 'Matches enrollment registry', mismatch: 'Name does not match', not_found: 'Not found in registry' }[reg.status]}</p>
                                <p className="mt-0.5 text-slate-600">{reg.message}</p>
                                {reg.registry && (
                                    <p className="mt-2 rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                        Registry shows: <strong>{reg.registry.first_name} {reg.registry.last_name}</strong>, {reg.registry.program}
                                        {reg.registry.year_level ? `, year ${reg.registry.year_level}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {pending ? (
                        <section className="panel p-6">
                            <h2 className="font-display text-lg font-semibold">Decision</h2>
                            {!regOk && (
                                <Alert tone="warning" className="mt-3">
                                    This submission was not matched to the registry. Verify the student’s documents before approving.
                                </Alert>
                            )}
                            {s.archived_at && <Alert tone="error" className="mt-3">This student record is archived and cannot be approved.</Alert>}
                            <Textarea
                                wrapperClass="mt-4"
                                label="Internal review notes"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                hint="Visible to staff only. Never shown to the student."
                            />
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <Button variant="secondary" icon={X} onClick={() => setDialog('reject')}>
                                    Reject
                                </Button>
                                <Button icon={Check} onClick={() => setDialog('approve')} disabled={!!s.archived_at}>
                                    Approve
                                </Button>
                            </div>
                        </section>
                    ) : (
                        <section className="panel p-6 text-sm">
                            <h2 className="font-display text-lg font-semibold">Decision recorded</h2>
                            <p className="mt-2 text-slate-600">
                                {app.status === 'approved' ? 'Approved' : 'Rejected'} by <strong>{app.reviewer || 'staff'}</strong> on {formatDateTime(app.reviewed_at)}.
                            </p>
                            {app.rejection_reason && <p className="mt-3 rounded bg-rose-50 px-3 py-2 text-rose-800">Shown to student: {app.rejection_reason}</p>}
                            {app.review_notes && <p className="mt-3 rounded bg-slate-100 px-3 py-2 text-slate-700">Internal note: {app.review_notes}</p>}
                            <Link to={`/admin/students/${s.id}`} className="btn-secondary mt-4 w-full">
                                Open student record
                            </Link>
                        </section>
                    )}

                    <p className="flex gap-2 text-xs text-slate-500">
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        Your name and the time of this decision are written to the audit log.
                    </p>
                </aside>
            </div>

            <ConfirmDialog
                open={dialog === 'approve'}
                onClose={() => setDialog(null)}
                onConfirm={decide('approve')}
                tone="primary"
                title="Approve and issue digital ID?"
                description={`${s.full_name} will immediately be able to view their digital ID and QR code.`}
                confirmLabel="Approve & issue ID"
            />
            <ConfirmDialog
                open={dialog === 'reject'}
                onClose={() => setDialog(null)}
                onConfirm={decide('reject')}
                title="Reject this application?"
                description="The student will see the reason below and can correct their information and resubmit."
                confirmLabel="Reject application"
                reason
                reasonMin={10}
                reasonLabel="Reason shown to the student"
                reasonHint="Be specific so the student knows what to fix. Do not include confidential details."
            />
        </div>
    );
}
