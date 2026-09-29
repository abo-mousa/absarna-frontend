import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

// Maps this app's route/content "type" strings (used everywhere else — CommentsSection,
// useComments, etc.) to the backend's BookmarkItemType enum values.
const ITEM_TYPE = { video: 'VIDEO', book: 'BOOK', article: 'ARTICLE' };

// "Is *this* item bookmarked by the current viewer" — for a single detail page's toggle
// button. Anonymous callers never have anything bookmarked, so this stays disabled when
// logged out rather than hitting an endpoint that needs auth.
export const useBookmarkStatus = (type, id, enabled = true) => {
    const itemType = ITEM_TYPE[type];
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.bookmarkStatus(itemType, id, scope),
        queryFn: async () => {
            const res = await api.get(`/bookmarks/${itemType}/${id}/status`);
            return !!res.data?.bookmarked;
        },
        enabled: enabled && !!itemType && !!id,
        staleTime: 60 * 1000,
    });
};

// Add/remove is a plain toggle from the caller's point of view — both directions are
// idempotent on the backend, so there's no separate add/remove-conflict state to handle here.
export const useToggleBookmark = (type, id) => {
    const itemType = ITEM_TYPE[type];
    const scope = useUserScope();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (currentlyBookmarked) => {
            if (currentlyBookmarked) {
                await api.delete(`/bookmarks/${itemType}/${id}`);
            } else {
                await api.post(`/bookmarks/${itemType}/${id}`);
            }
            return !currentlyBookmarked;
        },
        // Optimistic, as likes and subscriptions are: the button flips on the press and flips
        // back if the request fails, rather than sitting disabled for the round trip and jumping.
        onMutate: async (currentlyBookmarked) => {
            const key = queryKeys.bookmarkStatus(itemType, id, scope);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key);
            queryClient.setQueryData(key, !currentlyBookmarked);
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous !== undefined) {
                queryClient.setQueryData(queryKeys.bookmarkStatus(itemType, id, scope), context.previous);
            }
        },
        onSuccess: (nowBookmarked) => {
            queryClient.setQueryData(queryKeys.bookmarkStatus(itemType, id, scope), nowBookmarked);
            // A prefix, deliberately: it matches this viewer's list without repeating the scope,
            // which is why every user-scoped key carries its scope as the LAST segment.
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};

// The "المحفوظات" (saved / read later) page's full list — bounded/non-paginated, same
// transparent-list design as watch/reading history (never a ranking signal, see backend
// CLAUDE.md). Each entry carries itemType plus exactly one of content/book/article.
export const useBookmarks = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.bookmarks(scope),
        queryFn: async () => {
            const res = await api.get('/user/bookmarks?limit=200');
            return res.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useClearBookmarks = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await api.delete('/user/bookmarks');
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
    });
};
