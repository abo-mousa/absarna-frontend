import { Link } from 'react-router-dom';
import DayStars from './DayStars';
import { amountText, goalTitle, measureOf, paceText, whenName } from '@/lib/goalText';
import { t } from '@/i18n';

/**
 * How far along a finishing goal is, as a bar — with a tick where a steady reader would be today
 * when there is a deadline, so "behind" is a distance to see rather than a verdict to read.
 */
export function PaceBar({ goal }) {
    const pace = goal.pace;
    if (!pace?.total) return null;
    const share = (units) => `${Math.min(100, Math.max(0, (units / pace.total) * 100))}%`;
    const measure = measureOf(goal);
    return (
        <div>
            <div className="relative h-2 rounded-full bg-border-light overflow-visible"
                 role="img"
                 aria-label={t('journey.pace.barAria', { current: pace.current, total: amountText(measure, pace.total, true) })}>
                <div className="absolute inset-y-0 start-0 rounded-full bg-primary" style={{ width: share(pace.current) }} />
                {pace.expectedUnits != null && pace.remaining > 0 && (
                    <span className="absolute -top-1 -bottom-1 w-0.5 bg-gold-ink" style={{ insetInlineStart: share(pace.expectedUnits) }}
                          title={t('journey.pace.expectedTick')} />
                )}
            </div>
            <p className="flex justify-between text-xs text-text-muted mt-1.5">
                <span>{t('journey.pace.of', { current: pace.current, total: amountText(measure, pace.total, true) })}</span>
                <span>{paceText(goal)}</span>
            </p>
        </div>
    );
}

/** One goal in a list: what, how much and when, its week, and how it stands. */
function GoalRow({ goal }) {
    const measure = measureOf(goal);
    const summary = [
        goal.period === 'WEEK'
            ? t('journey.goalRow.perWeek', { amount: amountText(measure, goal.amount) })
            : t('journey.goalRow.perDay', { amount: amountText(measure, goal.amount) }),
        whenName(goal) || null,
        goal.paused ? t('journey.goalRow.paused') : null,
    ].filter(Boolean).join(' · ');
    return (
        <Link
            to={`/journey/goals/${goal.id}`}
            className="flex flex-col gap-3 p-4 rounded-lg border border-border-light bg-surface text-text-primary hover:no-underline hover:border-border"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p dir="auto" className="font-bold truncate">{goalTitle(goal)}</p>
                    <p className="text-xs text-text-muted mt-0.5">{summary}</p>
                </div>
                {goal.primary && (
                    <span className="flex-shrink-0 text-[0.7rem] font-semibold text-gold-ink border border-gold/50 rounded px-1.5 py-0.5">
                        {t('journey.goalRow.primary')}
                    </span>
                )}
            </div>
            <DayStars days={goal.week} weekly={goal.period === 'WEEK'} />
            <PaceBar goal={goal} />
        </Link>
    );
}

export default GoalRow;
