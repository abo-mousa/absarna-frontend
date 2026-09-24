import { useCallback, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Upload, Shield, LogOut, Sun, Moon, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useMyChannels } from '../../hooks/useChannels';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { canUpload, isPlatformAdmin, uploadPathFor } from '@/lib/user';
import { Avatar } from '../ui';
import { badgeText } from '@/hooks/useAdminAttention';
import LanguageToggle from './LanguageToggle';
import { t } from '@/i18n';

/**
 * What the account menu holds, in order.
 *
 * <p>Signed in: `upload` and `admin` are here for the phone only — from `md` up each is a
 * button in the bar, and their rows are `md:hidden`. Signed out: sign-in first, because on a phone this menu is where
 * the sign-in button went, then the two browser preferences. Exported so what each state is
 * offered is tested rather than remembered.
 */
export function accountMenuActions(user, signedIn = true) {
    if (!signedIn) return ['login', 'register', 'theme', 'language'];
    return [
        'profile',
        ...(canUpload(user) ? ['upload'] : []),
        ...(isPlatformAdmin(user) ? ['admin'] : []),
        'theme',
        'language',
        'logout',
    ];
}

const itemClass = 'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors';

/**
 * The signed-in account control: the avatar in the bar, opening a menu of everything about the
 * account and this browser — at every width. The avatar used to be a link straight to the
 * profile page on a wide screen, beside separate buttons for admin, theme, language and sign-out:
 * six buttons in the bar for a platform admin, and pressing your own picture did not do what
 * pressing your own picture does on every other site.
 *
 * <p>A menu under the avatar rather than a group in the drawer, because the drawer is navigation
 * — where to go — and these are about who you are and how the site looks; the avatar is also
 * where people look for "sign out". Settings did live at the bottom of the drawer on a phone for
 * a while, and nobody found them there.
 *
 * <p><b>Signed out</b>, the same person icon stands where the sign-in button was, on a phone
 * only: the bar has room for the menu, the logo, search and ONE more control, and a visitor needs
 * sign-in, registration, theme and language. From `md` up a visitor's bar has room for all four
 * as buttons, and this renders nothing.
 */
/**
 * @param attentionCount what is waiting on a platform admin — the navbar asks once and passes it
 *        in, so the phone's menu row and the desktop button cannot show different numbers.
 */
