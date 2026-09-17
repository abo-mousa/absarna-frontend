import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { usePresignedUpload, ResumeUnavailableError } from '@/hooks/usePresignedUpload';
import { rememberSession, forgetSession, resumableSessionId, rememberedSession }
    from '@/lib/uploadResume';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * One kind of presigned, resumable upload for a channel — the file input's whole story.
 *
 * <p>Bytes go from the browser straight to object storage and never through the backend, which
 * only signs part URLs. Nothing exists as content until the publish call sends the resulting
 * session id to the create endpoint, so an abandoned upload leaves no row behind — the "upload"
 * step returns a session id, not a URL.
 *
 * <p><b>Leaving the page stops the transfer; it does NOT give up the session.</b> Three parallel
 * PUTs would otherwise keep saturating the connection for an upload whose session id has nowhere
 * left to go — the form that would carry it to the create call is unmounted with the page. A hard
 * refresh already behaves this way, so this only makes SPA navigation consistent with it.
 * Deliberately not `discard()`: aborting the multipart session would throw away every byte already
 * transferred and turn the remembered session id into a dead one, destroying precisely the upload
 * that resume exists to pick back up. The quota this would protect is bounded on the backend (24h
 * for counting, a 7-day sweep), and the sessions worth releasing early — declined resumes and
 * replaced files — are released where the user actually says so.
 *
 * @param slug the channel
 * @param kind `videos` | `books`, i.e. the API path segment and the resume key
 */
export function useChannelUpload(slug, kind) {
    const { showToast } = useToast();
    const upload = usePresignedUpload();
    const [uploading, setUploading] = useState(false);
    // The picked file's name, for the picker to show. Kept here rather than read off the input,
    // because selectFile clears the input on every path (see its finally) — the input alone would
    // say nothing is picked under an upload that finished.
    const [fileName, setFileName] = useState(null);

    const { cancel } = upload;
    useEffect(() => () => cancel(), [cancel]);

    /**
     * Uploads fresh, remembering the session the moment the backend mints it — before any bytes go
     * out — so an upload interrupted at 3% is as resumable as one interrupted at 97%.
     *
     * <p>The session is kept after success rather than cleared: the confirm call is what finishes
     * the upload and it is idempotent on the session, so a failed publish should still find a
     * resumable session behind it.
     */
    const uploadFresh = useCallback((file) => upload.upload(file, {
        kind,
        slug,
        onSessionStart: (id) => rememberSession(slug, kind, file, id),
    }), [upload, kind, slug]);

    /**
     * Resumes the channel's remembered session when the same file is picked again, and uploads
     * fresh otherwise.
     *
     * <p>Declining the offer releases the old session rather than abandoning it: the per-channel
     * quota counts open sessions, and a user who restarts three uploads by hand should not find
     * themselves locked out behind an error telling them to cancel something.
     */
    const uploadResuming = useCallback(async (file) => {
        const resumeId = resumableSessionId(slug, kind, file);
        const remembered = rememberedSession(slug, kind);

        if (resumeId && !window.confirm(t('channelManage.resumePrompt', { name: file.name }))) {
            forgetSession(slug, kind);
            await upload.discard(slug, kind, resumeId);
            return uploadFresh(file);
        }
        if (!resumeId && remembered) {
            // A different file: the old session will never be finished, so free its slot now
            // instead of leaving it to the 24h age bound.
            forgetSession(slug, kind);
            await upload.discard(slug, kind, remembered.sessionId);
        }
        if (!resumeId) return uploadFresh(file);

        try {
            const uploadSessionId = await upload.upload(file, { kind, slug, resumeSessionId: resumeId });
            // Still remembered: the upload is finished but the session is not spent until the
            // create call confirms it, and that call can fail. Re-stamped so a resume that ran days
            // after the original start isn't measured from the original start.
            rememberSession(slug, kind, file, uploadSessionId);
            return uploadSessionId;
        } catch (err) {
            if (!(err instanceof ResumeUnavailableError)) throw err;
            // Swept, cancelled, already published, or no longer describing this file. Nothing to
            // report: from here it is simply an ordinary upload.
            forgetSession(slug, kind);
            return uploadFresh(file);
        }
    }, [upload, uploadFresh, kind, slug]);

    /**
     * The `change` handler for the file input.
     *
     * <p>An `AbortError` is not reported: it means the page was left, the session survives it, and
     * by then there is nothing mounted to show a toast to.
     *
     * @param onUploaded     given the session id and the file's name without its extension
     * @param failureMessage turns a reason into the toast copy for this content type
     */
    const selectFile = useCallback(async (e, { onUploaded, failureMessage }) => {
        // Captured now: this function awaits, and the element is what has to be cleared at the end
        // regardless of which branch got there.
        const input = e.target;
        const file = input.files[0];
        if (!file) return;

        setUploading(true);
        setFileName(file.name);
        try {
            const uploadSessionId = await uploadResuming(file);
            onUploaded(uploadSessionId, file.name.replace(/\.[^/.]+$/, ''));
        } catch (err) {
            if (err.name !== 'AbortError') {
                // Nothing usable was picked: showing the name would read as "this one is attached".
                setFileName(null);
                // `describeError`, not the raw body: `err` here is either a refusal from our
                // own upload endpoints (which name a `reason`) or an `Error` thrown by
                // `usePresignedUpload`, and both used to reach the toast in English.
                showToast(failureMessage(describeError(err)), 'error');
            }
        } finally {
            setUploading(false);
            // Cleared on every path, and the failure path is why. An <input type="file"> fires
            // `change` only when the selection differs from what it already holds, so after a
            // failed upload picking THE SAME FILE again did nothing at all — the retry the toast
            // invites was impossible without first selecting some other file. Clearing also means
            // the input never holds a stale selection while the session id lives in form state.
            input.value = '';
        }
    }, [uploadResuming, showToast]);

    /**
     * Call after a successful publish: the session is spent, so stop offering to resume it — and
     * the form is empty again, so the picker is too.
     */
    const forget = useCallback(() => {
        forgetSession(slug, kind);
        setFileName(null);
    }, [slug, kind]);

    return { selectFile, uploading, progress: upload.progress, forget, fileName };
}
