import { useAuth } from '../../contexts/AuthContext';
import { EmailVerificationNotice } from '../auth';
import Navbar from './Navbar';
import BottomTabBar from './BottomTabBar';
import Footer from './Footer';
import ConsentBanner from './ConsentBanner';
import { t } from '@/i18n';

/**
 * The frame every page sits in: the navbar (with the six places as a strip on a wide screen), the
 * page, the footer — and on a phone a tab bar fixed to the bottom.
 *
 * <p><b>There is no sidebar any more, on purpose.</b> A column of links down one side, and a
 * hamburger drawer on a phone, was the plainest YouTube mark on the page. The places are tabs now
 * (`NavTabs`, `BottomTabBar`, both from `lib/tabs`); the account's own pages (history, saved) are in
 * the account menu; the channel lists are the Channels page.
 *
 * <p>The page gets bottom room below `lg` equal to the tab bar plus the safe-area inset, so the
 * last line of every page — the Today page's colophon included — is never under the bar.
 */
function PageShell({ children, contentClassName = '' }) {
    const { user } = useAuth();
    const unverified = !!user && user.emailVerified === false;

    return (
        <div className="min-h-screen flex flex-col bg-bg pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[3000] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md"
            >
                {t('nav.skipToContent')}
            </a>
            <Navbar />

            {/* The only place the unverified state is visible without trying a blocked action.
                It used to appear solely inside the comment box and the create-channel form, so
                someone who never tried either was never told — and the ten-minute link they
                missed, or never received, looked like nothing was wrong. */}
            {unverified && (
                <div className="max-w-[1400px] w-full mx-auto px-3 sm:px-6 pt-3">
                    <EmailVerificationNotice message={t('auth.verificationNotice.banner')} />
                </div>
            )}
            {/* tabIndex=-1 lets route-change navigation (App.jsx) move focus here
                programmatically without making it a normal tab stop. */}
            <main id="main-content" tabIndex={-1} className={`flex-1 min-w-0 outline-none ${contentClassName}`}>{children}</main>
            <Footer />
            {/* Rendered from the shell rather than from App, so it sits inside the same document
                flow as the footer and cannot end up above a route that renders its own chrome.
                It returns null once the reader has answered. */}
            <ConsentBanner />
            <BottomTabBar />
        </div>
    );
}

export default PageShell;
