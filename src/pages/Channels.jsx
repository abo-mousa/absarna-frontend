import { Link } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Cartouche, Avatar } from '../components/ui';
import { useAllChannels, useSubscriptions, useMyChannels } from '../hooks/useChannels';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

/**
 * The Channels tab: the reader's own channels (with the way into managing each), the channels they
 * follow, and the directory of everyone else — what the sidebar's three channel lists were, given a
 * page of their own instead of a column on every page.
 *
 * <p>The directory leaves out channels already shown above it, as the sidebar did, so no channel
 * is listed twice. Directory cards carry no subscribe button: each one asks for its own status,
 * and a page of them would be a request per channel — the channel's own page has the button.
 */
function Channels() {
    const { token } = useAuth();
    const { data: myChannels = [] } = useMyChannels(!!token);
    const { data: subscriptions = [] } = useSubscriptions(!!token);
    const directory = useAllChannels(true, 24);
    const all = directory.data?.pages.flatMap((page) => page.content) ?? [];

    const mine = new Set(myChannels.map((c) => c.slug));
    const followed = subscriptions.filter((sub) => !mine.has(sub.channelSlug));
    const followedSlugs = new Set(followed.map((sub) => sub.channelSlug));
    const others = all.filter((c) => !mine.has(c.slug) && !followedSlugs.has(c.slug));

    return (
        <PageShell contentClassName="max-w-[1100px] mx-auto w-full px-4 sm:px-6 py-8">
            <header className="pb-4 mb-8 border-b border-border">
                <h1 className="font-serif text-[2.4rem] font-semibold leading-none">{t('channelsPage.title')}</h1>
                <p className="text-sm text-text-muted mt-2">{t('channelsPage.subtitle')}</p>
            </header>

            <div className="flex flex-col gap-10">
                {token && (
                    <section>
                        <Cartouche
                            title={t('channelsPage.mine')}
                            action={(
                                <Link to="/create-channel" className="inline-flex items-center gap-1.5">
                                    <Plus size={16} /> {t('channelsPage.create')}
                                </Link>
                            )}
                        />
                        {myChannels.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {myChannels.map((channel) => (
                                    <ChannelRow key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} manage />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {followed.length > 0 && (
                    <section>
                        <Cartouche
                            title={t('channelsPage.following')}
                            action={<Link to="/subscriptions">{t('channelsPage.manageFollowing')}</Link>}
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {followed.map((sub) => (
                                <Link
                                    key={sub.subscriptionId}
                                    to={`/channel/${sub.channelSlug}`}
                                    className="flex flex-col items-center gap-2 text-center text-sm font-semibold text-text-primary hover:text-primary hover:no-underline"
                                >
                                    <Avatar src={resolveMediaUrl(sub.channelLogoUrl)} name={sub.channelName} size="lg" />
                                    <span dir="auto" className="line-clamp-2">{sub.channelName}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <Cartouche title={t('channelsPage.directory')} />
                    <QueryState
                        isLoading={directory.isLoading}
                        isError={directory.isError}
                        error={directory.error}
                        onRetry={directory.refetch}
                        // "No channels yet" only when there are none at all: a reader who follows
                        // every channel has an empty directory, not an empty platform.
                        isEmpty={all.length === 0 && !directory.hasNextPage}
                        errorTitle={t('channelsPage.loadFailed')}
                        emptyTitle={t('channelsPage.empty')}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {others.map((channel) => (
                                <Link
                                    key={channel.id}
                                    to={`/channel/${channel.slug}`}
                                    className="flex gap-3 p-4 bg-surface border border-border-light rounded-lg text-text-primary hover:no-underline hover:border-border transition-colors"
                                >
                                    <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="lg" className="flex-shrink-0" />
                                    <div className="min-w-0" dir="auto">
                                        <div className="font-bold truncate">{channel.name}</div>
                                        {channel.description && (
                                            <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">{channel.description}</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {/* Offered even when this page filtered down to nothing (every channel on it
                            is one the reader owns or follows), because the next page may not be. */}
                        {directory.hasNextPage && (
                            <div className="text-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => directory.fetchNextPage()}
                                    disabled={directory.isFetchingNextPage}
                                    className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                                >
                                    {directory.isFetchingNextPage ? t('common.loading') : t('channelsPage.more')}
                                </button>
                            </div>
                        )}
                    </QueryState>
                </section>
            </div>
        </PageShell>
    );
}

/** One of the reader's own channels: its page, and the way into managing it. */
function ChannelRow({ slug, name, logoUrl, manage }) {
    return (
        <div className="flex items-center gap-2 p-3 bg-surface border border-border-light rounded-lg">
            <Link to={`/channel/${slug}`} className="flex flex-1 min-w-0 items-center gap-3 text-text-primary font-semibold hover:text-primary hover:no-underline">
                <Avatar src={resolveMediaUrl(logoUrl)} name={name} size="md" className="flex-shrink-0" />
                <span dir="auto" className="truncate">{name}</span>
            </Link>
            {manage && (
                <Link
                    to={`/channel/${slug}/manage`}
                    title={t('channelsPage.manage')}
                    aria-label={t('channelsPage.manage')}
                    className="p-2 rounded-md text-text-muted hover:bg-surface-hover hover:text-text-secondary flex-shrink-0"
                >
                    <Settings size={16} />
                </Link>
            )}
        </div>
    );
}

export default Channels;
