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

/**
 * A channel's detail, with the CALLER's rights on it (`viewerIsOwner`, `viewerCanManage`) — the
 * backend's answer, so nothing here derives them from an owner id and a role. Scoped to the
 * viewer for that reason; prefix invalidations of `['channel']` / `['channel', slug]` still reach it.
 */
export const useChannel = (slug, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.channel(slug, scope),
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}`);
            return res.data;
        },
        enabled: enabled && !!slug,
    });
};

// "Load more" pagination, same accumulating-pages shape as useInfiniteVideos — a channel's
// video tab used to hard-cap at one 50-item page with no way to see older videos past that.
//
// `search` narrows the list to this channel's matching videos. It is part of the query key, so
// each term caches separately and clearing the box returns the unfiltered list instantly; and
// `keepPreviousData` holds the previous term's results on screen while the next request is in
// flight, so typing does not empty the grid between keystrokes.
export const useChannelVideos = (slug, size = 24, enabled = true, search = '') => {
    const term = (search || '').trim();
    return useInfiniteQuery({
        queryKey: ['channel-videos', slug, size, term],
        queryFn: async ({ pageParam = 0 }) => {
            const params = new URLSearchParams({ page: pageParam, size });
            if (term) params.set('search', term);
            const res = await api.get(`/channels/${slug}/videos?${params}`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        placeholderData: keepPreviousData,
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

/**
 * Follow or unfollow a channel, and show it at the moment it is pressed.
 *
 * <p><b>The flicker this fixes.</b> Without the optimistic write the button went through three
 * states on one press: the label vanished while the request was in flight, then came back reading
 * what it read BEFORE the press — because the request had finished but the status refetch it
 * triggers had not — and only then settled on the new one. Two round trips, and the middle of them
 * showed the viewer their press had done nothing. On a slow connection that middle state is the
 * one they see longest, and the natural response to it is to press again, which is a second
 * request undoing the first.
 *
 * <p>So the cache is written before the request goes out and rolled back if it fails. The
 * invalidation stays — it is what reconciles the count and the feed with the truth — but it is no
 * longer the thing the button is waiting for.
 */
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
        onMutate: async (subscribed) => {
            // A refetch already in flight would land after this write and put the old answer
            // back, which is the same flicker arriving by a different route.
            await queryClient.cancelQueries({ queryKey: ['subscription-status', channelId] });
            // Prefix, not the exact key: the viewer's scope is the last segment (lib/queryKeys.js)
            // and this hook does not have it. Snapshotted as pairs so the rollback can put each
            // one back exactly where it came from.
            const previous = queryClient.getQueriesData({
                queryKey: ['subscription-status', channelId],
            });
            queryClient.setQueriesData(
                { queryKey: ['subscription-status', channelId] },
                (old) => (old ? { ...old, subscribed: !subscribed } : old),
            );
            return { previous };
        },
        onError: (_error, _subscribed, context) => {
            // Back to exactly what was there. A button left claiming a subscription the server
            // refused is worse than one that never moved: the next press would send the opposite
            // request to the one the viewer means.
            for (const [key, data] of context?.previous ?? []) {
                queryClient.setQueryData(key, data);
            }
        },
        onSuccess: () => {
            // Prefixes: the viewer's scope is the last segment of each of these keys, so a
            // prefix match reaches this viewer's copy without the hook needing the scope itself.
            queryClient.invalidateQueries({ queryKey: ['subscription-status', channelId] });
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
            // The directory leaves out followed channels, so following one moves it out of there.
            queryClient.invalidateQueries({ queryKey: ['channel-directory'] });
            queryClient.invalidateQueries({ queryKey: ['channels-suggested'] });
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
/**
 * The Channels page's directory: active channels less the reader's own and followed ones, which
 * the backend leaves out itself. Viewer-scoped, with the scope last, because the answer depends on
 * who is asking.
 */
export const useChannelDirectory = (size = 24) => {
    const scope = useUserScope();
    return useInfiniteQuery({
        queryKey: ['channel-directory', size, scope],
        queryFn: async ({ pageParam = 0 }) => (await api.get('/channels/directory', { params: { page: pageParam, size } })).data,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
    });
};

/**
 * Channels to suggest to this reader, ranked by the backend (`GET /api/channels/suggested`): the
 * largest public catalogues, less their own and the ones they follow. User-scoped, because what
 * is left out depends on who is asking; a subscribe toggle invalidates it.
 */
export const useSuggestedChannels = (size = 8) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: ['channels-suggested', size, scope],
        queryFn: async () => (await api.get('/channels/suggested', { params: { size } })).data || [],
    });
};

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
            queryClient.invalidateQueries({ queryKey: ['channel-directory'] });
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
export const useChannelContentList = (slug, type, enabled = true, page = 0, series = null, search = '') => {
    const scope = useUserScope();
    const term = (search || '').trim();
    return useQuery({
        queryKey: queryKeys.channelManage(slug, type, page, scope, series, term),
        queryFn: async () => {
            const params = { page, size: MANAGE_PAGE_SIZE };
            // Videos only: a series id for that series in its own order, or 'none'.
            if (series !== null) params.series = series;
            // The backend ignores `series` when a term is present — filtering by text and
            // browsing by series are two ways of finding the same thing, and combining them
            // makes "no results" ambiguous. The dashboard only offers the box on the flat list.
            if (term) params.search = term;
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
        onSuccess: () => {
            // No setQueryData from the PATCH response: it is the plain mapping, without the
            // caller's rights or the archive counts the detail carries, and writing it over the
            // detail made the dashboard's owner look like someone who may not manage it. The
            // invalidation below refetches the whole detail instead.
            // `VideoDTO` now carries `channelName`/`channelSlug`/`channelLogoUrl`, batch-filled by
            // the backend's ChannelCardAttacher, so a VideoCard no longer runs a `useChannel(...)`
            // of its own and a rename does not have to chase one. What it has to chase instead is
            // every cached LIST, because the channel's name is now a field inside those responses
            // — which is the trade the batching makes: one fewer request per card, and staleness
            // that lives in the list rather than beside it.
            //
            // Whole `['channel']` prefix, not just this slug: the detail pages still hold
            // `['channel', slug]` keyed by the slug they read off a DTO, and a rename may have
            // changed the slug itself, so the stale entry is not necessarily the one just written.
            queryClient.invalidateQueries({ queryKey: ['channel'] });
            // The lists that now embed the channel's name and logo. Broad on purpose: a rename is
            // rare and a missed key shows an owner the old name on their own cards.
            ['videos', 'video', 'feed', 'channel-videos', 'channel-manage', 'search',
                'search-infinite', 'search-suggestions', 'bookmarks', 'watch-history',
                'related-video', 'series'].forEach((key) =>
                queryClient.invalidateQueries({ queryKey: [key] }));
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

/**
 * Flips one item's `visible` in a cached page of the manage list.
 *
 * <p>Exported and tested on its own: it is the shape of the paged response that makes this
 * fiddly, and there is no jsdom here to press the button in.
 */
export const withVisibilityFlipped = (page, itemId, visible) => (
    Array.isArray(page?.content)
        ? { ...page, content: page.content.map((row) => (row.id === itemId ? { ...row, visible } : row)) }
        : page
);

/**
 * Shows or hides one item from visitors.
 *
 * <p><b>Optimistic, like the subscribe toggle and for the same reason.</b> Waiting for the server
 * meant the eye icon did not move until a PATCH *and* the list refetch it triggers had both come
 * back: two round trips during which the owner's press had no visible effect at all, and then the
 * row changed under them. On a control whose entire output is one icon, that reads as a button
 * that ignored the press and then glitched.
 *
 * <p>Every cached page is written, matched by prefix — the list is paged and per-series, and the
 * viewer's scope is the last segment of the key (lib/queryKeys.js), none of which this hook has.
 * `onSettled`, not `onSuccess`: a refetch after a failure is what replaces the rolled-back guess
 * with the server's answer.
 */
export const useToggleContentVisibility = (slug, type) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (item) => {
            await api.patch(`/channels/${slug}/content/${type}/${item.id}/visibility`, {
                visible: !item.visible,
            });
        },
        onMutate: async (item) => {
            // A refetch already in flight would land after this write and put the old answer
            // back, which is the same flicker arriving by a different route.
            await queryClient.cancelQueries({ queryKey: ['channel-manage', slug, type] });
            const previous = queryClient.getQueriesData({ queryKey: ['channel-manage', slug, type] });
            queryClient.setQueriesData(
                { queryKey: ['channel-manage', slug, type] },
                (page) => withVisibilityFlipped(page, item.id, !item.visible),
            );
            return { previous };
        },
        onError: (_error, _item, context) => {
            // Back to exactly what was there. A row left claiming a visibility the server refused
            // is worse than one that never moved: the next press would send the opposite request
            // to the one the owner means.
            for (const [key, data] of context?.previous ?? []) {
                queryClient.setQueryData(key, data);
            }
        },
        onSettled: () => invalidateChannelContent(queryClient, slug, type),
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
    // The navbar badge counts pending channels — approving or rejecting one changes it.
    queryClient.invalidateQueries({ queryKey: ['admin-attention'] });
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
/**
 * The invitation link for a seeded channel, fetched on demand so an admin can put it in an email.
 *
 * <p>A mutation rather than a query because it is an ACTION: the backend mints the token on first
 * read, and issuing an invitation is not something a screen should do merely by rendering a row.
 *
 * <p>What comes back scopes who is SHOWN the claim offer, not who may take the channel — that
 * still needs control of its YouTube channel. Which is why this can be copied into an ordinary
 * email without ceremony.
 */
/**
 * Opens or withdraws a channel's claim offer.
 *
 * <p>Attesting a YouTube link opens one already, so this covers what that misses — a channel
 * seeded before that rule, or one whose content never came from YouTube — and taking an offer
 * back, which matters because the notice an unclaimed channel shows is public.
 *
 * <p>Invalidates the admin lists rather than writing the row: the reply is the updated channel,
 * but `claimState` changes which controls that row offers, and getting that from the server is
 * cheaper to reason about than patching two cached pages by hand.
 */
export const useSetChannelClaimable = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ channelId, claimable }) =>
            (await api.post(`/channels/admin/${channelId}/claimable`, { claimable })).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-all-channels'] });
            queryClient.invalidateQueries({ queryKey: ['admin-pending-channels'] });
        },
    });
};

export const useChannelClaimLink = () =>
    useMutation({
        mutationFn: async (channelId) =>
            (await api.get(`/channels/admin/${channelId}/claim-link`)).data,
    });

/**
 * Emails the invitation, in the language the admin picked.
 *
 * <p><b>Beside the copy-link button, never instead of it.</b> A scholar reachable only through a
 * student, an assistant or a WhatsApp message is common enough that removing the clipboard would
 * be a regression. What this adds is the two things a hand-written mail cannot have: one wording
 * for the most delicate message the platform sends, and a record on the channel that the next
 * admin to look at this row can see.
 *
 * <p>Invalidates rather than writing the reply into the cache, like `useSetChannelClaimable` above
 * and for the same reason: the response carries the updated channel, but the row's controls read
 * `claimState` and `claimInvitation` together, and re-reading both from the server is cheaper to
 * reason about than patching two cached pages by hand.
 */
export const useInviteChannelOwner = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ channelId, email, locale }) =>
            (await api.post(`/channels/admin/${channelId}/invite`, { email, locale })).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-all-channels'] });
            queryClient.invalidateQueries({ queryKey: ['admin-pending-channels'] });
        },
    });
};

export const useDeleteChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/channels/admin/${id}`),
        onSuccess: () => invalidateAdminChannels(queryClient),
    });
};

