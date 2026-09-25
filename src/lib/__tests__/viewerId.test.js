import { describe, expect, it } from 'vitest';
import { viewerId, setViewerIdOff, isViewerIdOff, countsAView, VIEWER_ID_KEY, VIEWER_ID_LIFETIME_MS } from '@/lib/viewerId';

const memory = (persistent = true) => {
    const map = new Map();
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => { map.set(k, v); return persistent; },
        removeItem: (k) => map.delete(k),
        map,
    };
};

/** The view-counting id: random, kept thirteen months, never sent while switched off. */
describe('viewerId', () => {
    it('creates one id and keeps returning it', () => {
        const storage = memory();
        const first = viewerId(1000, storage, () => 'id-1');
        expect(first).toBe('id-1');
        expect(viewerId(2000, storage, () => 'id-2')).toBe('id-1');
    });

    it('is replaced once its thirteen months are up', () => {
        const storage = memory();
        viewerId(0, storage, () => 'old');
        expect(viewerId(VIEWER_ID_LIFETIME_MS + 1, storage, () => 'new')).toBe('new');
    });

    it('is deleted and not sent while switched off, and comes back when switched on', () => {
        const storage = memory();
        viewerId(0, storage, () => 'id-1');
        setViewerIdOff(true, storage);
        expect(isViewerIdOff(storage)).toBe(true);
        expect(storage.map.has(VIEWER_ID_KEY)).toBe(false);
        expect(viewerId(1, storage, () => 'id-2')).toBeNull();
        setViewerIdOff(false, storage);
        expect(viewerId(2, storage, () => 'id-3')).toBe('id-3');
    });

    it('sends nothing when the browser will not keep it', () => {
        expect(viewerId(0, memory(false), () => 'id-1')).toBeNull();
    });
});

/** The id goes only with the three requests a view is counted on. */
describe('countsAView', () => {
    it('is the three detail GETs', () => {
        expect(countsAView('get', '/videos/12')).toBe(true);
        expect(countsAView('GET', '/books/3')).toBe(true);
        expect(countsAView(undefined, '/articles/9?x=1')).toBe(true);
    });

    it('is nothing else', () => {
        expect(countsAView('get', '/videos')).toBe(false);
        expect(countsAView('get', '/videos/12/related')).toBe(false);
        expect(countsAView('get', '/books/3/read-url')).toBe(false);
        expect(countsAView('post', '/videos/12')).toBe(false);
        expect(countsAView('get', '/feed')).toBe(false);
    });
});
