import { CircleDashed, Newspaper } from 'lucide-react';
import { FIELDS, subjectLabel } from '@/lib/subjects';
import { learningTime } from '@/lib/goalText';
import { t } from '@/i18n';

const ICON = Object.fromEntries(FIELDS.map((field) => [field.code, field.icon]));

/**
 * «مجالاتك» — where the reader's learning time went, by field (PROGRESS-AND-GOALS.md §6.11). One
 * hue, largest first, each bar with its time beside it; news in its own row and what no owner has
 * filed yet as «غير مصنّف», last and quiet. A mirror, never advice: nothing is suggested from it.
 * The caller shows it only when the backend says enough of the time is classified.
 */
function FieldsChart({ minutes }) {
    const rows = Object.entries(minutes || {})
        .filter(([, value]) => value > 0)
        .sort(([a, x], [b, y]) => (a === 'UNCLASSIFIED') - (b === 'UNCLASSIFIED') || y - x);
    const max = Math.max(1, ...rows.map(([, value]) => value));
    if (!rows.length) return null;
    return (
        <ul className="flex flex-col gap-2.5 max-w-[640px]">
            {rows.map(([code, value]) => {
                const Icon = code === 'NEWS' ? Newspaper : code === 'UNCLASSIFIED' ? CircleDashed : ICON[code];
                const name = code === 'NEWS' ? t('journey.record.fieldsNews')
                    : code === 'UNCLASSIFIED' ? t('journey.record.fieldsUnclassified') : subjectLabel(code);
                const quiet = code === 'UNCLASSIFIED';
                return (
                    <li key={code} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm">
                        <span className={`flex items-center gap-2 min-w-0 ${quiet ? 'text-text-muted' : 'font-semibold'}`}>
                            {Icon && <Icon size={15} aria-hidden="true" className={quiet ? '' : 'text-primary'} />}
                            <span className="truncate">{name}</span>
                        </span>
                        <span className="h-2.5 rounded-full bg-border-light overflow-hidden" aria-hidden="true">
                            <span className={`block h-full rounded-full ${quiet ? 'bg-border' : 'bg-primary'}`} style={{ width: `${(value / max) * 100}%` }} />
                        </span>
                        <span className="text-xs text-text-secondary">{learningTime(value)}</span>
                    </li>
                );
            })}
        </ul>
    );
}

export default FieldsChart;
