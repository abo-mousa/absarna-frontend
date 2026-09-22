import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { Upload, User, Shield, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isPlatformAdmin } from '@/lib/user';
import { useMyChannels } from '../../hooks/useChannels';
import { reshuffleFeed } from '../../hooks/useVideos';
import { IrisMark } from '../ui';
import SearchBar from './SearchBar';
import LanguageToggle from './LanguageToggle';
import { t } from '@/i18n';

const iconButtonClass = 'flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors';
const iconLabelClass = 'hidden sm:block text-[0.65rem] font-medium text-text-muted';

function Navbar({ onMenuClick, menuOpen = false }) {
    const { token, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const location = useLocation();
    const queryClient = useQueryClient();
    const navRef = useRef(null);

    /**
     * Publishes this bar's height as `--navbar-h`, which is where the sidebar sticks to.
     *
     * <p>That offset used to be the literal `60px` written in SideBar, and the bar is 61 — the
     * 60px of content plus its own bottom border. So the sidebar stuck one pixel too high and its
     * top edge painted over the bar's border the moment the page scrolled: a thin seam that moved
     * with the scroll, on every page with a sidebar.
     *
     * <p>Measured rather than corrected to 61, because the height is not a constant. The logo and
     * the wordmark change size at `sm`, the Arabic webfont arrives after first paint
     * (`display=swap`) and re-lays the line box it sits in, and an admin's extra control is a
     * taller item than the rest. A number typed here is right until any of those moves.
     */
    useEffect(() => {
        const bar = navRef.current;
        if (!bar || typeof ResizeObserver === 'undefined') return undefined;
        const publish = () => {
            // getBoundingClientRect, not offsetHeight: it is fractional, and a bar that is 60.5
            // tall rounded down is the same one-pixel seam by another route.
            document.documentElement.style.setProperty(
                '--navbar-h', `${bar.getBoundingClientRect().height}px`);
        };
        publish();
        const observer = new ResizeObserver(publish);
        observer.observe(bar);
        return () => observer.disconnect();
    }, []);

    /**
     * Clicking the wordmark while already on the home page refreshes it.
     *
     * <p>A plain `<Link to="/">` is a no-op when the current location is already `/` — React
     * Router sees the same route, nothing remounts, and the cached feed is what stays on screen.
     * So the one gesture everybody uses to mean "give me the page again" did nothing at all.
     *
     * <p>Invalidating rather than reloading: a full reload would re-download the app to refresh a
     * dozen cards. A new shuffle first, so this counts as a refresh and the end of the discover row
     * is redrawn, rather than the same videos re-fetched.
     */
    const handleLogoClick = (event) => {
        // Elsewhere in the app this is an ordinary link: navigating to `/` mounts Home, and the
        // feed is NO_CACHE, so it arrives fresh without any help from here.
        if (location.pathname !== '/') return;

        event.preventDefault();
        reshuffleFeed();
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        // reset, not invalidate, for the paginated tail. Invalidating an infinite query refetches
        // every page the visitor has already loaded and leaves them all expanded — ten requests to
        // rebuild the state they were trying to leave. Resetting drops back to the first page,
        // which is what "take me to the top of the home page" means.
        queryClient.resetQueries({ queryKey: ['videos'] });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // Anything in flight anywhere in the app. `useIsFetching` counts queries, `useIsMutating`
    // counts writes; both re-render this bar when the count crosses zero and at no other time.
    const busy = useIsFetching() + useIsMutating() > 0;

    const { data: myChannels = [] } = useMyChannels(!!token);
    const uploadLink = myChannels.length > 0 ? `/channel/${myChannels[0].slug}/manage` : '/create-channel';

    return (
        <nav ref={navRef} className="sticky top-0 z-[1000] bg-bg/95 backdrop-blur-md border-b border-border-light">
            {/* Full-bleed, NOT `max-w-[1400px] mx-auto`. Capping the row is right for a column of
                prose, and wrong for a bar whose whole content is anchored controls: past 1400px
                the cap stopped moving the logo and the account buttons outward, so on a wide
                monitor both drifted toward the middle with a growing empty margin outside them —
                the logo a third of the way in from the edge it is supposed to sit on. The row now
                spans the viewport and the padding grows with it, so the two ends stay at the two
                ends at every width. The SEARCH box is the one thing that still wants a cap, and it
                carries its own (below) rather than the bar carrying one for it. */}
            <div className="flex items-center gap-3 sm:gap-5 px-3 sm:px-6 lg:px-8 py-2.5">
                {/* 44px, and NOT pulled out to the screen edge with a negative margin.
                    `p-1.5` around a 22px icon is a 34px target, and `-mr-1` put its outer edge
                    8px from the right of the phone — which is inside the zone both Android's
                    gesture navigation and iOS Safari reserve for the system back swipe. Those
                    reserve the touch, not the pixels, so roughly the outer third of the button
                    silently did nothing and the rest worked: a button that opens the menu most
                    of the time. The row's own `px-3` is now the only inset, which keeps the
                    whole target outside that zone. */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden flex items-center justify-center w-11 h-11 rounded-md text-text-secondary hover:bg-surface-hover flex-shrink-0"
                    aria-label={t('nav.menu')}
                    aria-expanded={menuOpen}
                    aria-controls="app-sidebar"
                >
                    <Menu size={22} />
                </button>

                <Link
                    to="/"
                    onClick={handleLogoClick}
                    className="flex items-center gap-1 text-2xl sm:text-3xl font-bold text-primary flex-shrink-0"
                >
                    {/* The mark turns for as long as anything is in flight, and rests when
                        nothing is. It is the one piece of chrome on every screen, so it can say
                        "still working" for the whole app without a bar or an overlay of its own —
                        and it says it for a background refetch too, which no per-section spinner
                        covers because those only render where content is absent.

                        `turn`, never `draw`: redrawing the logo the visitor has been looking at
                        would read as the page falling apart and reassembling, dozens of times a
                        session. Mutations count as well as queries — publishing and deleting are
                        exactly when a visitor wants to see that something is happening. */}
                    <IrisMark
                        size="100%"
                        state={busy ? 'turn' : 'still'}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
                    />
                    <span className="sr-only">{t('nav.brandAlt')}</span>
                    {/* `items-center` centres BOXES, and a text box is the font's metric
                        envelope, not its ink. Markazi Text reserves 0.839em above the baseline
                        and 0.361em below it, so the box is symmetric about a point 0.233em up —
                        while «أَبْصَرْنا», fully vocalised, puts ink 0.91em up (the fatḥa over the
                        أ overshoots the font's own ascent) and only 0.24em down, for an ink
                        centre 0.333em up. The mark, centred in its own viewBox, therefore sat
                        3px below the word it stands beside. The nudge is in `em` so it holds at
                        `text-2xl` and at `sm:text-3xl` alike, and it is a transform so the
                        wordmark moves without the row growing under it. Leading cannot fix this:
                        half-leading is split evenly, so changing `line-height` moves both edges
                        of the box and leaves its centre exactly where it was. */}
                    <span className="font-serif translate-y-[0.1em]">{t('nav.brand')}</span>
                </Link>

                {/* Centred in whatever is left between the two anchored ends. `min-w-0` so this
                    flex child may shrink below its content's width instead of pushing the account
                    controls off the right edge on a narrow screen — SearchBar carries its own
                    max-width, so nothing here needs to cap it. */}
                <div className="flex-1 flex justify-center min-w-0">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={toggleTheme}
                        title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                        aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                        className={iconButtonClass}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span className={iconLabelClass}>{theme === 'dark' ? t('nav.lightShort') : t('nav.darkShort')}</span>
                    </button>

                    {/* Beside the theme toggle because it is the same kind of control: a
                        preference about this browser, stored here, that changes nothing about the
                        account or the content. */}
                    <LanguageToggle className={iconButtonClass} labelClassName={iconLabelClass} />

                    {token ? (
                        <>
                            {['CREATOR', 'CHANNEL_ADMIN', 'PLATFORM_ADMIN'].includes(user?.role) && (
                                <Link to={uploadLink} title={t('nav.upload')} aria-label={t('nav.upload')} className={iconButtonClass}>
                                    <Upload size={18} />
                                    <span className={iconLabelClass}>{t('nav.uploadShort')}</span>
                                </Link>
                            )}

                            <Link to="/profile" title={t('nav.profile')} aria-label={t('nav.profile')} className={iconButtonClass}>
                                <User size={18} />
                                <span className={iconLabelClass}>{t('nav.profileShort')}</span>
                            </Link>

                            {isPlatformAdmin(user) && (
                                <Link to="/admin" title={t('nav.adminPanel')} aria-label={t('nav.adminPanel')} className={`${iconButtonClass} bg-primary-dark text-white hover:bg-primary-dark/90`}>
                                    <Shield size={18} />
                                    <span className="hidden sm:block text-[0.65rem] font-medium text-white">{t('nav.adminShort')}</span>
                                </Link>
                            )}

                            <button onClick={logout} title={t('nav.logout')} aria-label={t('nav.logout')} className={`${iconButtonClass} bg-surface-hover border border-border`}>
                                <LogOut size={18} />
                                <span className={iconLabelClass}>{t('nav.logoutShort')}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-4 sm:px-5 py-2 bg-primary text-white rounded-full font-semibold text-sm whitespace-nowrap">
                                {t('nav.login')}
                            </Link>
                            <Link to="/register" className="hidden sm:block px-5 py-2 bg-primary-light text-primary border border-primary rounded-full font-semibold text-sm whitespace-nowrap">
                                {t('nav.register')}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
