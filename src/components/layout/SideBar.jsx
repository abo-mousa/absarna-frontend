import { Link, useLocation } from 'react-router-dom';
import { Home, Bell, History, Plus, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAllChannels, useSubscriptions, useMyChannels } from '../../hooks/useChannels';

const navLinkClass = (active) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
        active ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary font-medium hover:bg-surface-hover'
    }`;

const channelLinkClass = (active) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-[0.85rem] mb-0.5 transition-colors ${
        active ? 'text-primary bg-primary-light font-semibold' : 'text-text-secondary font-medium hover:bg-surface-hover'
    }`;

function ChannelDot({ color, name }) {
    return (
        <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: color || '#0D6B4D' }}
        >
            {name?.charAt(0)}
        </div>
    );
}

function ChannelRow({ channel, slug, name, color, currentChannel, onClose, manageLink }) {
    return (
        <div className="flex items-center gap-1">
            <Link
                to={`/channel/${slug}`}
                onClick={onClose}
                className={`flex-1 min-w-0 ${channelLinkClass(currentChannel === slug)}`}
            >
                <ChannelDot color={color} name={name} />
                <span className="truncate">{name}</span>
            </Link>
            {manageLink && (
                <Link
                    to={`/channel/${slug}/manage`}
                    onClick={onClose}
                    title="إدارة القناة"
                    className="p-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-secondary flex-shrink-0"
                >
                    <Settings size={14} />
                </Link>
            )}
        </div>
    );
}

function SideBar({ currentChannel, open = false, onClose }) {
    const { token } = useAuth();
    const location = useLocation();
    const { data: channels = [], isLoading: loading } = useAllChannels();
    const { data: subscriptions = [] } = useSubscriptions(!!token);
    const { data: myChannels = [] } = useMyChannels(!!token);

    const isActive = (path) => location.pathname === path;

    const myChannelSlugs = new Set(myChannels.map((c) => c.slug));
    const visibleSubscriptions = subscriptions.filter((sub) => !myChannelSlugs.has(sub.channelSlug));
    const discoverChannels = channels.filter(
        (c) => !myChannelSlugs.has(c.slug) && !subscriptions.some((sub) => sub.channelSlug === c.slug)
    );

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 bg-black/40 z-[999] lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`w-[240px] bg-surface border-l border-border-light py-3 overflow-y-auto flex-shrink-0
                    fixed right-0 top-0 bottom-0 lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] z-[1000]
                    transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}
            >
                <div className="px-2 mb-4">
                    <Link to="/" onClick={onClose} className={navLinkClass(isActive('/'))}>
                        <Home size={18} />
                        الرئيسية
                    </Link>

                    {token && (
                        <Link to="/subscriptions" onClick={onClose} className={navLinkClass(isActive('/subscriptions'))}>
                            <Bell size={18} />
                            الاشتراكات
                        </Link>
                    )}

                    {token && (
                        <Link to="/history" onClick={onClose} className={navLinkClass(isActive('/history'))}>
                            <History size={18} />
                            سجل المشاهدة
                        </Link>
                    )}
                </div>

                {token && (
                    <div className="px-3 mb-4">
                        <Link
                            to="/create-channel"
                            onClick={onClose}
                            className="flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-md font-semibold text-sm"
                        >
                            <Plus size={18} />
                            إنشاء قناة
                        </Link>
                    </div>
                )}

                {token && myChannels.length > 0 && (
                    <div className="px-2 mb-4">
                        <h4 className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                            قنواتي
                        </h4>
                        {myChannels.map((channel) => (
                            <ChannelRow
                                key={channel.id}
                                slug={channel.slug}
                                name={channel.name}
                                color={channel.primaryColor}
                                currentChannel={currentChannel}
                                onClose={onClose}
                                manageLink
                            />
                        ))}
                    </div>
                )}

                {token && visibleSubscriptions.length > 0 && (
                    <div className="px-2 mb-4">
                        <h4 className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                            اشتراكاتك
                        </h4>
                        {visibleSubscriptions.map((sub) => (
                            <ChannelRow
                                key={sub.subscriptionId}
                                slug={sub.channelSlug}
                                name={sub.channelName}
                                color={sub.channelColor}
                                currentChannel={currentChannel}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}

                <div className="px-2">
                    <h4 className="text-[0.7rem] text-text-muted uppercase tracking-wider mb-1.5 px-3">
                        اكتشف قنوات أخرى
                    </h4>
                    {loading ? (
                        <p className="text-[0.8rem] text-text-muted px-3">جاري التحميل...</p>
                    ) : discoverChannels.length === 0 ? (
                        <p className="text-[0.8rem] text-text-muted px-3">لا توجد قنوات أخرى</p>
                    ) : (
                        discoverChannels.map((channel) => (
                            <ChannelRow
                                key={channel.id}
                                slug={channel.slug}
                                name={channel.name}
                                color={channel.primaryColor}
                                currentChannel={currentChannel}
                                onClose={onClose}
                            />
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}

export default SideBar;
