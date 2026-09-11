import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Play, X } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { VideoPlayer } from '../components/content';
import { Badge, Button, Modal, QueryState } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useMusicReviewQueue, useDecideMusicReview } from '../hooks/useMusicReview';
import { MUSIC_REVIEW, reviewRow } from '@/lib/musicReview';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

// HELD is the only verdict holding a video back, so it is the only one shown as a problem. The
// other two are a backlog on videos that are already published and playing.
const BADGE_VARIANT = {
    [MUSIC_REVIEW.HELD]: 'danger',
    [MUSIC_REVIEW.REJECTED]: 'danger',
    [MUSIC_REVIEW.ADVISORY]: 'featured',
    [MUSIC_REVIEW.UNCHECKED]: 'muted',
};

/**
 * The music review queue: listen to what the detector found, then clear or reject.
 *
 * <h2>Why playback is the point, not a nicety</h2>
 * The verdict is trustworthy and the span boundaries are not. Measured on a recording that is
 * music from end to end, the classifier dips below threshold repeatedly and the spans come back
 * as eight separate stretches covering 63% of it — so "there is music here" is reliable while
 * "exactly here" is not. A reviewer deciding from timestamps alone would be deciding from the
 * least reliable half of the output. Hearing twenty seconds settles it.
 *
 * <p>And the cases that most need hearing are the ones the rule is weakest on: a nasheed with
 * duff, a reciter over a room mic whose reverb reads as ambient texture, an intro sting on an
 * otherwise clean lecture. Those are judgement calls about content, which is exactly why v1
 * reports and a human decides.
 *
 * <p><b>A held video is not publicly playable, and that is not a problem here.</b>
 * {@code playback-url} gates on the same rule as everything else, but its owner/admin bypass
 * covers this caller — an admin gets a signed URL for a video that 404s for everyone else.
 */
