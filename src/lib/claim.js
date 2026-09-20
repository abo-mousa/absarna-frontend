import { canManageChannel } from '@/lib/user';
import { safeSessionStorage } from '@/lib/safeStorage';

/**
 * What a channel page may say about ownership, and to whom.
 *
 * <p>Two rules, not one, and keeping them apart is the point. The NOTICE is a public fact about
 * the page — we assembled it, its subject has not taken it over — and is worth telling any
 * reader. The OFFER is an invitation addressed to one person, and the channel link is what we
 * email, so a link that travels must not carry the invitation with it.
 *
 * <p>Collapsing them put "is this your channel? claim it" in front of every visitor and everyone
 * the link was ever forwarded to.
 */

/**
 * Whether to tell this viewer the page was assembled by the platform and is unclaimed.
 *
 * <p>Public and ungated on purpose. It explains a page that would otherwise read as the scholar's
 * own, which is a thing a visitor is better off knowing than inferring from an absence of
 * activity — and it says nothing an invitation would.
 *
 * <p>The claim state comes from the backend and is never inferred here. "The owner is an admin"
 * would identify today's seeded channels and be wrong by next quarter — the same reason
 * `lib/review.js` reads `holds` rather than deriving it.
 */
export function shouldShowClaimNotice(claim, user, channel) {
    if (!claim?.unclaimed) return false;
    // An owner has nothing to be told, and an admin looking at a channel they seeded knows.
    return !canManageChannel(user, channel);
}

/**
 * Whether to offer this viewer the chance to take the channel over.
 *
 * <p><b>`claimable` is the backend's answer, not ours.</b> It is true only when the caller
 * presented the channel's invitation token (or manages the channel), so this side never decides
 * who was invited — it renders a decision already made where the token lives. Checking the token
 * here instead would put the rule in two places and leave the endpoints open regardless.
 *
 * <p>Still gated on `canManageChannel` on top of that: the backend answers `claimable` for a
 * manager so an admin can preview what the scholar will see, and the channel page is not where
 * that preview belongs.
 */
export function shouldOfferClaim(claim, user, channel) {
    if (!claim?.claimable) return false;
    return !canManageChannel(user, channel);
}

export default shouldOfferClaim;

/**
 * The invitation, remembered for as long as the tab lives.
 *
 * <h2>Why the URL alone is not enough</h2>
 * The token arrives as `?claim=…` on the link we emailed, and the reader it is for has no account
 * — so between arriving and being able to claim they go to the login page, usually on to
 * registration, quite possibly to the terms page and back, and maybe press Back once or twice.
 * Every one of those is a navigation that can drop a query string, and when it does, the offer
 * silently disappears and they are left on a page that no longer mentions the thing the email
 * invited them to do. Carrying it by hand through each hop is a list that is never finished:
 * login, register, the OAuth round trip, and whatever is added next.
 *
 * <p>So the token is stored the first time it is seen and read back whenever the URL has none.
 * Session storage, not local: the invitation should not outlive the tab it arrived in, and
 * `safeSessionStorage` is what keeps a browser with site data blocked from throwing here.
 *
 * <p>Keyed by slug so an invitation to one channel never shows an offer on another, and holding
 * it is safe for the same reason putting it in a URL is — it authorizes nothing, and taking a
 * channel still needs control of its YouTube channel.
 */
const INVITE_KEY = 'absarna:claim-invite:';

export function rememberClaimInvite(slug, token) {
    if (!slug || !token) return;
    safeSessionStorage.setItem(INVITE_KEY + slug, token);
}

/** The token from the URL if there is one, otherwise whatever this tab remembers for this slug. */
export function claimInviteFor(slug, tokenFromUrl) {
    if (tokenFromUrl) return tokenFromUrl;
    return slug ? safeSessionStorage.getItem(INVITE_KEY + slug) : null;
}

/** Dropped once the claim succeeds — the invitation is spent, and the backend clears its half. */
export function forgetClaimInvite(slug) {
    if (slug) safeSessionStorage.removeItem(INVITE_KEY + slug);
}
