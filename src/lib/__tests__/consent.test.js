import { describe, expect, it } from 'vitest';
import {
    CONSENT_KEY,
    DENIED,
    GRANTED,
    allowsYouTube,
    readConsent,
    shouldAskConsent,
    writeConsent,
} from '@/lib/consent';

/**
 * The consent gate.
 *
 * <p><b>Every test here is about the undecided state</b>, because that is the one the whole
 * feature turns on and the one that is easiest to get wrong in a way that looks right. Consent has
 * to precede the request: a reader who has not answered must not already have been reported to
 * Google by the time they are asked. Written as "is it granted" rather than "is it not denied" —
 * the second reads perfectly well, passes an obvious test, and loads a thumbnail from Google on
 * the first page of a first visit.
 */

const fakeStorage = (initial = {}) => {
    const map = new Map(Object.entries(initial));
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        removeItem: (k) => map.delete(k),
        _map: map,
    };
};

describe('allowsYouTube', () => {
    it('is false until it is explicitly granted', () => {
        expect(allowsYouTube(null)).toBe(false);
        expect(allowsYouTube(DENIED)).toBe(false);
        expect(allowsYouTube(undefined)).toBe(false);
        // The one case that loads Google.
        expect(allowsYouTube(GRANTED)).toBe(true);
    });

    it('treats an unrecognised value as no permission', () => {
        // A half-written or tampered value is not an answer. Reading it as one would be the
        // failure this whole module exists to avoid.
        expect(allowsYouTube('yes')).toBe(false);
        expect(allowsYouTube('true')).toBe(false);
        expect(allowsYouTube('')).toBe(false);
    });
});

describe('shouldAskConsent', () => {
    it('asks only while the question is open', () => {
        expect(shouldAskConsent(null)).toBe(true);
        // A banner that persists after an answer teaches people to dismiss it; one that returns
        // after a refusal is not a free choice.
        expect(shouldAskConsent(GRANTED)).toBe(false);
        expect(shouldAskConsent(DENIED)).toBe(false);
    });
});

describe('readConsent', () => {
    it('reads back a decision that was made', () => {
        expect(readConsent(fakeStorage({ [CONSENT_KEY]: GRANTED }))).toBe(GRANTED);
        expect(readConsent(fakeStorage({ [CONSENT_KEY]: DENIED }))).toBe(DENIED);
    });

    it('is undecided when nothing was stored, or when what was stored is not an answer', () => {
        expect(readConsent(fakeStorage())).toBeNull();
        expect(readConsent(fakeStorage({ [CONSENT_KEY]: 'accepted' }))).toBeNull();
        expect(readConsent(fakeStorage({ [CONSENT_KEY]: '1' }))).toBeNull();
    });
});

describe('writeConsent', () => {
    it('records either answer', () => {
        const storage = fakeStorage();
        writeConsent(GRANTED, storage);
        expect(readConsent(storage)).toBe(GRANTED);
        writeConsent(DENIED, storage);
        expect(readConsent(storage)).toBe(DENIED);
    });

    it('clears rather than refuses when the reader reopens the question', () => {
        // Withdrawal puts the banner back. Silently recording DENIED instead would answer a
        // question they had just reopened, on their behalf.
        const storage = fakeStorage({ [CONSENT_KEY]: GRANTED });
        writeConsent(null, storage);
        expect(readConsent(storage)).toBeNull();
        expect(shouldAskConsent(readConsent(storage))).toBe(true);
    });

    it('never stores a value that is not one of the two answers', () => {
        const storage = fakeStorage({ [CONSENT_KEY]: GRANTED });
        writeConsent('maybe', storage);
        expect(storage._map.has(CONSENT_KEY)).toBe(false);
    });
});
