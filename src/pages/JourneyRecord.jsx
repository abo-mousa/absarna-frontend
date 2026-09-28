import PageShell from '../components/layout/PageShell';
import { PageHeader, QueryState, Cartouche } from '../components/ui';
import {
    HistoryList, JourneyNav, PausedLine, RetentionPanel, SacredText, SlotSplit, WeekBars, YearStars,
} from '../components/journey';
import { useProgressSlots, useProgressWeeks, useProgressYear } from '../hooks/useProgress';
import { usePageMeta } from '../hooks/usePageMeta';
import { countOf } from '@/lib/plural';
import { formatCount } from '@/lib/numbers';
import { t } from '@/i18n';

const SLOT_DAYS = 30;

/**
 * «السجل» — the reader's record (PROGRESS-AND-GOALS.md §7.3, the `Record` board): the year as
 * week-stars, the last twelve weeks' time, the time of day they learn in, what they watched and
 * read, and their control over all of it. Every chart is a mirror for the reader alone; nothing
 * on the platform reads it back to suggest anything (§2 decision 5).
 *
 * <p>The old History page folded into this one: `/history` redirects here.
 */
function JourneyRecord() {
    usePageMeta({ title: t('journey.nav.record') });
    const year = useProgressYear();
    const weeks = useProgressWeeks(12);
    const slots = useProgressSlots(SLOT_DAYS);

    return (
        <PageShell tab>
            <PageHeader title={t('journey.nav.record')} action={<JourneyNav />} tabs />
            <div className="flex flex-col gap-10">
                <PausedLine where="journey" />

                <section>
                    <Cartouche title={t('journey.record.yearTitle')} />
                    <QueryState
                        isLoading={year.isLoading}
                        isError={year.isError}
                        error={year.error}
                        onRetry={year.refetch}
                        errorTitle={t('journey.loadFailed')}
                    >
                        {year.data && <YearSection year={year.data} />}
                    </QueryState>
                </section>

                {weeks.data?.weeks?.some((week) => week.minutes > 0) && (
                    <section>
                        <Cartouche title={t('journey.record.weeksTitle')} />
                        <div className="max-w-[720px] pt-6">
                            <WeekBars weeks={weeks.data.weeks} goalMinutes={weeks.data.goalMinutes} />
                        </div>
                    </section>
                )}

                {slots.data && Object.values(slots.data.seconds || {}).some((value) => value > 0) && (
                    <section>
                        <Cartouche title={t('journey.record.slotsTitle')} />
                        <p className="text-sm text-text-secondary mb-4">{t('journey.record.slotsText', { days: SLOT_DAYS })}</p>
                        <SlotSplit seconds={slots.data.seconds} />
                        <SacredText moment="slotsInsight" kind="HADITH" size="sm" className="mt-5 max-w-[560px]" />
                    </section>
                )}

                <section>
                    <Cartouche title={t('journey.record.historyTitle')} />
                    <HistoryList />
                </section>

                <RetentionPanel />
            </div>
        </PageShell>
    );
}

function YearSection({ year }) {
    const numbers = [
        { value: year.activeWeeks, label: t('journey.record.activeWeeks') },
        { value: year.hours, label: t('journey.record.hours') },
        { value: year.episodes, label: t('journey.record.episodes') },
        { value: year.completions, label: t('journey.record.completions') },
    ].filter((number) => number.value > 0);
    if (!year.activeWeeks) {
        return <p className="text-sm text-text-secondary">{t('journey.record.yearEmpty')}</p>;
    }
    return (
        <div className="flex flex-col gap-6">
            <YearStars weeks={year.weeks} />
            <p className="text-sm text-text-secondary">
                {t('journey.record.yearText', { weeks: countOf('journey.units.WEEKS', year.activeWeeks) })}
            </p>
            {numbers.length > 0 && (
                <dl className="flex flex-wrap gap-x-10 gap-y-4">
                    {numbers.map((number) => (
                        // The label first for a screen reader, the number first to the eye.
                        <div key={number.label} className="flex flex-col-reverse">
                            <dt className="text-xs text-text-secondary mt-1">{number.label}</dt>
                            <dd className="font-serif text-[2rem] leading-none text-primary font-semibold">{formatCount(number.value)}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

export default JourneyRecord;
