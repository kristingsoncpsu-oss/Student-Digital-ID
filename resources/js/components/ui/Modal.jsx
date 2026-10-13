import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';
import { Textarea } from './Field';
import { cn } from '@/lib/utils';

export function Modal({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }) {
    const panel = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => e.key === 'Escape' && dismissible && onClose?.();
        document.addEventListener('keydown', onKey);
        // Move focus into the dialog.
        const t = setTimeout(() => panel.current?.querySelector('input,textarea,select,button[data-autofocus]')?.focus(), 30);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
            clearTimeout(t);
        };
    }, [open, onClose, dismissible]);

    if (!open) return null;

    return (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="presentation">
            <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px]" onClick={() => dismissible && onClose?.()} />
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    'relative flex max-h-[92vh] w-full animate-fade-up flex-col rounded-t-xl bg-white shadow-lift sm:rounded-xl',
                    size === 'sm' && 'sm:max-w-md',
                    size === 'md' && 'sm:max-w-lg',
                    size === 'lg' && 'sm:max-w-2xl',
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div>
                        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
                        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
                    </div>
                    {dismissible && (
                        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close dialog">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-slate-50/70 px-5 py-3 sm:flex-row sm:justify-end">{footer}</div>}
            </div>
        </div>
    );
}

/**
 * Confirmation for destructive / consequential actions.
 * `reason` adds a required textarea; onConfirm receives the entered reason.
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    tone = 'danger',
    reason = false,
    reasonLabel = 'Reason',
    reasonRequired = true,
    reasonMin = 5,
    reasonHint,
}) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setText('');
            setError('');
            setBusy(false);
        }
    }, [open]);

    const submit = async () => {
        if (reason && reasonRequired && text.trim().length < reasonMin) {
            setError(`Please enter at least ${reasonMin} characters.`);
            return;
        }
        setBusy(true);
        try {
            await onConfirm(text.trim());
            onClose();
        } catch (e) {
            setError(e?.message || 'The action could not be completed.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={busy ? undefined : onClose}
            size="sm"
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                    </Button>
                    <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={busy} onClick={submit} data-autofocus>
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className="flex gap-3">
                {tone === 'danger' && (
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                        <AlertTriangle className="h-5 w-5" />
                    </span>
                )}
                <div className="min-w-0 flex-1 text-sm text-slate-600">
                    <p>{description}</p>
                    {reason && (
                        <Textarea
                            wrapperClass="mt-4"
                            label={reasonLabel}
                            required={reasonRequired}
                            rows={3}
                            value={text}
                            hint={reasonHint}
                            onChange={(e) => {
                                setText(e.target.value);
                                setError('');
                            }}
                            error={error}
                        />
                    )}
                    {!reason && error && <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>}
                </div>
            </div>
        </Modal>
    );
}
