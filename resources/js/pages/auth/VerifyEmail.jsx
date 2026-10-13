import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailWarning, XCircle } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api, { parseError } from '@/lib/api';

/** Landing page after the emailed verification link is clicked (?status=verified|invalid). */
export default function VerifyEmail() {
    const [params] = useSearchParams();
    const status = params.get('status');
    const { user, refresh } = useAuth();
    const toast = useToast();
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (status === 'verified') refresh();
    }, [status, refresh]);

    const resend = async () => {
        setSending(true);
        try {
            const { data } = await api.post('/email/verification-notification');
            toast.success(data.message);
        } catch (e) {
            toast.error(parseError(e).message);
        } finally {
            setSending(false);
        }
    };

    const Icon = status === 'verified' ? CheckCircle2 : status === 'invalid' ? XCircle : MailWarning;
    const tone = status === 'verified' ? 'text-emerald-600' : status === 'invalid' ? 'text-rose-600' : 'text-amber-600';

    return (
        <AuthLayout
            title={status === 'verified' ? 'Email verified' : status === 'invalid' ? 'Link not valid' : 'Verify your email'}
            subtitle={
                status === 'verified'
                    ? 'Thank you. Your account is ready to use.'
                    : status === 'invalid'
                      ? 'This verification link is invalid or has expired.'
                      : 'Open the link we emailed you to continue.'
            }
        >
            <div className="flex flex-col items-center rounded-lg border border-line bg-white p-8 text-center shadow-card">
                <Icon className={`h-14 w-14 ${tone}`} strokeWidth={1.5} />
                {user ? (
                    <div className="mt-6 flex w-full flex-col gap-2">
                        <Link to={user.role === 'student' ? '/portal' : '/admin'} className="btn-primary w-full">
                            Continue to your dashboard
                        </Link>
                        {status !== 'verified' && !user.email_verified && (
                            <Button variant="secondary" loading={sending} onClick={resend}>
                                Send a new link
                            </Button>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="btn-primary mt-6 w-full">
                        Log in
                    </Link>
                )}
            </div>
        </AuthLayout>
    );
}
