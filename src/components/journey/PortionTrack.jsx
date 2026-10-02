import { KhatamStar } from '../ui';
import { amountText } from '@/lib/goalText';
import { finishText } from '@/lib/goalChoice';
import { localDay } from '@/lib/dayFormat';
import { formatReaderDay } from '@/lib/readerCalendar';
import { t } from '@/i18n';

/** Past this many portions the segments would be slivers, so they are grouped by week. */
const MAX_SEGMENTS = 45;

const isoPlus = (iso, days) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);
};
const daysFrom = (from, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);

/**
 * A programme or a book drawn as the days it takes: the whole is the track, what is done is filled,
 * and what is left is cut into one segment per day's portion at the chosen pace — so «حلقتان كل
 * يوم» over twenty episodes is ten segments a reader can count, and changing the pace visibly
 * re-cuts them. The khatam star waits at the end in gold — outlined until it is reached. Past {@value MAX_SEGMENTS} portions a segment is
 * a week of them, and the legend says so.
 *
 * <p>With a deadline, the segments that fall after it turn gold — the overrun, seen rather than
 * announced — and an existing goal's `expectedUnits` (where a steady reader would be today) is a
 * gold tick, as the bar before it had.
 *
 * <p>This replaced two things that confused readers: a bar that said how much but not how long,
 * and a traced star whose meaning changed from screen to screen.
 *
 * @param measure    'EPISODES' | 'PAGES'
 * @param period     'DAY' | 'WEEK' — a weekly goal's segment is a week
 * @param finishDate the backend's finish for an existing goal; computed here otherwise
 */
function PortionTrack({
    total, current = 0, amount, measure, period = 'DAY', daysPerWeek = 7,
    deadline = null, finishDate = null, daysToFinish = null, expectedUnits = null, status = null,
}) {
    if (!total || !amount) return null;
    const today = localDay();
    const done = Math.min(current, total);
    const remaining = Math.max(total - done, 0);
    const portions = Math.ceil(remaining / amount);
    const weekly = period === 'WEEK';
    const days = daysToFinish ?? (weekly ? portions * 7 : Math.ceil((portions * 7) / Math.max(1, daysPerWeek)));
    const finish = finishDate || (days > 0 ? isoPlus(today, days - 1) : today);

    // A segment is one portion, or a week of portions once there would be too many to see.
    const perSegment = !weekly && portions > MAX_SEGMENTS ? amount * daysPerWeek : amount;
    const segments = [];
    for (let at = done; at < total; at += perSegment) segments.push(Math.min(perSegment, total - at));

    // How far a reader keeping this pace gets by the deadline; what lies past it is the overrun.
    let reachable = Infinity;
    if (deadline) {
        const left = daysFrom(today, deadline) + 1;
        const portionsLeft = weekly ? Math.floor(left / 7) : Math.floor((Math.max(0, left) * daysPerWeek) / 7);
        reachable = done + portionsLeft * amount;
    }
    const late = deadline != null && finish > deadline && remaining > 0;
    const share = (units) => `${(units / total) * 100}%`;
    const legend = weekly ? t('journey.track.perWeek', { amount: amountText(measure, amount) })
        : perSegment === amount ? t('journey.track.perDay', { amount: amountText(measure, amount) })
            : t('journey.track.perWeekGrouped');

    let start = done;
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted">{legend}</span>
            <div className="flex items-center gap-2">
                <div
                    className="relative flex-1 flex items-stretch gap-[3px] h-3"
                    role="img"
                    aria-label={t('journey.track.aria', {
                        done: amountText(measure, done), total: amountText(measure, total, true), finish: formatReaderDay(finish),
                    })}
                >
                    {done > 0 && (
                        <span data-track="done" className="rounded-full bg-primary" style={{ flexGrow: done, flexBasis: 0 }} />
                    )}
                    {segments.map((units, index) => {
                        const from = start;
                        start += units;
                        const over = from >= reachable;
                        return (
                            <span
                                key={index}
                                data-track={index === 0 ? 'left' : undefined}
                                className={`rounded-full ${over ? 'bg-gold/60' : 'bg-primary/20 dark:bg-primary/30'}`}
                                style={{ flexGrow: units, flexBasis: 0 }}
                            />
                        );
                    })}
                    {expectedUnits != null && remaining > 0 && (
                        <span
                            className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gold-ink"
                            style={{ insetInlineStart: share(Math.min(expectedUnits, total)) }}
                            title={t('journey.pace.expectedTick')}
                        />
                    )}
                </div>
                {/* Gold is the finish, the khatam: outlined while it is still ahead, filled once
                    reached. Running late is the gold segments' to say, not the star's. */}
                <KhatamStar filled={remaining === 0} strokeWidth={9} className="w-5 h-5 flex-shrink-0 text-gold" />
            </div>
            <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-text-secondary pt-0.5">
                    {done > 0
                        ? t('journey.pace.of', { current: done, total: amountText(measure, total, true) })
                        : amountText(measure, total)}
                </span>
                <span data-track="status" className="flex flex-col items-end text-end gap-0.5">
                    <span className={`text-sm font-bold ${late ? 'text-gold-ink' : 'text-primary-dark dark:text-primary'}`}>
                        {status || (remaining === 0 ? t('journey.pace.done') : finishText(days))}
                    </span>
                    {remaining > 0 && (
                        <span className="text-xs text-text-secondary">
                            {formatReaderDay(finish)}
                            {deadline && <span className="text-gold-ink">{' · '}{t('journey.choose.pace.deadline', { date: formatReaderDay(deadline) })}</span>}
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}

export default PortionTrack;
