import { describe, it, expect, beforeEach } from 'vitest';
import {
    shouldShowClaimNotice, shouldOfferClaim,
    rememberClaimInvite, claimInviteFor, forgetClaimInvite,
} from '@/lib/claim';

/**
 * Who is invited to take over a channel the platform seeded for a scholar who was not on it.
 *
 * <p>Both ways of getting this wrong are silent, which is why it is a tested rule and not an
 * inline condition: too strict and the one person it was written for never sees the offer, too
 * loose and a channel's own owner is asked to prove they own it.
 */
describe('shouldOfferClaim', () => {
    const seeded = { id: 7, ownerUserId: 1 };
    // What the backend answers to someone holding the invitation.
    const invited = { unclaimed: true, claimable: true, claimState: 'UNCLAIMED' };
    // What it answers to any other visitor of the same channel.
    const uninvited = { unclaimed: true, claimable: false, claimState: 'UNCLAIMED' };

    it('offers a claimable channel to a signed-out visitor', () => {
        // The scholar arriving from our email has no account yet. Requiring one before the offer
        // is even visible would hide it from the only reader it exists for.
        expect(shouldOfferClaim(invited, null, seeded)).toBe(true);
    });

    it('offers a claimable channel to a signed-in stranger', () => {
        expect(shouldOfferClaim(invited, { id: 42 }, seeded)).toBe(true);
    });

    // Whether the caller manages the channel is the backend's answer on the detail
    // (`viewerCanManage`: the owner, or a platform admin) — no longer worked out here.
    const managed = { ...seeded, viewerCanManage: true };

    it('never offers it to the channel owner', () => {
        expect(shouldOfferClaim(invited, { id: 1 }, managed)).toBe(false);
    });

    it('never offers it to a platform admin', () => {
        // The admin looking at a channel they seeded is not the person being invited to prove
        // anything, and the transfer they need is the one on the admin screen.
        expect(shouldOfferClaim(invited, { id: 99 }, managed)).toBe(false);
    });

    it('does not offer an ordinary channel', () => {
        const ordinary = { unclaimed: false, claimable: false, claimState: 'NOT_CLAIMABLE' };
        expect(shouldOfferClaim(ordinary, { id: 42 }, seeded)).toBe(false);
    });

    it('does not offer a channel that has already been claimed', () => {
        const claimed = { unclaimed: false, claimable: false, claimState: 'CLAIMED' };
        expect(shouldOfferClaim(claimed, { id: 42 }, seeded)).toBe(false);
    });

    /**
     * THE REASON THE TWO RULES ARE SEPARATE. The channel link is what we email, so it gets
     * forwarded, posted and shared. Everyone who opens it should learn the page is ours and
     * unclaimed; only the person we invited should be asked whether it is theirs.
     */
    it('does not offer the claim to a visitor without the invitation', () => {
        expect(shouldOfferClaim(uninvited, { id: 42 }, seeded)).toBe(false);
        expect(shouldOfferClaim(uninvited, null, seeded)).toBe(false);
    });

    it('still shows that same visitor the notice', () => {
        expect(shouldShowClaimNotice(uninvited, { id: 42 }, seeded)).toBe(true);
        expect(shouldShowClaimNotice(uninvited, null, seeded)).toBe(true);
    });

    it('shows no notice on an ordinary or already-claimed channel', () => {
        expect(shouldShowClaimNotice({ unclaimed: false }, { id: 42 }, seeded)).toBe(false);
        expect(shouldShowClaimNotice(undefined, { id: 42 }, seeded)).toBe(false);
    });

    it('shows the owner neither notice nor offer', () => {
        const managed = { ...seeded, viewerCanManage: true };
        expect(shouldShowClaimNotice(invited, { id: 1 }, managed)).toBe(false);
        expect(shouldOfferClaim(invited, { id: 1 }, managed)).toBe(false);
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

/**
 * The invitation has to outlive the navigations between arriving and being able to accept.
 *
 * <p>The reader this is for has no account, so the path is always: land on the channel, go to
 * login, go on to registration, come back. Any hop that drops the query string takes the offer
 * with it, and they end up on a page that no longer mentions why they were emailed.
 */
describe('claim invitation memory', () => {
    // There is no jsdom in this repo, on purpose, so the store the code reaches for does not
    // exist here. safeSessionStorage resolves globalThis.sessionStorage lazily on every call,
    // which is what lets a plain object stand in for it — and is also what makes the real thing
    // survive a browser that blocks site data.
    beforeEach(() => {
        const store = new Map();
        globalThis.sessionStorage = {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => store.set(k, String(v)),
            removeItem: (k) => store.delete(k),
        };
    });

    it('prefers the token on the URL', () => {
        rememberClaimInvite('elhamy', 'remembered');
        expect(claimInviteFor('elhamy', 'from-url')).toBe('from-url');
    });

    it('falls back to what the tab remembers once the URL loses it', () => {
        rememberClaimInvite('elhamy', 'remembered');
        expect(claimInviteFor('elhamy', null)).toBe('remembered');
    });

    /** An invitation to one channel must never put an offer on another. */
    it('does not leak across channels', () => {
        rememberClaimInvite('elhamy', 'remembered');
        expect(claimInviteFor('someone-else', null)).toBeNull();
    });

    it('forgets nothing it was never told', () => {
        expect(claimInviteFor('elhamy', null)).toBeNull();
        expect(claimInviteFor(null, null)).toBeNull();
    });

    it('is dropped once the claim succeeds', () => {
        rememberClaimInvite('elhamy', 'remembered');
        forgetClaimInvite('elhamy');
        expect(claimInviteFor('elhamy', null)).toBeNull();
    });

    /** Storing nothing is not an error: a visitor with no invitation is the common case. */
    it('ignores an absent token', () => {
        rememberClaimInvite('elhamy', null);
        expect(claimInviteFor('elhamy', null)).toBeNull();
    });
});
