import { useCallback, useEffect, useRef, useState } from 'react';
import api, { parseError } from '@/lib/api';

/**
 * GET helper with loading / error / reload.
 * `params` changes (deep, via JSON) re-trigger the request; stale responses are ignored.
 */
export default function useFetch(url, params = null, { enabled = true } = {}) {
    const [state, setState] = useState({ data: null, loading: enabled, error: null });
    const counter = useRef(0);
    const key = JSON.stringify(params);

    const run = useCallback(async () => {
        if (!enabled || !url) return;
        const id = ++counter.current;
        setState((s) => ({ ...s, loading: true, error: null }));
        try {
            const res = await api.get(url, { params: params || undefined });
            if (id === counter.current) setState({ data: res.data, loading: false, error: null });
        } catch (e) {
            if (id === counter.current) setState((s) => ({ data: s.data, loading: false, error: parseError(e) }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, key, enabled]);

    useEffect(() => {
        run();
    }, [run]);

    return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
