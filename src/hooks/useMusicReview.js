import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The music review queue — platform admin only, and the only way a held video becomes visible
 * again.
 *
 * Absarna is an Islamic platform and music must not be published on it. The detector runs in
 * absarna-worker and the verdict lands on `videos.music_review`; everything here is the human
 * half. Unlike comment moderation, which is channel-scoped, this is a platform rule: the backend
 * refuses the endpoint to a channel owner, because letting the uploader clear their own upload
 * would make the rule advisory in the one case it exists for.
 *
 * @param reviews optional verdict filter; the backend defaults to everything with a machine
 *                verdict on it (HELD, ADVISORY, UNCHECKED)
 */
export const useMusicReviewQueue = (reviews = null, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.musicReview(reviews, scope),
        queryFn: async () => {
            const params = reviews?.length ? `?review=${reviews.join(',')}` : '';
            const res = await api.get(`/music-review${params}`);
            return res.data;
        },
        enabled,
        // A held video is an upload sitting invisible until someone looks at it, so a stale queue
        // is a person waiting. Short, and refetched on focus: a reviewer working through the list
        // in one tab should not see a row another admin already cleared.
        staleTime: 15_000,
    });
};

/**
 * Clear or reject.
 *
 * Only CLEARED and REJECTED are accepted — see `DECISIONS` in lib/musicReview. Both are final as
 * far as the pipeline is concerned: the worker replays a completed result for 24 h and a
 * re-transcode reports again, and neither can move a human's verdict back.
 */
export const useDecideMusicReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ videoId, decision }) => {
            const res = await api.patch(`/music-review/${videoId}`, { decision });
            return res.data;
        },
        onSuccess: (_data, { videoId }) => {
            // The queue itself, by prefix, so every filter view refreshes rather than only the
            // one that happened to be open.
            queryClient.invalidateQueries({ queryKey: ['music-review'] });
            // And the video, because clearing it changes whether the public can see it at all —
            // a cached DTO from before the decision would show the owner's notice on a video
            // that is now published.
            queryClient.invalidateQueries({ queryKey: ['video', videoId] });
            queryClient.invalidateQueries({ queryKey: ['videos'] });
        },
    });
};
