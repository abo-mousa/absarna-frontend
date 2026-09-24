import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { THUMBNAIL_EXTENSIONS, UnsupportedThumbnailError, ThumbnailTooLargeError } from './useVideoThumbnail';
import { IMAGE_LIMITS, shrinkImage } from '@/lib/imageResize';
import { t } from '@/i18n';

/**
 * A picture a person puts on their own channel or account — a channel's logo or cover, or their
 * profile picture.
 *
 * Backend contract (the same three steps as a video poster, see `useVideoThumbnail`):
 *   POST   {base}/upload-url → { uploadUrl, objectKey, contentType, maxBytes }
 *   PUT    <uploadUrl>       → the bytes, direct to storage, with exactly that Content-Type
 *   PUT    {base}            → { objectKey }
 *   DELETE {base}            → no picture at all
 * where {base} is `/channels/{slug}/images/logo|banner` or `/user/profile-picture`.
 *
 * The same two rules as the poster: the storage PUT goes through `fetch` so it does not carry our
 * bearer token, and its Content-Type is the one the URL was signed with, never the File's own.
 * Same allowlist and ceiling too — the backend uses one list for every picture.
 */
/**
 * The upload itself, outside React: shrink, mint, PUT, confirm. Throws on any refusal. Exported
 * for the create-channel form, which uploads its pictures the moment the channel exists — there is
 * no slug to upload under before that, so it cannot use a hook bound to one.
 *
 * @param base  `/channels/{slug}/images/{logo|banner}` or `/user/profile-picture`
 */
export async function uploadOwnerImage(base, picked, limits) {
    const extension = (picked.name.split('.').pop() || '').toLowerCase();
    if (!THUMBNAIL_EXTENSIONS.includes(extension)) {
        throw new UnsupportedThumbnailError(t('ownerImage.unsupported'));
    }
    // Before the size check, so a large photo that shrinks under the ceiling is accepted rather
    // than refused for a size it will not have. See lib/imageResize.
    const file = await shrinkImage(picked, limits);
    const { data: minted } = await api.post(`${base}/upload-url`, { filename: file.name });
    if (file.size > minted.maxBytes) {
        throw new ThumbnailTooLargeError(t('ownerImage.tooLarge'));
    }
    const stored = await fetch(minted.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': minted.contentType },
        body: file,
    });
    if (!stored.ok) {
        throw new Error(`storage refused the upload (${stored.status})`);
    }
    await api.put(base, { objectKey: minted.objectKey });
}

/** The channel-image base path for a kind — what `uploadOwnerImage` takes. */
export const channelImagePath = (slug, kind) => `/channels/${slug}/images/${kind}`;

function useOwnerImage(base, onChanged, limits) {
    const [uploading, setUploading] = useState(false);

    const upload = useMutation({
        mutationFn: async (picked) => {
            setUploading(true);
            try {
                await uploadOwnerImage(base, picked, limits);
            } finally {
                setUploading(false);
            }
        },
        onSuccess: onChanged,
    });

    const remove = useMutation({
        mutationFn: () => api.delete(base),
        onSuccess: onChanged,
    });

    return {
        upload: (file) => upload.mutateAsync(file),
        remove: () => remove.mutateAsync(),
        uploading,
        removing: remove.isPending,
    };
}

/**
 * Every cached response that shows a channel's logo or cover: the channel itself and every list
 * whose cards name it (`VideoDTO.channelLogoUrl`). The same set `useUpdateChannel` invalidates on
 * a rename, for the same reason — the picture is a field inside those lists now.
 */
function invalidateChannelPictures(queryClient) {
    ['channel', 'channels', 'my-channels', 'videos', 'video', 'feed', 'channel-videos',
        'channel-manage', 'search', 'search-infinite', 'bookmarks', 'watch-history',
        'related-video', 'series'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }));
}

/** @param kind 'logo' or 'banner' */
export function useChannelImage(slug, kind) {
    const queryClient = useQueryClient();
    return useOwnerImage(channelImagePath(slug, kind), () => invalidateChannelPictures(queryClient),
        IMAGE_LIMITS[kind]);
}

/** The signed-in account's own picture; the account menu's avatar re-reads it from the profile. */
export function useProfilePicture() {
    const { refreshUser } = useAuth();
    return useOwnerImage('/user/profile-picture', () => refreshUser?.(), IMAGE_LIMITS.avatar);
}

/**
 * "Use my YouTube logo and cover" — the verified owner asking for both to be copied into our
 * storage, which also confirms them. Answers `{ logo, banner }`, each COPIED / NONE_ON_YOUTUBE /
 * FAILED.
 */
export function useCopyYouTubeImages(slug) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => (await api.post(`/channels/${slug}/youtube/images`)).data,
        onSuccess: () => {
            invalidateChannelPictures(queryClient);
            queryClient.invalidateQueries({ queryKey: ['channel-youtube', slug] });
        },
    });
}

/**
 * The verified owner confirming that the pictures copied from YouTube are theirs. Until they do,
 * the backend refreshes those copies from YouTube every month, as it does unconfirmed titles; after,
 * they are the owner's and nothing touches them. The pending list is the YouTube status response's
 * `imagesAwaitingConfirmation`.
 */
export function useConfirmYouTubeImages(slug) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => (await api.post(`/channels/${slug}/youtube/images/confirm`)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel-youtube', slug] }),
    });
}
