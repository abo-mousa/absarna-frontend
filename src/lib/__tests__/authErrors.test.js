import { describe, expect, it } from 'vitest';
import { authFailureMessage } from '@/lib/authErrors';
import { t } from '@/i18n';

/** An axios-shaped rejection. */
const failure = (status, data) => ({ response: { status, data } });

/**
 * Which sentence the login and registration forms show.
 *
 * <p>The case that prompted this: the backend made `RegisterRequest.gender` `@NotNull`, so every
 * signup came back `400 {"message":"Gender is required"}` — and this function's last line handed
 * that English string straight to an Arabic screen, because the only 400 branch was the fallback
 * that trusted `data.message` unconditionally.
 */
describe('authFailureMessage', () => {
    it('never shows an English validation message from a 400', () => {
        expect(authFailureMessage(failure(400, { message: 'Gender is required' }), 'register'))
            .toBe(t('auth.register.failed'));
        expect(authFailureMessage(failure(400, { error: 'Must be a valid email address' }), 'register'))
            .toBe(t('auth.register.failed'));
    });

    it('still shows a 400 the backend wrote in Arabic', () => {
        // The half that must not be lost by fixing the above: the rule is the script, not the
        // status — see describeError's ARABIC test.
        expect(authFailureMessage(failure(400, { message: 'كلمة المرور ضعيفة' }), 'register'))
            .toBe('كلمة المرور ضعيفة');
    });

    it('words a named reason code at any status', () => {
        expect(authFailureMessage(failure(400, { reason: 'CURRENT_PASSWORD_INVALID' }), 'login'))
            .toBe(t('errors.reasons.CURRENT_PASSWORD_INVALID'));
    });

    it('keeps the form-specific readings', () => {
        expect(authFailureMessage(failure(401, {}), 'login')).toBe(t('auth.login.invalidCredentials'));
        expect(authFailureMessage(failure(403, {}), 'login')).toBe(t('auth.login.invalidCredentials'));
        expect(authFailureMessage(failure(409, {}), 'register')).toBe(t('auth.register.taken'));
    });

    it('blames the server for a 5xx rather than the credentials', () => {
        expect(authFailureMessage(failure(500, { message: 'Internal server error' }), 'login'))
            .toBe(t('errors.server'));
    });

    it('delegates the offline and rate-limited cases', () => {
        expect(authFailureMessage({ code: 'ERR_NETWORK' }, 'login')).toBe(t('errors.offline'));
        expect(authFailureMessage({ code: 'ECONNABORTED' }, 'login')).toBe(t('errors.timeout'));
        expect(authFailureMessage(failure(429, {}), 'register')).toBe(t('errors.rateLimited'));
    });
});
