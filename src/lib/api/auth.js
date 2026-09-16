import api from './client';

export const login = (username, password) =>
    api.post('/auth/login', { username, password });

/**
 * The one definition of the signup body.
 *
 * <p>`gender` is REQUIRED — `RegisterRequest.gender` is `@NotNull` and its enum has exactly two
 * values (`MALE`/`FEMALE`), so omitting it makes every signup a 400 whose only explanation is an
 * English Bean Validation string. That is precisely how it broke: this module and `AuthContext`
 * each spelled the body out, so the field could be added on one side of the app and not the
 * other. `AuthContext.register` now calls this rather than posting its own object, so there is
 * one place a new required field has to be added.
 *
 * <p>`country` is deliberately NOT here even though `RegisterRequest` accepts it: it is optional
 * on that side on purpose, and a 250-entry dropdown is the most expensive control a signup form
 * can carry. `ProfileUpdateRequest` is where a country is meant to be set.
 *
 * <p>`acceptedTerms` is required and is NOT defaulted to `true` here. Sending it unconditionally
 * from this layer would satisfy the server's @AssertTrue for every caller and turn the stamped
 * `users.terms_accepted_at` into a record of nothing — the column is only worth the row it
 * occupies if the value travelled from a box a person actually ticked.
 */
export const register = (username, email, password, fullName, gender, acceptedTerms) =>
    api.post('/auth/register', { username, email, password, fullName, gender, acceptedTerms });

export const getProfile = () => api.get('/user/profile');

export const updateProfile = (profile) => api.put('/user/profile', profile);

export const verifyEmail = (token) => api.post('/auth/verify-email', { token });

export const resendVerification = () => api.post('/auth/resend-verification');

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword });

export const changePassword = (currentPassword, newPassword) =>
    api.post('/user/change-password', { currentPassword, newPassword });
