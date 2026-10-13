import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Label + control + hint/error wrapper. Children receive the generated id via render prop or just sit inside. */
export function Field({ label, required, error, hint, children, className, htmlFor }) {
    return (
        <div className={className}>
            {label && (
                <label htmlFor={htmlFor} className="label">
                    {label}
                    {required && <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span>}
                </label>
            )}
            {children}
            {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
            {error && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
                    {error}
                </p>
            )}
        </div>
    );
}

export const TextInput = forwardRef(function TextInput({ label, required, error, hint, className, wrapperClass, id, ...rest }, ref) {
    const auto = useId();
    const fid = id || auto;
    return (
        <Field label={label} required={required} error={error} hint={hint} className={wrapperClass} htmlFor={fid}>
            <input
                ref={ref}
                id={fid}
                aria-invalid={!!error}
                className={cn('input', error && 'input-error', className)}
                {...rest}
            />
        </Field>
    );
});

export const PasswordInput = forwardRef(function PasswordInput({ label = 'Password', required, error, hint, wrapperClass, id, ...rest }, ref) {
    const auto = useId();
    const fid = id || auto;
    const [shown, setShown] = useState(false);
    return (
        <Field label={label} required={required} error={error} hint={hint} className={wrapperClass} htmlFor={fid}>
            <div className="relative">
                <input
                    ref={ref}
                    id={fid}
                    type={shown ? 'text' : 'password'}
                    aria-invalid={!!error}
                    className={cn('input pr-11', error && 'input-error')}
                    {...rest}
                />
                <button
                    type="button"
                    onClick={() => setShown((s) => !s)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-navy-700"
                    aria-label={shown ? 'Hide password' : 'Show password'}
                    aria-pressed={shown}
                >
                    {shown ? <EyeOff className="h-4.5 w-4.5" size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </Field>
    );
});

export const Select = forwardRef(function Select({ label, required, error, hint, wrapperClass, className, id, children, ...rest }, ref) {
    const auto = useId();
    const fid = id || auto;
    return (
        <Field label={label} required={required} error={error} hint={hint} className={wrapperClass} htmlFor={fid}>
            <select ref={ref} id={fid} aria-invalid={!!error} className={cn('input pr-9', error && 'input-error', className)} {...rest}>
                {children}
            </select>
        </Field>
    );
});

export const Textarea = forwardRef(function Textarea({ label, required, error, hint, wrapperClass, className, id, rows = 4, ...rest }, ref) {
    const auto = useId();
    const fid = id || auto;
    return (
        <Field label={label} required={required} error={error} hint={hint} className={wrapperClass} htmlFor={fid}>
            <textarea ref={ref} id={fid} rows={rows} aria-invalid={!!error} className={cn('input', error && 'input-error', className)} {...rest} />
        </Field>
    );
});

export const Checkbox = forwardRef(function Checkbox({ label, className, id, ...rest }, ref) {
    const auto = useId();
    const fid = id || auto;
    return (
        <label htmlFor={fid} className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-slate-700', className)}>
            <input ref={ref} id={fid} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" {...rest} />
            <span>{label}</span>
        </label>
    );
});
