import { t, tOptional } from '@/i18n';

/**
 * Any Arabic letter — the test for "was this string written for a reader, or for us?".
 *
 * <p>The backend puts a user-facing sentence in <b>two different keys</b> depending on which side
 * of it answered, and in one of them the same key holds an English technical string:
 *
 * <pre>
 *   answered by                            error                  message
 *   ─────────────────────────────────────  ─────────────────────  ─────────────────────
 *   GlobalExceptionHandler.buildResponse   "Forbidden"            "Access denied"
 *   EmailNotVerified / RateLimitFilter     "Too many requests"    Arabic
 *   a controller's own forbidden()         «غير مصرح لك»          (absent)
 * </pre>
 *
 * <p>So neither key can simply be preferred. Reading `error` first prints <b>"Forbidden"</b> at an
 * Arabic reader; reading `message` first and trusting it prints "Access denied". What separates the
 * two is not the key but the <b>script</b>: this backend writes everything meant for a person in
 * Arabic and everything meant for a log in English. Testing for that is one regex, and it fails
 * safe in both directions — an English body falls through to our own copy, and a body shape nobody
 * anticipated cannot put internals on the screen.
 */
// Escapes rather than literal characters: the ranges below include formatting and zero-width
// codepoints that would be invisible in this source. U+FEFF (BOM) is deliberately excluded from
// the last range — a stray BOM is not a sentence.
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/;

/**
 * The Arabic sentence for a `reason` code the backend sent — otherwise `null`.
 *
 * <p><b>This is where a refusal with a business reason gets explained.</b> «غير مصرح لك» on the
 * import button was true of nothing: the caller was the channel's owner and was authorised, and
 * the channel simply had not been reviewed yet. Nothing in the response said so, because the only
 * thing the response could say was its status.
 *
 * <p>The backend now names the situation — `reason: "CHANNEL_REJECTED"` — and this side words it,
 * which is the split that keeps all copy in one catalog. `tOptional` rather than `t` because the
 * key comes from data rather than from source: <b>a code with no entry here is an expected answer,
 * not a bug</b>, and falls through to the generic sentence for that status. That is what makes the
 * two repos safe to deploy separately — drift costs a specific sentence, never a broken screen —
 * and it is why nothing warns.
 *
 * <p>Applied at <b>every</b> status, unlike the raw-body fallback below. A code selects a sentence
 * we wrote, so it cannot leak internals the way a 5xx body can — and a 503 is exactly where the
 * generic «حدث خلل في الخادم» is least useful, since an unconfigured YouTube key is not a fault
 * anyone should sit and wait out.
 */
export function reasonMessage(error) {
    const reason = error?.response?.data?.reason;
    if (typeof reason !== 'string' || !reason) return null;
    return tOptional(`errors.reasons.${reason}`) ?? null;
}

/**
 * The server's own sentence, when it wrote one for the reader — otherwise `null`.
 *
 * <p>`message` wins where both keys exist, because the only bodies carrying both put the English
 * in `error`. Where there is no `message` at all, `error` is the whole answer.
 */
export function serverMessage(error) {
    const data = error?.response?.data;
    const candidate = data?.message ?? data?.error;
    return typeof candidate === 'string' && ARABIC.test(candidate) ? candidate : null;
}

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
 * every status where it is the more specific message. Offline, and any 4xx the server explained
 * itself, override it: what to do next is different in those cases, and that is what the sentence
 * is for.
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

    // A named business reason wins over everything, at any status: it is the only layer that can
    // say *why*, and the sentence it selects is one we wrote.
    const explained = reasonMessage(error);
    if (explained) return explained;

    // Then the server's own sentence, where it wrote one in Arabic. Covers what predates the
    // reason codes — a controller's ad-hoc `forbidden()`, and the rate limiter's 429.
    //
    // Deliberately not extended to 5xx: there the server knows only that it broke, and
    // `buildResponse`'s text for those ("Internal server error") is ours to keep out of sight.
    if (status >= 400 && status < 500) {
        const written = serverMessage(error);
        if (written) return written;
    }

    if (status === 429) return t('errors.rateLimited');
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
