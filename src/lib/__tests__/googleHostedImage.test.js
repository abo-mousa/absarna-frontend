import { describe, expect, it } from 'vitest';
import { isGoogleHostedImage } from '@/lib/consent';

/**
 * Which pictures wait for consent. A channel logo the create form prefilled from YouTube is a
 * Google address, and drawing it sends the reader's browser to Google — so `Avatar` holds it back
 * until the banner is answered. An uploaded logo is on our own host and must never be held.
 */
describe('isGoogleHostedImage', () => {
    it('recognises the hosts YouTube serves channel pictures from', () => {
        expect(isGoogleHostedImage('https://yt3.ggpht.com/abc=s800-c-k')).toBe(true);
        expect(isGoogleHostedImage('https://yt3.googleusercontent.com/abc')).toBe(true);
        expect(isGoogleHostedImage('https://i.ytimg.com/vi/x/hqdefault.jpg')).toBe(true);
    });

    it('never holds back our own media, a relative path, or nothing', () => {
        expect(isGoogleHostedImage('https://media.absarna.com/channels/7/logo-9f3a/logo.png')).toBe(false);
        expect(isGoogleHostedImage('/uploads/logo.png')).toBe(false);
        expect(isGoogleHostedImage('')).toBe(false);
        expect(isGoogleHostedImage(null)).toBe(false);
    });

    it('is not fooled by a Google name somewhere other than the host', () => {
        expect(isGoogleHostedImage('https://evil.example/yt3.ggpht.com/x.png')).toBe(false);
        expect(isGoogleHostedImage('https://ggpht.com.evil.example/x.png')).toBe(false);
    });
});
