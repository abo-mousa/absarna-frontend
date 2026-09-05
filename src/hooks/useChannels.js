import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { UPLOAD_CONFIRM_TIMEOUT_MS } from '@/lib/api/client';

// Maps a content type to the query key its public channel-page list is cached under —
// shared by the owner-management mutations below so a publish/toggle/delete on
// ChannelManage.jsx invalidates the same list ChannelPage.jsx's visitors see.
const PUBLIC_LIST_KEY = {
    videos: 'channel-videos',
    books: 'channel-books',
    articles: 'channel-articles',
    posts: 'channel-posts',
};

// ============ Public channel page ============

export const useChannel = (slug, enabled = true) => {
    return useQuery({
        queryKey: ['channel', slug],
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}`);
            return res.data;
        },
        enabled: enabled && !!slug,
    });
};

// "Load more" pagination, same accumulating-pages shape as useInfiniteVideos — a channel's
// video tab used to hard-cap at one 50-item page with no way to see older videos past that.
export const useChannelVideos = (slug, size = 24, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['channel-videos', slug, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/channels/${slug}/videos?page=${pageParam}&size=${size}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

// "Load more" pagination, same accumulating-pages shape as useChannelVideos — a channel's
// books tab used to fetch its whole (unpaginated) list in one response.
export const useChannelBooks = (slug, size = 50, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['channel-books', slug, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/channels/${slug}/books?page=${pageParam}&size=${size}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

export const useChannelArticles = (slug, size = 50, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['channel-articles', slug, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/channels/${slug}/articles?page=${pageParam}&size=${size}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

export const useChannelPosts = (slug, size = 50, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['channel-posts', slug, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/channels/${slug}/posts?page=${pageParam}&size=${size}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

export const useSubscriptionStatus = (channelId, enabled = true) => {
    return useQuery({
        queryKey: ['subscription-status', channelId],
        queryFn: async () => {
            const res = await api.get(`/channels/${channelId}/subscription-status`);
            return res.data;
        },
        enabled: enabled && !!channelId,
    });
};

export const useToggleSubscription = (channelId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (subscribed) => {
            if (subscribed) {
                await api.delete(`/channels/${channelId}/subscribe`);
            } else {
                await api.post(`/channels/${channelId}/subscribe`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-status', channelId] });
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
    });
};

// ============ Sidebar / Subscriptions page ============

// GET /channels is now paginated (it used to return every active channel in one response) —
// the sidebar's "discover" list only ever needs a bounded first page, not full pagination UI,
// so this just requests the max page size rather than adding "load more" to a nav rail.
export const useAllChannels = (enabled = true) => {
    return useQuery({
        queryKey: ['all-channels'],
        queryFn: async () => {
            const res = await api.get('/channels?page=0&size=100');
            return res.data?.content || res.data || [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSubscriptions = (enabled = true) => {
    return useQuery({
        queryKey: ['subscriptions'],
        queryFn: async () => {
            const res = await api.get('/user/subscriptions');
            return res.data || [];
        },
        enabled,
    });
};

export const useUnsubscribe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (channelId) => {
            await api.delete(`/channels/${channelId}/subscribe`);
            return channelId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
    });
};

export const useMyChannels = (enabled = true) => {
    return useQuery({
        queryKey: ['my-channels'],
        queryFn: async () => {
            const res = await api.get('/channels/my-channels');
            return res.data || [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

// ============ Owner management (ChannelManage.jsx) ============

export const useChannelContentList = (slug, type, enabled = true) => {
    return useQuery({
        queryKey: ['channel-manage', slug, type],
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}/content/${type}`);
            return res.data || [];
        },
        enabled: enabled && !!slug && !!type,
    });
};

export const useUpdateChannel = (slug, channelId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (form) => {
            const res = await api.patch(`/channels/${channelId}`, form);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['channel', slug], data);
        },
    });
};