function AdminMusicReview() {
    usePageMeta({ title: t('admin.musicReview.title') });
    const { showToast } = useToast();
    const { data, isLoading, isError, error, refetch } = useMusicReviewQueue();
    const decide = useDecideMusicReview();
    const playerRef = useRef(null);

    const [selectedId, setSelectedId] = useState(null);
    const [confirmingReject, setConfirmingReject] = useState(null);

    const rows = useMemo(
        () => (data?.content ?? []).map(reviewRow).filter(Boolean),
        [data],
    );
    const depth = data?.depth ?? {};

    // Select the first row, and re-select after a decision removes the current one. Without this
    // the reviewer decides on a video and the panel keeps showing it — with buttons that now do
    // nothing — instead of moving them on to the next.
    useEffect(() => {
        if (rows.length === 0) {
            setSelectedId(null);
            return;
        }
        if (!rows.some((row) => row.id === selectedId)) {
            setSelectedId(rows[0].id);
        }
    }, [rows, selectedId]);

    const selected = rows.find((row) => row.id === selectedId) ?? null;
    const selectedVideo = (data?.content ?? []).find((video) => video.id === selectedId) ?? null;

    const submit = (videoId, decision) => {
        decide.mutate({ videoId, decision }, {
            onSuccess: () => showToast(
                decision === MUSIC_REVIEW.CLEARED
                    ? t('admin.musicReview.cleared')
                    : t('admin.musicReview.rejected'),
                'success',
            ),
            onError: () => showToast(t('admin.musicReview.decisionFailed'), 'error'),
        });
        setConfirmingReject(null);
    };

    return (
        <PageShell>
            <div className="px-4 sm:px-6 py-6 sm:py-8">
                <h1 className="text-2xl font-bold mb-1">{t('admin.musicReview.title')}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-text-secondary">
                    {/* Held first and always shown, even at zero: it is the number that means
                        somebody's upload is invisible right now, and a queue whose backlog is
                        only visible by scrolling is a queue that stops being read. */}
                    <Badge variant={depth.HELD ? 'danger' : 'muted'}>
                        {t('admin.musicReview.heldCount', { count: depth.HELD ?? 0 })}
                    </Badge>
                    {depth.ADVISORY > 0 && (
                        <Badge variant="featured">
                            {t('admin.musicReview.advisoryCount', { count: depth.ADVISORY })}
                        </Badge>
                    )}
                    {depth.UNCHECKED > 0 && (
                        <Badge variant="muted">
                            {t('admin.musicReview.uncheckedCount', { count: depth.UNCHECKED })}
                        </Badge>
                    )}
                </div>

                <QueryState
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                    onRetry={refetch}
                    isEmpty={rows.length === 0}
                    emptyIcon="🎵"
                    emptyTitle={t('admin.musicReview.empty')}
                    emptyDescription={t('admin.musicReview.emptyDescription')}
                >
                    <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
                        {/* The queue */}
                        <ul className="flex flex-col gap-2 lg:max-h-[70vh] lg:overflow-y-auto">
                            {rows.map((row) => (
                                <li key={row.id}>
                                    <button
                                        onClick={() => setSelectedId(row.id)}
                                        aria-current={row.id === selectedId}
                                        className={`w-full text-right p-3 rounded-lg border transition-colors ${
                                            row.id === selectedId
                                                ? 'border-primary bg-primary-light'
                                                : 'border-border-light bg-surface hover:bg-surface-hover'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="font-semibold text-sm line-clamp-2">
                                                {row.title}
                                            </span>
                                            <Badge variant={BADGE_VARIANT[row.review] ?? 'muted'}>
                                                {t(`video.musicReview.${String(row.review).toLowerCase()}.badge`)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-text-secondary">
                                            {t('admin.musicReview.coveredSeconds', {
                                                seconds: Math.round(row.coveredSeconds),
                                            })}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* The one being decided */}
                        {selected && selectedVideo ? (
                            <div className="bg-surface border border-border-light rounded-lg overflow-hidden">
                                <VideoPlayer
                                    ref={playerRef}
                                    key={selected.id}
                                    videoId={selected.id}
                                    sourceType={selectedVideo.sourceType}
                                    sourceUrl={selectedVideo.sourceUrl}
                                    title={selected.title}
                                    poster={resolveMediaUrl(selectedVideo.thumbnailUrl)}
                                    duration={selectedVideo.duration}
                                />

                                <div className="p-5">
                                    <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
                                    <p className="text-sm text-text-secondary mb-4">{selected.reason}</p>

                                    <h3 className="text-sm font-semibold mb-1">
                                        {t('admin.musicReview.spansHeading', {
                                            count: selected.spans.length,
                                        })}
                                    </h3>
                                    {selected.spans.length > 0 ? (
                                        <>
                                            <p className="text-xs text-text-secondary mb-2">
                                                {t('admin.musicReview.spansHint')}
                                            </p>
                                            <div className="flex flex-wrap gap-2 mb-5">
                                                {selected.spans.map((span) => (
                                                    <button
                                                        key={`${span.start}-${span.end}`}
                                                        // The whole reason this screen has a
                                                        // player. seekTo lands a couple of seconds
                                                        // BEFORE the span, because the flagged
                                                        // window is 10.24s wide and the sound that
                                                        // tripped it can sit anywhere inside --
                                                        // landing on the boundary regularly drops
                                                        // the reviewer into silence just before
                                                        // the music, which reads as a false
                                                        // positive when it is not one.
                                                        onClick={() => playerRef.current?.seekTo(span.seekTo)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
                                                            bg-surface-hover border border-border text-sm font-mono
                                                            hover:bg-primary-light hover:border-primary transition-colors"
                                                    >
                                                        <Play size={12} />
                                                        {/* <bdi> for the same reason the owner
                                                            notice isolates its ranges: an en dash
                                                            between two numbers is neutral, so in
                                                            an RTL page it takes RTL direction and
                                                            the range renders end-first. */}
                                                        <bdi>{span.label}</bdi>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-xs text-text-secondary mb-5">
                                            {t('admin.musicReview.noSpans')}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            variant="primary"
                                            icon={<Check size={16} />}
                                            disabled={decide.isPending}
                                            onClick={() => submit(selected.id, MUSIC_REVIEW.CLEARED)}
                                        >
                                            {decide.isPending
                                                ? t('admin.musicReview.clearing')
                                                : t('admin.musicReview.clear')}
                                        </Button>
                                        {/* Rejection is the one that takes something away from an
                                            uploader, so it is the one that asks first. Clearing is
                                            immediate and equally reversible. */}
                                        <Button
                                            variant="danger"
                                            icon={<X size={16} />}
                                            disabled={decide.isPending}
                                            onClick={() => setConfirmingReject(selected)}
                                        >
                                            {t('admin.musicReview.reject')}
                                        </Button>
                                        <Link
                                            to={`/video/${selected.id}`}
                                            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary"
                                        >
                                            <ExternalLink size={14} />
                                            {t('admin.musicReview.openVideo')}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-text-secondary">{t('admin.musicReview.pickOne')}</p>
                        )}
                    </div>
                </QueryState>

                <Modal
                    open={!!confirmingReject}
                    onClose={() => setConfirmingReject(null)}
                    title={t('admin.musicReview.confirmRejectTitle')}
                >
                    <p className="mb-5 text-sm leading-relaxed">
                        {t('admin.musicReview.confirmRejectBody', {
                            title: confirmingReject?.title ?? '',
                        })}
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setConfirmingReject(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            disabled={decide.isPending}
                            onClick={() => submit(confirmingReject.id, MUSIC_REVIEW.REJECTED)}
                        >
                            {decide.isPending
                                ? t('admin.musicReview.rejecting')
                                : t('admin.musicReview.confirmRejectAction')}
                        </Button>
                    </div>
                </Modal>
            </div>
        </PageShell>
    );
}

export default AdminMusicReview;
