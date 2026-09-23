import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, EyeOff, Trash2, Tv, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { resolveMediaUrl, youtubeThumbnail, durationToSeconds } from '@/lib/media';
import { useConsent } from '@/contexts/ConsentContext';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import Avatar from '../ui/Avatar';
import SourceBadge from './SourceBadge';
import { formatDigits, t } from '@/i18n';
import { ownerBadge } from '@/lib/review';
import { formatCompactCount } from '@/lib/numbers';

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

function getThumbnail(video, youtubeAllowed) {
    if (video.thumbnailUrl) {
        // Returns null for an object key — an uploaded video has no thumbnail until a
        // worker produces one, so the caller's placeholder is the correct state.
        return resolveMediaUrl(video.thumbnailUrl);
    }
    // ONLY WITH CONSENT. This line is the busiest request to Google on the whole site: it fires
    // from the reader's browser for every imported video on the home feed, in search and on every
    // channel page, before anything has been clicked, carrying their IP address and user agent.
    // Held back until they have said yes — the placeholder below is already the correct fallback,
    // because an uploaded video has no thumbnail either until its transcode finishes.
    //
    // Note an owner's own poster is unaffected: it is served from our storage and is the branch
    // above. A channel that uploads its own thumbnails looks identical either way.
    if (video.sourceType === 'YOUTUBE' && youtubeAllowed) return youtubeThumbnail(video.sourceUrl);
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
    const { youtubeAllowed } = useConsent();
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const thumbnail = thumbnailFailed ? null : getThumbnail(video, youtubeAllowed);
    const watchedPercent = getWatchedPercent(video, watchedSeconds);
    // Null for everyone but the owner, and null for the owner too unless there is a verdict worth
    // showing. The backend does not send `review` to a stranger at all, so this is the second lock
    // on that door rather than the only one. One badge -- the most serious -- because two on a
    // thumbnail is a layout problem and a reading problem; the page behind it lists every finding.
    const music = ownerBadge(video, isOwner);
    // The channel's name, slug and logo ride on the VideoDTO itself, batch-filled server-side by
    // ChannelCardAttacher. This used to be `useChannel(video.channelId)` — one query per distinct
    // channel, deduplicated across cards but still a request the card had to make and wait for,
    // after the list it belongs to had already arrived. A home page drawing on eleven channels
    // issued eleven of them.
    const showChannelRow = showChannel && !!video.channelSlug;
    // Zero is a real count and is left off on purpose — see the meta line below.
    const hasViews = Number(video.viewCount) > 0;
    const date = displayDate(video);

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
                    <div className="absolute bottom-2 end-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                        {/* A display string the backend sends verbatim ("45:30"), so it never
                            passed through `formatCount` or a `t()` placeholder. Mapping its
                            digits is the whole of what is safe to do to it. */}
                        {formatDigits(video.duration)}
                    </div>
                )}

                <SourceBadge
                    sourceType={video.sourceType}
                    className="absolute bottom-2 start-2"
                />

                {/* Both badges stack in one corner so a hidden, still-transcoding video shows
                    both rather than one covering the other. */}
                <div className="absolute top-2 start-2 flex flex-col items-end gap-1">
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
                    {/* THE OTHER END OF THAT STORY, and the half that was missing. A transcode
                        can FAIL, and nothing retries it automatically — a source ffmpeg cannot
                        decode fails identically every time, so the reconciler deliberately leaves
                        FAILED alone and only re-queues videos stuck in UPLOADED. With no branch
                        for it here, a failed upload rendered as a card that never plays and says
                        nothing, indefinitely, indistinguishable from one still being processed.
                        Red rather than the neutral black above: this one is not going to resolve
                        by waiting. Two words on a card — the explanation and the retry control
                        are on the dashboard, which is where an owner can act on it. */}
                    {isOwner && video.status === 'FAILED' && (
                        <div className="flex items-center gap-1 bg-red-600/90 text-white text-xs font-semibold px-2 py-0.5 rounded">
                            <AlertTriangle size={12} />
                            {t('video.transcodeFailed')}
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
                    <div className="absolute top-2 end-2 flex gap-1">
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
                    <div className="absolute bottom-0 inset-x-0 h-[3px] bg-black/70">
                        {/* A fixed, muted (not saturated/neon) turquoise, not the `primary` token —
                            `primary` is deliberately deep/muted for button fills (see index.css)
                            and read as barely-there here. Brighter in light mode via `dark:` —
                            the deeper shade alone already read clearly in dark mode, but got lost
                            against a lighter light-mode page even with the darkened track above. */}
                        <div className="h-full bg-[#45A296] dark:bg-[#337F77]" style={{ width: `${watchedPercent}%` }} />
                    </div>
                )}
            </div>

            {/* Title, then one column of what this video is: channel, series, and a last line
                carrying its number and its date together — «١٫٢ ألف مشاهدات · ٣ مارس ٢٠٢٤».

                ONE COLUMN, NOT TWO, now that there is one number. The card used to split into
                "what it is" at the start edge and "its numbers" (views, comments, likes) at the
                far edge, which was right for a stack of three counts and wrong for one: a lone
                "٢٣ مشاهدات" floating at the far edge of an otherwise empty column read as a card
                missing the rest of its data. Comments and likes left the card deliberately — on a
                young catalogue nearly every one read «٠ تعليق · ٠ إعجاب», which says "nothing
                here" about lectures that are simply new, and they are social-proof numbers the
                feed already refuses to rank by. Both are on the detail page, where the like button
                is. The backend no longer sends them on lists at all.

                Views and date share a line because they answer one question — "how established is
                this?" — and are read together; on their own lines each looked like a fragment.
                The view count is abbreviated (formatCompactCount: «1.1k», «١٫١ ألف»), because it
                is the one number compared across a grid. A video nobody has watched yet shows its
                date alone rather than «٠ مشاهدات», which reads as a verdict on a lecture that was
                published an hour ago. `min-w-0` — without it a flex item won't shrink below its
                content's natural width, which silently breaks the title's `line-clamp-2` and the
                rows' `truncate`. */}
            <div className="p-4 min-w-0">
                {/* Two lines reserved whether the title needs them or not. Cards in a grid row
                    stretch to the tallest, so a one-line title used to leave its card's rows a line
                    higher than its neighbours' and a blank band at the bottom: the "this card is
                    missing something" look. With the slot fixed, channel, series and views sit on
                    the same lines across a row. 2.75em is exactly two lines at leading-snug. */}
                <h3 dir="auto" className="text-[0.95rem] font-semibold mb-1.5 leading-snug line-clamp-2 min-h-[2.75em]">
                    {video.title}
                </h3>

                <div className="min-w-0 space-y-1">
                    {showChannelRow && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/channel/${video.channelSlug}`); }}
                            aria-label={t('video.goToChannelAria', { name: video.channelName })}
                            className={`${META_ROW} text-text-secondary hover:text-primary transition-colors`}
                        >
                            <Avatar src={resolveMediaUrl(video.channelLogoUrl)} name={video.channelName} size="sm" className="!w-5 !h-5 !text-[0.65rem] flex-shrink-0" />
                            <span dir="auto" className="truncate">{video.channelName}</span>
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
                            <span dir="auto" className="truncate">{video.seriesTitle}</span>
                        </button>
                    )}
                    {(hasViews || date) && (
                        <div className={`${META_ROW} text-text-muted`}>
                            {/* The glyph names the line's first item: the eye when it opens with
                                views, the calendar when the date stands alone. */}
                            <span className={META_GLYPH}>
                                {hasViews ? <Eye size={12} /> : <Calendar size={12} />}
                            </span>
                            {hasViews && (
                                <span className="flex-shrink-0 whitespace-nowrap">
                                    {t('common.views', { count: formatCompactCount(video.viewCount) })}
                                </span>
                            )}
                            {hasViews && date && <span aria-hidden="true">·</span>}
                            {/* The date gives way first on a narrow card: it is the longer of the
                                two, and the number is what a reader scanning the grid compares.
                                `displayDate` prefers originalPublishDate; see lib/datetime. */}
                            {date && <span className="truncate">{formatPublishDate(date)}</span>}
                        </div>
                    )}
                </div>

                {video.category && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-primary-light text-primary rounded-full text-xs font-semibold">
                        {video.category}
                    </span>
                )}
            </div>
        </div>
    );
}

export default VideoCard;
