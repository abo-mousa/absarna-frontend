import { slotIndex, slotOf } from './slots';

/** Day states that count as kept — the backend's `DayState.kept()`. */
export const KEPT = new Set(['FULL', 'MINIMUM', 'MADE_UP']);

/**
 * Where one daily portion stands on Today, right now (PROGRESS-AND-GOALS.md §7.7). The server
 * sends the day's state; the clock decides the rest here, because Today is cached until the day
 * ends and the slot moves under it.
 *
 * - `done` — the full portion done (or made up), whatever the time: it stays on the page, marked done.
 * - `kept` — the minimum done: the day is kept, and the rest of the portion is still offered —
 *   «وإن قلّ» keeps a hard day, it does not end an easy one early.
 * - `excused` — inside a pause.
 * - `current` — its time is now (or it has no time; or its time passed and its fallback is now —
 *   then `moved` is true, «لم يفتك بعد»).
 * - `later` — its time (or its fallback's) is still ahead; the reader may do it early.
 * - `passed` — its time has passed with no fallback left today: still on the page, never hidden.
 */
export function portionView(goal, now = new Date()) {
    const state = goal?.today?.state;
    if (state === 'MINIMUM') return { status: 'kept', moved: false };
    if (KEPT.has(state)) return { status: 'done', moved: false };
    if (state === 'EXCUSED') return { status: 'excused', moved: false };
    if (!goal?.slot) return { status: 'current', moved: false };
    const current = slotIndex(slotOf(now));
    const own = slotIndex(goal.slot);
    if (current === own) return { status: 'current', moved: false };
    if (current < own) return { status: 'later', moved: false };
    const fallback = goal.fallbackSlot ? slotIndex(goal.fallbackSlot) : -1;
    if (fallback === current) return { status: 'current', moved: true };
    if (fallback > current) return { status: 'later', moved: true };
    return { status: 'passed', moved: false };
}

/** The slot a portion is shown under now: its fallback once it has moved there. */
export const shownSlot = (goal, view) => (view.moved ? goal.fallbackSlot : goal.slot);

/**
 * Today's daily portions in the order the day meets them: current first, then later ones by time,
 * then the passed, then the done — so what is to be done now is at the top.
 */
export function orderPortions(goals, now = new Date()) {
    const rank = { current: 0, later: 1, passed: 2, kept: 3, excused: 4, done: 5 };
    return goals
        .filter((goal) => goal.period === 'DAY')
        .map((goal) => ({ goal, view: portionView(goal, now) }))
        .sort((a, b) => rank[a.view.status] - rank[b.view.status]
            || slotIndex(shownSlot(a.goal, a.view) || 'GHADWA') - slotIndex(shownSlot(b.goal, b.view) || 'GHADWA'));
}

/** Goals that already pursue this programme or book — «في وِردك» instead of «اجعله وِردًا». */
export function goalFor(goals, { seriesId = null, bookId = null }) {
    return (goals || []).find((goal) =>
        (seriesId != null && goal.kind === 'FINISH_SERIES' && goal.targetId === seriesId)
        || (bookId != null && goal.kind === 'FINISH_BOOK' && goal.targetId === bookId)) || null;
}

/** The proposed portion for a book: the pages that finish it in thirty days (PROGRESS-AND-GOALS.md §7.10). */
export const bookPortion = (pages, currentPage = 0) =>
    pages && pages > currentPage ? Math.max(1, Math.ceil((pages - (currentPage || 0)) / 30)) : 2;
