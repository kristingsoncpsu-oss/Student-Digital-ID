import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
    primary: 'btn-primary',
    accent: 'btn-accent',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
};

export default function Button({ variant = 'primary', size, loading = false, icon: Icon, className, children, disabled, type = 'button', ...rest }) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={cn(VARIANTS[variant], size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', className)}
            {...rest}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
            {children}
        </button>
    );
}
