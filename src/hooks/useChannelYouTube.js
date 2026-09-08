import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The channel owner's YouTube link: resolve, verify, import once.
 *
 * <p>Every call returns the same flattened state object — verification and the latest import run
 * together — so each mutation can write straight into the query cache and the panel never renders
 * a half-updated view. That matters more than usual here because the flow spans an excursion to
 * another website: the owner leaves to edit their YouTube description and comes back, and the
 * state they return to has to be exactly the state they left.
 */

// Owner-scoped: what this returns includes a verification token minted for one owner, so it
// must not survive into the next session on a shared machine. Scope is the last segment, so
// `['channel-youtube', slug]` still matches it as a prefix.
const key = queryKeys.channelYouTube;

export const useChannelYouTube = (slug, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: key(slug, scope),
        queryFn: async () => (await api.get(`/channels/${slug}/youtube`)).data,
        enabled: Boolean(slug) && enabled,
        // An import runs on the server with nothing pushing progress back, so the panel polls —
        // but only while something is actually happening. A finished or absent import polls
        // nothing, which is why this is a function of the data rather than a constant.
        refetchInterval: (query) =>
            query.state.data?.importStatus === 'RUNNING' ? 5000 : false,
        retry: false,
    });
};

/** Resolves what the owner typed and returns the token to publish. */
export const useLinkYouTubeChannel = (slug) => {
    const queryClient = useQueryClient();
    const scope = useUserScope();
    return useMutation({
        mutationFn: async (source) =>
            (await api.post(`/channels/${slug}/youtube/verification`, { source })).data,
        onSuccess: (data) => queryClient.setQueryData(key(slug, scope), data),
    });
};

/** Re-reads the YouTube channel description looking for the token. */
export const useCheckYouTubeVerification = (slug) => {
    const queryClient = useQueryClient();
    const scope = useUserScope();
    return useMutation({
        mutationFn: async () =>
            (await api.post(`/channels/${slug}/youtube/verification/check`)).data,
        // Not an error when the token isn't there yet — `verified: false` is the answer, and the
        // caller renders "try again in a minute" rather than a failure.
        onSuccess: (data) => queryClient.setQueryData(key(slug, scope), data),
    });
};

/** Starts the one-time import. Returns immediately; the query above polls for the outcome. */
export const useStartYouTubeImport = (slug) => {
    const queryClient = useQueryClient();
    const scope = useUserScope();
    return useMutation({
        mutationFn: async () => (await api.post(`/channels/${slug}/youtube/import`)).data,
        onSuccess: (data) => {
            queryClient.setQueryData(key(slug, scope), data);
            // The import writes videos and series into this channel, so the dashboard's own lists
            // are stale the moment it finishes. Invalidated on start rather than on completion
            // because nothing tells us when that is — the poll above is what notices.
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug] });
        },
    });
};

/**
 * Replaces one imported video's YouTube embed with the original file.
 *
 * <p>The upload itself goes through the ordinary presigned front door; this only attaches the
 * finished session to a video that already exists, so the row keeps its id and with it every
 * comment, bookmark, watch-history entry and its place in a series.
 *
 * <p>Invalidates the owner's video list, since the row's `sourceType` has changed and the
 * "upload original" action must disappear from it.
 */
export const useUploadOriginal = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ videoId, uploadSessionId }) =>
            (await api.post(`/channels/${slug}/youtube/videos/${videoId}/original`,
                { uploadSessionId })).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-manage', slug] }),
    });
};

/**
 * A platform admin asserts the link on an owner's behalf, standing in for verification the admin
 * cannot perform — they do not control that YouTube channel's description and never will.
 *
 * <p>Recorded as `ADMIN` rather than `OWNER`, and the two are not interchangeable: both allow an
 * import, only an owner's own proof allows replacing a YouTube embed with a file we host. The
 * backend rejects this for anyone but a platform admin; the button is hidden for everyone else so
 * nobody is offered an action that will 403.
 */
export const useAttestYouTubeChannel = (slug) => {
    const queryClient = useQueryClient();
    const scope = useUserScope();
    return useMutation({
        mutationFn: async (source) =>
            (await api.post(`/channels/${slug}/youtube/attest`, { source })).data,
        onSuccess: (data) => queryClient.setQueryData(key(slug, scope), data),
    });
};

/**
 * Resolves a YouTube channel's public details before any Absarna channel exists.
 *
 * <p>Used by the create-channel form to prefill name, description and logo — which is most of that
 * form, retyped by hand by someone who has already written it once on YouTube. A mutation rather
 * than a query because it is an explicit action with a cost: each call spends a unit of the
 * platform's shared daily YouTube quota, so it fires when the user asks, never on a keystroke.
 *
 * <p>Looking a channel up asserts no relationship to it. Proving ownership is a separate step,
 * after the channel exists — see `useLinkYouTubeChannel`.
 */
export const useResolveYouTubeChannel = () =>
    useMutation({
        mutationFn: async (source) =>
            (await api.post('/youtube/resolve', { source })).data,
    });
