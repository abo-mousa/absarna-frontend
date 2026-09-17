import { describe, it, expect } from 'vitest';
import { scrollPlan, withPosition } from '../useScrollRestoration';

describe('scrollPlan', () => {
    it('restores a remembered position on Back', () => {
        expect(scrollPlan({ navigationType: 'POP', pathChanged: true, saved: 1800 }))
            .toEqual({ type: 'restore', y: 1800 });
    });

    it('does nothing on Back to a place it has no position for', () => {
        expect(scrollPlan({ navigationType: 'POP', pathChanged: true, saved: undefined })).toEqual({ type: 'none' });
        expect(scrollPlan({ navigationType: 'POP', pathChanged: true, saved: 0 })).toEqual({ type: 'none' });
    });

    it('opens a new page at the top', () => {
        expect(scrollPlan({ navigationType: 'PUSH', pathChanged: true, saved: 500 })).toEqual({ type: 'top' });
    });

    it('leaves a tab switch alone — tabs are written with replace, and must not jump the page', () => {
        expect(scrollPlan({ navigationType: 'REPLACE', pathChanged: false, saved: undefined })).toEqual({ type: 'none' });
        expect(scrollPlan({ navigationType: 'PUSH', pathChanged: false, saved: undefined })).toEqual({ type: 'none' });
    });
});

describe('withPosition', () => {
    it('sets a key without mutating the input', () => {
        const before = { a: 10 };
        expect(withPosition(before, 'b', 20.6)).toEqual({ a: 10, b: 21 });
        expect(before).toEqual({ a: 10 });
    });

    it('keeps only the 50 most recently written', () => {
        let positions = {};
        for (let i = 0; i < 60; i++) positions = withPosition(positions, `k${i}`, i);
        expect(Object.keys(positions)).toHaveLength(50);
        expect(positions.k0).toBeUndefined();
        expect(positions.k59).toBe(59);
        // Rewriting an old key makes it the newest, not a casualty of the next trim.
        positions = withPosition(positions, 'k10', 99);
        positions = withPosition(positions, 'k60', 60);
        expect(positions.k10).toBe(99);
        expect(positions.k11).toBeUndefined();
    });
});
