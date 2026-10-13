import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImagePlus, Lock, Save, Trash2, UserRound } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Checkbox, Select, TextInput } from '@/components/ui/Field';
import { useSettings } from '@/context/SettingsContext';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { parseError } from '@/lib/api';
import { ENROLLMENT, YEAR_LEVELS, yearLabel } from '@/lib/utils';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const NAME_RE = /^[\p{L}\p{M}\s.'’-]+$/u;

const toDefaults = (s) => ({
    student_number: s?.student_number ?? '',
    first_name: s?.first_name ?? '',
    middle_name: s?.middle_name ?? '',
    last_name: s?.last_name ?? '',
    suffix: s?.suffix ?? '',
    school_email: s?.school_email ?? '',
    contact_number: s?.contact_number ?? '',
    program: s?.program ?? '',
    year_level: s?.year_level ? String(s.year_level) : '',
    address: s?.address ?? '',
    enrollment_status: s?.enrollment_status ?? 'enrolled',
    create_account: true,
});

function Section({ title, description, children }) {
    return (
        <fieldset className="grid gap-6 border-b border-line py-7 first:pt-0 last:border-0 last:pb-0 lg:grid-cols-[220px_1fr]">
            <legend className="sr-only">{title}</legend>
            <div aria-hidden="true">
                <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

/**
 * Student information form shared by the student portal and the staff console.
 *  - mode "student": cannot set enrollment status; may be limited to contact fields (editMode = contact_only)
 *  - mode "staff": full record, enrollment status, optional account creation on create
 */
export default function StudentForm({ student, mode = 'student', editMode = 'full', isCreate = false, submitLabel, onSubmit, onCancel }) {
    const settings = useSettings();
    const fileRef = useRef(null);
    const [photo, setPhoto] = useState(null);
    const [photoError, setPhotoError] = useState('');
    const [preview, setPreview] = useState(student?.photo_url || null);
    const [removedExisting, setRemovedExisting] = useState(false);
    const [formError, setFormError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting, isDirty },
        watch,
    } = useForm({ defaultValues: toDefaults(student) });

    const dirty = isDirty || !!photo;
    const leaveGuard = useUnsavedChanges(dirty && !isSubmitting);

    useEffect(() => {
        reset(toDefaults(student));
        setPreview(student?.photo_url || null);
        setPhoto(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student?.id, student?.updated_at]);

    useEffect(() => () => preview?.startsWith('blob:') && URL.revokeObjectURL(preview), [preview]);

    const locked = editMode === 'contact_only';
    const programs = settings.programs?.length ? settings.programs : null;
    const programValue = watch('program');

    const pickPhoto = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setPhotoError('');

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setPhotoError('Use a JPG, PNG or WebP image.');
            return;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            setPhotoError('The photo must be 2 MB or smaller.');
            return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            if (img.width < 200 || img.height < 200) {
                URL.revokeObjectURL(url);
                setPhotoError('The photo must be at least 200 × 200 pixels.');
                return;
            }
            setPhoto(file);
            setPreview(url);
            setRemovedExisting(false);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            setPhotoError('That file could not be read as an image.');
        };
        img.src = url;
    };

    const submit = async (values) => {
        setFormError('');
        const body = new FormData();

        const fields = locked
            ? ['contact_number', 'address']
            : ['student_number', 'first_name', 'middle_name', 'last_name', 'suffix', 'school_email', 'contact_number', 'program', 'year_level', 'address'];

        fields.forEach((f) => {
            if (f === 'address' && !settings.collect_address) return;
            body.append(f, values[f] ?? '');
        });
        if (mode === 'staff') {
            body.append('enrollment_status', values.enrollment_status);
            if (isCreate) body.append('create_account', values.create_account ? '1' : '0');
        }
        if (photo) body.append('photo', photo);

        try {
            await onSubmit(body);
            // Saved: the form is clean again (also lifts the leave-page guard).
            reset(values);
            setPhoto(null);
        } catch (e) {
            const err = parseError(e);
            Object.entries(err.fields).forEach(([k, message]) => {
                if (k === 'photo') setPhotoError(message);
                else setError(k, { message });
            });
            setFormError(Object.keys(err.fields).length ? 'Please fix the highlighted fields.' : err.message);
        }
    };

    const lockedHint = locked ? 'Verified by the registrar. Use a correction request to change this.' : undefined;
    const req = (msg) => ({ required: msg });

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            {leaveGuard}

            {formError && (
                <div role="alert" className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    {formError}
                </div>
            )}

            <Section title="Identity" description="As it appears in your official school records.">
                <TextInput
                    label="Student ID number"
                    required
                    disabled={locked}
                    hint={lockedHint}
                    placeholder="e.g. 2026-00123"
                    autoComplete="off"
                    wrapperClass="sm:col-span-2"
                    className="font-mono"
                    error={errors.student_number?.message}
                    {...register('student_number', {
                        ...req('Enter your student ID number.'),
                        pattern: { value: /^[A-Za-z0-9-]{4,32}$/, message: 'Use 4–32 letters, numbers or hyphens.' },
                    })}
                />
                <TextInput
                    label="First name"
                    required
                    disabled={locked}
                    autoComplete="given-name"
                    error={errors.first_name?.message}
                    {...register('first_name', { ...req('Enter your first name.'), pattern: { value: NAME_RE, message: 'Letters, spaces, apostrophes, periods and hyphens only.' } })}
                />
                <TextInput
                    label="Middle name"
                    disabled={locked}
                    autoComplete="additional-name"
                    error={errors.middle_name?.message}
                    {...register('middle_name', { pattern: { value: NAME_RE, message: 'Letters, spaces, apostrophes, periods and hyphens only.' } })}
                />
                <TextInput
                    label="Last name"
                    required
                    disabled={locked}
                    autoComplete="family-name"
                    error={errors.last_name?.message}
                    {...register('last_name', { ...req('Enter your last name.'), pattern: { value: NAME_RE, message: 'Letters, spaces, apostrophes, periods and hyphens only.' } })}
                />
                <TextInput label="Suffix" disabled={locked} placeholder="Jr., III…" error={errors.suffix?.message} {...register('suffix', { maxLength: { value: 20, message: 'Too long.' } })} />
            </Section>

            <Section title="Academic" description="Your current program and standing.">
                {programs ? (
                    <Select
                        label="Course / program"
                        required
                        disabled={locked}
                        wrapperClass="sm:col-span-2"
                        error={errors.program?.message}
                        {...register('program', req('Choose your program.'))}
                    >
                        <option value="">Select a program…</option>
                        {programs.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                        {programValue && !programs.includes(programValue) && <option value={programValue}>{programValue}</option>}
                    </Select>
                ) : (
                    <TextInput label="Course / program" required disabled={locked} wrapperClass="sm:col-span-2" error={errors.program?.message} {...register('program', req('Enter your program.'))} />
                )}
                <Select label="Year level" required disabled={locked} error={errors.year_level?.message} {...register('year_level', req('Choose your year level.'))}>
                    <option value="">Select…</option>
                    {YEAR_LEVELS.map((y) => (
                        <option key={y} value={y}>
                            {yearLabel(y)}
                        </option>
                    ))}
                </Select>
                {mode === 'staff' ? (
                    <Select label="Enrollment status" required error={errors.enrollment_status?.message} {...register('enrollment_status', req('Choose a status.'))}>
                        {ENROLLMENT.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </Select>
                ) : (
                    <div>
                        <span className="label">Enrollment status</span>
                        <p className="flex h-[42px] items-center gap-2 rounded-md border border-line bg-slate-50 px-3 text-sm text-slate-600">
                            <Lock className="h-3.5 w-3.5" /> {student?.enrollment_status_label || 'Set by the registrar'}
                        </p>
                    </div>
                )}
            </Section>

            <Section title="Contact" description="Used by the registrar to reach you.">
                <TextInput
                    label="School email"
                    type="email"
                    required
                    disabled={locked}
                    hint={lockedHint}
                    autoComplete="email"
                    error={errors.school_email?.message}
                    {...register('school_email', {
                        ...req('Enter your school email.'),
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' },
                    })}
                />
                <TextInput
                    label="Contact number"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="09XX XXX XXXX"
                    error={errors.contact_number?.message}
                    {...register('contact_number', {
                        ...req('Enter a contact number.'),
                        pattern: { value: /^[0-9+\-\s()]{7,20}$/, message: 'Enter a valid number (digits, +, -, spaces).' },
                    })}
                />
                {settings.collect_address && (
                    <TextInput label="Address" wrapperClass="sm:col-span-2" autoComplete="street-address" error={errors.address?.message} {...register('address', { maxLength: { value: 255, message: 'Too long.' } })} />
                )}
            </Section>

            <Section title="Photograph" description="A clear, front-facing portrait with a plain background. JPG, PNG or WebP, up to 2 MB.">
                <div className="flex flex-col gap-5 sm:col-span-2 sm:flex-row sm:items-start">
                    <div className="flex h-44 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-navy-50">
                        {preview && !removedExisting ? (
                            <img src={preview} alt="Selected photo preview" className="h-full w-full object-cover" />
                        ) : (
                            <UserRound className="h-14 w-14 text-navy-300" strokeWidth={1.25} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickPhoto} disabled={locked} id="photo-input" aria-describedby="photo-help" />
                        <div className="flex flex-wrap gap-2">
                            <Button variant="secondary" icon={ImagePlus} disabled={locked} onClick={() => fileRef.current?.click()}>
                                {preview && !removedExisting ? 'Replace photo' : 'Choose photo'}
                            </Button>
                            {photo && (
                                <Button
                                    variant="ghost"
                                    icon={Trash2}
                                    onClick={() => {
                                        setPhoto(null);
                                        setPreview(student?.photo_url || null);
                                        setPhotoError('');
                                    }}
                                >
                                    Undo selection
                                </Button>
                            )}
                        </div>
                        <p id="photo-help" className="mt-2 text-xs text-slate-500">
                            {locked ? 'To change your photo after approval, send a correction request.' : 'Minimum 200 × 200 pixels. Staff review every photo before an ID is issued.'}
                        </p>
                        {photoError && (
                            <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
                                {photoError}
                            </p>
                        )}
                        {photo && <p className="mt-2 text-xs text-slate-600">New photo selected: {photo.name} (not saved yet)</p>}
                    </div>
                </div>
            </Section>

            {mode === 'staff' && isCreate && (
                <div className="mt-2 rounded-lg border border-line bg-slate-50 p-4">
                    <Checkbox
                        label={
                            <span>
                                <strong>Create a login account</strong> using the school email and send a password-setup link. The record is queued for review
                                like any other application.
                            </span>
                        }
                        {...register('create_account')}
                    />
                </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-end">
                {dirty && <p className="text-xs font-medium text-amber-700 sm:mr-auto">You have unsaved changes.</p>}
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" icon={Save} loading={isSubmitting}>
                    {isSubmitting ? 'Saving…' : submitLabel || 'Save'}
                </Button>
            </div>
        </form>
    );
}
