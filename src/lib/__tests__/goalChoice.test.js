import { describe, expect, it } from 'vitest';
import {
    SHORTLIST_MAX, asksForSubject, averageMinutes, daysToFinish, deadlineChoices, itemKey, prefillFor, toggleShortlist,
} from '@/lib/goalChoice';

/**
 * The pure half of choosing a goal: which question «ساعدني أختار» asks next, what the deadline
 * choices mean, and how a chosen item becomes the goal dialog's prefill.
 */
describe('asksForSubject', () => {
    it('asks only when there is a real choice between subjects', () => {
        expect(asksForSubject({ subjects: [{ subject: 'FIQH' }, { subject: 'QURAN' }] })).toBe(true);
        expect(asksForSubject({ subjects: [{ subject: 'FIQH' }] })).toBe(false);
        expect(asksForSubject({ subjects: [] })).toBe(false);
        expect(asksForSubject(undefined)).toBe(false);
    });
});

describe('deadlineChoices', () => {
    const now = new Date(2026, 8, 30, 10, 0);

    it('offers whenever, a month and three months, as dates from the reader’s day', () => {
        const choices = deadlineChoices(now);
        expect(choices.slice(0, 3)).toEqual([
            { key: 'none', date: null },
            { key: 'month', date: '2026-10-30' },
            { key: 'quarter', date: '2026-12-29' },
        ]);
    });

    it('adds Ramadan when the runtime has the Hijri calendar, as a later date', () => {
        const ramadan = deadlineChoices(now).find((choice) => choice.key === 'ramadan');
        if (ramadan) expect(ramadan.date > '2026-09-30').toBe(true);
    });
});

describe('prefillFor', () => {
    it('opens a programme at one episode a day unless an amount is proposed', () => {
        expect(prefillFor({ kind: 'FINISH_SERIES', targetId: 7, title: 'شرح' })).toEqual({
            kind: 'FINISH_SERIES', targetId: 7, title: 'شرح', measure: 'EPISODES', amount: 1,
        });
        expect(prefillFor({ kind: 'FINISH_SERIES', targetId: 7, title: 'شرح' }, 2).amount).toBe(2);
    });

    it('opens a book at the pages that finish it in thirty days', () => {
        expect(prefillFor({ kind: 'FINISH_BOOK', targetId: 3, title: 'كتاب', pages: 300 })).toMatchObject({
            kind: 'FINISH_BOOK', measure: 'PAGES', amount: 10,
        });
        expect(prefillFor({ kind: 'FINISH_BOOK', targetId: 3, title: 'كتاب', book: { pages: 60 } }).amount).toBe(2);
    });
});

describe('toggleShortlist', () => {
    const item = (id, kind = 'FINISH_SERIES') => ({ kind, targetId: id, title: String(id) });

    it('adds, removes, and tells a series from a book with the same id', () => {
        let list = toggleShortlist([], item(1));
        list = toggleShortlist(list, item(1, 'FINISH_BOOK'));
        expect(list.map(itemKey)).toEqual(['FINISH_SERIES:1', 'FINISH_BOOK:1']);
        expect(toggleShortlist(list, item(1)).map(itemKey)).toEqual(['FINISH_BOOK:1']);
    });

    it('refuses a fourth rather than dropping one the reader chose', () => {
        const full = [1, 2, 3].reduce((list, id) => toggleShortlist(list, item(id)), []);
        expect(full).toHaveLength(SHORTLIST_MAX);
        expect(toggleShortlist(full, item(4))).toBe(full);
    });
});

describe('pace arithmetic', () => {
    it('averages only the episodes whose length was measured', () => {
        expect(averageMinutes([{ durationSeconds: 900 }, { durationSeconds: 1500 }, { durationSeconds: null }])).toBe(20);
        expect(averageMinutes([{ durationSeconds: null }])).toBeNull();
        // A listing that carries only the backend's "H:MM:SS" string is read from that.
        expect(averageMinutes([{ duration: '0:10:00' }, { duration: '1:30' }])).toBe(6);
    });

    it('counts whole days at a portion a day', () => {
        expect(daysToFinish(32, 1)).toBe(32);
        expect(daysToFinish(30, 4)).toBe(8);
        expect(daysToFinish(0, 1)).toBe(0);
    });
});
