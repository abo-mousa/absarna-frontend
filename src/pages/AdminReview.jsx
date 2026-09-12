import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ExternalLink, Play, X } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { VideoPlayer } from '../components/content';
import { Badge, Button, Modal, QueryState } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useReviewQueue, useDecideReview } from '../hooks/useReview';
import { REVIEW_STATE, REVIEW_TYPE, findingRow, groupByType } from '@/lib/review';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

// Which states read as a problem. HELD and REJECTED hide the video; ADVISORY and UNCHECKED are a
// backlog on videos that are published and playing. Rendering all four in red would train a
// reviewer to skim past the two that matter.
//
// UNCHECKED is deliberately not `danger` even though it HIDES an explicit-content video (that
// type fails closed). The reviewer's job there is different -- nothing was found, the scan simply
// did not finish -- and colouring it like a detection would misdescribe what they are looking at.
const BADGE_VARIANT = {
    [REVIEW_STATE.HELD]: 'danger',
    [REVIEW_STATE.REJECTED]: 'danger',
    [REVIEW_STATE.ADVISORY]: 'featured',
    [REVIEW_STATE.UNCHECKED]: 'muted',
};

const TABS = [REVIEW_TYPE.MUSIC, REVIEW_TYPE.NUDITY];

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
function AdminReview() {
    usePageMeta({ title: t('admin.review.title') });
    const { showToast } = useToast();
    // UNFILTERED on purpose, then grouped here. Asking the server per type would be one fewer row
    // to render and would cost the thing that makes this screen worth having: a video flagged by
    // BOTH detectors is invisible from inside a single-type view, so a reviewer clearing its music
    // would never learn it was also flagged for explicit content -- and clearing the music is
    // exactly what would then publish it.
    const { data, isLoading, isError, error, refetch } = useReviewQueue();
    const decide = useDecideReview();
    const playerRef = useRef(null);

    const [tab, setTab] = useState(REVIEW_TYPE.MUSIC);
    const [selectedId, setSelectedId] = useState(null);
    const [confirmingReject, setConfirmingReject] = useState(null);

    const allRows = useMemo(
        () => (data?.content ?? []).map(findingRow).filter(Boolean),
        [data],
    );
    const grouped = useMemo(() => groupByType(allRows), [allRows]);
    const rows = grouped[tab] ?? [];
    const depth = data?.depth ?? {};

    // What ELSE is outstanding on the video being decided. The reason this screen fetches every
    // type at once.
    const otherFindings = useMemo(
        () => allRows.filter((row) => row.videoId === selectedId && row.type !== tab),
        [allRows, selectedId, tab],
    );

    // Select the first row, and re-select after a decision removes the current one. Without this
    // the reviewer decides on a video and the panel keeps showing it — with buttons that now do
    // nothing — instead of moving them on to the next.
    useEffect(() => {
        if (rows.length === 0) {
            setSelectedId(null);
            return;
        }
        if (!rows.some((row) => row.videoId === selectedId)) {
            setSelectedId(rows[0].videoId);
        }
    }, [rows, selectedId]);

    const selected = rows.find((row) => row.videoId === selectedId) ?? null;
    const selectedVideo = (data?.content ?? [])
        .find((row) => row.videoId === selectedId) ?? null;

    // Per TYPE, not per video: clearing a video's music says nothing about its other findings, and
    // the endpoint refuses anything but CLEARED and REJECTED.
    const submit = (videoId, decision) => {
        decide.mutate({ videoId, type: tab, decision }, {
            onSuccess: () => showToast(
                decision === REVIEW_STATE.CLEARED
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
                <h1 className="text-2xl font-bold mb-4">{t('admin.review.title')}</h1>

                {/* One tab per detector. Each carries its own backlog count, because "how big is
                    the queue" is a different question for each -- and because a tab whose count
                    is only visible after clicking it is a queue that stops being read. */}
                <div className="flex flex-wrap gap-2 mb-6" role="tablist">
                    {TABS.map((type) => {
                        const count = depth[type] ?? 0;
                        const active = type === tab;
                        return (
                            <button
                                key={type}
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(type)}
                                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                                    active
                                        ? 'border-primary bg-primary-light text-primary'
                                        : 'border-border-light bg-surface hover:bg-surface-hover'
                                }`}
                            >
                                {t(`admin.review.tabs.${type.toLowerCase()}`)}
                                {/* Wrapped rather than spaced with a class on Badge: Badge takes
                                    only `variant` and `children`, so a className would be dropped
                                    silently and the count would sit flush against the label. */}
                                <span className="ms-2 inline-block align-middle">
                                    <Badge variant={count > 0 ? 'featured' : 'muted'}>{count}</Badge>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <QueryState
                    isLoading={isLoading}
                    isError={isError}
                    error={error}
                    onRetry={refetch}
                    isEmpty={rows.length === 0}
                    emptyIcon="🎵"
                    emptyTitle={t('admin.review.empty')}
                    emptyDescription={t('admin.review.emptyDescription')}
                >
                    <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
                        {/* The queue */}
                        <ul className="flex flex-col gap-2 lg:max-h-[70vh] lg:overflow-y-auto">
                            {rows.map((row) => (
                                <li key={`${row.type}-${row.videoId}`}>
                                    <button
                                        onClick={() => setSelectedId(row.videoId)}
                                        aria-current={row.videoId === selectedId}
                                        className={`w-full text-right p-3 rounded-lg border transition-colors ${
                                            row.videoId === selectedId
                                                ? 'border-primary bg-primary-light'
                                                : 'border-border-light bg-surface hover:bg-surface-hover'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="font-semibold text-sm line-clamp-2">
                                                {row.title}
                                            </span>
                                            <Badge variant={BADGE_VARIANT[row.state] ?? 'muted'}>
                                                {row.state}
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
                                    key={`${tab}-${selected.videoId}`}
                                    videoId={selected.videoId}
                                    sourceType={selectedVideo.sourceType}
                                    sourceUrl={selectedVideo.sourceUrl}
                                    title={selected.title}
                                    poster={resolveMediaUrl(selectedVideo.thumbnailUrl)}
                                    duration={selectedVideo.duration}
                                />

                                <div className="p-5">
                                    <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
                                    <p className="text-sm text-text-secondary mb-4">{selected.reason}</p>

                                    {/* WHAT ELSE IS OUTSTANDING ON THIS VIDEO, and the reason the
                                        queue is fetched unfiltered. Deciding one detector says
                                        nothing about the others, and clearing this one may be
                                        exactly what publishes the video -- so a reviewer must not
                                        be able to do it without seeing that another flag is still
                                        open. They are not forced to act on it: an already-hidden
                                        video needs no second decision today. They are only stopped
                                        from deciding blind. */}
                                    {otherFindings.length > 0 && (
                                        <div className="mb-4 p-3 rounded-lg border border-border bg-surface-hover">
                                            <p className="text-xs font-semibold mb-1">
                                                {t('admin.review.alsoFlagged')}
                                            </p>
                                            <ul className="flex flex-wrap gap-2">
                                                {otherFindings.map((other) => (
                                                    <li key={other.type}>
                                                        <Badge
                                                            variant={BADGE_VARIANT[other.state] ?? 'muted'}
                                                        >
                                                            {t(`admin.review.tabs.${other.type.toLowerCase()}`)}
                                                            {' · '}
                                                            {other.state}
                                                        </Badge>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

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
                                            onClick={() => submit(selected.videoId, REVIEW_STATE.CLEARED)}
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
                                            to={`/video/${selected.videoId}`}
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
                            onClick={() => submit(confirmingReject.videoId, REVIEW_STATE.REJECTED)}
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

export default AdminReview;
