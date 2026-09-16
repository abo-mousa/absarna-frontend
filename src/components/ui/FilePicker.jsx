import { Paperclip, Check } from 'lucide-react';
import { t } from '@/i18n';

/**
 * A file input that looks like the rest of the app and speaks Arabic.
 *
 * <p><b>The browser's own control cannot do either.</b> `<input type="file">` draws its button and
 * its "nothing picked" text itself, in the browser's language rather than the page's — Firefox
 * printed «Browse… No file selected.» in English on an RTL Arabic form — and none of it can be
 * styled. So the input is kept for what only it can do (open the system picker, honour `accept`)
 * and visually hidden, and this draws the rest.
 *
 * <p><b>`sr-only`, not `hidden`.</b> A `display: none` input is unreachable by keyboard; this one
 * still takes Tab focus and Space/Enter open the picker, and `focus-within` puts the ring on the
 * button it is inside.
 *
 * <p><b>The name shown comes from the caller, not from the input.</b> The upload hook clears the
 * input after every attempt (so the same file can be picked again after a failure), which means
 * the input itself reports nothing picked even after a successful upload — exactly what the
 * browser's text used to say, wrongly, under a finished upload.
 *
 * @param fileName    what to show as picked, or null
 * @param done        true once that file has finished uploading
 * @param describedBy id of the hint the input should announce
 */
function FilePicker({ accept, onChange, disabled, fileName, done, describedBy }) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <label
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-semibold
                    text-text-secondary transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-hover'}`}
            >
                <Paperclip size={16} />
                {fileName ? t('common.changeFile') : t('common.chooseFile')}
                <input
                    type="file"
                    accept={accept}
                    onChange={onChange}
                    disabled={disabled}
                    aria-describedby={describedBy}
                    className="sr-only"
                />
            </label>

            {fileName ? (
                // dir="auto": a file name is usually Latin script, and in an RTL paragraph its
                // extension would otherwise land on the wrong end ("mp4.lecture").
                <span className="flex items-center gap-1.5 text-sm text-text-secondary min-w-0">
                    {done && <Check size={16} className="text-primary flex-shrink-0" />}
                    <span dir="auto" className="truncate max-w-[18rem]">{fileName}</span>
                </span>
            ) : (
                <span className="text-sm text-text-muted">{t('common.noFileChosen')}</span>
            )}
        </div>
    );
}

export default FilePicker;
