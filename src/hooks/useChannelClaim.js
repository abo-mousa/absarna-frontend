import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * Taking over a channel the platform built for someone.
 *
 * <p>The platform seeded channels for scholars who were not on it — an admin made the channel,
 * vouched for its YouTube link and imported the back catalogue as embeds. This is how the scholar,
 * once told, proves the channel is theirs and takes it.
 *
 * <p><b>Separate from `useChannelYouTube` for the same reason the endpoints are separate.</b> That
 * hook is the owner's dashboard surface and every call behind it requires already owning the
 * channel. A claimant owns nothing yet, so nothing here may route through it.
 */

const key = queryKeys.channelClaim;

/**
 * The invitation token goes on the query string of every claim call.
 *
 * <p>It is not a credential — it authorizes nothing, and taking a channel still needs control of
 * its YouTube channel — so the usual objection to putting a secret in a URL does not apply. What
 * it decides is who is SHOWN the offer and whose attempts are answered, which is what stops the
 * invitation being addressed to every visitor of a public page.
 */
const withToken = (path, claimToken) =>
    claimToken ? `${path}?token=${encodeURIComponent(claimToken)}` : path;

/**
 * Whether this channel is waiting for its owner, and which proofs are open.
 *
 * <p><b>Enabled without a login.</b> The scholar arriving from an email is signed out, and the
 * whole point of the banner is that it speaks to them before they have an account — so this asks
 * the question for every viewer and the caller decides what to render. A signed-out viewer still
 * gets `claimable`, which is all the banner needs to offer them a way in.
 */
export const useChannelClaim = (slug, claimToken = null, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        // The token is part of the key: the same channel answers differently with and without
        // it, and a cached tokenless answer must not suppress the offer for the invited reader.
        queryKey: [...key(slug, scope), claimToken],
        queryFn: async () => (await api.get(withToken(`/channels/${slug}/claim`, claimToken))).data,
        enabled: Boolean(slug) && enabled,
        retry: false,
    });
};

/**
 * Issues the token the claimant places in their YouTube channel description.
 *
 * <p>Sends no body, and that is the safety property rather than an omission: a claim proves
 * control of the channel the row is <em>already</em> bound to. Letting the caller name a target
 * would let anyone point a seeded channel at a YouTube channel they do control and verify against
 * that — the whole transfer, proving nothing.
 */
export const useStartClaimToken = (slug, claimToken) =>
    useMutation({
        mutationFn: async () =>
            (await api.post(withToken(`/channels/${slug}/claim/token`, claimToken))).data,
    });

/**
 * Re-reads the description and, if the token is there, takes the channel.
 *
 * <p><b>`claimed: false` is an answer, not a failure.</b> The usual cause is that YouTube's API
 * has not caught up with a description saved a minute ago, so the caller offers to try again
 * rather than rendering an error.
 *
 * <p>On success the viewer is suddenly this channel's owner, which changes far more than this
 * query: the channel itself now names them, the manage link appears, and their channel list has
 * grown by one. Everything keyed on the slug goes, plus `my-channels`.
 */
export const useCheckClaimToken = (slug, claimToken) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () =>
            (await api.post(withToken(`/channels/${slug}/claim/token/check`, claimToken))).data,
        onSuccess: (data) => {
            if (!data?.claimed) return;
            queryClient.invalidateQueries({ queryKey: ['channel-claim', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel-youtube', slug] });
            queryClient.invalidateQueries({ queryKey: ['my-channels'] });
        },
    });
};

/**
 * Starts "claim with Google": asks for the consent URL and leaves it to the caller to navigate.
 *
 * <p>The returning flow lands on the ordinary OAuth callback and completes at
 * `/youtube/oauth/complete`, which does the transfer when the channel it resolves is unclaimed.
 * There is deliberately no second completion endpoint — one OAuth flow, two reasons to run it.
 *
 * <p>Offered only when the status carries `oauthAvailable`; the description token is the fallback
 * that keeps working when Google sign-in is switched off.
 */
export const useStartClaimOAuth = (slug, claimToken) =>
    useMutation({
        mutationFn: async () =>
            (await api.post(withToken(`/channels/${slug}/claim/oauth`, claimToken))).data,
    });
