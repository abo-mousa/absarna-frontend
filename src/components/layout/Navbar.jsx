import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, User, Shield, LogOut, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { isPlatformAdmin } from '@/lib/user';
import { useMyChannels } from '../../hooks/useChannels';
import { reshuffleFeed } from '../../hooks/useVideos';
import logo from '../../assets/logo.svg';
import SearchBar from './SearchBar';
import { t } from '@/i18n';

const iconButtonClass = 'flex flex-col items-center justify-center gap-0.5 min-w-[50px] px-2.5 py-1.5 rounded-md text-text-secondary hover:bg-surface-hover transition-colors';
const iconLabelClass = 'hidden sm:block text-[0.65rem] font-medium text-text-muted';

function Navbar({ onMenuClick }) {
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
    const { data: myChannels = [] } = useMyChannels(!!token);
    const uploadLink = myChannels.length > 0 ? `/channel/${myChannels[0].slug}/manage` : '/create-channel';

    return (
        <nav ref={navRef} className="sticky top-0 z-[1000] bg-bg/95 backdrop-blur-md border-b border-border-light">
            <div className="max-w-[1400px] mx-auto flex items-center gap-3 sm:gap-5 px-3 sm:px-6 py-2.5">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden text-text-secondary p-1.5 -mr-1 rounded-md hover:bg-surface-hover flex-shrink-0"
                    aria-label={t('nav.menu')}
                >
                    <Menu size={22} />
                </button>

                <Link
                    to="/"
                    onClick={handleLogoClick}
                    className="flex items-center gap-1 text-2xl sm:text-3xl font-bold text-primary flex-shrink-0"
                >
                    <img src={logo} alt={t('nav.brandAlt')} className="w-9 h-9 sm:w-10 sm:h-10" />
                    <span className="font-serif">{t('nav.brand')}</span>
                </Link>

                <div className="flex-1 flex justify-center">
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
