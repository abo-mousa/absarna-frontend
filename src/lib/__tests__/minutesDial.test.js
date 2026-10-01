import { describe, expect, it } from 'vitest';
import { DIAL_MAX, DIAL_MIN, angleOf, minutesAt, snap, stepFor } from '../minutesDial';

// A point on the dial at `minutes`, as a pointer would report it (y down).
const at = (minutes) => {
    const a = (angleOf(minutes) * Math.PI) / 180;
    return [Math.sin(a) * 100, -Math.cos(a) * 100];
};

describe('minutesDial', () => {
    it('snaps to five minutes, and to a usual length when close to one', () => {
        expect(snap(32)).toBe(30);
        expect(snap(33)).toBe(35);
        expect(snap(42.6)).toBe(45); // 45 pulls: plain rounding would give 45 anyway…
        expect(snap(42)).toBe(45);   // …and here it would have given 40
        expect(snap(57.5)).toBe(60);
        expect(snap(1)).toBe(DIAL_MIN);
        expect(snap(130)).toBe(DIAL_MAX);
    });

    it('reads a pointer clockwise from the top', () => {
        expect(minutesAt(...at(30), null)).toBe(30);   // a quarter turn
        expect(minutesAt(...at(60), null)).toBe(60);   // half
        expect(minutesAt(...at(90), null)).toBe(90);
        expect(minutesAt(...at(75), null)).toBe(75);
    });

    it('never wraps across the top', () => {
        // from 115, a finger that slips just past the top holds at two hours
        expect(minutesAt(...at(3), 115)).toBe(DIAL_MAX);
        // from 10, a finger that slips back past the top holds at five minutes
        expect(minutesAt(...at(118), 10)).toBe(DIAL_MIN);
        // an ordinary move near the top is not mistaken for one
        expect(minutesAt(...at(110), 105)).toBe(110);
    });

    it('steps by key, mirrored under RTL, inside the bounds', () => {
        expect(stepFor('ArrowUp', 30)).toBe(35);
        expect(stepFor('ArrowRight', 30)).toBe(35);
        expect(stepFor('ArrowLeft', 30, true)).toBe(35);
        expect(stepFor('ArrowRight', 30, true)).toBe(25);
        expect(stepFor('PageUp', 30)).toBe(45);
        expect(stepFor('Home', 60)).toBe(DIAL_MIN);
        expect(stepFor('End', 5)).toBe(DIAL_MAX);
        expect(stepFor('ArrowDown', 5)).toBe(DIAL_MIN);
        expect(stepFor('ArrowUp', 33)).toBe(40);
        expect(stepFor('Tab', 30)).toBeNull();
    });
});
