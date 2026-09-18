import { useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useVideoThumbnail, thumbnailAccept } from '@/hooks/useVideoThumbnail';
import { resolveMediaUrl } from '@/lib/media';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * The poster an owner chose for one video, with the picture they will actually get if they
 * choose nothing.
 *
 * <p><b>It always shows a preview, and that is the feature.</b> The frame the worker cuts is
 * taken at a fixed offset, which on a lecture is routinely a title card, a black frame, or the
 * speaker mid-blink — and an owner has no way to know which until they see it. So the current
 * poster is rendered here whether it is theirs or the default, and «استبدال» beside it is the
 * whole interaction.
 *
 * <p><b>Remove is only offered when there is something to remove.</b> A video showing the
 * worker's frame has no custom poster, and a button that reverts to what is already on screen
 * would be a control with no effect — which is worse than no control.
 *
 * <p>The preview is the DTO's own `thumbnailUrl`, re-read after each change rather than an
 * object URL of the picked File: the point of the confirmation is that the owner sees what a
 * *visitor* will see, which is the stored object, not the bytes in their browser.
 */
function VideoThumbnailPicker({ slug, video }) {
    const { showToast } = useToast();
    const { uploadThumbnail, removeThumbnail, uploading, removing } = useVideoThumbnail(slug);
    // Held so the preview updates the moment the list behind the dialog refetches, without this
    // component needing its own query for one field.
    const [justChanged, setJustChanged] = useState(null);

    const busy = uploading || removing;
    const hasCustom = justChanged ?? video.hasCustomThumbnail;
    const previewUrl = resolveMediaUrl(video.thumbnailUrl);

    const handlePick = async (e) => {
        const file = e.target.files?.[0];
        // Cleared before the await, so picking the same file again after a failure still fires a
        // change event — the input reports no change when the value is identical.
        e.target.value = '';
        if (!file) return;

        try {
            await uploadThumbnail(video.id, file);
            setJustChanged(true);
            showToast(t('channelManage.thumbnail.saved'), 'success');
        } catch (err) {
            showToast(t('channelManage.thumbnail.failed', { reason: describeError(err) }), 'error');
        }
    };

    const handleRemove = async () => {
        try {
            await removeThumbnail(video.id);
            setJustChanged(false);
            showToast(t('channelManage.thumbnail.removed'), 'success');
        } catch (err) {
            showToast(t('channelManage.thumbnail.failed', { reason: describeError(err) }), 'error');
        }
    };

    return (
        <div className="grid gap-2">
            <span className="font-semibold text-sm text-text-secondary">
                {t('channelManage.thumbnail.label')}
            </span>

            <div className="flex items-start gap-3 flex-wrap">
                <div className="w-40 aspect-video rounded-md overflow-hidden bg-surface-hover border border-border-light flex items-center justify-center shrink-0">
                    {previewUrl ? (
                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon size={22} className="text-text-muted" aria-hidden="true" />
                    )}
                </div>

                <div className="grid gap-2 min-w-[180px] flex-1">
                    <p className="text-xs text-text-muted leading-relaxed m-0">
                        {hasCustom
                            ? t('channelManage.thumbnail.usingCustom')
                            : t('channelManage.thumbnail.usingDefault')}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                        <label
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm
                                font-semibold text-text-secondary transition-colors
                                focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1
                                ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-hover'}`}
                        >
                            <Upload size={16} aria-hidden="true" />
                            {uploading
                                ? t('channelManage.thumbnail.uploading')
                                : hasCustom
                                    ? t('channelManage.thumbnail.replace')
                                    : t('channelManage.thumbnail.choose')}
                            {/* sr-only rather than hidden: a display:none input takes no keyboard
                                focus, so the control would be mouse-only. Same reason as FilePicker. */}
                            <input
                                type="file"
                                accept={thumbnailAccept}
                                disabled={busy}
                                onChange={handlePick}
                                className="sr-only"
                            />
                        </label>

                        {hasCustom && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={busy}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border
                                    text-sm font-semibold text-text-secondary transition-colors
                                    hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={16} aria-hidden="true" />
                                {t('channelManage.thumbnail.remove')}
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-text-muted m-0">{t('channelManage.thumbnail.hint')}</p>
                </div>
            </div>
        </div>
    );
}

export default VideoThumbnailPicker;
