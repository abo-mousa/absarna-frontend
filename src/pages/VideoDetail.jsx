import { useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Clock, Folder, Tv, User } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar, Spinner, LinkifiedText } from '../components/ui';
import { VideoPlayer, CommentsSection, VideoCard, BookmarkButton, LikeButton, ShareButton, SourceBadge, SubscribeButton } from '../components/content';
import { useVideo, useRelatedVideo, useWatchProgressMap, useWatchHistory } from '../hooks/useVideos';
import { useChannel } from '../hooks/useChannels';
import { useSeriesDetail, useSeriesNeighbours } from '../hooks/useSeries';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveMediaUrl, youtubeThumbnail } from '@/lib/media';
import { formatPublishDate, displayDate } from '@/lib/dayjsAr';
import { t } from '@/i18n';
import { formatCount } from '@/lib/numbers';

function VideoDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sharedTime = Number(searchParams.get('t')) || 0;
    const playerRef = useRef(null);
    const { data: video, isLoading, isError, error } = useVideo(id);
    const { data: related = [] } = useRelatedVideo(id);
    const { data: channel } = useChannel(video?.channelId, !!video?.channelId);
    const { data: seriesData } = useSeriesDetail(video?.seriesId, 1, !!video?.seriesId);
    const { data: neighbours } = useSeriesNeighbours(video?.seriesId, video?.id, !!video?.seriesId);
    const { token } = useAuth();
    const watchProgress = useWatchProgressMap(!!token);
    // Same cached `['watch-history']` query `useWatchProgressMap` reads internally — called
    // again here only for its `isLoading`, to gate mounting the player below (React Query
    // dedupes by key, so this isn't a second request).
    const { isLoading: historyLoading } = useWatchHistory(!!token);
    // An explicit `?t=` (share-at-timestamp) always wins; otherwise resume from this video's
    // own saved watch progress — the same `watchProgress` map already used below for the
    // related-videos row's progress bars, just never consulted for the player's own start
    // point before, so a video always restarted from 0 regardless of watch history.
    const startTime = sharedTime || Math.floor(watchProgress[video?.id] || 0);

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
                    error={error}
                    errorTitle={t('video.loadFailed')}
                    errorAction={<Link to="/" className="text-primary font-semibold">{t('common.backHome')}</Link>}
                />
            </PageShell>
        );
    }

    // Position and neighbours come from the series' own lookup, not from a page of its videos.
    // This page used to scan the complete content list, which stopped being available when the
    // series endpoint was paginated — a video on page 4 of a 99-video series is simply not in the
    // page the list happened to load, and its navigation would have silently vanished.
    /**
     * Goes back to wherever the viewer actually came from.
     *
     * <p>This was a hardcoded link to the home page, so arriving from a series — or a search, or a
     * channel — and pressing it dumped you on the home page instead of back into the list you were
     * working through. On a 99-video series that is the difference between watching a course and
     * re-finding your place after every episode.
     *
     * <p>`history.state.idx` is React Router's own cursor into the session's history: greater than
     * zero means there is a previous entry *within this app* to go back to. A deep link opened in
     * a fresh tab has none, and falls back to the home page — which is what the label then says,
     * because a button that says "back" and goes somewhere you have never been is worse than one
     * that admits where it is taking you.
     */
    const canGoBack = (window.history.state?.idx ?? 0) > 0;
    const handleBack = () => (canGoBack ? navigate(-1) : navigate('/'));

    const seriesIndex = (neighbours?.position ?? 0) - 1;
    const seriesTotal = neighbours?.total ?? 0;
    const prevVideo = neighbours?.previousId
        ? { id: neighbours.previousId, title: neighbours.previousTitle }
        : null;
    const nextVideo = neighbours?.nextId
        ? { id: neighbours.nextId, title: neighbours.nextTitle }
        : null;

    const meta = [
        video.duration && { icon: Clock, text: video.duration },
        video.category && { icon: Folder, text: video.category },
        video.speaker && { icon: User, text: video.speaker },
    ].filter(Boolean);

    // Views · comments · publish date — sits opposite the channel name instead of buried in
    // the meta row below, so it reads as this video's own stats rather than one more attribute
    // alongside duration/category.
    const stats = [
        video.viewCount != null && t('common.views', { count: formatCount(video.viewCount) }),
        video.commentCount != null && t('common.commentCount', { count: formatCount(video.commentCount) }),
        displayDate(video) && formatPublishDate(displayDate(video)),
        // Not the like count: LikeButton above already shows it, next to the control that
        // changes it, and it is the one number here that updates without a reload.
    ].filter(Boolean).join(' · ');

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="bg-surface rounded-lg overflow-hidden border border-border-light shadow-sm mb-6">
                    {historyLoading ? (
                        // Holds the player back until we know the real resume point — the
                        // YouTube branch below only ever seeks once, at player-creation time,
                        // so starting it with `startTime` still 0 (history not loaded yet) would
                        // silently lose the resume for good, not just delay it.
                        <div className="aspect-video flex items-center justify-center">
                            <Spinner />
                        </div>
                    ) : (
                        <VideoPlayer
                            ref={playerRef}
                            videoId={video.id}
                            sourceType={video.sourceType}
                            sourceUrl={video.sourceUrl}
                            title={video.title}
                            poster={thumbnail}
                            duration={video.duration}
                            startTime={startTime}
                        />
                    )}
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
                            {/* initialCount from the DTO the page already has, so the number
                                does not flash 0 while the status query resolves. */}
                            <LikeButton type="video" id={video.id} initialCount={video.likeCount} />
                            <BookmarkButton type="video" id={video.id} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        {channel ? (
                            <div className="flex items-center gap-3 flex-wrap">
                                <Link
                                    to={`/channel/${channel.slug}`}
                                    className="flex items-center gap-2 w-fit text-text-primary hover:text-primary transition-colors"
                                >
                                    <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="sm" />
                                    <span className="font-semibold text-sm">{channel.name}</span>
                                </Link>
                                {/* Following a channel from the video you are actually watching,
                                    rather than having to open the channel page to do it — the
                                    only place this control existed before. */}
                                <SubscribeButton channelId={channel.id} className="!px-4 !py-1.5 !text-xs" />
                            </div>
                        ) : <span />}
                        {stats && <span className="text-xs text-text-muted">{stats}</span>}
                    </div>

                    <div className="flex gap-4 flex-wrap text-sm text-text-secondary mb-4 items-center">
                        <SourceBadge sourceType={video.sourceType} showLabel />
                        {meta.map(({ icon: Icon, text }, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <Icon size={14} /> {text}
                            </span>
                        ))}
                    </div>

                    {video.description && (
                        <LinkifiedText text={video.description} className="text-text-secondary leading-loose" />
                    )}
                </div>

                {seriesData?.pages?.[0]?.series && (
                    <div className="bg-surface p-4 sm:p-5 rounded-lg border border-border-light mb-6">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                            <Link
                                to={`/series/${seriesData.pages[0].series.id}`}
                                className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                            >
                                <Tv size={14} /> {seriesData.pages[0].series.title}
                            </Link>
                            {seriesIndex >= 0 && (
                                <span className="text-xs text-text-muted">
                                    {t('video.seriesPart', { index: seriesIndex + 1, total: seriesTotal })}
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
                                <ChevronLeft size={16} /> {t('video.next')}
                            </button>
                            <button
                                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                                disabled={!prevVideo}
                                title={prevVideo?.title}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-surface-hover text-text-secondary text-sm font-semibold hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight size={16} /> {t('video.previous')}
                            </button>
                        </div>
                    </div>
                )}

                <CommentsSection type="video" id={video.id} />

                {related.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-lg font-bold mb-3">{t('video.related')}</h2>
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
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 text-primary font-semibold w-fit"
                    >
                        <ArrowRight size={16} /> {canGoBack ? t('common.back') : t('common.backHome')}
                    </button>
                </div>
            </div>
        </PageShell>
    );
}

export default VideoDetail;
