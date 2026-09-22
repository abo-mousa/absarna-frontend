import { currentLocale, t, tOptional } from '@/i18n';

/**
 * The one language the backend ever wrote a reader-facing sentence in, and therefore the only
 * locale in which such a sentence is worth rendering. See {@link serverMessage}.
 */
const BACKEND_LEGACY_LOCALE = 'ar';

/**
 * Any Arabic letter — the test for "was this string written for a reader, or for us?".
 *
 * <p><b>This is now a compatibility shim, and it is worth knowing that before reading it.</b> The
 * backend no longer writes a user-facing sentence anywhere: the rate limiter's 429 sends
 * `RATE_LIMITED`, the four ad-hoc `forbidden()` helpers send `"Forbidden"`, and forgot-password
 * sends no sentence at all. Every refusal is a code the catalog words. What this guards is
 * <b>deploy skew</b> — the window where a new SPA is talking to an older backend that still
 * answers in Arabic — plus anything in that old shape that was missed.
 *
 * <p>The shape it recognises: the backend used to put a user-facing sentence in <b>two different
 * keys</b> depending on which side of it answered, and in one of them the same key held an English
 * technical string:
 *
 * <pre>
 *   answered by                            error                  message
 *   ─────────────────────────────────────  ─────────────────────  ─────────────────────
 *   GlobalExceptionHandler.buildResponse   "Forbidden"            "Access denied"
 *   EmailNotVerified                       "Forbidden"            Arabic
 *   a controller's own forbidden()         «غير مصرح لك»          (absent)   ← gone
 *   RateLimitFilter                        "Too many requests"    Arabic     ← gone
 * </pre>
 *
 * <p>So neither key can simply be preferred. Reading `error` first prints <b>"Forbidden"</b> at an
 * Arabic reader; reading `message` first and trusting it prints "Access denied". What separates the
 * two is not the key but the <b>script</b>: the old backend wrote everything meant for a person in
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
    // Only an Arabic reader is shown a free-text server sentence, and the asymmetry is the rule
    // rather than an oversight: the old backend wrote Arabic FOR PEOPLE and English FOR LOGS, so
    // on any other screen an Arabic body is the wrong language and an English one is a log line.
    // Neither is worth showing. It must never start trusting English.
    //
    // KEYED ON THE LANGUAGE, NOT ON `isRtl()`. Those answer the same today and would part company
    // the moment a second right-to-left language shipped: Urdu and Persian are both written in
    // this script's range, so a direction check would hand an Urdu reader the Arabic sentence and
    // call it a match. The question here is "is this the language the backend's legacy copy was
    // written in", which only the locale can answer — see `i18n/locales.js`.
    if (currentLocale() !== BACKEND_LEGACY_LOCALE) return null;
    const data = error?.response?.data;
    const candidate = data?.message ?? data?.error;
    return typeof candidate === 'string' && ARABIC.test(candidate) ? candidate : null;
}

/**
 * The codes axios sets when the request never reached a server — its own `ERR_NETWORK` plus the
 * Node-style names a transport failure surfaces under. Named rather than inferred, because the
 * only other tell is `request`, and axios does not always attach one.
 */
const TRANSPORT_CODES = new Set([
    'ERR_NETWORK', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN',
]);

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
    //
    // `errors.offline` is a claim about the user's network, so it is made only for the shapes
    // that actually mean one — an axios transport code, the `request` it sets when a call left
    // the browser, or the TypeError `fetch` rejects with. The upload path throws its own `Error`s
    // («Part upload failed (403)» from `putPart`, a part the server would not reissue a URL for)
    // and those carry none of the three. Telling someone to check a connection that is working is
    // a worse answer than «حدث خطأ»: it sends them to fix the one thing that is not broken.
    if (error && !error.response) {
        if (error.code === 'ECONNABORTED') return t('errors.timeout');
        if (error.code === 'ERR_CANCELED') return generic;
        if (TRANSPORT_CODES.has(error.code) || error.request || error instanceof TypeError) {
            return t('errors.offline');
        }
        return generic;
    }

    // The verification gate, before the generic 403 below. The backend's own sentence is English
    // by design and serverMessage drops it, so without this an unverified viewer pressing like or
    // subscribe got «ليس لديك صلاحية» — which reads as "not allowed", not as "finish signing up".
    // The flag is the backend's, set by GlobalExceptionHandler for EmailNotVerifiedException.
    if (error?.response?.data?.emailVerificationRequired) {
        return t('auth.verificationNotice.defaultMessage');
    }

    // A named business reason wins over everything, at any status: it is the only layer that can
    // say *why*, and the sentence it selects is one we wrote.
    const explained = reasonMessage(error);
    if (explained) return explained;

    // Then the server's own sentence, where it wrote one in Arabic and the reader is reading
    // Arabic. Nothing this backend serves reaches here any more — it is what keeps a new SPA
    // legible against an older one during a deploy. See `serverMessage`.
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

/*
 * `isRetryable` lived here, exported, and nothing ever imported it. It went because its body and
 * its own doc comment disagreed about the one status that matters: the comment promised "offline,
 * timeout, or a 5xx" while the body also returned true for 429 — and an automatic retry of a
 * backend 429 spends the next token of the same per-IP bucket, which is the behaviour App.jsx's
 * `shouldRetryQuery` documents as forbidden. A named, exported helper whose comment reads as the
 * safe rule is exactly what someone wires into a retry path without re-reading the body.
 *
 * The two live answers stay where their reasons are. `shouldRetryQuery` (App.jsx) excludes every
 * 4xx, so React Query never retries a 429. `usePresignedUpload`'s own `isRetryable` DOES retry
 * 429, correctly — it talks to object storage, which is a different limiter from the backend's.
 * Two call sites with opposite rules is why this could never have been one shared function.
 */

export default describeError;
