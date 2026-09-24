import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { thumbnailAccept } from '@/hooks/useVideoThumbnail';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

/**
 * One picture a person sets on their channel or account: a preview of what visitors see, a
 * choose/replace button, and remove when there is an upload to remove.
 *
 * The same three decisions as `VideoThumbnailPicker`, which this generalises:
 * - **The preview is the stored picture, not the picked file.** It is re-read from the server
 *   after each change, so what the person confirms is what a visitor will get.
 * - **Remove appears only when there is something of theirs to remove** (`hasUpload`).
 * - **The file input is `sr-only`, not hidden**, so the control is reachable from a keyboard.
 *
 * @param shape `round` for a logo or profile picture, `wide` for a cover
 * @param onPick called with the chosen File; the caller uploads it and reports the outcome
 */
function ImageUploadField({ label, hint, previewUrl, shape = 'round', hasUpload, uploading, removing, onPick, onRemove }) {
    const busy = uploading || removing;
    // A `blob:` preview is a file picked but not uploaded yet (the create form holds its pictures
    // until the channel exists); resolveMediaUrl would drop it as "not a URL we serve".
    const src = previewUrl?.startsWith('blob:') ? previewUrl : resolveMediaUrl(previewUrl);

    const handleChange = (e) => {
        const file = e.target.files?.[0];
        // Cleared first, so choosing the same file again after a failure still fires a change.
        e.target.value = '';
        if (file) onPick(file);
    };

    const frame = shape === 'wide'
        ? 'w-full max-w-[360px] aspect-[16/5] rounded-md'
        : 'w-20 h-20 rounded-full';

    return (
        <div className="grid gap-2">
            <span className="font-semibold text-sm text-text-secondary">{label}</span>
            <div className={`flex gap-3 flex-wrap ${shape === 'wide' ? 'flex-col' : 'items-center'}`}>
                <div className={`${frame} overflow-hidden bg-surface-hover border border-border-light flex items-center justify-center shrink-0`}>
                    {src
                        ? <img src={src} alt="" className="w-full h-full object-cover" />
                        : <ImageIcon size={22} className="text-text-muted" aria-hidden="true" />}
                </div>

                <div className="grid gap-2 min-w-[180px] flex-1">
                    {hint && <p className="text-xs text-text-muted leading-relaxed m-0">{hint}</p>}
                    <div className="flex gap-2 flex-wrap">
                        <label
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm
                                font-semibold text-text-secondary transition-colors
                                focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1
                                ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-hover'}`}
                        >
                            <Upload size={16} aria-hidden="true" />
                            {uploading
                                ? t('ownerImage.uploading')
                                : src ? t('ownerImage.replace') : t('ownerImage.choose')}
                            <input
                                type="file"
                                accept={thumbnailAccept}
                                disabled={busy}
                                onChange={handleChange}
                                className="sr-only"
                            />
                        </label>
                        {hasUpload && (
                            <button
                                type="button"
                                onClick={onRemove}
                                disabled={busy}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border
                                    text-sm font-semibold text-text-secondary transition-colors
                                    hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={16} aria-hidden="true" />
                                {removing ? t('ownerImage.removing') : t('ownerImage.remove')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageUploadField;
