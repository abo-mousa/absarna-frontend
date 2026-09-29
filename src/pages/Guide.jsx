import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { KhatamEmblem, KhatamStar, IrisMark } from '../components/ui';
import { GUIDE_STEPS, PAGE_GUIDES, PAGE_GUIDE_ORDER } from '../components/guide';
import { GuideCard } from './GuidePage';
import { useAppBusy } from '@/hooks/useAppBusy';
import { t } from '@/i18n';

/**
 * The guide in full, as one page: the same steps the first-visit dialog walks through, for
 * whoever skipped it or wants it again (the account menu and Today's welcome link here) — and
 * below them the illustrated page guides, each a card with a picture of its page.
 */
function Guide() {
    const busy = useAppBusy();
    return (
        <PageShell contentClassName="max-w-[980px] mx-auto w-full px-4 sm:px-6 py-10">
            <header className="text-center mb-10">
                <IrisMark size="100%" state={busy ? 'turn' : 'still'} className="w-20 h-20 mx-auto mb-4" />
                <h1 className="font-serif text-[2.6rem] font-semibold leading-none">{t('guide.title')}</h1>
                <p className="text-text-secondary mt-3">{t('guide.subtitle')}</p>
            </header>

            <ol className="flex flex-col gap-4 max-w-[820px] mx-auto">
                {GUIDE_STEPS.filter((step) => step.icon).map((step) => (
                    <li key={step.key} className="flex gap-5 items-start p-5 bg-surface border border-border-light rounded-lg">
                        <KhatamEmblem icon={step.icon} size="sm" className="flex-shrink-0" />
                        <div className="min-w-0">
                            <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{t(`guide.steps.${step.key}.title`)}</h2>
                            <p className="font-reading text-text-secondary mt-1.5 leading-relaxed">{t(`guide.steps.${step.key}.text`)}</p>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                                {step.to && (
                                    <Link to={step.to} className="inline-block text-sm font-semibold">
                                        {t('guide.open', { place: t(`guide.steps.${step.key}.title`) })}
                                    </Link>
                                )}
                                {step.guide && (
                                    <a href="#page-guides" className="inline-block text-sm font-semibold text-gold-ink">{t('guide.sheet.pagesTitle')}</a>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>

            <section id="page-guides" className="mt-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-2">
                    <KhatamStar className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <h2 className="font-serif text-[1.9rem] font-semibold leading-none">{t('guide.sheet.pagesTitle')}</h2>
                    <span aria-hidden="true" className="flex-1 h-px from-border to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
                </div>
                <p className="text-text-secondary mb-6 max-w-[60ch]">{t('guide.sheet.pagesText')}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {PAGE_GUIDE_ORDER.map((id) => <li key={id}><GuideCard id={id} guide={PAGE_GUIDES[id]} /></li>)}
                </ul>
            </section>

            <footer className="text-center mt-14">
                <div className="flex items-center justify-center gap-3 mb-4" aria-hidden="true">
                    <span className="h-px w-24 bg-border" />
                    <KhatamStar className="w-5 h-5 text-gold" />
                    <span className="h-px w-24 bg-border" />
                </div>
                <Link to="/" className="inline-block px-5 py-2 bg-primary text-white rounded-md font-semibold hover:no-underline">
                    {t('guide.start')}
                </Link>
            </footer>
        </PageShell>
    );
}

export default Guide;
