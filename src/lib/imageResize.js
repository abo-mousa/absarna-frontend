/**
 * Shrinking a picture in the browser before it is uploaded.
 *
 * <p><b>Why here and not on the server.</b> Nothing on the backend resizes images — an owner's
 * picture is stored byte for byte — and the ceiling is 5 MB. A phone photo chosen as a channel
 * logo is drawn at 24px in the sidebar and 20px on every video card, and every visitor would
 * download all of it to draw that. Shrinking before the upload fixes the stored file once, makes
 * the upload itself faster on the same phone, and costs the server nothing.
 *
 * <p><b>The limits are per picture, and the cover's is generous on purpose</b>: it is shown across
 * the full width of the channel page, so it keeps 2560px — YouTube's own recommended cover width
 * — and stays sharp on a large monitor. A logo or profile picture is never shown larger than 64px,
 * so 512px is still sharp on a high-density screen with room to spare.
 *
 * <p>Never enlarges, keeps the format (a PNG logo keeps its transparency), and never blocks an
 * upload: if anything here fails in some browser, the original file goes up instead.
 */

export const IMAGE_LIMITS = {
    logo: { maxWidth: 512, maxHeight: 512 },
    avatar: { maxWidth: 512, maxHeight: 512 },
    banner: { maxWidth: 2560, maxHeight: 1440 },
};

/** High enough that a re-encode is not visible; JPEG and WebP only — PNG is lossless. */
const QUALITY = 0.9;

/**
 * The size to draw at: the largest that fits inside the limits with the aspect ratio kept, or
 * null when the picture already fits (nothing to do — upload it as it is).
 */
export function targetSize(width, height, { maxWidth, maxHeight }) {
    if (!(width > 0) || !(height > 0)) return null;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    if (scale >= 1) return null;
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

/**
 * A copy of `file` shrunk to fit `limits`, as a File with the same name and type — or `file`
 * itself when it already fits, or when anything goes wrong.
 */
export async function shrinkImage(file, limits) {
    if (!limits || typeof createImageBitmap !== 'function') return file;
    const type = file.type;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return file;

    let bitmap;
    try {
        // Applies the photo's EXIF orientation, so a portrait phone photo is not uploaded sideways.
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const size = targetSize(bitmap.width, bitmap.height, limits);
        if (!size) return file;

        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext('2d');
        context.imageSmoothingQuality = 'high';
        context.drawImage(bitmap, 0, 0, size.width, size.height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
        // A browser that cannot encode this type returns null or a PNG; either way keep the
        // original rather than upload bytes that disagree with the file's own extension.
        if (!blob || blob.type !== type || blob.size >= file.size) return file;
        return new File([blob], file.name, { type, lastModified: file.lastModified });
    } catch {
        return file;
    } finally {
        bitmap?.close?.();
    }
}
