import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, ClipboardList, Inbox, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import useFetch from '@/hooks/useFetch';
import { ACTION_LABELS, cn, formatDate, timeAgo } from '@/lib/utils';

const PIPELINE_COLORS = {
    incomplete: 'bg-slate-300',
    pending: 'bg-amber-400',
    approved: 'bg-emerald-500',
    rejected: 'bg-rose-400',
    suspended: 'bg-orange-400',
};

export default function Overview() {
    const { data, loading, error, reload } = useFetch('/admin/dashboard');

    if (loading && !data) return <PageLoader />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const { totals: t, status_distribution: dist, registrations, by_program: programs, recent_registrations: recent, recent_activity: activity } = data;
    const totalStatus = dist.reduce((n, d) => n + d.value, 0);
    const trendTotal = registrations.reduce((n, d) => n + d.count, 0);
    const maxProgram = Math.max(1, ...programs.map((p) => p.total));

    const kpis = [
        { label: 'Registered students', value: t.registered_users, note: `${t.student_records} with records` },
        { label: 'Pending applications', value: t.pending, note: t.oldest_pending_at ? `Oldest ${timeAgo(t.oldest_pending_at)}` : 'Queue is clear', to: '/admin/applications', accent: t.pending > 0 },
        { label: 'Approved digital IDs', value: t.approved, note: 'Currently active' },
        { label: 'Rejected', value: t.rejected, note: 'Awaiting resubmission' },
        { label: 'Suspended / revoked', value: t.suspended + t.revoked, note: `${t.suspended} suspended · ${t.revoked} revoked`, to: '/admin/ids' },
    ];

    return (
        <div className="animate-fade-up">
            <PageHeader eyebrow="Overview" title="Registrar workspace" description="Live figures from the student records database." />

            {/* KPI strip */}
            <section className="panel grid divide-y divide-line overflow-hidden sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x" aria-label="Key figures">
                {kpis.map((k) => {
                    const Body = (
                        <div className={cn('h-full p-5', k.accent && 'bg-amber-50/60')}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k.label}</p>
                            <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink">{k.value}</p>
                            <p className="mt-1 text-xs text-slate-500">{k.note}</p>
                        </div>
                    );
                    return k.to ? (
                        <Link key={k.label} to={k.to} className="block transition hover:bg-navy-50/60">
                            {Body}
                        </Link>
                    ) : (
                        <div key={k.label}>{Body}</div>
                    );
                })}
            </section>

            {t.pending_corrections > 0 && (
                <Link to="/admin/applications?tab=corrections" className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100/70">
                    <span className="flex items-center gap-2 font-semibold">
                        <Inbox className="h-4 w-4" /> {t.pending_corrections} correction request{t.pending_corrections > 1 ? 's' : ''} need a decision
                    </span>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            )}

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                {/* Registrations */}
                <section className="panel p-6">
                    <div className="flex items-baseline justify-between">
                        <h2 className="font-display text-lg font-semibold">New student accounts</h2>
                        <span className="text-xs text-slate-500">Last 30 days · {trendTotal} total</span>
                    </div>
                    {trendTotal === 0 ? (
                        <EmptyState icon={Users} title="No registrations yet" description="New student sign-ups from the last 30 days will appear here." />
                    ) : (
                        <div className="mt-4 h-60" role="img" aria-label={`Bar chart of daily new student accounts over the last 30 days, ${trendTotal} in total`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={registrations} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#e3e6ec" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={6}
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(31,149,158,.08)' }}
                                        labelFormatter={(d) => formatDate(d)}
                                        formatter={(v) => [v, 'New accounts']}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e3e6ec', fontSize: 12 }}
                                    />
                                    <Bar dataKey="count" fill="#1f959e" radius={[3, 3, 0, 0]} maxBarSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>

                {/* Pipeline */}
                <section className="panel p-6">
                    <h2 className="font-display text-lg font-semibold">Application pipeline</h2>
                    {totalStatus === 0 ? (
                        <EmptyState icon={ClipboardList} title="Nothing in the pipeline" description="Statuses appear once students register." />
                    ) : (
                        <>
                            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Distribution of application statuses">
                                {dist.map((d) => (
                                    <div key={d.key} className={PIPELINE_COLORS[d.key]} style={{ width: `${(d.value / totalStatus) * 100}%` }} title={`${d.label}: ${d.value}`} />
                                ))}
                            </div>
                            <ul className="mt-5 space-y-3">
                                {dist.map((d) => (
                                    <li key={d.key} className="flex items-center gap-3 text-sm">
                                        <span className={cn('h-2.5 w-2.5 rounded-sm', PIPELINE_COLORS[d.key])} />
                                        <span className="flex-1 text-slate-700">{d.label}</span>
                                        <span className="font-mono font-medium tabular-nums text-ink">{d.value}</span>
                                        <span className="w-10 text-right text-xs text-slate-400">{Math.round((d.value / totalStatus) * 100)}%</span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                {/* Recent registrations */}
                <section className="panel overflow-hidden">
                    <div className="flex items-center justify-between border-b border-line px-6 py-4">
                        <h2 className="font-display text-lg font-semibold">Recent student records</h2>
                        <Link to="/admin/students" className="text-sm font-semibold text-teal-700 hover:underline">
                            View all
                        </Link>
                    </div>
                    {recent.length === 0 ? (
                        <EmptyState icon={Users} title="No student records yet" description="Records appear when students submit their information or staff create them." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Program</th>
                                        <th>Status</th>
                                        <th>Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <Link to={`/admin/students/${s.id}`} className="font-semibold text-ink hover:text-teal-700">
                                                    {s.full_name}
                                                </Link>
                                                <p className="font-mono text-xs text-slate-500">{s.student_number}</p>
                                            </td>
                                            <td className="max-w-[220px] truncate text-slate-600">{s.program}</td>
                                            <td>
                                                <StatusBadge status={s.portal_status} />
                                            </td>
                                            <td className="whitespace-nowrap text-slate-500">{timeAgo(s.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="space-y-6">
                    <section className="panel p-6">
                        <h2 className="font-display text-lg font-semibold">Students by program</h2>
                        {programs.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">No records yet.</p>
                        ) : (
                            <ul className="mt-4 space-y-3.5">
                                {programs.map((p) => (
                                    <li key={p.program}>
                                        <div className="flex justify-between gap-3 text-sm">
                                            <span className="truncate text-slate-700">{p.program}</span>
                                            <span className="font-mono font-medium tabular-nums">{p.total}</span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-navy-600" style={{ width: `${(p.total / maxProgram) * 100}%` }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="panel">
                        <div className="flex items-center justify-between border-b border-line px-6 py-4">
                            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
                            <Link to="/admin/audit" className="text-sm font-semibold text-teal-700 hover:underline">
                                Audit log
                            </Link>
                        </div>
                        {activity.length === 0 ? (
                            <p className="px-6 py-8 text-center text-sm text-slate-500">No activity recorded yet.</p>
                        ) : (
                            <ul className="divide-y divide-line">
                                {activity.map((a) => (
                                    <li key={a.id} className="px-6 py-3 text-sm">
                                        <p className="font-medium text-ink">{ACTION_LABELS[a.action] || a.action}</p>
                                        <p className="text-xs text-slate-500">
                                            {a.actor?.name || 'System'} · {timeAgo(a.created_at)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
