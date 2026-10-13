import axios from 'axios';

/**
 * Single API client. Cookie-based Sanctum SPA authentication:
 * the session cookie is HttpOnly (never readable from JS) and CSRF is
 * handled through the XSRF-TOKEN cookie that axios echoes in a header.
 */
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

let csrfReady = null;

export function ensureCsrf(force = false) {
    if (force || !csrfReady) {
        csrfReady = axios.get('/sanctum/csrf-cookie', { withCredentials: true }).catch((e) => {
            csrfReady = null;
            throw e;
        });
    }
    return csrfReady;
}

// Listeners (the auth context subscribes so an expired session sends the user to login).
const unauthorizedListeners = new Set();
export const onUnauthorized = (fn) => {
    unauthorizedListeners.add(fn);
    return () => unauthorizedListeners.delete(fn);
};

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const { response, config } = error;

        // CSRF token expired: refresh the cookie and retry once.
        if (response?.status === 419 && !config.__retried) {
            config.__retried = true;
            await ensureCsrf(true);
            return api(config);
        }

        if (response?.status === 401 && !config.url?.includes('/login') && !config.url?.endsWith('/user')) {
            unauthorizedListeners.forEach((fn) => fn());
        }

        return Promise.reject(error);
    },
);

/** Normalise any failed request into { message, fields, status }. */
export function parseError(error) {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (!error?.response) {
        return { status: 0, message: 'Cannot reach the server. Check your connection and try again.', fields: {} };
    }

    const fields = {};
    if (data?.errors) {
        Object.entries(data.errors).forEach(([k, v]) => {
            fields[k] = Array.isArray(v) ? v[0] : v;
        });
    }

    let message = data?.message || 'Something went wrong. Please try again.';
    if (status === 429) message = 'Too many attempts. Please wait a moment and try again.';
    if (status === 403 && !data?.message) message = 'You do not have permission to do that.';
    if (status >= 500) message = 'The server ran into a problem. Please try again shortly.';

    return { status, message, fields };
}

export default api;
