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
 *
 * Storage access goes through `lib/safeStorage`, which is the same try/catch this module used to
 * spell out for itself. Where it differs is the degradation: a browser that blocks site data now
 * falls back to an in-memory map for the life of the page, so a resume still works within the tab
 * it started in rather than being refused outright. Losing it on reload is the honest limit.
 */

import { safeStorage } from './safeStorage';

const NAMESPACE = 'absarna.upload';

/**
 * Matches `UploadSessionSweeper.ABANDONED_AFTER` on the backend: past it the session has been
 * aborted at the object store, so offering to resume it would only produce an error.
 */
const RESUMABLE_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (slug, kind) => `${NAMESPACE}.${slug}.${kind}`;

/** JSON on top of safeStorage — a corrupt entry is treated as no entry, not as a crash. */
const read = (key) => {
    try {
        const raw = safeStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const write = (key, value) => {
    safeStorage.setItem(key, JSON.stringify(value));
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
    safeStorage.removeItem(storageKey(slug, kind));
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
