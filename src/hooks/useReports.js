import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { LIVE, STANDARD } from '@/lib/queryCache';
import { targetTypeOf } from '@/lib/reports';
import { useUserScope } from './useUserScope';

/**
 * Viewer reporting, and the platform queue it fills.
 *
 * <p>Both halves live here for the same reason the backend put them in one controller: the queue
 * is unreadable without knowing what fills it, and the button is pointless without knowing where
 * it lands. The authorization stories are different — the first two hooks are any signed-in
 * viewer, the rest are platform admin — and the *backend* is what enforces that; a non-admin
 * calling the queue gets a 403 whatever this file does.
 */

/**
 * Whether the calling viewer has already reported this item.
 *
 * <p><b>Only ever about the caller's own report</b>, never about whether anyone else reported it:
 * the backend exposes no such thing, and a platform where the reported party can learn who
 * reported them does not have reporting, it has a grudge mechanism.
 *
 * <p>Disabled without a token rather than called and allowed to 403. A signed-out viewer has
 * reported nothing by definition, so the request could only ever answer `false` — and this chain
 * has no auth entry point, so the 403 would be noise in the console on every detail page a
 * logged-out reader opens.
 */
export const useReportStatus = (type, id, enabled = true) => {
    const targetType = targetTypeOf(type);
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.reportStatus(targetType, id, scope),
        queryFn: async () => {
            const res = await api.get(`/reports/${targetType}/${id}/status`);
            return !!res.data?.reported;
        },
        enabled: enabled && !!targetType && !!id,
        ...STANDARD,
    });
};

/**
 * Files a report. Answers 204 and no body.
 *
 * <p><b>Pressing it twice is safe and is not a mistake to guard against.</b> The backend updates
 * the row it already holds rather than creating a second one, and reopens it if a moderator had
 * decided it — which is the right behaviour for the case that matters: a reader who reported
 * something, saw nothing change, and reported it again with a better note.
 *
 * <p>`setQueryData` rather than an invalidation, because the answer is already known: the request
 * that just succeeded IS the report. An invalidation would spend a round trip re-learning `true`,
 * during which the control would still invite a press.
 */
export const useSubmitReport = (type, id) => {
    const targetType = targetTypeOf(type);
    const scope = useUserScope();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reason, note }) => {
            // `note` is omitted rather than sent empty: the column is nullable and an empty string
            // is not the same fact as "the reporter added nothing".
            const body = note?.trim() ? { reason, note: note.trim() } : { reason };
            await api.post(`/reports/${targetType}/${id}`, body);
            return true;
        },
        onSuccess: () => {
            queryClient.setQueryData(queryKeys.reportStatus(targetType, id, scope), true);
        },
    });
};

// ------------------------------------------------------------------- the moderator's side

/**
 * The query string for one page of the moderation queue.
 *
 * <p>Exported and tested on its own because one detail of it is a contract that fails loudly and
 * for a reason nobody would guess from the symptom: <b>`status` REPEATS</b>. The backend binds a
 * `List<ReportStatus>` from repeated parameters, so `status=OPEN&status=ACTIONED` is two values
 * and `status=OPEN,ACTIONED` is one value that is not a valid enum constant — a 400 on a filter
 * press. The review queue's `state` parameter is comma-joined, which is exactly the kind of
 * near-miss that gets copied from one hook into the other.
 *
 * <p>Page and size are always sent, even at their defaults, so the request a browser's network
 * tab shows is the request that was meant rather than one relying on the server's idea of a page.
 */
export const reportQueueQuery = ({ statuses = null, targetType = null, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    (statuses ?? []).forEach((status) => params.append('status', status));
    if (targetType) params.set('targetType', targetType);
    params.set('page', String(page));
    params.set('size', String(size));
    return params.toString();
};

/**
 * One page of the report queue — platform admin only.
 *
 * <p><b>Paged, and the page is in the key.</b> The review queue shipped without either and was
 * consequently capped at its first twenty findings for as long as it existed; repeating that here
 * would cap moderation at the first twenty complaints, which on a queue nobody can empty is the
 * same as having no queue.
 *
 * <p>`statuses` is a list because the backend takes a repeating `status` parameter: a moderator
 * looking for what they decided yesterday wants ACTIONED and DISMISSED together, and the default
 * (OPEN only) is what the backend applies when it is omitted.
 *
 * <p>The response carries `openTotal` beside the page — the size of the whole backlog, which one
 * page cannot answer.
 */
export const useReportQueue = ({ statuses = null, targetType = null, page = 0, size = 20 } = {},
                               enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminReports(statuses, targetType, page, scope),
        queryFn: async () => {
            const res = await api.get(
                `/reports/admin?${reportQueueQuery({ statuses, targetType, page, size })}`);
            return res.data;
        },
        enabled,
        // A queue two moderators may be working at once. Short, for the same reason the review
        // queue is short: a row someone else has already decided should not stay pressable here.
        ...LIVE,
    });
};

/**
 * Every report standing against one target.
 *
 * <p>What turns a row into a case: `openReportsOnTarget` says ten people objected, and this is
 * the only way to read what the other nine actually said. Fetched on demand — a moderator opens
 * one target at a time, and pre-fetching it per row would be ten requests for a screen where nine
 * are never read.
 */
export const useReportsForTarget = (targetType, targetId, enabled = true) => {
    const scope = useUserScope();
    return useQuery({
        queryKey: queryKeys.adminReportsForTarget(targetType, targetId, scope),
        queryFn: async () => {
            const res = await api.get(`/reports/admin/target/${targetType}/${targetId}`);
            return res.data || [];
        },
        enabled: enabled && !!targetType && !!targetId,
        ...LIVE,
    });
};

/**
 * Records a moderator's judgement on one report.
 *
 * <p><b>This changes nothing about the content.</b> It says a human looked and what they
 * concluded; hiding a video, deleting a comment or suspending a channel are separate actions
 * through the tools that already exist. The screen says so out loud, because a button labelled
 * "ACTIONED" that quietly did nothing to the reported item would be the worst possible thing to
 * be wrong about.
 *
 * <p>Invalidates by PREFIX so every filter view and every page refreshes, not only the one that
 * happened to be open — and the per-target list with it, since `openReportsOnTarget` on every
 * sibling row moves when one of them stops being OPEN.
 */
export const useDecideReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, decision, note }) => {
            const body = note?.trim() ? { decision, note: note.trim() } : { decision };
            const res = await api.patch(`/reports/admin/${id}`, body);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-target'] });
            // The navbar badge counts open reports.
            queryClient.invalidateQueries({ queryKey: ['admin-attention'] });
        },
    });
};
