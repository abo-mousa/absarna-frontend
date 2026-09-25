import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMyChannels, useSubscriptionsPage, useSuggestedChannels } from '../../hooks/useChannels';
import { Avatar, KhatamStar } from '../ui';
import { ArrowForward } from '../ui/DirectionalIcon';
import { resolveMediaUrl } from '@/lib/media';
import { formatChipLabel } from '@/lib/formats';
import { t } from '@/i18n';

/** A page of each list; «تحميل المزيد» fetches the next. */
const FOLLOWED_PAGE = 10;
const SUGGESTED_PAGE = 8;

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
 * <p><b>In the site's own hand, not a plain list of links.</b> Each section opens like the page's
 * own headings — the star, a serif title, a rule fading out after it — at the column's scale. A
 * row answers the pointer the way a card does: the name turns gold-ink and a gold hairline marks
 * its reading-start edge. A suggested channel carries its kind in the kicker's gold, «محاضرات»,
 * «وثائقيات» — the channel's default format, when it has one — so a suggestion says what it is
 * and not only what it is called. The panel ends on the star, faintly, as Today's page does.
 *
 * <p>The suggestions are the backend's (`GET /api/channels/suggested`, the same ranking as Today's
 * welcome), so nothing here decides which channel to put forward — or subtracts the followed ones.
 * Sticky at `--navbar-h` and scrolling on its own, so a long follow list never pushes the feed.
 */
function ChannelRail() {
    const { token } = useAuth();
    const { data: myChannels = [] } = useMyChannels(!!token);
    const followed = useSubscriptionsPage(!!token, FOLLOWED_PAGE);
    const suggestions = useSuggestedChannels(SUGGESTED_PAGE);
    const subscriptions = followed.data?.pages.flatMap((page) => page.content) ?? [];
    const suggested = suggestions.data?.pages.flatMap((page) => page.content) ?? [];

    return (
        <aside
            aria-label={t('channelRail.label')}
            className="hidden lg:flex flex-col relative w-[256px] flex-shrink-0 bg-surface
                sticky top-[var(--navbar-h)] h-[calc(100vh-var(--navbar-h))] overflow-y-auto overflow-x-hidden"
        >
            {/* THE MANUSCRIPT FRAME. The panel is framed the way a page of a manuscript is, which
                is what it had been missing — it read as a plain list on a flat surface:
                  - a gold double rule down the edge that meets the page, where a bare hairline was;
                  - a band of small stars across the head, alternating filled and outlined, the
                    interlace of the logo's two rings laid out in a line;
                  - one thin-line star low in the far corner, the welcome panel's, as its seal.
                All decorative and hidden from assistive technology; the rows are drawn over them. */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-[5px] border-x border-gold/45" />
            <div aria-hidden="true" className="flex items-center justify-between px-4 pt-4 pb-3 me-[5px] border-b border-gold/25">
                {Array.from({ length: 11 }, (_, i) => (
                    <KhatamStar key={i} filled={i % 2 === 0} strokeWidth={10} className={`w-2.5 h-2.5 ${i % 2 === 0 ? 'text-gold/70' : 'text-gold/50'}`} />
                ))}
            </div>
            <KhatamStar
                filled={false}
                strokeWidth={1.5}
                className="pointer-events-none absolute -bottom-10 -start-10 w-44 h-44 text-gold/25"
            />

            <div className="relative flex-1 ps-3 pe-4 pt-5 pb-4 me-[5px]">
                {myChannels.length > 0 && (
                    <RailSection title={t('channelRail.mine')}>
                        {myChannels.map((channel) => (
                            <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} manage />
                        ))}
                    </RailSection>
                )}

                {subscriptions.length > 0 && (
                    <RailSection
                        title={t('channelRail.following')}
                        more={{ to: '/subscriptions', label: t('channelRail.manageFollowing') }}
                        pages={followed}
                    >
                        {subscriptions.map((sub) => (
                            <RailChannel key={sub.subscriptionId} slug={sub.channelSlug} name={sub.channelName} logoUrl={sub.channelLogoUrl} />
                        ))}
                    </RailSection>
                )}

                {suggested.length > 0 && (
                    <RailSection
                        title={t('channelRail.suggested')}
                        more={{ to: '/channels', label: t('channelRail.all') }}
                        pages={suggestions}
                    >
                        {suggested.map((channel) => (
                            <RailChannel
                                key={channel.id}
                                slug={channel.slug}
                                name={channel.name}
                                logoUrl={channel.logoUrl}
                                kicker={formatChipLabel(channel.defaultFormat)}
                            />
                        ))}
                    </RailSection>
                )}
            </div>

        </aside>
    );
}

