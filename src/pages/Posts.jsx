import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, KhatamStar, PageHeader, ViewTabs } from '../components/ui';
import { PostCard } from '../components/content';
import { usePostsFeed } from '../hooks/usePosts';
import { PostsRail } from '../components/layout/rail';
import { t } from '@/i18n';

/**
 * The posts page: the short notes channels write — a lesson moved to tomorrow, a new episode, a
 * sentence about a recipe — in one narrow reading column rather than a grid, because they are
 * read, not browsed.
 *
 * <p>"From your channels" is the default for a signed-in reader and it ends, with a last line
 * that says so; "all channels" is one press away. An anonymous reader follows nothing, so sees
 * every channel's posts from the start.
 */
function Posts() {
    const { token } = useAuth();
    const [followed, setFollowed] = useState(!!token);
    // The column's filter: one channel's posts ({id, name}), or null for the stream.
    const [channel, setChannel] = useState(null);
    const posts = usePostsFeed(followed && !!token, 20, channel?.id);
    const items = posts.data?.pages.flatMap((page) => page.content) || [];

    return (
        <PageShell tab sidebar={<PostsRail selected={channel} onSelect={setChannel} />}>
            <div>
                <PageHeader
                    title={t('nav.tabs.posts')}
                    tabs
                    action={token && (
                        <ViewTabs
                            label={t('nav.tabs.posts')}
                            items={[
                                // Choosing a view lets go of the column's channel filter, which would
                                // otherwise win over it while this tab looked chosen.
                                { key: 'followed', label: t('postsPage.followed'), active: !channel && followed, onClick: () => { setFollowed(true); setChannel(null); } },
                                { key: 'all', label: t('postsPage.all'), active: !channel && !followed, onClick: () => { setFollowed(false); setChannel(null); } },
                            ]}
                        />
                    )}
                />

                {/* One channel chosen in the column: said here, with the way back, since the column
                    is not on a phone and a filtered stream must never pass for the whole one. */}
                {channel && (
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <span dir="auto" className="text-sm font-semibold text-gold-ink">{t('postsPage.onlyFrom', { name: channel.name })}</span>
                        <button type="button" onClick={() => setChannel(null)} className="text-xs font-semibold text-text-muted hover:text-text-primary underline">
                            {t('postsPage.showAll')}
                        </button>
                    </div>
                )}

                <QueryState
                    isLoading={posts.isLoading}
                    isError={posts.isError}
                    error={posts.error}
                    onRetry={posts.refetch}
                    isEmpty={items.length === 0}
                    errorTitle={t('postsPage.loadFailed')}
                    emptyIcon={MessageSquareText}
                    emptyDescription={t('postsPage.emptyHint')}
                    emptyTitle={followed && token ? t('postsPage.emptyFollowed') : t('postsPage.emptyAll')}
                >
                    <div className="grid 2xl:grid-cols-2 gap-4 items-start">
                        {items.map((post) => <PostCard key={post.id} post={post} />)}
                    </div>

                    {posts.hasNextPage ? (
                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => posts.fetchNextPage()}
                                disabled={posts.isFetchingNextPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {t('postsPage.loadMore')}
                            </button>
                        </div>
                    ) : (
                        <p className="flex items-center justify-center gap-2 mt-8 text-sm text-text-muted">
                            <KhatamStar className="w-3 h-3 text-gold" />
                            {followed && token ? t('postsPage.endFollowed') : t('postsPage.endAll')}
                        </p>
                    )}
                </QueryState>
            </div>
        </PageShell>
    );
}

export default Posts;
