import { Link } from 'react-router-dom';
import { CheckCircle2, Hourglass, Printer, ShieldAlert } from 'lucide-react';
import DigitalIdCard, { PrintSheet } from '@/components/id/DigitalIdCard';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Alert, EmptyState, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import useFetch from '@/hooks/useFetch';
import { formatDate } from '@/lib/utils';

export default function DigitalId() {
    const { user } = useAuth();
    const settings = useSettings();
    const { data, loading, error, reload } = useFetch('/student/digital-id', null, { enabled: user.email_verified });

    if (!user.email_verified) {
        return <Alert tone="warning" title="Verify your email first">Your digital ID is available after email verification.</Alert>;
    }
    if (loading && !data) return <PageLoader label="Loading your ID…" />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const { digital_id: id, student, status, verification_url: url } = data;
    const institution = data.institution || settings;

    if (!id) {
        const incomplete = status === 'incomplete';
        return (
            <div className="animate-fade-up">
                <PageHeader eyebrow="Digital ID" title="My digital ID" />
                <div className="panel">
                    <EmptyState
                        icon={incomplete ? ShieldAlert : Hourglass}
                        title={incomplete ? 'No application yet' : status === 'rejected' ? 'Application not approved' : 'Your ID is not issued yet'}
                        description={
                            incomplete
                                ? 'Submit your student information to start your ID application.'
                                : status === 'rejected'
                                  ? 'Review the registrar’s reason, correct your information and resubmit.'
                                  : 'A registrar is reviewing your information. Your digital ID appears here as soon as it is approved.'
                        }
                        action={
                            <Link to="/portal/profile" className="btn-primary">
                                {incomplete ? 'Submit information' : 'Review my information'}
                            </Link>
                        }
                    />
                </div>
            </div>
        );
    }

    const cardStatus = id.is_expired ? 'expired' : status;
    const usable = id.is_valid && !!url;

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Digital ID"
                title="My digital ID"
                description="Show this card on your phone or print it. The QR code is checked live each time it’s scanned."
                actions={
                    <Button icon={Printer} onClick={() => window.print()} disabled={!usable}>
                        Print / save as PDF
                    </Button>
                }
            />

            {!usable && (
                <Alert tone="error" title={cardStatus === 'suspended' ? 'Your ID is suspended' : cardStatus === 'expired' ? 'Your ID has expired' : 'Your ID is not valid'} className="mb-6">
                    The QR code is disabled and will not verify. Please contact the registrar’s office.
                </Alert>
            )}

            <div className="grid items-start gap-8 lg:grid-cols-[auto_1fr]">
                <div className="mx-auto">
                    <DigitalIdCard
                        student={student}
                        institution={institution}
                        status={cardStatus}
                        digitalId={id}
                        verificationUrl={url}
                        scale={typeof window !== 'undefined' && window.innerWidth < 380 ? 0.85 : 1}
                    />
                </div>

                <div className="space-y-6">
                    <section className="panel p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-lg font-semibold">ID details</h2>
                            <StatusBadge status={cardStatus} />
                        </div>
                        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                            {[
                                ['Issued', formatDate(id.issued_at)],
                                ['Valid until', id.expires_at ? formatDate(id.expires_at) : 'No expiry set'],
                                ['Student number', student.student_number],
                                ['Enrollment', student.enrollment_status_label],
                            ].map(([k, v]) => (
                                <div key={k}>
                                    <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                                    <dd className="mt-0.5 text-sm font-medium text-ink">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className="panel p-6">
                        <h2 className="font-display text-lg font-semibold">Using your ID</h2>
                        <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                            {[
                                'Anyone can scan the QR code on the back to confirm the ID is valid.',
                                'The scan shows only your name, a masked student number and your program.',
                                'If you lose access or suspect misuse, ask the registrar to replace your verification code.',
                            ].map((t) => (
                                <li key={t} className="flex gap-2.5">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>

            <PrintSheet student={student} institution={institution} status={cardStatus} digitalId={id} verificationUrl={url} />
        </div>
    );
}
