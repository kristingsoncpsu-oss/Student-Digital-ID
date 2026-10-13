import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ui/Modal';

/**
 * Warns before leaving a page with unsaved edits (in-app navigation and tab close).
 * Render the returned element once inside the component.
 */
export default function useUnsavedChanges(dirty) {
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname);

    useEffect(() => {
        if (!dirty) return undefined;
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    return (
        <ConfirmDialog
            open={blocker.state === 'blocked'}
            onClose={() => blocker.reset?.()}
            onConfirm={async () => blocker.proceed?.()}
            title="Leave without saving?"
            description="You have unsaved changes. If you leave this page they will be lost."
            confirmLabel="Discard changes"
        />
    );
}
