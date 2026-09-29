import { describe, expect, it } from 'vitest';
import { msUntilDayEnds, msUntilServerMidnight, UNTIL_DAY_ENDS } from '../queryCache';

const at = (iso) => Date.parse(iso);
const DAY = 24 * 60 * 60 * 1000;

describe('msUntilServerMidnight', () => {
    it('counts to the next UTC midnight', () => {
        expect(msUntilServerMidnight(at('2026-09-26T21:30:00Z'))).toBe(150 * 60 * 1000);
    });

    it('is a whole day at exactly midnight, never zero', () => {
        expect(msUntilServerMidnight(at('2026-09-26T00:00:00Z'))).toBe(DAY);
    });

    it('crosses a month end', () => {
        expect(msUntilServerMidnight(at('2026-09-30T23:59:59Z'))).toBe(1000);
    });
});

describe('msUntilDayEnds', () => {
    it('is never later than the server midnight', () => {
        const from = at('2026-09-26T21:30:00Z');
        expect(msUntilDayEnds(from)).toBeLessThanOrEqual(msUntilServerMidnight(from));
    });

    it('is never later than the reader\'s own midnight', () => {
        const from = at('2026-09-26T21:30:00Z');
        const local = new Date(from);
        local.setHours(24, 0, 0, 0);
        expect(msUntilDayEnds(from)).toBeLessThanOrEqual(local.getTime() - from);
    });

    it('ends at the reader\'s 03:00, when the learning day turns', () => {
        // 01:30 local, whatever zone the test runs in: last night's portion is still "today"
        // for the backend until 03:00, so a copy fetched now must not outlive 03:00.
        const from = new Date(2026, 8, 27, 1, 30, 0, 0).getTime();
        const three = new Date(2026, 8, 27, 3, 0, 0, 0).getTime();
        expect(msUntilDayEnds(from)).toBeLessThanOrEqual(three - from);
    });

    it('ends at the reader\'s noon, when the make-up offer turns into carry-over', () => {
        const from = new Date(2026, 8, 27, 10, 0, 0, 0).getTime();
        const noon = new Date(2026, 8, 27, 12, 0, 0, 0).getTime();
        expect(msUntilDayEnds(from)).toBeLessThanOrEqual(noon - from);
    });

    it('is always positive and at most a day', () => {
        for (const iso of ['2026-09-26T00:00:00Z', '2026-09-26T12:00:00Z', '2026-09-26T23:59:59Z']) {
            const ms = msUntilDayEnds(at(iso));
            expect(ms).toBeGreaterThan(0);
            expect(ms).toBeLessThanOrEqual(DAY);
        }
    });
});

describe('UNTIL_DAY_ENDS', () => {
    it('measures staleness from when the copy was fetched', () => {
        const fetched = at('2026-09-26T23:00:00Z');
        expect(UNTIL_DAY_ENDS.staleTime({ state: { dataUpdatedAt: fetched } })).toBe(msUntilDayEnds(fetched));
    });

    it('keeps an unmounted copy at least as long as it can stay fresh', () => {
        expect(UNTIL_DAY_ENDS.gcTime).toBeGreaterThanOrEqual(DAY);
    });
});
