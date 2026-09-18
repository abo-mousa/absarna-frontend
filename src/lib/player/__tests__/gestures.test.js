import { describe, expect, it } from 'vitest';
import {
    DOUBLE_TAP_WINDOW_MS,
    nextTapRun,
    pointerMoved,
    tapSeekSeconds,
    tapZone,
} from '@/lib/player/gestures';

/**
 * The double-tap-to-seek gesture, which is the only control in this player that a viewer can only
 * find by accident and can only get wrong by using it.
 *
 * <p>There is no jsdom here on purpose, so the taps themselves are not driven — but nothing about
 * a tap is interesting except these three answers: which side of the picture it landed on, whether
 * it belongs to the run before it, and how far that run has asked to jump. Every one of them has
 * an edge that a check on a phone would not reach: a finger on the exact boundary, a third tap
 * arriving late, a tap that changes sides mid-run.
 */

// A 360pt-wide player 20pt in from the left edge of the screen — a phone in portrait.
const picture = { left: 20, right: 380, width: 360 };

describe('tapZone', () => {
    it('puts BACK on the right, because the timeline runs right to left', () => {
        // The zones are the timeline without the timeline being visible. The bar is mirrored for
        // Arabic — the handle starts at the right edge and travels left — so a tap on the right
        // goes back towards 0:00. Mirroring one and not the other is the failure this pins: the
        // gesture would send the handle away from the side that was tapped.
        expect(tapZone(370, picture)).toBe('back');
        expect(tapZone(30, picture)).toBe('forward');
    });

    it('leaves the middle of the picture to play and pause', () => {
        // The widest share of the three, deliberately: tapping the middle of a video to stop it is
        // the older habit, and it is where the pause disc is drawn. It is also what lets the first
        // tap of a double-tap be harmless — nothing has to be delayed and taken back, because the
        // side zones never toggle playback in the first place.
        expect(tapZone(200, picture)).toBe('centre');
        expect(tapZone(140, picture)).toBe('centre');
        expect(tapZone(260, picture)).toBe('centre');
    });

    it('draws the boundary at 30% of the width in from each edge', () => {
        // 30% of 360 is 108, so on a picture spanning 20…380 the back zone starts at 272 and the
        // forward zone ends at 128.
        expect(tapZone(273, picture)).toBe('back');
        expect(tapZone(271, picture)).toBe('centre');
        expect(tapZone(127, picture)).toBe('forward');
        expect(tapZone(129, picture)).toBe('centre');
    });

    it('answers "centre" for a box that is not on screen yet', () => {
        // The first layout pass, and an element that has been unmounted between the pointer going
        // down and coming up. Guessing a side there would seek on a tap the viewer never aimed,
        // and `centre` is the answer that does nothing.
        expect(tapZone(200, { left: 0, right: 0, width: 0 })).toBe('centre');
        expect(tapZone(200, null)).toBe('centre');
    });
});

describe('nextTapRun', () => {
    it('starts a run at the first tap', () => {
        expect(nextTapRun(null, 'back', 1000)).toEqual({ zone: 'back', at: 1000, count: 1 });
    });

    it('counts a second tap on the same side into the same run', () => {
        const first = nextTapRun(null, 'back', 1000);
        expect(nextTapRun(first, 'back', 1200).count).toBe(2);
    });

    it('keeps counting, so a third and fourth tap keep adding', () => {
        // This is the whole reason a run is a count rather than a boolean: a viewer who missed
        // half a minute taps four times, and every mobile player they have used adds ten seconds
        // for each of them.
        let run = nextTapRun(null, 'forward', 0);
        run = nextTapRun(run, 'forward', 200);
        run = nextTapRun(run, 'forward', 400);
        run = nextTapRun(run, 'forward', 600);
        expect(run.count).toBe(4);
    });

    it('starts over once the window has passed', () => {
        // Two deliberate, separate taps — show the controls, then hide them again — are not a
        // seek. The window is measured from the LAST tap, not from the first, or a long run would
        // fall out of its own gesture halfway through.
        const first = nextTapRun(null, 'back', 1000);
        const late = nextTapRun(first, 'back', 1000 + DOUBLE_TAP_WINDOW_MS + 1);
        expect(late.count).toBe(1);
    });

    it('starts over when the finger changes sides', () => {
        // Overshooting and tapping the other side means "go back ten", not "take ten off the
        // thirty I just asked for".
        const forward = nextTapRun(null, 'forward', 1000);
        const back = nextTapRun(forward, 'back', 1100);
        expect(back).toEqual({ zone: 'back', at: 1100, count: 1 });
    });
});

describe('tapSeekSeconds', () => {
    it('gives the first tap of a run nothing to do', () => {
        // The load-bearing case. A single tap has to be harmless for the second one to be able to
        // mean something without the first having to be undone.
        expect(tapSeekSeconds({ zone: 'back', at: 0, count: 1 })).toBe(0);
        expect(tapSeekSeconds(null)).toBe(0);
    });

    it('jumps ten seconds on the double tap, and ten more for each after it', () => {
        expect(tapSeekSeconds({ zone: 'forward', at: 0, count: 2 })).toBe(10);
        expect(tapSeekSeconds({ zone: 'forward', at: 0, count: 3 })).toBe(20);
        expect(tapSeekSeconds({ zone: 'forward', at: 0, count: 4 })).toBe(30);
    });

    it('signs the jump by the side that was tapped', () => {
        expect(tapSeekSeconds({ zone: 'back', at: 0, count: 2 })).toBe(-10);
        expect(tapSeekSeconds({ zone: 'back', at: 0, count: 3 })).toBe(-20);
    });

    it('never seeks from the middle of the picture', () => {
        // A run cannot form there — the hook clears it instead — but the arithmetic must not be
        // the only thing standing between a mistake upstream and a video that jumps when someone
        // taps twice to pause and resume.
        expect(tapSeekSeconds({ zone: 'centre', at: 0, count: 3 })).toBe(0);
    });
});

/**
 * Whether the pointer actually went anywhere — the question the fade on idle is really asking.
 *
 * <p>The bug this was written for: the control bar never faded, in fullscreen or out of it, on a
 * page where nothing was moving. A browser dispatches a `pointermove` at UNCHANGED coordinates
 * when the element under the cursor changes, and this player changes it twice on every fade — the
 * control row and the centre disc both stop taking pointer events as they disappear. So hiding the
 * controls produced a move, the move was read as the viewer reaching for something, and they came
 * back within the frame.
 */
describe('pointerMoved', () => {
    it('rejects an event reporting the point it reported last time', () => {
        expect(pointerMoved({ x: 320, y: 180 }, 320, 180)).toBe(false);
    });

    it('accepts a move along either axis', () => {
        // One pixel counts. This is not a threshold or a throttle — a viewer who nudged the mouse
        // is reaching for a control, and the browser only lies about the case above.
        expect(pointerMoved({ x: 320, y: 180 }, 321, 180)).toBe(true);
        expect(pointerMoved({ x: 320, y: 180 }, 320, 181)).toBe(true);
    });

    it('accepts the first move after the pointer was forgotten', () => {
        // `hideNow` clears the remembered point when the pointer leaves, so a pointer that comes
        // back to the very same pixel is not dismissed as "it has not moved" and left with no
        // controls.
        expect(pointerMoved(null, 320, 180)).toBe(true);
    });
});
