import { describe, expect, it } from 'vitest';
import { isDuplicateReport, PROGRESS_REPORT_INTERVAL_MS } from '@/lib/player/playback';

/**
 * The guard on "duplicate key value violates unique constraint uq_watch_history_user_video".
 *
 * <p>Leaving a page pauses the video and flushes on `pagehide`, and both of those report the same
 * playhead within the same moment. On a video with no history row yet, both requests take the
 * backend's insert branch and one of them is rejected — a lost write, and a WARN per first watch.
 */
describe('isDuplicateReport', () => {
    const sent = { videoId: 1936, progressSeconds: 300, at: 1_000_000 };

    it('drops the second of two reports of the same position for the same video', () => {
        // The exact pair the constraint sees: visibilitychange pauses and reports, pagehide
        // flushes the identical playhead 5ms later.
        expect(isDuplicateReport(sent, { ...sent, at: sent.at + 5 })).toBe(true);
    });

    it('lets the first report of a session through', () => {
        expect(isDuplicateReport(null, sent)).toBe(false);
    });

    it('lets a different video through', () => {
        // Two players never overlap in this app, but the ref outlives a videoId change on the
        // same mounted page — a deduped report there would lose the new video's first write.
        expect(isDuplicateReport(sent, { ...sent, videoId: 1937, at: sent.at + 5 })).toBe(false);
    });

    it('lets a moved playhead through, however soon after', () => {
        // A pause one second further in is a real position, not an echo.
        expect(isDuplicateReport(sent, { ...sent, progressSeconds: 301, at: sent.at + 5 })).toBe(false);
    });

    it('lets the same position through again once the checkpoint interval has passed', () => {
        // A video paused on the same frame for a minute and then left is a fresh statement of
        // when it was last watched, not a duplicate of the exit that never happened.
        const later = sent.at + PROGRESS_REPORT_INTERVAL_MS;
        expect(isDuplicateReport(sent, { ...sent, at: later })).toBe(false);
        expect(isDuplicateReport(sent, { ...sent, at: later - 1 })).toBe(true);
    });
});
