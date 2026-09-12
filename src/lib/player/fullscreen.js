/** The element the browser is currently showing fullscreen, across the two spellings of it. */
export const fullscreenElementNow = () =>
    document.fullscreenElement ?? document.webkitFullscreenElement ?? null;

/**
 * Asks for fullscreen on `el`, ignoring a refusal.
 *
 * A refusal is a legitimate outcome, not an error to surface: the API needs user activation and
 * iOS Safari gives a regular element no fullscreen at all (only the `<video>` has
 * `webkitEnterFullscreen`). Both promise rejection and synchronous throw are swallowed, because
 * the two spellings differ on which one they use.
 */
export const requestFullscreenOn = (el) => {
    const request = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
    if (!request) return false;
    try {
        request.call(el)?.catch?.(() => {});
        return true;
    } catch {
        return false;
    }
};

export const exitFullscreenNow = () => {
    const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
    if (!exit) return;
    try {
        exit.call(document)?.catch?.(() => {});
    } catch {
        /* Already out, or never in. */
    }
};
