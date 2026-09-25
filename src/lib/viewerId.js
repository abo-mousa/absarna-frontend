import { safeStorage } from './safeStorage';

/**
 * A signed-out browser's view-counting id — a random UUID, and nothing else: not derived from the
 * person, the device or anything the browser reports. Its one use is the `X-Absarna-Viewer` header
 * the API client sends when nobody is signed in, so that the view counter counts a returning
 * visitor once rather than once a day (the backend's ViewerKey keys it and never stores it raw).
 * The product owner's decision of 2026-09-25: «مشاهدات» means different people, for everyone.
 *
 * <p>Thirteen months, then replaced — the backend keeps its rows exactly as long. The reader can
 * switch it off from the footer (`setViewerIdOff`), which deletes it; counting then falls back to
 * the daily key, as it was before. Nothing is created or sent while switched off, and nothing is
 * sent when storage is not persistent, since an id that dies with the page counts nobody better.
 */
export const VIEWER_ID_KEY = 'absarna.viewer.v1';
export const VIEWER_ID_OFF_KEY = 'absarna.viewer.off';
export const VIEWER_ID_LIFETIME_MS = 395 * 24 * 60 * 60 * 1000;

const newId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : null);

/** The id to send, creating or renewing it; null when switched off or unavailable. */
export function viewerId(now = Date.now(), storage = safeStorage, makeId = newId) {
    if (storage.getItem(VIEWER_ID_OFF_KEY) === '1') return null;
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

export function isViewerIdOff(storage = safeStorage) {
    return storage.getItem(VIEWER_ID_OFF_KEY) === '1';
}

/** Switch the id off (deleting it) or back on. */
export function setViewerIdOff(off, storage = safeStorage) {
    if (off) {
        storage.removeItem(VIEWER_ID_KEY);
        storage.setItem(VIEWER_ID_OFF_KEY, '1');
    } else {
        storage.removeItem(VIEWER_ID_OFF_KEY);
    }
}
