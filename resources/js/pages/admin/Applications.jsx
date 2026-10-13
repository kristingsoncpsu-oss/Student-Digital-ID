import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ClipboardCheck, MessageSquareWarning, Search, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Pill, StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/context/ToastContext';
import useDebounce from '@/hooks/useDebounce';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf, parseError } from '@/lib/api';
import { FIELD_LABELS, cn, formatDateTime, timeAgo } from '@/lib/utils';

const STATUS_TABS = [
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
    ['all', 'All'],
];

export default function Applications() {
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'corrections' ? 'corrections' : 'applications';

    const setTab = (t) => {
        const next = new URLSearchParams();
        if (t === 'corrections') next.set('tab', 'corrections');
        setParams(next, { replace: true });
    };

    return (
        <div className="animate-fade-up">
            <PageHeader eyebrow="Review" title="ID applications" description="Verify student submissions, then approve or reject with a reason the student can read." />

            <div className="mb-5 flex gap-1 border-b border-line" role="tablist">
                {[
                    ['applications', 'Applications', ClipboardCheck],
                    ['corrections', 'Correction requests', MessageSquareWarning],
                ].map(([key, label, Icon]) => (
                    <button
                        key={key}
                        role="tab"
                        aria-selected={tab === key}
                        onClick={() => setTab(key)}
                        className={cn(
                            '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition',
                            tab === key ? 'border-teal-500 text-ink' : 'border-transparent text-slate-500 hover:text-ink',
                        )}
                    >
                        <Icon className="h-4 w-4" /> {label}
                    </button>
                ))}
            </div>

            {tab === 'applications' ? <ApplicationQueue params={params} setParams={setParams} /> : <CorrectionQueue />}
        </div>
    );
}