/**
 * The owner deleting their own channel (`DELETE /channels/{id}`), password-confirmed.
 *
 * <p>Not `useDeleteChannel`: that is the admin route, which the backend refuses to anyone else, and
 * this one it refuses to anyone but the owner — an admin included. On success the channel's own
 * entry is dropped rather than invalidated, because a refetch of a deleted channel is a 404 the
 * dashboard would render on the way out.
 */
export const useDeleteOwnChannel = (slug, channelId) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (currentPassword) =>
            api.delete(`/channels/${channelId}`, { data: { currentPassword } }),
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: ['channel', slug] });
            queryClient.invalidateQueries({ queryKey: ['my-channels'] });
            invalidateAdminChannels(queryClient);
        },
    });
};

/**
 * Replaces a channel's content-detection exemptions.
 *
 * <p><b>PUT of the whole set, not a grant and a revoke.</b> The screen is a checkbox per detector
 * and the decision is "this channel, these detectors, for this reason" — a per-type endpoint would
 * let two exemptions on one channel carry different grantors and different reasons, so "who
 * decided this" would depend on which detector you asked about. Sending `types: []` revokes
 * everything.
 *
 * <p><b>It is forward-looking, and the dialog says so.</b> It changes which scans are asked for on
 * uploads from now on; it does not touch a finding that already exists, so a video a detector has
 * already flagged stays in the review queue until a human decides on it. Nothing is re-queued
 * either — re-running a ladder in order to skip a scan would spend exactly the CPU the exemption
 * exists to save.
 */
