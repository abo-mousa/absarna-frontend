import { describe, expect, it, vi } from 'vitest';
import { chunk, missingPartNumbers, partRange, uploadParts }
    from '@/hooks/usePresignedUpload';

/**
 * Covers the pure logic of the presigned upload: byte-range arithmetic, resume diffing, and the
 * concurrency window. The network calls themselves are covered by the backend's own integration
 * tests, which upload real parts through real presigned URLs against MinIO.
 */
describe('partRange', () => {
    const PART = 8 * 1024 * 1024;

    it('maps 1-based part numbers onto byte offsets', () => {
        expect(partRange(1, PART, PART * 3)).toEqual({ start: 0, end: PART });
        expect(partRange(2, PART, PART * 3)).toEqual({ start: PART, end: PART * 2 });
    });

    it('clamps the final part to the end of the file', () => {
        // The last part is the only one allowed to be under S3's 5 MB minimum, so it must be
        // truncated to the real file length rather than the nominal part size.
        expect(partRange(3, PART, PART * 2 + 100))
            .toEqual({ start: PART * 2, end: PART * 2 + 100 });
    });

    it('handles a file smaller than one part', () => {
        expect(partRange(1, PART, 512)).toEqual({ start: 0, end: 512 });
    });
});

describe('missingPartNumbers', () => {
    it('returns every part when storage reports nothing uploaded', () => {
        expect(missingPartNumbers([], 3)).toEqual([1, 2, 3]);
        expect(missingPartNumbers(undefined, 2)).toEqual([1, 2]);
    });

    it('returns only the gaps, which is what makes resume cheap', () => {
        // Parts can land out of order because they upload concurrently, so the gap is not
        // necessarily a suffix.
        expect(missingPartNumbers([{ partNumber: 1 }, { partNumber: 3 }], 4)).toEqual([2, 4]);
    });

    it('returns nothing when every part already landed', () => {
        expect(missingPartNumbers([{ partNumber: 1 }, { partNumber: 2 }], 2)).toEqual([]);
    });
});

describe('chunk', () => {
    it('splits into batches, keeping a short trailing batch', () => {
        expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
        expect(chunk([], 2)).toEqual([]);
    });
});

describe('uploadParts', () => {
    const fakeFile = (size) => ({ size, slice: (start, end) => ({ start, end }) });

    it('uploads every part and reports the bytes each one covered', async () => {
        const put = vi.fn().mockResolvedValue(undefined);
        const onPartDone = vi.fn();
        const parts = [
            { partNumber: 1, url: 'u1' },
            { partNumber: 2, url: 'u2' },
            { partNumber: 3, url: 'u3' },
        ];

        await uploadParts(fakeFile(250), parts, 100, { put, onPartDone });

        expect(put).toHaveBeenCalledTimes(3);
        // 100 + 100 + 50: the final part is short, and progress must reflect actual bytes.
        expect(onPartDone.mock.calls.map((c) => c[0]).sort((a, b) => a - b)).toEqual([50, 100, 100]);
    });

    it('sends each part to its own presigned URL with the right slice', async () => {
        const put = vi.fn().mockResolvedValue(undefined);
        await uploadParts(fakeFile(200), [{ partNumber: 2, url: 'u2' }], 100, { put });

        expect(put).toHaveBeenCalledWith('u2', { start: 100, end: 200 }, undefined);
    });

    it('never runs more than the concurrency limit at once', async () => {
        let inFlight = 0;
        let peak = 0;
        const put = vi.fn(async () => {
            inFlight += 1;
            peak = Math.max(peak, inFlight);
            await new Promise((r) => setTimeout(r, 5));
            inFlight -= 1;
        });
        const parts = Array.from({ length: 9 }, (_, i) => ({ partNumber: i + 1, url: `u${i}` }));

        await uploadParts(fakeFile(900), parts, 100, { put });

        expect(put).toHaveBeenCalledTimes(9);
        expect(peak).toBeLessThanOrEqual(3);
    });

    it('propagates a failed part so the caller can surface it', async () => {
        const put = vi.fn().mockRejectedValue(new Error('Part upload failed (403)'));
        await expect(
            uploadParts(fakeFile(100), [{ partNumber: 1, url: 'u1' }], 100, { put })
        ).rejects.toThrow('403');
    });

    it('does nothing when there are no parts left to send', async () => {
        const put = vi.fn();
        await uploadParts(fakeFile(100), [], 100, { put });
        expect(put).not.toHaveBeenCalled();
    });
});
