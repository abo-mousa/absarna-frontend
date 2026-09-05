import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushOnUnload } from '@/lib/api/beacon';
import { API_BASE_URL } from '@/lib/env';

/**
 * The last-chance progress flush on page unload. It runs while the page is being torn down, so the
 * only behaviour that matters is that it never disrupts unload — every failure mode has to be
 * swallowed — and that it still carries credentials, since a keepalive fetch bypasses the axios
 * client and its request interceptor entirely.
 */
describe('flushOnUnload', () => {
    let store;

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: (key) => (key in store ? store[key] : null),
            setItem: (key, value) => { store[key] = String(value); },
            removeItem: (key) => { delete store[key]; },
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends nothing when there is no session', () => {
        // An anonymous viewer has no progress to record, and a request without a token would just
        // 401 during unload.
        flushOnUnload('/videos/1/watch', { progressSeconds: 30 });

        expect(fetch).not.toHaveBeenCalled();
    });

    it('posts to the API with the bearer token attached', () => {
        // This path does not go through the axios client, so the Authorization header has to be
        // set here — forgetting it silently loses every unload flush to a 401.
        store.token = 'jwt-value';

        flushOnUnload('/videos/1/watch', { progressSeconds: 30 });

        expect(fetch).toHaveBeenCalledTimes(1);
        const [url, options] = fetch.mock.calls[0];
        expect(url).toBe(`${API_BASE_URL}/api/videos/1/watch`);
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer jwt-value');
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(options.body)).toEqual({ progressSeconds: 30 });
    });

    it('sets keepalive so the browser still attempts it during teardown', () => {
        // Without this flag the browser cancels the request the moment the page starts unloading,
        // which is the only moment this function is ever called.
        store.token = 'jwt-value';

        flushOnUnload('/books/1/read', { currentPage: 12 });

        expect(fetch.mock.calls[0][1].keepalive).toBe(true);
    });

    it('swallows a rejected request', async () => {
        // Nothing can be retried or reported at this point; an unhandled rejection during unload
        // is noise at best.
        store.token = 'jwt-value';
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network gone')));

        expect(() => flushOnUnload('/videos/1/watch', { progressSeconds: 30 })).not.toThrow();
        await Promise.resolve();
    });

    it('swallows a synchronous throw from fetch itself', () => {
        // A keepalive fetch can throw synchronously when the body exceeds the browser's keepalive
        // payload cap — never a concern for these few-byte bodies, but it must not break unload.
        store.token = 'jwt-value';
        vi.stubGlobal('fetch', vi.fn(() => { throw new Error('keepalive payload too large'); }));

        expect(() => flushOnUnload('/videos/1/watch', { progressSeconds: 30 })).not.toThrow();
    });
});
