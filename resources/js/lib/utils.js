export const cn = (...parts) => parts.flat().filter(Boolean).join(' ');

const dateFmt = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : '—');
export const formatDateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : '—');

export function timeAgo(v) {
    if (!v) return '—';
    const diff = (Date.now() - new Date(v).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
    return formatDate(v);
}

export const initials = (name = '') =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('');

export const yearLabel = (n) => ({ 1: '1st', 2: '2nd', 3: '3rd' }[n] || `${n}th`) + ' year';

/** Display metadata for every student / ID status in the system. */
export const STATUS = {
    incomplete: { label: 'Incomplete', tone: 'slate', hint: 'Student information has not been submitted yet.' },
    pending: { label: 'Pending review', tone: 'amber', hint: 'Waiting for staff verification.' },
    approved: { label: 'Approved', tone: 'emerald', hint: 'Digital ID is active.' },
    rejected: { label: 'Rejected', tone: 'rose', hint: 'The application was not approved.' },
    suspended: { label: 'Suspended', tone: 'orange', hint: 'Digital ID is temporarily disabled.' },
    revoked: { label: 'Revoked', tone: 'rose', hint: 'Digital ID has been permanently revoked.' },
    active: { label: 'Active', tone: 'emerald', hint: '' },
    expired: { label: 'Expired', tone: 'slate', hint: '' },
    unknown: { label: 'Unknown', tone: 'slate', hint: '' },
};

export const ENROLLMENT = [
    { value: 'enrolled', label: 'Enrolled' },
    { value: 'leave_of_absence', label: 'Leave of absence' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'withdrawn', label: 'Withdrawn' },
];

export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6];

export const FIELD_LABELS = {
    student_number: 'Student number',
    first_name: 'First name',
    middle_name: 'Middle name',
    last_name: 'Last name',
    suffix: 'Suffix',
    school_email: 'School email',
    contact_number: 'Contact number',
    program: 'Program',
    year_level: 'Year level',
    photo: 'Photo',
    address: 'Address',
};

export const ACTION_LABELS = {
    'user.registered': 'Account registered',
    'user.password_changed': 'Password changed',
    'student.profile_submitted': 'Student information submitted',
    'student.profile_updated': 'Student profile updated',
    'student.created': 'Student record created',
    'student.updated': 'Student record updated',
    'student.archived': 'Student record archived',
    'student.restored': 'Student record restored',
    'application.submitted': 'Application submitted',
    'application.approved': 'Application approved',
    'application.rejected': 'Application rejected',
    'digital_id.issued': 'Digital ID issued',
    'digital_id.suspended': 'Digital ID suspended',
    'digital_id.revoked': 'Digital ID revoked',
    'digital_id.reactivated': 'Digital ID reactivated',
    'digital_id.token_rotated': 'Verification code replaced',
    'correction.requested': 'Correction requested',
    'correction.approved': 'Correction approved',
    'correction.rejected': 'Correction declined',
    'staff.created': 'Staff account created',
    'staff.updated': 'Staff account updated',
    'settings.updated': 'Settings updated',
};
