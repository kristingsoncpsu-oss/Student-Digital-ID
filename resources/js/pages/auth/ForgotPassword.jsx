import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import api, { ensureCsrf, parseError } from '@/lib/api';

export default function ForgotPassword() {
    const [sent, setSent] = useState(false);
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { email: '' } });

    const onSubmit = async (values) => {
        setFormError('');
        try {
            await ensureCsrf();
            await api.post('/forgot-password', values);
            setSent(true);
        } catch (e) {
            setFormError(parseError(e).message);
        }
    };

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="Enter your account email and we’ll send you a link to choose a new password."
            footer={
                <Link to="/login" className="font-semibold text-teal-700 hover:underline">
                    ← Back to log in
                </Link>
            }
        >
            {sent ? (
                <Alert tone="success" title="Check your email">
                    If an account exists for that address, a reset link is on its way. The link expires in 60 minutes.
                </Alert>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <TextInput
                        label="Email address"
                        type="email"
                        required
                        autoComplete="email"
                        error={errors.email?.message}
                        {...register('email', { required: 'Enter your email address.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' } })}
                    />
                    <Button type="submit" size="lg" icon={Mail} loading={isSubmitting} className="w-full">
                        Send reset link
                    </Button>
                </form>
            )}
        </AuthLayout>
    );
}
