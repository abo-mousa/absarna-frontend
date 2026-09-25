import { describe, expect, it } from 'vitest';
import { khatamDash, khatamSweep } from '@/lib/khatam';

/**
 * The progress star's one piece of arithmetic. The outline is `pathLength="100"`, so the dash is
 * the percentage; what needs pinning is that nothing outside 0–1 draws a shape that means
 * something it does not — a full star for a watch position past a stale duration, or a sliver for
 * bad data.
 */
describe('khatamDash', () => {
    it('is the percentage of the outline to trace', () => {
        expect(khatamDash(0.735)).toBe(73.5);
        expect(khatamDash(1)).toBe(100);
        expect(khatamDash(0)).toBe(0);
    });

    it('never traces past the whole star or behind its start', () => {
        expect(khatamDash(1.4)).toBe(100);
        expect(khatamDash(-0.2)).toBe(0);
    });

    it('draws nothing for a value that is not a number', () => {
        expect(khatamDash(undefined)).toBe(0);
        expect(khatamDash(NaN)).toBe(0);
        expect(khatamDash('soon')).toBe(0);
    });
});

/**
 * The wedge that reveals the star. What must hold: it starts at twelve o'clock and goes
 * clockwise; half a turn and more takes the large arc; and nothing or everything needs no mask.
 */
describe('khatamSweep', () => {
    it('starts at the top and sweeps clockwise', () => {
        // A quarter ends at three o'clock (x past the centre, y at it), a half at six.
        expect(khatamSweep(0.25)).toBe('M50 50 L50 -10 A60 60 0 0 1 110 50 Z');
        expect(khatamSweep(0.5)).toBe('M50 50 L50 -10 A60 60 0 0 1 50 110 Z');
    });

    it('takes the long way round past half', () => {
        expect(khatamSweep(0.75)).toBe('M50 50 L50 -10 A60 60 0 1 1 -10 50 Z');
    });

    it('needs no mask for nothing, for the whole star, or for bad data', () => {
        expect(khatamSweep(0)).toBeNull();
        expect(khatamSweep(1)).toBeNull();
        expect(khatamSweep(1.3)).toBeNull();
        expect(khatamSweep(-0.1)).toBeNull();
        expect(khatamSweep(undefined)).toBeNull();
    });

    it('gives each of the eight points an eighth of the way', () => {
        // One eighth ends exactly on the ray through the first point clockwise from the top.
        const end = khatamSweep(1 / 8).match(/ ([\d.-]+) ([\d.-]+) Z$/).slice(1).map(Number);
        const toCentre = Math.atan2(end[0] - 50, 50 - end[1]);
        expect(toCentre).toBeCloseTo(Math.PI / 4, 6);
    });
});
