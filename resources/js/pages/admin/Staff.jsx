import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Power, Search, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { Pill } from '@/components/ui/Badge';
import { Alert, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Select, TextInput } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import useDebounce from '@/hooks/useDebounce';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf, parseError } from '@/lib/api';
import { formatDateTime, timeAgo } from '@/lib/utils';

export default function Staff() {
    const { user: me } = useAuth();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const debounced = useDebounce(search, 350);
    const { data, loading, error, reload } = useFetch('/admin/staff', { search: debounced || undefined, page, per_page: 15 });
    const [creating, setCreating] = useState(false);
    const [toggle, setToggle] = useState(null);

    const rows = data?.data || [];

    const update = async (u, body) => {
        try {
            await ensureCsrf();
            const { data: res } = await api.put(`/admin/staff/${u.id}`, body);
            toast.success(res.message);
            reload();
        } catch (e) {
            throw new Error(parseError(e).message);
        }
    };

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Administration"
                title="Staff management"
                description="Registrar and administrator accounts. Public sign-up can never create these roles."
                actions={
                    <Button icon={Plus} onClick={() => setCreating(true)}>
                        Add staff account
                    </Button>
                }
            />

            <div className="panel">
                <div className="border-b border-line p-4">
                    <div className="relative sm:w-80">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search name or email"
                            aria-label="Search staff"
                            className="input pl-9"
                        />
                    </div>
                </div>

                {error && !data ? (
                    <ErrorState error={error} onRetry={reload} />
                ) : loading && !data ? (
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-12" />
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <EmptyState icon={Users} title="No staff accounts found" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="tbl">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last login</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((u) => {
                                    const self = u.id === me.id;
                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <p className="font-semibold text-ink">
                                                    {u.name} {self && <span className="text-xs font-normal text-slate-500">(you)</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </td>
                                            <td>
                                                {self ? (
                                                    <Pill tone="navy">{u.role_label}</Pill>
                                                ) : (
                                                    <select
                                                        aria-label={`Role for ${u.name}`}
                                                        className="input w-auto py-1.5 text-[13px]"
                                                        value={u.role}
                                                        onChange={(e) => update(u, { role: e.target.value }).catch((err) => toast.error(err.message))}
                                                    >
                                                        <option value="staff">Registrar / Staff</option>
                                                        <option value="admin">Administrator</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td>
                                                <Pill tone={u.is_active ? 'emerald' : 'slate'}>{u.is_active ? 'Active' : 'Deactivated'}</Pill>
                                            </td>
                                            <td className="whitespace-nowrap text-slate-600" title={formatDateTime(u.last_login_at)}>
                                                {u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}
                                            </td>
                                            <td className="text-right">
                                                {!self && (
                                                    <Button variant="secondary" size="sm" icon={Power} onClick={() => setToggle(u)}>
                                                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {data?.meta && rows.length > 0 && <Pagination meta={data.meta} onPage={setPage} />}
            </div>

            <CreateStaffModal open={creating} onClose={() => setCreating(false)} onCreated={reload} />

            <ConfirmDialog
                open={!!toggle}
                onClose={() => setToggle(null)}
                onConfirm={() => update(toggle, { is_active: !toggle.is_active })}
                tone={toggle?.is_active ? 'danger' : 'primary'}
                title={toggle?.is_active ? `Deactivate ${toggle?.name}?` : `Reactivate ${toggle?.name}?`}
                description={toggle?.is_active ? 'They lose access immediately, including any open session. Accounts are deactivated rather than deleted so the audit trail stays intact.' : 'They will be able to log in again.'}
                confirmLabel={toggle?.is_active ? 'Deactivate account' : 'Reactivate account'}
            />
        </div>
    );
}

function CreateStaffModal({ open, onClose, onCreated }) {
    const toast = useToast();
    const [formError, setFormError] = useState('');
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { name: '', email: '', role: 'staff' } });

    const close = () => {
        reset();
        setFormError('');
        onClose();
    };

    const submit = async (values) => {
        setFormError('');
        try {
            await ensureCsrf();
            const { data } = await api.post('/admin/staff', values);
            toast.success(data.message);
            onCreated();
            close();
        } catch (e) {
            const err = parseError(e);
            Object.entries(err.fields).forEach(([k, m]) => setError(k, { message: m }));
            if (!Object.keys(err.fields).length) setFormError(err.message);
        }
    };

    return (
        <Modal
            open={open}
            onClose={close}
            title="Add a staff account"
            description="They’ll receive a link to set their own password."
            footer={
                <>
                    <Button variant="secondary" onClick={close} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button loading={isSubmitting} onClick={handleSubmit(submit)}>
                        Create account
                    </Button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
                {formError && <Alert tone="error">{formError}</Alert>}
                <TextInput label="Full name" required error={errors.name?.message} {...register('name', { required: 'Enter a name.' })} />
                <TextInput
                    label="Email address"
                    type="email"
                    required
                    error={errors.email?.message}
                    {...register('email', { required: 'Enter an email.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email.' } })}
                />
                <Select label="Role" required {...register('role')}>
                    <option value="staff">Registrar / Staff — review applications and manage records</option>
                    <option value="admin">Administrator — also manages staff and settings</option>
                </Select>
                <button type="submit" className="sr-only">
                    Submit
                </button>
            </form>
        </Modal>
    );
}
