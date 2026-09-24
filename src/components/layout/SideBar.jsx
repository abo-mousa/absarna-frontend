import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bell, History, Bookmark, Plus, Settings, Upload, Shield, LogOut, Sun, Moon, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAllChannels, useSubscriptions, useMyChannels } from '../../hooks/useChannels';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { canUpload, isPlatformAdmin, uploadPathFor } from '@/lib/user';
import LanguageToggle from './LanguageToggle';
import { t } from '@/i18n';

const navLinkClass = (active) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
        active ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary font-medium hover:bg-surface-hover'
    }`;

const channelLinkClass = (active) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-[0.85rem] mb-0.5 transition-colors ${
        active ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary font-medium hover:bg-surface-hover'
    }`;

function ChannelDot({ color, name }) {
    return (
        <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: color || '#0D6B4D' }}
        >
            {name?.charAt(0)}
        </div>
    );
}

function ChannelRow({ slug, name, color, currentChannel, onClose, manageLink }) {
    return (
        <div className="flex items-center gap-1">
            <Link
                to={`/channel/${slug}`}
                onClick={onClose}
                className={`flex-1 min-w-0 ${channelLinkClass(currentChannel === slug)}`}
            >
                <ChannelDot color={color} name={name} />
                <span dir="auto" className="truncate">{name}</span>
            </Link>
            {manageLink && (
                <Link
                    to={`/channel/${slug}/manage`}
                    onClick={onClose}
                    title={t('sidebar.manageChannel')}
                    aria-label={t('sidebar.manageChannel')}
                    className="p-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-secondary flex-shrink-0"
                >
                    <Settings size={14} />
                </Link>
            )}
        </div>
    );
}

/**
 * What the drawer carries on a phone that the navbar carries from `md` up, in drawer order.
 *
 * <p>The phone's bar keeps the menu, the logo, search and the account control, and nothing else
 * fits beside them — so everything `Navbar` marks `desktopIconButtonClass` has to be here, or it
 * is simply unreachable on a phone. Exported so that pairing is tested rather than remembered.
 *
 * <p>`register` is the exception in width: the bar hides it below `sm`, not `md`, so its row here
 * is `sm:hidden` rather than riding the group's `md:hidden`.
 */
export function phoneMenuActions(user, signedIn) {
    if (!signedIn) return ['register', 'theme', 'language'];
    return [
        ...(canUpload(user) ? ['upload'] : []),
        ...(isPlatformAdmin(user) ? ['admin'] : []),
        'theme',
        'language',
        'logout',
    ];
}

/**
 * The panel itself: a phone drawer and a desktop column, which want opposite stacking.
 *
 * <p>As a drawer it is over everything, the navbar included. As a column it sits <em>under</em> the
 * navbar, which is the element it shares a top edge with — and at the same z-index as the navbar
 * (both were 1000) that tie was broken by document order, so the column won and painted over the
 * bar as soon as the page scrolled.
 *
 * <p>`--navbar-h` is measured and published by `Navbar`; see the note there for why the `60px`
 * this used to hardcode was a pixel short of the bar, and why it cannot be a constant.
 */
const surfaceClass = `w-[240px] bg-surface border-e border-border-light py-3 overflow-y-auto flex-shrink-0
    fixed start-0 top-0 bottom-0 z-[1100]
    lg:sticky lg:top-[var(--navbar-h)] lg:h-[calc(100vh-var(--navbar-h))] lg:z-[900] outline-none`;

/**
 * @param drawerOnly the page wants no desktop column — this panel is the phone drawer and
 *        nothing else. `PageShell` passes it for every page that used to say `sidebar={false}`;
 *        see the note there for why that must not mean "no menu on a phone".
 */
