import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { t } from '@/i18n';
import { UserFacingError } from '@/lib/describeError';

/**
 * Uploading the poster an owner picked for one of their videos.
 *
 * Backend contract (three endpoints, videos only):
 *   POST   /channels/{slug}/content/videos/{id}/thumbnail/upload-url → { uploadUrl, objectKey, contentType, maxBytes }
 *   PUT    <uploadUrl>                                              → the bytes, direct to storage
 *   PUT    /channels/{slug}/content/videos/{id}/thumbnail           → { objectKey }
 *   DELETE /channels/{slug}/content/videos/{id}/thumbnail           → back to the default poster
 *
 * Same shape as `usePresignedUpload`, deliberately smaller: a poster is one PUT of a few hundred
 * kilobytes, so there is no session, no part window and nothing to resume. If the PUT fails the
 * owner picks the file again, which costs them a click and us nothing — a resumable flow for a
 * file that uploads in under a second would be machinery with no case behind it.
 *
 * <p><b>The presigned PUT must NOT carry our Authorization header.</b> `api` is the axios client
 * with an interceptor that attaches the bearer token to every request; sending it to object
 * storage would make the request carry two competing credentials and be rejected. `fetch` is used
 * for that one call for exactly that reason — the same split `usePresignedUpload` makes.
 *
 * <p><b>`Content-Type` is copied from the mint response, never inferred from the File.</b> It is
 * part of what the URL was signed with, so a browser that reports a different type for the same
 * file (which they do, notably for webp) would produce a signature mismatch rather than an
 * upload.
 */

/** Mirrors the backend's `ThumbnailImageType` allowlist, so the file dialog offers only these. */
export const THUMBNAIL_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

export const thumbnailAccept = THUMBNAIL_EXTENSIONS.map((e) => `.${e}`).join(',');

/** A file the backend would refuse, caught before an upload URL is spent on it. */
export class UnsupportedThumbnailError extends UserFacingError {}

/** A file over the ceiling, caught before it is uploaded rather than after. */
export class ThumbnailTooLargeError extends UserFacingError {}

export function useVideoThumbnail(slug) {
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    // Both the owner's own dashboard list and the public channel/feed lists show this picture, so
    // every cached list has to be re-read — the URL changed, and under public delivery it is the
    // key itself that changed, so nothing revalidates on its own.
    const invalidateEverythingShowingAPoster = () => {
        queryClient.invalidateQueries({ queryKey: ['channel-manage'] });
        queryClient.invalidateQueries({ queryKey: ['channel-videos'] });
        queryClient.invalidateQueries({ queryKey: ['videos'] });
        queryClient.invalidateQueries({ queryKey: ['video'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
    };

    const upload = useMutation({
        mutationFn: async ({ videoId, file }) => {
            const extension = (file.name.split('.').pop() || '').toLowerCase();
            if (!THUMBNAIL_EXTENSIONS.includes(extension)) {
                throw new UnsupportedThumbnailError(t('channelManage.thumbnail.unsupported'));
            }

            setUploading(true);
            try {
                const { data: minted } = await api.post(
                    `/channels/${slug}/content/videos/${videoId}/thumbnail/upload-url`,
                    { filename: file.name },
                );

                if (file.size > minted.maxBytes) {
                    throw new ThumbnailTooLargeError(t('channelManage.thumbnail.tooLarge'));
                }

                // A refusal by storage (a missing CORS rule on the media bucket, most likely) is not
                // the reader's network — a bare fetch TypeError would be worded as "offline".
                let stored;
                try {
                    stored = await fetch(minted.uploadUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': minted.contentType },
                        body: file,
                    });
                } catch {
                    throw new UserFacingError(t('ownerImage.storageFailed'));
                }
                if (!stored.ok) {
                    throw new UserFacingError(t('ownerImage.storageFailed'));
                }

                await api.put(`/channels/${slug}/content/videos/${videoId}/thumbnail`, {
                    objectKey: minted.objectKey,
                });
            } finally {
                setUploading(false);
            }
        },
        onSuccess: invalidateEverythingShowingAPoster,
    });

    const remove = useMutation({
        mutationFn: async (videoId) =>
            api.delete(`/channels/${slug}/content/videos/${videoId}/thumbnail`),
        onSuccess: invalidateEverythingShowingAPoster,
    });

    return {
        uploadThumbnail: (videoId, file) => upload.mutateAsync({ videoId, file }),
        removeThumbnail: (videoId) => remove.mutateAsync(videoId),
        uploading,
        removing: remove.isPending,
    };
}
