import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import Pagination from '@/components/ui/Pagination';
import IdActions from '@/components/id/IdActions';
import useDebounce from '@/hooks/useDebounce';
import useFetch from '@/hooks/useFetch';
import { cn, formatDate } from '@/lib/utils';

const TABS = [
    ['', 'All'],
    ['active', 'Active'],
    ['suspended', 'Suspended'],
    ['revoked', 'Revoked'],
];

export default function DigitalIds() {
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const debounced = useDebounce(search, 350);
    const { data, loading, error, reload } = useFetch('/admin/digital-ids', { status: status || undefined, search: debounced || undefined, page, per_page: 15 });
    const rows = data?.data || [];

    return (
        <div className="animate-fade-up">
            <PageHeader eyebrow="Identification" title="Digital IDs" description="Every ID that has been issued. Suspend or revoke an ID and its QR code stops verifying immediately." />

            <div className="panel">
                <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                        {TABS.map(([v, l]) => (
                            <button
                                key={l}
                                aria-pressed={status === v}
                                onClick={() => {
                                    setStatus(v);
                                    setPage(1);
                                }}
                                className={cn('rounded-md px-3.5 py-1.5 text-sm font-semibold transition', status === v ? 'bg-white text-ink shadow-card' : 'text-slate-600 hover:text-ink')}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    <div className="relative sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search name or number"
                            aria-label="Search digital IDs"
                            className="input pl-9"
                        />
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
                    <EmptyState icon={CreditCard} title="No digital IDs" description="IDs are issued automatically when an application is approved." />
                ) : (
                    <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Status</th>
                                    <th>Issued</th>
                                    <th>Valid until</th>
                                    <th>Reason</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((d) => (
                                    <tr key={d.id}>
                                        <td>
                                            <Link to={`/admin/students/${d.student.id}`} className="font-semibold text-ink hover:text-teal-700">
                                                {d.student.full_name}
                                            </Link>
                                            <p className="font-mono text-xs text-slate-500">{d.student.student_number}</p>
                                        </td>
                                        <td>
                                            <StatusBadge status={d.is_expired ? 'expired' : d.status === 'active' ? 'approved' : d.status} />
                                        </td>
                                        <td className="whitespace-nowrap text-slate-600">{formatDate(d.issued_at)}</td>
                                        <td className="whitespace-nowrap text-slate-600">{d.expires_at ? formatDate(d.expires_at) : 'No expiry'}</td>
                                        <td className="max-w-[200px] truncate text-slate-500" title={d.status_reason || ''}>
                                            {d.status_reason || '—'}
                                        </td>
                                        <td>
                                            <div className="flex justify-end">
                                                <IdActions digitalId={d} studentName={d.student.full_name} onChanged={reload} />
                                            </div>
                                        </td>
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
