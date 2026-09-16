import { PageShell, LegalDocument } from '../components/layout';
import { usePageMeta } from '../hooks/usePageMeta';
import { ar } from '@/i18n/ar';
import { t } from '@/i18n';

/**
 * The privacy policy.
 *
 * <p>Thin on purpose: the document lives in `ar.legal.privacy` and `LegalDocument` renders it, so
 * a wording change — the most likely change this page will ever see — never reaches JSX. See that
 * component for why this one prose namespace is read as data instead of through `t()`.
 *
 * <p>`sidebar={false}` and `max-w-reading`: this is the reading column the app already uses for
 * articles, biographies and book pages. A privacy policy set across a 1600px desktop window is a
 * policy nobody finishes — line length is the whole difference between a long page that is read
 * and a long page that is scrolled past.
 */
function Privacy() {
    usePageMeta({
        title: t('legal.privacy.title'),
        description: t('legal.privacy.metaDescription'),
    });

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-10">
            <LegalDocument doc={ar.legal.privacy} />
        </PageShell>
    );
}

export default Privacy;
