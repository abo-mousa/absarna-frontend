import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowBack, ArrowForward } from '@/components/ui/DirectionalIcon';
import PageShell from '../components/layout/PageShell';
import { KhatamEmblem } from '../components/ui';
import { PAGE_GUIDES, PAGE_GUIDE_ORDER, PageGuideContent, guideBySlug, shotMeta, shotSrc } from '../components/guide';
import { useTheme } from '../contexts/ThemeContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

/** The first picture a guide shows — its card's cover on the guide index. */
function coverOf(guide) {
    const block = guide.blocks.find((candidate) => candidate.shot || candidate.shots);
    return block?.shot || block?.shots?.[0] || null;
}

/**
 * A page guide as a card: a slice of its first screenshot as the cover, the page's glyph on it,
 * and the page's name and one line under it.
 */
export function GuideCard({ id, guide }) {
    const theme = useTheme()?.theme;
    const cover = coverOf(guide);
    const meta = cover ? shotMeta(cover) : null;
    return (
        <Link
            to={`/guide/${guide.slug}`}
            className="group flex flex-col h-full rounded-lg border border-border-light bg-surface overflow-hidden text-text-primary hover:no-underline hover:border-gold transition-colors"
        >
            <div className="relative h-40 bg-bg overflow-hidden border-b border-border-light">
                {meta && (
                    <img
                        src={shotSrc(cover, meta.locale, theme, meta.ext)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-x-4 top-4 w-[calc(100%-2rem)] h-auto rounded-md ring-1 ring-border-light shadow-md transition-transform duration-300 group-hover:-translate-y-1"
                    />
                )}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-bg to-transparent" />
            </div>
            <div className="flex items-start gap-3 p-4">
                <KhatamEmblem icon={guide.icon} size="sm" className="flex-shrink-0 -mt-10 bg-surface rounded-full" />
                <div className="min-w-0">
                    <h3 className="font-serif text-[1.45rem] font-semibold leading-tight">{t(`guide.pages.${id}.title`)}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed mt-1 line-clamp-3">{t(`guide.pages.${id}.lede`)}</p>
                </div>
            </div>
        </Link>
    );
}

/**
 * One page guide as a page of its own (`/guide/:slug`): the same blocks the sheet at the page's end
 * shows, with room — the words beside the picture — for reading before ever opening the
 * page, or for sending to someone.
 */
function GuidePage() {
    const { slug } = useParams();
    const id = guideBySlug(slug);
    const guide = id ? PAGE_GUIDES[id] : null;
    usePageMeta({ title: guide ? t('guide.sheet.pageTitle', { page: t(`guide.pages.${id}.title`) }) : t('guide.title') });
    if (!guide) return <Navigate to="/guide" replace />;
    const others = PAGE_GUIDE_ORDER.filter((other) => other !== id);

    return (
        <PageShell contentClassName="max-w-[1100px] mx-auto w-full px-4 sm:px-6 py-8">
            <Link to="/guide#page-guides" className="inline-flex items-center gap-1.5 text-sm font-semibold mb-8">
                <ArrowBack size={16} /> {t('guide.title')}
            </Link>

            <header className="flex flex-col sm:flex-row sm:items-center gap-5 pb-8 mb-10 border-b border-border">
                <KhatamEmblem icon={guide.icon} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gold-ink">{t('guide.sheet.kicker')}</p>
                    <h1 className="font-serif text-[2.8rem] font-semibold leading-none mt-1">{t(`guide.pages.${id}.title`)}</h1>
                    <p className="text-text-secondary leading-relaxed mt-3 max-w-[62ch]">{t(`guide.pages.${id}.lede`)}</p>
                </div>
                <Link
                    to={guide.openHere === false ? guide.to : `${guide.to}?guide=1`}
                    className="self-start sm:self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-white font-semibold hover:no-underline"
                >
                    {t('guide.sheet.openPage')} <ArrowForward size={16} />
                </Link>
            </header>

            <PageGuideContent id={id} layout="page" />

            <section className="mt-16 pt-10 border-t border-border">
                <h2 className="font-serif text-[1.9rem] font-semibold mb-6">{t('guide.sheet.otherGuides')}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {others.map((other) => <li key={other}><GuideCard id={other} guide={PAGE_GUIDES[other]} /></li>)}
                </ul>
            </section>
        </PageShell>
    );
}

export default GuidePage;
