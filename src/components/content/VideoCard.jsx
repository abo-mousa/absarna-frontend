import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, EyeOff, Trash2, Calendar, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { resolveMediaUrl, youtubeThumbnail } from '@/lib/media';
import { useConsent } from '@/contexts/ConsentContext';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import Avatar from '../ui/Avatar';
import { KhatamStar } from '../ui/Khatam';
import SourceBadge from './SourceBadge';
import { formatDigits, t } from '@/i18n';
import { ownerBadge } from '@/lib/review';
import { formatCompactCount } from '@/lib/numbers';
import { videoKicker } from '@/lib/kicker';

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

// Percent watched, for the bar on the picture — the backend's fraction (the watch history's
// `progress`), never a position divided by a length here. Hidden below 1% so a barely-started
// video does not show a distracting sliver.
function watchedPercentOf(watch) {
    const progress = Number(watch?.progress);
    return progress > 0.01 ? Math.min(1, progress) * 100 : null;
}

/**
 * A kicker's two halves side by side: the name in its own direction and allowed to truncate, the
 * count in the interface's and never cut — «…السيرة النبوية · ١٠٣ من ١٤٠» loses the end of the
 * title, not the number, which is the part a reader scanning a series needs.
 */
function KickerText({ kicker }) {
    return (
        <span className="flex items-center min-w-0 gap-1">
            <span dir="auto" className="truncate">{kicker.name}</span>
            {kicker.place && (
                <>
                    <span aria-hidden="true">·</span>
                    <span className="flex-shrink-0 whitespace-nowrap">{kicker.place}</span>
                </>
            )}
        </span>
    );
}

/**
 * @param watch the viewer's own `{progress, finished}` for this video, from the watch history —
 *        both the backend's (WatchProgress): the bar is `progress`, the star is `finished`.
 */
