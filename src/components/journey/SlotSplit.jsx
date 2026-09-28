import { SLOTS } from '@/lib/slots';
import { learningTime } from '@/lib/goalText';
import { t } from '@/i18n';

/**
 * «متى تتعلّم» — the last days' learning split by time of day: three bars, one hue, each with its
 * time beside it. A mirror, never advice: nothing suggests a slot from it (§2 decision 5).
 */
function SlotSplit({ seconds }) {
    const minutes = Object.fromEntries(SLOTS.map((slot) => [slot, Math.round((seconds?.[slot] || 0) / 60)]));
    const total = SLOTS.reduce((sum, slot) => sum + minutes[slot], 0);
    if (!total) return null;
    return (
        <ul className="flex flex-col gap-3 max-w-[560px]">
            {SLOTS.map((slot) => {
                const share = minutes[slot] / total;
                return (
                    <li key={slot} className="grid grid-cols-[6rem_minmax(0,1fr)_6rem] items-center gap-3 text-sm">
                        <span className="font-semibold">{t(`journey.slots.${slot}`)}</span>
                        <span className="h-2.5 rounded-full bg-border-light overflow-hidden" aria-hidden="true">
                            <span className="block h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
                        </span>
                        <span className="text-text-secondary text-xs">
                            {minutes[slot] ? learningTime(minutes[slot]) : '—'}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

export default SlotSplit;
