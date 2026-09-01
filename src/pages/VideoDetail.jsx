import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock, Folder, Tv, User, Calendar } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { Spinner, Avatar } from '../components/ui';
import { VideoPlayer, CommentsSection, VideoCard } from '../components/content';
import { useContent, useRelatedContent, useWatchProgressMap } from '../hooks/useContents';
import { useChannel } from '../hooks/useChannels';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveMediaUrl, youtubeThumbnail } from '@/lib/media';

function VideoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: video, isLoading, isError } = useContent(id);
    const { data: related = [] } = useRelatedContent(id);
    const { data: channel } = useChannel(video?.channelId, !!video?.channelId);
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg">
                <Navbar />
                <Spinner />
            </div>
        );
    }

    if (isError || !video) {
        return (
            <div className="min-h-screen bg-bg">
                <Navbar />
                <div className="text-center py-16 px-5">
                    <p className="text-red-600 text-lg mb-2">فشل في تحميل الفيديو</p>
                    <Link to="/" className="text-primary font-semibold">العودة للرئيسية</Link>
                </div>
            </div>
        );
    }

    const meta = [
        video.duration && { icon: Clock, text: video.duration },
        video.category && { icon: Folder, text: video.category },
        video.series && { icon: Tv, text: video.series },
        video.speaker && { icon: User, text: video.speaker },
        video.publishDate && { icon: Calendar, text: video.publishDate },
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    <VideoPlayer contentId={video.id} sourceType={video.sourceType} sourceUrl={video.sourceUrl} title={video.title} />
                </div>

                <div className="bg-surface p-5 sm:p-6 rounded-lg border border-border-light mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold mb-3">{video.title}</h1>

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
        </div>
    );
}

export default VideoDetail;
