import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateReflection } from '@/hooks/useReflections';
import { useToast } from '@/contexts/ToastContext';
import { safeStorage } from '@/lib/safeStorage';
import { localDay } from '@/lib/dayFormat';
import { describeError } from '@/lib/describeError';
import { KhatamStar } from '../ui';
import { formatDigits, t } from '@/i18n';

const PROMPTED_KEY = 'absarna.reflectionPrompted';
const LIMIT = 280;

function readPrompted() {
    try {
        return JSON.parse(safeStorage.getItem(PROMPTED_KEY) || '{}');
    } catch {
        return {};
    }
}

/**
 * «ما الذي بقي معك؟» — one optional line about an episode or a book (PROGRESS-AND-GOALS.md §6.12).
 *
 * <p>Two strengths, and the difference is timing. `invite` opens the question by itself, and is
 * set only at the moment something was just done — an episode finished <b>during this visit</b>, a
 * few pages turned in this one — never on opening a page about something finished months ago,
 * which asked about "this lesson" before the reader had watched a second of it. `available` is the
 * quiet version: a small «اكتب ما بقي معك» that opens the same form on a tap, for anything the reader
 * has finished or read, whenever they come back to it.
 *
 * <p>The invitation is dismissable and never repeats for the same item on the same day: answering
 * or closing it puts it away until tomorrow, in this browser. The quiet link stays. Signed in and
 * verified only — keeping a line is "keeping", and a form whose save is refused would be a promise
 * the page cannot keep. No catalogue text here (§8.1): the question is enough.
 *
 * <p>Callers key it by item: a page that moves to another video reuses its component, and this
 * one's state (typed text, "saved", "put away") belongs to one item.
 */
function ReflectionPrompt({ kind, itemId, position = null, invite = false, available = false, className = '' }) {
    const { token, user } = useAuth();
    const key = `${kind}:${itemId}`;
    const [putAwayToday, setPutAwayToday] = useState(() => readPrompted()[key] === localDay());
    const [opened, setOpened] = useState(false);
    const [saved, setSaved] = useState(false);
    const [text, setText] = useState('');
    const create = useCreateReflection();
    const { showToast } = useToast();

    if (!token || user?.emailVerified === false) return null;

    const putAway = () => {
        const today = localDay();
        // Only today's entries are worth keeping; yesterday's say nothing any more.
        const kept = Object.fromEntries(Object.entries(readPrompted()).filter(([, day]) => day === today));
        safeStorage.setItem(PROMPTED_KEY, JSON.stringify({ ...kept, [key]: today }));
        setPutAwayToday(true);
        setOpened(false);
    };

    if (saved) {
        return (
            <p className={`flex flex-wrap items-center gap-2 text-sm text-gold-ink ${className}`}>
                <KhatamStar className="w-3.5 h-3.5 text-gold" />
                {t('journey.reflections.saved')}
                <Link to="/journey/reflections" className="font-semibold">{t('journey.reflections.seeAll')}</Link>
            </p>
        );
    }

    const showForm = opened || (invite && !putAwayToday);
    if (!showForm) {
        if (!available && !invite) return null;
        return (
            <button
                type="button"
                onClick={() => setOpened(true)}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline ${className}`}
            >
                <PenLine size={15} aria-hidden="true" />
                {t('journey.reflections.write')}
            </button>
        );
    }

    const submit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        create.mutate({ kind, itemId, position: position ?? undefined, text: text.trim() }, {
            onSuccess: () => { putAway(); setSaved(true); },
            onError: (error) => showToast(describeError(error, t('journey.reflections.saveFailed')), 'error'),
        });
    };

    return (
        <form onSubmit={submit} className={`relative p-4 rounded-lg border border-gold/40 bg-gold-light/30 ${className}`}>
            <button
                type="button"
                onClick={putAway}
                aria-label={t('journey.reflections.notNow')}
                title={t('journey.reflections.notNow')}
                className="absolute top-2 end-2 flex items-center justify-center w-8 h-8 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover"
            >
                <X size={16} aria-hidden="true" />
            </button>
            <label htmlFor={`reflection-${key}`} className="block pe-8 font-serif text-[1.2rem] font-semibold leading-snug">
                {kind === 'BOOK' ? t('journey.reflections.promptBook') : t('journey.reflections.promptVideo')}
            </label>
            <p className="text-xs text-text-muted mt-0.5">{t('journey.reflections.promptHint')}</p>
            <div className="flex flex-wrap items-start gap-2 mt-3">
                <input
                    id={`reflection-${key}`}
                    type="text"
                    // Empty, `auto` falls back to left-to-right and puts an Arabic placeholder on
                    // the wrong side; the page's direction until something is typed.
                    dir={text ? 'auto' : undefined}
                    maxLength={LIMIT}
                    value={text}
                    // A tap on the quiet link means "I want to write": the field is ready for it.
                    autoFocus={opened}
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
                <p className="text-xs text-text-muted mt-1" aria-live="polite">
                    {formatDigits(String(LIMIT - text.length))}
                </p>
            )}
        </form>
    );
}

export default ReflectionPrompt;
