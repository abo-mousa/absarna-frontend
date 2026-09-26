import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { NO_CACHE } from '@/lib/queryCache';
import { queryKeys } from '@/lib/queryKeys';
import { useUserScope } from './useUserScope';

/**
 * The Today page's data (`GET /api/today`): the week, what to continue, the news and the feed's
 * suggestions, in one response.
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

/**
 * «إخفاء» on a «تكملة ما بدأته» card (`POST /api/user/continue/hidden`): a programme (`SERIES`, by
 * series id) or a `BOOK`. Gone from the page at once — taken out of the cached Today answer before
 * the request lands — and put back if it fails. The backend hides it until the reader returns to it.
 */
export const useHideContinue = () => {
    const queryClient = useQueryClient();
    const scope = useUserScope();
    const key = queryKeys.today(scope);
    return useMutation({
        mutationFn: ({ type, id }) => api.post('/user/continue/hidden', { type, id }),
        onMutate: async ({ type, id }) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData(key);
            queryClient.setQueryData(key, (data) => data && ({
                ...data,
                continueWatching: type === 'SERIES'
                    ? (data.continueWatching || []).filter((item) => item.next?.seriesId !== id)
                    : data.continueWatching,
                continueReading: type === 'BOOK'
                    ? (data.continueReading || []).filter((entry) => entry.bookId !== id)
                    : data.continueReading,
            }));
            return { previous };
        },
        onError: (_error, _vars, context) => {
            if (context?.previous) queryClient.setQueryData(key, context.previous);
        },
    });
};
