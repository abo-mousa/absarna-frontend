import { Link } from 'react-router-dom';
import { Route } from 'lucide-react';
import PageShell from '../layout/PageShell';
import { KhatamEmblem, KhatamStar } from '../ui';
import { usePageMeta } from '../../hooks/usePageMeta';
import { t } from '@/i18n';

const POINTS = ['wird', 'road', 'private'];

/**
 * «طلب العلم» for a reader with no account. It is a tab in the phone's bar for everyone, so a visitor
 * who presses it is asking what it is — and a bounce to the login form answered with a password
 * box instead. This says what the place holds, that it is theirs alone, and how to have it; the
 * rest of «طلب العلم» (goals, milestones, the record) stays behind sign-in, since there is nothing of
 * a visitor's to show.
 */
function JourneyIntro() {
    usePageMeta({ title: t('journey.title') });
    return (
        <PageShell tab>
            <h1 className="sr-only">{t('journey.title')}</h1>
            <section className="max-w-xl mx-auto flex flex-col items-center text-center gap-5 pt-6">
                <KhatamEmblem icon={Route} />
                <h2 className="font-serif font-semibold text-[1.9rem] leading-tight">{t('journey.intro.title')}</h2>
                <p className="text-text-secondary leading-relaxed">{t('journey.intro.text')}</p>
                <ul className="flex flex-col gap-3 text-start w-full">
                    {POINTS.map((point) => (
                        <li key={point} className="flex items-start gap-3 p-4 rounded-lg border border-border-light bg-surface">
                            <KhatamStar className="w-3.5 h-3.5 mt-1.5 flex-shrink-0 text-gold" />
                            <span className="leading-relaxed">{t(`journey.intro.points.${point}`)}</span>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                    <Link to="/register" state={{ from: '/journey' }} className="px-5 py-2.5 bg-primary text-white rounded-md font-semibold hover:no-underline">
                        {t('nav.register')}
                    </Link>
                    <Link to="/login" state={{ from: '/journey' }} className="px-5 py-2.5 border border-border rounded-md bg-bg font-semibold hover:no-underline hover:border-primary">
                        {t('nav.login')}
                    </Link>
                </div>
                <Link to="/guide/journey" className="text-sm font-semibold">{t('journey.intro.guide')}</Link>
            </section>
        </PageShell>
    );
}

export default JourneyIntro;
