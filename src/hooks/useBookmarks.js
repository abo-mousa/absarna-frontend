import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

// Maps this app's route/content "type" strings (used everywhere else — CommentsSection,
// useComments, etc.) to the backend's BookmarkItemType enum values.
const ITEM_TYPE = { video: 'VIDEO', book: 'BOOK', article: 'ARTICLE' };

// "Is *this* item bookmarked by the current viewer" — for a single detail page's toggle
// button. Anonymous callers never have anything bookmarked, so this stays disabled when
// logged out rather than hitting an endpoint that needs auth.
export const useBookmarkStatus = (type, id, enabled = true) => {
    const itemType = ITEM_TYPE[type];
    return useQuery({
        queryKey: ['bookmark-status', itemType, id],
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
        onSuccess: (nowBookmarked) => {
            queryClient.setQueryData(['bookmark-status', itemType, id], nowBookmarked);
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        },
    });
};

// The "المحفوظات" (saved / read later) page's full list — bounded/non-paginated, same
// transparent-list design as watch/reading history (never a ranking signal, see backend
// CLAUDE.md). Each entry carries itemType plus exactly one of content/book/article.
export const useBookmarks = (enabled = true) => {
    return useQuery({
        queryKey: ['bookmarks'],
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
