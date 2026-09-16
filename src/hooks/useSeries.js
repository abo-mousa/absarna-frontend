import { keepPreviousData, useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

// ============ Public ============

// A series' own page: its metadata plus its videos in order (backend already orders them,
// nulls-last on orderInSeries then publishDate — see ContentRepository#findBySeriesIdAndVisibleTrue).
/**
 * A series' videos, paginated.
 *
 * <p>The endpoint used to return every video; a 99-video series made that a real cost. Pages
 * accumulate the same way the other listings do, so "load more" appends rather than replaces.
 */
export const useSeriesDetail = (id, size = 20, enabled = true) => {
    return useInfiniteQuery({
        queryKey: ['series', id, size],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/series/${id}`, { params: { page: pageParam, size } });
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!id,
    });
};

/**
 * One video's position in its series, and its neighbours.
 *
 * <p>Its own request rather than something derived from the list above, and that is the point:
 * the detail page needs the position within the *whole* series, and a video on page 4 is not in
 * the page the list happens to have loaded. Deriving it from the list is what paginating the
 * series would otherwise have broken.
 */
export const useSeriesNeighbours = (seriesId, videoId, enabled = true) => {
    return useQuery({
        queryKey: ['series-neighbours', seriesId, videoId],
        queryFn: async () => {
            const res = await api.get(`/series/${seriesId}/neighbours`, { params: { videoId } });
            return res.data;
        },
        enabled: enabled && !!seriesId && !!videoId,
    });
};

// A channel's list of series (e.g. a "series" tab on the channel page).
/**
 * A channel's series, a page at a time — the channel page's series tab.
 *
 * <p>An import creates a series per playlist, so this is as long as a migrating channel's
 * playlist count; it used to come back whole.
 *
 * <p><b>User-scoped, unlike the channel's other public lists</b>, because the answer depends on
 * who asks: a visitor gets the listed series, the channel's owner gets every series with
 * `publiclyListed` marking the hidden ones. Unscoped, an owner's cached list would be served to
 * the next account on the same browser.
 */
export const useChannelSeries = (slug, enabled = true, size = 24) => {
    const scope = useUserScope();
    return useInfiniteQuery({
        queryKey: ['channel-series', slug, size, scope],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/channels/${slug}/series`, { params: { page: pageParam, size } });
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
        enabled: enabled && !!slug,
    });
};

// ============ Owner management (ChannelManage.jsx) ============

export const useChannelSeriesManage = (slug, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.channelSeriesManage(slug, scope),
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}/content/series`);
            return res.data || [];
        },
        enabled: enabled && !!slug,
    });
};

/**
 * One page (zero-based) of the owner's series, for the dashboard's series tab.
 *
 * <p>{@link useChannelSeriesManage} above stays whole on purpose: it feeds the video form's series
 * `<select>`, which has to offer every series.
 */
export const useChannelSeriesManagePage = (slug, page = 0, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.channelSeriesManagePage(slug, page, scope),
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}/content/series`, { params: { page, size: 20 } });
            return res.data;
        },
        enabled: enabled && !!slug,
        placeholderData: keepPreviousData,
    });
};

const invalidateSeries = (queryClient, slug) => {
    queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] });
    queryClient.invalidateQueries({ queryKey: ['channel-series', slug] });
};

/**
 * After a change to a series' videos themselves (hidden, shown, deleted): the series lists, the
 * owner's video lists, and every public list those videos appear in.
 */
const invalidateSeriesAndVideos = (queryClient, slug) => {
    invalidateSeries(queryClient, slug);
    queryClient.invalidateQueries({ queryKey: ['channel-manage', slug, 'videos'] });
    queryClient.invalidateQueries({ queryKey: ['channel-videos', slug] });
    queryClient.invalidateQueries({ queryKey: ['series'] });
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['videos'] });
};

/** Edits a series' title and description. Sends only what changed, like ContentEditModal. */
export const useUpdateSeries = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, changes }) => {
            const res = await api.patch(`/channels/${slug}/content/series/${id}`, changes);
            return res.data;
        },
        onSuccess: () => invalidateSeries(queryClient, slug),
    });
};

/**
 * Hides or shows a whole series. The backend sets every video's own visibility, and showing
 * undoes only what hiding did: a video hidden on its own stays hidden.
 */
export const useSetSeriesVisibility = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, visible }) => {
            const res = await api.patch(`/channels/${slug}/content/series/${id}/visibility`, { visible });
            return res.data;
        },
        onSuccess: () => invalidateSeriesAndVideos(queryClient, slug),
    });
};

export const useCreateSeries = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload) => {
            const res = await api.post(`/channels/${slug}/content/series`, payload);
            return res.data;
        },
        onSuccess: () => invalidateSeries(queryClient, slug),
    });
};

/**
 * Deletes a series. `withVideos: false` keeps its videos, which simply leave the series (backend:
 * ON DELETE SET NULL); `withVideos: true` deletes them too, objects and all. Either way the video
 * lists are stale — their seriesId changed, or they are gone.
 */
export const useDeleteSeries = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, withVideos = false }) => {
            await api.delete(`/channels/${slug}/content/series/${id}`, { params: { withVideos } });
        },
        onSuccess: () => invalidateSeriesAndVideos(queryClient, slug),
    });
};
