/** Native button activation and browser shortcuts take precedence over player shortcuts. */
export function ownsShortcut(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
    const target = event.target;
    if (target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="menu"]')) return false;
    if ((event.key === ' ' || event.key === 'Enter') && target?.closest?.('button, a, [role="button"]')) return false;
    return true;
}

export function toggleMediaMute(element, lastVolume = 1) {
    const silent = element.muted || element.volume === 0;
    if (silent && element.volume === 0) element.volume = lastVolume > 0 ? lastVolume : 1;
    element.muted = !silent;
}

/**
 * Asks the element to play and says what happened if it would not.
 *
 * <p>AbortError is expected when a source changes while a play request is pending, and is
 * silent. NotAllowedError is the browser wanting a tap first (autoplay policy, iOS after a
 * resume or an `await`) — nothing is broken, so it is `playblocked`, which only brings the play
 * button up. Anything else is `playbackfailure`, the recoverable error overlay.
 */
export function requestPlay(element) {
    if (!element) return;
    const fail = (error) => {
        if (error?.name === 'AbortError') return;
        element.dispatchEvent(new Event(error?.name === 'NotAllowedError' ? 'playblocked' : 'playbackfailure'));
    };
    try {
        Promise.resolve(element.play()).catch(fail);
    } catch (error) {
        fail(error);
    }
}

/**
 * Where an A–B repeat sends the playhead, or null to leave it alone.
 *
 * <p>Only when playback RAN into B from inside the passage — `previous` is the last time seen
 * during ordinary playback, and null straight after a seek. So a viewer who drags, presses an
 * arrow or clicks a timestamp past B stays where they went; the repeat resumes once they are back
 * inside it.
 */
export function repeatTarget(time, range, previous, { paused = false, seeking = false } = {}) {
    if (paused || seeking) return null;
    if (!range || !Number.isFinite(range.end) || range.end <= range.start) return null;
    if (previous == null || previous < range.start || previous >= range.end) return null;
    return time >= range.end ? range.start : null;
}
