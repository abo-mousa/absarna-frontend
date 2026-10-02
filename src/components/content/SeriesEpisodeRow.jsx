import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Eye, Calendar } from 'lucide-react';
import { videoPoster } from '@/lib/media';
import { useConsent } from '@/contexts/ConsentContext';
import { formatPublishDate, displayDate } from '@/lib/datetime';
import { formatCompactCount } from '@/lib/numbers';
import { KhatamStar } from '../ui/Khatam';
import MetaDivider from '../ui/MetaDivider';
import ExpandableText from '../ui/ExpandableText';
import LinkifiedText from '../ui/LinkifiedText';
import { formatDigits, t } from '@/i18n';

/**
 * One episode on a series page, as a row: its number, the poster, the title, and its description
 * underneath — the way a course reads, where the grid of cards read as a video site.
 *
 * <p><b>The number is the episode's place, `seriesPosition`</b>, counted by the backend in episode
 * order, so it is the same whichever way the page is sorted: «الأحدث أولاً» reads 12, 11, 10 down
 * the page, never a second sequence that disagrees with "12 of 12" on the video page.
 *
 * <p><b>The description opens in place</b> (ExpandableText, two lines collapsed). Reading more of
 * it must not mean opening the video, which counts a view and starts a player. So the row is not
 * one big link: the poster and the title are, and the description and its toggle sit beside them.
 *
 * @param watch the viewer's own `{progress, finished}` from the watch history, as on a card
 */
function SeriesEpisodeRow({ video, watch }) {
    const { youtubeAllowed } = useConsent();
    const [posterFailed, setPosterFailed] = useState(false);
    const poster = posterFailed ? null : videoPoster(video, youtubeAllowed);
    const progress = Number(watch?.progress);
    const watchedPercent = progress > 0.01 ? Math.min(1, progress) * 100 : null;
    const finished = watch?.finished === true;
    const hasViews = Number(video.viewCount) > 0;
    const date = displayDate(video);
    const to = `/video/${video.id}`;

    return (
        // A grid so the description can sit beside the poster where there is room and run the full
        // width under it on a phone, where the column beside a poster is a few words wide.
        <li className="grid grid-cols-[9rem_1fr] sm:grid-cols-[2rem_14rem_1fr] gap-x-3 sm:gap-x-4 gap-y-2 py-4 border-b border-border-light last:border-b-0">
            <span className="hidden sm:block sm:row-span-2 pt-1 text-center text-sm font-bold text-text-muted tabular-nums">
                {video.seriesPosition != null ? formatDigits(String(video.seriesPosition)) : ''}
            </span>

            <Link
                to={to}
                tabIndex={-1}
                aria-hidden="true"
                className="relative aspect-video sm:row-span-2 self-start overflow-hidden rounded-card bg-surface-hover outline outline-1 -outline-offset-1 outline-black/5 dark:outline-white/5 hover:outline-2 hover:outline-gold"
            >
                {poster ? (
                    <img
                        src={poster}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover ${video.graphicContent ? 'blur-xl scale-110' : ''}`}
                        onError={() => setPosterFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary">
                        <KhatamStar filled={false} className="w-8 h-8 text-white/30" />
                    </div>
                )}
                {video.graphicContent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
                        <AlertTriangle size={18} aria-hidden="true" />
                    </div>
                )}
                {video.newRelease && !finished && (
                    <span className="absolute top-1.5 start-1.5 bg-gold text-gray-900 text-[0.65rem] font-bold px-1.5 py-0.5 rounded-sm">
                        {t('common.newRelease')}
                    </span>
                )}
                {(video.duration || finished) && (
                    <span className="absolute bottom-1.5 end-1.5 flex items-center gap-1 bg-black/75 text-white text-[0.7rem] font-semibold px-1.5 py-0.5 rounded">
                        {finished && (
                            // The star itself is aria-hidden (KhatamStar); the wrapper names it.
                            <span role="img" aria-label={t('video.finished')} title={t('video.finished')}>
                                <KhatamStar className="w-3 h-3 text-gold" />
                            </span>
                        )}
                        {video.duration && formatDigits(video.duration)}
                    </span>
                )}
                {watchedPercent !== null && (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
                        <span className="block h-full bg-gold" style={{ width: `${watchedPercent}%` }} />
                    </span>
                )}
            </Link>

            <div className="min-w-0">
                <Link to={to} className="block hover:no-underline group">
                    <h3 dir="auto" className="font-bold leading-snug line-clamp-2 group-hover:text-primary">
                        <span className="sm:hidden text-text-muted">
                            {video.seriesPosition != null && `${formatDigits(String(video.seriesPosition))}. `}
                        </span>
                        {video.title}
                    </h3>
                </Link>
                {(hasViews || date) && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                        {hasViews ? <Eye size={12} /> : <Calendar size={12} />}
                        {hasViews && (
                            <span className="whitespace-nowrap">
                                {t('common.views', { count: formatCompactCount(video.viewCount) })}
                            </span>
                        )}
                        {hasViews && date && <MetaDivider />}
                        {date && <span className="truncate">{formatPublishDate(date)}</span>}
                    </div>
                )}
            </div>

            {video.description && (
                <ExpandableText
                    className="col-span-2 sm:col-span-1 sm:col-start-3 min-w-0"
                    collapsedClassName="max-h-12"
                    fadeClassName="from-bg"
                >
                    <LinkifiedText text={video.description} className="text-sm text-text-secondary leading-relaxed" />
                </ExpandableText>
            )}
        </li>
    );
}

export default SeriesEpisodeRow;
