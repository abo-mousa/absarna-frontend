import { useCallback, useRef, useState } from 'react';
import api from '@/lib/api/client';

/**
 * Uploads a file straight to object storage through presigned S3 multipart URLs.
 *
 * Replaces `useParallelUpload`'s chunked flow through `/api/upload/*`: bytes no longer transit
 * the backend at all. The backend mints presigned part URLs, and assembles the object
 * server-side when the create call confirms the session.
 *
 * Backend contract (five endpoints, shared by videos and books):
 *   POST   .../{kind}/upload-url                → { sessionId, partSizeBytes, totalParts, parts }
 *   PUT    <presigned url>                      → one per part, direct to storage, no credentials
 *   GET    .../upload-url/{sessionId}/parts     → { sessionId, partSizeBytes, totalParts, parts }
 *   POST   .../upload-url/{sessionId}/parts     → { parts } — re-signs specific part numbers
 *   DELETE .../upload-url/{sessionId}           → gives up, freeing the channel's quota slot
 *
 * The returned `sessionId` is passed as `uploadSessionId` to the create endpoint, which is what
 * actually finalises the upload. Nothing exists as content until then, so an abandoned upload
 * leaves no row behind.
 */

const MAX_PARALLEL = 3;

/** Presigned URLs expire, so a resume re-signs in batches rather than all at once. */
const REISSUE_BATCH = 50;

/**
 * Thrown when a remembered session cannot be resumed — it was swept, cancelled, already
 * published, or the file no longer matches it. Callers restart from scratch rather than surface
 * it: from the user's side "resume did not apply" is not a failure, it is an ordinary upload.
 */
export class ResumeUnavailableError extends Error {}

