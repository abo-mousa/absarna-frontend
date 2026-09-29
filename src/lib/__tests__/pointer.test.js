import { beforeAll, describe, expect, it } from 'vitest';
import { handMoved } from '@/lib/pointer';

const at = (x, y) => ({ screenX: x, screenY: y });

/** The guide's screenshot must not light parts the page scrolls under a still cursor. */
describe('handMoved', () => {
    // The listener is installed on first use, so a bare EventTarget is window enough.
    beforeAll(() => { globalThis.window = new EventTarget(); });

    it('counts an event at a new position as the hand', () => {
        expect(handMoved(at(10, 10))).toBe(true);
        expect(handMoved(at(40, 12))).toBe(true);
    });

    it('does not count a hover the page caused by scrolling under a still pointer', () => {
        expect(handMoved(at(100, 100))).toBe(true);
        window.dispatchEvent(new Event('scroll'));
        expect(handMoved(at(100, 100))).toBe(false);
    });

    it('counts the hand again once it moves after the scroll', () => {
        expect(handMoved(at(200, 200))).toBe(true);
        window.dispatchEvent(new Event('scroll'));
        expect(handMoved(at(200, 200))).toBe(false);
        expect(handMoved(at(201, 200))).toBe(true);
        expect(handMoved(at(201, 200))).toBe(true);
    });
});
