/**
 * What a progress report answered — `{ completion, portionsCompleted }` — handed to whoever is
 * listening (the finishing moment, the portion's "done"). A module-level channel rather than a
 * context, because the reports are sent from hooks, from unload flushes and from outside React's
 * tree; the listener lives once, in the app shell.
 */
const listeners = new Set();

export function onProgressReport(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function emitProgressReport(answer) {
    if (!answer) return;
    const hasCompletion = !!answer.completion;
    const hasPortions = Array.isArray(answer.portionsCompleted) && answer.portionsCompleted.length > 0;
    if (!hasCompletion && !hasPortions) return;
    listeners.forEach((listener) => {
        try {
            listener(answer);
        } catch {
            /* a listener's failure must not reach the player */
        }
    });
}
