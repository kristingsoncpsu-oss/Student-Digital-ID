import { useState } from 'react';
import { Ban, PauseCircle, PlayCircle, RefreshCcwDot } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import api, { ensureCsrf, parseError } from '@/lib/api';

/** Suspend / reactivate / revoke / replace-code controls for one digital ID (staff only; enforced server-side). */
export default function IdActions({ digitalId, studentName, onChanged, size = 'sm' }) {
    const toast = useToast();
    const [dialog, setDialog] = useState(null);

    if (!digitalId) return null;

    const run = (path, body) => async (reason) => {
        try {
            await ensureCsrf();
            const { data } = await api.post(`/admin/digital-ids/${digitalId.id}/${path}`, body ? { reason } : {});
            toast.success(data.message);
            onChanged?.(data.digital_id);
        } catch (e) {
            throw new Error(parseError(e).message);
        }
    };

    const status = digitalId.status;

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {status === 'active' && (
                    <Button variant="secondary" size={size} icon={PauseCircle} onClick={() => setDialog('suspend')}>
                        Suspend
                    </Button>
                )}
                {status === 'suspended' && (
                    <Button variant="secondary" size={size} icon={PlayCircle} onClick={() => setDialog('reactivate')}>
                        Reactivate
                    </Button>
                )}
                {status !== 'revoked' && (
                    <Button variant="secondary" size={size} icon={RefreshCcwDot} onClick={() => setDialog('rotate')}>
                        Replace code
                    </Button>
                )}
                {status !== 'revoked' && (
                    <Button variant="danger" size={size} icon={Ban} onClick={() => setDialog('revoke')}>
                        Revoke
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={dialog === 'suspend'}
                onClose={() => setDialog(null)}
                onConfirm={run('suspend', true)}
                title="Suspend this digital ID?"
                description={`${studentName}’s QR code will stop verifying immediately. You can reactivate it later.`}
                confirmLabel="Suspend ID"
                reason
                reasonLabel="Reason for suspension"
                reasonHint="Recorded in the audit log. Not shown to anyone who scans the ID."
            />
            <ConfirmDialog
                open={dialog === 'revoke'}
                onClose={() => setDialog(null)}
                onConfirm={run('revoke', true)}
                title="Revoke this digital ID?"
                description="Revocation is permanent for this ID. The student would need to be re-approved to receive a new one."
                confirmLabel="Revoke ID"
                reason
                reasonLabel="Reason for revocation"
            />
            <ConfirmDialog
                open={dialog === 'reactivate'}
                onClose={() => setDialog(null)}
                onConfirm={run('reactivate')}
                tone="primary"
                title="Reactivate this digital ID?"
                description={`${studentName}’s existing QR code will verify again.`}
                confirmLabel="Reactivate"
            />
            <ConfirmDialog
                open={dialog === 'rotate'}
                onClose={() => setDialog(null)}
                onConfirm={run('rotate')}
                tone="primary"
                title="Replace the verification code?"
                description="Use this if the QR code was leaked or shared. The old QR code stops working at once and the student sees a new one."
                confirmLabel="Replace code"
            />
        </>
    );
}
