import PageShell from '../components/layout/PageShell';
import { PageHeader, QueryState, KhatamStar } from '../components/ui';
import { JourneyNav, SacredText } from '../components/journey';
import { useMilestones } from '../hooks/useProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatCount } from '@/lib/numbers';
import { currentLocaleInfo, t } from '@/i18n';

/**
 * «منازل» — stations on the reader's road (PROGRESS-AND-GOALS.md §6.7, the `Milestones` board): each
 * reached once and kept, none reset by a gap, none compared with anyone. A station not yet reached
 * shows how far along the road to it the reader is, never a countdown.
 */
function JourneyMilestones() {
    usePageMeta({ title: t('journey.nav.milestones') });
    const milestones = useMilestones();
    return (
        <PageShell tab>
            <PageHeader title={t('journey.nav.milestones')} action={<JourneyNav />} tabs />
            <QueryState
                isLoading={milestones.isLoading}
                isError={milestones.isError}
                error={milestones.error}
                onRetry={milestones.refetch}
                errorTitle={t('journey.loadFailed')}
            >
                <div className="flex flex-col gap-8 max-w-[720px]">
                    <SacredText moment="milestones" kind="AYAH" />
                    <ol className="relative flex flex-col gap-6 ps-10">
                        <span aria-hidden="true" className="absolute top-2 bottom-2 start-[0.9rem] w-px bg-border" />
                        {(milestones.data || []).map((milestone) => {
                            const reached = !!milestone.reachedAt;
                            return (
                                <li key={milestone.code} className="relative">
                                    <KhatamStar
                                        filled={reached}
                                        strokeWidth={8}
                                        className={`absolute -start-10 top-0.5 w-7 h-7 ${reached ? 'text-gold' : 'text-border'} bg-bg`}
                                    />
                                    <h2 className={`font-serif text-[1.35rem] font-semibold leading-tight ${reached ? '' : 'text-text-secondary'}`}>
                                        {t(`journey.milestones.names.${milestone.code}`)}
                                    </h2>
                                    <p className="text-sm text-text-muted">{t(`journey.milestones.about.${milestone.code}`)}</p>
                                    <p className="text-xs mt-1 font-semibold text-gold-ink">
                                        {reached
                                            ? t('journey.milestones.reachedOn', {
                                                date: new Intl.DateTimeFormat(currentLocaleInfo().numberFormat, { day: 'numeric', month: 'long', year: 'numeric' })
                                                    .format(new Date(milestone.reachedAt)),
                                            })
                                            : t('journey.milestones.along', {
                                                current: formatCount(Math.min(milestone.current, milestone.threshold)),
                                                threshold: formatCount(milestone.threshold),
                                            })}
                                    </p>
                                </li>
                            );
                        })}
                    </ol>
                    <SacredText moment="milestones" kind="HADITH" size="sm" />
                </div>
            </QueryState>
        </PageShell>
    );
}

export default JourneyMilestones;
