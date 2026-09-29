import { RotateCcw } from 'lucide-react';
import { Input, Button, RejectedFields } from '@/components/ui';
import { describeError } from '@/lib/describeError';
import { LOCALES } from '@/i18n/locales';
import { t } from '@/i18n';

/**
 * A letter an admin edits as WORDS, beside the mail the backend would send.
 *
 * <p>Shared by the channel invitation and admin outreach, which are the same editor over two
 * letters. The admin never touches HTML: the letter is plain text with a handful of line marks
 * (`marksHint` says which), and the backend owns every tag — its `InvitationLetter` escapes what is
 * typed and pours it into the invitation's frame.
 *
 * <p><b>The preview is the backend's render, never a second renderer here</b>, so what the admin
 * sees is what the recipient gets. It sits in a sandboxed iframe with no permissions: the mail has
 * no script and needs none, and a preview must not be able to navigate the admin's tab.
 *
 * <p>`children` renders between the subject and the letter — the outreach page puts the button's
 * words and destination there, which the invitation does not have.
 */
export default function LetterEditor({
    subject,
    onSubjectChange,
    letter,
    onLetterChange,
    locale,
    placeholders = [],
    loading = false,
    loadError = null,
    preview,
    onReset,
    canReset = false,
    error = null,
    children,
}) {
    const dir = LOCALES[locale]?.dir ?? 'rtl';
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-3 min-w-0">
                {loading && <p className="text-text-muted text-sm">{t('common.loading')}</p>}
                {loadError && (
                    <p className="text-red-600 text-sm">{describeError(loadError, t('admin.invite.draftFailed'))}</p>
                )}
                <RejectedFields error={error}>
                    <Input
                        label={t('admin.invite.subjectLabel')}
                        value={subject}
                        onChange={(e) => onSubjectChange(e.target.value)}
                        dir={dir}
                        maxLength={200}
                        field="subject"
                    />
                    {children}
                    <Input
                        label={t('admin.invite.letterLabel')}
                        value={letter}
                        onChange={(e) => onLetterChange(e.target.value)}
                        dir={dir}
                        textarea
                        rows={18}
                        maxLength={20000}
                        className="font-mono text-sm"
                        field="letter"
                    />
                </RejectedFields>
                <p className="text-text-muted text-xs">{t('admin.invite.marksHint')}</p>
                <p className="text-text-muted text-xs" dir="ltr">
                    {placeholders.map((name) => `{{${name}}}`).join('  ')}
                </p>
                {onReset && (
                    <div>
                        <Button variant="ghost" onClick={onReset} disabled={!canReset} icon={<RotateCcw size={14} />}>
                            {t('admin.invite.reset')}
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-2 min-w-0">
                <p className="text-sm font-semibold">{t('admin.invite.preview')}</p>
                {preview?.data && (
                    <p className="text-sm text-text-secondary" dir={dir}>{preview.data.subject}</p>
                )}
                {preview?.isError ? (
                    <p className="text-red-600 text-sm">
                        {describeError(preview.error, t('admin.invite.previewFailed'))}
                    </p>
                ) : (
                    <iframe
                        title={t('admin.invite.preview')}
                        sandbox=""
                        srcDoc={preview?.data?.html ?? ''}
                        className="w-full h-[560px] rounded-lg border border-border-light bg-white"
                    />
                )}
            </div>
        </div>
    );
}
