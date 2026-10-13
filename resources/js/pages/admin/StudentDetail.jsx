import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowLeft, CheckCircle2, CircleHelp, Pencil, UserRound, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { Pill, StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import IdActions from '@/components/id/IdActions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf, parseError } from '@/lib/api';
import { ACTION_LABELS, FIELD_LABELS, formatDate, formatDateTime, timeAgo, yearLabel } from '@/lib/utils';

export default function StudentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { isAdmin } = useAuth();
    const { data, loading, error, reload } = useFetch(`/admin/students/${id}`);
    const history = useFetch('/admin/audit-logs', { target_type: 'student', target_id: id, per_page: 8 });
    const [dialog, setDialog] = useState(null);

    if (loading && !data) return <PageLoader />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const { student: s, applications, corrections, registry_check: registry } = data;
    const archived = !!s.archived_at;
    const idCard = s.digital_id;

    const archive = async (reason) => {
        try {
            await ensureCsrf();
            const { data: res } = await api.delete(`/admin/students/${id}`, { data: { reason } });
            toast.success(res.message);
            reload();
            history.reload();
        } catch (e) {
            throw new Error(parseError(e).message);
        }
    };

    const restore = async () => {
        try {
            await ensureCsrf();
            const { data: res } = await api.post(`/admin/students/${id}/restore`);
            toast.success(res.message);
            reload();
            history.reload();
        } catch (e) {
            throw new Error(parseError(e).message);
        }
    };

    const regIcon = registry.status === 'matched' ? CheckCircle2 : registry.status === 'mismatch' ? XCircle : CircleHelp;
    const RegIcon = regIcon;
    const regTone = registry.status === 'matched' ? 'text-emerald-600' : registry.status === 'mismatch' ? 'text-rose-600' : 'text-amber-600';

    return (
        <div className="animate-fade-up">
            <Link to="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline">
                <ArrowLeft className="h-4 w-4" /> Student directory
            </Link>

            <PageHeader
                title={s.full_name}
                description={`${s.student_number} · ${s.program}`}
                actions={
                    <>
                        {archived ? <Pill tone="slate">Archived</Pill> : <StatusBadge status={s.portal_status} />}
                        {!archived && (
                            <Link to={`/admin/students/${id}/edit`} className="btn-secondary btn-sm">
                                <Pencil className="h-4 w-4" /> Edit
                            </Link>
                        )}
                        {archived ? (
                            isAdmin && (
                                <Button size="sm" variant="secondary" icon={ArchiveRestore} onClick={() => setDialog('restore')}>
                                    Restore
                                </Button>
                            )
                        ) : (
                            <Button size="sm" variant="secondary" icon={Archive} onClick={() => setDialog('archive')}>
                                Archive
                            </Button>
                        )}
                    </>
                }
            />

            {archived && (
                <Alert tone="warning" title="Archived record" className="mb-6">
                    Archived {formatDateTime(s.archived_at)}. This student’s digital ID no longer verifies.
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="space-y-6">
                    <section className="panel">
                        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Student information</h2>
                        <div className="flex flex-col gap-6 p-6 sm:flex-row">
                            <div className="flex h-44 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-navy-50">
                                {s.photo_url ? <img src={s.photo_url} alt={`Photo of ${s.full_name}`} className="h-full w-full object-cover" /> : <UserRound className="h-14 w-14 text-navy-300" strokeWidth={1.25} />}
                            </div>
                            <dl className="grid flex-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                                {[
                                    ['Student number', s.student_number, 'font-mono'],
                                    ['Enrollment', s.enrollment_status_label],
                                    ['Program', s.program],
                                    ['Year level', yearLabel(s.year_level)],
                                    ['School email', s.school_email],
                                    ['Contact number', s.contact_number],
                                    ['Login account', s.account ? `${s.account.email}${s.account.email_verified ? '' : ' (unverified)'}` : 'None'],
                                    ['Added by', data.created_by || '—'],
                                    s.address ? ['Address', s.address] : null,
                                ]
                                    .filter(Boolean)
                                    .map(([k, v, cls]) => (
                                        <div key={k} className="min-w-0">
                                            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                                            <dd className={`mt-0.5 break-words text-sm font-medium text-ink ${cls || ''}`}>{v}</dd>
                                        </div>
                                    ))}
                            </dl>
                        </div>
                    </section>

                    <section className="panel">
                        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Application history</h2>
                        {applications.length ? (
                            <ul className="divide-y divide-line">
                                {applications.map((a) => (
                                    <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4 text-sm">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-ink">Submitted {formatDateTime(a.submitted_at)}</p>
                                            {a.reviewed_at && (
                                                <p className="text-xs text-slate-500">
                                                    Reviewed {formatDateTime(a.reviewed_at)} by {a.reviewer || 'staff'}
                                                </p>
                                            )}
                                            {a.rejection_reason && <p className="mt-2 rounded bg-rose-50 px-3 py-2 text-xs text-rose-800">Shown to student: {a.rejection_reason}</p>}
                                            {a.review_notes && <p className="mt-2 rounded bg-slate-100 px-3 py-2 text-xs text-slate-700">Internal note: {a.review_notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={a.status} />
                                            {a.status === 'pending' && !archived && (
                                                <Link to={`/admin/applications/${a.id}`} className="btn-primary btn-sm">
                                                    Review
                                                </Link>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-6 py-8 text-center text-sm text-slate-500">No applications.</p>
                        )}
                    </section>

                    {corrections.length > 0 && (
                        <section className="panel">
                            <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Correction requests</h2>
                            <ul className="divide-y divide-line">
                                {corrections.map((c) => (
                                    <li key={c.id} className="flex items-start justify-between gap-3 px-6 py-3.5 text-sm">
                                        <div>
                                            <p className="font-semibold">{FIELD_LABELS[c.field]}: <span className="font-normal text-slate-600">{c.requested_value || '(photo)'}</span></p>
                                            <p className="text-xs text-slate-500">{c.reason}</p>
                                        </div>
                                        <Pill tone={c.status === 'approved' ? 'emerald' : c.status === 'rejected' ? 'rose' : 'amber'}>{c.status}</Pill>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <aside className="space-y-6">
                    <section className="panel p-6">
                        <h2 className="font-display text-lg font-semibold">Digital ID</h2>
                        {idCard ? (
                            <>
                                <dl className="mt-4 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Status</dt>
                                        <dd><StatusBadge status={idCard.is_expired ? 'expired' : idCard.status === 'active' ? 'approved' : idCard.status} /></dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Issued</dt>
                                        <dd className="font-medium">{formatDate(idCard.issued_at)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Valid until</dt>
                                        <dd className="font-medium">{idCard.expires_at ? formatDate(idCard.expires_at) : 'No expiry'}</dd>
                                    </div>
                                    {idCard.status_reason && (
                                        <div>
                                            <dt className="text-slate-500">Reason</dt>
                                            <dd className="mt-0.5 font-medium">{idCard.status_reason}</dd>
                                        </div>
                                    )}
                                </dl>
                                {!archived && (
                                    <div className="mt-5 border-t border-line pt-4">
                                        <IdActions digitalId={idCard} studentName={s.full_name} onChanged={() => { reload(); history.reload(); }} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="mt-3 text-sm text-slate-600">No digital ID has been issued yet.</p>
                        )}
                    </section>

                    <section className="panel p-6">
                        <h2 className="font-display text-lg font-semibold">Enrollment registry</h2>
                        <div className="mt-3 flex gap-3">
                            <RegIcon className={`mt-0.5 h-5 w-5 shrink-0 ${regTone}`} />
                            <div className="text-sm">
                                <p className="font-semibold text-ink">
                                    {{ matched: 'Matched', mismatch: 'Name mismatch', not_found: 'Not in registry' }[registry.status]}
                                </p>
                                <p className="text-slate-600">{registry.message}</p>
                                {registry.registry && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        Registry: {registry.registry.first_name} {registry.registry.last_name} · {registry.registry.program}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="panel">
                        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Record history</h2>
                        {history.data?.data?.length ? (
                            <ul className="divide-y divide-line">
                                {history.data.data.map((l) => (
                                    <li key={l.id} className="px-6 py-3 text-sm">
                                        <p className="font-medium">{ACTION_LABELS[l.action] || l.action}</p>
                                        <p className="text-xs text-slate-500">
                                            {l.actor?.name || 'System'} · {timeAgo(l.created_at)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-6 py-6 text-center text-sm text-slate-500">No recorded changes.</p>
                        )}
                    </section>
                </aside>
            </div>

            <ConfirmDialog
                open={dialog === 'archive'}
                onClose={() => setDialog(null)}
                onConfirm={archive}
                title="Archive this student record?"
                description="The record is hidden from the directory and the student’s digital ID stops verifying. Nothing is permanently deleted, and an administrator can restore it."
                confirmLabel="Archive record"
                reason
                reasonRequired={false}
                reasonLabel="Reason (optional)"
            />
            <ConfirmDialog
                open={dialog === 'restore'}
                onClose={() => setDialog(null)}
                onConfirm={restore}
                tone="primary"
                title="Restore this student record?"
                description="The record returns to the directory. A suspended or revoked ID stays that way."
                confirmLabel="Restore record"
            />
        </div>
    );
}
