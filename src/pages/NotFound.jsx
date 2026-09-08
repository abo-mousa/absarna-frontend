import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { usePageMeta } from '../hooks/usePageMeta';
import { t } from '@/i18n';

function NotFound() {
    usePageMeta({ title: t('notFound.title') });

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[500px] mx-auto text-center py-20 px-5">
                <Compass size={56} className="mx-auto mb-5 text-text-muted" />
                <h1 className="text-3xl font-bold mb-2">404</h1>
                <p className="text-text-secondary mb-6">{t('notFound.description')}</p>
                <Link to="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-md font-semibold">
                    {t('common.backHome')}
                </Link>
            </div>
        </PageShell>
    );
}

export default NotFound;
