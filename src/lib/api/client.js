import axios from 'axios';
import { API_BASE_URL } from '../env';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    // Sized for ordinary reads and writes, which should fail fast rather than hang a screen.
    // Anything genuinely long-running overrides it per request — see UPLOAD_CONFIRM_TIMEOUT_MS.
    timeout: 30000,
});

/**
 * Timeout for the create call that confirms a presigned upload.
 *
 * <p>That call is not an ordinary write: the backend pages through `ListParts` and then runs
 * `CompleteMultipartUpload` against an object that can be several GB, which routinely takes well
 * over the 30s above. Axios would abort while the server went on to assemble the object and
 * create the row — the user saw "فشل في نشر الفيديو" for an upload that had actually succeeded.
 *
 * <p>Deliberately a per-request override rather than a higher global timeout: the global one
 * exists so a stalled read fails fast, and raising it to suit the slowest call in the app would
 * make every hung request hang five minutes instead.
 */
export const UPLOAD_CONFIRM_TIMEOUT_MS = 5 * 60 * 1000;

// Request interceptor — attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Shared in-flight refresh promise — several parallel authenticated requests hitting a 401 at
// once (e.g. a page firing multiple queries on mount) must not each fire their own
// /auth/refresh call, since the backend rate-limits that endpoint to 10/min. Every caller
// that 401s while a refresh is already running awaits the same promise instead.
let refreshPromise = null;

const refreshAccessToken = (refreshToken) => {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
            .then((res) => {
                localStorage.setItem('token', res.data.token);
                // The backend may rotate the refresh token on use — store it if returned,
                // otherwise the old one (still valid) stays in place.
                if (res.data.refreshToken) {
                    localStorage.setItem('refreshToken', res.data.refreshToken);
                }
                return res.data.token;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const newToken = await refreshAccessToken(refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    // A soft signal instead of a hard `window.location.href` redirect — the
                    // latter force-reloads the whole SPA even when the 401'd request came
                    // from a public page being browsed anonymously. AuthContext listens for
                    // this to clear its in-memory state and navigate via the router.
                    window.dispatchEvent(new Event('auth:session-expired'));
                }
            } else if (localStorage.getItem('token')) {
                // A 401 with an access token present but no refresh token to try — e.g. the
                // refresh token was cleared/expired independently — used to fall straight
                // through to Promise.reject below with no signal at all, leaving the app's
                // in-memory auth state stuck "logged in" while every request kept 401ing.
                localStorage.removeItem('token');
                window.dispatchEvent(new Event('auth:session-expired'));
            }
        }

        return Promise.reject(error);
    }
);

export default api;