// Shared invalidation for any owner mutation (publish/toggle/delete) on one channel's content
// list — refreshes both the owner's manage view and whatever public list mirrors it.
const invalidateChannelContent = (queryClient, slug, type) => {
    queryClient.invalidateQueries({ queryKey: ['channel-manage', slug, type] });
    const publicKey = PUBLIC_LIST_KEY[type];
    if (publicKey) queryClient.invalidateQueries({ queryKey: [publicKey, slug] });
    if (type === 'videos') {
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
};

/**
 * Per-request axios config for a content-create call.
 *
 * A payload carrying an `uploadSessionId` is the confirm step of a presigned upload, and the
 * backend does real work for it — a paginated `ListParts` plus `CompleteMultipartUpload` over an
 * object that may be several GB. The client's 30s default aborted that mid-flight while the
 * server carried on and created the video, so the user was told publishing failed for a video
 * that now exists. Every other create here is an ordinary insert and keeps the default.
 *
 * Exported so the rule is testable on its own — the hook it feeds needs a React tree.
 */
export const contentCreateConfig = (payload) =>
    payload?.uploadSessionId ? { timeout: UPLOAD_CONFIRM_TIMEOUT_MS } : undefined;

export const useCreateChannelContent = (slug, type) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload) => {
            const res = await api.post(
                `/channels/${slug}/content/${type}`, payload, contentCreateConfig(payload));
            return res.data;
        },
        onSuccess: () => invalidateChannelContent(queryClient, slug, type),
    });
};

export const useToggleContentVisibility = (slug, type) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item) => {
            await api.patch(`/channels/${slug}/content/${type}/${item.id}/visibility`, {
                visible: !item.visible,
            });
        },
        onSuccess: () => invalidateChannelContent(queryClient, slug, type),
    });
};

export const useDeleteContent = (slug, type) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item) => {
            await api.delete(`/channels/${slug}/content/${type}/${item.id}`);
        },
        onSuccess: () => invalidateChannelContent(queryClient, slug, type),
    });
};

// Home's feed mixes videos from many owned channels, so (unlike the tab hooks above, which are
// scoped to one fixed slug via useParams) the slug varies per call and is passed with the video.
export const useToggleVideoVisibilityByChannelId = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ slug, video }) => {
            await api.patch(`/channels/${slug}/content/videos/${video.id}/visibility`, {
                visible: video.visible === false,
            });
        },
        onSuccess: (_data, { slug }) => invalidateChannelContent(queryClient, slug, 'videos'),
    });
};

export const useDeleteVideoByChannelId = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ slug, video }) => {
            await api.delete(`/channels/${slug}/content/videos/${video.id}`);
        },
        onSuccess: (_data, { slug }) => invalidateChannelContent(queryClient, slug, 'videos'),
    });
};

// ============ Admin channel moderation ============

export const usePendingChannels = (enabled = true) => {
    return useQuery({
        queryKey: ['admin-pending-channels'],
        queryFn: async () => {
            const res = await api.get('/channels/admin/pending');
            return res.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

export const useAllAdminChannels = (enabled = true) => {
    return useQuery({
        queryKey: ['admin-all-channels'],
        queryFn: async () => {
            const res = await api.get('/channels/admin/all');
            return res.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

const invalidateAdminChannels = (queryClient) => {
    queryClient.invalidateQueries({ queryKey: ['admin-pending-channels'] });
    queryClient.invalidateQueries({ queryKey: ['admin-all-channels'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
};

export const useApproveChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/channels/admin/${id}/approve`),
        onSuccess: () => invalidateAdminChannels(queryClient),
    });
};

export const useRejectChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/channels/admin/${id}/reject`),
        onSuccess: () => invalidateAdminChannels(queryClient),
    });
};

export const useSuspendChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.post(`/channels/admin/${id}/suspend`),
        onSuccess: () => invalidateAdminChannels(queryClient),
    });
};
