import { describe, expect, it } from 'vitest';
import { fitFeedToRows } from '@/lib/gridRows';

const vids = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);
const fit = (sections, tail, columns, tailComplete = false) =>
    fitFeedToRows({ sections: Object.entries(sections).map(([key, items]) => ({ key, items })), tail, columns, tailComplete });
const byKey = (result) => Object.fromEntries(result.sections.map((s) => [s.key, s.items]));

describe('fitFeedToRows', () => {
    it('leaves everything alone when every section is already whole rows', () => {
        const r = fit({ subscribed: [], discover: vids('d', 8), featured: [] }, vids('t', 12), 4);
        expect(byKey(r).discover).toHaveLength(8);
        expect(r.tail).toHaveLength(12);
        expect(r.heldBack).toBe(0);
    });

    it('tops discover up from the front of the tail at three columns', () => {
        const r = fit({ discover: vids('d', 8) }, vids('t', 12), 3);
        expect(byKey(r).discover).toEqual([...vids('d', 8), 't0']);
        // 11 left in the tail: three full rows shown, two waiting for the next page.
        expect(r.tail).toEqual(vids('t', 12).slice(1, 10));
        expect(r.heldBack).toBe(2);
    });

    it('never pads subscribed or featured; their short row moves to the front of the tail', () => {
        const r = fit({ subscribed: vids('s', 6), featured: vids('f', 5) }, vids('t', 12), 4);
        expect(byKey(r).subscribed).toEqual(vids('s', 4));
        expect(byKey(r).featured).toEqual(vids('f', 4));
        expect(r.tail.slice(0, 3)).toEqual(['s4', 's5', 'f4']);
        expect(r.tail).toHaveLength(12);
        expect(r.heldBack).toBe(3);
    });

    it('keeps a section with less than one row rather than hiding it', () => {
        const r = fit({ featured: vids('f', 2) }, vids('t', 8), 4);
        expect(byKey(r).featured).toEqual(vids('f', 2));
        expect(r.tail).toHaveLength(8);
    });

    it('shows whole tail rows while more pages exist, and everything on the last page', () => {
        expect(fit({}, vids('t', 11), 4).tail).toHaveLength(8);
        expect(fit({}, vids('t', 11), 4, true).tail).toHaveLength(11);
    });

    it('trims discover rather than topping it up when the tail cannot fill the row', () => {
        const r = fit({ discover: vids('d', 7) }, vids('t', 0), 4, true);
        expect(byKey(r).discover).toEqual(vids('d', 4));
        expect(r.tail).toEqual(['d4', 'd5', 'd6']);
    });

    it('does nothing at one column', () => {
        const r = fit({ discover: vids('d', 7), featured: vids('f', 3) }, vids('t', 5), 1);
        expect(byKey(r).discover).toHaveLength(7);
        expect(r.tail).toHaveLength(5);
    });
});
