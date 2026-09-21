import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { STANDARD } from '@/lib/queryCache';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConsentProvider } from './contexts/ConsentContext';
import { isPlatformAdmin } from '@/lib/user';
import { safeSessionStorage } from '@/lib/safeStorage';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { PRELOAD_RELOAD_FLAG, mayReloadAfterPreloadError } from '@/lib/preloadReload';
import ErrorBoundary from './components/ErrorBoundary';
import { Spinner } from './components/ui';
import { t } from '@/i18n';

const Home = lazy(() => import('./pages/Home'));
const ChannelPage = lazy(() => import('./pages/ChannelPage'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const YouTubeOAuthCallback = lazy(() => import('./pages/YouTubeOAuthCallback'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const History = lazy(() => import('./pages/History'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const Books = lazy(() => import('./pages/Books'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const Articles = lazy(() => import('./pages/Articles'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Biography = lazy(() => import('./pages/Biography'));
const SeriesDetail = lazy(() => import('./pages/SeriesDetail'));
const VideoDetail = lazy(() => import('./pages/VideoDetail'));
const AdminChannels = lazy(() => import('./pages/AdminChannels'));
const AdminReview = lazy(() => import('./pages/AdminReview'));
const AdminReports = lazy(() => import('./pages/AdminReports'));
const CreateChannel = lazy(() => import('./pages/CreateChannel'));
const ChannelManage = lazy(() => import('./pages/ChannelManage'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Whether a failed request is worth retrying.
 *
 * <p>The default was a flat `retry: 1`, which retries everything — so a 404 detail page (an
 * item that was deleted, or that this viewer may not see, which is the same 404 by design)
 * sat through a request, a backoff delay and a second request before rendering "not found".
 * A 4xx is the server's considered answer and asking again cannot change it; a 5xx, a timeout
 * and an offline blip genuinely can.
 *
 * <p>429 is deliberately in the *not* retried set even though it is transient: the backend's
 * limiter is per-IP and per-rule, so an automatic retry spends the next token of the same
 * bucket and makes the situation it is reacting to worse. `describeError` tells the user to
 * wait instead.
 *
 * <p>Exported for the test, and because the rule is easier to reason about named.
 */
export const shouldRetryQuery = (failureCount, error) => {
    const status = error?.response?.status;
    if (status >= 400 && status < 500) return false;
    return failureCount < 1;
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // STANDARD, not a hand-picked pair of numbers — see lib/queryCache.js.
            //
            // This used to be staleTime 10min AND refetchOnMount:false, which together mean stale
            // data is never refetched: navigating away and back showed exactly what you left, for
            // as long as the tab lived. That is what made the home page look frozen.
            ...STANDARD,
            gcTime: 30 * 60 * 1000,
            // Deliberately still off: reshuffling the page under someone who just tabbed back is
            // disorienting in a way that refreshing on navigation is not.
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: shouldRetryQuery,
        },
        mutations: {
            // A mutation is not idempotent in general — a comment, a like, a publish — so a
            // blind retry can double-apply it. Left at none, stated rather than defaulted.
            retry: false,
        },
    },
});

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { token, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg">
                <Spinner />
            </div>
        );
    }

    // `replace`, so the guarded URL does not stay in history: without it, pressing Back from the
    // login form returns to the page that just bounced you, which bounces you again — the
    // browser's Back button becomes inert. `state.from` is what lets Login send the visitor back
    // to what they asked for instead of dropping them on the home page; it is validated on the
    // way out by `safeInternalPath`, never trusted as a destination on sight.
    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }
    if (adminOnly && !isPlatformAdmin(user)) return <Navigate to="/" replace />;
    return children;
};

const RouteFallback = () => (
    <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner />
    </div>
);

/**
 * Recovers from a lazy chunk that 404s.
 *
 * <p>Every page here is `React.lazy`, so the running app holds hashed filenames for chunks it has
 * not fetched yet. A deploy replaces those files, and a tab left open from before it then asks
 * for a filename that no longer exists: the import rejects, Suspense has nothing to render, and
 * the visitor sees a blank route with a console error. This is not rare — it is *every* open tab
 * after *every* deploy, and it is why "it broke until I refreshed" is the classic SPA report.
 *
 * <p>Vite emits `vite:preloadError` for exactly this. One reload fixes it, because the reload
 * fetches a fresh `index.html` naming the new chunks. Requires the deploy to serve `index.html`
 * as `no-cache` — see CLAUDE.md's deploy notes.
 *
 * <h4>How the loop is actually bounded</h4>
 *
 * <p>By a <b>timestamp in session storage that is never cleared by this hook</b>, and a refusal to
 * reload again within `PRELOAD_RELOAD_COOLDOWN_MS` of the one it records. Nothing here runs on
 * mount, which is the entire fix: the previous version cleared its flag on mount and set it just
 * before reloading, and since the reload remounts the app the clear undid the set every time. The
 * flag was never once read as set, so a permanently missing chunk reloaded until the tab was
 * closed. `lib/preloadReload.js` holds the rule and the reasoning.
 *
 * <p><b>`preventDefault()` only when we are actually reloading.</b> Vite rethrows the preload
 * error unless the event is cancelled, and that throw is what rejects the `React.lazy` import and
 * puts the failure in front of the error boundary. Cancelling unconditionally — as this did —
 * swallowed the error on the suppressed path too, so a chunk that stayed missing produced a route
 * that rendered nothing at all and reported nothing either. Left uncancelled, the second failure
 * surfaces as the boundary's error screen, which is the outcome the guard exists to reach.
 */
const usePreloadErrorReload = () => {
    useEffect(() => {
        const handler = (event) => {
            const now = Date.now();
            if (!mayReloadAfterPreloadError(safeSessionStorage.getItem(PRELOAD_RELOAD_FLAG), now)) return;
            event.preventDefault();
            safeSessionStorage.setItem(PRELOAD_RELOAD_FLAG, String(now));
            window.location.reload();
        };
        window.addEventListener('vite:preloadError', handler);
        return () => window.removeEventListener('vite:preloadError', handler);
    }, []);
};

function AppRoutes() {
    const location = useLocation();
    const isFirstRender = useRef(true);
    usePreloadErrorReload();
    useScrollRestoration();

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Without this, focus stays wherever it was on the previous page (e.g. a nav link) —
        // keyboard/screen-reader users get no indication a new page loaded and have to
        // manually navigate back to the top of the DOM every time.
        // preventScroll: focusing can scroll the element into view, which would undo a restored
        // scroll position on Back (useScrollRestoration) or move a page that was just sent to the top.
        document.getElementById('main-content')?.focus({ preventScroll: true });
    }, [location.pathname]);

    return (
        // Keyed on the pathname so a page that throws does not latch the boundary for the rest of
        // the session: navigating anywhere else remounts it clean. The outer boundary in main.jsx
        // stays as the last resort for a throw outside the router, where "back home" would not be
        // a navigation at all.
        <ErrorBoundary
            resetKey={location.pathname}
            action={<Link
                to="/"
                style={{
                    padding: '12px 24px', borderRadius: '8px', fontFamily: 'inherit',
                    background: 'transparent', color: '#1a56db', textDecoration: 'none',
                }}
            >{t('common.backHome')}</Link>}
        >
        <Suspense fallback={<RouteFallback />}>
            <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/channel/:slug" element={<ChannelPage />} />
                <Route path="/video/:id" element={<VideoDetail />} />
                <Route path="/books" element={<Books />} />
                <Route path="/books/:id" element={<BookDetail />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:id" element={<ArticleDetail />} />
                <Route path="/biography" element={<Biography />} />
                <Route path="/series/:id" element={<SeriesDetail />} />

                {/* Legal / contact. Public and unauthenticated on purpose: a takedown notice comes
                    from someone who does not have an account here and never will, and a privacy
                    policy behind a login is not a privacy policy. Linked from the footer, which
                    PageShell renders on every page. */}
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected */}
                <Route path="/profile" element={
                    <ProtectedRoute><UserProfile /></ProtectedRoute>
                } />
                <Route path="/subscriptions" element={
                    <ProtectedRoute><Subscriptions /></ProtectedRoute>
                } />
                <Route path="/history" element={
                    <ProtectedRoute><History /></ProtectedRoute>
                } />
                <Route path="/bookmarks" element={
                    <ProtectedRoute><Bookmarks /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
                } />
                <Route path="/admin/channels" element={
                    <ProtectedRoute adminOnly><AdminChannels /></ProtectedRoute>
                } />
                {/* adminOnly here mirrors @PreAuthorize("hasRole('PLATFORM_ADMIN')") on the
                    backend. The route guard only hides the screen; the endpoint is what actually
                    refuses, which is the half that matters. */}
                <Route path="/admin/review" element={
                    <ProtectedRoute adminOnly><AdminReview /></ProtectedRoute>
                } />
                {/* The old path, kept as a redirect rather than deleted. The page reviews every
                    detector now and the URL said music; renaming it without this would 404 an
                    admin's bookmark, on the one screen whose whole job is that held uploads do not
                    sit unseen. */}
                <Route path="/admin/music-review" element={<Navigate to="/admin/review" replace />} />
                {/* Viewer reports. Platform admin like the review queue and unlike comment
                    moderation, which is channel-scoped — a report is frequently ABOUT the channel
                    that would otherwise be judging it. `adminOnly` mirrors the backend's
                    @PreAuthorize; the endpoint is the half that actually refuses. */}
                <Route path="/admin/reports" element={
                    <ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>
                } />
                <Route path="/create-channel" element={
                    <ProtectedRoute><CreateChannel /></ProtectedRoute>
                } />
                {/* Google's redirect after "verify with Google". The path is registered on the OAuth
                    client verbatim (YOUTUBE_OAUTH_REDIRECT_URI), so it must not move. */}
                <Route path="/youtube/oauth/callback" element={
                    <ProtectedRoute><YouTubeOAuthCallback /></ProtectedRoute>
                } />
                <Route path="/channel/:slug/manage" element={
                    <ProtectedRoute><ChannelManage /></ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
        </ErrorBoundary>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                {/* ABOVE the router: the gate is read by a card on every route and by the footer's
                    withdrawal link, and the banner is site-wide. Above ToastProvider too, so that
                    nothing below it can render a Google request before the decision is loaded. */}
                <ConsentProvider>
                    <BrowserRouter>
                        <ToastProvider>
                            <AuthProvider>
                                <AppRoutes />
                            </AuthProvider>
                        </ToastProvider>
                    </BrowserRouter>
                </ConsentProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;