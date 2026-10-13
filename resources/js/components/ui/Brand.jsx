import { Link } from 'react-router-dom';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils';

/** Institution seal + department seal lockup, driven by configurable settings. */
export default function Brand({ to = '/', tone = 'dark', compact = false, className, showDepartment = true }) {
    const s = useSettings();
    const light = tone === 'light';

    return (
        <Link to={to} className={cn('flex items-center gap-3', className)} aria-label={`${s.institution_short} Student Digital ID`}>
            <span className="flex shrink-0 items-center">
                <img src={s.logos.institution} alt="" className="h-10 w-10 rounded-full bg-white object-contain ring-2 ring-white/80" />
                {showDepartment && (
                    <img src={s.logos.department} alt="" className="-ml-2.5 h-10 w-10 rounded-full bg-white object-contain ring-2 ring-white/80" />
                )}
            </span>
            {!compact && (
                <span className="min-w-0 leading-tight">
                    <span className={cn('block font-display text-[15px] font-semibold tracking-tight', light ? 'text-white' : 'text-ink')}>
                        Student Digital ID
                    </span>
                    <span className={cn('block truncate text-[11px] font-semibold uppercase tracking-[0.12em]', light ? 'text-teal-300' : 'text-teal-600')}>
                        {s.institution_short}
                        {showDepartment && ' · CCS'}
                    </span>
                </span>
            )}
        </Link>
    );
}
