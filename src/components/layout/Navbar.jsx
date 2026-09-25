import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { Upload, Sun, Moon, Search, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { canUpload, isPlatformAdmin, uploadPathFor } from '@/lib/user';
import { useAdminAttention, badgeText } from '@/hooks/useAdminAttention';
import { useMyChannels } from '../../hooks/useChannels';
import { reshuffleFeed } from '../../hooks/useVideos';
import { IrisMark } from '../ui';
import SearchBar from './SearchBar';
import LanguageToggle from './LanguageToggle';
import AccountMenu from './AccountMenu';
import NavTabs from './NavTabs';
import { t } from '@/i18n';
import { formatHijriDate } from '@/lib/datetime';

const iconButtonShape = 'flex-col items-center justify-center gap-0.5 min-w-[50px] px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors';
/**
 * The buttons a phone does not get in the bar: a creator's upload, and a visitor's theme and
 * language.
 *
 * <p>One row with no wrapping, and only the search box allowed to shrink — so below `md` the
 * fixed-width controls took every pixel and the search box was squeezed to nothing. On a phone a
 * signed-in account finds upload in `AccountMenu` (its row there is `md:hidden`, the exact
 * complement of this), and a visitor finds theme, language, sign-in and registration in the
 * same menu, which is phone-only for a visitor. Everything else about an account is in
 * `AccountMenu` at every width.
 */
const desktopIconButtonClass = `hidden md:flex ${iconButtonShape}`;
const iconLabelClass = 'hidden sm:block text-[0.65rem] font-medium text-text-muted';

function Navbar() {
    const { token, user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const location = useLocation();
    const queryClient = useQueryClient();
    const navRef = useRef(null);
    const searchButtonRef = useRef(null);

    /**
     * The phone's search: an icon in the bar that opens a full-width search row over it.
     *
     * <p>There is no width at which a phone fits the logo, the menu, the account control AND a
     * usable search box in one row, and the box is the one item that must not be cramped — so on
     * a phone it gets the whole row, when asked for. Closed again by any navigation (a search or a
     * suggestion lands on a new location), which is adjusted during render rather than in an
     * effect for the reason `SearchBar` gives: an effect would paint the overlay over the page it
     * just navigated to for one frame.
     */
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchOpenedAt, setSearchOpenedAt] = useState(location.key);
    if (searchOpen && location.key !== searchOpenedAt) {
        setSearchOpen(false);
    }
    const openSearch = () => {
        setSearchOpenedAt(location.key);
        setSearchOpen(true);
    };
    const closeSearch = () => {
        setSearchOpen(false);
        // Back to the control that opened it, so a keyboard or screen-reader user is not dropped
        // at the top of the document.
        searchButtonRef.current?.focus();
    };

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
    const { data: attention } = useAdminAttention();
    const attentionCount = attention?.total ?? 0;
    const uploadLink = uploadPathFor(myChannels);
    const [hijriDate] = useState(() => formatHijriDate());

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

                <Link
                    to="/"
                    onClick={handleLogoClick}
                    className="flex items-center gap-1 text-2xl sm:text-3xl font-bold text-[rgb(var(--color-wordmark))] flex-shrink-0"
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
                {/* Below `md` the box is not in the row at all (the search icon below opens it
                    as an overlay), and this div stays as the spacer that keeps the account
                    controls at the far end. */}
                <div className="flex-1 flex justify-center min-w-0">
                    <div className="hidden md:flex w-full justify-center">
                        <SearchBar />
                    </div>
                </div>

                {/* Today's Hijri date, where a video site puts nothing. Wide screens only: the
                    bar's ends are anchored and the search box already gives way first, and a date
                    is the one item here nobody needs in order to use the page. Read once per
                    mount rather than per render (the bar re-renders on every fetch through
                    `busy`); a tab left open across midnight shows yesterday's until the next
                    load, which is the same staleness the day-stable feed already has. */}
                {hijriDate && (
                    <span className="hidden xl:block flex-shrink-0 text-xs font-semibold text-text-secondary whitespace-nowrap">
                        {hijriDate}
                    </span>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        ref={searchButtonRef}
                        type="button"
                        onClick={openSearch}
                        aria-label={t('searchBar.label')}
                        aria-expanded={searchOpen}
                        className="md:hidden flex items-center justify-center w-11 h-11 rounded-md text-text-secondary hover:bg-surface-hover"
                    >
                        <Search size={20} />
                    </button>

                    {token ? (
                        <>
                            {/* The one account control that stays a button of its own on a wide
                                screen: it is what a creator comes back to do. On a phone there is
                                no room, and it is in the avatar's menu instead. */}
                            {canUpload(user) && (
                                <Link to={uploadLink} title={t('nav.upload')} aria-label={t('nav.upload')} className={desktopIconButtonClass}>
                                    <Upload size={18} />
                                    <span className={iconLabelClass}>{t('nav.uploadShort')}</span>
                                </Link>
                            )}

                            {/* A platform admin's panel, beside upload from `md` up: only admins see
                                it, so nobody else's bar is busier, and it is the page they open
                                most. The badge is what is waiting on them — channels to review,
                                findings for a reviewer, open reports — which until now nothing
                                announced. On a phone it stays in the account menu, badge included. */}
                            {isPlatformAdmin(user) && (
                                <Link
                                    to="/admin"
                                    title={t('nav.adminPanel')}
                                    aria-label={attentionCount
                                        ? t('nav.adminPanelWaiting', { count: attentionCount })
                                        : t('nav.adminPanel')}
                                    // The same plain face as its neighbours — a solid block between two
                                    // outline icons read as out of place, and the badge is what does the
                                    // job of drawing the eye now.
                                    className={`${desktopIconButtonClass} relative`}
                                >
                                    <Shield size={18} />
                                    <span className={iconLabelClass}>{t('nav.adminShort')}</span>
                                    {badgeText(attentionCount) && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -top-2 -end-2 min-w-[1.375rem] h-[1.375rem] px-1 rounded-full bg-gold text-gray-900
                                                text-xs font-bold leading-[1.375rem] text-center ring-2 ring-bg"
                                        >
                                            {badgeText(attentionCount)}
                                        </span>
                                    )}
                                </Link>
                            )}

                            {/* Profile, admin, theme, language and sign-out, at every width. */}
                            <AccountMenu attentionCount={attentionCount} />
                        </>
                    ) : (
                        <>
                            {/* A visitor has no avatar to hang a menu from, so the two browser
                                preferences stay buttons here — and in the drawer on a phone. */}
                            <button
                                onClick={toggleTheme}
                                title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                                aria-label={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                                className={desktopIconButtonClass}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                <span className={iconLabelClass}>{theme === 'dark' ? t('nav.lightShort') : t('nav.darkShort')}</span>
                            </button>
                            <LanguageToggle className={desktopIconButtonClass} labelClassName={iconLabelClass} />

                            <Link to="/login" className="hidden md:block px-5 py-2 bg-primary text-white rounded-full font-semibold text-sm whitespace-nowrap">
                                {t('nav.login')}
                            </Link>
                            <Link to="/register" className="hidden md:block px-5 py-2 bg-primary-light text-primary border border-primary rounded-full font-semibold text-sm whitespace-nowrap">
                                {t('nav.register')}
                            </Link>

                            {/* On a phone, all four of the above live in one menu. */}
                            <AccountMenu />
                        </>
                    )}
                </div>
            </div>

            {/* The six places, on a wide screen. Inside the <nav>, so the height measured into
                --navbar-h includes the strip. */}
            <NavTabs />

            {/* Over the bar rather than below it, so opening search costs no height and the page
                under it does not jump. Mounted only while open — a second SearchBar sitting
                hidden would keep its own copy of the text — and `md:hidden` so a phone rotated
                into a wider layout falls back to the bar's own box. */}
            {searchOpen && (
                <div
                    className="md:hidden absolute inset-0 flex items-center gap-2 px-3 bg-bg"
                    onKeyDown={(e) => { if (e.key === 'Escape') closeSearch(); }}
                >
                    <button
                        type="button"
                        onClick={closeSearch}
                        aria-label={t('nav.closeSearch')}
                        className="flex items-center justify-center w-11 h-11 rounded-md text-text-secondary hover:bg-surface-hover flex-shrink-0"
                    >
                        {/* "Back" points at the reading start, which is the right in Arabic. */}
                        <ArrowLeft size={22} className="rtl:rotate-180" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <SearchBar autoFocus />
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
