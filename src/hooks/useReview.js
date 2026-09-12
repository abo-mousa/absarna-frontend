import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The moderation queue across every detector — platform admin only.
 *
 * Supersedes useMusicReview, which is kept until the last caller moves: the backend serves both
 * endpoints so the two repos never have to deploy together. The difference is the unit. This one
 * pages over FINDINGS, so a video flagged for music and for explicit content appears once under
 * each type — which is the point, because a reviewer may clear one and reject the other.
 *
 * Platform-scoped rather than channel-scoped, like the music queue: the backend refuses it to a
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
 * Per type, which is the whole reason this exists beside the music endpoint: clearing a video's
 * music says nothing about whether its explicit-content finding is acceptable.
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
            // Both queues by prefix, so every filter view refreshes rather than only the one that
            // happened to be open — and the music queue too, because a MUSIC decision here also
            // writes videos.music_review and the old tab would otherwise show a stale verdict.
            queryClient.invalidateQueries({ queryKey: ['review'] });
            queryClient.invalidateQueries({ queryKey: ['music-review'] });
            // And the video, because a decision changes whether the public can see it at all: a
            // DTO cached from before would show the owner a notice on a video that is now
            // published.
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
            queryClient.invalidateQueries({ queryKey: ['videos'] });
        },
    });
};
