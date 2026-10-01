import { describe, expect, it } from 'vitest';
import { COAST_TAU, advance, angleAt, coast, dayAngle, dayAtAngle, distanceOf, flingVelocity, turnBetween } from '../ringTurn';

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
    it('measures a fling from the last moves only', () => {
        // 3 days over the last 60 ms → 0.05 days/ms
        expect(flingVelocity([{ t: 940, days: 1 }, { t: 960, days: 1 }, { t: 980, days: 1 }, { t: 1000, days: 1 }], 1000)).toBeCloseTo(3 / 60, 6);
        // a turn that stopped 200 ms before lifting has no speed left
        expect(flingVelocity([{ t: 700, days: 2 }, { t: 800, days: 2 }], 1000)).toBe(0);
        // backwards is negative
        expect(flingVelocity([{ t: 950, days: -1 }, { t: 1000, days: -2 }], 1000)).toBeCloseTo(-2 / 50, 6);
    });

    it('coasts with friction, the distance set by the strength of the fling', () => {
        let v = 0.05; let total = 0;
        for (let i = 0; i < 400; i++) { const step = coast(v, 16); total += step.days; v = step.v; }
        expect(total).toBeCloseTo(0.05 * COAST_TAU, 0);     // ≈ 19 days
        const weak = coast(0.005, 16), strong = coast(0.05, 16);
        expect(strong.days).toBeGreaterThan(weak.days * 9);  // ten times the pull, ten times the coast
        expect(coast(-0.05, 16).days).toBeLessThan(0);
    });
});
