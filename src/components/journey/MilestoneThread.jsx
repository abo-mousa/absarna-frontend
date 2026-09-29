import { useEffect, useRef, useState } from 'react';
import { KHATAM_POINTS } from '@/lib/khatam';
import { stepLabel } from '@/lib/journey';
import { formatCount } from '@/lib/numbers';
import { currentLocaleInfo, isRtl, t } from '@/i18n';

/**
 * «المنازل» as one thread of stars (product owner, 2026-09-28): it runs along a row in the reading
 * direction, turns down, and comes back — a story rather than a list. Each manzila is a big star
 * with small ones before it, and the small ones are its steps, named in what was learned («ربع
 * ختمة», «٢٥٠ صفحة»), never in time. The backend decides both the steps and the order (reached
 * first, as they were reached, then the nearest ahead); this only draws them.
 *
 * <p>Calm on purpose: one thin grey line, flat colours — teal for a step behind the reader, grey
 * for one ahead, gold for a manzila reached — no glow, no motion. The same story is an ordered list
 * for a screen reader; the picture is hidden from it.
 */
const NARROW = 560;

function reachedNote(milestone) {
    if (milestone.reachedAt) {
        const date = new Date(milestone.reachedAt);
        // The year only when it is not this one: «١١ مايو» is enough for this year's.
        const options = date.getFullYear() === new Date().getFullYear()
            ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' };
        return t('journey.milestones.reachedOn', {
            date: new Intl.DateTimeFormat(currentLocaleInfo().numberFormat, options).format(date),
        });
    }
    // A manzila reached in one move has no «٠ من ١» to show; it says what it is instead.
    if (milestone.threshold === 1) return t(`journey.milestones.about.${milestone.code}`);
    return t('journey.milestones.along', {
        current: formatCount(Math.min(milestone.current, milestone.threshold)),
        threshold: formatCount(milestone.threshold),
    });
}

function MilestoneThread({ milestones }) {
    const host = useRef(null);
    // A first guess from the window, so a phone does not draw the wide thread first and then redraw.
    const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < NARROW);
    useEffect(() => {
        const element = host.current;
        if (!element || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    if (!milestones?.length) return null;
    const nodes = [];
    for (const milestone of milestones) {
        for (const step of milestone.steps || []) nodes.push({ step, milestone, done: step.reached });
        nodes.push({ milestone, done: !!milestone.reachedAt });
    }
    const here = nodes.findIndex((node) => !node.done);

    // Geometry in viewBox units; a phone gets a narrower box and three to a row, so its text stays legible.
    const cols = narrow ? 3 : 7;
    const width = narrow ? 600 : 1000;
    const pad = narrow ? 110 : 80;
    const rowH = narrow ? 200 : 160;
    const top = 60;
    const gap = (width - 2 * pad) / (cols - 1);
    const rows = Math.ceil(nodes.length / cols);
    const height = top + (rows - 1) * rowH + 100;
    const rtl = isRtl();
    const pos = nodes.map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        // The first row runs with the reading direction; each next row comes back.
        const fromStart = row % 2 === 0;
        const along = pad + col * gap;
        const x = fromStart === rtl ? width - along : along;
        return { x, y: top + row * rowH };
    });
    let path = `M${pos[0].x},${pos[0].y}`;
    for (let i = 1; i < pos.length; i++) {
        const a = pos[i - 1];
        const b = pos[i];
        if (a.y === b.y) {
            path += ` L${b.x},${b.y}`;
        } else {
            const bulge = (a.x > width / 2 ? 1 : -1) * (narrow ? 80 : 55);
            path += ` C${a.x + bulge},${a.y} ${b.x + bulge},${b.y} ${b.x},${b.y}`;
        }
    }
    const font = narrow ? { name: 27, note: 19, step: 23, here: 20 } : { name: 16, note: 12, step: 12, here: 12 };
    const reachedCount = milestones.filter((milestone) => milestone.reachedAt).length;

    return (
        <figure ref={host} data-guide="thread" className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-hidden="true" focusable="false">
                <defs>
                    <symbol id="milestone-star" viewBox="6 6 88 88"><polygon points={KHATAM_POINTS} /></symbol>
                </defs>
                <path d={path} fill="none" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
                {nodes.map((node, index) => {
                    const { x, y } = pos[index];
                    if (node.step) {
                        const r = narrow ? 18 : 9;
                        return (
                            <g key={`${node.milestone.code}-${node.step.value}`}>
                                <use href="#milestone-star" x={x - r} y={y - r} width={2 * r} height={2 * r}
                                     className={node.done ? 'fill-primary/60' : 'fill-border-light stroke-border'}
                                     strokeWidth={node.done ? 0 : 4} />
                                <text x={x} y={y + r + (narrow ? 30 : 17)} textAnchor="middle" fontSize={font.step}
                                      className={node.done ? 'fill-primary' : 'fill-text-muted'}>
                                    {stepLabel(node.step)}
                                </text>
                            </g>
                        );
                    }
                    const r = narrow ? 24 : 16;
                    return (
                        <g key={node.milestone.code}>
                            <use href="#milestone-star" x={x - r} y={y - r} width={2 * r} height={2 * r}
                                 className={node.done ? 'fill-gold' : 'fill-surface stroke-border'}
                                 strokeWidth={node.done ? 0 : 5} />
                            <text x={x} y={y + r + (narrow ? 30 : 20)} textAnchor="middle" fontSize={font.name} fontWeight="600"
                                  className={`font-serif ${node.done ? 'fill-gold-ink' : 'fill-text-secondary'}`}>
                                {t(`journey.milestones.names.${node.milestone.code}`)}
                            </text>
                            <text x={x} y={y + r + (narrow ? 54 : 38)} textAnchor="middle" fontSize={font.note} className="fill-text-muted">
                                {reachedNote(node.milestone)}
                            </text>
                        </g>
                    );
                })}
                {here >= 0 && (
                    <g>
                        <circle cx={pos[here].x} cy={pos[here].y} r={narrow ? 30 : 16} fill="none" className="stroke-primary"
                                strokeWidth="1.5" opacity="0.45" />
                        <text x={pos[here].x} y={pos[here].y - (narrow ? 38 : 24)} textAnchor="middle" fontSize={font.here}
                              fontWeight="600" className="fill-primary">
                            {t('journey.milestones.here')}
                        </text>
                    </g>
                )}
            </svg>
            <figcaption className="sr-only">
                {t('journey.milestones.threadAria', { reached: reachedCount, total: milestones.length })}
            </figcaption>
            <ol className="sr-only">
                {milestones.map((milestone) => (
                    <li key={milestone.code}>
                        {(milestone.steps || []).map((step) => (
                            <span key={step.value}>
                                {t('journey.milestones.stepOf', {
                                    name: t(`journey.milestones.names.${milestone.code}`),
                                    step: stepLabel(step),
                                })} — {step.reached ? t('journey.milestones.stepReached') : t('journey.milestones.stepAhead')}.{' '}
                            </span>
                        ))}
                        {t(`journey.milestones.names.${milestone.code}`)}: {t(`journey.milestones.about.${milestone.code}`)}. {reachedNote(milestone)}.
                    </li>
                ))}
            </ol>
        </figure>
    );
}

export default MilestoneThread;
