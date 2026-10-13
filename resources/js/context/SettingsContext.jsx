import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

/** Institution branding & policy flags (configurable by administrators). */
const FALLBACK = {
    institution_name: 'Central Philippines State University',
    institution_short: 'CPSU-SCC',
    department_name: 'College of Computer Studies',
    campus_note: 'Negros Occidental',
    support_email: '',
    support_phone: '',
    id_back_note: '',
    collect_address: false,
    programs: [],
    logos: { institution: '/images/cpsu-logo.png', department: '/images/ccs-logo.png' },
};

const SettingsContext = createContext(FALLBACK);

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(FALLBACK);

    const load = () =>
        api
            .get('/public/settings')
            .then(({ data }) => setSettings({ ...FALLBACK, ...data.settings }))
            .catch(() => {});

    useEffect(() => {
        load();
    }, []);

    return <SettingsContext.Provider value={{ ...settings, reload: load }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
