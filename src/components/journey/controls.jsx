import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatDigits, t } from '@/i18n';

/**
 * The goal dialog's two controls. A choice is a row of chips with radio semantics — one of a few
 * named options, every one visible, which a `<select>` would hide; a number is a stepper, because
 * a portion is a small number changed by one and a keyboard on a phone for that is a detour.
 */
export function Chips({ label, options, value, onChange, className = '' }) {
    const labelId = useId();
    return (
        <div className={className}>
            {label && <p id={labelId} className="text-sm font-semibold text-text-primary mb-2">{label}</p>}
            <div role="radiogroup" aria-labelledby={label ? labelId : undefined} className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const selected = option.value === value;
                    return (
                        <button
                            key={String(option.value)}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(option.value)}
                            className={`px-3.5 py-2 rounded-md border text-sm font-semibold transition-colors text-start ${
                                selected
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-border bg-surface text-text-secondary hover:border-primary hover:text-text-primary'
                            }`}
                        >
                            {option.label}
                            {option.hint && <span className="block text-xs font-normal text-text-muted">{option.hint}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function Stepper({ label, value, onChange, min = 1, max = 500, step = 1, display }) {
    const labelId = useId();
    const set = (next) => onChange(Math.min(max, Math.max(min, next)));
    // A step larger than one moves to the next multiple, so 12 → 15 → 20, never 12 → 17.
    const down = () => set(step > 1 && value % step ? value - (value % step) : value - step);
    const up = () => set(step > 1 ? value - (value % step) + step : value + 1);
    const button = 'flex items-center justify-center w-11 h-11 rounded-md border border-border bg-surface text-text-secondary hover:border-primary hover:text-primary disabled:opacity-40 disabled:pointer-events-none';
    return (
        <div>
            <p id={labelId} className="text-sm font-semibold text-text-primary mb-2">{label}</p>
            <div className="flex items-center gap-3" role="group" aria-labelledby={labelId}>
                <button type="button" className={button} onClick={down} disabled={value <= min}
                        aria-label={t('journey.dialog.less')}>
                    <Minus size={18} aria-hidden="true" />
                </button>
                <output aria-live="polite" className="min-w-[7rem] text-center font-serif text-[1.5rem] font-semibold text-text-primary">
                    {display ? display(value) : formatDigits(String(value))}
                </output>
                <button type="button" className={button} onClick={up} disabled={value >= max}
                        aria-label={t('journey.dialog.more')}>
                    <Plus size={18} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

/** Several of a few named options — checkbox semantics, the same look as `Chips`. */
export function MultiChips({ label, options, values, onChange }) {
    const labelId = useId();
    const toggle = (value) => onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
    return (
        <div>
            <p id={labelId} className="text-sm font-semibold text-text-primary mb-2">{label}</p>
            <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const selected = values.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="checkbox"
                            aria-checked={selected}
                            onClick={() => toggle(option.value)}
                            className={`px-3.5 py-2 rounded-md border text-sm font-semibold transition-colors ${
                                selected
                                    ? 'border-primary bg-primary-light text-primary'
                                    : 'border-border bg-surface text-text-secondary hover:border-primary hover:text-text-primary'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
