import { AlertTriangle, Loader2, RotateCw, VideoOff } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui';
import { useRetryTranscode } from '@/hooks/useChannels';
import { ownerNotices } from '@/lib/review';
import { describeError } from '@/lib/describeError';
import { t } from '@/i18n';

/**
 * What one of the owner's videos has to say about itself, on the dashboard row.
 *
 * <h4>Why it is here and not only on the cards</h4>
 *
 * <p><b>This list is the screen an owner actually opens.</b> The home feed's card already carried
 * a "processing" badge and a moderation badge, but an owner does not browse the public feed
 * looking for their own uploads — they open their channel's dashboard, which said nothing at all.
 * A held video is READY, `visible`, and reachable by nobody; there is no notification channel in
 * this design, so the `review` field is the entire mechanism by which its owner is ever told, and
 * a dashboard that drops it means the upload simply vanished as far as they can see. The backend
 * now attaches `review` to the owner's own video list, which is what makes this possible at all.
 *
 * <h4>Three different things, worded three different ways</h4>
 *
 * <ul>
 *   <li><b>UPLOADED</b> — working, wait. Neutral: nothing is wrong.</li>
 *   <li><b>FAILED</b> — stopped, and it will not resume by itself. This is the one with a button,
 *       because it is the one with a recourse: the original file is still on the servers, so a
 *       retry is a click rather than a re-upload of several gigabytes.</li>
 *   <li><b>Gone from YouTube</b> — the 30-day sweep found the video is no longer there, so the
 *       row is hidden. No button: the three things an owner can do about it (re-upload the
 *       original, retitle it, delete it) are all controls this row already has.</li>
 *   <li><b>A moderation verdict</b> — `ownerNotices`, worst first, and only two of its four
 *       states hide anything. Colouring an ADVISORY or an UNCHECKED note like a problem trains
 *       owners to ignore the tone by the time the one that matters arrives, which is why the
 *       tone comes from `lib/review` rather than being picked here.</li>
 * </ul>
 *
 * <p>Owner-facing by construction: this component only ever renders inside the channel dashboard,
 * which is already gated. `ownerNotices` is passed `true` for that reason — and the backend does
 * not send `review` to anyone else regardless, so neither side can leak it alone.
 */
function VideoManageStatus({ video, slug }) {
    const { showToast } = useToast();
    const retry = useRetryTranscode(slug);
    const notices = ownerNotices(video, true);

    const handleRetry = () => {
        retry.mutate(video.id, {
            onSuccess: () => showToast(t('channelManage.videoStatus.retryQueued'), 'success'),
            // describeError, so TRANSCODE_NOT_RETRYABLE — the refusal an owner meets when the row
            // moved on under them — says what it actually means instead of «فشل».
            onError: (err) => showToast(
                describeError(err, t('channelManage.videoStatus.retryFailed')), 'error'),
        });
    };

    const gone = Boolean(video.youtubeUnavailableAt);

    if (!gone && video.status !== 'UPLOADED' && video.status !== 'FAILED' && notices.length === 0) {
        return null;
    }

    return (
        <div className="mt-1.5 grid gap-1.5">
            {video.status === 'UPLOADED' && (
                <p
                    className="flex items-center gap-1.5 text-xs text-text-muted"
                    title={t('channelManage.videoStatus.processingHint')}
                >
                    <Loader2 size={12} className="animate-spin flex-shrink-0" />
                    {t('channelManage.videoStatus.processing')}
                </p>
            )}

            {video.status === 'FAILED' && (
                <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                        <AlertTriangle size={13} className="flex-shrink-0" />
                        {t('channelManage.videoStatus.failed')}
                    </p>
                    {/* The sentence carries the fact that saves the owner the most work: the
                        original file is still there, so this is a retry and not a re-upload. */}
                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                        {t('channelManage.videoStatus.failedHint')}
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        icon={<RotateCw size={13} />}
                        disabled={retry.isPending}
                        onClick={handleRetry}
                    >
                        {retry.isPending
                            ? t('channelManage.videoStatus.retrying')
                            : t('channelManage.videoStatus.retry')}
                    </Button>
                </div>
            )}

            {/* THE VIDEO IS GONE FROM YOUTUBE, and this row is hidden until its owner decides.
                The 30-day sweep found the id missing from videos.list — deleted by its uploader,
                or made private — and there is nothing the platform can do about that except stop
                showing a card that plays nothing.

                It does NOT delete the row, and that is why this notice has to exist: deleting
                would take the comments, likes, bookmarks and watch history with it, so the row
                survives and somebody has to be told. There is no email and no notification
                channel in this design, so the dashboard is the whole mechanism — the same
                argument the moderation notices below rest on.

                Three recourses and no button for any of them, deliberately: re-uploading the
                original, retitling and deleting are all things the owner already does elsewhere
                on this row, and a fourth control here would be a second path to the same three.
                Amber rather than red: nothing is broken and nothing was done wrong. */}
            {gone && (
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                        <VideoOff size={13} className="flex-shrink-0" />
                        {t('channelManage.videoStatus.youtubeGone')}
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed">
                        {t('channelManage.videoStatus.youtubeGoneHint')}
                    </p>
                </div>
            )}

            {/* One per FINDING, not one per video: a video can be held for music and noted for
                explicit content at once, and those are two different things to do something
                about. The tone is load-bearing — `warning` means nobody can see this video. */}
            {notices.map((notice) => (
                <p
                    key={notice.type}
                    title={notice.body}
                    className={`inline-flex w-fit items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded ${
                        notice.tone === 'warning'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-surface-hover text-text-secondary'
                    }`}
                >
                    {notice.title}
                </p>
            ))}
        </div>
    );
}

export default VideoManageStatus;
