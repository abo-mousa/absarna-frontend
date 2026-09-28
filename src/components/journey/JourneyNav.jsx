import { Link, useLocation } from 'react-router-dom';
import { t } from '@/i18n';

const ITEMS = [
    { key: 'overview', to: '/journey', exact: true },
    { key: 'goals', to: '/journey/goals' },
    { key: 'milestones', to: '/journey/milestones' },
    { key: 'record', to: '/journey/record' },
];

/**
 * «مسيرتي»'s own places, drawn as the page header's view tabs are (`ViewTabs`) but as links — each
 * is a page with its own URL, which Back and a shared link must reach.
 */
function JourneyNav() {
    const { pathname } = useLocation();
    const current = (item) => (item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`));
    return (
        <nav className="flex items-end gap-5 overflow-x-auto" aria-label={t('journey.navLabel')}>
            {ITEMS.map((item) => {
                const active = current(item);
                return (
                    <Link
                        key={item.key}
                        to={item.to}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative pb-2.5 text-sm font-semibold whitespace-nowrap hover:no-underline focus:outline-none transition-colors ${
                            active ? 'text-text-primary' : 'text-text-muted hover:text-text-primary focus-visible:text-text-primary'
                        }`}
                    >
                        {t(`journey.nav.${item.key}`)}
                        <span aria-hidden="true" className={`absolute inset-x-0 -bottom-px h-0.5 bg-gold transition-opacity duration-150 ${
                            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-focus-visible:opacity-70'
                        }`} />
                    </Link>
                );
            })}
        </nav>
    );
}

export default JourneyNav;
