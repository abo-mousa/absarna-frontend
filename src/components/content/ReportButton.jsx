import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Modal } from '../ui';
import { useReportStatus, useSubmitReport } from '../../hooks/useReports';
import { NOTE_MAX_LENGTH, REPORT_REASONS, reasonHint, reasonLabel } from '@/lib/reports';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * "Report this" — on a video, a book, an article, a post and every comment.
 *
 * <p>Built the same way as {@link BookmarkButton} and {@link LikeButton}: one component for every
 * place it appears, taking the app's ordinary `type` word, and DISABLED rather than hidden for a
 * reader with no account. Hiding it would be the worse failure here — a reader who cannot see a
 * way to object concludes the platform does not take objections — so the flag stays on screen,
 * greyed, with «سجّل الدخول للقيام بهذا» on it: the way to object is visible, and so is what it
 * costs.
 *
 * <h4>Why it needs a dialog at all, when a like does not</h4>
 *
 * <p><b>Because an unqualified report is almost useless to a moderator.</b> A press with no reason
 * says only that someone objected to something, which is what the queue already knows from the
 * row existing. The reason code is what routes it — SEXUAL_CONTENT on a video is a detector miss
 * worth checking against the review queue, MISATTRIBUTION is a scholarship question no detector
 * will ever have an opinion about — and the note is what carries the half a code cannot.
 *
 * <p><b>No reason is pre-selected.</b> A default would be filed by everyone who pressed submit
 * without reading, and the code the list happened to start with would slowly become the most
 * reported thing on the platform — which is a corrupted count, not a signal.
 *
 * <h4>Once reported, it stops asking</h4>
 *
 * <p>The control renders as done rather than inviting a press that changes nothing visible. The
 * press IS safe — the backend updates the row it already holds rather than filing a second one,
 * and reopens it if a moderator had decided it — but a button that looks live and produces no
 * visible change is how people conclude a feature is broken. The state comes from the caller's
 * own status query and is about nobody else's report: the backend exposes no way to learn whether
 * anyone else reported an item, deliberately.
 *
 * <h4>`trackStatus`, and why it is off in a list</h4>
 *
 * <p>The already-reported state costs one request per control, which is right on a detail page —
 * there is exactly one — and wrong in a list: a comment thread with thirty replies would fire
 * thirty status requests on mount to grey out controls almost none of which have been pressed.
 * That is the same reason `VideoCard` shows a like COUNT and not a like STATE. So a list passes
 * `trackStatus={false}` and the control simply stays pressable — which is safe, because the
 * backend updates the report it already holds rather than filing a second one. What it loses is
 * only the state on a RELOAD; within the session a press still leaves the control showing done.
 *
 * @param type        the app's usual `video` | `book` | `article` | `post` | `comment` word
 * @param labeled     render the word beside the flag; a comment's row is too tight for it
 * @param trackStatus ask the server whether this viewer already reported this item. Leave it on
 *                    where the control appears once on a page; turn it off in a list.
 */
function ReportButton({ type, id, className = '', size = 16, labeled = false, trackStatus = true }) {
    const { token } = useAuth();
    const { showToast } = useToast();
    const { data: alreadyReported = false } = useReportStatus(type, id, trackStatus && !!token);
    const submitReport = useSubmitReport(type, id);

    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    // Local, and kept even where the status query runs: it is what makes the control settle
    // immediately on the press rather than after a refetch, and it is the whole of the state
    // where the query is off.
    const [justReported, setJustReported] = useState(false);

    const reported = alreadyReported || justReported;

    const needsLogin = !token;

    const handleOpen = () => {
        setReason('');
        setNote('');
        setOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason) return;
        submitReport.mutate({ reason, note }, {
            onSuccess: () => {
                setOpen(false);
                setJustReported(true);
                showToast(t('report.success'), 'success');
            },
            // describeError, not a fixed sentence: the two failures a reader will actually meet
            // here are the 429 (twenty reports an hour, and the backend's own Arabic body says so)
            // and the 404 a gated item answers with, which are completely different situations.
            onError: (err) => showToast(describeError(err, t('report.failed')), 'error'),
        });
    };

    const label = reported ? t('report.reported') : t('report.action');
    // A disabled control still matches `:hover`, so the red it turns on the way to being pressed
    // has to go when pressing it stops being possible.
    const tone = reported || needsLogin ? 'text-text-muted' : 'text-text-secondary hover:text-red-500';

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                disabled={reported || needsLogin}
                title={needsLogin
                    ? t('common.loginRequired')
                    : (reported ? t('report.reportedHint') : label)}
                aria-label={needsLogin
                    ? t('common.loginRequired')
                    : (reported ? t('report.reportedAria') : t('report.aria'))}
                className={`inline-flex items-center gap-1.5 font-semibold text-sm transition-colors
                    disabled:cursor-default ${tone} ${className}`}
            >
                <Flag size={size} fill={reported ? 'currentColor' : 'none'} />
                {labeled && <span>{label}</span>}
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={t('report.title')} maxWidth="520px">
                <form onSubmit={handleSubmit}>
                    <p className="text-sm text-text-secondary leading-relaxed mb-4">
                        {t('report.intro')}
                    </p>

                    {/* A real fieldset with a real legend, not a div with a bold line above it:
                        this is one question with eight answers, and that is the only structure a
                        screen reader can use to say so. */}
                    <fieldset className="mb-4">
                        <legend className="text-sm font-semibold mb-2">{t('report.reasonLegend')}</legend>
                        <div className="grid gap-1.5">
                            {REPORT_REASONS.map((code) => {
                                const hint = reasonHint(code);
                                return (
                                    <label
                                        key={code}
                                        className={`flex gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors ${
                                            reason === code
                                                ? 'border-primary bg-primary-light'
                                                : 'border-border-light hover:bg-surface-hover'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="report-reason"
                                            value={code}
                                            checked={reason === code}
                                            onChange={() => setReason(code)}
                                            className="mt-1 flex-shrink-0 accent-primary"
                                        />
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold">{reasonLabel(code)}</span>
                                            {/* The hints are what stop «معلومة غير صحيحة» and
                                                «نسبة خاطئة» being picked interchangeably, which
                                                would make the code route nothing. */}
                                            {hint && (
                                                <span className="block text-xs text-text-muted leading-relaxed">
                                                    {hint}
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <label className="block text-sm font-semibold mb-1.5" htmlFor={`report-note-${type}-${id}`}>
                        {t('report.noteLabel')}
                    </label>
                    <textarea
                        id={`report-note-${type}-${id}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        // Matches ReportRequest's @Size(max = 1000), which matches the column. The
                        // browser stopping at the limit is kinder than a 400 after typing past it.
                        maxLength={NOTE_MAX_LENGTH}
                        rows={3}
                        placeholder={t('report.notePlaceholder')}
                        className="w-full px-3 py-2 rounded-md border border-border resize-y outline-none
                            focus:border-primary transition-colors bg-surface"
                    />
                    <div className="text-xs text-text-muted mt-1 mb-5">
                        {t('report.noteCounter', { count: note.length, max: NOTE_MAX_LENGTH })}
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        {/* Disabled until a reason is chosen, rather than defaulting to one: a
                            default gets filed by everyone who presses submit without reading. */}
                        <Button type="submit" disabled={!reason || submitReport.isPending}>
                            {submitReport.isPending ? t('report.submitting') : t('report.submit')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

export default ReportButton;
