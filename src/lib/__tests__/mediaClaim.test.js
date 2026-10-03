import { describe, expect, it } from 'vitest';
import { claimFromMetadata, isRecordingFile, readMediaClaim } from '@/lib/mediaClaim';

describe('claimFromMetadata', () => {
    it('sends the length and the short side of a video, as displayed', () => {
        expect(claimFromMetadata({ duration: 612.4, videoWidth: 1920, videoHeight: 1080 }))
            .toEqual({ claimedDurationSeconds: 612, claimedShortSide: 1080 });
        // Portrait: the short side is the width.
        expect(claimFromMetadata({ duration: 60, videoWidth: 1080, videoHeight: 1920 }))
            .toEqual({ claimedDurationSeconds: 60, claimedShortSide: 1080 });
    });

    it('never sends a value the backend would refuse, which would fail the whole create', () => {
        // A sub-second clip rounds up to 1, never down to 0.
        expect(claimFromMetadata({ duration: 0.4, videoWidth: 640, videoHeight: 360 }).claimedDurationSeconds)
            .toBe(1);
        for (const duration of [0, -3, Infinity, NaN, undefined]) {
            expect(claimFromMetadata({ duration, videoWidth: 0, videoHeight: 0 })).toEqual({});
        }
    });

    it('leaves the short side out when no frame was decoded, and for a recording', () => {
        expect(claimFromMetadata({ duration: 30, videoWidth: 0, videoHeight: 0 }))
            .toEqual({ claimedDurationSeconds: 30 });
        expect(claimFromMetadata({ duration: 30, videoWidth: 1280, videoHeight: 720 }, true))
            .toEqual({ claimedDurationSeconds: 30 });
    });
});

describe('isRecordingFile', () => {
    it('knows a recording by its extension or its type', () => {
        expect(isRecordingFile({ name: 'lecture.MP3', type: '' })).toBe(true);
        expect(isRecordingFile({ name: 'talk.m4a', type: '' })).toBe(true);
        expect(isRecordingFile({ name: 'clip', type: 'audio/wav' })).toBe(true);
        expect(isRecordingFile({ name: 'lecture.mp4', type: 'video/mp4' })).toBe(false);
    });
});

describe('readMediaClaim', () => {
    it('resolves an empty claim where it cannot read anything, and never rejects', async () => {
        // No DOM here, which is also the shape of every failure: nothing to send.
        await expect(readMediaClaim({ name: 'a.mp4', type: 'video/mp4' })).resolves.toEqual({});
        await expect(readMediaClaim(null)).resolves.toEqual({});
    });
});
