import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

// Same route/content "type" strings the rest of the app uses, mapped to the backend's
// ContentItemType enum — mirrors useBookmarks' ITEM_TYPE for the same reason.
const ITEM_TYPE = { video: 'VIDEO', book: 'BOOK', article: 'ARTICLE' };

/**
 * Every cached shape that carries a `VideoDTO.likeCount`, as query-key prefixes.
 *
 * <p>Exported so a test can assert the list rather than trusting a comment. This exists because
 * `onSettled` used to invalidate only the status query while its own doc claimed the counts on
 * cards were refreshed too: liking a video from its detail page left every list that had already
 * rendered it — the feed you came from, the related row right underneath — showing the old
 * number until its staleTime elapsed.
 *
 * <p>Only video lists: the backend attaches `likeCount` to `VideoDTO` alone, and
 * `BookDTO`/`ArticleDTO` get their count from the status endpoint instead (see backend
 * CLAUDE.md's Likes section). `invalidateQueries` refetches only *mounted* queries and merely
 * marks the rest stale, so a broad list here costs at most the lists actually on screen.
 */
export const VIDEO_LIST_KEYS_WITH_LIKE_COUNT = [
    'videos',
    'feed',
    'search',
    'search-infinite',
    'related-video',
    'channel-videos',
    'series',
    'watch-history',
    'bookmarks',
    'channel-manage',
];

/**
 * `{liked, likeCount}` for one item.
 *
 * Unlike useBookmarkStatus this runs for anonymous visitors too, and that is deliberate: the
 * backend's status endpoint is public (the count is public data, `liked` is derived from the
 * caller's own token and comes back false without one). A logged-out visitor still needs to see
 * how many people liked something.
 *
 * `initialCount` is the count the caller already has from the DTO on screen. It seeds the query
 * as placeholder data, so the number never renders as 0 (or the button as "-1" on a press before
 * the request lands) on a video whose real count is 57. It is a placeholder rather than
 * `initialData` on purpose: placeholder data is never written into the cache, so a stale DTO
 * count cannot outlive the fetch it is standing in for.
 */
export const useLikeStatus = (type, id, enabled = true, initialCount = undefined) => {
    const itemType = ITEM_TYPE[type];
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.likeStatus(itemType, id, scope),
        queryFn: async () => {
            const res = await api.get(`/likes/${itemType}/${id}/status`);
            return { liked: !!res.data?.liked, likeCount: res.data?.likeCount ?? 0 };
        },
        enabled: enabled && !!itemType && !!id,
        staleTime: 60 * 1000,
        placeholderData: Number.isFinite(initialCount)
            ? { liked: false, likeCount: initialCount }
            : undefined,
    });
};

/**
 * The optimistic next state of a like toggle.
 *
 * Exported and pure so the arithmetic is testable without a React harness. Two things it has to
 * get right: the clamp — with no cached status and no fallback there is no count to decrement,
 * and an unclamped result renders as "-1 إعجاب" — and `fallbackCount`, the count the caller
 * already had from its DTO, which is what stops the first press on an item whose status query
 * has not resolved from rendering "1" on a video with 57 likes.
 */
export const nextLikeState = (previous, currentlyLiked, fallbackCount) => {
    const base = previous?.likeCount ?? (Number.isFinite(fallbackCount) ? fallbackCount : 0);
    return {
        liked: !currentlyLiked,
        likeCount: Math.max(0, base + (currentlyLiked ? -1 : 1)),
    };
};

/**
 * A plain toggle — both directions are idempotent on the backend, so there is no add/remove
 * conflict state to handle.
 *
 * The count is updated optimistically and rolled back on failure. Not decoration: the button
 * shows the number right next to itself, so a press that visibly does nothing until the request
 * lands reads as broken, and the alternative (invalidate and refetch) shows a stale count for a
 * round trip.
 */
export const useToggleLike = (type, id, initialCount = undefined) => {
    const itemType = ITEM_TYPE[type];
    const scope = useUserScope();
    const queryClient = useQueryClient();
    const key = queryKeys.likeStatus(itemType, id, scope);

    return useMutation({
        mutationFn: async (currentlyLiked) => {
            if (currentlyLiked) {
                await api.delete(`/likes/${itemType}/${id}`);
            } else {
                await api.post(`/likes/${itemType}/${id}`);
            }
            return !currentlyLiked;
        },
        onMutate: async (currentlyLiked) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key);
            queryClient.setQueryData(key, (old) => nextLikeState(old, currentlyLiked, initialCount));
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(key, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: key });
            // The count on every card that already rendered this video. Without these, liking
            // from a detail page left the feed behind it — and the related row under it —
            // showing the pre-press number for the rest of their staleTime.
            if (type === 'video') {
                queryClient.invalidateQueries({ queryKey: ['video', id] });
                VIDEO_LIST_KEYS_WITH_LIKE_COUNT.forEach((prefix) => {
                    queryClient.invalidateQueries({ queryKey: [prefix] });
                });
            }
        },
    });
};
