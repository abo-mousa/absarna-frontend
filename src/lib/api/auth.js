import api from './client';

export const login = (username, password) =>
    api.post('/auth/login', { username, password });

export const register = (username, email, password, fullName) =>
    api.post('/auth/register', { username, email, password, fullName });

export const getProfile = () => api.get('/user/profile');

export const updateProfile = (profile) => api.put('/user/profile', profile);
