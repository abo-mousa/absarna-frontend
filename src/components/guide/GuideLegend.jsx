import { DayStar } from '@/components/journey/DayStars';
import { weekdayName } from '@/lib/dayFormat';
import { t } from '@/i18n';

const STATES = ['FULL', 'MINIMUM', 'MADE_UP', 'REST', 'EXCUSED', 'PENDING'];
// One week that holds every symbol once, in an order a real week could have them.
const SAMPLE_WEEK = ['FULL', 'MINIMUM', 'MADE_UP', 'REST', 'FULL', 'EXCUSED', 'PENDING'];

/** Saturday to Friday of some week, as ISO days — only the weekday names are shown. */
function sampleDays() {
    const saturday = new Date(Date.UTC(2026, 0, 3));
    return SAMPLE_WEEK.map((state, i) => {
        const day = new Date(saturday.getTime() + i * 86_400_000).toISOString().slice(0, 10);
        return { day, state };
    });
}

/**
 * The day symbols, drawn by the real `DayStar` rather than photographed, so the key can never
 * disagree with the stars on the page: a sample week first — how they look together — then each
 * one large, with its name and what it means.
 */
function GuideLegend({ explain }) {
    const week = sampleDays();
    return (
        <figure className="flex flex-col gap-4">
            <div className="rounded-lg bg-bg ring-1 ring-border-light p-4">
                <ul className="grid grid-cols-7 gap-1" aria-hidden="true">
                    {week.map((day) => (
                        <li key={day.day} className="flex flex-col items-center gap-1.5">
                            <DayStar state={day.state} className="w-7 h-7" />
                            <span className="text-[0.65rem] text-text-muted">{weekdayName(day.day)}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <ul className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {STATES.map((state) => (
                    <li key={state} className="flex items-start gap-3 p-3 rounded-md border border-border-light bg-surface">
                        <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-bg">
                            <DayStar state={state} className="w-6 h-6" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">{t(`journey.legend.${state}`)}</p>
                            <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{explain(state)}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </figure>
    );
}

export default GuideLegend;
