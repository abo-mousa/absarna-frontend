import { describe, it, expect } from 'vitest';
import { canReplaceFile } from '../tabs/VideosTab';

describe('canReplaceFile', () => {
    it('offers it for an uploaded video that finished or failed', () => {
        expect(canReplaceFile({ sourceType: 'UPLOAD', status: 'READY' })).toBe(true);
        expect(canReplaceFile({ sourceType: 'UPLOAD', status: 'FAILED' })).toBe(true);
    });

    // The backend cannot cancel a job, and refuses these (VIDEO_FILE_STILL_PROCESSING).
    it('does not offer it while the worker still has the file', () => {
        expect(canReplaceFile({ sourceType: 'UPLOAD', status: 'UPLOADED' })).toBe(false);
        expect(canReplaceFile({ sourceType: 'UPLOAD', status: 'READY', transcodeQueue: { ahead: 0 } })).toBe(false);
    });

    it('does not offer it for a video we do not host', () => {
        expect(canReplaceFile({ sourceType: 'YOUTUBE', status: 'READY' })).toBe(false);
        expect(canReplaceFile(null)).toBe(false);
    });
});
