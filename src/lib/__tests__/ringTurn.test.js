import { describe, expect, it } from 'vitest';
import { advance, angleAt, dayAngle, dayAtAngle, distanceOf, turnBetween } from '../ringTurn';

describe('ringTurn', () => {
    it('measures the short way round, across the top', () => {
        expect(turnBetween(350, 10)).toBe(20);
        expect(turnBetween(10, 350)).toBe(-20);
        expect(turnBetween(90, 120)).toBe(30);
    });

    it('reads angles clockwise from the top', () => {
        expect(Math.round(angleAt(0, -1))).toBe(0);
        expect(Math.round(angleAt(1, 0))).toBe(90);
        expect(Math.round(angleAt(-1, 0))).toBe(270);
    });

    it('lays the days counter-clockwise from the marker: tomorrow comes up from the left', () => {
        // ring of 30 (12° a day), day 10 at the marker
        expect(dayAngle(10, 10, 30)).toBe(0);
        expect(dayAngle(11, 10, 30)).toBe(348);   // the next day sits just left of the top
        expect(dayAngle(9, 10, 30)).toBe(12);     // the one before, just right of it
        expect(dayAngle(10, 10.5, 30)).toBe(6);   // half a day turned: the day has moved clockwise
    });

    it('finds the day nearest a point on the turned ring', () => {
        expect(dayAtAngle(0, 10, 30)).toBe(10);
        expect(dayAtAngle(348, 10, 30)).toBe(11);
        expect(dayAtAngle(12, 10, 30)).toBe(9);
        expect(dayAtAngle(355, 29, 30)).toBe(29); // 5° off: still the day at the marker (½ day is 6°)
        expect(dayAtAngle(350, 29, 30)).toBe(0);  // the next day, wrapped round the ring
    });

    it('turns forward and back by days, carrying across a month, and stops at a limit', () => {
        const any = () => true;
        expect(advance({ iso: '2027-01-30', frac: 0 }, 2.2, any)).toEqual({ iso: '2027-02-01', frac: expect.closeTo(0.2, 6) });
        expect(advance({ iso: '2027-02-01', frac: 0 }, -1.6, any)).toEqual({ iso: '2027-01-30', frac: expect.closeTo(0.4, 6) });
        expect(advance({ iso: '2027-01-10', frac: 0.1 }, 0.3, any)).toEqual({ iso: '2027-01-10', frac: expect.closeTo(0.4, 6) });
        // tomorrow is the earliest: turning back further stops on it, the fraction dropped
        const fromTomorrow = (iso) => iso >= '2026-10-03';
        expect(advance({ iso: '2026-10-04', frac: 0 }, -5, fromTomorrow)).toEqual({ iso: '2026-10-03', frac: 0 });
    });

    it('says a distance the way a person would', () => {
        expect(distanceOf(5)).toEqual({ unit: 'DAYS', count: 5 });
        expect(distanceOf(20)).toEqual({ unit: 'WEEKS', count: 3 });
        expect(distanceOf(130)).toEqual({ unit: 'MONTHS', count: 4 });
    });
});