function AccountMenu({ attentionCount = 0 }) {
    const { token, user, logout } = useAuth();
    const signedIn = !!token;
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    // Only asked for once the menu is open, and a cache hit after that — the upload row is the
    // only thing that needs it.
    const { data: myChannels = [] } = useMyChannels(open && signedIn);

    // Any navigation closes it, including one made from inside it. During render rather than in
    // an effect, for the reason SearchBar gives: an effect paints the open menu over the new
    // page for a frame.
    const [openedAt, setOpenedAt] = useState(location.key);
    if (open && location.key !== openedAt) setOpen(false);

    const close = useCallback(() => setOpen(false), []);
    useOutsideClick(containerRef, close);

    const toggle = () => {
        setOpenedAt(location.key);
        setOpen((wasOpen) => !wasOpen);
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape' && open) {
            setOpen(false);
            buttonRef.current?.focus();
        }
    };

    const name = user?.fullName || user?.username || '';

    return (
        <div ref={containerRef} className={`relative ${signedIn ? '' : 'md:hidden'}`} onKeyDown={onKeyDown}>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggle}
                aria-label={t('nav.accountMenu')}
                aria-haspopup="menu"
                aria-expanded={open}
                // A 44px round target on a phone; beside the labelled icon buttons from `md` up it
                // takes their shape and a label of its own, so the row reads as one set.
                className="flex flex-col items-center justify-center gap-0.5 min-w-11 h-11 md:h-auto md:min-w-[50px]
                    md:px-2.5 md:py-1.5 rounded-full md:rounded-md text-text-secondary hover:bg-surface-hover"
            >
                {user?.profilePictureUrl
                    ? <Avatar src={user.profilePictureUrl} name={name} size="sm" className="md:w-[18px] md:h-[18px]" />
                    : <User size={20} className="md:w-[18px] md:h-[18px]" />}
                <span className="hidden md:block text-[0.65rem] font-medium text-text-muted">{t('nav.profileShort')}</span>
            </button>

            {open && (
                // `end-0`: hangs from the avatar's own edge, which is the page's end — the left
                // under RTL — so it opens inward over the page instead of off the screen.
                <div
                    role="menu"
                    aria-label={t('nav.accountMenu')}
                    className="absolute end-0 top-[calc(100%+6px)] z-[1001] w-60 max-w-[calc(100vw-24px)]
                        overflow-hidden rounded-lg border border-border-light bg-surface py-1 shadow-lg"
                >
                    {signedIn && name && (
                        <div className="px-4 py-2.5 border-b border-border-light mb-1">
                            <p dir="auto" className="truncate text-sm font-semibold text-text-primary">{name}</p>
                            {user?.username && user.username !== name && (
                                // The handle is Latin and reads left to right, but lines up under the
                                // name on the page's own side — so the span is `ltr`, not the line.
                                <p className="truncate text-xs text-text-muted"><span dir="ltr">@{user.username}</span></p>
                            )}
                        </div>
                    )}
                    {accountMenuActions(user, signedIn).map((action) => {
                        switch (action) {
                            case 'login':
                                return (
                                    <div key={action} className="px-3 pt-2 pb-1">
                                        <Link
                                            role="menuitem"
                                            to="/login"
                                            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2
                                                text-sm font-semibold text-white"
                                        >
                                            <LogIn size={16} className="rtl:scale-x-[-1]" />
                                            {t('nav.login')}
                                        </Link>
                                    </div>
                                );
                            case 'register':
                                return (
                                    <div key={action} className="px-3 pt-1 pb-2 mb-1 border-b border-border-light">
                                        <Link
                                            role="menuitem"
                                            to="/register"
                                            className="flex w-full items-center justify-center gap-2 rounded-full border border-primary
                                                bg-primary-light px-4 py-2 text-sm font-semibold text-primary"
                                        >
                                            <UserPlus size={16} />
                                            {t('nav.register')}
                                        </Link>
                                    </div>
                                );
                            case 'profile':
                                return (
                                    <Link key={action} role="menuitem" to="/profile" className={itemClass}>
                                        <User size={18} />
                                        {t('nav.profile')}
                                    </Link>
                                );
                            case 'upload':
                                return (
                                    <Link key={action} role="menuitem" to={uploadPathFor(myChannels)} className={`md:hidden ${itemClass}`}>
                                        <Upload size={18} />
                                        {t('nav.upload')}
                                    </Link>
                                );
                            case 'admin':
                                // Phone only: from `md` up the admin panel is its own button in the
                                // bar, badge and all.
                                return (
                                    <Link key={action} role="menuitem" to="/admin" className={`md:hidden ${itemClass}`}>
                                        <Shield size={18} />
                                        <span className="flex-1">{t('nav.adminPanel')}</span>
                                        {badgeText(attentionCount) && (
                                            <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gold text-gray-900 text-[0.7rem] font-bold leading-5 text-center">
                                                {badgeText(attentionCount)}
                                            </span>
                                        )}
                                    </Link>
                                );
                            case 'theme':
                                // Stays open: the point of pressing it is to see the result.
                                return (
                                    <button key={action} role="menuitem" type="button" onClick={toggleTheme} className={itemClass}>
                                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                        {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
                                    </button>
                                );
                            case 'language':
                                return <LanguageToggle key={action} className={itemClass} />;
                            case 'logout':
                                return (
                                    <div key={action} className="mt-1 border-t border-border-light pt-1">
                                        <button
                                            role="menuitem"
                                            type="button"
                                            onClick={() => { setOpen(false); logout(); }}
                                            className={itemClass}
                                        >
                                            <LogOut size={18} />
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            )}
        </div>
    );
}

export default AccountMenu;
