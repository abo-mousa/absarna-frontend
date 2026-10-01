import { hijriDeadlines } from './hijriSeasons';
import { bookPortion } from './journey';
import { durationToSeconds } from './media';
import { amountText } from './goalText';
import { countOf } from './plural';
import { t } from '@/i18n';

/**
 * The pure half of choosing a goal (`pages/JourneyChoose`): the answers «ساعدني أختار» offers, when
 * its second question is worth asking, and how a chosen item becomes the goal dialog's prefill.
 */

/** Minutes a day the reader can give — the first half of «كم من يومك؟». */
export const MINUTE_CHOICES = [10, 20, 45, 60];

/** Of a shortlist: enough to compare, few enough to fit side by side on a phone. */
export const SHORTLIST_MAX = 3;

const isoDay = (date) => date.toISOString().slice(0, 10);
const plusDays = (now, days) => {
    const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
    day.setUTCDate(day.getUTCDate() + days);
    return isoDay(day);
};

/**
 * «وتحبّ أن تُتمّه…»'s row: whenever, a month, three months. The Hijri seasons (Ramadan among them)
 * and any date of the reader's own live behind the row's fourth choice, «موعد آخر» — Ramadan alone
 * as a chip made the row uneven and left the other seasons out. `{ key, date }`, date
 * 'YYYY-MM-DD' or null for whenever.
 */
export function deadlineChoices(now = new Date()) {
    return [
        { key: 'none', date: null },
        { key: 'month', date: plusDays(now, 30) },
        { key: 'quarter', date: plusDays(now, 90) },
    ];
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const SEASONS = ['monthEnd', 'ramadan', 'dhulHijjah', 'yearEnd'];

/** A Hijri season key ('ramadan', 'dhulHijjah', 'monthEnd', 'yearEnd') as a `deadline` param. */
export const isSeasonDeadline = (value) => SEASONS.includes(value);

/** Whether the `deadline` param is the reader's own choice — a season or a date — rather than the row's. */
export const isCustomDeadline = (value) => ISO_DAY.test(value || '') || isSeasonDeadline(value);

/**
 * The date a `deadline` param stands for: a row choice's ('month'…), a season's (its last day
 * before it begins), or the reader's own 'YYYY-MM-DD'; null for 'none' or anything unreadable —
 * and null for a date already past, which an old link can carry and the backend would refuse.
 */
export function deadlineDate(value, now = new Date()) {
    if (ISO_DAY.test(value || '')) return value >= plusDays(now, 0) ? value : null;
    if (isSeasonDeadline(value)) return hijriDeadlines(now).find((season) => season.key === value)?.date || null;
    return deadlineChoices(now).find((choice) => choice.key === value)?.date || null;
}

/**
 * Whether the subject question is worth asking for a field: only when there is a real choice.
 * A field with one subject (or none, only programmes filed under the field itself) goes straight
 * to the time question — nobody is asked a question with one answer.
 */
export const asksForSubject = (fieldTopic) => (fieldTopic?.subjects?.length || 0) >= 2;

/**
 * The goal dialog's prefill for a chosen programme or book, at a given daily amount — and with the
 * deadline «ساعدني أختار» was asked for, since the amount was paced to meet it.
 */
export function prefillFor(item, amount = null, deadline = null) {
    const extra = deadline ? { deadline } : {};
    if (item.kind === 'FINISH_BOOK') {
        const pages = item.pages ?? item.book?.pages ?? null;
        return {
            kind: 'FINISH_BOOK', targetId: item.targetId, title: item.title, measure: 'PAGES',
            amount: amount || bookPortion(pages, 0), ...extra,
        };
    }
    return { kind: 'FINISH_SERIES', targetId: item.targetId, title: item.title, measure: 'EPISODES', amount: amount || 1, ...extra };
}

/** A key for an item across kinds — a series and a book may share an id. */
export const itemKey = (item) => `${item.kind}:${item.targetId}`;

/** The shortlist with `item` added or removed; full, an add replaces nothing and is refused. */
export function toggleShortlist(list, item) {
    const key = itemKey(item);
    if (list.some((entry) => itemKey(entry) === key)) return list.filter((entry) => itemKey(entry) !== key);
    return list.length >= SHORTLIST_MAX ? list : [...list, item];
}

/** Mean measured episode length in minutes over the episodes that have one; null when none do. */
export function averageMinutes(videos) {
    // `durationSeconds` where a listing carries it, else the "H:MM:SS" every VideoDTO carries.
    const measured = (videos || [])
        .map((video) => video.durationSeconds || durationToSeconds(video.duration))
        .filter((s) => s > 0);
    if (!measured.length) return null;
    return Math.round(measured.reduce((sum, s) => sum + s, 0) / measured.length / 60);
}

/** Days to finish `units` at `perDay` a day, every day. */
export const daysToFinish = (units, perDay) => (units > 0 ? Math.ceil(units / Math.max(1, perDay)) : 0);

/** What a card says under its title: its size. */
export function itemMeta(item) {
    return item.kind === 'FINISH_BOOK'
        ? (item.pages ? amountText('PAGES', item.pages) : t('journey.choose.book'))
        : (item.episodes ? amountText('EPISODES', item.episodes) : '');
}

/** «اختاره ١٤ قارئًا وِردًا» — shown only from the backend's threshold up, which sends null below it. */
export const chosenByText = (count) => t('journey.choose.chosenBy', { readers: countOf('journey.units.READERS', count) });

/** «تُتمّه بعد ٥ أسابيع» — days under two weeks, weeks above. */
export function finishText(days) {
    if (!days) return '';
    const duration = days >= 14
        ? countOf('journey.units.WEEKS', Math.round(days / 7), { oblique: true })
        : countOf('journey.units.DAYS', days, { oblique: true });
    return t('journey.choose.finishIn', { duration });
}
