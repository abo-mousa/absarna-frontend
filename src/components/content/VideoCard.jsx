import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, EyeOff, Trash2 } from 'lucide-react';
import { resolveMediaUrl, youtubeThumbnail, durationToSeconds } from '@/lib/media';
import { useChannel } from '@/hooks/useChannels';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '../ui/Avatar';

// Token is only needed (and only passed in) for a hidden video — see resolveMediaUrl's comment
// for why: a public thumbnail never needs it, so this keeps the token out of every ordinary
// feed/search thumbnail request.
function getThumbnail(video, token) {
    if (video.thumbnailUrl) return resolveMediaUrl(video.thumbnailUrl, video.visible === false ? token : null);
    if (video.sourceType === 'YOUTUBE') return youtubeThumbnail(video.sourceUrl);
    return null;
}

// Percent watched, for the small YouTube-style progress bar on the thumbnail. Hidden below 1%
// so a barely-started video doesn't show a distracting sliver.
function getWatchedPercent(video, watchedSeconds) {
    if (!watchedSeconds) return null;
    const totalSeconds = durationToSeconds(video.duration);
    if (!totalSeconds) return null;
    const percent = (watchedSeconds / totalSeconds) * 100;
    return percent > 1 ? Math.min(100, percent) : null;
}

function VideoCard({ video, onClick, isOwner, onToggleVisibility, onDelete, watchedSeconds, showChannel = true }) {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const thumbnail = thumbnailFailed ? null : getThumbnail(video, token);
    const watchedPercent = getWatchedPercent(video, watchedSeconds);
    const { data: channel } = useChannel(video.channelId, showChannel && !!video.channelId);

    // Nested icon buttons (visibility/delete/channel) already stopPropagation on click; for
    // keyboard, only treat Enter/Space as "activate the card" when the card itself is
    // focused, not when it bubbles up from one of those nested buttons' own activation.
    const handleKeyDown = (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(video);
        }
    };

    return (
        <div
            onClick={() => onClick(video)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label={`مشاهدة فيديو: ${video.title}`}
            className={`group bg-surface rounded-lg overflow-hidden border shadow-sm
                hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${video.visible === false ? 'border-dashed border-border' : 'border-border-light'}`}
        >
            <div className="relative aspect-video bg-surface-hover overflow-hidden">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={() => setThumbnailFailed(true)}
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
                            aria-label={video.visible === false ? 'إظهار للزوار' : 'إخفاء عن الزوار'}
                            className="p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            {video.visible === false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(video); }}
                            title="حذف"
                            aria-label="حذف الفيديو"
                            className="p-1.5 rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                {watchedPercent !== null && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                        <div className="h-full bg-primary/40" style={{ width: `${watchedPercent}%` }} />
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
                {channel && (
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/channel/${channel.slug}`); }}
                        aria-label={`الذهاب إلى قناة ${channel.name}`}
                        className="flex items-center gap-1.5 mb-1.5 text-xs text-text-secondary hover:text-primary transition-colors"
                    >
                        <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="sm" className="!w-5 !h-5 !text-[0.65rem]" />
                        {channel.name}
                    </button>
                )}
                {video.publishDate && (
                    <div className="text-xs text-text-muted">{video.publishDate}</div>
                )}
            </div>
        </div>
    );
}

export default VideoCard;
