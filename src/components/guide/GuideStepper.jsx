import { useRef, useState } from 'react';
import { ChevronBack, ChevronForward } from '@/components/ui/DirectionalIcon';
import { shotMeta, shotSrc } from './guideShotMeta';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDigits, isRtl, t } from '@/i18n';

/**
 * A few screenshots stepped through, in a phone-sized frame — how a dialog goes from its first
 * question to its last. The strip above the frame is drawn as the dialog draws its own steps (a
 * gold bar per step reached, the step's name under it), so the reader recognises it when they
 * open the real thing. Swipe, the arrows, or a step's name moves it.
 *
 * <p>Every picture is mounted and cross-faded rather than swapped, so a step never flashes empty
 * while its image loads; the frame takes the tallest picture's shape so nothing jumps.
 */
function GuideStepper({ shots, steps }) {
    const theme = useTheme()?.theme;
    const [index, setIndex] = useState(0);
    const press = useRef(null);
    const metas = shots.map(shotMeta).filter(Boolean);
    if (!metas.length) return null;
    const tallest = metas.reduce((best, meta) => (meta.h / meta.w > best.h / best.w ? meta : best));
    const last = metas.length - 1;
    const go = (to) => setIndex(Math.max(0, Math.min(last, to)));
    const step = steps[index] || {};

    // A swipe towards the reading start goes forward: leftwards in English, rightwards in Arabic.
    const onPointerDown = (event) => { press.current = event.clientX; };
    const onPointerUp = (event) => {
        if (press.current == null) return;
        const dx = event.clientX - press.current;
        press.current = null;
        if (Math.abs(dx) < 40) return;
        go(index + ((dx < 0) !== isRtl() ? 1 : -1));
    };

    return (
        <figure className="flex flex-col gap-4">
            <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${metas.length}, minmax(0, 1fr))` }}>
                {steps.slice(0, metas.length).map((item, i) => (
                    <li key={item.title}>
                        <button
                            type="button"
                            onClick={() => go(i)}
                            aria-current={i === index ? 'step' : undefined}
                            className="w-full flex flex-col gap-1.5 text-start group"
                        >
                            <span className={`h-1 rounded-full transition-colors ${i <= index ? 'bg-gold' : 'bg-border-light group-hover:bg-border'}`} />
                            <span className={`text-xs font-semibold ${i === index ? 'text-text-primary' : 'text-text-muted'}`}>{item.title}</span>
                        </button>
                    </li>
                ))}
            </ol>

            <div className="relative rounded-lg bg-bg ring-1 ring-border-light px-3 py-4">
                <span className="absolute -top-2.5 end-3 z-10 px-2 py-0.5 rounded-sm border border-border-light bg-surface text-[0.65rem] font-semibold text-text-muted">
                    {t('guide.sheet.example')}
                </span>
                <div
                    className="relative mx-auto w-[min(100%,16.5rem)] rounded-xl bg-surface ring-1 ring-border p-1.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.45)] touch-pan-y select-none"
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => { press.current = null; }}
                >
                    <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: `${tallest.w} / ${tallest.h}` }}>
                        {metas.map((meta, i) => (
                            <img
                                key={shots[i]}
                                src={shotSrc(shots[i], meta.locale, theme, meta.ext)}
                                alt=""
                                width={meta.w}
                                height={meta.h}
                                loading="lazy"
                                decoding="async"
                                draggable="false"
                                className={`absolute inset-x-0 top-0 w-full h-auto transition-opacity duration-300 ${i === index ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => go(index - 1)}
                    disabled={index === 0}
                    aria-label={t('guide.sheet.previous')}
                    className="absolute start-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface border border-border-light shadow-sm flex items-center justify-center text-text-secondary hover:text-primary disabled:opacity-0 transition-opacity"
                >
                    <ChevronBack size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => go(index + 1)}
                    disabled={index === last}
                    aria-label={t('guide.sheet.next')}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface border border-border-light shadow-sm flex items-center justify-center text-text-secondary hover:text-primary disabled:opacity-0 transition-opacity"
                >
                    <ChevronForward size={18} />
                </button>
            </div>

            <figcaption className="flex items-start gap-3" aria-live="polite">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-gold text-gold-ink font-numeral font-bold text-[0.95rem] leading-none" aria-hidden="true">
                    {formatDigits(index + 1)}
                </span>
                <div>
                    <p className="sr-only">{t('guide.sheet.stepOf', { step: index + 1, total: metas.length })}</p>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed mt-0.5">{step.text}</p>
                </div>
            </figcaption>
        </figure>
    );
}

export default GuideStepper;
