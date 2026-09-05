import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    forgetSession,
    rememberSession,
    rememberedSession,
    resumableSessionId,
} from '@/lib/uploadResume';

/**
 * The resume path was fully built on both sides and completely unreachable: the backend had
 * list-parts and reissue-parts, the hook implemented the whole diff-and-fill algorithm, and
 * nothing ever held onto a session id. These cover the piece that was missing.
 */
const file = (name, size) => ({ name, size });

/** The suite runs in node, so storage is supplied rather than borrowed from a DOM. */
const fakeStorage = () => {
    const entries = new Map();
    return {
        getItem: (k) => (entries.has(k) ? entries.get(k) : null),
        setItem: (k, v) => entries.set(k, String(v)),
        removeItem: (k) => entries.delete(k),
    };
};

describe('uploadResume', () => {
    beforeEach(() => {
        globalThis.localStorage = fakeStorage();
        vi.restoreAllMocks();
    });

    it('offers the remembered session when the same file is picked again', () => {
        rememberSession('ch', 'videos', file('lecture.mp4', 1024), 42);

        expect(resumableSessionId('ch', 'videos', file('lecture.mp4', 1024))).toBe(42);
    });

    it('scopes what it remembers to one channel and one kind', () => {
        rememberSession('ch', 'videos', file('lecture.mp4', 1024), 42);

        expect(resumableSessionId('other', 'videos', file('lecture.mp4', 1024))).toBeNull();
        expect(resumableSessionId('ch', 'books', file('lecture.mp4', 1024))).toBeNull();
    });

    /**
     * Size alone is not enough. A resume uploads only the missing byte ranges, computed from the
     * picked file — so filling one upload's gaps from a different file of identical length would
     * assemble an object that is corrupt rather than merely wrong, with nothing downstream to
     * notice.
     */
    it('refuses a different file, whether the name or the size differs', () => {
        rememberSession('ch', 'videos', file('lecture.mp4', 1024), 42);

        expect(resumableSessionId('ch', 'videos', file('lecture.mp4', 2048))).toBeNull();
        expect(resumableSessionId('ch', 'videos', file('other.mp4', 1024))).toBeNull();
    });

    /** Past the backend's sweep threshold the session has been aborted; offering it only errors. */
    it('drops an entry older than the backend sweeps sessions at', () => {
        const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
        vi.spyOn(Date, 'now').mockReturnValue(eightDaysAgo);
        rememberSession('ch', 'videos', file('lecture.mp4', 1024), 42);
        vi.restoreAllMocks();

        expect(rememberedSession('ch', 'videos')).toBeNull();
        // and it is cleaned up rather than re-evaluated on every file pick
        expect(globalThis.localStorage.getItem('absarna.upload.ch.videos')).toBeNull();
    });

    it('reports a remembered session for a different file, so its slot can be released', () => {
        rememberSession('ch', 'videos', file('lecture.mp4', 1024), 42);

        // No resume offer...
        expect(resumableSessionId('ch', 'videos', file('other.mp4', 99))).toBeNull();
        // ...but the id is still available to cancel, which is what frees the per-channel quota.
        expect(rememberedSession('ch', 'videos').sessionId).toBe(42);
    });

    it('forgets a session once it is spent', () => {
        rememberSession('ch', 'videos', file('lecture.mp4', 1024), 42);
        forgetSession('ch', 'videos');

        expect(rememberedSession('ch', 'videos')).toBeNull();
    });

    /** Privacy modes throw outright on localStorage; no remembered session is the right answer. */
    it('survives storage that throws', () => {
        globalThis.localStorage = {
            getItem: () => { throw new Error('denied'); },
            setItem: () => { throw new Error('denied'); },
            removeItem: () => { throw new Error('denied'); },
        };

        expect(() => rememberSession('ch', 'videos', file('a.mp4', 1), 1)).not.toThrow();
        expect(() => forgetSession('ch', 'videos')).not.toThrow();
        expect(resumableSessionId('ch', 'videos', file('a.mp4', 1))).toBeNull();
    });

    /** Server-side rendering, a worker, any context with no storage at all. */
    it('survives storage being absent entirely', () => {
        globalThis.localStorage = undefined;

        expect(() => rememberSession('ch', 'videos', file('a.mp4', 1), 1)).not.toThrow();
        expect(resumableSessionId('ch', 'videos', file('a.mp4', 1))).toBeNull();
    });
});