function VideoCard({ video, onClick, isOwner, onToggleVisibility, onDelete, watch, showChannel = true }) {
    const navigate = useNavigate();
    const { youtubeAllowed } = useConsent();
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const thumbnail = thumbnailFailed ? null : getThumbnail(video, youtubeAllowed);
    const watchedPercent = watchedPercentOf(watch);
    const finished = watch?.finished === true;
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
    const kicker = videoKicker(video);

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
            // NO BOX. The card is the picture and the type under it, sitting on the page — a
            // border, a fill and a shadow on every tile is what made the grid read as a video
            // site before anything in it had been read. The thumbnail keeps a hairline so a pale
            // frame still has an edge; a hidden video's is dashed, which is the signal the card's
            // own border used to carry.
            //
            // The hairline turns gold, and thickens, under the pointer and under keyboard focus —
            // and only then: gold marks the one thing being pointed at, so it is never on every
            // card of a grid, where it would be decoration and could no longer point at anything.
            className="group cursor-pointer rounded-card focus:outline-none"
        >
            <div className={`relative aspect-video bg-surface-hover overflow-hidden rounded-card outline outline-1 -outline-offset-1
                transition-[outline-color] duration-150
                group-hover:outline-2 group-hover:-outline-offset-2 group-hover:outline-gold
                group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-gold ${
                video.visible === false ? 'outline-dashed outline-text-muted' : 'outline-black/5 dark:outline-white/5'
            }`}>
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={video.title}
                        // Blurred past recognition under a graphic-content warning: the cover below
                        // says what the picture holds, and the video page asks before it plays.
                        className={`w-full h-full object-cover ${video.graphicContent ? 'blur-xl scale-110' : ''}`}
                        onError={() => setThumbnailFailed(true)}
                    />
                ) : (
                    // Not yet a poster (an upload still transcoding, or no consent for YouTube's):
                    // the star on the brand gradient, where there used to be a film emoji.
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary">
                        <KhatamStar filled={false} className="w-12 h-12 text-white/30" />
                    </div>
                )}

                {video.graphicContent && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white text-center p-3">
                        <AlertTriangle size={22} aria-hidden="true" />
                        <span className="text-sm font-bold">{t('voice.graphicTitle')}</span>
                        <span className="text-[0.7rem] border border-white/50 rounded-full px-2.5 py-0.5 mt-1">{t('voice.tapToView')}</span>
                    </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-white">
                        <Play size={20} fill="white" />
                    </div>
                </div>

                <SourceBadge
                    sourceType={video.sourceType}
                    className="absolute bottom-2 start-2"
                />

                {/* Both badges stack in one corner so a hidden, still-transcoding video shows
                    both rather than one covering the other. */}
                <div className="absolute top-2 start-2 flex flex-col items-end gap-1">
                    {/* «جديد»: released today or yesterday, as the backend decides (NewRelease).
                        A fill, so gold's fill shade with dark ink. Not on a video this viewer has
                        already finished — news of it is no longer news to them. */}
                    {video.newRelease && !finished && (
                        <div className="bg-gold text-gray-900 text-[0.7rem] font-bold px-2 py-0.5 rounded-sm">
                            {t('common.newRelease')}
                        </div>
                    )}
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

                {/* Finished — the backend's rule (90%). The star, and only here: on the few cards a
                    viewer has actually finished, a quiet «done», the Today page's idea of
                    accomplishment carried to the grid. */}
                {finished && (
                    <span
                        role="img"
                        aria-label={t('video.finished')}
                        title={t('video.finished')}
                        className="absolute bottom-2 end-2 flex items-center justify-center w-6 h-6 rounded-full bg-black/65"
                    >
                        <KhatamStar className="w-3.5 h-3.5 text-gold" />
                    </span>
                )}

                {watchedPercent !== null && (
                    <div className="absolute bottom-0 inset-x-0 h-[3px] bg-black/70">
                        {/* Gold, the redesign's colour for progress everywhere (the star's trace
                            is the same), and the fill shade of it: on the darkened track it needs
                            brightness, not the text shade's contrast against the page. */}
                        <div className="h-full bg-gold" style={{ width: `${watchedPercent}%` }} />
                    </div>
                )}
            </div>

            {/* The kicker, the title, then one column of what this video is: channel, and a
                last line carrying its length, its number and its date together —
                «٤٥:٣٠ · ١٫٢ ألف مشاهدات · ٣ مارس ٢٠٢٤».

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
            <div className="pt-3 min-w-0">
                {/* What it belongs to, before what it is called — see lib/kicker. A link when it
                    names a series, which is where someone who recognises the name wants to go;
                    stopPropagation so it does not also open the video. The series used to be a
                    grey row under the title with a TV glyph; it is the first thing read now.

                    The line's height is reserved when there is no kicker, for the reason the
                    title's two lines are: a row mixing a series lecture with a standalone video
                    would otherwise start the two titles a line apart. */}
                <div className="h-4 mb-1 min-w-0">
                    {kicker && (kicker.seriesId ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/series/${kicker.seriesId}`); }}
                            title={t('series.partOf', { title: video.seriesTitle })}
                            className="flex items-center gap-1.5 max-w-full h-4 text-xs font-bold text-gold-ink hover:underline"
                        >
                            <KhatamStar className="w-2.5 h-2.5 flex-shrink-0" />
                            <KickerText kicker={kicker} />
                        </button>
                    ) : (
                        // Brick red for testimony: a first-person account must never read as a produced
                    // report, wherever it appears.
                    <div className={`flex items-center gap-1.5 max-w-full h-4 text-xs font-bold ${video.format === 'TESTIMONY' ? 'text-voice' : 'text-gold-ink'}`}>
                            <KhatamStar className="w-2.5 h-2.5 flex-shrink-0" />
                            <KickerText kicker={kicker} />
                        </div>
                    ))}
                </div>
                {/* Two lines reserved whether the title needs them or not. Cards in a grid row
                    stretch to the tallest, so a one-line title used to leave its card's rows a line
                    higher than its neighbours' and a blank band at the bottom: the "this card is
                    missing something" look. With the slot fixed, channel and views sit on
                    the same lines across a row. 2.75em is exactly two lines at leading-snug. */}
                <h3 dir="auto" className="text-[0.95rem] font-bold mb-1.5 leading-snug line-clamp-2 min-h-[2.75em] group-hover:text-gold-ink group-focus-visible:text-gold-ink transition-colors">
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
                    {(video.duration || hasViews || date) && (
                        <div className={`${META_ROW} text-text-muted`}>
                            {/* The glyph names the line's first item: the clock when it opens with
                                the length, the eye with views, the calendar when the date stands
                                alone. */}
                            <span className={META_GLYPH}>
                                {video.duration ? <Clock size={12} /> : hasViews ? <Eye size={12} /> : <Calendar size={12} />}
                            </span>
                            {/* The length moved here from a black badge over the picture — the
                                most recognisable single mark of a YouTube thumbnail. A display
                                string the backend sends verbatim ("45:30"), so it never passed
                                through `formatCount` or a `t()` placeholder; mapping its digits
                                is the whole of what is safe to do to it. */}
                            {video.duration && (
                                <span className="flex-shrink-0 whitespace-nowrap">{formatDigits(video.duration)}</span>
                            )}
                            {video.duration && (hasViews || date) && <span aria-hidden="true">·</span>}
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
                    {video.removedElsewhere && (
                        <div className={`${META_ROW} text-voice`}>
                            <span className={META_GLYPH}><AlertTriangle size={12} /></span>
                            <span className="truncate">{t('voice.removedElsewhere')} <span className="opacity-75">{t('voice.perChannel')}</span></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoCard;
