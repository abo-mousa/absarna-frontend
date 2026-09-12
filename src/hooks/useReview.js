import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The moderation queue across every detector — platform admin only.
 *
 * Replaced useMusicReview and /api/music-review, which paged over VIDEOS. The difference is the
 * unit: this pages over FINDINGS, so a video flagged for music and for explicit content appears
 * once under each type — which is the point, because a reviewer may clear one and reject the
 * other, and one row per video cannot hold two opinions.
 *
 * Platform-scoped rather than channel-scoped: the backend refuses it to a
 * channel owner, because letting an uploader clear their own upload would make the rule advisory
 * in the one case it exists for.
 *
 * @param type   optional detector filter (MUSIC, NUDITY). Null means every type.
 * @param states optional state filter. The backend defaults to everything a reviewer has not
 *               dealt with — HELD, ADVISORY, UNCHECKED.
 */
export const useReviewQueue = (type = null, states = null, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.review(type, states, scope),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (type) params.set('type', type);
            if (states?.length) params.set('state', states.join(','));
            const query = params.toString();
            const res = await api.get(`/review${query ? `?${query}` : ''}`);
            return res.data;
        },
        enabled,
        // A held video is an upload sitting invisible until someone looks at it, so a stale queue
        // is a person waiting. Short, and refetched on focus: a reviewer working the list in one
        // tab should not see a row another admin already cleared.
        staleTime: 15_000,
    });
};

/**
 * Clear or reject ONE detector's finding.
 *
 * Per type, which is the whole reason the unit is a finding rather than a video: clearing a
 * video's music says nothing about whether its explicit-content finding is acceptable.
 *
 * Only CLEARED and REJECTED are accepted — see DECISIONS in lib/review. Both are final as far as
 * the pipeline is concerned: the worker replays a completed result for 24 h and a re-transcode
 * reports again, and neither can move a human's verdict back.
 */
export const useDecideReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ videoId, type, decision }) => {
            const res = await api.patch(`/review/${videoId}/${type}`, { decision });
            return res.data;
        },
        onSuccess: (_data, { videoId }) => {
            // By PREFIX, so every filter view refreshes rather than only the one that happened to
            // be open. The companion invalidation of ['music-review'] went with the endpoint: a
            // MUSIC decision used to dual-write videos.music_review, and the old tab would
            // otherwise have shown a verdict this one had already changed.
            queryClient.invalidateQueries({ queryKey: ['review'] });
            // And the video, because a decision changes whether the public can see it at all: a
            // DTO cached from before would show the owner a notice on a video that is now
            // published.
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
            queryClient.invalidateQueries({ queryKey: ['videos'] });
        },
    });
};
