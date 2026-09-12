import { describe, expect, it } from 'vitest';
import {
    DECISIONS, REVIEW_STATE, REVIEW_TYPE, detailOf, findingRow, groupByType, holdsVideo,
} from '../review';

describe('which states hide a video', () => {
    it('only HELD and REJECTED hide it', () => {
        // The asymmetry is the whole reason this is not a boolean. ADVISORY and UNCHECKED are
        // published and merely queued; telling a reviewer all four are the same would train them
        // to treat the two that matter as noise.
        expect(holdsVideo(REVIEW_STATE.HELD)).toBe(true);
        expect(holdsVideo(REVIEW_STATE.REJECTED)).toBe(true);
        for (const state of [REVIEW_STATE.CLEAN, REVIEW_STATE.ADVISORY,
            REVIEW_STATE.UNCHECKED, REVIEW_STATE.CLEARED]) {
            expect(holdsVideo(state)).toBe(false);
        }
    });

    it('offers a reviewer only the two human decisions', () => {
        // Writing a machine state back would put the row into the set the worker may overwrite,
        // so the next redelivery would silently undo the reviewer.
        expect(DECISIONS).toEqual([REVIEW_STATE.CLEARED, REVIEW_STATE.REJECTED]);
        expect(DECISIONS).not.toContain(REVIEW_STATE.HELD);
        expect(DECISIONS).not.toContain(REVIEW_STATE.UNCHECKED);
    });
});

describe('reading a finding’s detail', () => {
    it('reads the v6 shape the worker sends', () => {
        const detail = JSON.stringify({
            type: 'MUSIC', outcome: 'BLOCKED', peak: 0.43, topLabel: 'Electronic music',
            shape: 'HEAD', spans: [{ start: 0, end: 31.2 }],
        });
        expect(detailOf(detail)).toMatchObject({
            peak: 0.43, label: 'Electronic music', shape: 'HEAD',
        });
        expect(detailOf(detail).spans).toHaveLength(1);
    });

    it('also reads the v5 shape backfilled from the old column', () => {
        // Migration 043 stores what was actually recorded rather than rewriting history into a
        // shape the worker never sent, so both are live in the table at once.
        const legacy = JSON.stringify({
            disposition: 'PERVASIVE', peak: 0.567, spans: [{ start: 5, end: 45.2 }], advisory: [],
        });
        expect(detailOf(legacy)).toMatchObject({ peak: 0.567, shape: 'PERVASIVE' });
        expect(detailOf(legacy).spans).toHaveLength(1);
    });

    it('survives detail that will not parse, because the state is what gates the video', () => {
        expect(detailOf('{not json')).toEqual({ spans: [], peak: null, label: null, shape: null });
        expect(detailOf(null)).toEqual({ spans: [], peak: null, label: null, shape: null });
    });
});

describe('a queue row', () => {
    const finding = (over = {}) => ({
        videoId: 7, title: 'A lecture', channelId: 3, type: REVIEW_TYPE.MUSIC,
        state: REVIEW_STATE.HELD, holds: true, detectedAt: '2026-09-12T10:00:00Z',
        detail: JSON.stringify({ peak: 0.43, spans: [{ start: 12, end: 31.2 }] }),
        ...over,
    });

    it('offers every span, seeking two seconds early', () => {
        // A span begins at the window the classifier first crossed the threshold in, and the
        // window is 10.24s wide, so landing exactly on the boundary regularly drops the reviewer
        // into silence just before the sound -- which reads as a false positive when it is not.
        const row = findingRow(finding());
        expect(row.spans).toHaveLength(1);
        expect(row.spans[0].seekTo).toBe(10);
        expect(row.spans[0].label).toBe('0:12–0:31');
    });

    it('drops a span it cannot label rather than seeking to NaN', () => {
        const row = findingRow(finding({
            detail: JSON.stringify({ spans: [{ start: 'x', end: 5 }, { start: 12, end: 31.2 }] }),
        }));
        expect(row.spans).toHaveLength(1);
    });

    it('keeps the row when the detail is unusable', () => {
        // The state gates the video; losing the jump-list must not lose the row.
        const row = findingRow(finding({ detail: '{broken' }));
        expect(row.state).toBe(REVIEW_STATE.HELD);
        expect(row.hidden).toBe(true);
        expect(row.spans).toEqual([]);
    });

    it('is null for nothing', () => {
        expect(findingRow(null)).toBeNull();
    });
});

describe('grouping for the sub-tabs', () => {
    it('puts a video flagged by two detectors under both', () => {
        // One row per FINDING, not per video: the two verdicts are independent and a reviewer
        // decides them separately, so collapsing them would force both answers at once.
        const rows = [
            findingRow({ videoId: 7, type: REVIEW_TYPE.MUSIC, state: REVIEW_STATE.HELD }),
            findingRow({ videoId: 7, type: REVIEW_TYPE.NUDITY, state: REVIEW_STATE.ADVISORY }),
        ];
        const grouped = groupByType(rows);
        expect(grouped[REVIEW_TYPE.MUSIC]).toHaveLength(1);
        expect(grouped[REVIEW_TYPE.NUDITY]).toHaveLength(1);
        expect(grouped[REVIEW_TYPE.MUSIC][0].videoId).toBe(7);
    });

    it('always returns a bucket per type, so a tab can render an empty state', () => {
        const grouped = groupByType([]);
        expect(Object.keys(grouped).sort()).toEqual([REVIEW_TYPE.MUSIC, REVIEW_TYPE.NUDITY].sort());
    });
});
