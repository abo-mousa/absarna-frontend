import { PageShell, LegalDocument } from '../components/layout';
import { usePageMeta } from '../hooks/usePageMeta';
import { ar } from '@/i18n/ar';
import { t } from '@/i18n';

/**
 * The terms of use. The twin of `Privacy.jsx` in every respect — same shell, same reading column,
 * same document renderer, a different entry in `ar.legal`.
 *
 * <p>Kept as a separate route rather than one `/legal/:doc` page taking a parameter: these are two
 * documents people link to, cite and bookmark separately, and a URL that reads `/privacy` is worth
 * more than the dozen lines of JSX the parameterised version would save. It would also have to
 * decide what to render for an unknown parameter, which is a 404 branch on a page that currently
 * cannot fail.
 */
function Terms() {
    usePageMeta({
        title: t('legal.terms.title'),
        description: t('legal.terms.metaDescription'),
    });

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-10">
            <LegalDocument doc={ar.legal.terms} />
        </PageShell>
    );
}

export default Terms;