function ApplicationQueue({ params, setParams }) {
    const status = params.get('status') || 'pending';
    const [search, setSearch] = useState('');
    const debounced = useDebounce(search, 350);
    const page = Number(params.get('page') || 1);
    const { data, loading, error, reload } = useFetch('/admin/applications', { status, search: debounced || undefined, page, per_page: 15 });

    const setStatus = (s) => {
        const next = new URLSearchParams(params);
        next.set('status', s);
        next.delete('page');
        setParams(next, { replace: true });
    };

    const rows = data?.data || [];

    return (
        <div className="panel">
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                    {STATUS_TABS.map(([v, l]) => (
                        <button
                            key={v}
                            onClick={() => setStatus(v)}
                            aria-pressed={status === v}
                            className={cn('rounded-md px-3.5 py-1.5 text-sm font-semibold transition', status === v ? 'bg-white text-ink shadow-card' : 'text-slate-600 hover:text-ink')}
                        >
                            {l}
                        </button>
                    ))}
                </div>
                <div className="relative sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or number" aria-label="Search applications" className="input pl-9" />
                </div>
            </div>

            {error && !data ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <div className="space-y-3 p-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title={status === 'pending' ? 'The review queue is clear' : 'No applications here'}
                    description={status === 'pending' ? 'New student submissions will appear here, oldest first.' : 'Nothing matches this view.'}
                />
            ) : (
                <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Program</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Reviewed by</th>
                                <th className="text-right">&nbsp;</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr key={a.id}>
                                    <td>
                                        <p className="font-semibold text-ink">{a.student.full_name}</p>
                                        <p className="font-mono text-xs text-slate-500">{a.student.student_number}</p>
                                    </td>
                                    <td className="max-w-[220px] truncate text-slate-600">{a.student.program}</td>
                                    <td className="whitespace-nowrap text-slate-600" title={formatDateTime(a.submitted_at)}>
                                        {timeAgo(a.submitted_at)}
                                    </td>
                                    <td>
                                        <StatusBadge status={a.status} />
                                    </td>
                                    <td className="text-slate-600">{a.reviewer || '—'}</td>
                                    <td className="text-right">
                                        <Link to={`/admin/applications/${a.id}`} className={a.status === 'pending' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}>
                                            {a.status === 'pending' ? 'Review' : 'View'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data?.meta && rows.length > 0 && (
                <Pagination
                    meta={data.meta}
                    onPage={(p) => {
                        const next = new URLSearchParams(params);
                        next.set('page', String(p));
                        setParams(next, { replace: true });
                    }}
                />
            )}
        </div>
    );
}

function CorrectionQueue() {
    const toast = useToast();
    const [status, setStatus] = useState('pending');
    const { data, loading, error, reload } = useFetch('/admin/corrections', { status });
    const [dialog, setDialog] = useState(null); // { type, item }

    const act = (type, item) => async (notes) => {
        try {
            await ensureCsrf();
            const { data: res } = await api.post(`/admin/corrections/${item.id}/${type}`, { review_notes: notes || null });
            toast.success(res.message);
            reload();
        } catch (e) {
            throw new Error(parseError(e).message);
        }
    };

    const rows = data?.data || [];

    return (
        <div className="panel">
            <div className="border-b border-line p-4">
                <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
                    {[
                        ['pending', 'Pending'],
                        ['approved', 'Approved'],
                        ['rejected', 'Declined'],
                    ].map(([v, l]) => (
                        <button key={v} onClick={() => setStatus(v)} aria-pressed={status === v} className={cn('rounded-md px-3.5 py-1.5 text-sm font-semibold', status === v ? 'bg-white text-ink shadow-card' : 'text-slate-600')}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {error && !data ? (
                <ErrorState error={error} onRetry={reload} />
            ) : loading && !data ? (
                <div className="p-5">
                    <Skeleton className="h-16" />
                </div>
            ) : rows.length === 0 ? (
                <EmptyState icon={MessageSquareWarning} title="No correction requests" description="Requests from students for verified fields appear here." />
            ) : (
                <ul className="divide-y divide-line">
                    {rows.map((c) => (
                        <li key={c.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 text-sm">
                                <Link to={`/admin/students/${c.student?.id}`} className="font-semibold text-ink hover:text-teal-700">
                                    {c.student?.full_name}
                                </Link>
                                <p className="mt-0.5 text-slate-700">
                                    <strong>{FIELD_LABELS[c.field]}</strong>
                                    {c.requested_value ? <> → <span className="font-mono">{c.requested_value}</span></> : ' (photo replacement)'}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">“{c.reason}” · {timeAgo(c.created_at)}</p>
                                {c.review_notes && <p className="mt-1 text-xs text-slate-500">Note: {c.review_notes}</p>}
                            </div>
                            {c.status === 'pending' ? (
                                <div className="flex shrink-0 gap-2">
                                    <Button size="sm" variant="secondary" icon={X} onClick={() => setDialog({ type: 'reject', item: c })}>
                                        Decline
                                    </Button>
                                    <Button size="sm" icon={Check} onClick={() => setDialog({ type: 'approve', item: c })}>
                                        Approve
                                    </Button>
                                </div>
                            ) : (
                                <Pill tone={c.status === 'approved' ? 'emerald' : 'rose'}>{c.status === 'approved' ? 'Approved' : 'Declined'}</Pill>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <ConfirmDialog
                open={dialog?.type === 'approve'}
                onClose={() => setDialog(null)}
                onConfirm={dialog ? act('approve', dialog.item) : async () => {}}
                tone="primary"
                title="Approve this correction?"
                description={dialog?.item?.field === 'photo' ? 'Approving marks the request resolved. Replace the photo from the student’s record.' : 'The student record will be updated with the requested value.'}
                confirmLabel="Approve & apply"
                reason
                reasonRequired={false}
                reasonLabel="Note (optional)"
            />
            <ConfirmDialog
                open={dialog?.type === 'reject'}
                onClose={() => setDialog(null)}
                onConfirm={dialog ? act('reject', dialog.item) : async () => {}}
                title="Decline this correction?"
                description="The student will see your explanation."
                confirmLabel="Decline request"
                reason
                reasonLabel="Explanation for the student"
            />
        </div>
    );
}
