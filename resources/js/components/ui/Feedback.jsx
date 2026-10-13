import { AlertCircle, CheckCircle2, Info, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import Button from './Button';
import { cn } from '@/lib/utils';

export function Spinner({ className, label }) {
    return (
        <span className={cn('inline-flex items-center gap-2 text-sm text-slate-500', className)} role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            {label}
        </span>
    );
}

export function PageLoader({ label = 'Loading…' }) {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner label={label} />
        </div>
    );
}

export function Skeleton({ className }) {
    return <div className={cn('animate-pulse rounded bg-slate-200/70', className)} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            {Icon && (
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-500">
                    <Icon className="h-6 w-6" />
                </span>
            )}
            <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function ErrorState({ error, onRetry }) {
    return (
        <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <TriangleAlert className="h-6 w-6" />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">We couldn’t load this</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">{error?.message || 'Something went wrong.'}</p>
            {onRetry && (
                <Button variant="secondary" size="sm" icon={RefreshCw} className="mt-5" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
}

const ALERT = {
    info: { cls: 'border-teal-200 bg-teal-50 text-teal-900', icon: Info },
    success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
    warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert },
    error: { cls: 'border-rose-200 bg-rose-50 text-rose-900', icon: AlertCircle },
};

export function Alert({ tone = 'info', title, children, className, action }) {
    const { cls, icon: Icon } = ALERT[tone];
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-3.5 text-sm', cls, className)}>
            <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" size={18} />
            <div className="min-w-0 flex-1">
                {title && <p className="font-semibold">{title}</p>}
                {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
            </div>
            {action}
        </div>
    );
}
