import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/context/AuthContext';
import useFetch from '@/hooks/useFetch';
import { ACTION_LABELS, cn, formatDateTime } from '@/lib/utils';

const TARGETS = [
    ['', 'All records'],
    ['student', 'Students'],
    ['application', 'Applications'],
    ['digital_id', 'Digital IDs'],
    ['correction_request', 'Corrections'],
    ['user', 'Accounts (admin)'],
    ['settings', 'Settings (admin)'],
];

export default function AuditLogs() {
    const { isAdmin } = useAuth();
    const [target, setTarget] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [page, setPage] = useState(1);
    const { data, loading, error, reload } = useFetch('/admin/audit-logs', {
        target_type: target || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        per_page: 25,
    });
    const rows = data?.data || [];

    const detail = (m) => {
        if (!m) return '';
        const parts = [];
        if (m.student_number) parts.push(m.student_number);
        if (m.changed_fields?.length) parts.push(`changed: ${m.changed_fields.join(', ')}`);
        if (m.field) parts.push(`field: ${m.field}`);
        if (m.reason) parts.push(`reason: ${m.reason}`);
        if (m.role) parts.push(`role: ${m.role}`);
        if (m.after) parts.push(`now ${m.after.role}${m.after.is_active ? '' : ', deactivated'}`);
        if (m.keys) parts.push(`${m.keys.length} settings`);
        return parts.join(' · ');
    };

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Accountability"
                title="Audit logs"
                description={isAdmin ? 'Every sensitive action, with who did it and when. Passwords and tokens are never recorded.' : 'History of student, application and ID actions.'}
            />

            <div className="panel">
                <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_auto_auto]">
                    <select
                        aria-label="Record type"
                        className="input"
                        value={target}
                        onChange={(e) => {
                            setTarget(e.target.value);
                            setPage(1);
                        }}
                    >
                        {TARGETS.filter(([v]) => isAdmin || !['user', 'settings'].includes(v)).map(([v, l]) => (
                            <option key={l} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        From
                        <input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        To
                        <input type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
                    </label>
                </div>

                {error && !data ? (
                    <ErrorState error={error} onRetry={reload} />
                ) : loading && !data ? (
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-10" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <EmptyState icon={ScrollText} title="No log entries" description="Entries appear as people use the system." />
                ) : (
                    <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Action</th>
                                    <th>By</th>
                                    <th>Target</th>
                                    <th>Details</th>
                                    {isAdmin && <th>IP</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((l) => (
                                    <tr key={l.id}>
                                        <td className="whitespace-nowrap text-slate-600">{formatDateTime(l.created_at)}</td>
                                        <td className="font-semibold text-ink">{ACTION_LABELS[l.action] || l.action}</td>
                                        <td className="whitespace-nowrap">
                                            {l.actor ? (
                                                <>
                                                    {l.actor.name} <span className="text-xs text-slate-400">({l.actor.role})</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">System</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap font-mono text-xs text-slate-500">
                                            {l.target_type}
                                            {l.target_id ? ` #${l.target_id}` : ''}
                                        </td>
                                        <td className="max-w-[320px] truncate text-xs text-slate-500" title={detail(l.metadata)}>
                                            {detail(l.metadata) || '—'}
                                        </td>
                                        {isAdmin && <td className="font-mono text-xs text-slate-400">{l.ip_address || '—'}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {data?.meta && rows.length > 0 && <Pagination meta={data.meta} onPage={setPage} />}
            </div>
        </div>
    );
}
