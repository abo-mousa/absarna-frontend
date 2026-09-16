import { t } from '@/i18n';
import { describeError } from './describeError';

/**
 * The sentence a login or registration form shows when the request fails.
 *
 * <p>The forms used to render `error.response.data.message` verbatim with an English fallback
 * ('Login failed'). The backend's messages are English too («Invalid credentials», Bean Validation
 * text), so the one place a visitor is most likely to see an error was the one place the Arabic UI
 * spoke English.
 *
 * <p>This function is now only the two answers `describeError` cannot give — the ones that depend
 * on <i>which form</i> asked — and everything else is delegated. It used to end with
 * `data.message || generic`, on the reasoning that for a 400 the server's own text is the only
 * thing that says which field was wrong. <b>That reasoning was wrong in exactly the case it was
 * written for.</b> A 400 from these endpoints is a Bean Validation failure, and its `message` is
 * the constraint's English string — "Gender is required", "Must be a valid email address" — so the
 * branch meant to be the most helpful was the one guaranteed to print English at an Arabic reader.
 * There was no 400 branch above it to stop that, and registration returns one for every missing
 * required field.
 *
 * <p>`describeError` already decides this correctly and in one place: a `reason` code first, then
 * the server's sentence <i>only when it contains an Arabic letter</i>, then our own copy. An
 * English validation string fails that test and falls through to «تعذر إنشاء الحساب», which says
 * less but is at least in the reader's language — and the fields it could have named are validated
 * on this side before submit anyway (see `lib/validation.js` and Register's own checks).
 *
 * @param error an axios error
 * @param kind  `'login'` | `'register'`
 */
export function authFailureMessage(error, kind) {
    const status = error?.response?.status;
    const generic = t(`auth.${kind}.failed`);

    // The form-specific readings, first because they are more specific than anything a status can
    // say on its own: a 401 here is a wrong password, not an expired session, and a 409 on signup
    // is a name someone else has.
    if (kind === 'login' && (status === 401 || status === 403)) return t('auth.login.invalidCredentials');
    if (kind === 'register' && status === 409) return t('auth.register.taken');
    // Kept ahead of the delegation: `describeError` prefers the caller's fallback at 5xx, and
    // «تعذر تسجيل الدخول» would blame the credentials for the server being down.
    if (status >= 500) return t('errors.server');

    // Offline, timeouts, 429, a named `reason`, and an Arabic sentence the server wrote — all of
    // it already lives there, worded once.
    return describeError(error, generic);
}

export default authFailureMessage;
