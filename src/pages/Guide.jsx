import { Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { KhatamEmblem, KhatamStar, IrisMark } from '../components/ui';
import { GUIDE_STEPS } from '../components/guide';
import { t } from '@/i18n';

/**
 * The guide in full, as one page: the same steps the first-visit dialog walks through, for
 * whoever skipped it or wants it again (the account menu and Today's welcome link here).
 */
function Guide() {
    return (
        <PageShell contentClassName="max-w-[820px] mx-auto w-full px-4 sm:px-6 py-10">
            <header className="text-center mb-10">
                <IrisMark size="100%" state="draw" className="w-20 h-20 mx-auto mb-4" />
                <h1 className="font-serif text-[2.6rem] font-semibold leading-none">{t('guide.title')}</h1>
                <p className="text-text-secondary mt-3">{t('guide.subtitle')}</p>
            </header>

            <ol className="flex flex-col gap-4">
                {GUIDE_STEPS.filter((step) => step.icon).map((step) => (
                    <li key={step.key} className="flex gap-5 items-start p-5 bg-surface border border-border-light rounded-lg">
                        <KhatamEmblem icon={step.icon} size="sm" className="flex-shrink-0" />
                        <div className="min-w-0">
                            <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{t(`guide.steps.${step.key}.title`)}</h2>
                            <p className="font-reading text-text-secondary mt-1.5 leading-relaxed">{t(`guide.steps.${step.key}.text`)}</p>
                            {step.to && (
                                <Link to={step.to} className="inline-block mt-2 text-sm font-semibold">
                                    {t('guide.open', { place: t(`guide.steps.${step.key}.title`) })}
                                </Link>
                            )}
                        </div>
                    </li>
                ))}
            </ol>

            <footer className="text-center mt-10">
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
