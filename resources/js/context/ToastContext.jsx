import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const ICONS = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
    error: <XCircle className="h-5 w-5 text-rose-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    info: <Info className="h-5 w-5 text-teal-600" />,
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(1);

    const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const push = useCallback(
        (type, message, title) => {
            const id = nextId.current++;
            setToasts((t) => [...t.slice(-3), { id, type, message, title }]);
            setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4500);
        },
        [dismiss],
    );

    const api = useMemo(
        () => ({
            success: (m, t) => push('success', m, t),
            error: (m, t) => push('error', m, t),
            warning: (m, t) => push('warning', m, t),
            info: (m, t) => push('info', m, t),
        }),
        [push],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div
                aria-live="polite"
                className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role={t.type === 'error' ? 'alert' : 'status'}
                        className={cn(
                            'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-lg border bg-white p-3.5 shadow-lift',
                            t.type === 'error' ? 'border-rose-200' : 'border-line',
                        )}
                    >
                        <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
                        <div className="min-w-0 flex-1 text-sm">
                            {t.title && <p className="font-semibold text-ink">{t.title}</p>}
                            <p className="text-slate-600">{t.message}</p>
                        </div>
                        <button onClick={() => dismiss(t.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
