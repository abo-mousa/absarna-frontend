import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearSession, isRemembered, readRefreshToken, readToken, storeRotatedTokens, storeSession,
} from '@/lib/authStorage';

/**
 * Where the session's tokens live, which is the half of "stay logged in" that no token lifetime
 * can deliver: a refresh token measured in months still dies with the tab if it sits in
 * sessionStorage, and a browser-session one still outlives the browser if it sits in localStorage.
 *
 * <p>The failure this guards is quiet in both directions — a session that ends sooner than the
 * person was promised, or a long-lived credential left behind on a shared computer by someone who
 * unticked the box.
 */
describe('authStorage', () => {
    let local;
    let session;

    const fakeStore = (backing) => ({
        getItem: (key) => (key in backing ? backing[key] : null),
        setItem: (key, value) => { backing[key] = String(value); },
        removeItem: (key) => { delete backing[key]; },
    });

    beforeEach(() => {
        local = {};
        session = {};
        vi.stubGlobal('localStorage', fakeStore(local));
        vi.stubGlobal('sessionStorage', fakeStore(session));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps a remembered session where the browser closing cannot reach it', () => {
        storeSession({ token: 'access', refreshToken: 'refresh', remember: true });

        expect(local).toEqual({ token: 'access', refreshToken: 'refresh' });
        expect(session).toEqual({});
        expect(isRemembered()).toBe(true);
    });

    it('keeps an unremembered session in the store that dies with the tab', () => {
        storeSession({ token: 'access', refreshToken: 'refresh', remember: false });

        expect(session).toEqual({ token: 'access', refreshToken: 'refresh' });
        expect(local).toEqual({});
        expect(isRemembered()).toBe(false);
    });

    it('clears the other store when the tier changes', () => {
        // Signing in without the box ticked on a computer where someone left a remembered session
        // behind must not leave that session's tokens in localStorage for the next person.
        storeSession({ token: 'hers', refreshToken: 'hers-refresh', remember: true });

        storeSession({ token: 'his', refreshToken: 'his-refresh', remember: false });

        expect(local).toEqual({});
        expect(readToken()).toBe('his');
        expect(readRefreshToken()).toBe('his-refresh');
    });

    it('reads the browser-session store first', () => {
        // Both can be populated only in the moment between the two writes above, but the order is
        // what makes a session login win on a device that also has a remembered one.
        local.token = 'remembered';
        session.token = 'this-tab';

        expect(readToken()).toBe('this-tab');
    });

    it('finds a session stored before the two tiers existed', () => {
        // Every session in the wild at the time of this change sits in localStorage with nothing
        // marking it as remembered. Reading it as remembered is what keeps those signed in.
        local.token = 'old-session';
        local.refreshToken = 'old-refresh';

        expect(readToken()).toBe('old-session');
        expect(readRefreshToken()).toBe('old-refresh');
        expect(isRemembered()).toBe(true);
    });

    it('rotates tokens in place without promoting a browser session', () => {
        // A refresh is not a new session. Writing the rotated pair to localStorage would make a
        // session the person asked to end with the browser outlive it.
        storeSession({ token: 'access', refreshToken: 'refresh', remember: false });

        storeRotatedTokens({ token: 'access-2', refreshToken: 'refresh-2' });

        expect(session).toEqual({ token: 'access-2', refreshToken: 'refresh-2' });
        expect(local).toEqual({});
    });

    it('keeps the stored refresh token when a response carries none', () => {
        // Still valid, and dropping it would end the session at the access token's next expiry.
        storeSession({ token: 'access', refreshToken: 'refresh', remember: true });

        storeRotatedTokens({ token: 'access-2' });

        expect(local).toEqual({ token: 'access-2', refreshToken: 'refresh' });
    });

    it('clears both stores on the way out', () => {
        local.token = 'remembered';
        local.refreshToken = 'remembered-refresh';
        session.token = 'this-tab';
        session.refreshToken = 'this-tab-refresh';

        clearSession();

        expect(local).toEqual({});
        expect(session).toEqual({});
        expect(readToken()).toBeNull();
    });
});
