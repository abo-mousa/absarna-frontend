import { safeSessionStorage } from '@/lib/safeStorage';

/**
 * "Verify with Google" — the pure half of the round trip through Google's consent screen.
 *
 * <p>The flow leaves the SPA entirely: the panel asks the backend for Google's consent URL, the
 * browser navigates there, and Google sends it back to `/youtube/oauth/callback?code=…&state=…`.
 * The callback page posts both to the backend with the owner's own token. The channel comes back
 * from the backend (it is inside the signed `state`), so nothing here is trusted to name it — the
 * slug remembered below is only for the "back" link when the owner cancels on Google's side and
 * there is no `state` to redeem.
 */

const RETURN_SLUG_KEY = 'absarna.youtubeOAuthReturnSlug';

/**
 * What Google put on the callback URL.
 *
 * `access_denied` is the owner pressing Cancel, which is a choice rather than a failure and gets
 * its own wording. Any other `error` is Google refusing for a reason of its own.
 */
export function readOAuthCallback(params) {
    const error = params?.get?.('error');
    if (error === 'access_denied') return { kind: 'denied' };
    if (error) return { kind: 'error', error };
    const code = params?.get?.('code');
    const state = params?.get?.('state');
    if (!code || !state) return { kind: 'missing' };
    return { kind: 'complete', code, state };
}

/**
 * Only ever navigate to Google's own consent endpoint.
 *
 * <p>The URL comes from our backend, but `window.location.assign` on an arbitrary string is an open
 * redirect waiting for one bug on the other side; checking the origin costs a line.
 */
export function isGoogleConsentUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname === 'accounts.google.com';
    } catch {
        return false;
    }
}

/** The manage page's YouTube tab — where the owner started and where they return. */
export function manageYouTubePath(slug) {
    return `/channel/${encodeURIComponent(slug)}/manage?tab=youtube`;
}

export function rememberOAuthReturn(slug) {
    safeSessionStorage.setItem(RETURN_SLUG_KEY, slug);
}

export function oauthReturnSlug() {
    return safeSessionStorage.getItem(RETURN_SLUG_KEY) || null;
}

export function forgetOAuthReturn() {
    safeSessionStorage.removeItem(RETURN_SLUG_KEY);
}
