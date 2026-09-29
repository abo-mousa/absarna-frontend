import { Link } from 'react-router-dom';
import { ChevronDown, LocateFixed } from 'lucide-react';
import { KhatamStar } from '../ui/Khatam';
import GuideShot from './GuideShot';
import GuideStepper from './GuideStepper';
import GuideLegend from './GuideLegend';
import { PAGE_GUIDES, blockKey } from './pageGuides';
import { formatDigits, t, tOptional } from '@/i18n';

const numbered = (key, count) => Array.from({ length: count }, (_, i) => t(`${key}.${i + 1}`));

/** A block's picture: a screenshot, a stepped dialog, or the live symbol key. */
function Visual({ id, block }) {
    const key = blockKey(id, block);
    switch (block.type) {
        case 'shot':
            return <GuideShot name={block.shot} captions={numbered(`${key}.marks`, block.marks)} cut={block.cut} />;
        case 'steps':
            return (
                <GuideStepper
                    shots={block.shots}
                    steps={block.shots.map((_, i) => ({ title: t(`${key}.steps.${i + 1}.title`), text: t(`${key}.steps.${i + 1}.text`) }))}
                />
            );
        case 'legend':
            return <GuideLegend explain={(state) => t(`${key}.states.${state}`)} />;
        default:
            return null;
    }
}

/**
 * One block's way to the real thing: «أرِني في الصفحة» when its part of the page is on screen, and
 * when it is not — the page hides sections until they hold something — when it will appear, so a
 * new reader learns the section exists before they have earned it.
 */
function BlockAction({ id, block, available, onShowMe }) {
    const key = blockKey(id, block);
    if (block.anchor && available?.(block.anchor)) {
        return (
            <button
                type="button"
                onClick={() => onShowMe({ anchor: block.anchor, title: t(`${key}.title`) })}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-primary/40 text-sm font-semibold text-primary hover:bg-primary-light/60 transition-colors"
            >
                <LocateFixed size={16} strokeWidth={1.75} />
                {t('guide.sheet.showMe')}
            </button>
        );
    }
    const appears = tOptional(`${key}.appears`);
    if (block.anchor && available && appears) {
        return (
            <p className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-md border border-dashed border-border text-sm text-text-secondary">
                <KhatamStar filled={false} strokeWidth={9} className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold" />
                <span><span className="font-semibold text-text-primary">{t('guide.sheet.notYet')}</span> — {appears}</span>
            </p>
        );
    }
    if (block.to) {
        return (
            <Link to={block.to} className="inline-flex text-sm font-semibold">
                {t('guide.open', { place: t('guide.steps.today.title') })}
            </Link>
        );
    }
    return null;
}

/**
 * A page guide's body — shared by the sheet a page opens (`layout="sheet"`, one column) and the
 * full page at `/guide/:slug` (`layout="page"`, words beside the picture). `available(anchor)`
 * says whether a part of the page is on screen now; the full page passes nothing, since the page
 * it describes is not the one open.
 */
function PageGuideContent({ id, layout = 'sheet', available = null, onShowMe = null }) {
    const guide = PAGE_GUIDES[id];
    const page = layout === 'page';
    return (
        <div className={`flex flex-col ${page ? 'gap-14' : 'gap-10'}`}>
            <nav aria-label={t('guide.sheet.contents')}>
                <ol className="flex flex-wrap gap-2">
                    {guide.blocks.map((block, index) => (
                        <li key={block.key}>
                            <a
                                href={`#guide-${id}-${block.key}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    document.getElementById(`guide-${id}-${block.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-light bg-surface text-xs font-semibold text-text-secondary hover:border-gold hover:text-text-primary hover:no-underline"
                            >
                                <span className="font-numeral text-gold-ink">{formatDigits(index + 1)}</span>
                                {t(`${blockKey(id, block)}.title`)}
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>

            {guide.blocks.map((block, index) => {
                const key = blockKey(id, block);
                return (
                    <section
                        key={block.key}
                        id={`guide-${id}-${block.key}`}
                        // The page sits under the ~60px sticky navbar (see LegalDocument); the sheet
                        // scrolls on its own, so it needs only air above the heading.
                        className={`${page ? 'scroll-mt-28' : 'scroll-mt-6'} ${page ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] gap-6 lg:gap-12 items-start' : 'flex flex-col gap-4'}`}
                    >
                        <div className={`flex flex-col gap-3 ${page ? 'lg:sticky lg:top-24' : ''}`}>
                            <h3 className="flex items-center gap-3">
                                <span className="relative flex-shrink-0 w-8 h-8 inline-flex items-center justify-center">
                                    <KhatamStar className="absolute inset-0 w-full h-full text-gold/15" />
                                    <KhatamStar filled={false} strokeWidth={5} className="absolute inset-0 w-full h-full text-gold" />
                                    <span className="relative font-numeral font-bold text-[0.95rem] text-gold-ink leading-none">{formatDigits(index + 1)}</span>
                                </span>
                                <span className={`font-serif font-semibold leading-tight ${page ? 'text-[1.9rem]' : 'text-[1.5rem]'}`}>{t(`${key}.title`)}</span>
                            </h3>
                            <p className="text-text-secondary leading-relaxed">{t(`${key}.text`)}</p>
                            {page && <BlockAction id={id} block={block} available={available} onShowMe={onShowMe} />}
                        </div>
                        <div className="flex flex-col gap-4 min-w-0">
                            <Visual id={id} block={block} />
                            {!page && (
                                <div><BlockAction id={id} block={block} available={available} onShowMe={onShowMe} /></div>
                            )}
                        </div>
                    </section>
                );
            })}

            {guide.faq.length > 0 && (
                <section className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-3 mb-1">
                        <KhatamStar className="w-3.5 h-3.5 text-gold" />
                        <span className={`font-serif font-semibold ${page ? 'text-[1.9rem]' : 'text-[1.5rem]'}`}>{t('guide.sheet.questions')}</span>
                    </h3>
                    <div className="divide-y divide-border-light rounded-lg border border-border-light bg-surface overflow-hidden">
                        {guide.faq.map((question) => (
                            <details key={question} className="group">
                                <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none font-semibold hover:bg-surface-hover [&::-webkit-details-marker]:hidden">
                                    {t(`guide.pages.${id}.faq.${question}.q`)}
                                    <ChevronDown size={18} className="flex-shrink-0 text-text-muted transition-transform group-open:rotate-180" />
                                </summary>
                                <p className="px-4 pb-4 text-sm text-text-secondary leading-relaxed">{t(`guide.pages.${id}.faq.${question}.a`)}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

export default PageGuideContent;
