import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tv, Clapperboard } from 'lucide-react';
import { ArrowBack } from '@/components/ui/DirectionalIcon';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { VideoCard } from '../components/content';
import { useSeriesDetail } from '../hooks/useSeries';
import { useWatchProgressMap } from '../hooks/useVideos';
import { useChannel } from '../hooks/useChannels';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { channelTabPath } from '@/lib/navigation';
import { t } from '@/i18n';

function SeriesDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useSeriesDetail(id);
    const watchProgress = useWatchProgressMap(!!token);

    // Series metadata rides on every page; the first one is as good as any.
    const series = data?.pages[0]?.series;
    const content = data?.pages.flatMap((page) => page.content) || [];
    // A series always belongs to exactly one channel — that's its natural "back to" destination
    // (there's no standalone /series listing page the way Articles/Books have one), so this goes
    // back to the owning channel rather than always to Home regardless of where the visitor came
    // from (a channel's "سلاسل" tab, or a video's "part X of Y" block). To that channel's series
    // tab, not its front: the channel page opens on videos, and a return from a course belongs
    // back in the list of courses.
    const { data: channel } = useChannel(series?.channelId, !!series?.channelId);
    const backTo = channel ? channelTabPath(channel.slug, 'series') : '/';
    const backLabel = channel ? t('series.backToChannel', { name: channel.name }) : t('common.backHome');

    usePageMeta({ title: series?.title, description: series?.description?.slice(0, 200) });

    if (isLoading || isError || !series) {
        return (
            <PageShell>
                <QueryState
                    isLoading={isLoading}
                    isError={isError || !series}
                    error={error}
                    errorTitle={t('series.notFound')}
                    errorAction={<Link to="/" className="text-primary font-semibold">{t('common.backHome')}</Link>}
                />
            </PageShell>
        );
    }

    return (
        <PageShell>
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-4">
                    <Link to={backTo} className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowBack size={16} /> {backLabel}
                    </Link>
                </div>

                {/* `publiclyListed` is sent only to the channel's owner (and a platform admin). A series
                    with no publicly playable video is not listed and 404s for everyone else, and
                    its list below is empty for the same reason — which, unexplained, reads to its
                    owner as a broken page. */}
                {series.publiclyListed === false && (
                    <div role="status" className="mb-6 rounded-lg border p-4 text-sm border-amber-300 bg-amber-50 text-amber-900">
                        <p className="font-semibold mb-1">{t('series.hiddenNoticeTitle')}</p>
                        <p className="leading-relaxed">{t('series.hiddenNoticeBody')}</p>
                        {channel && (
                            <Link
                                to={`/channel/${channel.slug}/manage?tab=videos`}
                                className="inline-block mt-2 font-semibold underline"
                            >
                                {t('series.manageInDashboard')}
                            </Link>
                        )}
                    </div>
                )}

                <div className="bg-surface p-5 sm:p-6 rounded-lg border border-border-light mb-6">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                        <Tv size={16} /> {t('series.badge')}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">{series.title}</h1>
                    {series.description && (
                        <p className="text-text-secondary leading-relaxed mb-2">{series.description}</p>
                    )}
                    <p className="text-sm text-text-muted">{t('common.videoCount', { count: series.contentCount ?? content.length })}</p>
                </div>

                <QueryState
                    isEmpty={content.length === 0}
                    emptyIcon={Clapperboard}
                    emptyTitle={t('series.empty')}
                >
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                        {content.map((item) => (
                            <VideoCard
                                key={item.id}
                                video={item}
                                onClick={() => navigate(`/video/${item.id}`)}
                                watchedSeconds={watchProgress[item.id]}
                            />
                        ))}
                    </div>

                    {hasNextPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>

                <div className="mt-6">
                    <Link to={backTo} className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowBack size={16} /> {backLabel}
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default SeriesDetail;
