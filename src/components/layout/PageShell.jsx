import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmailVerificationNotice } from '../auth';
import Navbar from './Navbar';
import SideBar from './SideBar';
import Footer from './Footer';
import ConsentBanner from './ConsentBanner';
import { t } from '@/i18n';

// The shared app shell (Navbar + collapsible Sidebar + Footer) every browsing page uses.
//
// ## `sidebar={false}` means "no desktop column", NOT "no menu"
//
// It used to mean the second thing, and that is why the hamburger was unreliable on a phone. The
// button lives in `Navbar`, which this shell renders unconditionally, so it was on screen on all
// ~32 pages — but the drawer it opens is `SideBar`, which was rendered only when `sidebar` was
// true. On the two dozen pages that pass `sidebar={false}` (every reading page, every auth form,
// the dashboards, the admin screens) pressing it set a piece of state nothing was listening to.
// A dead button, on most of the site, and only on a phone: above `lg` the button is hidden and
// the sidebar is a permanent column, so the whole thing is invisible on a desktop. From the
// visitor's side that reads exactly as "sometimes it opens and sometimes it doesn't" — it opens
// on the home page and the channel page and does nothing anywhere else.
//
// Hiding the button instead would have been the smaller change and the wrong one: on a phone
// there is no persistent column, so the drawer is the ONLY way to reach the home feed,
// subscriptions, history, bookmarks and the channel list. Removing it from a reading page leaves
// a visitor there with the wordmark and the back button. So the drawer is now always mounted and
// `drawerOnly` tells `SideBar` to skip the desktop column — which is all `sidebar={false}` was
// ever trying to say.
//
// The footer is NOT optional the way the sidebar is, and that is the point of putting it here: the
// privacy policy, the terms and the contact address have to be reachable from every page, not from
// the ones somebody remembered to opt in. Passing it as a prop would mean a new page ships without
// it by default, which is exactly how a site ends up with a takedown address that exists and
// cannot be found.
//
// ## The flex change, and why it was needed
//
// This used to be `min-h-screen` on the outer div with a single `flex` row inside it. Appending a
// footer to that row is wrong (it would land beside the sidebar as a third column), and appending
// it after the row leaves it floating mid-window on any short page: the row is only as tall as its
// content, so `/contact` with the address unconfigured ended with a footer halfway up a screen of
// empty parchment.
//
// So the outer div is now a column and the row takes `flex-1`: the row absorbs whatever height is
// left and the footer sits on the bottom edge, while a long page simply pushes it below the fold.
// Nothing about the sidebar moves — on desktop it is `lg:sticky lg:top-[var(--navbar-h)]` inside that row and
// sticky positioning is unaffected by the parent being a flex item, and on mobile it is `fixed`,
// which takes it out of the flow entirely.
function PageShell({ children, sidebar = true, currentChannel, contentClassName = '' }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user } = useAuth();
    // `=== false` rather than `!`: the profile arrives a moment after the token does, and a
    // truthy-test on an absent field announces "your account is not verified" to every verified
    // user for that moment.
    const unverified = !!user && user.emailVerified === false;

    /**
     * Closes the drawer the moment the layout becomes the desktop one.
     *
     * <p>The drawer is a modal: `useFocusTrap` locks body scroll and traps the tab ring for as
     * long as it is open. Crossing `lg` swaps it for the static column (or, on a `drawerOnly`
     * page, for nothing at all) without touching this state — so a tablet rotated into landscape
     * with the menu open kept the scroll lock and the focus trap while the panel they belonged to
     * was gone from the screen. The page reads as frozen, and the next press of the hamburger
     * closes a drawer nobody can see instead of opening one.
     *
     * <p>Only listens while open, so the common case costs nothing.
     */
    useEffect(() => {
        if (!drawerOpen || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined;
        }
        // The same 1024px `lg:` uses. Duplicated in JS on purpose: this is a behaviour change
        // (modal vs. not), and there is no CSS that can release a scroll lock.
        const desktop = window.matchMedia('(min-width: 1024px)');
        const sync = () => { if (desktop.matches) setDrawerOpen(false); };
        sync();
        desktop.addEventListener('change', sync);
        return () => desktop.removeEventListener('change', sync);
    }, [drawerOpen]);

    return (
        <div className="min-h-screen flex flex-col bg-bg">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[3000] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md"
            >
                {t('nav.skipToContent')}
            </a>
            {/* Toggle, not open. The button is the only affordance that looks like it closes the
                thing it opened, and pressing it a second time used to re-assert `true`. */}
            <Navbar onMenuClick={() => setDrawerOpen((wasOpen) => !wasOpen)} menuOpen={drawerOpen} />

            {/* The only place the unverified state is visible without trying a blocked action.
                It used to appear solely inside the comment box and the create-channel form, so
                someone who never tried either was never told — and the ten-minute link they
                missed, or never received, looked like nothing was wrong. */}
            {unverified && (
                <div className="max-w-[1400px] w-full mx-auto px-3 sm:px-6 pt-3">
                    <EmailVerificationNotice message={t('auth.verificationNotice.banner')} />
                </div>
            )}
            <div className="flex flex-1">
                <SideBar
                    currentChannel={currentChannel}
                    drawerOnly={!sidebar}
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                />
                {/* tabIndex=-1 lets route-change navigation (App.jsx) move focus here
                    programmatically without making it a normal tab stop. */}
                <main id="main-content" tabIndex={-1} className={`flex-1 min-w-0 outline-none ${contentClassName}`}>{children}</main>
            </div>
            <Footer />
            {/* Rendered from the shell rather than from App, so it sits inside the same document
                flow as the footer and cannot end up above a route that renders its own chrome.
                It returns null once the reader has answered. */}
            <ConsentBanner />
        </div>
    );
}

export default PageShell;
