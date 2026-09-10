import { useId } from 'react';
import { Button } from '@/components/ui';

/**
 * The shell every publish form on the channel dashboard shares: the card, its heading, the
 * optional file picker with its progress bar, and the submit button.
 *
 * <p>The four forms it replaced were near-identical scaffolding wrapped around four different
 * field lists, and the scaffolding is the part that drifted — the book tab showed
 * "جاري الرفع..." where the video tab showed a progress bar, from the same hook reporting the
 * same number.
 *
 * <p><b>The fields themselves stay at the call site, as children.</b> They are genuinely
 * different per type — a series picker for a video, a page count for a book, a fifteen-row body
 * for an article — and turning them into a schema prop would trade four readable forms for one
 * form-builder DSL that is harder to read than any of them. What is shared is hoisted; what
 * differs is written out.
 *
 * @param heading      the form's own title
 * @param file         optional `{ label, hint, accept, onChange, uploading, progress }` for the
 *                     types backed by a presigned upload. `hint` is shown before a file is
 *                     picked, because picking one starts the upload — see below.
 * @param submitLabel  the button's text
 * @param submitIcon   optional icon element for the button
 */
function ContentPublishForm({ heading, onSubmit, file, submitLabel, submitIcon, children }) {
    const hintId = useId();

    return (
        <form onSubmit={onSubmit} className="grid gap-4 bg-surface p-6 rounded-lg border border-border-light">
            <h3 className="text-lg font-bold">{heading}</h3>

            {file && (
                <div>
                    <FieldLabel>{file.label}</FieldLabel>
                    {/* Picking a file starts the upload immediately — the form is filled in while
                        the bytes travel, and publish only confirms. Said up front, above the
                        picker, because a user who expects nothing to happen until they press
                        publish will otherwise pick a file "to see" and spend bandwidth and one
                        of the channel's five upload slots on it. */}
                    {file.hint && (
                        <p id={hintId} className="text-sm text-text-muted mb-2">{file.hint}</p>
                    )}
                    {/* The backend's own allowlist, never `video/*` — offering .webm or .avi in
                        the picker only moved the rejection to a server error after the user had
                        already committed to the file. */}
                    <input
                        type="file"
                        accept={file.accept}
                        onChange={file.onChange}
                        disabled={file.uploading}
                        aria-describedby={file.hint ? hintId : undefined}
                    />
                    {file.uploading && (
                        <div className="mt-2">
                            <div className="w-full h-2 bg-border rounded-full">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${file.progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-text-muted mt-1">{file.progress}%</p>
                        </div>
                    )}
                </div>
            )}

            {children}

            <Button type="submit" icon={submitIcon}>{submitLabel}</Button>
        </form>
    );
}

/**
 * The label markup that sits above a bare `<select>`/`<input type="color">`/file input — the
 * places `Input` cannot be used because the control is not a text field. Exported because the
 * dashboard's series picker and colour picker both need it.
 */
export function FieldLabel({ children }) {
    return <label className="block mb-1.5 font-semibold text-sm text-text-secondary">{children}</label>;
}

export default ContentPublishForm;