/**
 * A channel's detector exemptions, for the two admin surfaces that show them.
 *
 * <p><b>Its own request, deliberately not a field on the channel payload.</b> The backend attaches
 * `reviewExemptions` only at its admin call sites, so the public channel endpoint — which the
 * channel page and its settings both already load — does not carry it and must not start to.
 * Fetching it separately keeps that server-side disclosure decision intact and keeps the answer
 * out of any response a non-admin can obtain.
 */
export const useChannelReviewExemptions = (channelId, enabled = true) =>
    useQuery({
        queryKey: queryKeys.channelReviewExemptions(channelId),
        queryFn: async () => {
            const res = await api.get(`/channels/admin/${channelId}/review-exemptions`);
            return res.data;
        },
        enabled: enabled && !!channelId,
        staleTime: 30 * 1000,
    });

export const useSetChannelReviewExemptions = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, types, reason }) =>
            api.put(`/channels/admin/${id}/review-exemptions`, { types, reason }),
        // Both readers: the admin list, which carries exemptions on every row, and the
        // per-channel query the channel's own settings tab uses. Invalidating only the first left
        // the settings panel showing what it had before the save.
        onSuccess: (_data, { id }) => {
            invalidateAdminChannels(queryClient);
            queryClient.invalidateQueries({ queryKey: queryKeys.channelReviewExemptions(id) });
        },
    });
};
