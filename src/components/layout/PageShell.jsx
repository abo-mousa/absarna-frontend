import { useState } from 'react';
import Navbar from './Navbar';
import SideBar from './SideBar';

// The shared app shell (Navbar + collapsible Sidebar) every browsing page uses.
// Pages that don't want a sidebar (auth forms, detail/reading pages) pass sidebar={false}.
function PageShell({ children, sidebar = true, currentChannel, contentClassName = '' }) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg">
            <Navbar onMenuClick={() => setDrawerOpen(true)} />
            <div className="flex">
                {sidebar && (
                    <SideBar
                        currentChannel={currentChannel}
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                    />
                )}
                <main className={`flex-1 min-w-0 ${contentClassName}`}>{children}</main>
            </div>
        </div>
    );
}

export default PageShell;
