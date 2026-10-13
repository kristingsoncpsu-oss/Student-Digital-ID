import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import StudentForm from '@/components/students/StudentForm';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import { Alert } from '@/components/ui/Feedback';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import api, { ensureCsrf } from '@/lib/api';

/** Create (no :id) and edit (with :id) a student record as staff. */
export default function StudentEdit() {
    const { id } = useParams();
    const isCreate = !id;
    const navigate = useNavigate();
    const toast = useToast();
    const { data, loading, error, reload } = useFetch(`/admin/students/${id}`, null, { enabled: !isCreate });

    if (!isCreate && loading && !data) return <PageLoader />;
    if (!isCreate && error && !data) return <ErrorState error={error} onRetry={reload} />;

    const student = data?.student;

    const save = async (body) => {
        await ensureCsrf();
        if (isCreate) {
            const { data: res } = await api.post('/admin/students', body);
            toast.success(res.message);
            // Form is no longer dirty after a successful save, so navigation isn't blocked.
            setTimeout(() => navigate(`/admin/students/${res.student.id}`), 80);
        } else {
            body.append('_method', 'PUT');
            const { data: res } = await api.post(`/admin/students/${id}`, body);
            toast.success(res.message);
            setTimeout(() => navigate(`/admin/students/${id}`), 80);
        }
    };

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Student records"
                title={isCreate ? 'New student record' : `Edit ${student.full_name}`}
                description={isCreate ? 'Create a record on behalf of a student. It enters the review queue like a student submission.' : `Student number ${student.student_number}`}
            />
            {student?.archived_at && (
                <Alert tone="warning" title="This record is archived" className="mb-6">
                    Restore it from the record page before making changes that students will see.
                </Alert>
            )}
            <div className="panel p-6 sm:p-8">
                <StudentForm
                    student={student}
                    mode="staff"
                    isCreate={isCreate}
                    submitLabel={isCreate ? 'Create record' : 'Save changes'}
                    onSubmit={save}
                    onCancel={() => navigate(isCreate ? '/admin/students' : `/admin/students/${id}`)}
                />
            </div>
        </div>
    );
}
