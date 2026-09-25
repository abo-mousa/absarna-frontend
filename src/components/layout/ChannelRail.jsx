import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChannelDirectory, useSubscriptions } from '../../hooks/useChannels';
import { Avatar, KhatamStar } from '../ui';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

/** How many of each list the column shows before «الكل». */
const FOLLOWED_SHOWN = 12;
const OTHERS_SHOWN = 8;

/**
 * Discover's channel column, on a wide screen only: the channels this reader follows, then others
 * they might look at, each a link to the channel's page.
 *
 * <p><b>Discover's alone, by the product owner's decision (2026-09-25).</b> The app-wide sidebar
 * was removed because a column of links on every page, and a hamburger drawer on a phone, read as
 * a video site. Browsing is where a list of channels earns its room, so it came back there and
 * nowhere else — not on Today, which is a page that ends, and never as a drawer: below `lg` the
 * Channels tab already is this list.
 *
 * <p>Sticky under the navbar (`--navbar-h`) and scrolling on its own, so a long follow list never
 * pushes the feed. «قنوات أخرى» is the backend's directory, which leaves out the reader's own and
 * followed channels itself; this shares its cache with the Channels page.
 */
function ChannelRail() {
    const { token } = useAuth();
    const { data: subscriptions = [] } = useSubscriptions(!!token);
    const directory = useChannelDirectory();
    const others = directory.data?.pages[0]?.content ?? [];

    return (
        <aside
            aria-label={t('channelRail.label')}
            className="hidden lg:block sticky top-[calc(var(--navbar-h)+1.5rem)] self-start
                max-h-[calc(100vh-var(--navbar-h)-3rem)] overflow-y-auto pe-2"
        >
            {subscriptions.length > 0 && (
                <RailSection
                    title={t('channelRail.following')}
                    more={subscriptions.length > FOLLOWED_SHOWN ? '/subscriptions' : null}
                >
                    {subscriptions.slice(0, FOLLOWED_SHOWN).map((sub) => (
                        <RailChannel key={sub.subscriptionId} slug={sub.channelSlug} name={sub.channelName} logoUrl={sub.channelLogoUrl} />
                    ))}
                </RailSection>
            )}
            {others.length > 0 && (
                <RailSection title={t('channelRail.others')} more="/channels">
                    {others.slice(0, OTHERS_SHOWN).map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} />
                    ))}
                </RailSection>
            )}
        </aside>
    );
}

function RailSection({ title, more, children }) {
    return (
        <section className="mb-6">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-text-muted mb-2 px-2">
                <KhatamStar className="w-2.5 h-2.5 text-gold" />
                {title}
            </h2>
            <ul>{children}</ul>
            {more && (
                <Link to={more} className="block px-2 pt-1 text-xs font-semibold">
                    {t('channelRail.all')}
                </Link>
            )}
        </section>
    );
}

function RailChannel({ slug, name, logoUrl }) {
    return (
        <li>
            <Link
                to={`/channel/${slug}`}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium text-text-secondary
                    hover:bg-surface-hover hover:text-text-primary hover:no-underline"
            >
                <Avatar src={resolveMediaUrl(logoUrl)} name={name} size="sm" className="!w-7 !h-7 !text-xs flex-shrink-0" />
                <span dir="auto" className="truncate">{name}</span>
            </Link>
        </li>
    );
}

export default ChannelRail;
