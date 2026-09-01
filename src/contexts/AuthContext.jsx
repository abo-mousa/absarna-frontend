import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    // client.js dispatches this once a token refresh has actually failed (invalid/expired
    // refresh token) — a real "you're logged out", not a generic network blip.
    useEffect(() => {
        const handleSessionExpired = () => {
            logout();
            navigate('/login');
        };
        window.addEventListener('auth:session-expired', handleSessionExpired);
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/user/profile');
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            // Only a 401/403 means the session is actually invalid — a 500, timeout, or
            // offline blip on mount shouldn't destroy an otherwise-valid session.
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (username, email, password, fullName) => {
        try {
            const res = await api.post('/auth/register', {
                username, email, password, fullName
            });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            setToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            token, user, loading, login, register, logout, refreshUser: fetchUserProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);