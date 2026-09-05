import { describe, expect, it, vi } from 'vitest';
import {
    ALLOWED_EXTENSIONS, acceptAttribute, chunk, missingPartNumbers, partRange, uploadParts,
    sleep, uploadedBytes, withRetry,
} from '@/hooks/usePresignedUpload';

/** Backoff is real time; every retry test injects this so it exercises decisions, not delays. */
const noSleep = () => Promise.resolve();

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

    it('retries a part that fails transiently, and counts its bytes once', async () => {
        // The failure this exists for: one blink in a 1,280-part upload used to discard every
        // byte already transferred.
        const put = vi.fn()
            .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
            .mockResolvedValue(undefined);
        const onPartDone = vi.fn();

        await uploadParts(fakeFile(100), [{ partNumber: 1, url: 'u1' }], 100, {
            put, onPartDone, sleepFn: noSleep,
        });

        expect(put).toHaveBeenCalledTimes(2);
        expect(onPartDone).toHaveBeenCalledTimes(1);
    });
});

describe('withRetry', () => {
    it('retries a rate-limited call until it succeeds', async () => {
        const attempt = vi.fn()
            .mockRejectedValueOnce(Object.assign(new Error('429'), { status: 429 }))
            .mockRejectedValueOnce(Object.assign(new Error('503'), { response: { status: 503 } }))
            .mockResolvedValue('ok');

        await expect(withRetry(attempt, { sleepFn: noSleep })).resolves.toBe('ok');
        expect(attempt).toHaveBeenCalledTimes(3);
    });

    it('gives up after the attempt cap and rethrows the last failure', async () => {
        const attempt = vi.fn().mockRejectedValue(Object.assign(new Error('503'), { status: 503 }));

        await expect(withRetry(attempt, { sleepFn: noSleep })).rejects.toThrow('503');
        expect(attempt).toHaveBeenCalledTimes(4);
    });

    it('does not retry a dead signature', async () => {
        // A 403 means this presigned URL is expired or wrong. Re-sending the same bytes to it
        // cannot fix that — only a re-signed URL can, which is the resume path's job.
        const attempt = vi.fn().mockRejectedValue(Object.assign(new Error('403'), { status: 403 }));

        await expect(withRetry(attempt, { sleepFn: noSleep })).rejects.toThrow('403');
        expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('does not retry a cancellation', async () => {
        const aborted = Object.assign(new Error('Upload cancelled'), { name: 'AbortError' });
        const attempt = vi.fn().mockRejectedValue(aborted);

        await expect(withRetry(attempt, { sleepFn: noSleep })).rejects.toThrow('Upload cancelled');
        expect(attempt).toHaveBeenCalledTimes(1);
    });

    it('retries a transport failure, which carries no status at all', async () => {
        // `fetch` rejects with a TypeError when the connection drops — the mobile case.
        const attempt = vi.fn()
            .mockRejectedValueOnce(new TypeError('Failed to fetch'))
            .mockResolvedValue('ok');

        await expect(withRetry(attempt, { sleepFn: noSleep })).resolves.toBe('ok');
        expect(attempt).toHaveBeenCalledTimes(2);
    });
});

describe('sleep', () => {
    it('resolves after the delay when nothing cancels it', async () => {
        await expect(sleep(1)).resolves.toBeUndefined();
    });

    it('rejects immediately for a signal that is already aborted', async () => {
        const controller = new AbortController();
        controller.abort();
        await expect(sleep(50_000, controller.signal)).rejects.toThrow('Upload cancelled');
    });

    it('wakes on a cancellation mid-wait rather than sitting out the backoff', async () => {
        const controller = new AbortController();
        const waiting = sleep(50_000, controller.signal);
        controller.abort();
        await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    });
});

describe('uploadedBytes', () => {
    it('sums the sizes storage reported rather than assuming full-sized parts', () => {
        // The bug this replaces: `file.size - missing * partSizeBytes` treats the short final
        // part as full-sized, so a resume missing it started the bar too high.
        expect(uploadedBytes([{ sizeBytes: 100 }, { sizeBytes: 40 }])).toBe(140);
    });

    it('is zero for a session with nothing uploaded', () => {
        expect(uploadedBytes([])).toBe(0);
        expect(uploadedBytes(undefined)).toBe(0);
    });
});

describe('ALLOWED_EXTENSIONS', () => {
    it('mirrors the backend UploadType allowlist exactly', () => {
        // Drift here is a file the picker offers and the backend refuses — the bug this replaced.
        expect(ALLOWED_EXTENSIONS.videos).toEqual(['mp4', 'mov', 'm4v']);
        expect(ALLOWED_EXTENSIONS.books).toEqual(['pdf']);
    });

    it('renders an accept attribute the file dialog understands', () => {
        expect(acceptAttribute('videos')).toBe('.mp4,.mov,.m4v');
        expect(acceptAttribute('books')).toBe('.pdf');
    });
});
