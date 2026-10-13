import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Save, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Checkbox, TextInput } from '@/components/ui/Field';
import { Alert, ErrorState, PageLoader } from '@/components/ui/Feedback';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf, parseError } from '@/lib/api';

function Group({ title, description, children }) {
    return (
        <section className="grid gap-6 border-b border-line py-7 first:pt-0 last:border-0 lg:grid-cols-[240px_1fr]">
            <div>
                <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className="space-y-4">{children}</div>
        </section>
    );
}

export default function Settings() {
    const toast = useToast();
    const publicSettings = useSettings();
    const { data, loading, error, reload } = useFetch('/admin/settings');
    const [programs, setPrograms] = useState([]);
    const [newProgram, setNewProgram] = useState('');
    const [formError, setFormError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm();

    useEffect(() => {
        if (!data) return;
        const s = data.settings;
        reset({ ...s, id_validity_months: s.id_validity_months ?? '' });
        setPrograms(s.programs || []);
    }, [data, reset]);

    if (loading && !data) return <PageLoader />;
    if (error && !data) return <ErrorState error={error} onRetry={reload} />;

    const addProgram = () => {
        const v = newProgram.trim();
        if (v && !programs.includes(v)) setPrograms([...programs, v]);
        setNewProgram('');
    };

    const submit = async (values) => {
        setFormError('');
        const payload = {
            institution_name: values.institution_name,
            institution_short: values.institution_short,
            department_name: values.department_name,
            campus_note: values.campus_note || null,
            support_email: values.support_email || null,
            support_phone: values.support_phone || null,
            id_back_note: values.id_back_note || null,
            id_validity_months: values.id_validity_months === '' ? null : Number(values.id_validity_months),
            collect_address: !!values.collect_address,
            require_registry_match: !!values.require_registry_match,
            verify_show_name: !!values.verify_show_name,
            verify_show_program: !!values.verify_show_program,
            verify_mask_number: !!values.verify_mask_number,
            programs,
        };
        try {
            await ensureCsrf();
            const { data: res } = await api.put('/admin/settings', payload);
            toast.success(res.message);
            publicSettings.reload();
            reload();
        } catch (e) {
            const err = parseError(e);
            setFormError(Object.values(err.fields)[0] || err.message);
        }
    };

    const programsChanged = JSON.stringify(programs) !== JSON.stringify(data.settings.programs || []);

    return (
        <div className="animate-fade-up">
            <PageHeader eyebrow="Administration" title="System settings" description="Branding, ID policy and what the public verification page may reveal." />

            <form onSubmit={handleSubmit(submit)} className="panel p-6 sm:p-8" noValidate>
                {formError && <Alert tone="error" className="mb-6">{formError}</Alert>}

                <Group title="Institution" description="Shown on the website, the digital ID and the verification page. Logos are served from /public/images.">
                    <TextInput label="Institution name" required error={errors.institution_name?.message} {...register('institution_name', { required: 'Required' })} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput label="Short name" required error={errors.institution_short?.message} {...register('institution_short', { required: 'Required' })} />
                        <TextInput label="Campus / location note" {...register('campus_note')} />
                    </div>
                    <TextInput label="Department / college" required error={errors.department_name?.message} {...register('department_name', { required: 'Required' })} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextInput label="Support email" type="email" {...register('support_email')} />
                        <TextInput label="Support phone" {...register('support_phone')} />
                    </div>
                </Group>

                <Group title="Digital ID policy" description="Validity and the text printed on the back of the card.">
                    <TextInput
                        label="Validity period (months)"
                        type="number"
                        min="1"
                        max="120"
                        hint="Leave empty for IDs that do not expire. Applies to IDs issued from now on."
                        error={errors.id_validity_months?.message}
                        {...register('id_validity_months')}
                    />
                    <TextInput label="Card back note" {...register('id_back_note')} />
                    <Checkbox label="Require a matching enrollment registry record before approving an application" {...register('require_registry_match')} />
                </Group>

                <Group title="Programs" description="The list students choose from when submitting their information.">
                    <ul className="flex flex-wrap gap-2">
                        {programs.map((p) => (
                            <li key={p} className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 py-1 pl-3 pr-1.5 text-sm text-navy-900 ring-1 ring-navy-100">
                                {p}
                                <button type="button" onClick={() => setPrograms(programs.filter((x) => x !== p))} className="rounded-full p-0.5 text-navy-400 hover:bg-navy-100 hover:text-rose-600" aria-label={`Remove ${p}`}>
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <input
                            className="input"
                            value={newProgram}
                            placeholder="Add a program"
                            aria-label="New program"
                            onChange={(e) => setNewProgram(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addProgram();
                                }
                            }}
                        />
                        <Button variant="secondary" icon={Plus} onClick={addProgram}>
                            Add
                        </Button>
                    </div>
                    {programs.length === 0 && <p className="text-xs font-medium text-rose-600">At least one program is required.</p>}
                </Group>

                <Group title="Public verification privacy" description="What anyone who scans a valid QR code can see. Invalid IDs never reveal personal data.">
                    <Checkbox label="Show the student’s name" {...register('verify_show_name')} />
                    <Checkbox label="Show the program" {...register('verify_show_program')} />
                    <Checkbox label="Mask the student number (show only the last 4 characters)" {...register('verify_mask_number')} />
                </Group>

                <Group title="Data collection" description="Only collect what the institution genuinely needs.">
                    <Checkbox label="Collect a home address on the student form" {...register('collect_address')} />
                </Group>

                <div className="mt-6 flex justify-end border-t border-line pt-6">
                    <Button type="submit" icon={Save} loading={isSubmitting} disabled={(!isDirty && !programsChanged) || programs.length === 0}>
                        Save settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
