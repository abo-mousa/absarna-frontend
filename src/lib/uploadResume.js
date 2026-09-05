/**
 * Remembers which upload session a channel has in flight, so an interrupted upload can be
 * resumed instead of restarted.
 *
 * This is the missing half of a capability the rest of the stack already has: the backend
 * persists an `UploadSession` row precisely so progress survives a closed tab, and its
 * `list-parts` step reads what actually landed in object storage rather than anything a browser
 * remembered. All of that was reachable only from tests, because nothing ever held onto a
 * session id.
 *
 * **What is stored here is only the id, never the progress.** Object storage stays the source of
 * truth for which parts exist; losing this entry costs a resume offer, not correctness. That is
 * also why a resume works across tabs on the same machine but not across devices — the id is the
 * only thing that is local, and a device that never saw it simply starts over.
 */

const NAMESPACE = 'absarna.upload';

/**
 * Matches `UploadSessionSweeper.ABANDONED_AFTER` on the backend: past it the session has been
 * aborted at the object store, so offering to resume it would only produce an error.
 */
const RESUMABLE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (slug, kind) => `${NAMESPACE}.${slug}.${kind}`;

/**
 * Every access is guarded: localStorage throws outright in some privacy modes, and the whole
 * feature degrades to "no resume offered", which is the correct answer there.
 */
const read = (key) => {
    try {
        const raw = globalThis.localStorage?.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const write = (key, value) => {
    try {
        globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
        /* a resume offer is a convenience; failing to store one is not an error */
    }
};

export const rememberSession = (slug, kind, file, sessionId) => {
    if (!slug || !sessionId || !file) return;
    write(storageKey(slug, kind), {
        sessionId,
        name: file.name,
        size: file.size,
        savedAt: Date.now(),
    });
};

export const forgetSession = (slug, kind) => {
    try {
        globalThis.localStorage?.removeItem(storageKey(slug, kind));
    } catch {
        /* nothing to clean up if storage is unavailable */
    }
};

/** The remembered session, whatever file it was for — used to release an abandoned slot. */
export const rememberedSession = (slug, kind) => {
    const entry = read(storageKey(slug, kind));
    if (!entry?.sessionId) return null;
    if (Date.now() - (entry.savedAt ?? 0) > RESUMABLE_FOR_MS) {
        forgetSession(slug, kind);
        return null;
    }
    return entry;
};

/**
 * The remembered session id, but only if this is the same file again.
 *
 * Name *and* size, not size alone: the byte ranges a resume uploads are derived from the file's
 * size against the session's own part arithmetic, so filling the gaps of one file from a
 * different one of identical length would assemble a corrupt object. Requiring the name too
 * makes an accidental match vanishingly unlikely, and makes the prompt honest — it can name the
 * file it is offering to continue.
 */
export const resumableSessionId = (slug, kind, file) => {
    const entry = rememberedSession(slug, kind);
    if (!entry || !file) return null;
    return entry.name === file.name && entry.size === file.size ? entry.sessionId : null;
};
