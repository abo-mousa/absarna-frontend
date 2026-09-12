import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, EyeOff, Trash2, Tv, Calendar, Loader2 } from 'lucide-react';
import { resolveMediaUrl, youtubeThumbnail, durationToSeconds } from '@/lib/media';
import { formatPublishDate, displayDate } from '@/lib/dayjsAr';
import { useChannel } from '@/hooks/useChannels';
import Avatar from '../ui/Avatar';
import SourceBadge from './SourceBadge';
import { t } from '@/i18n';
import { ownerBadge } from '@/lib/review';
import { formatCount } from '@/lib/numbers';

/**
 * One metadata row in the card's left-hand column, and the box its leading glyph sits in.
 *
 * <p><b>The glyph box has a width of its own, and that is the whole point.</b> The three rows lead
 * with three different things — a 20px channel avatar, a 12px series glyph, a 12px calendar — and
 * left to themselves each label began wherever its own glyph happened to end. Three labels meant
 * to read as one column started on three different vertical lines, off by the 8px the avatar is
 * wider, which is exactly the kind of misalignment that looks like nothing in isolation and like
 * carelessness in a grid of twenty cards. A fixed `w-5` slot with the glyph centred in it makes
 * the text start one place, whatever is in front of it — and keeps working when a row is absent,
 * since it is the slot and not the sibling that sets the offset.
 */
const META_GLYPH = 'w-5 flex justify-center flex-shrink-0';
const META_ROW = 'flex items-center gap-1.5 text-xs max-w-full';

