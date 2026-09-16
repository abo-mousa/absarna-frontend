import { keepPreviousData, useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { UPLOAD_CONFIRM_TIMEOUT_MS } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

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
        initialPageParam: 0,
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
        initialPageParam: 0,
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
        initialPageParam: 0,
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
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

export const useSubscriptionStatus = (channelId, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.subscriptionStatus(channelId, scope),
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
            // Prefixes: the viewer's scope is the last segment of each of these keys, so a
            // prefix match reaches this viewer's copy without the hook needing the scope itself.
            queryClient.invalidateQueries({ queryKey: ['subscription-status', channelId] });
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            // The feed's "من القنوات التي تتابعها" section is exactly this list.
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        },
    });
};

// ============ Sidebar / Subscriptions page ============

// GET /channels is now paginated (it used to return every active channel in one response) —
// the sidebar's "discover" list only ever needs a bounded first page, not full pagination UI,
// so this just requests the max page size rather than adding "load more" to a nav rail.
/**
 * Active channels, alphabetical, a page at a time — the sidebar's "discover" list.
 *
 * <p>Used to be one request for `page=0&size=100` and nothing after it: loaded on nearly every
 * page, heavier with every channel created, and past the hundredth channel the rest silently did
 * not exist. Now twenty, and the sidebar asks for more.
 */
export const useAllChannels = (enabled = true, size = 20) => {
    return useInfiniteQuery({
        queryKey: ['all-channels', size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get('/channels', { params: { page: pageParam, size } });
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

export const useSubscriptions = (enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.subscriptions(scope),
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
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.myChannels(scope),
        queryFn: async () => {
            const res = await api.get('/channels/my-channels');
            return res.data || [];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

// ============ Owner management (ChannelManage.jsx) ============

/** Rows per page of the owner's paged lists. */
export const MANAGE_PAGE_SIZE = 20;

/**
 * One page (zero-based) of the owner's list of one content type, as the backend's usual page
 * object (`content`, `currentPage`, `totalPages`, `totalItems`, `hasNext`, `hasPrevious`).
 *
 * <p>Paged because an import put 1,928 videos on one dashboard, which fetched and rendered every
 * one of them per visit — and the other types use the same list, so they page the same way.
 */
export const useChannelContentList = (slug, type, enabled = true, page = 0, series = null) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.channelManage(slug, type, page, scope, series),
        queryFn: async () => {
            const params = { page, size: MANAGE_PAGE_SIZE };
            // Videos only: a series id for that series in its own order, or 'none'.
            if (series !== null) params.series = series;
            const res = await api.get(`/channels/${slug}/content/${type}`, { params });
            return res.data;
        },
        enabled: enabled && !!slug && !!type,
        // The current page stays on screen while the next loads, so the list does not collapse
        // to "loading" and yank the scroll position between pages.
        placeholderData: keepPreviousData,
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
            // TODO(backend): `VideoDTO` carries no `channelName`/`channelSlug`/`channelLogoUrl`,
            // so every VideoCard resolves its channel with its own `useChannel(...)` query —
            // one cached query per distinct channel, shared across the cards, but still a
            // separate request the card cannot avoid. Until those three fields are attached to
            // `VideoDTO` the way `seriesTitle` and `commentCount` already are (one batched query
            // per response on the backend, see its CLAUDE.md), a rename has to reach those
            // per-card queries some other way — which is this line.
            //
            // Whole `['channel']` prefix, not just this slug: a card holds `['channel', slug]`
            // keyed by the slug it read off the DTO, and a rename may have changed the slug
            // itself, so the stale entry is not necessarily the one just written.
            queryClient.invalidateQueries({ queryKey: ['channel'] });
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

/**
 * Edits one item's metadata — title, description, and the rest.
 *
 * <p>PATCH, and the body carries only what changed: every Update DTO on the backend merges with
 * `NullValuePropertyMappingStrategy.IGNORE`, so an omitted field is left alone rather than
 * nulled. Sending the whole object would work too, but would silently overwrite anything the
 * form does not render.
 */
export const useUpdateChannelContent = (slug, type) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, changes }) => {
            const res = await api.patch(`/channels/${slug}/content/${type}/${id}`, changes);
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

/**
 * Re-queues a transcode the pipeline gave up on.
 *
 * <p><b>The owner's only route out of a FAILED upload, and until it existed there was none.</b>
 * Nothing retries these automatically and that is deliberate on the backend's side: a source
 * ffmpeg cannot decode fails identically every time, and re-queueing it forever burns hours of
 * CPU per attempt. But plenty of failures are not about the file — the worker ran out of disk, the
 * box restarted mid-encode, storage was briefly refusing writes — and for those the right answer
 * is a person who can see the failure and press a button. Before this the whole recourse was
 * deleting the video and uploading the entire file again.
 *
 * <p>Refused with `TRANSCODE_NOT_RETRYABLE` when the video is not FAILED (a job may still be
 * running, and a second one would be a duplicate full transcode) or has no uploaded file at all
 * (an imported video plays from YouTube and never had a master). `describeError` words both.
 *
 * <p>Invalidated through the shared helper, so the owner's list and every public list that mirrors
 * it pick up the status going back to UPLOADED — which is the only way the owner ever learns
 * anything here, there being no notification channel by design.
 */
export const useRetryTranscode = (slug) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (videoId) => {
            const res = await api.post(`/channels/${slug}/content/videos/${videoId}/retry-transcode`);
            return res.data;
        },
        onSuccess: () => invalidateChannelContent(queryClient, slug, 'videos'),
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
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminPendingChannels(scope),
        queryFn: async () => {
            const res = await api.get('/channels/admin/pending');
            return res.data || [];
        },
        enabled,
        staleTime: 30 * 1000,
    });
};

/** One page (zero-based) of every channel on the platform, newest first. */
export const useAllAdminChannels = (page = 0, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminAllChannels(page, scope),
        queryFn: async () => {
            const res = await api.get('/channels/admin/all', { params: { page, size: 20 } });
            return res.data;
        },
        enabled,
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
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

/**
 * Deletes a channel, and with it everything the channel owns.
 *
 * <p><b>The delete cascades in SQL</b> (migration 013): videos, books, articles and posts go, and
 * with them every comment, bookmark and watch-history row attached to them. No Java runs, so
 * nothing can be selectively spared and nothing is recoverable. A channel that has imported a
 * back catalogue can be thousands of rows.
 *
 * <p>That is why the caller makes the operator type the slug rather than click through a
 * confirm — and why suspending, which is reversible, sits next to it as the usual answer.
 */
export const useDeleteChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/channels/admin/${id}`),
        onSuccess: () => invalidateAdminChannels(queryClient),
    });
};
