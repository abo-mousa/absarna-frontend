import { canManageChannel } from '@/lib/user';

/**
 * Whether to offer this viewer the chance to take over a channel.
 *
 * <p>The platform seeded channels for scholars who were not on it. This decides who is shown the
 * banner that says so — and it is a rule rather than an inline condition because getting either
 * half wrong is quiet: too strict and the one person it was written for never sees it, too loose
 * and a channel's own owner is invited to prove they own it.
 *
 * <p><b>The claim state comes from the backend and is never inferred here.</b> "The owner is an
 * admin" would identify today's seeded channels and be wrong by next quarter — the same reason
 * `lib/review.js` reads `holds` rather than deriving it from a finding's state.
 *
 * <p><b>A signed-out viewer is offered it.</b> The scholar arriving from an email has no account,
 * and requiring one before the offer is even visible would hide it from the only reader it exists
 * for. What they get is a sign-in that returns here, not a claim — proving control of the YouTube
 * channel is a separate step that nobody reaches by being logged in.
 */
export function shouldOfferClaim(claim, user, channel) {
    if (!claim?.claimable) return false;
    // An owner has nothing to prove, and a platform admin looking at a channel they seeded is not
    // the person being invited. canManageChannel, not isChannelOwner — the same rule the page's
    // manage link and the backend's own check use.
    return !canManageChannel(user, channel);
}

export default shouldOfferClaim;
