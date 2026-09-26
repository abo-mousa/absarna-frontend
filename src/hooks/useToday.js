import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { NO_CACHE } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The Today page's data (`GET /api/today`): the week, what to continue, the news and one
 * suggestions drawn from what the reader finished, in one response.
 *
 * <p>User-scoped, with the viewer last in the key like every personal list, because most of it
 * is the caller's own — and NO_CACHE like the feed: coming back from a finished episode must show
 * the next one, not the one just watched.
 */
const readerTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
        return undefined;
    }
};

export const useToday = () => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.today(scope),
        // The reader's time zone, so «أسبوعك» (Saturday to Friday) starts at their own Saturday
        // midnight rather than the server's. Absent or unknown, the backend counts in UTC.
        queryFn: async () => (await api.get('/today', { params: { tz: readerTimeZone() } })).data,
        ...NO_CACHE,
    });
};
