import { describe, expect, it } from 'vitest';
import { contentCreateConfig, withVisibilityFlipped } from '@/hooks/useChannels';
import { UPLOAD_CONFIRM_TIMEOUT_MS } from '@/lib/api/client';

/**
 * The confirm step of a presigned upload rides the same create endpoint as every other content
 * type, but it is the only one that makes the backend page through `ListParts` and run
 * `CompleteMultipartUpload` over an object that may be several GB. Under the client's 30s default
 * axios aborted mid-flight while the server went on to assemble the object and create the row —
 * so the user was told publishing failed for a video that now existed, with the only recovery
 * being a retry the UI did not suggest.
 */
describe('contentCreateConfig', () => {
    it('gives a create that confirms an upload its own generous timeout', () => {
        expect(contentCreateConfig({ title: 'درس', uploadSessionId: 42 }))
            .toEqual({ timeout: UPLOAD_CONFIRM_TIMEOUT_MS });
    });

    it('leaves an ordinary create on the client default', () => {
        // Overriding globally would have been the wrong fix: the 30s default exists so a stalled
        // read fails fast, and every article/post/series create is an ordinary insert.
        expect(contentCreateConfig({ title: 'مقال', content: 'نص' })).toBeUndefined();
        expect(contentCreateConfig({ title: 'من رابط', sourceUrl: 'https://example.com/v' }))
            .toBeUndefined();
    });

    it('tolerates a missing payload rather than throwing inside the mutation', () => {
        expect(contentCreateConfig(undefined)).toBeUndefined();
        expect(contentCreateConfig(null)).toBeUndefined();
    });

    /** Comfortably past a multi-GB CompleteMultipartUpload, and still bounded. */
    it('is long enough to outlast the operation it covers', () => {
        expect(UPLOAD_CONFIRM_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
    });
});

/**
 * The optimistic half of the show/hide toggle. Without it the eye icon did not move until a PATCH
 * and the list refetch it triggers had both returned — two round trips in which the owner's press
 * had no visible effect, and then the row changed under them.
 */
describe('withVisibilityFlipped', () => {
    const page = {
        currentPage: 2,
        totalPages: 5,
        content: [
            { id: 1, title: 'درس', visible: true },
            { id: 2, title: 'مقال', visible: true },
        ],
    };

    it('flips the one item and leaves the rest of the page alone', () => {
        const next = withVisibilityFlipped(page, 2, false);

        expect(next.content).toEqual([
            { id: 1, title: 'درس', visible: true },
            { id: 2, title: 'مقال', visible: false },
        ]);
        // The paging fields ride along: this writes back a whole cached page, and dropping them
        // would blank the pager under the list mid-press.
        expect(next.currentPage).toBe(2);
        expect(next.totalPages).toBe(5);
    });

    it('copies rather than mutates, so a rollback still has the old page to put back', () => {
        const next = withVisibilityFlipped(page, 1, false);

        expect(next).not.toBe(page);
        expect(page.content[0].visible).toBe(true);
    });

    it('leaves a page that does not hold the item untouched', () => {
        // The owner presses on page 2; pages 1 and 3 are cached too and are written by the same
        // prefix match.
        expect(withVisibilityFlipped(page, 99, false).content).toEqual(page.content);
    });

    it('passes through anything that is not a loaded page', () => {
        // setQueriesData runs over every match, including keys with nothing cached yet.
        expect(withVisibilityFlipped(undefined, 1, false)).toBeUndefined();
        expect(withVisibilityFlipped(null, 1, false)).toBeNull();
        expect(withVisibilityFlipped({}, 1, false)).toEqual({});
    });
});
