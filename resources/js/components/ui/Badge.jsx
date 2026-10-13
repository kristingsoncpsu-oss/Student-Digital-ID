import { cn, STATUS } from '@/lib/utils';

const TONES = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-800 ring-rose-200',
    orange: 'bg-orange-50 text-orange-800 ring-orange-200',
    teal: 'bg-teal-50 text-teal-800 ring-teal-200',
    navy: 'bg-navy-50 text-navy-800 ring-navy-200',
};

const DOTS = {
    slate: 'bg-slate-400',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    navy: 'bg-navy-500',
};

export function Pill({ tone = 'slate', dot = true, children, className }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone], className)}>
            {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[tone])} />}
            {children}
        </span>
    );
}

export function StatusBadge({ status, label }) {
    const meta = STATUS[status] || STATUS.unknown;
    return <Pill tone={meta.tone}>{label || meta.label}</Pill>;
}
