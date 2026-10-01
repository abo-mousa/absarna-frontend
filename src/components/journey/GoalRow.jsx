import { Link } from 'react-router-dom';
import DayStars from './DayStars';
import PortionTrack from './PortionTrack';
import { amountText, goalTitle, measureOf, paceText, whenName } from '@/lib/goalText';
import { t } from '@/i18n';

/**
 * How far along a finishing goal is, as the days it takes — see `PortionTrack`. With a deadline,
 * the gold tick is where a steady reader would be today and the status says ahead or behind, so
 * "behind" is a distance to see rather than a verdict to read.
 */
export function PaceBar({ goal }) {
    const pace = goal.pace;
    if (!pace?.total) return null;
    return (
        <PortionTrack
            total={pace.total}
            current={pace.current}
            amount={goal.amount}
            measure={measureOf(goal)}
            period={goal.period}
            daysPerWeek={goal.daysPerWeek || 7}
            deadline={goal.deadline}
            finishDate={pace.finishDate}
            daysToFinish={pace.daysToFinish}
            expectedUnits={pace.expectedUnits}
            status={goal.deadline ? paceText(goal) : null}
        />
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
