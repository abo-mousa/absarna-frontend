import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

// Channel-owner moderation dashboard data — every comment across the channel's own
// video/book/article content, any state (including already-hidden ones, so the owner can
// un-hide them; the public per-content comment list never returns hidden comments, which is
// why this needs its own endpoint rather than reusing useComments).
//
// "Load more" pagination, same accumulating-pages shape as useChannelBooks/useChannelContents —
// this endpoint used to return every comment on the channel's entire content in one response.
export const useChannelComments = (slug, size = 50, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['channel-comments', slug, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/channels/${slug}/content/comments?page=${pageParam}&size=${size}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

// Hide/unhide, pin/unpin — not "approve": display was never gated on approval (see backend
// CLAUDE.md's Comment.hidden note), so there's no separate approve action here.
export const useModerateComment = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...changes }) => {
            const res = await api.patch(`/comments/${id}/moderate`, changes);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel-comments', slug] });
            // The public per-content comment list (useComments, keyed by [type, contentId])
            // isn't invalidated here — this hook doesn't know which of the channel's many
            // videos/books/articles the moderated comment belongs to. It self-corrects once
            // that query's own 30s staleTime elapses.
        },
    });
};
