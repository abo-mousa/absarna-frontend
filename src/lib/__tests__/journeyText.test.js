import { afterEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '@/i18n';
import { countOf } from '@/lib/plural';
import { commitmentSentence, learningTime, paceText } from '@/lib/goalText';
import { hijriDeadlines, hasHijriCalendar } from '@/lib/hijriSeasons';
import { bookPortion, fullWeek, groupByMonth, stepLabel, weekAxis } from '@/lib/journey';
import { creditDayFor, endQada, startQada } from '@/lib/qada';

afterEach(() => setActiveLocale('ar'));

describe('countOf', () => {
    it('gives Arabic its forms, not "1 صفحات"', () => {
        setActiveLocale('ar');
        expect(countOf('journey.units.PAGES', 1)).toBe('صفحة واحدة');
        expect(countOf('journey.units.PAGES', 2)).toBe('صفحتان');
        expect(countOf('journey.units.PAGES', 4)).toBe('٤ صفحات');
        expect(countOf('journey.units.PAGES', 11)).toBe('١١ صفحة');
    });

    it('takes the oblique dual after a preposition or as an object, and only the dual changes', () => {
        setActiveLocale('ar');
        expect(countOf('journey.units.EPISODES', 2, { oblique: true })).toBe('حلقتين');
        expect(countOf('journey.units.EPISODES', 5, { oblique: true })).toBe('٥ حلقات');
    });

    it('gives English one and other', () => {
        setActiveLocale('en');
        expect(countOf('journey.units.EPISODES', 1)).toBe('1 episode');
        expect(countOf('journey.units.EPISODES', 3)).toBe('3 episodes');
    });
});

describe('commitmentSentence', () => {
    const goal = {
        kind: 'FINISH_BOOK', targetTitleSnapshot: 'Riyad', period: 'DAY', amount: 4, minimumAmount: 1,
        daysPerWeek: 6, slot: 'GHADWA', anchor: 'FAJR',
    };

    it('says what, how much, how often, when, and the minimum', () => {
        setActiveLocale('en');
        expect(commitmentSentence(goal)).toBe(
            'My daily portion is 4 pages of “\u2068Riyad\u2069”, 6 days a week, in the morning, after Fajr, and on a hard day at least 1 page.');
    });

    it('says a weekly habit as a week of learning, not as a title', () => {
        setActiveLocale('en');
        expect(commitmentSentence({ kind: 'HABIT', measure: 'MINUTES', period: 'WEEK', amount: 150 }))
            .toBe('Each week, 150 minutes of learning.');
    });

    it('leaves out what does not apply — all seven days, no time, a minimum equal to the amount', () => {
        setActiveLocale('en');
        expect(commitmentSentence({ ...goal, daysPerWeek: 7, slot: null, minimumAmount: 4 }))
            .toBe('My daily portion is 4 pages of “\u2068Riyad\u2069”.');
    });
});

describe('paceText', () => {
    it('never calls a reader behind without telling them what gets them there', () => {
        setActiveLocale('en');
        const goal = { kind: 'FINISH_BOOK', deadline: '2026-12-01', pace: { total: 300, remaining: 200, aheadDays: -3, perPortion: 5 } };
        expect(paceText(goal)).toBe('5 pages a day gets you there on time');
    });
});

describe('bookPortion', () => {
    it('proposes the pages that finish a book in thirty days, at least one', () => {
        expect(bookPortion(300, 0)).toBe(10);
        expect(bookPortion(300, 290)).toBe(1);
        expect(bookPortion(null)).toBe(2);
    });
});

describe('a habit’s make-up', () => {
    it('credits any report, since a habit pursues no one programme or book', () => {
        const at = new Date(2026, 8, 28, 9);
        startQada({ goalId: 1, creditDay: '2026-09-27' }, at);
        expect(creditDayFor({ seriesId: 9 }, at)).toBe('2026-09-27');
        expect(creditDayFor({ bookId: 3 }, at)).toBe('2026-09-27');
        endQada();
    });
});

describe('hijriDeadlines', () => {
    it.runIf(hasHijriCalendar())('offers the seasons ahead, soonest first, each the day before it begins', () => {
        const seasons = hijriDeadlines(new Date(2026, 8, 28));
        expect(seasons.map((season) => season.key)).toContain('ramadan');
        const dates = seasons.map((season) => season.date);
        expect([...dates].sort()).toEqual(dates);
        // Ramadan 1448 begins on 8 February 2027 (Umm al-Qura); the day before is the deadline.
        expect(seasons.find((season) => season.key === 'ramadan').date).toBe('2027-02-07');
    });
});

describe('learningTime', () => {
    it('reads minutes under two hours and whole hours above', () => {
        setActiveLocale('en');
        expect(learningTime(45)).toBe('45 minutes');
        expect(learningTime(119)).toBe('119 minutes');
        expect(learningTime(150)).toBe('3 hours');
        setActiveLocale('ar');
        expect(learningTime(120)).toBe('ساعتان');
    });
});

describe('stepLabel', () => {
    it('names a step in what was learned', () => {
        setActiveLocale('ar');
        expect(stepLabel({ measure: 'FURTHEST_PERCENT', value: 25 })).toBe('ربع ختمة');
        expect(stepLabel({ measure: 'PAGES', value: 250 })).toBe('٢٥٠ صفحة');
        expect(stepLabel({ measure: 'EPISODES', value: 10 })).toBe('١٠ حلقات');
        expect(stepLabel({ measure: 'COMPLETIONS', value: 2 })).toBe('ختمتان');
        expect(stepLabel({ measure: 'COMPLETIONS', value: 5 })).toBe('٥ ختمات');
    });
});

describe('groupByMonth', () => {
    // 52 Saturdays ending on 2026-09-26.
    const weeks = Array.from({ length: 52 }, (_, i) => ({
        weekStart: new Date(Date.UTC(2026, 8, 26 - 7 * (51 - i), 12)).toISOString().slice(0, 10),
        level: 1,
    }));
    const check = (calendar) => {
        const months = groupByMonth(weeks, calendar);
        expect(months.length).toBeLessThanOrEqual(12);
        // Every week lands in exactly one month, in order. The oldest month may be cut by the window
        // and the newest is still running, so only the ones between are whole.
        const flat = months.flatMap((month) => month.weeks.map((week) => week.weekStart));
        expect(flat).toEqual(weeks.slice(-flat.length).map((week) => week.weekStart));
        for (const month of months.slice(1, -1)) {
            expect(month.weeks.length).toBeGreaterThanOrEqual(4);
            expect(month.weeks.length).toBeLessThanOrEqual(5);
        }
    };
    it('gives each whole week to one month, four or five to a month', () => check('gregory'));
    it('does the same in Hijri months', () => {
        if (!hasHijriCalendar()) return;
        check('islamic-umalqura');
    });
    it('puts a week in the month of its Tuesday', () => {
        // Saturday 2026-08-29 to Friday 2026-09-04: three days in August, four in September.
        const [month] = groupByMonth([{ weekStart: '2026-08-29', level: 0 }], 'gregory');
        expect(month.key).toBe(groupByMonth([{ weekStart: '2026-09-05', level: 0 }], 'gregory')[0].key);
    });
});

describe('fullWeek', () => {
    it('runs Saturday to Friday, the days to come open', () => {
        const week = fullWeek([{ day: '2026-09-26', state: 'REST' }, { day: '2026-09-27', state: 'FULL' }]);
        expect(week.map((day) => day.day)).toEqual(['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
        expect(week[1].state).toBe('FULL');
        expect(week[6].state).toBe('PENDING');
    });
});

describe('weekAxis', () => {
    it('steps in whole hours, four lines at most, above the tallest week', () => {
        expect(weekAxis(17 * 60)).toEqual({ hours: true, top: 20 * 60, ticks: [0, 300, 600, 900, 1200] });
        expect(weekAxis(150)).toEqual({ hours: true, top: 180, ticks: [0, 60, 120, 180] });
    });
    it('uses minutes for a light stretch', () => {
        expect(weekAxis(40)).toEqual({ hours: false, top: 40, ticks: [0, 10, 20, 30, 40] });
        expect(weekAxis(50)).toEqual({ hours: false, top: 60, ticks: [0, 15, 30, 45, 60] });
    });
});
