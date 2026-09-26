import { Link, useLocation } from 'react-router-dom';
import { TABS, activeTab } from '@/lib/tabs';
import { t } from '@/i18n';

/**
 * The six places, as a strip under the navbar's main row on a wide screen — what replaced the
 * sidebar's column of links, which was the plainest YouTube mark on the page.
 *
 * <p>Inside the `<nav>` rather than beside it, so `Navbar`'s measurement of its own height into
 * `--navbar-h` includes the strip, and everything that sticks under the bar keeps sitting flush
 * below it. Hidden below `lg`, where `BottomTabBar` takes over. The current tab is underlined in
 * gold and carries `aria-current`.
 */
function NavTabs() {
    const { pathname } = useLocation();
    const current = activeTab(pathname);
    return (
        <nav className="hidden lg:flex items-center gap-1 px-8 border-t border-border-light" aria-label={t('nav.tabsLabel')}>
            {TABS.map((tab) => {
                const active = current === tab.key;
                return (
                    <Link
                        key={tab.key}
                        to={tab.to}
                        aria-current={active ? 'page' : undefined}
                        // The gold line under a tab is the one mark for "here": solid on the current
                        // tab, a faint preview of it under the pointer, firmer under keyboard focus
                        // (which had no mark at all). No fill or pill — the design's only accent is gold.
                        className={`group relative px-4 py-2.5 text-sm font-semibold hover:no-underline focus:outline-none transition-colors ${
                            active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary focus-visible:text-text-primary'
                        }`}
                    >
                        {t(`nav.tabs.${tab.key}`)}
                        <span aria-hidden="true" className={`absolute inset-x-4 -bottom-px h-0.5 bg-gold transition-opacity duration-150 ${
                            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-focus-visible:opacity-70'
                        }`} />
                    </Link>
                );
            })}
        </nav>
    );
}

export default NavTabs;
