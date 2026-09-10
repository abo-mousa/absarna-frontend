import { describe, expect, it } from 'vitest';
import {
    formatTime,
    keyboardAction,
    parseDuration,
    ratioFromPointer,
} from '@/components/content/VideoControlBar';

/**
 * The arithmetic and the key map behind the player's own control bar.
 *
 * <p>These are the pieces of a hand-built bar whose failures are silent. There is no jsdom in this
 * repo on purpose, so the drag itself cannot be driven here — but the drag is a thin wrapper
 * around `ratioFromPointer`, the clock is `formatTime`, and the shortcuts are `keyboardAction`,
 * and each of those has edges a browser check never reaches: a video whose metadata has not
 * arrived, a scrub that leaves the window, a key nobody thought to press.
 */
describe('formatTime', () => {
    it('reads as a clock, in Latin digits', () => {
        // Latin, like every other figure in the app (lib/numbers.js) — a timeline reading «١٢:٠٤»
        // beside a Latin-digit view count is the inconsistency the counts already had.
        expect(formatTime(0)).toBe('0:00');
        expect(formatTime(9)).toBe('0:09');
        expect(formatTime(64)).toBe('1:04');
        expect(formatTime(724)).toBe('12:04');
    });

    it('adds hours only once there are any', () => {
        // A 45-minute lecture must not read '0:45:10'; an 80-minute one must not read '80:10'.
        expect(formatTime(2710)).toBe('45:10');
        expect(formatTime(3600)).toBe('1:00:00');
        expect(formatTime(3862)).toBe('1:04:22');
    });

    it('floors rather than rounds', () => {
        // Almost every real file's duration is a hair under a whole number. Rounding would show a
        // video as '45:00' while the playhead still read '44:59' — and, at the very end, a
        // position one second past the duration it is being compared against.
        expect(formatTime(59.9)).toBe('0:59');
        expect(formatTime(2709.97)).toBe('45:09');
    });

    it('shows a placeholder for a length the player does not know', () => {
        // `duration` is NaN until metadata arrives and Infinity for a stream whose length the
        // server never states. Both are the normal state of a player that has just been rendered,
        // not an error — and 'NaN:NaN' in the corner of a video is the kind of thing that ships.
        expect(formatTime(NaN)).toBe('--:--');
        expect(formatTime(Infinity)).toBe('--:--');
        expect(formatTime(undefined)).toBe('--:--');
        expect(formatTime(-1)).toBe('--:--');
    });
});

describe('ratioFromPointer', () => {
    const track = { left: 100, width: 400 };

    it('maps a pointer along the track to a fraction of it', () => {
        expect(ratioFromPointer(100, track)).toBe(0);
        expect(ratioFromPointer(300, track)).toBe(0.5);
        expect(ratioFromPointer(500, track)).toBe(1);
    });

    it('clamps a drag that has left the track', () => {
        // Pointer capture keeps delivering moves from anywhere on screen, so a scrub dragged off
        // the player — or off the window, giving a negative coordinate — must pin to the ends
        // rather than seek past them.
        expect(ratioFromPointer(-40, track)).toBe(0);
        expect(ratioFromPointer(9999, track)).toBe(1);
    });

    it('refuses to divide by a track that has no width yet', () => {
        // A click during the first layout pass, or on a player that is display:none in a hidden
        // tab. Without the guard this is `NaN`, which the element rejects as a `currentTime`
        // silently — a dead timeline with nothing logged anywhere.
        expect(ratioFromPointer(120, { left: 100, width: 0 })).toBe(0);
        expect(ratioFromPointer(120, null)).toBe(0);
    });
});

describe('keyboardAction', () => {
    it('answers to the keys every player has trained people to expect', () => {
        expect(keyboardAction(' ')).toBe('toggle-play');
        expect(keyboardAction('k')).toBe('toggle-play');
        expect(keyboardAction('f')).toBe('toggle-fullscreen');
        expect(keyboardAction('m')).toBe('toggle-mute');
        expect(keyboardAction('ArrowUp')).toBe('volume-up');
        expect(keyboardAction('ArrowDown')).toBe('volume-down');
    });

    it('follows the timeline, not the document, for left and right', () => {
        // The app is RTL throughout, but the timeline is not: time flows left to right in every
        // language, which is how the bar draws it (see VideoControlBar). Mirroring these two keys
        // to match the document would have Right seek backwards through a bar that fills
        // rightwards.
        expect(keyboardAction('ArrowRight')).toBe('seek-forward');
        expect(keyboardAction('ArrowLeft')).toBe('seek-back');
    });

    it('claims nothing it does not handle', () => {
        // The handler calls preventDefault for anything this returns, so a stray case here would
        // swallow the key from the rest of the page — Tab out of the player, or a browser
        // shortcut.
        expect(keyboardAction('Tab')).toBeNull();
        expect(keyboardAction('Escape')).toBeNull();
        expect(keyboardAction('K')).toBeNull();
        expect(keyboardAction('Enter')).toBeNull();
    });
});

describe('parseDuration', () => {
    it('reads the catalogue\'s duration string', () => {
        // `VideoDTO.duration` is formatted by the backend, not a number of seconds — and it is the
        // only source of a length before playback starts, since the HLS element does not know one
        // until its level playlist loads on the first play (see parseDuration's own note).
        expect(parseDuration('11:20')).toBe(680);
        expect(parseDuration('0:45')).toBe(45);
        expect(parseDuration('1:04:22')).toBe(3862);
        expect(parseDuration(' 45:10 ')).toBe(2710);
    });

    it('treats anything it cannot read as unknown', () => {
        // Which the bar already renders as '--:--'. The alternative is a NaN reaching a CSS width
        // and an aria-valuemax, where it is silent in one and nonsense in the other.
        expect(parseDuration(null)).toBeNaN();
        expect(parseDuration(undefined)).toBeNaN();
        expect(parseDuration('')).toBeNaN();
        expect(parseDuration('680')).toBeNaN();
        expect(parseDuration('11:20:33:44')).toBeNaN();
        expect(parseDuration('-1:00')).toBeNaN();
        expect(parseDuration('11:2.5')).toBeNaN();
        expect(parseDuration('soon')).toBeNaN();
        expect(parseDuration(680)).toBeNaN();
    });
});