/**
 * The page's Cartouche at the column's scale: star, serif title, a rule fading out after it.
 * `pages` is the section's infinite query, when it has further pages to offer.
 */
function RailSection({ title, more, pages = null, children }) {
    return (
        <section className="mb-7">
            <div className="flex items-center gap-2 mb-2.5 px-2">
                <KhatamStar className="w-3 h-3 flex-shrink-0 text-gold" />
                <h2 className="font-serif text-[1.2rem] font-semibold leading-none text-text-primary whitespace-nowrap">{title}</h2>
                <span aria-hidden="true" className="flex-1 min-w-3 h-px from-border to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
            </div>
            <ul className="flex flex-col gap-0.5">{children}</ul>
            {pages?.hasNextPage && (
                <button
                    type="button"
                    onClick={() => pages.fetchNextPage()}
                    disabled={pages.isFetchingNextPage}
                    className="block w-full mt-1 ps-3 pe-2 py-1.5 rounded-md text-start text-xs font-semibold text-text-secondary
                        hover:bg-gold-light/60 hover:text-gold-ink disabled:opacity-60 transition-colors"
                >
                    {pages.isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                </button>
            )}
            {more && (
                <Link
                    to={more.to}
                    className="inline-flex items-center gap-1 mt-2 px-2 text-xs font-bold text-gold-ink hover:underline"
                >
                    {more.label}
                    <ArrowForward size={12} />
                </Link>
            )}
        </section>
    );
}

function RailChannel({ slug, name, logoUrl, kicker = null, manage = false }) {
    return (
        <li className="group/row relative flex items-center gap-1">
            {/* The hover mark: a gold hairline on the reading-start edge, the rail's version of a
                card's gold edge. */}
            <span
                aria-hidden="true"
                className="absolute start-0 inset-y-1.5 w-0.5 rounded-full bg-gold opacity-0 group-hover/row:opacity-100 transition-opacity"
            />
            <Link
                to={`/channel/${slug}`}
                className="flex flex-1 min-w-0 items-center gap-2.5 ps-3 pe-2 py-1.5 rounded-md text-text-secondary
                    hover:bg-gold-light/60 hover:no-underline focus-visible:bg-gold-light/60 transition-colors"
            >
                <Avatar
                    src={resolveMediaUrl(logoUrl)}
                    name={name}
                    size="sm"
                    className="!w-8 !h-8 !text-xs flex-shrink-0 ring-1 ring-border-light group-hover/row:ring-gold transition-shadow"
                />
                <span className="min-w-0" dir="auto">
                    <span className="block truncate text-[0.88rem] font-semibold group-hover/row:text-gold-ink transition-colors">{name}</span>
                    {kicker && <span className="block truncate text-[0.68rem] font-bold text-gold-ink/80">{kicker}</span>}
                </span>
            </Link>
            {manage && (
                <Link
                    to={`/channel/${slug}/manage`}
                    title={t('channelRail.manage')}
                    aria-label={t('channelRail.manage')}
                    className="p-1.5 rounded-md text-text-muted hover:bg-gold-light/60 hover:text-gold-ink flex-shrink-0"
                >
                    <Settings size={14} />
                </Link>
            )}
        </li>
    );
}

export default ChannelRail;
