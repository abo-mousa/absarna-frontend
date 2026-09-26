import { Link, useLocation } from 'react-router-dom';
import { activeTab } from '@/lib/tabs';
import { t } from '@/i18n';

/**
 * «الكتب | المقالات» at the top of both pages, below `lg`.
 *
 * <p>The phone's bottom bar folds Books and Articles into one «اقرأ» item that opens Books, and
 * the navbar strip that names both is `lg`-only — so on a phone or a tablet the Articles list had
 * no way in at all. This is that way in, drawn as ViewTabs are (words, a gold underline on the
 * header's hairline), but as links: each is a page with its own address, not a view of one.
 */
function ReadSwitch() {
    const { pathname } = useLocation();
    const current = activeTab(pathname);
    const items = [
        { key: 'books', to: '/books' },
        { key: 'articles', to: '/articles' },
    ];
    return (
        <nav className="flex items-end gap-5" aria-label={t('nav.tabs.read')}>
            {items.map((item) => {
                const active = current === item.key;
                return (
                    <Link
                        key={item.key}
                        to={item.to}
                        aria-current={active ? 'page' : undefined}
                        className={`relative pb-2.5 text-sm font-semibold hover:no-underline transition-colors ${
                            active ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
                        }`}
                    >
                        {t(`nav.tabs.${item.key}`)}
                        {active && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-gold" />}
                    </Link>
                );
            })}
        </nav>
    );
}

export default ReadSwitch;
