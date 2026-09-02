import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Tv } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState } from '../components/ui';
import { VideoCard } from '../components/content';
import { useSeriesDetail } from '../hooks/useSeries';
import { useWatchProgressMap } from '../hooks/useVideos';
import { useChannel } from '../hooks/useChannels';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

function SeriesDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const { data, isLoading, isError } = useSeriesDetail(id);
    const watchProgress = useWatchProgressMap(!!token);

    const series = data?.series;
    const content = data?.content || [];
    // A series always belongs to exactly one channel — that's its natural "back to" destination
    // (there's no standalone /series listing page the way Articles/Books have one), so this goes
    // back to the owning channel rather than always to Home regardless of where the visitor came
    // from (a channel's "سلاسل" tab, or a video's "part X of Y" block).
    const { data: channel } = useChannel(series?.channelId, !!series?.channelId);
    const backTo = channel ? `/channel/${channel.slug}` : '/';
    const backLabel = channel ? `العودة إلى قناة ${channel.name}` : 'العودة للرئيسية';

    usePageMeta({ title: series?.title, description: series?.description?.slice(0, 200) });

    if (isLoading || isError || !series) {
        return (
            <PageShell sidebar={false}>
                <QueryState
                    isLoading={isLoading}
                    isError={isError || !series}
                    errorTitle="السلسلة غير موجودة"
                    errorAction={<Link to="/" className="text-primary font-semibold">العودة للرئيسية</Link>}
                />
            </PageShell>
        );
    }

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="mb-4">
                    <Link to={backTo} className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowRight size={16} /> {backLabel}
                    </Link>
                </div>

                <div className="bg-surface p-5 sm:p-6 rounded-lg border border-border-light mb-6">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                        <Tv size={16} /> سلسلة
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">{series.title}</h1>
                    {series.description && (
                        <p className="text-text-secondary leading-relaxed mb-2">{series.description}</p>
                    )}
                    <p className="text-sm text-text-muted">{series.contentCount ?? content.length} فيديو</p>
                </div>

                <QueryState
                    isEmpty={content.length === 0}
                    emptyIcon="🎬"
                    emptyTitle="لا توجد فيديوهات في هذه السلسلة بعد"
                >
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                        {content.map((item) => (
                            <VideoCard
                                key={item.id}
                                video={item}
                                onClick={() => navigate(`/video/${item.id}`)}
                                watchedSeconds={watchProgress[item.id]}
                            />
                        ))}
                    </div>
                </QueryState>

                <div className="mt-6">
                    <Link to={backTo} className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowRight size={16} /> {backLabel}
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default SeriesDetail;
