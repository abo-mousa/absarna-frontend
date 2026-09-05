import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError } from 'axios';

/**
 * The 401-refresh interceptor. Two of its properties only break under concurrency or at a specific
 * edge, which is exactly why they are worth pinning:
 *
 *  - a single shared in-flight refresh, because a page mounting several queries at once 401s
 *    several times simultaneously and the backend rate-limits /auth/refresh to 10/min;
 *  - an `auth:session-expired` event on every dead-end path, because AuthContext clears its
 *    in-memory state from that event alone. Missing it once leaves the app believing it is signed
 *    in while every request 401s.
 *
 * Transport is faked by replacing axios's adapter rather than by pulling in a mocking library:
 * the interceptors under test sit above the adapter, so this exercises the real axios pipeline.
 * The client module is re-imported per test (`resetModules`) because the shared refresh promise
 * is module-level state.
 */
describe('api client', () => {
    let store;
    let dispatched;
    let routes;
    let calls;

    /**
     * Queue a reply for a path. `once: true` entries are consumed first, which is how a request
     * that 401s and then succeeds on replay is expressed.
     */
    const reply = (path, status, data, { once = false } = {}) => {
        routes.push({ path, status, data, once, used: false });
    };

    const adapter = (config) => {
        const url = `${config.baseURL ?? ''}${config.url}`;
        calls.push({ url, method: config.method, headers: config.headers });

        const route = routes.find((r) => url.includes(r.path) && r.once && !r.used)
            ?? routes.find((r) => url.includes(r.path) && !r.once);
        if (!route) {
            return Promise.reject(new AxiosError(`no stub for ${config.method} ${url}`, 'ENOSTUB', config));
        }
        route.used = true;

        const response = {
            data: route.data, status: route.status, statusText: '', headers: {}, config,
        };
        return route.status >= 200 && route.status < 300
            ? Promise.resolve(response)
            : Promise.reject(new AxiosError(`status ${route.status}`, 'ERR_BAD_REQUEST', config, null, response));
    };

    const postsTo = (path) => calls.filter((c) => c.method === 'post' && c.url.includes(path));

    const loadClient = async () => {
        vi.resetModules();
        const module = await import('@/lib/api/client');
        const api = module.default;
        api.defaults.adapter = adapter;
        return api;
    };

    beforeEach(() => {
        store = { token: 'expired-token', refreshToken: 'refresh-value' };
        dispatched = [];
        routes = [];
        calls = [];

        // The refresh call is made with bare `axios.post`, not the configured instance, so the
        // default instance needs the fake transport too.
        axios.defaults.adapter = adapter;

        vi.stubGlobal('localStorage', {
            getItem: (key) => (key in store ? store[key] : null),
            setItem: (key, value) => { store[key] = String(value); },
            removeItem: (key) => { delete store[key]; },
        });
        vi.stubGlobal('window', {
            dispatchEvent: (event) => { dispatched.push(event.type); return true; },
        });
        // Node exposes no DOM Event constructor; the interceptor only ever reads `.type`.
        vi.stubGlobal('Event', class { constructor(type) { this.type = type; } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete axios.defaults.adapter;
    });

    it('attaches the stored token to every request', async () => {
        const api = await loadClient();
        store.token = 'jwt-value';
        reply('/videos', 200, []);

        await api.get('/videos');

        expect(calls[0].headers.Authorization).toBe('Bearer jwt-value');
    });

    it('sends no Authorization header when signed out', async () => {
        const api = await loadClient();
        delete store.token;
        reply('/videos', 200, []);

        await api.get('/videos');

        expect(calls[0].headers.Authorization).toBeUndefined();
    });

    it('refreshes once on a 401 and replays the original request', async () => {
        const api = await loadClient();
        reply('/auth/refresh', 200, { token: 'fresh-token' });
        reply('/user/history', 401, null, { once: true });
        reply('/user/history', 200, ['replayed']);

        const response = await api.get('/user/history');

        expect(response.data).toEqual(['replayed']);
        expect(localStorage.getItem('token')).toBe('fresh-token');
        // The replay carries the new credential, not the one that just failed.
        const replay = calls.filter((c) => c.url.includes('/user/history')).at(-1);
        expect(replay.headers.Authorization).toBe('Bearer fresh-token');
    });

    it('keeps the existing refresh token when the response does not rotate one', async () => {
        // The backend's /auth/refresh returns only `token` today; clearing the stored refresh
        // token on that basis would end the session at the next 401.
        const api = await loadClient();
        reply('/auth/refresh', 200, { token: 'fresh-token' });
        reply('/user/history', 401, null, { once: true });
        reply('/user/history', 200, []);

        await api.get('/user/history');

        expect(localStorage.getItem('refreshToken')).toBe('refresh-value');
    });

    it('stores a rotated refresh token when one is returned', async () => {
        const api = await loadClient();
        reply('/auth/refresh', 200, { token: 'fresh-token', refreshToken: 'rotated' });
        reply('/user/history', 401, null, { once: true });
        reply('/user/history', 200, []);

        await api.get('/user/history');

        expect(localStorage.getItem('refreshToken')).toBe('rotated');
    });

    it('fires only one refresh for several simultaneous 401s', async () => {
        // A page mounting three queries 401s three times at once. One refresh per 401 would burn
        // a third of the endpoint's 10/min budget on a single page load, and the calls would race
        // to write the same key.
        const api = await loadClient();
        reply('/auth/refresh', 200, { token: 'fresh-token' });
        for (const path of ['/user/history', '/user/bookmarks', '/user/reading-history']) {
            reply(path, 401, null, { once: true });
            reply(path, 200, []);
        }

        await Promise.all([
            api.get('/user/history'),
            api.get('/user/bookmarks'),
            api.get('/user/reading-history'),
        ]);

        expect(postsTo('/auth/refresh')).toHaveLength(1);
    });

    it('retries a request only once, so a persistent 401 cannot loop', async () => {
        const api = await loadClient();
        reply('/auth/refresh', 200, { token: 'fresh-token' });
        reply('/user/history', 401);

        await expect(api.get('/user/history')).rejects.toMatchObject({
            response: { status: 401 },
        });

        // Without the _retry flag the replayed request 401s and refreshes again, forever.
        expect(postsTo('/auth/refresh')).toHaveLength(1);
    });

    it('clears the session and signals expiry when the refresh itself fails', async () => {
        const api = await loadClient();
        reply('/auth/refresh', 401);
        reply('/user/history', 401);

        await expect(api.get('/user/history')).rejects.toBeTruthy();

        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('refreshToken')).toBeNull();
        // A soft event, not a window.location redirect: the latter force-reloads the whole SPA
        // even when the 401 came from a public page being browsed anonymously.
        expect(dispatched).toContain('auth:session-expired');
    });

    it('signals expiry when there is a token but no refresh token to try', async () => {
        // This used to fall straight through to the rejection with no signal at all, leaving the
        // app's in-memory auth state stuck "logged in" while every request 401'd.
        const api = await loadClient();
        delete store.refreshToken;
        reply('/user/history', 401);

        await expect(api.get('/user/history')).rejects.toBeTruthy();

        expect(localStorage.getItem('token')).toBeNull();
        expect(dispatched).toContain('auth:session-expired');
    });

    it('does not signal expiry for an anonymous 401', async () => {
        // Nobody is signed in, so there is no session to expire — firing the event would disrupt
        // a visitor browsing public pages.
        const api = await loadClient();
        store = {};
        reply('/user/history', 401);

        await expect(api.get('/user/history')).rejects.toBeTruthy();

        expect(dispatched).not.toContain('auth:session-expired');
    });

    it('never tries to refresh a failed login, register or refresh call', async () => {
        // A 401 from /auth/login means "wrong password" and must reach the form. Refreshing on it
        // would swallow the error, and refreshing on a failed /auth/refresh would recurse.
        const api = await loadClient();
        reply('/auth/login', 401, { message: 'Invalid credentials' });
        reply('/auth/register', 400, {});

        await expect(api.post('/auth/login', {})).rejects.toMatchObject({
            response: { status: 401, data: { message: 'Invalid credentials' } },
        });
        await expect(api.post('/auth/register', {})).rejects.toBeTruthy();

        expect(postsTo('/auth/refresh')).toHaveLength(0);
    });

    it('passes non-401 failures straight through', async () => {
        const api = await loadClient();
        reply('/videos/999', 404, { message: 'Not found' });

        await expect(api.get('/videos/999')).rejects.toMatchObject({
            response: { status: 404 },
        });

        expect(postsTo('/auth/refresh')).toHaveLength(0);
    });

    it('allows a later 401 to refresh again after an earlier one resolved', async () => {
        // The shared promise is cleared in a finally block; if it were not, the first refresh
        // would be reused forever and a genuinely expired token could never be replaced.
        const api = await loadClient();
        reply('/auth/refresh', 200, { token: 'fresh-token' });
        reply('/user/history', 401, null, { once: true });
        reply('/user/history', 200, []);
        reply('/user/bookmarks', 401, null, { once: true });
        reply('/user/bookmarks', 200, []);

        await api.get('/user/history');
        await api.get('/user/bookmarks');

        expect(postsTo('/auth/refresh')).toHaveLength(2);
    });
});
