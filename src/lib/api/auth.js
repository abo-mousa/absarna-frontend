import api from './client';

export const login = (username, password) =>
    api.post('/auth/login', { username, password });

export const register = (username, email, password, fullName) =>
    api.post('/auth/register', { username, email, password, fullName });

export const getProfile = () => api.get('/user/profile');

export const updateProfile = (profile) => api.put('/user/profile', profile);

export const verifyEmail = (token) => api.post('/auth/verify-email', { token });

export const resendVerification = () => api.post('/auth/resend-verification');

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword });

export const changePassword = (currentPassword, newPassword) =>
    api.post('/user/change-password', { currentPassword, newPassword });
