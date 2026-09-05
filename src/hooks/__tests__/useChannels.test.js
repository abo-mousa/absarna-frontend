import { describe, expect, it } from 'vitest';
import { contentCreateConfig } from '@/hooks/useChannels';
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
