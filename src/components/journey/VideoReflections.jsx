import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateReflection, useItemReflections } from '@/hooks/useReflections';
import { useToast } from '@/contexts/ToastContext';
import { safeStorage } from '@/lib/safeStorage';
import { localDay } from '@/lib/dayFormat';
import { formatTimestamp } from '@/lib/spans';
import { describeError } from '@/lib/describeError';
import { formatDigits, t } from '@/i18n';

const PROMPTED_KEY = 'absarna.reflectionPrompted';
const LIMIT = 280;

function putAwayToday(key) {
    try {
        const today = localDay();
        const prompted = JSON.parse(safeStorage.getItem(PROMPTED_KEY) || '{}');
        const kept = Object.fromEntries(Object.entries(prompted).filter(([, day]) => day === today));
        safeStorage.setItem(PROMPTED_KEY, JSON.stringify({ ...kept, [key]: today }));
    } catch {
        /* a convenience; nothing to recover */
    }
}

function wasPutAwayToday(key) {
    try {
        return JSON.parse(safeStorage.getItem(PROMPTED_KEY) || '{}')[key] === localDay();
    } catch {
        return false;
    }
}

/**
 * «خواطري» on a lecture's page: a note at <b>the moment it came to you</b>, as many as you like, and
 * the ones already written listed under the player — each with its timestamp, which jumps back to
 * that moment. The product owner's refinement (2026-09-28) of the one question that used to open
 * only after the episode was finished.
 *
 * <p>That question still opens by itself when the episode is finished during this visit (`invite`),
 * never on reopening an old one, and closing it puts it away until tomorrow. Signed in and verified
 * only — writing one is "keeping".
 *
 * @param getCurrentTime the player's playhead, read when the reader presses «دوّن»
 * @param seekTo         the player's seek, for a timestamp tapped in the list
 */
function VideoReflections({ videoId, getCurrentTime, seekTo, invite = false, className = '' }) {
    const { token, user } = useAuth();
    const key = `VIDEO:${videoId}`;
    const reflections = useItemReflections('VIDEO', videoId);
    const create = useCreateReflection();
    const { showToast } = useToast();
    const [composing, setComposing] = useState(null); // { position, invited }
    const [dismissed, setDismissed] = useState(() => wasPutAwayToday(key));
    const [text, setText] = useState('');

    if (!token || user?.emailVerified === false) return null;

    const rows = reflections.data || [];
    const invited = invite && !dismissed && !composing;
    const form = composing || (invited ? { position: Math.floor(getCurrentTime() || 0), invited: true } : null);

    const start = () => {
        setText('');
        setComposing({ position: Math.floor(getCurrentTime() || 0), invited: false });
    };
    const close = () => {
        if (form?.invited) {
            putAwayToday(key);
            setDismissed(true);
        }
        setComposing(null);
        setText('');
    };
    const submit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        create.mutate({ kind: 'VIDEO', itemId: videoId, position: form.position, text: text.trim() }, {
            onSuccess: () => {
                putAwayToday(key);
                setDismissed(true);
                setComposing(null);
                setText('');
                showToast(t('journey.reflections.saved'), 'success');
            },
            onError: (error) => showToast(describeError(error, t('journey.reflections.saveFailed')), 'error'),
        });
    };
    const jump = (position) => {
        seekTo?.(position);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className={`flex flex-col gap-3 ${className}`} aria-label={t('journey.reflections.onThisLesson')}>
            {form ? (
                <form onSubmit={submit} className="relative p-4 rounded-lg border border-gold/40 bg-gold-light/30">
                    <button
                        type="button"
                        onClick={close}
                        aria-label={t('journey.reflections.notNow')}
                        title={t('journey.reflections.notNow')}
                        className="absolute top-2 end-2 flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                    <label htmlFor={`reflection-${key}`} className="block pe-8 font-serif text-[1.2rem] font-semibold leading-snug">
                        {form.invited ? t('journey.reflections.promptVideo') : t('journey.reflections.atMoment')}
                    </label>
                    <p className="text-xs text-text-muted mt-0.5">
                        {t('journey.reflections.atTime', { time: formatTimestamp(form.position) })}
                        {' · '}{t('journey.reflections.promptHint')}
                    </p>
                    <div className="flex flex-wrap items-start gap-2 mt-3">
                        <input
                            id={`reflection-${key}`}
                            type="text"
                            dir={text ? 'auto' : undefined}
                            maxLength={LIMIT}
                            value={text}
                            autoFocus={!form.invited}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('journey.reflections.placeholder')}
                            className="flex-1 min-w-[14rem] px-3 py-2 rounded-md border border-border bg-surface font-reading"
                        />
                        <button
                            type="submit"
                            disabled={!text.trim() || create.isPending}
                            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                        >
                            {create.isPending ? t('common.saving') : t('journey.reflections.save')}
                        </button>
                    </div>
                    {text.length > LIMIT - 40 && (
                        <p className="text-xs text-text-muted mt-1" aria-live="polite">{formatDigits(String(LIMIT - text.length))}</p>
                    )}
                </form>
            ) : (
                <button
                    type="button"
                    onClick={start}
                    className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-sm font-semibold text-text-primary hover:border-primary hover:text-primary"
                >
                    <PenLine size={15} aria-hidden="true" />
                    {t('journey.reflections.writeHere')}
                </button>
            )}

            {rows.length > 0 && (
                <div>
                    <p className="text-sm font-semibold mb-2">
                        {t('journey.reflections.onThisLesson')}
                        <Link to="/journey/reflections" className="ms-2 text-xs font-normal">{t('journey.reflections.seeAll')}</Link>
                    </p>
                    <ol className="flex flex-col gap-1.5">
                        {rows.map((row) => (
                            <li key={row.id} className="flex items-start gap-3 text-sm">
                                <button
                                    type="button"
                                    onClick={() => jump(row.position || 0)}
                                    title={t('journey.reflections.jump')}
                                    className="flex-shrink-0 px-2 py-0.5 rounded bg-primary-light text-primary text-xs font-semibold hover:bg-primary hover:text-white"
                                    dir="ltr"
                                >
                                    {formatTimestamp(row.position || 0)}
                                </button>
                                <span dir="auto" className="font-reading leading-relaxed">{row.text}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </section>
    );
}

export default VideoReflections;
