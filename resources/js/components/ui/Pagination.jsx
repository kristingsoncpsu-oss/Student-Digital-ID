import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

/** Works with Laravel's paginated resource `meta` object. */
export default function Pagination({ meta, onPage }) {
    if (!meta || meta.total === 0) return null;

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-slate-600 sm:flex-row">
            <p>
                Showing <span className="font-semibold text-ink">{meta.from}</span>–<span className="font-semibold text-ink">{meta.to}</span> of{' '}
                <span className="font-semibold text-ink">{meta.total}</span>
            </p>
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
                    Previous
                </Button>
                <span className="px-1 text-xs text-slate-500">
                    Page {meta.current_page} / {meta.last_page}
                </span>
                <Button variant="secondary" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
