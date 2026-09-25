import { describe, expect, it } from 'vitest';
import { viewerId, forgetViewerId, countsAView, VIEWER_ID_KEY, VIEWER_ID_LIFETIME_MS } from '@/lib/viewerId';
import { VIEWS_CONSENT_KEY, GRANTED, DENIED } from '@/lib/consent';

const memory = (consent = GRANTED, persistent = true) => {
    const map = new Map(consent ? [[VIEWS_CONSENT_KEY, consent]] : []);
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => { map.set(k, v); return persistent; },
        removeItem: (k) => map.delete(k),
        map,
    };
};

/** The view-counting id: only with consent, random, kept thirteen months. */
describe('viewerId', () => {
    it('creates one id after a yes, and keeps returning it', () => {
        const storage = memory(GRANTED);
        expect(viewerId(1000, storage, () => 'id-1')).toBe('id-1');
        expect(viewerId(2000, storage, () => 'id-2')).toBe('id-1');
    });

    it('does not exist without consent, refused or unanswered — and a stale one is deleted', () => {
        expect(viewerId(0, memory(null), () => 'id-1')).toBeNull();
        const refused = memory(DENIED);
        refused.map.set(VIEWER_ID_KEY, JSON.stringify({ id: 'old', created: 0 }));
        expect(viewerId(1, refused, () => 'id-2')).toBeNull();
        expect(refused.map.has(VIEWER_ID_KEY)).toBe(false);
    });

    it('is replaced once its thirteen months are up', () => {
        const storage = memory(GRANTED);
        viewerId(0, storage, () => 'old');
        expect(viewerId(VIEWER_ID_LIFETIME_MS + 1, storage, () => 'new')).toBe('new');
    });

    it('is forgotten on withdrawal', () => {
        const storage = memory(GRANTED);
        viewerId(0, storage, () => 'id-1');
        forgetViewerId(storage);
        expect(storage.map.has(VIEWER_ID_KEY)).toBe(false);
    });

    it('sends nothing when the browser will not keep it', () => {
        expect(viewerId(0, memory(GRANTED, false), () => 'id-1')).toBeNull();
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
