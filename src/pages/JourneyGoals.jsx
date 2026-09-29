import { Target } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { PageHeader, QueryState, Button } from '../components/ui';
import { DayLegend, GoalRow, JourneyNav, PausedLine, useJourney } from '../components/journey';
import { useGoals } from '../hooks/useGoals';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

/** Every goal the reader holds, each with its week and its pace — and the way to add one. */
function JourneyGoals() {
    usePageMeta({ title: t('journey.nav.goals') });
    const goals = useGoals();
    const { openGoal } = useJourney();
    return (
        <PageShell tab guide="journeyGoals">
            <PageHeader title={t('journey.nav.goals')} action={<JourneyNav />} tabs />
            <PausedLine where="journey" className="mb-6" />
            <QueryState
                isLoading={goals.isLoading}
                isError={goals.isError}
                error={goals.error}
                onRetry={goals.refetch}
                errorTitle={t('journey.loadFailed')}
                isEmpty={!goals.data?.length}
                emptyIcon={Target}
                emptyTitle={t('journey.noGoalsTitle')}
                emptyDescription={t('journey.noGoalsText')}
                emptyAction={<Button onClick={() => openGoal()}>{t('journey.startFirst')}</Button>}
            >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <DayLegend className="flex-1 min-w-[16rem]" />
                    <span data-guide="new-goal"><Button onClick={() => openGoal()}>{t('journey.newGoal')}</Button></span>
                </div>
                <div data-guide="goals" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(goals.data || []).map((goal) => <GoalRow key={goal.id} goal={goal} />)}
                </div>
            </QueryState>
        </PageShell>
    );
}

export default JourneyGoals;
