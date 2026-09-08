import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { safeStorage } from '@/lib/safeStorage';
import { authFailureMessage } from '@/lib/authErrors';
import { isProtectedPath } from '@/lib/navigation';
import { useToast } from './ToastContext';
import { t } from '@/i18n';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    // safeStorage, not localStorage: the accessor itself throws when a browser blocks site data,
    // and this runs during the first render of the provider that wraps the whole app.
    const [token, setToken] = useState(() => safeStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Drops every cached response.
     *
     * <p><b>This is a security fix, not tidiness.</b> The cache had no notion of whose data it
     * held and nothing cleared it, so on a shared device the next person to sign in saw the
     * previous person's watch history, bookmarks, likes, owner controls and progress bars until
     * each query's own staleTime ran out — and `useLikeStatus`, which is public and runs for
     * anonymous visitors too, kept serving `liked: true` after a logout.
     *
     * <p>The other half of the fix is in `lib/queryKeys.js`: every user-scoped key carries the
     * viewer's identity, which covers a login with no logout in between. Both are needed.
     */
    const logout = useCallback(() => {
        safeStorage.removeItem('token');
        safeStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
        queryClient.clear();
    }, [queryClient]);

    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
        } catch (err) {
            // Status only, never the axios error object: its `config.headers.Authorization`
            // carries the live session JWT, so logging it whole puts a working credential in
            // the console for any extension, screenshot, or error-reporting hook to pick up.
            console.error('Failed to fetch profile:', err.response?.status ?? err.code ?? 'network error');
            // Only a 401/403 means the session is actually invalid — a 500, timeout, or
            // offline blip on mount shouldn't destroy an otherwise-valid session.
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
        // Deliberately once, on mount: this is the "do we already have a session" probe, not a
        // reaction to `token` changing. login/register set `user` themselves, and re-running on
        // every token change would fire a second profile request straight after each of them.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // `location` changes on every navigation, and the session-expiry handler needs the route the
    // visitor is actually on when the session dies — not the one they were on when the listener
    // was registered. A ref keeps the listener itself stable.
    const pathnameRef = useRef(location.pathname);
    pathnameRef.current = location.pathname;

    // client.js dispatches this once a token refresh has actually failed (invalid/expired
    // refresh token) — a real "you're logged out", not a generic network blip.
    useEffect(() => {
        const handleSessionExpired = () => {
            logout();
            // Only bounce to the login form from a page that needs a session. A visitor reading
            // an article or watching a video is not asking to sign in, and throwing them at a
            // login screen loses their place over a background request they never made. On a
            // public page the state is cleared and a toast says what happened.
            if (isProtectedPath(pathnameRef.current)) {
                navigate('/login', { replace: true, state: { from: pathnameRef.current } });
            } else {
                showToast(t('auth.sessionExpired'), 'error');
            }
        };
        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, [logout, navigate, showToast]);

    // Every place a fresh token pair arrives — login, register, and a password change (whose
    // tokenVersion bump invalidates the pair the caller is currently holding, so it has to
    // adopt the replacement or it logs itself out) — goes through here, so none of them can
    // forget one of the two keys.
    const applySession = useCallback(({ token: newToken, refreshToken }) => {
        safeStorage.setItem('token', newToken);
        safeStorage.setItem('refreshToken', refreshToken);
        setToken(newToken);
        // Not `clear()`: anonymous answers already in the cache are not wrong, they are answers
        // to a different question ("what does a signed-out visitor see"). Invalidating marks them
        // stale so every mounted query refetches as the new viewer, without blanking the page the
        // way clear() would. The scope in a user-scoped key is what keeps the two apart.
        queryClient.invalidateQueries();
    }, [queryClient]);

    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password });
            applySession(res.data);
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: authFailureMessage(error, 'login') };
        }
    };

    const register = async (username, email, password, fullName) => {
        try {
            const res = await api.post('/auth/register', {
                username, email, password, fullName
            });
            applySession(res.data);
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: authFailureMessage(error, 'register') };
        }
    };

    return (
        <AuthContext.Provider value={{
            token, user, loading, login, register, logout, applySession, refreshUser: fetchUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
