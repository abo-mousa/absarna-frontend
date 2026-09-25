import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, KhatamStar } from '../components/ui';
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

    const tabClass = (active) =>
        `px-4 py-1.5 text-sm font-semibold transition-colors ${active ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:text-text-primary'}`;

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            <div className="max-w-2xl mx-auto">
                <header className="flex flex-wrap items-end justify-between gap-4 pb-4 mb-6 border-b border-border">
                    <div>
                        <h1 className="font-serif text-[2.4rem] font-semibold leading-none">{t('postsPage.title')}</h1>
                        <p className="text-sm text-text-muted mt-2">{t('postsPage.subtitle')}</p>
                    </div>
                    {token && (
                        <div className="inline-flex border border-border rounded-md overflow-hidden" role="group">
                            <button type="button" aria-pressed={followed} onClick={() => setFollowed(true)} className={tabClass(followed)}>
                                {t('postsPage.followed')}
                            </button>
                            <button type="button" aria-pressed={!followed} onClick={() => setFollowed(false)} className={tabClass(!followed)}>
                                {t('postsPage.all')}
                            </button>
                        </div>
                    )}
                </header>

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
                    <div className="grid gap-4">
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
