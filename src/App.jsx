import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { STANDARD } from '@/lib/queryCache';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { isPlatformAdmin } from '@/lib/user';
import { safeSessionStorage } from '@/lib/safeStorage';
import ErrorBoundary from './components/ErrorBoundary';
import { Spinner } from './components/ui';
import { t } from '@/i18n';

const Home = lazy(() => import('./pages/Home'));
const ChannelPage = lazy(() => import('./pages/ChannelPage'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
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
const CreateChannel = lazy(() => import('./pages/CreateChannel'));
const ChannelManage = lazy(() => import('./pages/ChannelManage'));
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
 * The flag that stops a reload loop.
 *
 * <p>Session storage, not local: it should survive the one reload this handler performs and
 * nothing beyond the tab. Through `safeSessionStorage`, because a browser blocking site data
 * throws on the accessor — and the failure mode without the flag is an infinite reload, which is
 * far worse than not reloading at all.
 */
const PRELOAD_RELOAD_FLAG = 'absarna.preload-reload';

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
 * fetches a fresh `index.html` naming the new chunks. Guarded by a flag so a preload error with
 * some *other* cause — the chunk genuinely missing, a proxy serving HTML for a JS request —
 * cannot turn into an endless reload loop; the second failure is left to surface as an error the
 * boundary above can show.
 *
 * <p>The flag is cleared on a successful load, so the next deploy gets its own single reload.
 * Requires the deploy to serve `index.html` as `no-cache` — see CLAUDE.md's deploy notes.
 */
const usePreloadErrorReload = () => {
    useEffect(() => {
        safeSessionStorage.removeItem(PRELOAD_RELOAD_FLAG);
        const handler = (event) => {
            event.preventDefault();
            if (safeSessionStorage.getItem(PRELOAD_RELOAD_FLAG)) return;
            safeSessionStorage.setItem(PRELOAD_RELOAD_FLAG, '1');
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

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // Without this, focus stays wherever it was on the previous page (e.g. a nav link) —
        // keyboard/screen-reader users get no indication a new page loaded and have to
        // manually navigate back to the top of the DOM every time.
        document.getElementById('main-content')?.focus();
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
                <Route path="/create-channel" element={
                    <ProtectedRoute><CreateChannel /></ProtectedRoute>
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
                <BrowserRouter>
                    <ToastProvider>
                        <AuthProvider>
                            <AppRoutes />
                        </AuthProvider>
                    </ToastProvider>
                </BrowserRouter>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;