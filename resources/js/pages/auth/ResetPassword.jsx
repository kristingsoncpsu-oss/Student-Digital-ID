import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import api, { ensureCsrf, parseError } from '@/lib/api';

export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [formError, setFormError] = useState('');
    const token = params.get('token');
    const email = params.get('email');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { password: '', password_confirmation: '' } });

    if (!token || !email) {
        return (
            <AuthLayout title="Link not valid">
                <Alert tone="error">This password reset link is incomplete. Request a new one.</Alert>
                <Link to="/forgot-password" className="btn-primary mt-5 w-full">
                    Request a new link
                </Link>
            </AuthLayout>
        );
    }

    const onSubmit = async (values) => {
        setFormError('');
        try {
            await ensureCsrf();
            const { data } = await api.post('/reset-password', { ...values, token, email });
            navigate('/login', { replace: true, state: { message: data.message } });
        } catch (e) {
            const err = parseError(e);
            setFormError(err.fields.email || err.fields.password || err.message);
        }
    };

    return (
        <AuthLayout title="Choose a new password" subtitle={`For ${email}`}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {formError && <Alert tone="error">{formError}</Alert>}
                <PasswordInput
                    label="New password"
                    autoComplete="new-password"
                    required
                    hint="At least 10 characters with upper and lower case letters and a number."
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
                <Button type="submit" size="lg" icon={KeyRound} loading={isSubmitting} className="w-full">
                    Reset password
                </Button>
            </form>
        </AuthLayout>
    );
}
