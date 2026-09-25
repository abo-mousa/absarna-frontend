import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { NO_CACHE } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The Today page's data (`GET /api/today`): the week, what to continue, the news and one
 * "because you finished" row, in one response.
 *
 * <p>User-scoped, with the viewer last in the key like every personal list, because most of it
 * is the caller's own — and NO_CACHE like the feed: coming back from a finished episode must show
 * the next one, not the one just watched.
 */
export const useToday = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.today(scope),
        queryFn: async () => (await api.get('/today')).data,
        ...NO_CACHE,
    });
};
