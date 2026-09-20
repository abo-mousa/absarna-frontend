import { describe, it, expect } from 'vitest';
import { shouldOfferClaim } from '@/lib/claim';

/**
 * Who is invited to take over a channel the platform seeded for a scholar who was not on it.
 *
 * <p>Both ways of getting this wrong are silent, which is why it is a tested rule and not an
 * inline condition: too strict and the one person it was written for never sees the offer, too
 * loose and a channel's own owner is asked to prove they own it.
 */
describe('shouldOfferClaim', () => {
    const seeded = { id: 7, ownerUserId: 1 };
    const claimable = { claimable: true, claimState: 'UNCLAIMED' };

    it('offers a claimable channel to a signed-out visitor', () => {
        // The scholar arriving from our email has no account yet. Requiring one before the offer
        // is even visible would hide it from the only reader it exists for.
        expect(shouldOfferClaim(claimable, null, seeded)).toBe(true);
    });

    it('offers a claimable channel to a signed-in stranger', () => {
        expect(shouldOfferClaim(claimable, { id: 42 }, seeded)).toBe(true);
    });

    it('never offers it to the channel owner', () => {
        expect(shouldOfferClaim(claimable, { id: 1 }, seeded)).toBe(false);
    });

    it('never offers it to a platform admin', () => {
        // The admin looking at a channel they seeded is not the person being invited to prove
        // anything, and the transfer they need is the one on the admin screen.
        const admin = { id: 99, role: 'PLATFORM_ADMIN' };
        expect(shouldOfferClaim(claimable, admin, seeded)).toBe(false);
    });

    it('does not offer an ordinary channel', () => {
        const ordinary = { claimable: false, claimState: 'NOT_CLAIMABLE' };
        expect(shouldOfferClaim(ordinary, { id: 42 }, seeded)).toBe(false);
    });

    it('does not offer a channel that has already been claimed', () => {
        const claimed = { claimable: false, claimState: 'CLAIMED' };
        expect(shouldOfferClaim(claimed, { id: 42 }, seeded)).toBe(false);
    });

    /**
     * The status query is enabled for every viewer and can be in flight, failed, or answering for
     * a channel that has no claim state at all. None of those is an invitation.
     */
    it('offers nothing while the answer is absent', () => {
        expect(shouldOfferClaim(undefined, { id: 42 }, seeded)).toBe(false);
        expect(shouldOfferClaim(null, { id: 42 }, seeded)).toBe(false);
        expect(shouldOfferClaim({}, { id: 42 }, seeded)).toBe(false);
    });
});
