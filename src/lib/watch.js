/**
 * Where the player starts a video this viewer has watched before, from the watch history's entry
 * (`{seconds, progress, finished}`). The saved position — unless the backend counts the video as
 * finished (WatchProgress, 90%), when it starts again from the beginning: resuming a finished
 * lecture at its last minute is a video that ends as it opens. 0 when there is nothing saved.
 */
export function resumeFrom(watch) {
    if (!watch || watch.finished) return 0;
    const seconds = Math.floor(Number(watch.seconds));
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}
