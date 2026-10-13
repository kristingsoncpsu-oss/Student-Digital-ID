import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { PasswordInput, TextInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseError } from '@/lib/api';

const RULES = [
    ['At least 10 characters', (v) => v.length >= 10],
    ['Upper and lower case letters', (v) => /[a-z]/.test(v) && /[A-Z]/.test(v)],
    ['At least one number', (v) => /\d/.test(v)],
];

export default function Register() {
    const { register: signUp } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { name: '', email: '', password: '', password_confirmation: '' } });

    const password = watch('password') || '';

    const onSubmit = async (values) => {
        setFormError('');
        try {
            await signUp(values);
            toast.success('Account created. Check your inbox to verify your email.');
            navigate('/portal', { replace: true });
        } catch (e) {
            const err = parseError(e);
            Object.entries(err.fields).forEach(([k, m]) => setError(k, { message: m }));
            if (!Object.keys(err.fields).length) setFormError(err.message);
        }
    };

    return (
        <AuthLayout
            title="Create your account"
            subtitle="Register with your name and email. You will add your student details next."
            footer={
                <>
                    Already registered?{' '}
                    <Link to="/login" className="font-semibold text-teal-700 hover:underline">
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {formError && <Alert tone="error">{formError}</Alert>}

                <TextInput
                    label="Full name"
                    autoComplete="name"
                    required
                    error={errors.name?.message}
                    {...register('name', { required: 'Enter your full name.', maxLength: { value: 150, message: 'That name is too long.' } })}
                />
                <TextInput
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    required
                    hint="We’ll send a verification link to this address."
                    error={errors.email?.message}
                    {...register('email', {
                        required: 'Enter your email address.',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
                    })}
                />
                <div>
                    <PasswordInput
                        label="Password"
                        autoComplete="new-password"
                        required
                        error={errors.password?.message}
                        {...register('password', {
                            required: 'Choose a password.',
                            validate: (v) => RULES.every(([, ok]) => ok(v)) || 'Password does not meet the requirements.',
                        })}
                    />
                    <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-1">
                        {RULES.map(([label, ok]) => (
                            <li key={label} className={ok(password) ? 'text-emerald-700' : 'text-slate-500'}>
                                {ok(password) ? '✓' : '○'} {label}
                            </li>
                        ))}
                    </ul>
                </div>
                <PasswordInput
                    label="Confirm password"
                    autoComplete="new-password"
                    required
                    error={errors.password_confirmation?.message}
                    {...register('password_confirmation', {
                        required: 'Confirm your password.',
                        validate: (v) => v === password || 'The passwords do not match.',
                    })}
                />

                <Button type="submit" size="lg" icon={UserPlus} loading={isSubmitting} className="w-full">
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
                <p className="text-center text-xs text-slate-500">
                    By registering you agree to the Terms of Use and Privacy Policy.
                </p>
            </form>
        </AuthLayout>
    );
}
