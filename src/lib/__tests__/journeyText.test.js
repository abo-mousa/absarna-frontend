import { afterEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '@/i18n';
import { countOf } from '@/lib/plural';
import { commitmentSentence, paceText } from '@/lib/goalText';
import { hijriDeadlines, hasHijriCalendar } from '@/lib/hijriSeasons';
import { bookPortion } from '@/lib/journey';
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
