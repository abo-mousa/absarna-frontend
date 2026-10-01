import { describe, expect, it } from 'vitest';
import { aWeekFromSaturday, addDays, monthDays, partsOf, shiftMonth, weekColumn } from '../calendarMonth';
import { hasHijriCalendar } from '../hijriSeasons';

describe('calendarMonth', () => {
    it('walks a Gregorian month, leap day included', () => {
        const feb = monthDays('2028-02-10', 'gregory');
        expect(feb[0]).toBe('2028-02-01');
        expect(feb[feb.length - 1]).toBe('2028-02-29');
        expect(shiftMonth('2028-02-10', 'gregory', 1)).toBe('2028-03-01');
        expect(shiftMonth('2028-02-10', 'gregory', -1)).toBe('2028-01-31');
    });

    it('starts the week on Saturday', () => {
        expect(weekColumn('2026-10-03')).toBe(0); // a Saturday
        expect(weekColumn('2026-10-09')).toBe(6); // a Friday
        expect(aWeekFromSaturday().map(weekColumn)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('moves across a year end', () => {
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });

    it.runIf(hasHijriCalendar())('walks a Hijri month of 29 or 30 days, all one month', () => {
        const days = monthDays('2027-02-01', 'islamic-umalqura');
        expect(days.length === 29 || days.length === 30).toBe(true);
        const months = new Set(days.map((day) => partsOf(day, 'islamic-umalqura').month));
        expect(months.size).toBe(1);
        expect(partsOf(days[0], 'islamic-umalqura').day).toBe(1);
        // The day after it is the 1st of the next month.
        expect(partsOf(shiftMonth('2027-02-01', 'islamic-umalqura', 1), 'islamic-umalqura').day).toBe(1);
    });
});
