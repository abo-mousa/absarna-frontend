import { useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Clock, Folder, Tv, User, Calendar } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar } from '../components/ui';
import { VideoPlayer, CommentsSection, VideoCard, BookmarkButton, ShareButton } from '../components/content';
import { useContent, useRelatedContent, useWatchProgressMap } from '../hooks/useContents';
import { useChannel } from '../hooks/useChannels';
import { useSeriesDetail } from '../hooks/useSeries';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveMediaUrl, youtubeThumbnail } from '@/lib/media';

function VideoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const startTime = Number(searchParams.get('t')) || 0;
    const playerRef = useRef(null);
    const { data: video, isLoading, isError } = useContent(id);
    const { data: related = [] } = useRelatedContent(id);
    const { data: channel } = useChannel(video?.channelId, !!video?.channelId);
    const { data: seriesData } = useSeriesDetail(video?.seriesId, !!video?.seriesId);
    const { token } = useAuth();
    const watchProgress = useWatchProgressMap(!!token);

    const thumbnail = video?.thumbnailUrl
        ? resolveMediaUrl(video.thumbnailUrl)
        : video?.sourceType === 'YOUTUBE' ? youtubeThumbnail(video.sourceUrl) : null;
    usePageMeta({
        title: video?.title,
        description: video?.description?.slice(0, 200),
        image: thumbnail,
    });

    if (isLoading || isError || !video) {
        return (
            <PageShell sidebar={false}>
                <QueryState
                    isLoading={isLoading}
                    isError={isError || !video}
                    errorTitle="فشل في تحميل الفيديو"
                    errorAction={<Link to="/" className="text-primary font-semibold">العودة للرئيسية</Link>}
                />
            </PageShell>
        );
    }

    // Ordered list the series' own page (SeriesDetail.jsx) also renders from — used here just
    // to compute this video's position and its immediate neighbours, not to duplicate the list.
    const seriesContent = seriesData?.content || [];
    const seriesIndex = seriesContent.findIndex((v) => v.id === video.id);
    const prevVideo = seriesIndex > 0 ? seriesContent[seriesIndex - 1] : null;
    const nextVideo = seriesIndex >= 0 && seriesIndex < seriesContent.length - 1 ? seriesContent[seriesIndex + 1] : null;

    const meta = [
        video.duration && { icon: Clock, text: video.duration },
        video.category && { icon: Folder, text: video.category },
        video.speaker && { icon: User, text: video.speaker },
        video.publishDate && { icon: Calendar, text: video.publishDate },
    ].filter(Boolean);

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    <VideoPlayer
                        ref={playerRef}
                        contentId={video.id}
                        sourceType={video.sourceType}
                        sourceUrl={video.sourceUrl}
                        title={video.title}
                        startTime={startTime}
                    />
                </div>

                <div className="bg-surface p-5 sm:p-6 rounded-lg border border-border-light mb-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <h1 className="text-xl sm:text-2xl font-bold">{video.title}</h1>
                        <div className="flex items-center gap-3 flex-shrink-0 mt-1">
                            <ShareButton
                                title={video.title}
                                path={`/video/${video.id}`}
                                getCurrentTime={() => playerRef.current?.getCurrentTime() || 0}
                            />
                            <BookmarkButton type="video" id={video.id} />
                        </div>
                    </div>

                    {channel && (
                        <Link
                            to={`/channel/${channel.slug}`}
                            className="flex items-center gap-2 w-fit mb-4 text-text-primary hover:text-primary transition-colors"
                        >
                            <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="sm" />
                            <span className="font-semibold text-sm">{channel.name}</span>
                        </Link>
                    )}

                    <div className="flex gap-4 flex-wrap text-sm text-text-secondary mb-4">
                        {meta.map(({ icon: Icon, text }, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <Icon size={14} /> {text}
                            </span>
                        ))}
                    </div>

                    {video.description && (
                        <p className="text-text-secondary leading-loose whitespace-pre-wrap">{video.description}</p>
                    )}
                </div>

                {seriesData?.series && (
                    <div className="bg-surface p-4 sm:p-5 rounded-lg border border-border-light mb-6">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                            <Link
                                to={`/series/${seriesData.series.id}`}
                                className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                            >
                                <Tv size={14} /> {seriesData.series.title}
                            </Link>
                            {seriesIndex >= 0 && (
                                <span className="text-xs text-text-muted">
                                    الجزء {seriesIndex + 1} من {seriesContent.length}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                                disabled={!nextVideo}
                                title={nextVideo?.title}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-surface-hover text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft size={16} /> التالي
                            </button>
                            <button
                                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                                disabled={!prevVideo}
                                title={prevVideo?.title}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-surface-hover text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight size={16} /> السابق
                            </button>
                        </div>
                    </div>
                )}

                <CommentsSection type="video" id={video.id} />

                {related.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-lg font-bold mb-3">قد يعجبك أيضاً</h2>
                        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                            {related.map((item) => (
                                <VideoCard
                                    key={item.id}
                                    video={item}
                                    onClick={() => navigate(`/video/${item.id}`)}
                                    watchedSeconds={watchProgress[item.id]}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    <Link to="/" className="flex items-center gap-1.5 text-primary font-semibold w-fit">
                        <ArrowRight size={16} /> العودة للرئيسية
                    </Link>
                </div>
            </div>
        </PageShell>
    );
}

export default VideoDetail;
