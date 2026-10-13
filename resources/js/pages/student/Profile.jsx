import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MessageSquareWarning, Send } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StudentForm from '@/components/students/StudentForm';
import Button from '@/components/ui/Button';
import { Select, Textarea, TextInput } from '@/components/ui/Field';
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { Pill, StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf, parseError } from '@/lib/api';
import { FIELD_LABELS, formatDate } from '@/lib/utils';

const CORRECTABLE = ['student_number', 'first_name', 'middle_name', 'last_name', 'suffix', 'school_email', 'program', 'year_level', 'photo'];

export default function Profile() {
    const { user } = useAuth();
    const toast = useToast();
    const { data, loading, error, reload, setData } = useFetch('/student/profile', null, { enabled: user.email_verified });

    if (!user.email_verified) {
        return <Alert tone="warning" title="Verify your email first">You can submit your student information after verifying {user.email}.</Alert>;
    }
    if (loading && !data) return <PageLoader />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const { student, edit_mode: editMode } = data;
    const isNew = !student;
    const status = student?.portal_status || 'incomplete';
    const app = student?.application;

    const save = async (body) => {
        await ensureCsrf();
        let res;
        if (isNew) {
            res = await api.post('/student/profile', body);
        } else {
            body.append('_method', 'PUT');
            res = await api.post('/student/profile', body);
        }
        setData(res.data);
        toast.success(res.data.message);
    };

    const title = isNew ? 'Submit your student information' : editMode === 'contact_only' ? 'My information' : 'Edit your information';

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Student information"
                title={title}
                description={
                    isNew
                        ? 'Provide your details exactly as they appear in school records. A registrar will verify them before your ID is issued.'
                        : 'Keep your details current. Some fields are verified by the registrar and can’t be changed directly after approval.'
                }
                actions={!isNew && <StatusBadge status={status} />}
            />

            {status === 'rejected' && (
                <Alert tone="error" title="Your application was not approved" className="mb-6">
                    {app?.rejection_reason || 'Please review your information.'} Update the details below and save to resubmit.
                </Alert>
            )}
            {status === 'pending' && (
                <Alert tone="info" title="Under review" className="mb-6">
                    You can still correct mistakes while the registrar reviews your application.
                </Alert>
            )}
            {editMode === 'contact_only' && (
                <Alert tone="info" title="Verified details are locked" className="mb-6">
                    You can update your contact number below. To change anything else, send a correction request at the bottom of this page.
                </Alert>
            )}

            <div className="panel p-6 sm:p-8">
                <StudentForm
                    student={student}
                    mode="student"
                    editMode={editMode}
                    submitLabel={isNew ? 'Submit for review' : status === 'rejected' ? 'Save & resubmit' : 'Save changes'}
                    onSubmit={save}
                />
            </div>

            {!isNew && editMode === 'contact_only' && <CorrectionPanel />}
        </div>
    );
}

function CorrectionPanel() {
    const toast = useToast();
    const { data, reload } = useFetch('/student/corrections');
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { field: 'last_name', requested_value: '', reason: '' } });

    const field = watch('field');

    const submit = async (values) => {
        setFormError('');
        try {
            await ensureCsrf();
            const { data: res } = await api.post('/student/corrections', values);
            toast.success(res.message);
            reset({ field: values.field, requested_value: '', reason: '' });
            reload();
        } catch (e) {
            const err = parseError(e);
            Object.entries(err.fields).forEach(([k, m]) => setError(k, { message: m }));
            if (!Object.keys(err.fields).length) setFormError(err.message);
        }
    };

    const items = data?.data || [];

    return (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="panel p-6">
                <div className="flex items-center gap-2.5">
                    <MessageSquareWarning className="h-5 w-5 text-teal-600" />
                    <h2 className="font-display text-lg font-semibold">Request a correction</h2>
                </div>
                <p className="mt-1 text-sm text-slate-600">For details verified by the registrar. Staff review each request.</p>

                <form className="mt-5 space-y-4" onSubmit={handleSubmit(submit)} noValidate>
                    {formError && <Alert tone="error">{formError}</Alert>}
                    <Select label="Which detail is wrong?" required {...register('field')}>
                        {CORRECTABLE.map((f) => (
                            <option key={f} value={f}>
                                {FIELD_LABELS[f]}
                            </option>
                        ))}
                    </Select>
                    {field !== 'photo' && (
                        <TextInput
                            label="Correct value"
                            required
                            error={errors.requested_value?.message}
                            {...register('requested_value', { required: 'Enter the correct value.' })}
                        />
                    )}
                    <Textarea
                        label="Why does it need changing?"
                        required
                        rows={3}
                        hint={field === 'photo' ? 'Staff will contact you to replace your photograph.' : undefined}
                        error={errors.reason?.message}
                        {...register('reason', { required: 'Explain the reason.', minLength: { value: 10, message: 'Please give at least 10 characters.' } })}
                    />
                    <Button type="submit" icon={Send} loading={isSubmitting}>
                        Send request
                    </Button>
                </form>
            </div>

            <div className="panel">
                <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold">Your requests</h2>
                {items.length ? (
                    <ul className="divide-y divide-line">
                        {items.map((c) => (
                            <li key={c.id} className="px-6 py-4 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-semibold text-ink">{FIELD_LABELS[c.field] || c.field}</span>
                                    <Pill tone={c.status === 'approved' ? 'emerald' : c.status === 'rejected' ? 'rose' : 'amber'}>
                                        {c.status === 'pending' ? 'Pending' : c.status === 'approved' ? 'Approved' : 'Declined'}
                                    </Pill>
                                </div>
                                {c.requested_value && <p className="mt-1 text-slate-600">New value: {c.requested_value}</p>}
                                <p className="mt-0.5 text-xs text-slate-500">Sent {formatDate(c.created_at)}</p>
                                {c.status === 'rejected' && c.review_notes && (
                                    <p className="mt-2 rounded bg-rose-50 px-3 py-2 text-xs text-rose-800">Registrar: {c.review_notes}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="px-6 py-10 text-center text-sm text-slate-500">You haven’t sent any correction requests.</p>
                )}
            </div>
        </section>
    );
}
