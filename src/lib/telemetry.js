import {
    ErrorsInstrumentation,
    LogLevel,
    WebVitalsInstrumentation,
    initializeFaro,
} from '@grafana/faro-web-sdk';

/**
 * Real-user monitoring, and deliberately a thin one.
 *
 * A SPA has no /actuator/prometheus to scrape, so the mechanism here is different from the other
 * two repos even though the discipline is the same one (`absarna-backend/OBSERVABILITY.md`):
 * report what a human would act on, count everything else, and never ship a line per event.
 *
 * ## Why this exists at all
 *
 * One failure in particular is invisible without it, and it is not hypothetical. **hls.js fetches
 * playlists and segments over XHR, so a missing CORS policy on the media bucket breaks playback in
 * every browser except Safari** — whose native HLS player does not use the CORS path. MinIO's CORS
 * is permissive, so local development passes; Safari passes; a reviewer on a Mac passes. It fails
 * in Chrome and Firefox, for real users, and `infra/README.md` says plainly that **no test in any
 * repo can catch it**. The backend cannot see it either: it mints the URL and serves none of the
 * bytes, so from its side a totally broken playback session is a successful request.
 *
 * This is the only thing on the platform that can report that failure.
 *
 * ## Not chatty
 *
 * - **Console capture is off.** Faro will ship every `console.log` by default. That is the SPA's
 *   version of an access log: enormous volume restating things nobody asked a question about.
 * - **Fatal errors only** from the player. hls.js emits non-fatal errors continuously during normal
 *   playback — a dropped segment it re-fetched, a gap it jumped. Reporting those would mean a
 *   report per viewer per minute for a video that played perfectly.
 * - **Deduplicated** by signature, per session. A decode error in a render loop fires hundreds of
 *   times a second; the first is informative and the rest are the same fact.
 * - **No tracing instrumentation.** The Faro tracing bundle is a large download to answer a
 *   question two services and one hop do not have.
 *
 * ## Privacy
 *
 * This sends data to a third party, so what it sends is a decision rather than a default.
 * `reportRequestFailure` forwards a **`requestId` and a status**, never a response body, never a
 * token, and never a URL with a query string — a presigned URL is a bearer credential for its
 * whole TTL, and media URLs pass through this app constantly. The same rule as the backend's:
 * never log one.
 *
 * The `requestId` is what makes this worth having rather than merely reassuring: it is the exact id
 * the backend stamped on that request's log lines, so a Faro error links to the server-side story
 * of the same failure.
 */

// Blank in development and in any deploy that has not configured it. Absence disables the whole
// module rather than erroring — a frontend must not fail to boot because telemetry is unconfigured.
const FARO_URL = import.meta.env.VITE_FARO_URL || '';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';

let faro = null;

/** Signatures already reported this page load. See "Deduplicated" above. */
const reported = new Set();

/** Bounded so a pathological loop generating unique messages cannot grow this without limit. */
const MAX_DISTINCT_REPORTS = 50;

const alreadyReported = (signature) => {
    if (reported.has(signature)) return true;
    if (reported.size >= MAX_DISTINCT_REPORTS) return true;
    reported.add(signature);
    return false;
};

export function initTelemetry() {
    if (!FARO_URL || faro) return;

    try {
        faro = initializeFaro({
            url: FARO_URL,
            app: { name: 'absarna-frontend', version: APP_VERSION },

            // Listed one by one, NOT getWebInstrumentations(). That helper turns on the whole
            // default bundle — including ConsoleInstrumentation, which ships every console call,
            // and SessionInstrumentation. Naming them means a future Faro release cannot quietly
            // start collecting something new on the next `npm update`.
            instrumentations: [
                // Uncaught exceptions and unhandled promise rejections. The baseline.
                new ErrorsInstrumentation(),
                // LCP/CLS/INP. A handful of numbers per page load, not per event — and the only
                // way to answer DESIGN.md's "measure it, don't guess" about mobile playback.
                new WebVitalsInstrumentation(),
                // Deliberately absent: ConsoleInstrumentation (volume), TracingInstrumentation
                // (a large download for a question two services and one hop do not have).
            ],

            batching: {
                // Batched rather than one request per event. The default is already batched; this
                // states it, because a per-event beacon from every viewer is the exact shape of
                // "overloading the logging service" that this whole exercise exists to avoid.
                enabled: true,
                sendTimeout: 5_000,
            },
        });
    } catch {
        // Telemetry must never break the app. A blocked endpoint, an ad blocker eating the script,
        // a CSP that does not allow the host — all of them end here and the SPA carries on.
        faro = null;
    }
}

/**
 * A fatal playback failure. The one report this module is really for.
 *
 * @param {object} detail
 * @param {string} detail.type    hls.js error type, e.g. 'networkError'
 * @param {string} detail.details hls.js error detail, e.g. 'manifestLoadError'
 * @param {number} [detail.videoId]
 */
export function reportPlaybackError({ type, details, videoId }) {
    if (!faro) return;

    // Type and details ONLY — never the URL hls.js was fetching. That URL is a media key, and on
    // the masters path a presigned one; neither belongs in a third party's log.
    const signature = `hls:${type}:${details}`;
    if (alreadyReported(signature)) return;

    try {
        faro.api.pushEvent('playback_failed', {
            type: String(type ?? 'unknown'),
            details: String(details ?? 'unknown'),
            videoId: videoId == null ? '' : String(videoId),
        });
    } catch {
        // ignore
    }
}

/**
 * A failed API call, carrying the backend's own correlation id.
 *
 * <p>Called from the axios response interceptor for server faults only. **4xx is deliberately not
 * reported**: a 401 on an expired token, a 404 on a deleted video and a 403 on someone else's
 * channel are all ordinary, expected, and already counted server-side in
 * `http_server_requests`. Shipping them would be the frontend re-creating exactly the log spam
 * that `GlobalExceptionHandler` was fixed to stop producing.
 */
export function reportRequestFailure({ status, requestId, method, path }) {
    if (!faro) return;

    const signature = `http:${status}:${method}:${path}`;
    if (alreadyReported(signature)) return;

    try {
        faro.api.pushEvent('request_failed', {
            status: String(status ?? 0),
            // The join back to the server's logs. `{service="absarna-backend"} |= "<requestId>"`
            // in Loki returns everything that request did on the way to failing.
            requestId: requestId ?? '',
            method: String(method ?? ''),
            // The TEMPLATE path where possible, never the full URL: no query string, so no token
            // and no presigned URL can ride along.
            path: String(path ?? ''),
        });
    } catch {
        // ignore
    }
}

/** An uncaught render error, from the existing ErrorBoundary. */
export function reportBoundaryError(error, componentStack) {
    if (!faro) return;

    const signature = `boundary:${error?.name}:${error?.message}`;
    if (alreadyReported(signature)) return;

    try {
        faro.api.pushLog([String(error?.message ?? 'unknown render error')], {
            level: LogLevel.ERROR,
            context: { componentStack: String(componentStack ?? '').slice(0, 2000) },
        });
    } catch {
        // ignore
    }
}
