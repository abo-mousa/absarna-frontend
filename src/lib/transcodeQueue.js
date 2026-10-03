import { t } from '@/i18n';
import { countOf } from '@/lib/plural';

/**
 * Words for where a still-processing upload stands, from the dashboard row's `transcodeQueue`
 * (`{ahead, estimatedSeconds}`, owner-only, absent on an older backend).
 *
 * The time is the backend's sum of rough estimates, so it is worded as "about" and rounded up to
 * whole minutes, then to whole hours past ninety minutes — never a countdown. A null estimate
 * means one of the uploads in front has no known length: the position is still said, the time is
 * not guessed.
 */
export const queueWait = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    const minutes = Math.ceil(seconds / 60);
    if (minutes <= 1) return t('channelManage.videoStatus.queue.underAMinute');
    if (minutes < 90) return countOf('channelManage.videoStatus.queue.aboutMinutes', minutes);
    return countOf('channelManage.videoStatus.queue.aboutHours', Math.round(minutes / 60));
};

/**
 * What the dashboard row says for a processing upload: `waiting` picks the label and icon (in the
 * queue, or being worked on), `detail` is the rest of the line or null.
 *
 * Nothing in front means the worker has it (or is about to), so the time is what is LEFT; with
 * uploads in front it is when the video will be READY. No queue at all — an older backend — is
 * the plain "processing" the row always showed.
 */
export const queueStatus = (queue) => {
    if (!queue || !Number.isFinite(queue.ahead)) return { waiting: false, detail: null };
    const wait = queueWait(queue.estimatedSeconds);
    if (queue.ahead <= 0) {
        return { waiting: false, detail: wait ? t('channelManage.videoStatus.queue.left', { wait }) : null };
    }
    const ahead = countOf('channelManage.videoStatus.queue.ahead', queue.ahead);
    return {
        waiting: true,
        detail: wait ? `${ahead} · ${t('channelManage.videoStatus.queue.readyIn', { wait })}` : ahead,
    };
};

/** How often the dashboard re-reads its list while a video on the page is still processing. */
export const PROCESSING_REFETCH_MS = 30000;

/** The list hook's `refetchInterval`: only while something on the page is processing. */
export const processingRefetchInterval = (page) => (
    page?.content?.some((row) => row?.status === 'UPLOADED') ? PROCESSING_REFETCH_MS : false
);
