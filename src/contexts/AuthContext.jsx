import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { clearSession, isRemembered, readToken, storeSession } from '@/lib/authStorage';
import { login as loginRequest, register as registerRequest, updateLocale } from '@/lib/api/auth';
import { authFailureMessage } from '@/lib/authErrors';
import { isProtectedPath } from '@/lib/navigation';
import { useToast } from './ToastContext';
import { currentLocale, t } from '@/i18n';

const AuthContext = createContext();

// One retry, then accept the answer — see fetchUserProfile for why a second attempt is worth
// making and a third is not.
const PROFILE_RETRY_ATTEMPTS = 1;
const PROFILE_RETRY_DELAY_MS = 1500;

/**
 * Keeps the account's language in step with this browser's.
 *
 * <p>Only the mail reads `users.locale`, so the cost of it being stale is a verification or reset
 * link written in the wrong language — which is exactly the mail a person is least able to work
 * around, since they are usually locked out at the time.
 *
 * <p><b>Here rather than in the language toggle.</b> Switching language reloads the page, so a
 * request fired beside the switch races the navigation that cancels it; the reload is a more
 * reliable trigger than the click was. It also covers the cases a click never would: an account
 * signed in from a second browser, and one created before this column existed.
 *
 * <p>Fire and forget, and deliberately silent. This is a preference nobody asked to save, on the
 * critical path of the app's first render — a failure costs one mail in the wrong language, and a
 * toast about it would be noise about something the reader did not do.
 */
function syncAccountLocale(profile) {
    const active = currentLocale();
    if (!profile || profile.locale === active) return;
    updateLocale(active).catch(() => { /* one mail in the other language; not worth saying */ });
}

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    // Through lib/authStorage, which reads the browser-session store before the persistent one
    // and goes through safeStorage either way: the accessor itself throws when a browser blocks
    // site data, and this runs during the first render of the provider that wraps the whole app.
    const [token, setToken] = useState(() => readToken());
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
        // Both stores, whichever this session was using — see lib/authStorage.
        clearSession();
        setToken(null);
        setUser(null);
        queryClient.clear();
    }, [queryClient]);

    /**
     * Load the signed-in viewer, with one retry for a failure that left the session intact.
     *
     * <p><b>This never ends the session, whatever the status.</b> `client.js` is the one judge of
     * that and has already run by the time this catch does: a 401 arriving here means it tried a
     * refresh and the refresh did not succeed. When the backend <em>rejected</em> the refresh
     * token it has already cleared the pair and fired `auth:session-expired`, which the effect
     * below turns into a logout. When the refresh failed for any other reason — offline, a
     * timeout, a 5xx, the endpoint's own 10/min limit — it deliberately left the tokens alone and
     * what surfaces here is still the original 401. Logging out on that threw away a perfectly
     * good refresh token over a blip, undoing the whole of the care client.js takes, and it was
     * the single most common way a remembered session ended.
     *
     * <p>A 403 is not this component's business either. With an entry point answering "no usable
     * credential" with 401, a 403 means an authenticated caller who may not have the thing —
     * nothing a logout improves.
     *
     * <p><b>The retry is not politeness.</b> A null `user` is not a neutral "not loaded yet"
     * state: `ProtectedRoute` reads `isPlatformAdmin(user)`, so an admin whose one profile request
     * lost a race is redirected off every `/admin` route to the home page — from the outside,
     * indistinguishable from being signed out. One more attempt a moment later covers the two
     * failures that actually produce that, both of which answer fast: a 401 whose refresh lost a
     * race, and a 429 from the refresh endpoint's 10/min limit. It deliberately does not cover a
     * timeout — see below.
     */
    const fetchUserProfile = useCallback(async () => {
        try {
            for (let attempt = 0; ; attempt++) {
                try {
                    const res = await api.get('/user/profile');
                    setUser(res.data);
                    syncAccountLocale(res.data);
                    return;
                } catch (err) {
                    // Status only, never the axios error object: its `config.headers.Authorization`
                    // carries the live session JWT, so logging it whole puts a working credential
                    // in the console for any extension, screenshot, or error-reporting hook.
                    console.error('Failed to fetch profile:',
                        err.response?.status ?? err.code ?? 'network error');
                    // Three reasons not to ask again, and the last is about the spinner:
                    //  - the budget is spent;
                    //  - no token left, so client.js has already declared the session over and
                    //    dispatched the event — asking again is a second 401 for nothing;
                    //  - no response at all (offline, or the client's 30s timeout). That attempt
                    //    has ALREADY cost thirty seconds and a second one would cost thirty more,
                    //    with `loading` true and the whole app behind a spinner throughout. The
                    //    failures worth a second try — a 401 whose refresh lost, a 429 from the
                    //    refresh endpoint's own limit — all arrive as a response, and quickly.
                    if (attempt >= PROFILE_RETRY_ATTEMPTS || !err.response || !readToken()) return;
                }
                await new Promise((resolve) => setTimeout(resolve, PROFILE_RETRY_DELAY_MS));
            }
        } finally {
            setLoading(false);
        }
    }, []);

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
    const applySession = useCallback(({ token: newToken, refreshToken }, { remember } = {}) => {
        // `remember` omitted means "whatever this session already is" — the password-change path
        // is handed a replacement pair for a session that already exists, and re-tiering it there
        // would either demote a remembered device or silently promote a browser session.
        storeSession({ token: newToken, refreshToken, remember: remember ?? isRemembered() });
        setToken(newToken);
        // Not `clear()`: anonymous answers already in the cache are not wrong, they are answers
        // to a different question ("what does a signed-out visitor see"). Invalidating marks them
        // stale so every mounted query refetches as the new viewer, without blanking the page the
        // way clear() would. The scope in a user-scoped key is what keeps the two apart.
        queryClient.invalidateQueries();
    }, [queryClient]);

    /**
     * @param rememberMe the viewer ticked "stay logged in". It travels to the backend, which mints
     *                   a refresh token measured in months instead of days, AND decides which
     *                   store the pair goes in here — both halves are needed: a long-lived token
     *                   in sessionStorage still dies with the tab, and a persisted short-lived one
     *                   still expires. Defaults to false, the browser-session tier: a session that
     *                   outlives the browser is something a person opts into.
     */
    const login = async (username, password, rememberMe = false) => {
        try {
            // Through `lib/api/auth` rather than posting the body here, for the reason the
            // register path already does: two spellings of the same body drift, and the one that
            // does not get the new field is the one that breaks.
            const res = await loginRequest(username, password, rememberMe);
            applySession(res.data, { remember: rememberMe });
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: authFailureMessage(error, 'login') };
        }
    };

    // Through `lib/api/auth`'s `register` rather than posting the body here. Both spelled the
    // same object out, and when the backend made `gender` required only one of them would ever
    // have been updated — which is the shape of the bug that made every signup a 400. One
    // definition of the body, in the module whose job is the request.
    const register = async (username, email, password, fullName, gender, acceptedTerms) => {
        try {
            const res = await registerRequest(username, email, password, fullName, gender, acceptedTerms);
            // Remembered, with no box to tick: someone who has just created an account is on a
            // device they chose to create it on, and the alternative — a session that ends when
            // the browser closes — is a worse first day than the signup form asked for. The
            // backend mints the ordinary refresh lifetime for this path, which now slides with
            // use, so an account that gets used never reaches its expiry.
            applySession(res.data, { remember: true });
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            // `error` too, so the form can mark the fields a VALIDATION_FAILED names.
            return { success: false, message: authFailureMessage(error, 'register'), error };
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
