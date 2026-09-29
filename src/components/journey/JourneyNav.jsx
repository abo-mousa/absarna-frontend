import { Link, useLocation } from 'react-router-dom';
import { t } from '@/i18n';

const ITEMS = [
    { key: 'overview', to: '/journey', exact: true },
    { key: 'goals', to: '/journey/goals' },
    { key: 'milestones', to: '/journey/milestones' },
    { key: 'reflections', to: '/journey/reflections' },
    { key: 'record', to: '/journey/record' },
];

/**
 * «طريقي»'s own places, drawn as the page header's view tabs are (`ViewTabs`) but as links — each
 * is a page with its own URL, which Back and a shared link must reach.
 *
 * <p>The strip scrolls sideways on a narrow screen, and a scroller must not overflow downwards:
 * `overflow-x-auto` makes the other axis scrollable too, so an underline hung `-bottom-px` below it
 * gave the strip one pixel of vertical scroll, and Firefox drew the platform's gold scrollbar
 * beside «السجل». So the strip itself reaches one pixel down onto the header's hairline (`-mb-px`)
 * and the underline sits at its `bottom-0` — the same place, inside the box. Its own bar is hidden,
 * as on Discover's chips: a gold bar under five words reads as a sixth tab.
 */
function JourneyNav() {
    const { pathname } = useLocation();
    const current = (item) => (item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`));
    return (
        <nav className="flex items-end gap-5 -mb-px overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t('journey.navLabel')}>
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
                        <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-0.5 bg-gold transition-opacity duration-150 ${
                            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-focus-visible:opacity-70'
                        }`} />
                    </Link>
                );
            })}
        </nav>
    );
}

export default JourneyNav;
