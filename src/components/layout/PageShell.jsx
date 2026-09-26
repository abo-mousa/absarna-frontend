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
/**
 * The column every tab's page is laid out in — Today, Discover, Books, Articles, Posts, Channels.
 * One width, one gutter, one top margin, so moving between tabs moves nothing but the contents:
 * they each had their own (700px, 672px, 1100px, full width), and the title and the rule under it
 * jumped sideways on every tab change.
 */
export const TAB_COLUMN = 'max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8';

function PageShell({ children, contentClassName = '', tab = false, sidebar = null }) {
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
            {/* `sidebar` is Discover's channel column and nobody else's (see ChannelRail): it sits
                against the reading-start edge of the window, and the page's own column centres in
                what is left beside it. */}
            {/* With a side column, the footer (and the consent banner's spacer) sit INSIDE the page's
                own column, beside it. The column is sticky, and a sticky element stays put only
                within its parent: with the footer below that parent, reaching the end of the page
                pushed the column up by the footer's height — it moved while the reader scrolled
                only the page. Pages without a column keep the full-width footer. */}
            <div className="flex flex-1 min-w-0">
                {sidebar}
                <div className="flex-1 min-w-0 flex flex-col">
                    <main id="main-content" tabIndex={-1} className={`flex-1 min-w-0 outline-none ${tab ? TAB_COLUMN : ''} ${contentClassName}`}>{children}</main>
                    {sidebar && <Footer />}
                    {sidebar && <ConsentBanner />}
                </div>
            </div>
            {!sidebar && <Footer />}
            {/* Rendered from the shell rather than from App, so it sits inside the same document
                flow as the footer and cannot end up above a route that renders its own chrome.
                It returns null once the reader has answered. */}
            {!sidebar && <ConsentBanner />}
            <BottomTabBar />
        </div>
    );
}

export default PageShell;
