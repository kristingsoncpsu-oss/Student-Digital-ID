import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { ensureCsrf, onUnauthorized } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get('/user');
            setUser(data.user);
            return data.user;
        } catch {
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        // The user object is held in memory only; the HttpOnly session cookie is the credential.
        refresh().finally(() => setLoading(false));
        return onUnauthorized(() => setUser(null));
    }, [refresh]);

    const login = useCallback(async ({ email, password, remember }) => {
        await ensureCsrf(true);
        const { data } = await api.post('/login', { email, password, remember: !!remember });
        setUser(data.user);
        return data.user;
    }, []);

    const register = useCallback(async (payload) => {
        await ensureCsrf(true);
        const { data } = await api.post('/register', payload);
        setUser(data.user);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } finally {
            setUser(null);
            ensureCsrf(true).catch(() => {});
        }
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout, refresh, isStaff: user && user.role !== 'student', isAdmin: user?.role === 'admin' }),
        [user, loading, login, register, logout, refresh],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Where each role lands after login. */
export const homeFor = (user) => (user?.role === 'student' ? '/portal' : '/admin');
