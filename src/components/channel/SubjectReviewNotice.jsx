import { useState } from 'react';
import { Check, Undo2 } from 'lucide-react';
import { Button, KhatamStar, Modal } from '@/components/ui';
import { PickerDialog } from '@/components/content/SubjectPicker';
import { useAnswerSubjectReview, useConfirmSubjectReviews, useSubjectReview, useUndoSubjectReview } from '@/hooks/useGoalChoice';
import { useToast } from '@/contexts/ToastContext';
import { safeStorage } from '@/lib/safeStorage';
import { fieldOf, subjectLabel } from '@/lib/subjects';
import { amountText } from '@/lib/goalText';
import { countOf } from '@/lib/plural';
import { formatCount } from '@/lib/numbers';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * "We think this series is about X — is it?" (the backend's `ChannelSubjectReviewController`).
 *
 * <p>Unlike `AdoptionNotice` this one can be put off: filing a series is a favour to readers, not
 * something the owner loses by leaving it, so «لاحقًا» hides it — until more series are waiting than
 * when it was put off, which is the one reason to ask again.
 *
 * <p>An imported channel has hundreds of series, so the sheet opens on the confident ones as a
 * ticked list, confirmed together — untick what is wrong. The rest are one series at a time, the
 * answer large: «صحيح» makes the subject the owner's own (it is then never inferred again), the
 * runner-up is one tap («أو: …؟») before the full picker «مجال آخر», «بلا مجال» leaves it untagged,
 * «تخطَّ» moves on without answering, and «تراجع» takes the last answer back. The episode titles
 * that named the subject are drawn in full ink and the rest muted, so the reason is visible, not
 * only counted.
 */
const putOffKey = (slug) => `absarna.subjectReview.putOff.${slug}`;

/** The confident ones, ticked, confirmed together — the first screen when there are two or more. */
function BulkStep({ entries, onConfirm, onOneByOne, pending }) {
    const [unticked, setUnticked] = useState([]);
    const chosen = entries.filter((entry) => !unticked.includes(entry.seriesId));
    const toggle = (id) => setUnticked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    return (
        <div className="flex flex-col gap-5">
            <div>
                <h3 className="font-serif text-2xl font-bold">{t('channelManage.subjectReview.bulkTitle')}</h3>
                <p className="text-sm text-text-secondary">{t('channelManage.subjectReview.bulkText')}</p>
            </div>
            <ul className="flex flex-col max-h-[50vh] overflow-y-auto">
                {entries.map((entry) => (
                    <li key={entry.seriesId} className="border-b border-border-light">
                        <label className="flex items-center gap-3 py-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 accent-primary flex-shrink-0"
                                checked={!unticked.includes(entry.seriesId)}
                                onChange={() => toggle(entry.seriesId)}
                            />
                            <span dir="auto" className="flex-1 min-w-0 truncate font-semibold">{entry.title}</span>
                            <span className="text-sm font-semibold text-primary-dark dark:text-primary flex-shrink-0">{subjectLabel(entry.subject)}</span>
                        </label>
                    </li>
                ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
                <Button className="flex-[2] min-w-[10rem] h-12 inline-flex items-center justify-center gap-2"
                    onClick={() => onConfirm(chosen.map((entry) => entry.seriesId))} disabled={pending || chosen.length === 0}>
                    <Check size={18} aria-hidden="true" />{t('channelManage.subjectReview.bulkConfirm', { count: formatCount(chosen.length) })}
                </Button>
                <Button variant="ghost" className="flex-1 min-w-[8rem] h-12" onClick={onOneByOne} disabled={pending}>
                    {t('channelManage.subjectReview.bulkOneByOne')}
                </Button>
            </div>
        </div>
    );
}

function ReviewSheet({ slug, review, onClose }) {
    const answer = useAnswerSubjectReview(slug);
    const confirmAll = useConfirmSubjectReviews(slug);
    const undo = useUndoSubjectReview(slug);
    const { showToast } = useToast();
    const [passed, setPassed] = useState([]);
    const [done, setDone] = useState(0);
    // What the sheet opened on: every answer refetches the review, so its own `total` shrinks as
    // the owner works — counting against it read «٦ من ٢٥» after five of thirty.
    const [total] = useState(review.total);
    // The answers given here, newest last, with the field each series had before — what «تراجع» restores.
    const [answered, setAnswered] = useState([]);
    const [bulkDone, setBulkDone] = useState(false);
    const [picking, setPicking] = useState(false);
    const busy = answer.isPending || confirmAll.isPending || undo.isPending;
    const remaining = (review.pending || []).filter((entry) => !passed.includes(entry.seriesId));
    const confident = remaining.filter((entry) => entry.confidence === 'HIGH');
    const current = remaining[0] || null;
    const last = answered[answered.length - 1] || null;
    const failed = (error) => showToast(describeError(error, t('channelManage.subjectReview.failed')), 'error');

    const record = (entries) => {
        const ids = entries.map((entry) => entry.seriesId);
        setPassed((list) => [...list, ...ids]);
        setDone((n) => n + ids.length);
        setAnswered((list) => [...list, ...entries.map((entry) => ({ seriesId: entry.seriesId, previous: entry.ownerField || null }))]);
    };
    const send = (decision, subject = null) => {
        const entry = current;
        answer.mutate({ seriesId: entry.seriesId, decision, subject }, { onSuccess: () => record([entry]), onError: failed });
    };
    const sendAll = (ids) => {
        confirmAll.mutate(ids, {
            onSuccess: (data) => {
                const confirmed = new Set(data?.confirmed || []);
                record(remaining.filter((entry) => confirmed.has(entry.seriesId)));
                setBulkDone(true);
            },
            onError: failed,
        });
    };
    const takeBack = () => {
        undo.mutate(last, {
            onSuccess: () => {
                setAnswered((list) => list.slice(0, -1));
                setPassed((list) => list.filter((id) => id !== last.seriesId));
                setDone((n) => Math.max(0, n - 1));
            },
            onError: failed,
        });
    };
    const skip = () => setPassed((list) => [...list, current.seriesId]);
    const second = current?.secondSubject && current.secondSubject !== current.subject ? current.secondSubject : null;
    const undoButton = last && (
        <button type="button" onClick={takeBack} disabled={busy} className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:underline">
            <Undo2 size={15} aria-hidden="true" />{t('channelManage.subjectReview.undo')}
        </button>
    );

    let body;
    if (!current) {
        body = (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
                <KhatamStar filled className="w-10 h-10 text-gold" strokeWidth={8} />
                <p className="font-semibold">{t('channelManage.subjectReview.finished')}</p>
                <div className="flex items-center gap-4">
                    {undoButton}
                    <Button onClick={onClose}>{t('common.close')}</Button>
                </div>
            </div>
        );
    } else if (!bulkDone && confident.length >= 2) {
        body = <BulkStep entries={confident} onConfirm={sendAll} onOneByOne={() => setBulkDone(true)} pending={busy} />;
    } else {
        body = (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text-secondary">
                        {t('channelManage.subjectReview.progress', { done: formatCount(Math.min(done + 1, total)), total: formatCount(total) })}
                    </span>
                    <span className="flex-1 h-1.5 rounded-full bg-border-light overflow-hidden">
                        <i className="block h-full bg-primary" style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%` }} />
                    </span>
                    {undoButton}
                </div>

                <div>
                    <h3 dir="auto" className="font-serif text-2xl font-bold leading-snug">{current.title}</h3>
                    <span className="text-sm text-text-secondary">{amountText('EPISODES', current.episodes)}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-sm text-text-secondary">{t('channelManage.subjectReview.weThink')}</span>
                    <span className="font-serif text-4xl font-bold text-primary-dark dark:text-primary">{subjectLabel(current.subject)}</span>
                    {fieldOf(current.subject) && fieldOf(current.subject).code !== current.subject && (
                        <span className="text-sm text-text-secondary">
                            {t('channelManage.subjectReview.inField', { field: subjectLabel(fieldOf(current.subject).code) })}
                        </span>
                    )}
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-semibold mb-1">
                        {current.episodesMatched >= 2
                            ? t('channelManage.subjectReview.whyEpisodes', {
                                matched: formatCount(current.episodesMatched),
                                // After «من» the dual takes its oblique form: «٢ من حلقتين».
                                episodes: amountText('EPISODES', current.episodes, true),
                            })
                            : t('channelManage.subjectReview.whyTitle')}
                    </span>
                    {current.examples?.length > 0 && (
                        <ul className="flex flex-col" aria-label={t('channelManage.subjectReview.episodesTitle')}>
                            {current.examples.map((example, index) => (
                                <li
                                    key={`${index}-${example.title}`}
                                    dir="auto"
                                    className={`py-2 border-b border-border-light text-sm ${example.matches ? 'text-text-primary font-semibold' : 'text-text-muted'}`}
                                >
                                    {example.title}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button className="flex-[2] min-w-[10rem] h-12 inline-flex items-center justify-center gap-2" onClick={() => send('CONFIRM')} disabled={busy}>
                        <Check size={18} aria-hidden="true" />{t('channelManage.subjectReview.correct')}
                    </Button>
                    {second && (
                        <Button variant="ghost" className="flex-1 min-w-[8rem] h-12" onClick={() => send('CHANGE', second)} disabled={busy}>
                            {t('channelManage.subjectReview.orSecond', { subject: subjectLabel(second) })}
                        </Button>
                    )}
                    <Button variant="ghost" className="flex-1 min-w-[8rem] h-12" onClick={() => setPicking(true)} disabled={busy}>
                        {t('channelManage.subjectReview.other')}
                    </Button>
                    <button type="button" onClick={() => send('NONE')} disabled={busy} className="text-sm font-semibold text-text-secondary hover:underline">
                        {t('channelManage.subjectReview.none')}
                    </button>
                    <button type="button" onClick={skip} disabled={busy} className="text-sm font-semibold text-text-muted hover:underline">
                        {t('channelManage.subjectReview.skip')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Modal open onClose={onClose} title={t('channelManage.subjectReview.sheetTitle')} maxWidth="720px">
            {body}
            {picking && current && (
                <PickerDialog
                    value={null}
                    onChoose={(code) => { setPicking(false); send('CHANGE', code); }}
                    onClose={() => setPicking(false)}
                />
            )}
        </Modal>
    );
}

function SubjectReviewNotice({ slug }) {
    const review = useSubjectReview(slug);
    const [open, setOpen] = useState(false);
    const [putOffAt, setPutOffAt] = useState(() => Number.parseInt(safeStorage.getItem(putOffKey(slug)) || '0', 10) || 0);
    const data = review.data;
    const total = data?.total || 0;

    if (open && data) return <ReviewSheet slug={slug} review={data} onClose={() => setOpen(false)} />;
    if (total === 0 || total <= putOffAt) return null;

    const putOff = () => {
        safeStorage.setItem(putOffKey(slug), String(total));
        setPutOffAt(total);
    };
    return (
        <div className="mb-5 rounded-md border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gold-light text-gold-ink flex items-center justify-center flex-shrink-0">
                <KhatamStar className="w-5 h-5" strokeWidth={10} />
            </span>
            <div className="flex-1 grid gap-0.5">
                <strong className="text-sm">
                    {t('channelManage.subjectReview.noticeTitle', { series: countOf('channelManage.subjectReview.series', total) })}
                </strong>
                <p className="text-sm text-text-secondary leading-relaxed">{t('channelManage.subjectReview.noticeText')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" onClick={putOff}>{t('channelManage.subjectReview.later')}</Button>
                <Button onClick={() => setOpen(true)}>{t('channelManage.subjectReview.open')}</Button>
            </div>
        </div>
    );
}

export default SubjectReviewNotice;
