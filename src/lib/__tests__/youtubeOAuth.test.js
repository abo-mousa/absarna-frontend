import { describe, expect, it } from 'vitest';
import { isGoogleConsentUrl, manageYouTubePath, readOAuthCallback } from '@/lib/youtubeOAuth';

/**
 * The two edges of the round trip through Google: what we are willing to navigate to, and how we
 * read what Google sends back.
 */

const params = (query) => new URLSearchParams(query);

describe('readOAuthCallback', () => {
    it('reads a code and state as something to redeem', () => {
        expect(readOAuthCallback(params('code=abc&state=s.t'))).toEqual({
            kind: 'complete', code: 'abc', state: 's.t',
        });
    });

    it('treats Cancel on the consent screen as a choice, not a failure', () => {
        // Google still sends the state back on a denial; there is nothing to redeem regardless.
        expect(readOAuthCallback(params('error=access_denied&state=s.t'))).toEqual({ kind: 'denied' });
    });

    it('passes any other Google error through without redeeming', () => {
        expect(readOAuthCallback(params('error=admin_policy_enforced&code=abc&state=s')))
            .toEqual({ kind: 'error', error: 'admin_policy_enforced' });
    });

    it('refuses a callback missing either half', () => {
        expect(readOAuthCallback(params('code=abc'))).toEqual({ kind: 'missing' });
        expect(readOAuthCallback(params('state=s'))).toEqual({ kind: 'missing' });
        expect(readOAuthCallback(params(''))).toEqual({ kind: 'missing' });
        expect(readOAuthCallback(undefined)).toEqual({ kind: 'missing' });
    });
});

describe('isGoogleConsentUrl', () => {
    it("accepts Google's consent endpoint", () => {
        expect(isGoogleConsentUrl('https://accounts.google.com/o/oauth2/v2/auth?client_id=x')).toBe(true);
    });

    it('refuses anything else, including look-alikes', () => {
        expect(isGoogleConsentUrl('http://accounts.google.com/o/oauth2/v2/auth')).toBe(false);
        expect(isGoogleConsentUrl('https://accounts.google.com.evil.example/auth')).toBe(false);
        expect(isGoogleConsentUrl('https://evil.example/?accounts.google.com')).toBe(false);
        expect(isGoogleConsentUrl('javascript:alert(1)')).toBe(false);
        expect(isGoogleConsentUrl(undefined)).toBe(false);
        expect(isGoogleConsentUrl('')).toBe(false);
    });
});

describe('manageYouTubePath', () => {
    it("returns to the channel's YouTube tab, with the slug encoded", () => {
        expect(manageYouTubePath('sheikh')).toBe('/channel/sheikh/manage?tab=youtube');
        expect(manageYouTubePath('a b')).toBe('/channel/a%20b/manage?tab=youtube');
    });
});
