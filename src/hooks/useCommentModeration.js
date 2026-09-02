import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

// Channel-owner moderation dashboard data — every comment across the channel's own
// video/book/article content, any state (including already-hidden ones, so the owner can
// un-hide them; the public per-content comment list never returns hidden comments, which is
// why this needs its own endpoint rather than reusing useComments).
export const useChannelComments = (slug, enabled = true) => {
    return useQuery({
        queryKey: ['channel-comments', slug],
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}/content/comments`);
            return res.data || [];
        },
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
