import { afterEach, describe, expect, it, vi } from 'vitest';
import { beforeNoon, slotOf } from '@/lib/slots';
import { creditDayFor, endQada, startQada } from '@/lib/qada';
import { emitProgressReport, onProgressReport } from '@/lib/progressEvents';
import { goalFor, orderPortions, portionView } from '@/lib/journey';

const at = (hh, mm = 0) => new Date(2026, 8, 28, hh, mm);

/** The mirror of the backend's LearningSlotTest: the same boundaries, both sides. */
describe('slotOf', () => {
    it('starts the day and its morning at 03:00', () => {
        expect(slotOf(at(2, 59))).toBe('DULJA');
        expect(slotOf(at(3, 0))).toBe('GHADWA');
        expect(slotOf(at(11, 59))).toBe('GHADWA');
    });
    it('runs the afternoon from noon to six, and the night past midnight', () => {
        expect(slotOf(at(12, 0))).toBe('RAWHA');
        expect(slotOf(at(17, 59))).toBe('RAWHA');
        expect(slotOf(at(18, 0))).toBe('DULJA');
        expect(slotOf(at(0, 0))).toBe('DULJA');
    });
    it('closes the make-up window at noon', () => {
        expect(beforeNoon(at(11, 59))).toBe(true);
        expect(beforeNoon(at(12, 0))).toBe(false);
        expect(beforeNoon(at(2, 0))).toBe(false);
    });
});

describe('the make-up in progress', () => {
    afterEach(() => endQada());

    it('marks reports about its programme until noon, and no others', () => {
        startQada({ goalId: 1, creditDay: '2026-09-27', seriesId: 5 }, at(8));
        expect(creditDayFor({ seriesId: 5 }, at(9))).toBe('2026-09-27');
        expect(creditDayFor({ seriesId: 6 }, at(9))).toBeUndefined();
        expect(creditDayFor({ bookId: 5 }, at(9))).toBeUndefined();
        expect(creditDayFor({ seriesId: 5 }, at(12))).toBeUndefined();
    });
});

describe('progress report answers', () => {
    it('reach listeners only when they say something', () => {
        const listener = vi.fn();
        const stop = onProgressReport(listener);
        emitProgressReport({ completion: null, portionsCompleted: [] });
        expect(listener).not.toHaveBeenCalled();
        emitProgressReport({ completion: null, portionsCompleted: [{ goalId: 1 }] });
        expect(listener).toHaveBeenCalledTimes(1);
        stop();
    });
});

describe('where a portion stands now', () => {
    const goal = (over) => ({ period: 'DAY', slot: 'RAWHA', fallbackSlot: null, today: { state: 'PENDING' }, ...over });

    it('is current in its slot, later before it, passed after it', () => {
        expect(portionView(goal(), at(13)).status).toBe('current');
        expect(portionView(goal(), at(9)).status).toBe('later');
        expect(portionView(goal(), at(20)).status).toBe('passed');
    });
    it('moves to its fallback time once its own has passed', () => {
        const withFallback = goal({ fallbackSlot: 'DULJA' });
        expect(portionView(withFallback, at(20))).toEqual({ status: 'current', moved: true });
    });
    it('stays on the page once kept, offering the rest after the minimum, and is excused in a pause', () => {
        // The minimum keeps the day and leaves the rest on offer; only the full portion is done.
        expect(portionView(goal({ today: { state: 'MINIMUM' } }), at(20)).status).toBe('kept');
        expect(portionView(goal({ today: { state: 'FULL' } }), at(20)).status).toBe('done');
        expect(portionView(goal({ today: { state: 'EXCUSED' } }), at(13)).status).toBe('excused');
    });
    it('puts what is to be done now at the top, and the done at the bottom', () => {
        const ordered = orderPortions([
            goal({ id: 1, slot: 'GHADWA', today: { state: 'FULL' } }),
            goal({ id: 2, slot: 'DULJA' }),
            goal({ id: 3, slot: 'RAWHA' }),
        ], at(13)).map(({ goal: g }) => g.id);
        expect(ordered).toEqual([3, 2, 1]);
    });
    it('finds the goal that already pursues a programme or a book', () => {
        const goals = [{ kind: 'FINISH_SERIES', targetId: 9 }, { kind: 'FINISH_BOOK', targetId: 9 }];
        expect(goalFor(goals, { seriesId: 9 }).kind).toBe('FINISH_SERIES');
        expect(goalFor(goals, { bookId: 9 }).kind).toBe('FINISH_BOOK');
        expect(goalFor(goals, { seriesId: 8 })).toBeNull();
    });
});
