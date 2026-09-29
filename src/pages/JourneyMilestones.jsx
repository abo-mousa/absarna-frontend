import PageShell from '../components/layout/PageShell';
import { PageHeader, QueryState } from '../components/ui';
import { JourneyNav, MilestoneThread, PausedLine, SacredText } from '../components/journey';
import { useMilestones } from '../hooks/useProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

/**
 * «منازل» — stations on the reader's road (PROGRESS-AND-GOALS.md §6.7): each reached once and kept,
 * none reset by a gap, none compared with anyone — drawn as one thread of stars (`MilestoneThread`).
 * A station not yet reached shows how far along the road to it the reader is, never a countdown.
 */
function JourneyMilestones() {
    usePageMeta({ title: t('journey.nav.milestones') });
    const milestones = useMilestones();
    return (
        <PageShell tab>
            <PageHeader title={t('journey.nav.milestones')} action={<JourneyNav />} tabs guide="journeyMilestones" />
            <PausedLine where="journey" className="mb-6" />
            <QueryState
                isLoading={milestones.isLoading}
                isError={milestones.isError}
                error={milestones.error}
                onRetry={milestones.refetch}
                errorTitle={t('journey.loadFailed')}
            >
                <div className="flex flex-col gap-8 max-w-[1000px]">
                    <SacredText moment="milestones" kind="AYAH" />
                    <MilestoneThread milestones={milestones.data} />
                    <SacredText moment="milestones" kind="HADITH" size="sm" />
                </div>
            </QueryState>
        </PageShell>
    );
}

export default JourneyMilestones;
