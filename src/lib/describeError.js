import { t } from '@/i18n';

/**
 * One user-facing sentence for a failed request.
 *
 * <p>Every failed GET used to render the same «حدث خطأ», and every mutation toasted a fixed string,
 * so being offline, hitting the rate limiter, asking for something that no longer exists and a
 * server fault all read identically — and the backend's own Arabic 429 message («يرجى المحاولة
 * لاحقاً»), which the CORS ordering exists to make readable, was shown in eight places and dropped
 * everywhere else.
 *
 * <p>`fallback` is the caller's own wording for the ordinary failure («فشل حذف التعليق»), kept for
 * every status where it is the more specific message. Offline and 429 override it: what to do
 * next is different in those two cases, and that is what the sentence is for.
 *
 * @param error    an axios error, or anything thrown
 * @param fallback the caller's generic message; defaults to the catalog's
 */
export function describeError(error, fallback) {
    const status = error?.response?.status;
    const generic = fallback || t('errors.generic');

    // Axios leaves `response` undefined for anything that never got an answer: offline, DNS,
    // a timeout, a CORS refusal. `ECONNABORTED` is its timeout code.
    if (error && !error.response) {
        if (error.code === 'ECONNABORTED') return t('errors.timeout');
        if (error.code === 'ERR_CANCELED') return generic;
        return t('errors.offline');
    }

    if (status === 429) {
        // The backend writes the user-facing half of its 429 body in Arabic; prefer it.
        return error.response?.data?.message || t('errors.rateLimited');
    }
    if (status === 404) return fallback || t('errors.notFound');
    if (status === 403) return fallback || t('errors.forbidden');
    if (status >= 500) return fallback || t('errors.server');
    return generic;
}

/** True when the failure is the kind a retry could change — offline, timeout, or a 5xx. */
export function isRetryable(error) {
    if (!error) return false;
    if (!error.response) return error.code !== 'ERR_CANCELED';
    const status = error.response.status;
    return status >= 500 || status === 429;
}

export default describeError;
