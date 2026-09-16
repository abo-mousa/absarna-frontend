import { useState } from 'react';
import Navbar from './Navbar';
import SideBar from './SideBar';
import Footer from './Footer';
import { t } from '@/i18n';

// The shared app shell (Navbar + collapsible Sidebar + Footer) every browsing page uses.
// Pages that don't want a sidebar (auth forms, detail/reading pages) pass sidebar={false}.
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
// Nothing about the sidebar moves — on desktop it is `lg:sticky lg:top-[60px]` inside that row and
// sticky positioning is unaffected by the parent being a flex item, and on mobile it is `fixed`,
// which takes it out of the flow entirely.
function PageShell({ children, sidebar = true, currentChannel, contentClassName = '' }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-bg">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[3000] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md"
            >
                {t('nav.skipToContent')}
            </a>
            <Navbar onMenuClick={() => setDrawerOpen(true)} />
            <div className="flex flex-1">
                {sidebar && (
                    <SideBar
                        currentChannel={currentChannel}
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                    />
                )}
                {/* tabIndex=-1 lets route-change navigation (App.jsx) move focus here
                    programmatically without making it a normal tab stop. */}
                <main id="main-content" tabIndex={-1} className={`flex-1 min-w-0 outline-none ${contentClassName}`}>{children}</main>
            </div>
            <Footer />
        </div>
    );
}

export default PageShell;