const extensionOf = (file) => {
    const parts = file.name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/** Byte range covered by a part number, given the server's part size. */
export const partRange = (partNumber, partSizeBytes, fileSize) => {
    const start = (partNumber - 1) * partSizeBytes;
    return { start, end: Math.min(start + partSizeBytes, fileSize) };
};

/** Part numbers still missing, given what storage reports. Server truth, not local bookkeeping. */
export const missingPartNumbers = (uploadedParts, totalParts) => {
    const done = new Set((uploadedParts ?? []).map((p) => p.partNumber));
    const missing = [];
    for (let n = 1; n <= totalParts; n += 1) {
        if (!done.has(n)) missing.push(n);
    }
    return missing;
};

export const chunk = (items, size) => {
    const out = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
};

/**
 * Raw fetch, deliberately NOT the shared axios client.
 *
 * That client's request interceptor attaches the user's JWT to every call. Sending it to object
 * storage would leak a session token to a third-party host, and the presigned signature covers
 * the URL and host only — extra headers can invalidate it. The signature is the whole credential.
 */
const putPart = async (url, blob, signal) => {
    const response = await fetch(url, { method: 'PUT', body: blob, signal });
    if (!response.ok) throw new Error(`Part upload failed (${response.status})`);
};

/** Uploads a batch of presigned parts with bounded concurrency. */
export const uploadParts = async (file, parts, partSizeBytes, { signal, onPartDone, put } = {}) => {
    const send = put ?? putPart;
    const queue = [...parts];

    const worker = async () => {
        for (;;) {
            const part = queue.shift();
            if (!part) return;
            const { start, end } = partRange(part.partNumber, partSizeBytes, file.size);
            await send(part.url, file.slice(start, end), signal);
            onPartDone?.(end - start);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, worker)
    );
};

export const usePresignedUpload = () => {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const abortRef = useRef(null);

    const cancel = useCallback(() => abortRef.current?.abort(), []);

    /**
     * @param file                 the File to upload
     * @param kind                 'videos' | 'books' — picks the backend's allowlist and size cap
     * @param slug                 channel slug; the caller must manage it
     * @param resumeSessionId      optional; resumes an interrupted upload of the same file
     * @param onSessionStart       called with the session id the moment it exists, before any
     *                             bytes are sent — persisting it there is what makes a resume
     *                             possible after a crash during the very first window
     * @returns the session id to send as `uploadSessionId` when creating the content row
     */
    const upload = useCallback(async (file, { kind, slug, resumeSessionId, onSessionStart } = {}) => {
        setUploading(true);
        setError(null);
        setProgress(0);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            let session;
            let outstanding;

            if (resumeSessionId) {
                // Progress comes from object storage via the backend, never from anything this
                // browser remembered — which is why a resume survives a closed tab, a second tab
                // uploading the same file, and a cleared cache. Only the session id is local.
                const { data } = await resumeProgress(slug, kind, resumeSessionId);
                requireSessionFits(file, data);
                session = data;
                setSessionId(session.sessionId);
                outstanding = missingPartNumbers(data.parts, data.totalParts);
            } else {
                const { data } = await api.post(`/channels/${slug}/content/${kind}/upload-url`, {
                    extension: extensionOf(file),
                    sizeBytes: file.size,
                });
                session = data;
                // Announced before a single byte goes out: an upload interrupted halfway through
                // the first window is exactly the case a resume is for, and a caller that only
                // learns the id on success can never offer one.
                setSessionId(session.sessionId);
                onSessionStart?.(session.sessionId);
                // The first window arrives already signed; everything past it is requested below.
                await uploadWindow(file, data.parts, data, controller, setProgress, 0);
                outstanding = [];
                for (let n = (data.parts?.length ?? 0) + 1; n <= data.totalParts; n += 1) {
                    outstanding.push(n);
                }
            }

            // Signed in batches rather than all at once: the server caps how many URLs one
            // response may carry, and a URL signed now would expire before a slow upload of a
            // large file reached it anyway.
            let done = file.size - outstanding.length * session.partSizeBytes;
            for (const batch of chunk(outstanding, REISSUE_BATCH)) {
                const { data } = await api.post(
                    `/channels/${slug}/content/${kind}/upload-url/${session.sessionId}/parts`,
                    { partNumbers: batch }
                );
                done = await uploadWindow(file, data.parts, session, controller, setProgress, done);
            }

            setProgress(100);
            return session.sessionId;
        } catch (e) {
            setError(e);
            throw e;
        } finally {
            setUploading(false);
            abortRef.current = null;
        }
    }, []);

    /**
     * Gives up on a session at the backend, releasing the channel's quota slot immediately
     * instead of letting it sit until the 24h age bound. Best-effort: the session may already be
     * gone, and there is nothing useful to tell the user if the release fails.
     */
    const discard = useCallback(async (slug, kind, discardSessionId) => {
        try {
            await api.delete(`/channels/${slug}/content/${kind}/upload-url/${discardSessionId}`);
        } catch {
            /* already swept, cancelled, or published — nothing left to release */
        }
    }, []);

    return { upload, cancel, discard, progress, uploading, error, sessionId };
};

/** A remembered session that no longer exists is an ordinary restart, not an error to report. */
const resumeProgress = async (slug, kind, resumeSessionId) => {
    try {
        return await api.get(
            `/channels/${slug}/content/${kind}/upload-url/${resumeSessionId}/parts`
        );
    } catch (e) {
        const status = e.response?.status;
        if (status === 404 || status === 400) {
            throw new ResumeUnavailableError('This upload can no longer be resumed');
        }
        throw e;
    }
};

/**
 * The session's part arithmetic has to describe *this* file. It is checked rather than assumed
 * because the byte range each part covers is computed from the file's own size — filling the
 * gaps of one upload from a different file would assemble an object that is corrupt rather than
 * merely wrong, and no later step would notice.
 */
const requireSessionFits = (file, session) => {
    const expectedParts = Math.max(1, Math.ceil(file.size / session.partSizeBytes));
    if (expectedParts !== session.totalParts) {
        throw new ResumeUnavailableError('This upload was started for a different file');
    }
};

const uploadWindow = async (file, parts, session, controller, setProgress, alreadyDone) => {
    let done = alreadyDone;
    await uploadParts(file, parts ?? [], session.partSizeBytes, {
        signal: controller.signal,
        onPartDone: (bytes) => {
            done += bytes;
            // Capped below 100 until the session is confirmed — the upload isn't finished until
            // the create call assembles the object.
            setProgress(Math.min(99, Math.round((done / file.size) * 100)));
        },
    });
    return done;
};
