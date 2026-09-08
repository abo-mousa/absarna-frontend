import { t } from '@/i18n';
import { describeError } from './describeError';

/**
 * The sentence a login or registration form shows when the request fails.
 *
 * <p>The forms used to render `error.response.data.message` verbatim with an English fallback
 * ('Login failed'). The backend's messages are English too («Invalid credentials», Bean Validation
 * text), so the one place a visitor is most likely to see an error was the one place the Arabic UI
 * spoke English. Known statuses map to catalog strings first; the server's own message is the last
 * resort, since for a 400 it is the only thing that says <i>which</i> field was wrong.
 *
 * @param error an axios error
 * @param kind  `'login'` | `'register'`
 */
export function authFailureMessage(error, kind) {
    const status = error?.response?.status;
    const generic = t(`auth.${kind}.failed`);

    if (error && !error.response) return describeError(error, generic);
    if (status === 429) return describeError(error, generic);
    if (kind === 'login' && (status === 401 || status === 403)) return t('auth.login.invalidCredentials');
    if (kind === 'register' && status === 409) return t('auth.register.taken');
    if (status >= 500) return t('errors.server');

    return error?.response?.data?.message || generic;
}

export default authFailureMessage;
