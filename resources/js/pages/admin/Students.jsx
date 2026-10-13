import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, GraduationCap, Pencil, Plus, Search, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import Pagination from '@/components/ui/Pagination';
import { useSettings } from '@/context/SettingsContext';
import useDebounce from '@/hooks/useDebounce';
import useFetch from '@/hooks/useFetch';
import { ENROLLMENT, YEAR_LEVELS, cn, yearLabel } from '@/lib/utils';

const ID_STATUSES = [
    ['pending', 'Pending review'],
    ['approved', 'Approved'],
    ['rejected', 'Rejected'],
    ['suspended', 'Suspended'],
    ['revoked', 'Revoked'],
];

export default function Students() {
    const settings = useSettings();
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState(params.get('search') || '');
    const debounced = useDebounce(search, 350);

    const query = {
        search: debounced || undefined,
        program: params.get('program') || undefined,
        year_level: params.get('year_level') || undefined,
        enrollment_status: params.get('enrollment_status') || undefined,
        id_status: params.get('id_status') || undefined,
        archived: params.get('archived') || undefined,
        sort: params.get('sort') || 'created_at',
        dir: params.get('dir') || 'desc',
        page: Number(params.get('page') || 1),
        per_page: 15,
    };

    const { data, loading, error, reload } = useFetch('/admin/students', query);

    const setParam = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        setParams(next, { replace: true });
    };

    // Keep the URL in sync with the debounced search so filtered views are shareable.
    useEffect(() => {
        if ((params.get('search') || '') !== debounced) setParam('search', debounced);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced]);

    const toggleSort = (col) => {
        const next = new URLSearchParams(params);
        if (query.sort === col) next.set('dir', query.dir === 'asc' ? 'desc' : 'asc');
        else {
            next.set('sort', col);
            next.set('dir', 'asc');
        }
        setParams(next, { replace: true });
    };

    const hasFilters = ['search', 'program', 'year_level', 'enrollment_status', 'id_status', 'archived'].some((k) => params.get(k));
    const rows = data?.data || [];

    const SortHead = ({ col, children }) => {
        const active = query.sort === col;
        const Icon = !active ? ArrowUpDown : query.dir === 'asc' ? ArrowUp : ArrowDown;
        return (
            <th aria-sort={active ? (query.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button onClick={() => toggleSort(col)} className="inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-navy-900">
                    {children} <Icon className={cn('h-3 w-3', !active && 'opacity-40')} />
                </button>
            </th>
        );
    };

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Student records"
                title="Student directory"
                description="Search, filter and manage every student record. Archived records are kept for auditing."
                actions={
                    <Link to="/admin/students/new" className="btn-primary">
                        <Plus className="h-4 w-4" /> New record
                    </Link>
                }
            />

            <div className="panel">
                {/* Filters */}
                <div className="space-y-3 border-b border-line p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by student number, name or school email"
                            aria-label="Search students"
                            className="input pl-9"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <select aria-label="Program" className="input" value={params.get('program') || ''} onChange={(e) => setParam('program', e.target.value)}>
                            <option value="">All programs</option>
                            {settings.programs.map((p) => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                        <select aria-label="Year level" className="input" value={params.get('year_level') || ''} onChange={(e) => setParam('year_level', e.target.value)}>
                            <option value="">All year levels</option>
                            {YEAR_LEVELS.map((y) => (
                                <option key={y} value={y}>
                                    {yearLabel(y)}
                                </option>
                            ))}
                        </select>
                        <select aria-label="Enrollment status" className="input" value={params.get('enrollment_status') || ''} onChange={(e) => setParam('enrollment_status', e.target.value)}>
                            <option value="">Any enrollment status</option>
                            {ENROLLMENT.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <select aria-label="ID status" className="input" value={params.get('id_status') || ''} onChange={(e) => setParam('id_status', e.target.value)}>
                            <option value="">Any ID status</option>
                            {ID_STATUSES.map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                        <select aria-label="Archive" className="input" value={params.get('archived') || ''} onChange={(e) => setParam('archived', e.target.value)}>
                            <option value="">Active records</option>
                            <option value="only">Archived only</option>
                            <option value="with">Active + archived</option>
                        </select>
                    </div>
                    {hasFilters && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setParams({}, { replace: true });
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"
                        >
                            <X className="h-3.5 w-3.5" /> Clear all filters
                        </button>
                    )}
                </div>

                {/* Table */}
                {error && !data ? (
                    <ErrorState error={error} onRetry={reload} />
                ) : loading && !data ? (
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-11" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title={hasFilters ? 'No students match these filters' : 'No student records yet'}
                        description={hasFilters ? 'Try a different search or clear the filters.' : 'Records appear when students submit their information, or you can create one.'}
                        action={
                            !hasFilters && (
                                <Link to="/admin/students/new" className="btn-primary">
                                    <Plus className="h-4 w-4" /> Create a record
                                </Link>
                            )
                        }
                    />
                ) : (
                    <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <SortHead col="last_name">Student</SortHead>
                                    <SortHead col="student_number">Number</SortHead>
                                    <SortHead col="program">Program</SortHead>
                                    <SortHead col="year_level">Year</SortHead>
                                    <th>ID status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((s) => (
                                    <tr key={s.id} className={s.archived_at ? 'opacity-60' : ''}>
                                        <td>
                                            <Link to={`/admin/students/${s.id}`} className="font-semibold text-ink hover:text-teal-700">
                                                {s.last_name}, {s.first_name} {s.middle_name?.[0] ? `${s.middle_name[0]}.` : ''}
                                            </Link>
                                            <p className="text-xs text-slate-500">{s.school_email}</p>
                                        </td>
                                        <td className="whitespace-nowrap font-mono text-xs">{s.student_number}</td>
                                        <td className="max-w-[240px] truncate text-slate-600" title={s.program}>
                                            {s.program}
                                        </td>
                                        <td className="whitespace-nowrap text-slate-600">{yearLabel(s.year_level)}</td>
                                        <td>
                                            {s.archived_at ? <StatusBadge status="unknown" label="Archived" /> : <StatusBadge status={s.portal_status} />}
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-1">
                                                <Link to={`/admin/students/${s.id}`} className="btn-ghost btn-sm" aria-label={`View ${s.full_name}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                {!s.archived_at && (
                                                    <Link to={`/admin/students/${s.id}/edit`} className="btn-ghost btn-sm" aria-label={`Edit ${s.full_name}`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {data?.meta && rows.length > 0 && <Pagination meta={data.meta} onPage={(p) => setParam('page', String(p))} />}
            </div>
        </div>
    );
}
