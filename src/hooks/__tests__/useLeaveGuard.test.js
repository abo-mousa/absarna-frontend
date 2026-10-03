import { describe, it, expect } from 'vitest';
import { leavingHref } from '../useLeaveGuard';

const location = { href: 'https://absarna.com/channel/x/manage?tab=videos', origin: 'https://absarna.com', pathname: '/channel/x/manage' };

const anchor = (href, attrs = {}) => ({
    getAttribute: (name) => (name === 'href' ? href : attrs[name] ?? null),
    hasAttribute: (name) => name in attrs,
});
const click = (target, extra = {}) => ({
    button: 0, defaultPrevented: false, target: { closest: () => target }, ...extra,
});

describe('leavingHref', () => {
    it('names where an in-app link leads', () => {
        expect(leavingHref(click(anchor('/video/7?t=3')), location)).toBe('/video/7?t=3');
    });

    it('ignores what keeps the page mounted', () => {
        expect(leavingHref(click(anchor('/video/7', { target: '_blank' })), location)).toBeNull();
        expect(leavingHref(click(anchor('/video/7'), { metaKey: true }), location)).toBeNull();
        expect(leavingHref(click(anchor('/video/7'), { button: 1 }), location)).toBeNull();
        expect(leavingHref(click(anchor('/channel/x/manage?tab=books')), location)).toBeNull();
        expect(leavingHref(click(anchor('/file.pdf', { download: '' })), location)).toBeNull();
        expect(leavingHref(click(null), location)).toBeNull();
    });

    // A document unload: the browser's own beforeunload prompt asks.
    it('leaves another origin to beforeunload', () => {
        expect(leavingHref(click(anchor('https://youtube.com/watch?v=1')), location)).toBeNull();
    });
});
