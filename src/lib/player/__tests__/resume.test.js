import { describe, expect, it } from 'vitest';
import { HAVE_NOTHING, resumeAction, stillStalled } from '@/lib/player/resume';

/**
 * What a player needs after the phone put it to sleep.
 *
 * <p>These rules are read on a platform nothing in this repo runs on, at a moment that cannot be
 * staged from a desk: the page has been away, the element has come back in whatever state the
 * platform chose, and every one of the three failures behind "I came back and it would not play"
 * looks the same from the outside. So the matrix is pinned here, and the two costs of getting it
 * wrong are opposite and both bad — reloading a video that was merely paused restarts it under the
 * viewer, and leaving a starved one alone is the bug itself.
 */
describe('resumeAction', () => {
    const playing = { error: null, readyState: 4, paused: false, ended: false, wasPlaying: true };

    it('does nothing for a video that came back still running', () => {
        expect(resumeAction(playing)).toBe('none');
    });

    it('does nothing to a video the viewer had paused before they left', () => {
        // The rule that keeps a lecture from starting itself in a quiet room. `wasPlaying` is
        // recorded on the way out for exactly this: a paused video that comes back paused is not
        // a failure, it is a viewer who paused it.
        expect(resumeAction({ ...playing, paused: true, wasPlaying: false })).toBe('none');
    });

    it('asks a platform-paused video to continue', () => {
        // The ordinary iOS case: the element is intact and simply stopped.
        expect(resumeAction({ ...playing, paused: true })).toBe('play');
    });

    it('reloads an element that has thrown away everything it had', () => {
        // readyState back at HAVE_NOTHING means the decoder was reclaimed while the page was away.
        // play() on that does nothing at all — there is nothing behind it to play.
        expect(resumeAction({ ...playing, readyState: HAVE_NOTHING, paused: true })).toBe('reload');
    });

    it('reloads an element holding an error, whatever else is true of it', () => {
        // The one state that is worth the expensive repair on sight: an element with `error` set
        // is finished with that source, and every cheaper answer is a no-op on it.
        expect(resumeAction({ ...playing, error: { code: 3 } })).toBe('reload');
    });

    it('leaves an emptied element alone when nothing was playing', () => {
        // A poster that has not been played yet also reads as HAVE_NOTHING. Reloading it would
        // spend a viewer's data on a video they have not asked for — which is the bill
        // `autoStartLoad: false` exists to protect.
        expect(resumeAction({
            error: null, readyState: HAVE_NOTHING, paused: true, ended: false, wasPlaying: false,
        })).toBe('none');
    });

    it('leaves a finished video on its last frame', () => {
        expect(resumeAction({ ...playing, ended: true, paused: true })).toBe('none');
    });
});

describe('stillStalled', () => {
    const stalled = { before: 120, after: 120, paused: false, ended: false, readyState: 1 };

    it('catches the quiet failure: not paused, no error, not moving', () => {
        // The hls.js case. Backgrounding the page aborted the fetches, the loader stopped and does
        // not restart itself, so the element plays out whatever was buffered and then sits there
        // — with nothing wrong to look at and no event to notice.
        expect(stillStalled(stalled)).toBe(true);
    });

    it('accepts a playhead that has moved at all', () => {
        expect(stillStalled({ ...stalled, after: 120.4 })).toBe(false);
    });

    it('does not mistake the jitter of a position read twice for playback', () => {
        // `currentTime` is not a whole number and does not stand perfectly still across two reads
        // a second apart. A hundredth of a second is that, not a video that is running — without
        // the epsilon the stall would go unnoticed on exactly the elements that report it.
        expect(stillStalled({ ...stalled, after: 120.01 })).toBe(true);
    });

    it('takes a pause during the check as the viewer deciding', () => {
        // They came back and pressed pause themselves within the second. Restarting the loader
        // then would be the app arguing with them.
        expect(stillStalled({ ...stalled, paused: true })).toBe(false);
        expect(stillStalled({ ...stalled, ended: true })).toBe(false);
    });

    it('leaves an element alone that could play the next frame if it wanted to', () => {
        // A position that has not moved while the element holds data ahead of it is something
        // other than a starved buffer — a seek in progress, a zero-length source — and restarting
        // the loader there interrupts rather than helps.
        expect(stillStalled({ ...stalled, readyState: 4 })).toBe(false);
    });
});
