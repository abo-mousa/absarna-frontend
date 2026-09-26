import { useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useUserScope } from './useUserScope';

/**
 * The posts page: channel posts across the platform, newest first — from the channels the reader
 * follows (`followed`), or from every channel.
 *
 * <p>Only the followed view is personal, so only it carries the viewer's scope, as the LAST key
 * segment like every personal list; "all channels" is public and shared between viewers.
 */
/**
 * The Posts stream: everything, the followed channels' (`followed`), or one channel's (`channelId`,
 * the column's filter — it wins over `followed`).
 */
export const usePostsFeed = (followed, size = 20, channelId = null) => {
    const scope = useUserScope();
    return useInfiniteQuery({
        queryKey: channelId ? ['posts', { channel: channelId, size }]
            : followed ? ['posts', { followed: true, size }, scope] : ['posts', { followed: false, size }],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get('/posts', {
                params: { page: pageParam, size, followed: (!channelId && followed) || undefined, channel: channelId || undefined },
            });
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.currentPage + 1 : undefined),
    });
};
