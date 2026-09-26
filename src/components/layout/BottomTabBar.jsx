import { Link, useLocation } from 'react-router-dom';
import { Compass, BookOpen, MessageSquareText, Users } from 'lucide-react';
import { KhatamStar } from '../ui';
import { PHONE_TABS, activeTab } from '@/lib/tabs';
import { t } from '@/i18n';

const ICONS = {
    discover: <Compass size={20} />,
    read: <BookOpen size={20} />,
    posts: <MessageSquareText size={20} />,
    channels: <Users size={20} />,
};

/**
 * The phone's five places, at the bottom where a thumb reaches — in place of the hamburger drawer,
 * which hid every place behind one button. Today's icon is the star, the one ornament.
 *
 * <p>Fixed to the bottom with the safe-area inset added to its own padding, so it clears the
 * home indicator; `PageShell` gives the page matching bottom room so nothing sits under it.
 * Hidden from `lg`, where `NavTabs` is in the navbar.
 */
function BottomTabBar() {
    const { pathname } = useLocation();
    const current = activeTab(pathname, { phone: true });
    return (
        <nav
            aria-label={t('nav.tabsLabel')}
            className="lg:hidden fixed bottom-0 inset-x-0 z-[1000] bg-surface border-t border-border-light
                pb-[env(safe-area-inset-bottom,0px)]"
        >
            <div className="grid grid-cols-5">
                {PHONE_TABS.map((tab) => {
                    const active = current === tab.key;
                    return (
                        <Link
                            key={tab.key}
                            to={tab.to}
                            aria-current={active ? 'page' : undefined}
                            // No hover on touch; a brief tint while pressed says the tap landed.
                            className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[0.68rem] font-semibold hover:no-underline active:bg-gold-light/50 transition-colors ${
                                active ? 'text-primary' : 'text-text-muted'
                            }`}
                        >
                            {tab.key === 'today' ? <KhatamStar className="w-5 h-5" filled={active} /> : ICONS[tab.key]}
                            {t(`nav.tabs.${tab.key}`)}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default BottomTabBar;
