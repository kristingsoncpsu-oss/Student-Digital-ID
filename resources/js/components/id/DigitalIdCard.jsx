import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, RotateCw, ShieldCheck, User } from 'lucide-react';
import { cn, formatDate, yearLabel } from '@/lib/utils';

export const CARD_W = 320;
export const CARD_H = 504;

const STATE_LABEL = {
    approved: 'Valid',
    active: 'Valid',
    suspended: 'Suspended',
    revoked: 'Revoked',
    expired: 'Expired',
    pending: 'Pending',
};

function Photo({ url, name, muted }) {
    return (
        <div className="h-[148px] w-[118px] overflow-hidden rounded-md bg-navy-100 ring-4 ring-white shadow-md">
            {url ? (
                <img src={url} alt={`Photograph of ${name}`} className={cn('h-full w-full object-cover', muted && 'grayscale')} />
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-navy-100 to-navy-200 text-navy-400">
                    <User className="h-16 w-16" strokeWidth={1.25} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">No photo</span>
                </div>
            )}
        </div>
    );
}

export function CardFront({ student, institution, status = 'approved', digitalId, sample = false, className }) {
    const inactive = ['suspended', 'revoked', 'expired'].includes(status);
    const pending = status === 'pending';
    const given = [student.first_name, student.middle_name].filter(Boolean).join(' ');
    const family = [student.last_name, student.suffix].filter(Boolean).join(' ');

    return (
        <div
            className={cn('print-card relative overflow-hidden rounded-[18px] border border-navy-200 bg-white shadow-lift', className)}
            style={{ width: CARD_W, height: CARD_H }}
        >
            {/* Header */}
            <div className="relative h-[122px] bg-navy-900 px-5 pt-4 text-white">
                <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
                <div className="relative flex items-center gap-3">
                    <div className="flex shrink-0">
                        <img src={institution.logos.institution} alt="" className="h-[46px] w-[46px] rounded-full bg-white object-contain" />
                        <img src={institution.logos.department} alt="" className="-ml-2 h-[46px] w-[46px] rounded-full bg-white object-contain ring-2 ring-navy-900" />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <p className="font-display text-[13px] font-semibold uppercase tracking-wide">{institution.institution_name}</p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300">
                            {institution.department_name}
                        </p>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />
            </div>

            {/* Photo (overlaps header) */}
            <div className="relative -mt-5 flex justify-center">
                <Photo url={pending ? null : student.photo_url} name={student.full_name} muted={inactive} />
            </div>

            {/* Identity */}
            <div className={cn('px-5 pt-3 text-center', inactive && 'opacity-60')}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Student</p>
                <h3 className="mt-0.5 font-display text-[19px] font-semibold leading-tight text-ink">{given}</h3>
                <p className="font-display text-[24px] font-bold uppercase leading-tight tracking-wide text-navy-900">{family}</p>

                <div className="mt-3 rounded-md bg-navy-50 px-3 py-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Student number</p>
                    <p className="font-mono text-[18px] font-medium tracking-wider text-navy-950">{student.student_number}</p>
                </div>

                <p className="mt-2.5 line-clamp-2 text-[12px] font-semibold leading-snug text-navy-900">{student.program}</p>
                <p className="mt-0.5 text-xs text-slate-600">{yearLabel(student.year_level)}</p>
            </div>

            {/* Footer */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-navy-950 px-5 py-2.5 text-white">
                <div className="leading-tight">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-300">ID status</p>
                    <p className="text-[13px] font-semibold">{STATE_LABEL[status] || status}</p>
                </div>
                <div className="text-right leading-tight">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-300">
                        {digitalId?.expires_at ? 'Valid until' : 'Issued'}
                    </p>
                    <p className="text-[13px] font-semibold">
                        {pending ? '—' : formatDate(digitalId?.expires_at || digitalId?.issued_at)}
                    </p>
                </div>
            </div>

            {sample && (
                <span className="absolute right-3 top-[132px] rounded-full bg-gold-400 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-navy-950 shadow">Sample</span>
            )}

            {inactive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="-rotate-12 rounded border-4 border-rose-600/80 px-4 py-1 font-display text-[34px] font-black uppercase tracking-widest text-rose-600/80">
                        {STATE_LABEL[status]}
                    </span>
                </div>
            )}

            {pending && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
                    <div className="mx-6 rounded-lg border border-amber-200 bg-amber-50/95 px-4 py-3 text-center shadow">
                        <p className="font-display text-base font-semibold text-amber-900">Awaiting approval</p>
                        <p className="mt-1 text-xs text-amber-800">Your ID is issued once staff verify your information.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export function CardBack({ student, institution, status = 'approved', digitalId, verificationUrl, sample = false, className }) {
    const usable = (status === 'approved' || status === 'active') && verificationUrl;

    return (
        <div
            className={cn('print-card relative overflow-hidden rounded-[18px] border border-navy-200 bg-white shadow-lift', className)}
            style={{ width: CARD_W, height: CARD_H }}
        >
            <div className="relative h-14 bg-navy-900">
                <div className="bg-grid absolute inset-0 opacity-70" />
                <p className="relative flex h-full items-center justify-center text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                    {institution.institution_short} · Student Digital ID
                </p>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />
            </div>

            <div className="flex flex-col items-center px-6 pt-6">
                {usable ? (
                    <>
                        <div className="rounded-lg border border-line bg-white p-3 shadow-card">
                            <QRCodeSVG value={verificationUrl} size={172} level="M" fgColor="#091226" bgColor="#ffffff" />
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-navy-900">
                            <ShieldCheck className="h-4 w-4 text-teal-600" /> Scan to verify this ID
                        </p>
                        <p className="mt-1 text-center text-[11px] leading-snug text-slate-500">
                            The result is checked live against the registrar’s records each time it is scanned.
                        </p>
                    </>
                ) : (
                    <div className="flex h-[216px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center">
                        <Lock className="h-9 w-9 text-slate-400" />
                        <p className="mt-3 text-sm font-semibold text-slate-700">QR code unavailable</p>
                        <p className="mt-1 text-xs text-slate-500">
                            {status === 'pending' ? 'It appears once your ID is approved.' : 'This ID is not currently valid.'}
                        </p>
                    </div>
                )}

                <dl className="mt-5 grid w-full grid-cols-2 gap-3 border-t border-line pt-4 text-center">
                    <div>
                        <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Issued</dt>
                        <dd className="text-[13px] font-semibold text-ink">{formatDate(digitalId?.issued_at)}</dd>
                    </div>
                    <div>
                        <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Valid until</dt>
                        <dd className="text-[13px] font-semibold text-ink">{digitalId?.expires_at ? formatDate(digitalId.expires_at) : 'No expiry set'}</dd>
                    </div>
                </dl>

                <p className="mt-4 text-center text-[10.5px] leading-snug text-slate-500">{institution.id_back_note}</p>
            </div>

            <div className="absolute inset-x-6 bottom-5 text-center">
                <div className="mx-auto mb-1 h-px w-40 bg-slate-300" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Authorized registrar</p>
            </div>

            {sample && (
                <span className="absolute right-3 top-[66px] rounded-full bg-gold-400 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-navy-950 shadow">Sample</span>
            )}
        </div>
    );
}

/**
 * Interactive card: click or press the button to flip between front and back.
 * `scale` shrinks the whole card for small screens without re-laying out its content.
 */
export default function DigitalIdCard({ scale = 1, flippable = true, className, ...cardProps }) {
    const [flipped, setFlipped] = useState(false);
    const w = CARD_W * scale;
    const h = CARD_H * scale;

    return (
        <div className={cn('inline-flex flex-col items-center', className)}>
            <div className="flip-scene" style={{ width: w, height: h }}>
                <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    <div className={cn('flip-card h-full w-full', flipped && 'is-flipped')}>
                        <div className="flip-face absolute inset-0">
                            <CardFront {...cardProps} />
                        </div>
                        <div className="flip-face flip-back absolute inset-0">
                            <CardBack {...cardProps} />
                        </div>
                    </div>
                </div>
            </div>
            {flippable && (
                <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="no-print mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-800 shadow-card hover:bg-navy-50"
                >
                    <RotateCw className="h-3.5 w-3.5" />
                    {flipped ? 'Show front' : 'Show back (QR code)'}
                </button>
            )}
        </div>
    );
}

/** Both faces side by side at real size; visible only when printing. */
export function PrintSheet(props) {
    return (
        <div className="print-sheet" aria-hidden="true">
            <CardFront {...props} />
            <CardBack {...props} />
        </div>
    );
}
