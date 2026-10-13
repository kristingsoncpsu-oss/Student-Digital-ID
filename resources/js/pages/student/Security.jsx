import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api, { ensureCsrf, parseError } from '@/lib/api';

/** Change password. Used by both the student portal and the staff console. */
export default function Security() {
    const { user } = useAuth();
    const toast = useToast();
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { current_password: '', password: '', password_confirmation: '' } });

    const onSubmit = async (values) => {
        setFormError('');
        try {
            await ensureCsrf();
            const { data } = await api.put('/user/password', values);
            toast.success(data.message);
            reset();
        } catch (e) {
            const err = parseError(e);
            Object.entries(err.fields).forEach(([k, m]) => setError(k, { message: m }));
            if (!Object.keys(err.fields).length) setFormError(err.message);
        }
    };

    return (
        <div className="animate-fade-up">
            <PageHeader eyebrow="Account" title="Security" description="Change your password. You will stay logged in on this device." />

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <form onSubmit={handleSubmit(onSubmit)} className="panel space-y-4 p-6 sm:p-8" noValidate>
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <PasswordInput
                        label="Current password"
                        autoComplete="current-password"
                        required
                        error={errors.current_password?.message}
                        {...register('current_password', { required: 'Enter your current password.' })}
                    />
                    <PasswordInput
                        label="New password"
                        autoComplete="new-password"
                        required
                        hint="At least 10 characters, with upper and lower case letters and a number."
                        error={errors.password?.message}
                        {...register('password', { required: 'Choose a new password.', minLength: { value: 10, message: 'Use at least 10 characters.' } })}
                    />
                    <PasswordInput
                        label="Confirm new password"
                        autoComplete="new-password"
                        required
                        error={errors.password_confirmation?.message}
                        {...register('password_confirmation', {
                            required: 'Confirm your new password.',
                            validate: (v) => v === watch('password') || 'The passwords do not match.',
                        })}
                    />
                    <Button type="submit" icon={KeyRound} loading={isSubmitting}>
                        Update password
                    </Button>
                </form>

                <aside className="panel h-fit p-6 text-sm text-slate-600">
                    <h2 className="font-display text-base font-semibold text-ink">Signed in as</h2>
                    <p className="mt-2 font-semibold text-ink">{user.name}</p>
                    <p className="break-all">{user.email}</p>
                    <p className="mt-3 text-xs">
                        Email: {user.email_verified ? 'verified' : 'not yet verified'} · Role: {user.role_label}
                    </p>
                </aside>
            </div>
        </div>
    );
}
