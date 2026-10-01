import { describe, expect, it } from 'vitest';
import { angleAt, dayIndexAt, distanceOf, spend, turnBetween } from '../ringTurn';

describe('ringTurn', () => {
    it('measures the short way round, across the top', () => {
        expect(turnBetween(350, 10)).toBe(20);
        expect(turnBetween(10, 350)).toBe(-20);
        expect(turnBetween(90, 120)).toBe(30);
    });

    it('reads angles clockwise from the top', () => {
        expect(Math.round(angleAt(0, -1))).toBe(0);
        expect(Math.round(angleAt(1, 0))).toBe(90);
        expect(Math.round(angleAt(0, 1))).toBe(180);
        expect(Math.round(angleAt(-1, 0))).toBe(270);
    });

    it('finds the day under a finger, for both ways a ring lays its days', () => {
        // astrolabe: day i centred at (i + 0.5) arcs; 30 days, 12° each
        expect(dayIndexAt(6.1, 30, 0.5)).toBe(0);
        expect(dayIndexAt(359, 30, 0.5)).toBe(29);
        // moons: day i centred at i arcs
        expect(dayIndexAt(0, 30, 0)).toBe(0);
        expect(dayIndexAt(355, 30, 0)).toBe(0);
        expect(dayIndexAt(25, 30, 0)).toBe(2);
    });

    it('moves a day per day’s arc, keeps the rest, and stops at a limit', () => {
        expect(spend(25, 12, () => true)).toEqual({ moved: 2, left: 1 });
        expect(spend(-13, 12, () => true)).toEqual({ moved: -1, left: -1 });
        expect(spend(5, 12, () => true)).toEqual({ moved: 0, left: 5 });
        // only one more day may be chosen: the turn stops there and drops the rest
        expect(spend(40, 12, (n) => n <= 1)).toEqual({ moved: 1, left: 0 });
    });

    it('says a distance the way a person would', () => {
        expect(distanceOf(5)).toEqual({ unit: 'DAYS', count: 5 });
        expect(distanceOf(20)).toEqual({ unit: 'WEEKS', count: 3 });
        expect(distanceOf(130)).toEqual({ unit: 'MONTHS', count: 4 });
    });
});
