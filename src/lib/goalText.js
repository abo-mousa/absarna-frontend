import { formatDigits, t } from '@/i18n';
import { countOf } from './plural';
import { formatDay } from './dayFormat';

/**
 * How a goal is said, in one place — the dialog's read-back, Today's portion cards, the goal page
 * and the goals list all word a goal the same way.
 */

/** The measure a goal counts: a finishing goal's follows from its kind. */
export const measureOf = (goal) =>
    goal.kind === 'FINISH_SERIES' ? 'EPISODES' : goal.kind === 'FINISH_BOOK' ? 'PAGES' : (goal.measure || 'MINUTES');

/**
 * «٤ صفحات», «حلقة واحدة», "15 minutes". `oblique` for a count after a preposition or as an
 * object — «من حلقتين», «أبقِ صفحتين» (see `countOf`).
 */
export const amountText = (measure, count, oblique = false) => countOf(`journey.units.${measure}`, count, { oblique });

/**
 * A reader-facing title inside a sentence of the other script, isolated (FSI…PDI) so an Arabic
 * title in an English sentence — or the reverse — does not drag the quotes and commas around it.
 */
export const isolate = (text) => `\u2068${text}\u2069`;

/** What the goal pursues: the programme's or book's title, or the habit's description. */
export const goalTitle = (goal) =>
    goal.kind === 'HABIT' ? t(`journey.habit.${measureOf(goal)}`) : (goal.targetTitleSnapshot || goal.title || '');

export const slotName = (slot) => t(`journey.slots.${slot}`);

export const anchorName = (goal) =>
    goal.anchor === 'CUSTOM' ? (goal.anchorText || '').trim() : goal.anchor ? t(`journey.anchors.${goal.anchor}`) : '';

/** «الساعة ٧:٣٠» — the goal's own hour, in the reader's digits; empty when it has none. */
export const hourName = (goal) => (goal.atTime ? t('journey.hourAt', { time: formatDigits(goal.atTime.slice(0, 5)) }) : '');

/**
 * How a card says when a portion is kept: the reader's own hour, else what it follows, else its
 * time of day — the words the reader chose before the category they were filed under.
 */
export const whenName = (goal) => hourName(goal) || anchorName(goal) || (goal.slot ? slotName(goal.slot) : '');

/**
 * The commitment read back as one sentence («عهدك مع نفسك»): what, how much, how often, when, and
 * the minimum that keeps a hard day. Built from parts so a goal with no time or all seven days
 * leaves those parts out rather than saying "any time, every day of the seven".
 */
export function commitmentSentence(goal) {
    const measure = measureOf(goal);
    const amount = amountText(measure, goal.amount);
    const parts = [];
    if (goal.period === 'WEEK') {
        parts.push(goal.kind === 'HABIT'
            ? t('journey.sentence.weekHabit', { amount })
            : t('journey.sentence.week', { amount, what: isolate(goalTitle(goal)) }));
    } else {
        parts.push(t(goal.kind === 'HABIT' ? 'journey.sentence.dayHabit' : 'journey.sentence.day',
            { amount, what: isolate(goalTitle(goal)) }));
        if (goal.daysPerWeek && goal.daysPerWeek < 7) {
            parts.push(t('journey.sentence.days', { days: goal.daysPerWeek }));
        }
        if (goal.slot) {
            const anchor = hourName(goal) || anchorName(goal);
            // Lower-cased inside a sentence ("in the morning"); Arabic has no case to change.
            const slot = slotName(goal.slot).toLocaleLowerCase();
            parts.push(anchor
                ? t('journey.sentence.slotAnchor', { slot, anchor })
                : t('journey.sentence.slot', { slot }));
        }
        if (goal.minimumAmount && goal.minimumAmount < goal.amount) {
            parts.push(t('journey.sentence.minimum', { minimum: amountText(measure, goal.minimumAmount) }));
        }
    }
    return parts.join(t('journey.sentence.joiner')) + t('journey.sentence.end');
}

/** Where a goal's next portion starts: the episode to play, or the book's page. */
export function resumeHref(goal) {
    if (goal.kind === 'FINISH_SERIES') {
        if (goal.nextVideoId) return `/video/${goal.nextVideoId}${goal.resumeSeconds ? `?t=${goal.resumeSeconds}` : ''}`;
        return `/series/${goal.targetId}`;
    }
    if (goal.kind === 'FINISH_BOOK') return `/books/${goal.targetId}`;
    return measureOf(goal) === 'PAGES' ? '/books' : '/discover';
}

/** «غدًا: من ص ٢٢٢» — where tomorrow's portion begins, when the goal knows. */
export function tomorrowText(goal) {
    if (goal.kind === 'FINISH_BOOK' && goal.nextPage) return t('journey.today.tomorrowPage', { page: goal.nextPage });
    if (goal.kind === 'FINISH_SERIES' && goal.nextVideoId) return t('journey.today.tomorrowEpisode');
    return null;
}

/** How a finishing goal stands against its end, in words — ahead, on time, or still reachable. */
export function paceText(goal) {
    const pace = goal.pace;
    if (!pace || pace.total == null) return null;
    if (pace.remaining === 0) return t('journey.pace.done');
    if (goal.deadline && pace.aheadDays != null) {
        if (pace.aheadDays > 0) return t('journey.pace.ahead', { days: countOf('journey.units.DAYS', pace.aheadDays, { oblique: true }) });
        if (pace.aheadDays < 0) return t('journey.pace.behind', { amount: amountText(measureOf(goal), pace.perPortion) });
        return t('journey.pace.onTime');
    }
    return pace.finishDate ? t('journey.pace.finishOn', { date: formatDay(pace.finishDate) }) : null;
}


/** An amount of learning time, read at a glance: minutes under two hours, whole hours above. */
export const learningTime = (minutes, oblique = false) => (minutes >= 120
    ? countOf('journey.units.HOURS', Math.round(minutes / 60), { oblique })
    : countOf('journey.units.MINUTES', Math.round(minutes), { oblique }));
