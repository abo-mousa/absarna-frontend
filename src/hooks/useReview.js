import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
 * <h4>The response is the platform's ordinary page shape, and it did not used to be</h4>
 *
 * <p>`/api/review` emitted `{content, page, size, totalElements, depth}` while every other list on
 * the platform emits `{content, currentPage, totalPages, totalItems, hasNext, hasPrevious}`. This
 * hook requested one page and offered no way to reach the next, so <b>the moderation queue was
 * permanently capped at its first twenty findings</b> — which with explicit-content detection
 * shipping enabled is not a theoretical limit: an UNCHECKED nudity finding queues on its own
 * whenever a scan does not finish, so the backlog grows without anybody uploading anything
 * objectionable, and a reviewer who cannot reach page 2 cannot empty it.
 *
 * <p>`depth` is unchanged and is NOT derived from the page: it is a grouped count over the whole
 * backlog per detector, which is the number that says whether this queue is a chore or a
 * bottleneck. One page cannot answer that.
 *
 * @param type   optional detector filter (MUSIC, NUDITY). Null means every type.
 * @param states optional state filter. The backend defaults to everything a reviewer has not
 *               dealt with — HELD, ADVISORY, UNCHECKED.
 * @param page   zero-based, as the API counts. The pager converts for the reader.
 */
export const useReviewQueue = ({ type = null, states = null, page = 0, size = 20 } = {},
                               enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.review(type, states, page, scope),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (type) params.set('type', type);
            if (states?.length) params.set('state', states.join(','));
            params.set('page', String(page));
            params.set('size', String(size));
            const res = await api.get(`/review?${params.toString()}`);
            return res.data;
        },
        enabled,
        // A page is kept while the next one loads, so stepping through the queue does not blank
        // the list and bounce the scroll position back to the top between pages.
        placeholderData: keepPreviousData,
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
