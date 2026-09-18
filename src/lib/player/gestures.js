/**
 * The touch gestures the player offers on top of its buttons.
 *
 * <p><b>Why a phone needs its own answer at all.</b> The bar is built for a pointer: a 32px play
 * button, a 4px timeline, a handle revealed on hover. All three are reachable with a finger and
 * none of them is *comfortable* with one, and the thing a viewer of an hour-long lecture does most
 * is jump back a few seconds because they missed a word. On a phone that is a drag along a
 * hair-thin track, aimed at a handle the size of the fingertip covering it — so the gesture every
 * mobile player has settled on (double-tap a side of the picture) is not a flourish here, it is
 * the only comfortable way to do the most common thing.
 *
 * <p>The rules live here rather than in the hook because each of them is a decision with an edge
 * that no browser check reaches: where the zones stop, what a third tap means, and what happens
 * when a finger lands somewhere the player is not.
 */

/**
 * How long after a tap a second one still counts as part of the same gesture.
 *
 * <p>Longer than the ~300ms a browser uses for `dblclick`, because this gesture is *repeated*:
 * a viewer who wants 30 seconds taps three times in a row, and the third tap of a real run lands
 * later than the second (the hand has to travel back). Short enough that two deliberate, separate
 * taps — show the controls, then hide them again — are not read as a seek.
 */
export const DOUBLE_TAP_WINDOW_MS = 400;

/**
 * How far one double-tap jumps.
 *
 * <p>Ten seconds rather than the keyboard's five: a key is pressed with no effort and repeats,
 * a tap is a whole gesture, and every mobile player this audience has used moves ten.
 */
export const DOUBLE_TAP_SEEK_SECONDS = 10;

/**
 * How much of the picture, at each edge, is a seek zone.
 *
 * <p>The centre is deliberately the largest share. Tapping the middle of a video to pause it is
 * the older and more universal habit of the two, and the centre band is also where the play/pause
 * disc is drawn — the zone a viewer can see. 30% each side leaves 40% in the middle, which is a
 * wide target on the narrowest phone and still puts the seek zones under the thumbs of a hand
 * holding the device in landscape.
 */
const SIDE_ZONE_RATIO = 0.3;

/**
 * Which part of the picture a tap landed on: `'back'`, `'forward'` or `'centre'`.
 *
 * <p><b>The right edge is backwards, because the timeline runs right to left.</b> These zones are
 * the timeline without the timeline being visible: the viewer is pointing at a direction along it,
 * so they have to point the same way. The bar is mirrored for Arabic — the playhead starts at the
 * right and travels left — and a tap on the left that sent the handle rightwards would be two
 * directions for one gesture. This is the same rule the arrow keys follow: the gesture belongs to
 * the timeline, not to the screen.
 *
 * <p>Answers `'centre'` for a missing or zero-width rect rather than guessing a side: that is the
 * first layout pass and a detached element, and the honest answer there is "not a seek zone".
 */
export const tapZone = (clientX, rect) => {
    if (!rect || !rect.width) return 'centre';
    // Measured from the RIGHT edge, which is where the timeline begins: 0 is the start of the
    // video, 1 is the end of it.
    const ratio = (rect.right - clientX) / rect.width;
    if (ratio < SIDE_ZONE_RATIO) return 'back';
    if (ratio > 1 - SIDE_ZONE_RATIO) return 'forward';
    return 'centre';
};

/**
 * Folds one more tap into the run it belongs to, or starts a new run.
 *
 * <p>A run is `{zone, at, count}`. It continues while the taps keep landing on the *same* side
 * inside the window, which is what makes a third and fourth tap add ten seconds each instead of
 * re-starting the gesture — the behaviour every mobile player has, and the reason this is a run
 * and not a boolean "was there a tap just now".
 *
 * <p>Changing sides mid-run starts over rather than accumulating in the other direction: a viewer
 * who overshot and taps the other side means "go back ten", not "cancel twenty of the thirty I
 * just asked for".
 */
export const nextTapRun = (previous, zone, at, windowMs = DOUBLE_TAP_WINDOW_MS) => {
    if (!previous || previous.zone !== zone || at - previous.at > windowMs) {
        return { zone, at, count: 1 };
    }
    return { zone, at, count: previous.count + 1 };
};

/**
 * What a run has asked for, in seconds, signed: negative is backwards, `0` is "nothing yet".
 *
 * <p>The first tap of a run is always worth nothing. That is the whole reason a single tap on a
 * phone can still mean something else (bring the controls up, pause) — the gesture only becomes a
 * seek on the tap that makes it a double one, and by then the first tap's meaning has to have been
 * harmless, which is why the side zones deliberately do not toggle playback.
 */
export const tapSeekSeconds = (run, step = DOUBLE_TAP_SEEK_SECONDS) => {
    if (!run || run.count < 2 || run.zone === 'centre') return 0;
    const magnitude = (run.count - 1) * step;
    return run.zone === 'back' ? -magnitude : magnitude;
};

/**
 * Whether a pointer event represents the pointer actually going somewhere.
 *
 * <p><b>A stationary cursor produces `pointermove` events, and that is not a browser bug.</b> When
 * an element's `pointer-events` change, the browser re-runs hit testing and dispatches a move at
 * the SAME coordinates so the page can react to what is under the cursor now. The player toggles
 * `pointer-events` on exactly the two things a resting cursor sits on — the control row along the
 * bottom, and the play/pause disc in the middle — so hiding the controls produced a move, the move
 * was read as "the viewer is reaching for a control", and the controls came straight back. They
 * never faded, on a page where nothing was moving at all.
 *
 * <p>Comparing the coordinates is the whole fix, and it is the right one rather than a patch: a
 * fade on idle is asking whether the POINTER has moved, and an event that reports the same point
 * as the last one is the browser saying it has not.
 */
export const pointerMoved = (last, x, y) => !last || last.x !== x || last.y !== y;
