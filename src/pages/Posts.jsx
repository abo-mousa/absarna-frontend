import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, KhatamStar, PageHeader, ViewTabs } from '../components/ui';
import { PostCard } from '../components/content';
import { usePostsFeed } from '../hooks/usePosts';
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
    const posts = usePostsFeed(followed && !!token);
    const items = posts.data?.pages.flatMap((page) => page.content) || [];

    return (
        <PageShell tab>
            <div>
                <PageHeader
                    title={t('nav.tabs.posts')}
                    tabs
                    action={token && (
                        <ViewTabs
                            label={t('nav.tabs.posts')}
                            items={[
                                { key: 'followed', label: t('postsPage.followed'), active: followed, onClick: () => setFollowed(true) },
                                { key: 'all', label: t('postsPage.all'), active: !followed, onClick: () => setFollowed(false) },
                            ]}
                        />
                    )}
                />

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
                    <div className="grid lg:grid-cols-2 gap-4 items-start">
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
