import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock, Folder, Tv, User, Calendar } from 'lucide-react';
import api from '@/lib/api/client';
import Navbar from '../components/layout/Navbar';
import { Spinner } from '../components/ui';
import { VideoPlayer, CommentsSection, VideoCard } from '../components/content';
import { useRelatedContent } from '../hooks/useContents';

function VideoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { data: related = [] } = useRelatedContent(id);

    useEffect(() => {
        fetchVideo();
    }, [id]);

    const fetchVideo = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/contents/${id}`);
            setVideo(res.data);
        } catch (err) {
            console.error('Failed to fetch video:', err);
            setError('فشل في تحميل الفيديو');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <Spinner />
            </div>
        );
    }

    if (error || !video) {
        return (
            <div dir="rtl" className="min-h-screen bg-bg">
                <Navbar />
                <div className="text-center py-16 px-5">
                    <p className="text-red-600 text-lg mb-2">{error || 'الفيديو غير موجود'}</p>
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
        <div dir="rtl" className="min-h-screen bg-bg">
            <Navbar />

            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    <VideoPlayer sourceType={video.sourceType} sourceUrl={video.sourceUrl} title={video.title} />
                </div>

                <div className="bg-surface p-5 sm:p-6 rounded-lg border border-border-light mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold mb-3">{video.title}</h1>

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
                                <VideoCard key={item.id} video={item} onClick={() => navigate(`/video/${item.id}`)} />
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
