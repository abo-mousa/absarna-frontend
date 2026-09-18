/**
 * Coming back to a video the phone put to sleep.
 *
 * <p><b>The failure this exists for.</b> Leaving the browser mid-lecture — a message, a call, the
 * screen locking — and coming back to a player that shows the right frame, the right position and
 * plays nothing. It happens for three different reasons and they are indistinguishable from the
 * outside:
 *
 * <ul>
 *   <li>The platform paused the element and does not resume it. Harmless on its own: the viewer
 *       presses play.</li>
 *   <li>Every fetch in flight was aborted when the page was hidden. On the hls.js path that is a
 *       fatal NETWORK_ERROR, and the player stops loading — so the element is left holding the
 *       seconds it had already buffered, and play() runs to the end of them and stalls. Nothing is
 *       broken; nothing is loading either, and nothing will start.</li>
 *   <li>The browser reclaimed the decoder, which shows up as an element with an `error`, or one
 *       whose `readyState` has fallen back to `HAVE_NOTHING` — it has thrown away everything it
 *       had, including the part it was playing.</li>
 * </ul>
 *
 * <p>The rules are here rather than in the hook because they are the part with the edges, they are
 * read on a platform no test in this repo runs on, and every one of them is a state the element
 * reports rather than something we can observe from a browser on a desk.
 */

/** `HTMLMediaElement.HAVE_NOTHING` — the element is holding no data at all. */
export const HAVE_NOTHING = 0;
/** `HTMLMediaElement.HAVE_FUTURE_DATA` — enough buffered ahead to advance a frame. */
export const HAVE_FUTURE_DATA = 3;

/**
 * How long to give a returning player before deciding it is stuck.
 *
 * <p>A page coming back to the foreground is briefly slow at everything: the decoder is warming
 * up, the first segment after a suspension is in flight, and a `readyState` read in the same task
 * as the `visibilitychange` says almost nothing. A second is long enough that a player that was
 * only catching up has caught up, and short enough that a viewer looking at a frozen frame has not
 * yet decided the app is broken and left.
 */
export const RESUME_STALL_CHECK_MS = 1000;

/** The playhead has to move by more than this for the video to count as running. */
const ADVANCE_EPSILON_SECONDS = 0.05;

/**
 * Whether leaving the page should stop this video.
 *
 * <p><b>Why the page has to decide this at all.</b> Leaving the browser does not reliably stop a
 * video. Chrome on Android keeps the audio going and puts a media notification in the shade — a
 * deliberate feature, and the right one for a music site — so a lecture opened and left behind
 * carries on talking into somebody's pocket, spending their data on video frames nobody is
 * watching. iOS stops it, most desktop browsers do not.
 *
 * <p><b>The two exceptions are the whole reason this is a function.</b> Picture-in-picture and
 * casting are the cases where playing on with the page hidden IS the feature — the viewer asked
 * for exactly that, one of them by pressing a button in this player — and pausing them would make
 * the two controls look broken: a PiP window that freezes the moment it is any use is not
 * picture-in-picture. Everything else stops.
 *
 * <p>Exported and tested because neither exception can be produced in this repo: there is no
 * jsdom, no second window and no television.
 */
export const shouldPauseWhenHidden = ({ playing, pictureInPicture, castingToRemote }) => {
    if (!playing) return false;
    return !pictureInPicture && !castingToRemote;
};

/**
 * What a player that has just come back to the foreground needs, before anything has been tried:
 * `'none'`, `'play'` or `'reload'`.
 *
 * <p>`'reload'` is the answer for an element that has lost its data, and only for that — it is the
 * expensive one (the source is attached again and the position restored by hand), so it is not
 * reached for on the strength of a video merely being paused.
 *
 * <p>`wasPlaying` is what the page recorded on the way out, and it is what keeps this from
 * resuming a video the viewer had deliberately paused before they left. `ended` is checked first
 * for the same reason: the last frame is where a video is supposed to stop.
 */
export const resumeAction = ({ error, readyState, paused, ended, wasPlaying }) => {
    if (error) return 'reload';
    if (readyState === HAVE_NOTHING) return wasPlaying ? 'reload' : 'none';
    if (ended) return 'none';
    if (!wasPlaying) return 'none';
    return paused ? 'play' : 'none';
};

/**
 * Whether a player that was asked to continue actually did, read a moment later.
 *
 * <p>This is the check that catches the quiet case — the element is not paused, not errored, holds
 * a `readyState` that looks fine, and the playhead has not moved since the page came back because
 * the thing feeding it stopped while nobody was looking. `paused` and `ended` are "the viewer
 * decided", not a stall.
 */
export const stillStalled = ({ before, after, paused, ended, readyState }) => {
    if (paused || ended) return false;
    if (after > before + ADVANCE_EPSILON_SECONDS) return false;
    // A position that has not moved while the element claims to be able to play the next frame is
    // something other than a starved buffer — a zero-length video, a seek in progress — and
    // restarting the loader would interrupt rather than help.
    return readyState < HAVE_FUTURE_DATA;
};
