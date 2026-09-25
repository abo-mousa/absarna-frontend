import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCount } from '@/lib/numbers';

/** Cache key, shared with the admin mutations that change a count so the badge moves at once. */
export const ADMIN_ATTENTION_KEY = ['admin-attention'];

/**
 * How much is waiting on a platform admin — `{ pendingChannels, reviewBacklog, openReports, total }`
 * — for the badge on the navbar's admin button. Asked only for a platform admin, every two
 * minutes and when the tab comes back into view: three COUNTs server-side, and the queues it
 * describes change on the timescale of uploads and reports, not seconds.
 */
export function useAdminAttention() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ADMIN_ATTENTION_KEY,
        queryFn: async () => (await api.get('/admin/attention')).data,
        enabled: !!user?.platformAdmin,
        refetchInterval: 2 * 60 * 1000,
        refetchOnWindowFocus: true,
        staleTime: 60 * 1000,
    });
}

/**
 * The badge's text: nothing at zero, the number up to 99, then "99+" — in the interface's own
 * digits (formatCount), so the Arabic build reads «٦» like every other figure on screen.
 */
export function badgeText(count) {
    if (!count || count <= 0) return null;
    return count > 99 ? `${formatCount(99)}+` : formatCount(count);
}