function SideBar({ currentChannel, open = false, onClose, drawerOnly = false }) {
    const { token, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const asideRef = useRef(null);
    // A drawer-only panel is mounted on every reading page, auth form and dashboard in the app,
    // and on all of those it is off screen until somebody presses the hamburger. Fetching the
    // channel list, the subscriptions and the owner's channels for a panel nobody has asked for
    // would put three requests on the critical path of each of those pages. Opening the drawer
    // enables them; closing it leaves the answers in the cache, so a second open is instant.
    // Where this panel IS the desktop column it is visible from the start and fetches as before.
    const wanted = open || !drawerOnly;
    const {
        data: channelPages, isLoading: loading, hasNextPage, fetchNextPage, isFetchingNextPage,
    } = useAllChannels(wanted);
    const channels = channelPages?.pages.flatMap((page) => page.content) ?? [];
    const { data: subscriptions = [] } = useSubscriptions(!!token && wanted);
    const { data: myChannels = [] } = useMyChannels(!!token && wanted);

    // `open` is only ever true for the mobile drawer (the hamburger that sets it is `lg:hidden`,
    // and `PageShell` clears it if the viewport ever crosses into `lg` while it is up) — on
    // desktop this same <aside> is a persistent, non-modal nav rail, so the trap/dialog semantics
    // below only ever engage in the drawer case.
    useFocusTrap(open, asideRef, onClose);

    const isActive = (path) => location.pathname === path;

    const myChannelSlugs = new Set(myChannels.map((c) => c.slug));
    const visibleSubscriptions = subscriptions.filter((sub) => !myChannelSlugs.has(sub.channelSlug));
    const discoverChannels = channels.filter(
        (c) => !myChannelSlugs.has(c.slug) && !subscriptions.some((sub) => sub.channelSlug === c.slug)
    );

    return (
        <>
            {/* Above the navbar, not below it. At `z-[999]` this sat under the bar's `z-[1000]`,
                so the one strip of the page that stayed lit and fully pressable while the drawer
                claimed `aria-modal` was the strip the hamburger is in: the visitor pressed it
                again to put the menu away and nothing happened, because the press reached the
                button rather than the backdrop. Under the panel's own `z-[1100]`, and well under
                `Modal`'s `z-[2000]`, so a dialog opened from a drawer row still covers both. */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-[1050] lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                ref={asideRef}
                id="app-sidebar"
                role={open ? 'dialog' : undefined}
                aria-modal={open ? 'true' : undefined}
                aria-label={open ? t('nav.sideMenu') : undefined}
                tabIndex={-1}
                // A closed drawer is parked off the reading-start edge, not removed, so the
                // transition has something to animate — which leaves its links in the tab ring
                // and in a screen reader's reading order. That was survivable while it rendered
                // on six pages and doubled as the desktop column; now that it is on every page, a
                // drawer-only panel is inert while closed. Not applied in column mode: there
                // `!open` is the ordinary desktop state and the links have to stay reachable.
                inert={drawerOnly && !open ? '' : undefined}
                // `rtl:`/`ltr:` on the closed state is the one place a logical property cannot do
                // the work: CSS `translate` is not direction-aware and Tailwind has no logical
                // form of it, so the closed drawer has to be sent off the physical edge it is
                // pinned to. Both are core variants, keyed on the `dir` now set on `<html>`.
                //
                // `max-lg:` ON THE CLOSED STATE, and it is load-bearing rather than tidy. Tailwind
                // compiles a dir variant to `:where([dir=rtl], …)`, which adds ZERO specificity —
                // so `rtl:translate-x-full` and `lg:translate-x-0` are both single-class selectors
                // and the winner is whichever the generated stylesheet emits last. It emits the
                // dir variants after the responsive ones, so the desktop column was translated a
                // full width off the page and simply was not there. Scoping the transform to the
                // widths where a drawer EXISTS removes the race instead of betting on its outcome
                // — the same gotcha Input.jsx documents for two `pl-*` on one element.
                className={`${surfaceClass} ${drawerOnly ? 'lg:hidden' : ''}
                    transition-transform duration-200
                    ${open ? 'translate-x-0' : 'max-lg:rtl:translate-x-full max-lg:ltr:-translate-x-full'}`}
            >
                <div className="px-2 mb-4">
                    <Link to="/" onClick={onClose} className={navLinkClass(isActive('/'))}>
                        <Home size={18} />
                        {t('sidebar.home')}
                    </Link>

                    {token && (
                        <Link to="/subscriptions" onClick={onClose} className={navLinkClass(isActive('/subscriptions'))}>
                            <Bell size={18} />
                            {t('sidebar.subscriptions')}
                        </Link>
                    )}

                    {token && (
                        <Link to="/history" onClick={onClose} className={navLinkClass(isActive('/history'))}>
                            <History size={18} />
                            {t('sidebar.watchHistory')}
                        </Link>
                    )}

                    {token && (
                        <Link to="/bookmarks" onClick={onClose} className={navLinkClass(isActive('/bookmarks'))}>
                            <Bookmark size={18} />
                            {t('sidebar.bookmarks')}
                        </Link>
                    )}
                </div>

                {token && (
                    <div className="px-3 mb-4">
                        <Link
                            to="/create-channel"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-md font-semibold text-sm"
                        >
                            <Plus size={18} />
                            {t('sidebar.createChannel')}
                        </Link>
                    </div>
                )}

                {token && myChannels.length > 0 && (
                    <div className="px-2 mb-4">
                        <h4 className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                            {t('sidebar.myChannels')}
                        </h4>
                        {myChannels.map((channel) => (
                            <ChannelRow
                                key={channel.id}
                                slug={channel.slug}
                                name={channel.name}
                                color={channel.primaryColor}
                                currentChannel={currentChannel}
                                onClose={onClose}
                                manageLink
                            />
                        ))}
                    </div>
                )}

                {token && visibleSubscriptions.length > 0 && (
                    <div className="px-2 mb-4">
                        <h4 className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                            {t('sidebar.yourSubscriptions')}
                        </h4>
                        {visibleSubscriptions.map((sub) => (
                            <ChannelRow
                                key={sub.subscriptionId}
                                slug={sub.channelSlug}
                                name={sub.channelName}
                                color={sub.channelColor}
                                currentChannel={currentChannel}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}

                {/* Phone only (`md:hidden`), because from `md` up these are in the navbar and
                    showing them twice on a tablet's drawer is clutter. Above the channel lists
                    rather than at the very end: discover is unbounded and loads twenty at a time,
                    so the bottom of the drawer is somewhere a person may never scroll to. */}
                <div className="md:hidden px-2 mb-4 pt-3 border-t border-border-light">
                    {phoneMenuActions(user, !!token).map((action) => {
                        switch (action) {
                            case 'upload':
                                return (
                                    <Link key={action} to={uploadPathFor(myChannels)} onClick={onClose} className={navLinkClass(false)}>
                                        <Upload size={18} />
                                        {t('nav.upload')}
                                    </Link>
                                );
                            case 'admin':
                                return (
                                    <Link key={action} to="/admin" onClick={onClose} className={navLinkClass(isActive('/admin'))}>
                                        <Shield size={18} />
                                        {t('nav.adminPanel')}
                                    </Link>
                                );
                            case 'register':
                                return (
                                    <Link key={action} to="/register" onClick={onClose} className={`sm:hidden ${navLinkClass(isActive('/register'))}`}>
                                        <UserPlus size={18} />
                                        {t('nav.register')}
                                    </Link>
                                );
                            case 'theme':
                                return (
                                    <button key={action} type="button" onClick={toggleTheme} className={`w-full ${navLinkClass(false)}`}>
                                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                        {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                                    </button>
                                );
                            case 'language':
                                // Labelled with the language it switches TO, as in the bar.
                                return <LanguageToggle key={action} className={`w-full ${navLinkClass(false)}`} />;
                            case 'logout':
                                return (
                                    <button
                                        key={action}
                                        type="button"
                                        onClick={() => { onClose?.(); logout(); }}
                                        className={`w-full ${navLinkClass(false)}`}
                                    >
                                        <LogOut size={18} />
                                        {t('nav.logout')}
                                    </button>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>

                <div className="px-2">
                    <h4 className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                        {t('sidebar.discoverChannels')}
                    </h4>
                    {loading ? (
                        <p className="text-[0.8rem] text-text-muted px-3">{t('common.loading')}</p>
                    ) : discoverChannels.length === 0 && !hasNextPage ? (
                        <p className="text-[0.8rem] text-text-muted px-3">{t('sidebar.noOtherChannels')}</p>
                    ) : (
                        discoverChannels.map((channel) => (
                            <ChannelRow
                                key={channel.id}
                                slug={channel.slug}
                                name={channel.name}
                                color={channel.primaryColor}
                                currentChannel={currentChannel}
                                onClose={onClose}
                            />
                        ))
                    )}
                    {/* Twenty at a time. Offered even when this page filtered down to nothing
                        (every channel on it is one the viewer owns or follows), because the next
                        page may not be. */}
                    {hasNextPage && (
                        <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="w-full text-start px-3 py-1.5 text-[0.8rem] font-semibold text-primary hover:bg-surface-hover rounded-md disabled:opacity-60"
                        >
                            {isFetchingNextPage ? t('common.loading') : t('sidebar.moreChannels')}
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}

export default SideBar;
