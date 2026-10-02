import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { KhatamStar } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { uploadPathFor } from '@/lib/navigation';
import { t } from '@/i18n';

const OFFERS = ['video', 'youtube', 'books', 'posts'];
const STEPS = ['one', 'two', 'three'];

/** A section heading in the Cartouche's shape, kept local because this page's are h2s in prose. */
function SectionTitle({ children }) {
    return (
        <div className="flex items-center gap-3 mb-2">
            <KhatamStar className="w-3.5 h-3.5 flex-shrink-0 text-gold" />
            <h2 className="font-serif text-[1.75rem] font-semibold leading-none whitespace-nowrap">{children}</h2>
            <span aria-hidden="true" className="flex-1 min-w-4 h-px from-border to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
        </div>
    );
}

/**
 * `/publish` — what a channel is, for someone deciding whether to make one.
 *
 * <p>The create form was the first thing a scholar or a student saw of publishing here, so the
 * question before it — what would I get — had nowhere to be answered. Public, because the person
 * asking often has no account yet (an outreach letter may only link to a path on this site, and
 * this is the one for "publish with us"). Every sentence is a feature that exists; what is checked
 * and what is reviewed is said plainly, the YouTube import's review included.
 *
 * <p>The button follows who is reading: register for a visitor, create for an account with no
 * channel, the dashboard for an owner.
 */
function Publish() {
    usePageMeta({ title: t('publishPage.title') });
    const { token, user } = useAuth();

    const owner = !!user?.uploadChannelSlug;
    const cta = !token
        ? { to: '/register', label: t('publishPage.ctaRegister') }
        : owner
            ? { to: uploadPathFor(user), label: t('publishPage.ctaManage') }
            : { to: '/create-channel', label: t('publishPage.ctaCreate') };

    const ctaButton = (
        <Link to={cta.to} className="inline-flex items-center gap-1.5 px-6 py-3 bg-primary text-white rounded-md font-semibold hover:bg-primary-dark hover:no-underline">
            {!owner && <Plus size={18} />}
            {cta.label}
        </Link>
    );

    return (
        <PageShell contentClassName="max-w-reading mx-auto w-full px-4 sm:px-6 py-10">
            <header className="flex flex-col gap-4 pb-8 mb-8 border-b border-border-light">
                <span className="text-sm font-bold text-gold-ink">{t('publishPage.kicker')}</span>
                <h1 className="font-serif text-[2.6rem] sm:text-[3rem] font-semibold leading-[1.05]">{t('publishPage.heading')}</h1>
                <p className="font-reading text-lg text-text-secondary leading-relaxed">{t('publishPage.intro')}</p>
                <div>{ctaButton}</div>
            </header>

            <section className="mb-10">
                <SectionTitle>{t('publishPage.offersTitle')}</SectionTitle>
                <ul>
                    {OFFERS.map((key, i) => (
                        <li key={key} className="flex gap-4 py-4 border-b border-border-light">
                            <span aria-hidden="true" className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center">
                                {i + 1}
                            </span>
                            <div className="min-w-0">
                                <h3 className="font-bold">{t(`publishPage.offers.${key}.title`)}</h3>
                                <p className="font-reading text-text-secondary leading-relaxed mt-1">{t(`publishPage.offers.${key}.text`)}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="mb-10">
                <SectionTitle>{t('publishPage.stepsTitle')}</SectionTitle>
                <ol className="flex flex-col gap-3 mt-4">
                    {STEPS.map((key, i) => (
                        <li key={key} className="flex gap-3 items-baseline">
                            <span aria-hidden="true" className="font-serif text-[1.6rem] font-bold text-gold-ink w-5 flex-shrink-0">{i + 1}</span>
                            <span className="font-reading leading-relaxed">{t(`publishPage.steps.${key}`)}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="mb-10 p-5 sm:p-6 bg-surface border border-border rounded-lg">
                <h2 className="font-serif text-[1.5rem] font-semibold leading-tight">{t('publishPage.checksTitle')}</h2>
                <p className="font-reading text-text-secondary leading-relaxed mt-2">{t('publishPage.checksText')}</p>
            </section>

            <section className="p-6 sm:p-8 bg-primary-light rounded-lg flex flex-col items-start gap-3">
                <h2 className="font-serif text-[1.8rem] font-semibold leading-tight text-text-primary">{t('publishPage.readyTitle')}</h2>
                <p className="font-reading text-text-secondary leading-relaxed">{t('publishPage.readyText')}</p>
                {ctaButton}
            </section>
        </PageShell>
    );
}

export default Publish;
