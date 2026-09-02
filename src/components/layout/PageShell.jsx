import { useState } from 'react';
import Navbar from './Navbar';
import SideBar from './SideBar';

// The shared app shell (Navbar + collapsible Sidebar) every browsing page uses.
// Pages that don't want a sidebar (auth forms, detail/reading pages) pass sidebar={false}.
function PageShell({ children, sidebar = true, currentChannel, contentClassName = '' }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[3000] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md"
            >
                تخطي إلى المحتوى
            </a>
            <Navbar onMenuClick={() => setDrawerOpen(true)} />
            <div className="flex">
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
        </div>
    );
}

export default PageShell;
