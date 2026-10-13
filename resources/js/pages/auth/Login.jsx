import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LogIn } from 'lucide-react';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/ui/Button';
import { Checkbox, PasswordInput, TextInput } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { homeFor, useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseError } from '@/lib/api';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { email: '', password: '', remember: false } });

    const flash = location.state?.message;

    const onSubmit = async (values) => {
        setFormError('');
        try {
            const user = await login(values);
            toast.success(`Welcome back, ${user.name.split(' ')[0]}.`);
            const dest = location.state?.from && location.state.from !== '/login' ? location.state.from : homeFor(user);
            navigate(dest, { replace: true });
        } catch (e) {
            const err = parseError(e);
            if (err.fields.email) setError('email', { message: err.fields.email });
            else setFormError(err.message);
        }
    };

    return (
        <AuthLayout
            title="Log in"
            subtitle="Access your student portal or the registrar workspace."
            footer={
                <>
                    New student?{' '}
                    <Link to="/register" className="font-semibold text-teal-700 hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {flash && <Alert tone="success">{flash}</Alert>}
                {formError && <Alert tone="error">{formError}</Alert>}

                <TextInput
                    label="Email address"
                    type="email"
                    autoComplete="username"
                    required
                    error={errors.email?.message}
                    {...register('email', {
                        required: 'Enter your email address.',
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
                    })}
                />
                <PasswordInput
                    label="Password"
                    autoComplete="current-password"
                    required
                    error={errors.password?.message}
                    {...register('password', { required: 'Enter your password.' })}
                />

                <div className="flex items-center justify-between">
                    <Checkbox label="Keep me signed in" {...register('remember')} />
                    <Link to="/forgot-password" className="text-sm font-semibold text-teal-700 hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" size="lg" icon={LogIn} loading={isSubmitting} className="w-full">
                    {isSubmitting ? 'Signing in…' : 'Log in'}
                </Button>
            </form>
        </AuthLayout>
    );
}
