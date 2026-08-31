import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import ChannelPage from './pages/ChannelPage';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import Subscriptions from './pages/Subscriptions';
import SearchPage from './pages/SearchPage';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Biography from './pages/Biography';
import VideoDetail from './pages/VideoDetail';
import AdminChannels from './pages/AdminChannels';
import CreateChannel from './pages/CreateChannel';
import ChannelManage from './pages/ChannelManage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000,
            cacheTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
        },
    },
});

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'var(--bg)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return token ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    return (
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

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route path="/profile" element={
                <ProtectedRoute><UserProfile /></ProtectedRoute>
            } />
            <Route path="/subscriptions" element={
                <ProtectedRoute><Subscriptions /></ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute><Admin /></ProtectedRoute>
            } />
            <Route path="/admin/channels" element={
                <ProtectedRoute><AdminChannels /></ProtectedRoute>
            } />
            <Route path="/create-channel" element={
                <ProtectedRoute><CreateChannel /></ProtectedRoute>
            } />
            <Route path="/channel/:slug/manage" element={
                <ProtectedRoute><ChannelManage /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;