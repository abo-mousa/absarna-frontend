import { describe, expect, it } from 'vitest';
import { heldMinHeight } from '@/hooks/useKeepScrollPlace';

/** How much of a held list height the viewport still needs, so the page never jumps up. */
describe('heldMinHeight', () => {
    it('keeps just enough to hold the viewport where it is', () => {
        // A 1,000px list became 300px while the reader was scrolled so the viewport ends at 2,200px
        // of a 2,400px document. Released, the document is 1,700px — 500px short of the viewport.
        expect(heldMinHeight({ natural: 300, held: 1000, docHeight: 2400, scrollBottom: 2200 })).toBe(800);
    });

    it('lets go entirely once the document is tall enough without it', () => {
        // Scrolled back up: the viewport now ends at 1,500px, above where the released page ends.
        expect(heldMinHeight({ natural: 300, held: 1000, docHeight: 2400, scrollBottom: 1500 })).toBe(0);
    });

    it('lets go when the new list is as tall as the old one', () => {
        expect(heldMinHeight({ natural: 1200, held: 1000, docHeight: 2600, scrollBottom: 2600 })).toBe(0);
    });

    it('never holds more than it was holding', () => {
        expect(heldMinHeight({ natural: 100, held: 400, docHeight: 900, scrollBottom: 5000 })).toBe(400);
    });
});
