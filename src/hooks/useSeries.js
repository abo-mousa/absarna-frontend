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
 */
export const useChannelSeries = (slug, enabled = true, size = 24) => {
    return useInfiniteQuery({
        queryKey: ['channel-series', slug, size],
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

export const useDeleteSeries = (slug) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(`/channels/${slug}/content/series/${id}`);
        },
        onSuccess: () => {
            invalidateSeries(queryClient, slug);
            // Videos that were in the deleted series are now detached (backend: ON DELETE SET
            // NULL, not cascaded) — their seriesId changed, so the owner's video list is stale too.
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug, 'videos'] });
        },
    });
};
