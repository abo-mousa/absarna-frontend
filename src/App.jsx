import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { isPlatformAdmin } from '@/lib/user';
import { Spinner } from './components/ui';

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
const CreateChannel = lazy(() => import('./pages/CreateChannel'));
const ChannelManage = lazy(() => import('./pages/ChannelManage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
        },
    },
});

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { token, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg">
                <Spinner />
            </div>
        );
    }

    if (!token) return <Navigate to="/login" />;
    if (adminOnly && !isPlatformAdmin(user)) return <Navigate to="/" />;
    return children;
};

const RouteFallback = () => (
    <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner />
    </div>
);

function AppRoutes() {
    const location = useLocation();
    const isFirstRender = useRef(true);

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
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ToastProvider>
                    <AuthProvider>
                        <AppRoutes />
                    </AuthProvider>
                </ToastProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;