import { describe, expect, it } from 'vitest';
import { formatDay } from '@/lib/dayFormat';
import { hijriDeadlines, seasonLabel } from '@/lib/hijriSeasons';

/** Local dates, as the goal screens pass `now`. */
const on = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d, 10);
};
const keys = (iso) => hijriDeadlines(on(iso)).map((season) => season.key);

describe('hijriDeadlines', () => {
    it('offers every season, soonest first, in an ordinary month', () => {
        expect(keys('2026-10-02')).toEqual(['monthEnd', 'ramadan', 'dhulHijjah', 'yearEnd']);
    });

    // The eve of Ramadan is also the end of Sha'ban: the named season must survive the tie, in the
    // one month it is most often chosen in.
    it('keeps «before Ramadan» in Sha\'ban, where it is also the month\'s end', () => {
        expect(keys('2027-01-25')).toContain('ramadan');
        expect(keys('2027-01-25')).not.toContain('monthEnd');
    });

    it('keeps the ten days in Dhu al-Qa\'dah and the year\'s end in Dhu al-Hijjah', () => {
        expect(keys('2027-04-10')).toContain('dhulHijjah');
        expect(keys('2027-05-20')).toContain('yearEnd');
    });

    it('never offers one day twice', () => {
        const dates = hijriDeadlines(on('2027-01-25')).map((season) => season.date);
        expect(new Set(dates).size).toBe(dates.length);
    });
});

describe('seasonLabel', () => {
    it('names the month whose end it is', () => {
        const monthEnd = hijriDeadlines(on('2026-10-02')).find((season) => season.key === 'monthEnd');
        expect(seasonLabel(monthEnd)).not.toMatch(/\{month\}/);
        expect(seasonLabel(monthEnd)).toContain(formatDay(monthEnd.date, { month: 'long' }, 'islamic-umalqura'));
    });
});
