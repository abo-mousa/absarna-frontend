import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { usePageMeta } from '../hooks/usePageMeta';

function NotFound() {
    usePageMeta({ title: 'الصفحة غير موجودة' });

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[500px] mx-auto text-center py-20 px-5">
                <Compass size={56} className="mx-auto mb-5 text-text-muted" />
                <h1 className="text-3xl font-bold mb-2">404</h1>
                <p className="text-text-secondary mb-6">هذه الصفحة غير موجودة أو تم نقلها</p>
                <Link to="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-md font-semibold">
                    العودة للرئيسية
                </Link>
            </div>
        </PageShell>
    );
}

export default NotFound;
