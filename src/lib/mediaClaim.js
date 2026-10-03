/**
 * What the browser can read from a picked video or recording before it is uploaded: its length and
 * the short side of its frame. Sent beside `uploadSessionId` on create as `claimedDurationSeconds`
 * and `claimedShortSide`, where the backend uses them to pick the transcode lane — a short upload
 * is not made to wait behind a long one (absarna-backend/SHORT-LANE.md).
 *
 * A CLAIM, NOT A MEASUREMENT, and only a routing hint: the worker probes the real file, and the
 * video's length is whatever it measures. So everything here is best-effort and must never get in
 * the way of publishing — anything unreadable is left out (the backend reads absence as the normal
 * lane), and nothing it returns can be refused: the backend validates both as positive integers,
 * and a value it refused would fail the whole create request over a hint.
 */

/** The audio files the backend accepts as videos — mirrors `UploadType.VIDEO`'s audio entries. */
const RECORDING_EXTENSIONS = ['mp3', 'm4a', 'wav'];

/** Largest value the backend's Integer fields hold. */
const MAX_INT = 2147483647;

/** How long to wait for the element's metadata before giving up and sending no claim. */
const METADATA_TIMEOUT_MS = 5000;

/** Whether a picked file is a recording (sound, no picture), which decides the element to read it with. */
export const isRecordingFile = (file) => {
    const extension = file?.name?.split('.').pop()?.toLowerCase();
    return RECORDING_EXTENSIONS.includes(extension) || (file?.type ?? '').startsWith('audio/');
};

const positiveInt = (value) => (Number.isFinite(value) && value > 0
    ? Math.min(MAX_INT, Math.max(1, Math.round(value)))
    : undefined);

/**
 * The claim from a media element's metadata. Pure, so it is the part worth testing.
 *
 * Length rounds to whole seconds with a floor of 1 — a sub-second clip rounding to 0 would be
 * refused. The short side is sent only for a picture both of whose sides are known: a recording
 * has none, and an element that decoded no frame reports 0x0.
 */
export const claimFromMetadata = ({ duration, videoWidth, videoHeight } = {}, recording = false) => {
    const claim = {};
    const seconds = positiveInt(duration);
    if (seconds !== undefined) claim.claimedDurationSeconds = seconds;
    if (!recording && videoWidth > 0 && videoHeight > 0) {
        claim.claimedShortSide = positiveInt(Math.min(videoWidth, videoHeight));
    }
    return claim;
};

/**
 * Reads the claim from a local file, resolving `{}` on any failure or after a few seconds. Never
 * rejects, and loads metadata only — not the media.
 */
export const readMediaClaim = (file, { timeoutMs = METADATA_TIMEOUT_MS } = {}) => new Promise((resolve) => {
    if (!file || typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') {
        resolve({});
        return;
    }
    const recording = isRecordingFile(file);
    let url = null;
    let element = null;
    let timer = null;
    const finish = (claim) => {
        clearTimeout(timer);
        if (element) {
            element.onloadedmetadata = null;
            element.onerror = null;
            element.removeAttribute('src');
        }
        if (url) URL.revokeObjectURL(url);
        resolve(claim);
    };
    try {
        element = document.createElement(recording ? 'audio' : 'video');
        element.preload = 'metadata';
        element.muted = true;
        element.onloadedmetadata = () => finish(claimFromMetadata(element, recording));
        element.onerror = () => finish({});
        timer = setTimeout(() => finish({}), timeoutMs);
        url = URL.createObjectURL(file);
        element.src = url;
    } catch {
        finish({});
    }
});
