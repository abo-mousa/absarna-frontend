import { describe, expect, it } from 'vitest';
import { canManageChannel, isChannelOwner, isPlatformAdmin } from '@/lib/user';

/**
 * These decide whether management controls are rendered. They are a display concern only — the
 * backend re-checks ownership on every mutation — so the risk they carry is the inverse of the
 * usual one: not a privilege escalation, but showing a channel owner an edit button that then
 * 403s, or hiding one from someone who is entitled to it. Both hinge on the null cases below.
 */
describe('isPlatformAdmin', () => {
    it('recognises the platform admin role', () => {
        expect(isPlatformAdmin({ role: 'PLATFORM_ADMIN' })).toBe(true);
    });

    it('rejects every other role', () => {
        expect(isPlatformAdmin({ role: 'USER' })).toBe(false);
        expect(isPlatformAdmin({ role: 'platform_admin' })).toBe(false);
        expect(isPlatformAdmin({ role: 'PLATFORM_ADMIN_READONLY' })).toBe(false);
    });

    it('handles a signed-out or still-loading user', () => {
        // AuthContext holds null until the profile request resolves, so every caller hits this
        // on first render.
        expect(isPlatformAdmin(null)).toBe(false);
        expect(isPlatformAdmin(undefined)).toBe(false);
        expect(isPlatformAdmin({})).toBe(false);
    });
});

describe('isChannelOwner', () => {
    it('matches a channel to its owner', () => {
        expect(isChannelOwner({ id: 7 }, { ownerUserId: 7 })).toBe(true);
    });

    it('does not match a different user', () => {
        expect(isChannelOwner({ id: 7 }, { ownerUserId: 8 })).toBe(false);
    });

    it('returns a boolean rather than a falsy value', () => {
        // Callers pass the result straight into JSX; a bare `undefined` renders nothing but also
        // defeats any strict comparison downstream.
        expect(isChannelOwner(null, { ownerUserId: 7 })).toBe(false);
        expect(isChannelOwner({ id: 7 }, null)).toBe(false);
        expect(isChannelOwner(null, null)).toBe(false);
    });

    it('does not treat a null owner as matching a real user', () => {
        expect(isChannelOwner({ id: 7 }, { ownerUserId: null })).toBe(false);
        expect(isChannelOwner({ id: 7 }, { ownerUserId: undefined })).toBe(false);
    });

    it('two absent ids currently compare equal — a latent gap, pinned deliberately', () => {
        // `channel.ownerUserId === user.id` is `undefined === undefined` here, so this returns
        // true. Not reachable today (ChannelDTO always carries ownerUserId, and a signed-in user
        // always has an id — AuthContext holds null until the profile resolves, which the
        // null-guard above already covers), so this is documented rather than fixed: changing a
        // permission helper is a decision to make deliberately, not a side effect of adding tests.
        // If it is ever fixed, invert this assertion.
        expect(isChannelOwner({ id: undefined }, { ownerUserId: undefined })).toBe(true);
    });

    it('compares identity strictly, so a string id does not match a numeric one', () => {
        expect(isChannelOwner({ id: 7 }, { ownerUserId: '7' })).toBe(false);
    });
});

describe('canManageChannel', () => {
    it('grants the owner', () => {
        expect(canManageChannel({ id: 7, role: 'USER' }, { ownerUserId: 7 })).toBe(true);
    });

    it('grants a platform admin over any channel', () => {
        // Mirrors the backend's admin bypass in canManageChannel.
        expect(canManageChannel({ id: 1, role: 'PLATFORM_ADMIN' }, { ownerUserId: 999 })).toBe(true);
    });

    it('refuses an unrelated user', () => {
        expect(canManageChannel({ id: 7, role: 'USER' }, { ownerUserId: 8 })).toBe(false);
    });

    it('refuses an anonymous visitor', () => {
        expect(canManageChannel(null, { ownerUserId: 7 })).toBe(false);
    });

    it('refuses while the channel is still loading', () => {
        expect(canManageChannel({ id: 7, role: 'USER' }, null)).toBe(false);
    });
});
