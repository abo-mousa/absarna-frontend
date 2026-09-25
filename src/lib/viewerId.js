import { safeStorage } from './safeStorage';
import { GRANTED, readViewsConsent } from './consent';

/**
 * A signed-out browser's view-counting id — a random UUID, and nothing else: not derived from the
 * person, the device or anything the browser reports. Its one use is the `X-Absarna-Viewer` header
 * the API client sends when nobody is signed in, so that the view counter counts a returning
 * visitor once rather than once a day (the backend's ViewerKey keys it and never stores it raw).
 * The product owner's decision of 2026-09-25: «مشاهدات» means different people, for everyone.
 *
 * <p><b>Only with consent</b> — the visitor's own yes to counting their views, a separate choice in
 * the consent banner (`consent.views.v1`). Without it no id exists and none is sent, and the
 * backend does not count that visitor at all: the product owner's rule that a count shown as fact
 * is never inflated, so a visitor we cannot tell from the next one is not counted. Withdrawing
 * (the footer) deletes it. Thirteen months, then replaced — the backend keeps its rows as long.
 * Nothing is sent when storage is not persistent, since an id that dies with the page counts
 * nobody better.
 */
export const VIEWER_ID_KEY = 'absarna.viewer.v1';
export const VIEWER_ID_LIFETIME_MS = 395 * 24 * 60 * 60 * 1000;

const newId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : null);

/**
 * Whether a request is one the backend counts a view on — opening a video, a book or an article
 * (their three detail GETs). The id goes with those and nothing else: its one purpose is the
 * count, so it has no business on a search, a feed or a list.
 */
export function countsAView(method, url) {
    return (method || 'get').toLowerCase() === 'get'
        && /^\/?(videos|books|articles)\/\d+\/?(\?.*)?$/.test(String(url || ''));
}

/** The id to send, creating or renewing it; null when switched off or unavailable. */
export function viewerId(now = Date.now(), storage = safeStorage, makeId = newId) {
    if (readViewsConsent(storage) !== GRANTED) {
        // No consent, or withdrawn: nothing kept, nothing sent.
        storage.removeItem(VIEWER_ID_KEY);
        return null;
    }
    try {
        const stored = JSON.parse(storage.getItem(VIEWER_ID_KEY) || 'null');
        if (stored && typeof stored.id === 'string' && now - Number(stored.created) < VIEWER_ID_LIFETIME_MS) {
            return stored.id;
        }
    } catch {
        // A value this code did not write: replaced below.
    }
    const id = makeId();
    if (!id) return null;
    return storage.setItem(VIEWER_ID_KEY, JSON.stringify({ id, created: now })) ? id : null;
}

/** Deletes the id — withdrawing consent does this at once rather than at the next request. */
export function forgetViewerId(storage = safeStorage) {
    storage.removeItem(VIEWER_ID_KEY);
}
