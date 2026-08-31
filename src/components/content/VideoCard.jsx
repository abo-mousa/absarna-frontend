import { Play, Eye, EyeOff, Trash2 } from 'lucide-react';
import { resolveMediaUrl, youtubeThumbnail } from '@/lib/media';

function getThumbnail(video) {
    if (video.thumbnailUrl) return resolveMediaUrl(video.thumbnailUrl);
    if (video.sourceType === 'YOUTUBE') return youtubeThumbnail(video.sourceUrl);
    return null;
}

function VideoCard({ video, onClick, isOwner, onToggleVisibility, onDelete }) {
    const thumbnail = getThumbnail(video);

    return (
        <div
            onClick={() => onClick(video)}
            className={`group bg-surface rounded-lg overflow-hidden border shadow-sm
                hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer
                ${video.visible === false ? 'border-dashed border-border' : 'border-border-light'}`}
        >
            <div className="relative h-[180px] sm:h-[200px] bg-surface-hover overflow-hidden">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary text-5xl opacity-50">
                        🎬
                    </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-white">
                        <Play size={20} fill="white" />
                    </div>
                </div>

                {video.duration && (
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                        {video.duration}
                    </div>
                )}

                {video.visible === false && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                        مخفي
                    </div>
                )}

                {isOwner && (
                    <div className="absolute top-2 left-2 flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(video); }}
                            title={video.visible === false ? 'إظهار للزوار' : 'إخفاء عن الزوار'}
                            className="p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            {video.visible === false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(video); }}
                            title="حذف"
                            className="p-1.5 rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4">
                {video.category && (
                    <span className="inline-block px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-semibold mb-2">
                        {video.category}
                    </span>
                )}
                <h3 className="text-[0.95rem] font-semibold mb-1.5 leading-snug line-clamp-2">
                    {video.title}
                </h3>
                {video.publishDate && (
                    <div className="text-xs text-text-muted">{video.publishDate}</div>
                )}
            </div>
        </div>
    );
}

export default VideoCard;
