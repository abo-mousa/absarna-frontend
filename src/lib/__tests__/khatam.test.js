import { describe, expect, it } from 'vitest';
import { khatamDash } from '@/lib/khatam';

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
