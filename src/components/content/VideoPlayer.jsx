import { resolveMediaUrl, extractYouTubeId } from '@/lib/media';

function VideoPlayer({ sourceType, sourceUrl, title }) {
    if (sourceType === 'LOCAL' || sourceType === 'STREAM') {
        return (
            <video
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[500px] rounded-lg bg-black"
            >
                <source src={resolveMediaUrl(sourceUrl)} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
            </video>
        );
    }

    if (sourceType === 'TELEGRAM') {
        return (
            <video controls className="w-full max-h-[500px] rounded-lg bg-black">
                <source src={sourceUrl} type="video/mp4" />
            </video>
        );
    }

    if (sourceType === 'YOUTUBE') {
        const videoId = extractYouTubeId(sourceUrl);

        if (!videoId) {
            return (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
                    شاهد على يوتيوب
                </a>
            );
        }

        return (
            <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={title}
                    frameBorder="0"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold">
            شاهد الفيديو
        </a>
    );
}

export default VideoPlayer;