function getThumbnail(video) {
    if (video.thumbnailUrl) {
        // Returns null for an object key — an uploaded video has no thumbnail until a
        // worker produces one, so the caller's placeholder is the correct state.
        return resolveMediaUrl(video.thumbnailUrl);
    }
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
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const thumbnail = thumbnailFailed ? null : getThumbnail(video);
    const watchedPercent = getWatchedPercent(video, watchedSeconds);
    // Null for everyone but the owner, and null for the owner too unless there is a verdict worth
    // showing. The backend does not send `review` to a stranger at all, so this is the second lock
    // on that door rather than the only one. One badge -- the most serious -- because two on a
    // thumbnail is a layout problem and a reading problem; the page behind it lists every finding.
    const music = ownerBadge(video, isOwner);
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
            aria-label={t('video.watchAria', { title: video.title })}
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

                <SourceBadge
                    sourceType={video.sourceType}
                    className="absolute bottom-2 right-2"
                />

                {/* Both badges stack in one corner so a hidden, still-transcoding video shows
                    both rather than one covering the other. */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {video.visible === false && (
                        <div className="bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                            {t('common.hidden')}
                        </div>
                    )}
                    {/* Owner-only, because nobody else can see an UPLOADED video at all — every
                        public query gates on status = READY. This is the missing half of a
                        deliberate design decision on the backend: there is no notification
                        channel for a finished transcode, so re-fetching is the ONLY way an owner
                        learns it completed. Until now nothing in the UI displayed `status`, so a
                        just-uploaded video looked identical to a broken one. */}
                    {isOwner && video.status === 'UPLOADED' && (
                        <div className="flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                            <Loader2 size={12} className="animate-spin" />
                            {t('video.processing')}
                        </div>
                    )}
                    {/* Owner-only, same reasoning as the badge above and the same reason it has
                        to exist at all: a held video is READY and visible and reachable by
                        nobody, so without this its owner sees a video that simply vanished. Amber
                        when it is actually hidden, slate when it is only a note on a video that
                        is published and playing — two of the four verdicts do not hide anything,
                        and colouring both as a problem would train owners to ignore both. The
                        reason and the timestamps are on the detail page; a card gets two words. */}
                    {music && (
                        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded text-white ${
                            music.hidden ? 'bg-amber-600/90' : 'bg-slate-600/90'
                        }`}>
                            {music.hidden && <EyeOff size={12} />}
                            {music.label}
                        </div>
                    )}
                </div>

                {isOwner && (
                    <div className="absolute top-2 left-2 flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(video); }}
                            title={video.visible === false ? t('common.showToVisitors') : t('common.hideFromVisitors')}
                            aria-label={video.visible === false ? t('common.showToVisitors') : t('common.hideFromVisitors')}
                            className="p-1.5 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                            {video.visible === false ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(video); }}
                            title={t('common.delete')}
                            aria-label={t('video.deleteAria')}
                            className="p-1.5 rounded-md bg-black/60 text-white hover:bg-red-600 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                {watchedPercent !== null && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/70">
                        {/* A fixed, muted (not saturated/neon) turquoise, not the `primary` token —
                            `primary` is deliberately deep/muted for button fills (see index.css)
                            and read as barely-there here. Brighter in light mode via `dark:` —
                            the deeper shade alone already read clearly in dark mode, but got lost
                            against a lighter light-mode page even with the darkened track above. */}
                        <div className="h-full bg-[#45A296] dark:bg-[#337F77]" style={{ width: `${watchedPercent}%` }} />
                    </div>
                )}
            </div>

            {/* Title on its own full-width row, then the metadata as two columns beside each
                other, split by kind rather than by how many fit: <b>what this video is</b>
                (channel, series, date) at the start edge, and <b>its numbers</b> (views,
                comments, likes) at the end edge. Keeping the counts to one column of their own
                is what lets them line up as a readable stack instead of one text line mixed in
                among links. `min-w-0` — without it a flex item won't shrink below its content's
                natural width, which silently breaks the title's `line-clamp-2` and the
                channel/series `truncate`. */}
            <div className="p-4 min-w-0">
                <h3 className="text-[0.95rem] font-semibold mb-1.5 leading-snug line-clamp-2">
                    {video.title}
                </h3>

                <div className="flex items-start justify-between gap-3">
                    {/* Always rendered even when empty: it is what holds the meta column at the
                        far edge, since `justify-between` on a lone child places it at the start. */}
                    <div className="min-w-0 space-y-1">
                        {channel && (
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/channel/${channel.slug}`); }}
                                aria-label={t('video.goToChannelAria', { name: channel.name })}
                                className={`${META_ROW} text-text-secondary hover:text-primary transition-colors`}
                            >
                                <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="sm" className="!w-5 !h-5 !text-[0.65rem] flex-shrink-0" />
                                <span className="truncate">{channel.name}</span>
                            </button>
                        )}
                        {/* Which series this belongs to. A link, because the series page is where
                            someone who recognises the name actually wants to go — and stopPropagation
                            so it does not also trigger the card's own navigate-to-video. */}
                        {video.seriesId && video.seriesTitle && (
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/series/${video.seriesId}`); }}
                                title={t('series.partOf', { title: video.seriesTitle })}
                                className={`${META_ROW} text-text-muted hover:text-primary transition-colors`}
                            >
                                <span className={META_GLYPH}><Tv size={12} /></span>
                                <span className="truncate">{video.seriesTitle}</span>
                            </button>
                        )}
                        {/* Not a count, so it belongs here rather than in the numbers column —
                            and it is the one line of the three that is plain text, hence the
                            icon, which keeps it aligned with the avatar and the series glyph
                            above it. `displayDate` prefers originalPublishDate when there is
                            one; see lib/dayjsAr. */}
                        {displayDate(video) && (
                            <div className={`${META_ROW} text-text-muted`}>
                                <span className={META_GLYPH}><Calendar size={12} /></span>
                                <span className="truncate">{formatPublishDate(displayDate(video))}</span>
                            </div>
                        )}
                    </div>

                    {/* Counts only. commentCount and likeCount are real DTO fields, each computed
                        server-side by one grouped COUNT per list response — not fetched per card,
                        see backend CLAUDE.md.

                        All three phrased the same way ("{n} مشاهدة"), including likes: an icon +
                        bare number for one of the three and words for the other two read as an
                        odd one out, and the label is what makes the number legible to a screen
                        reader without an aria-label to maintain. The heart lives on the detail
                        page's LikeButton, where it is a control rather than a statistic.

                        Read-only here, deliberately not a toggle: the card has no per-viewer
                        `liked` state (VideoDTO carries the public count only), and giving every
                        card one would mean a status request per card on every feed page.

                        `text-start`, not `text-end`: the three lines are different lengths, so
                        whichever edge is not aligned is ragged — and end-aligned put the ragged
                        edge at the START, which in RTL is the edge the eye lands on first. The
                        three numbers, the only part anyone is scanning for, stepped inward one
                        after another. Aligning at the start puts them on one vertical line and
                        moves the raggedness to the far edge, where nothing is being compared. */}
                    {(video.viewCount != null || video.commentCount != null
                        || video.likeCount != null) && (
                        <div className="flex-shrink-0 text-xs text-text-muted space-y-1 whitespace-nowrap text-start">
                            {video.viewCount != null && <div>{t('common.views', { count: formatCount(video.viewCount) })}</div>}
                            {video.commentCount != null && <div>{t('common.commentCount', { count: formatCount(video.commentCount) })}</div>}
                            {video.likeCount != null && <div>{t('likes.count', { count: formatCount(video.likeCount) })}</div>}
                        </div>
                    )}
                </div>

                {video.category && (
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-semibold">
                        {video.category}
                    </span>
                )}
            </div>
        </div>
    );
}

export default VideoCard;
