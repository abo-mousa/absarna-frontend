import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMyChannels, useSubscriptions, useSuggestedChannels } from '../../hooks/useChannels';
import { Avatar, KhatamStar } from '../ui';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

/** Suggestions shown; the Channels tab has the rest. */
const SUGGESTED_SHOWN = 8;

/**
 * Discover's channel column: the old sidebar's shape — a full-height panel against the
 * reading-start edge of the window, under the navbar — holding the reader's own channels, the
 * channels they follow, and channels suggested to them.
 *
 * <p><b>Discover's alone, by the product owner's decision (2026-09-25).</b> The app-wide sidebar
 * was removed because a column of links on every page, and a hamburger drawer on a phone, read as
 * a video site. Browsing is where a list of channels earns its room, so it came back there and
 * nowhere else — not on Today, a page that ends, and never as a drawer: below `lg` the Channels
 * tab is this list.
 *
 * <p>The suggestions are the backend's (`GET /api/channels/suggested`, the same ranking as Today's
 * welcome), so nothing here decides which channel to put forward — or subtracts the followed ones.
 * Sticky at `--navbar-h` and scrolling on its own, so a long follow list never pushes the feed.
 */
function ChannelRail() {
    const { token } = useAuth();
    const { data: myChannels = [] } = useMyChannels(!!token);
    const { data: subscriptions = [] } = useSubscriptions(!!token);
    const { data: suggested = [] } = useSuggestedChannels(SUGGESTED_SHOWN);

    return (
        <aside
            aria-label={t('channelRail.label')}
            className="hidden lg:block w-[240px] flex-shrink-0 bg-surface border-e border-border-light py-4 overflow-y-auto
                sticky top-[var(--navbar-h)] h-[calc(100vh-var(--navbar-h))]"
        >
            {myChannels.length > 0 && (
                <RailSection title={t('channelRail.mine')}>
                    {myChannels.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} manage />
                    ))}
                </RailSection>
            )}

            {subscriptions.length > 0 && (
                <RailSection title={t('channelRail.following')} more={{ to: '/subscriptions', label: t('channelRail.manageFollowing') }}>
                    {subscriptions.map((sub) => (
                        <RailChannel key={sub.subscriptionId} slug={sub.channelSlug} name={sub.channelName} logoUrl={sub.channelLogoUrl} />
                    ))}
                </RailSection>
            )}

            {suggested.length > 0 && (
                <RailSection title={t('channelRail.suggested')} more={{ to: '/channels', label: t('channelRail.all') }}>
                    {suggested.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} />
                    ))}
                </RailSection>
            )}
        </aside>
    );
}

function RailSection({ title, more, children }) {
    return (
        <section className="px-2 mb-5">
            <h2 className="flex items-center gap-2 text-xs font-bold text-text-muted tracking-wider mb-2 px-3">
                <KhatamStar className="w-3 h-3 flex-shrink-0 text-gold" />
                {title}
            </h2>
            <ul>{children}</ul>
            {more && (
                <Link to={more.to} className="block px-3 pt-1.5 text-xs font-semibold">
                    {more.label}
                </Link>
            )}
        </section>
    );
}

function RailChannel({ slug, name, logoUrl, manage = false }) {
    return (
        <li className="flex items-center gap-1">
            <Link
                to={`/channel/${slug}`}
                className="flex flex-1 min-w-0 items-center gap-2.5 px-3 py-1.5 rounded-md text-[0.85rem] font-medium
                    text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:no-underline transition-colors"
            >
                <Avatar src={resolveMediaUrl(logoUrl)} name={name} size="sm" className="!w-6 !h-6 !text-xs flex-shrink-0" />
                <span dir="auto" className="truncate">{name}</span>
            </Link>
            {manage && (
                <Link
                    to={`/channel/${slug}/manage`}
                    title={t('channelRail.manage')}
                    aria-label={t('channelRail.manage')}
                    className="p-1.5 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-secondary flex-shrink-0"
                >
                    <Settings size={14} />
                </Link>
            )}
        </li>
    );
}

export default ChannelRail;
