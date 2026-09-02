import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';

// ============ Public ============

// A series' own page: its metadata plus its videos in order (backend already orders them,
// nulls-last on orderInSeries then publishDate — see ContentRepository#findBySeriesIdAndVisibleTrue).
export const useSeriesDetail = (id, enabled = true) => {
    return useQuery({
        queryKey: ['series', id],
        queryFn: async () => {
            const res = await api.get(`/series/${id}`);
            return res.data;
        },
        enabled: enabled && !!id,
    });
};

// A channel's list of series (e.g. a "series" tab on the channel page).
export const useChannelSeries = (slug, enabled = true) => {
    return useQuery({
        queryKey: ['channel-series', slug],
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}/series`);
            return res.data || [];
        },
        enabled: enabled && !!slug,
    });
};

// ============ Owner management (ChannelManage.jsx) ============

export const useChannelSeriesManage = (slug, enabled = true) => {
    return useQuery({
        queryKey: ['channel-series-manage', slug],
        queryFn: async () => {
            const res = await api.get(`/channels/${slug}/content/series`);
            return res.data || [];
        },
        enabled: enabled && !!slug,
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
