import { useRef, useState } from 'react';
import { Plus, Upload, ArrowUp, ArrowDown, Import, BookOpen, FileUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ArrowBack } from '@/components/ui/DirectionalIcon';
import { useToast } from '@/contexts/ToastContext';
import { Button, ConfirmDialog, Input, Modal } from '@/components/ui';
import ContentPublishForm, { FieldLabel } from '../ContentPublishForm';
import ManagedContentList from './ManagedContentList';
import VideoManageStatus from '../VideoManageStatus';
import VideoThumbnailPicker from '../VideoThumbnailPicker';
import SeriesBrowser, { SeriesActions } from '../SeriesBrowser';
import NewSeriesModal from '../NewSeriesModal';
import SeriesSelect from '../SeriesSelect';
import CategoryField from '../CategoryField';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { useKeepScrollPlace } from '@/hooks/useKeepScrollPlace';
import { useChannelUpload } from '@/hooks/useChannelUpload';
import { useChannelSeriesManage, useMoveInSeries } from '@/hooks/useSeries';
import { MANAGE_PAGE_SIZE, useReplaceVideoFile } from '@/hooks/useChannels';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useLeaveGuard } from '@/hooks/useLeaveGuard';
import { usePresignedUpload, acceptAttribute } from '@/hooks/usePresignedUpload';
import { useUploadOriginal } from '@/hooks/useChannelYouTube';
import { describeError } from '@/lib/describeError';
import { stripEmpty } from '@/lib/forms';
import { readMediaClaim } from '@/lib/mediaClaim';
import { t } from '@/i18n';
import { formatPercent } from '@/lib/numbers';
import { formatLabel } from '@/lib/formats';
import { useFormats } from '@/hooks/useVideos';
import SubjectPicker from '@/components/content/SubjectPicker';

// Named so that "reset the form after publishing" is one reference rather than a second copy of
// the field list that can silently fall out of step with the first.
//
// sourceType/sourceUrl stay for the external-URL path (a YouTube link, say); a presigned upload
// sets uploadSessionId instead. The create endpoint requires exactly one of the two shapes, which
// is why neither is pre-filled.
const EMPTY_FORM = {
    title: '', description: '', sourceType: '', sourceUrl: '', uploadSessionId: '',
    category: '', format: '', subject: '', seriesId: '', orderInSeries: '', originalPublishDate: '',
    graphicContent: false, removedElsewhere: false,
};

/**
 * A video's public page, or null while it has nothing to play.
 *
 * <p>READY only. An UPLOADED video is still transcoding and a FAILED one never finished, so their
 * pages would open on a player with no source; the row's own status block already says which of
 * the two it is. A HELD video <em>is</em> READY and does get the link — its page shows its owner
 * the notice saying why nobody else can see it, which is the reason to open it.
 */
export function videoPageHref(video) {
    return video?.status === 'READY' ? `/video/${video.id}` : null;
}

/**
 * The videos section: the upload form, then the channel's videos either as one list or by series.
 *
 * <p>Series were a dashboard tab of their own, apart from the videos they hold. Owners think of a
 * course and its lectures as one thing, so they are one section now: «كل الفيديوهات» is the flat
 * newest-first list, still where an upload is watched through transcoding, and «حسب السلسلة»
 * lists the series and opens one onto its own videos, where the whole series can be hidden or
 * deleted.
 *
 * <p><b>The list is the screen; the forms are dialogs.</b> The upload form and the new-series form
 * used to sit above the list, so opening the section showed a form and the videos began a screen
 * further down. Both open from buttons beside the view switch now. The upload runs in this
 * component's state, not the dialog's, so closing the dialog mid-upload loses nothing — the button
 * shows the progress, and reopening it shows the form as it was left.
 */
export default function VideosTab({ slug, channel, youtubeState, isOwner, active }) {
    // Every format, from the backend: the form offers the list the server keeps, not a copy.
    const { data: formats = [] } = useFormats();
    const [view, setView] = useState('all');
    // A series object, 'none' for the videos in no series, or null for the series list.
    const [openSeries, setOpenSeries] = useState(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [creatingSeries, setCreatingSeries] = useState(false);
    // Every series, for the upload form's <select> — fetched when that form is opened, not on every
    // visit to the section.
    const { data: seriesList = [] } = useChannelSeriesManage(slug, active && uploadOpen);

    // Switching view or opening a series swaps the list for one that is, at least while it loads,
    // shorter — and a page that gets shorter under the reader is clamped upward by the browser, so
    // the screen jumped away from where the owner had just clicked. See useKeepScrollPlace.
    const listRef = useRef(null);
    const [heldHeight, holdPlace] = useKeepScrollPlace(listRef);
    const openSeriesView = (series) => { holdPlace(); setOpenSeries(series); };
    const switchView = (next) => {
        if (next === view && !openSeries) return;
        holdPlace();
        setView(next);
        setOpenSeries(null);
    };
    const content = useChannelContentTab(slug, 'videos', active && view === 'all');
    const upload = useChannelUpload(slug, 'videos');
    const [form, setForm] = useState(EMPTY_FORM);
    // The just-published video whose poster is being offered, or null.
    const [posterFor, setPosterFor] = useState(null);
    const fileActions = useFileActions(slug, youtubeState);
    // Leaving stops whichever upload is on its way, so the page asks first.
    const leaveGuard = useLeaveGuard(upload.uploading || fileActions.busy);

    const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });
    // What the browser read from the file being uploaded, and which file that was: sent with the
    // create request so the backend can route a short upload past a long one (lib/mediaClaim).
    // Keyed by the file, so a slow read for an earlier pick never attaches to a later one.
    const claim = useRef({ file: null, values: {} });

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // The form may still hold the session of a file picked before this one, which the
            // upload hook discards: publishing with it would be refused.
            setForm((current) => ({ ...current, uploadSessionId: '' }));
            claim.current = { file, values: {} };
            readMediaClaim(file).then((values) => {
                if (claim.current.file === file) claim.current = { file, values };
            });
        }
        return selectUpload(e);
    };

    const selectUpload = (e) => upload.selectFile(e, {
        failureMessage: (reason) => t('channelManage.forms.video.uploadFailed', { reason }),
        onUploaded: (uploadSessionId, fallbackTitle) => setForm((current) => ({
            ...current,
            // sourceType/sourceUrl are the server's to set on this path — the create request
            // rejects a payload carrying both a sourceUrl and an uploadSessionId.
            sourceType: '',
            sourceUrl: '',
            uploadSessionId,
            title: current.title || fallbackTitle,
        })),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const wasUpload = !!form.uploadSessionId;
        // Only beside an upload: a claim is about the file, and a URL-created video has none.
        const claimed = wasUpload ? claim.current.values : {};
        content.publish({ ...stripEmpty(form), ...claimed, speaker: channel.name }, {
            action: t('channelManage.forms.video.action'),
            successMessage: t('channelManage.forms.video.published'),
            onSuccess: (created) => {
                // The session is spent: confirm assembled the object and created the row.
                upload.forget();
                claim.current = { file: null, values: {} };
                setForm(EMPTY_FORM);
                setUploadOpen(false);
                // THE POSTER STEP, offered here rather than only from the edit dialog.
                //
                // It cannot be a field in the form above: every thumbnail endpoint and
                // ObjectKeys.posterKey are keyed by the video id, and there is no id until this
                // request returns. So it is a step after publishing rather than a control during
                // it — which is also when an owner has just watched their own file go up and is
                // most likely to care what it will look like.
                //
                // Uploads only. A video created from a YouTube URL already has that platform's
                // poster and the picker's "the server will capture a frame" line would be untrue
                // of it; its owner can still set one from the edit dialog, exactly as before.
                if (wasUpload && created?.id) {
                    setPosterFor(created);
                }
            },
        });
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <ConfirmDialog {...content.confirmDialog} />
            <ConfirmDialog {...upload.confirmDialog} />
            <ConfirmDialog {...fileActions.confirmDialog} />
            <ConfirmDialog {...leaveGuard} />
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-1 p-1 rounded-lg bg-surface border border-border-light w-fit">
                    {['all', 'bySeries'].map((id) => (
                        <button
                            key={id}
                            type="button"
                            aria-pressed={view === id}
                            onClick={() => switchView(id)}
                            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                                view === id
                                    ? 'bg-primary-light text-primary font-semibold'
                                    : 'text-text-secondary font-medium hover:bg-surface-hover'
                            }`}
                        >
                            {t(`channelManage.seriesView.${id}`)}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {!openSeries && (
                        <Button variant="outline" size="sm" icon={<Plus size={16} />} onClick={() => setCreatingSeries(true)}>
                            {t('channelManage.newSeriesHeading')}
                        </Button>
                    )}
                    <Button size="sm" icon={<Upload size={16} />} onClick={() => setUploadOpen(true)}>
                        {upload.uploading
                            ? t('channelManage.forms.uploadingProgress', { progress: upload.progress })
                            : t('channelManage.forms.video.heading')}
                    </Button>
                </div>
            </div>

            <NewSeriesModal slug={slug} open={creatingSeries} onClose={() => setCreatingSeries(false)} />

            {/* Dismissible, and saying so matters: the video is ALREADY published by the time this
                opens. Closing it costs nothing — the worker's own frame is used and the owner can
                replace it later from the edit dialog — so nothing here may read as a required
                step standing between them and a finished upload. */}
            <Modal
                open={!!posterFor}
                onClose={() => setPosterFor(null)}
                title={t('channelManage.thumbnail.afterPublishTitle')}
                maxWidth="560px"
            >
                <p className="text-text-secondary mb-4">
                    {t('channelManage.thumbnail.afterPublishBody')}
                </p>

                {posterFor && <VideoThumbnailPicker slug={slug} video={posterFor} />}

                <div className="flex justify-end mt-5">
                    <Button onClick={() => setPosterFor(null)}>
                        {t('channelManage.thumbnail.afterPublishDone')}
                    </Button>
                </div>
            </Modal>

            <Modal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                title={t('channelManage.forms.video.heading')}
                maxWidth="720px"
            >
                <ContentPublishForm
                    bare
                    heading={t('channelManage.forms.video.heading')}
                    onSubmit={handleSubmit}
                    submitLabel={t('channelManage.forms.video.submit')}
                    submitIcon={<Upload size={18} />}
                    submitting={content.isPublishing}
                    error={content.publishError}
                    file={{
                        label: t('channelManage.forms.video.fileLabel'),
                        hint: t('channelManage.forms.video.fileHint'),
                        accept: acceptAttribute('videos'),
                        onChange: handleFileSelect,
                        uploading: upload.uploading,
                        progress: upload.progress,
                        fileName: upload.fileName,
                        onCancel: upload.cancel,
                        ready: Boolean(form.uploadSessionId),
                    }}
                >
                    <Input label={t('fields.title')} value={form.title} onChange={field('title')} field="title" required />
                    <SeriesSelect
                        slug={slug}
                        id="upload-series"
                        value={form.seriesId}
                        onChange={(seriesId) => setForm((current) => ({ ...current, seriesId, orderInSeries: '' }))}
                        enabled={active && uploadOpen}
                    />
                    <Input label={t('fields.description')} textarea rows={3} value={form.description} onChange={field('description')} field="description" />

                    {/* What most uploads never need, folded away: the four fields above are a lecture
                        published. The rest is inherited (format and subject from the series or the
                        channel) or an exception (the two notes every reader sees). */}
                    <details className="group rounded-md border border-border-light">
                        <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-text-secondary">
                            {t('channelManage.forms.video.moreOptions')}
                            <span className="block text-xs font-normal text-text-muted">{t('channelManage.forms.video.moreOptionsHint')}</span>
                        </summary>
                        <div className="grid gap-4 px-4 pb-4">
                            {/* Starts on "as the channel": an upload with no format of its own reads as
                                the channel's default, so an owner who set one never has to touch this.
                                The empty value is stripped before sending, which is what leaves it unset. */}
                            <div>
                                <FieldLabel>{t('formats.label')}</FieldLabel>
                                <select
                                    value={form.format}
                                    onChange={field('format')}
                                    className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors bg-surface"
                                >
                                    <option value="">
                                        {channel?.defaultFormat
                                            ? t('formats.inherit', { format: formatLabel(channel.defaultFormat) })
                                            : t('formats.unset')}
                                    </option>
                                    {formats.map(({ name }) => (
                                        <option key={name} value={name}>{formatLabel(name)}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Optional, and usually already answered: an upload with none of its own
                                reads as its series' subject, else the channel's, and the picker says which. */}
                            <SubjectPicker
                                id="upload-subject"
                                value={form.subject || null}
                                onChange={(subject) => setForm((current) => ({ ...current, subject: subject || '' }))}
                                inherited={(() => {
                                    const fromSeries = seriesList.find((s) => String(s.id) === String(form.seriesId))?.subject;
                                    if (fromSeries) return { code: fromSeries, from: 'series' };
                                    return channel?.defaultSubject ? { code: channel.defaultSubject, from: 'channel' } : null;
                                })()}
                            />
                            <CategoryField id="upload-category" value={form.category} onChange={field('category')} />
                            <Input label={t('fields.originalPublishDateOptional')} type="date" value={form.originalPublishDate} onChange={field('originalPublishDate')} field="originalPublishDate" />
                            {[
                                ['graphicContent', 'voice.formGraphic', 'voice.formGraphicHint'],
                                ['removedElsewhere', 'voice.formRemoved', 'voice.formRemovedHint'],
                            ].map(([flag, label, hint]) => (
                                <label key={flag} className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form[flag]}
                                        onChange={(e) => setForm({ ...form, [flag]: e.target.checked })}
                                        className="mt-1 accent-[rgb(var(--color-voice))]"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold">{t(label)}</span>
                                        <span className="block text-xs text-text-muted">{t(hint)}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </details>
                </ContentPublishForm>
            </Modal>

            {/* Inline style: the held height is a runtime value, which Tailwind cannot see. */}
            <div style={heldHeight ? { minHeight: heldHeight } : undefined}>
                <div ref={listRef} className="grid grid-cols-1 gap-6">
                    {/* Only once the first page has ANSWERED empty: before it arrives (or while the tab
                        is not open and its query is off) there is no data, which is not "no videos". */}
                    {view === 'all' && content.pageInfo && content.totalItems === 0 && !content.term && (
                        <FirstSteps onUpload={() => setUploadOpen(true)} />
                    )}

                    {view === 'all' && !(content.pageInfo && content.totalItems === 0 && !content.term) && (
                        <ManagedContentList
                            type="videos"
                            slug={slug}
                            searchable
                            searchPlaceholder={t('channelManage.searchVideos')}
                            heading={t('channelManage.forms.video.listHeading', { count: content.totalItems })}
                            content={content}
                            getHref={videoPageHref}
                            extraActions={fileActions.rowAction}
                            // The transcode state, the retry out of a failed one, and the moderation verdicts
                            // — on the screen an owner actually opens. A held video is READY, visible and
                            // reachable by nobody, and before this the dashboard said nothing about it at all.
                            renderStatus={(video) => (
                                <VideoManageStatus video={video} slug={slug} isOwner={isOwner} replaceAction={fileActions.replaceAction} />
                            )}
                        />
                    )}

                    {view === 'bySeries' && !openSeries && (
                        <SeriesBrowser slug={slug} active={active} onOpen={openSeriesView} />
                    )}

                    {view === 'bySeries' && openSeries && (
                        <SeriesVideos
                            // Keyed so each series starts on its own page 1.
                            key={openSeries === 'none' ? 'none' : openSeries.id}
                            slug={slug}
                            series={openSeries}
                            active={active}
                            onBack={() => openSeriesView(null)}
                            onSeriesChange={setOpenSeries}
                            extraActions={fileActions.rowAction}
                            replaceAction={fileActions.replaceAction}
                            isOwner={isOwner}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * One series opened: its videos, a page at a time in the series' own order, with the series'
 * actions above them. `series` is `'none'` for the videos in no series, which has no actions.
 */
function SeriesVideos({ slug, series, active, onBack, onSeriesChange, extraActions, replaceAction, isOwner }) {
    const none = series === 'none';
    const content = useChannelContentTab(slug, 'videos', active, none ? 'none' : String(series.id));
    const title = none ? t('channelManage.seriesView.noSeries') : series.title;
    const move = useMoveInSeries(slug);
    const { showToast } = useToast();

    // The order the backend lists a series in is the order a reader follows it, so moving a row
    // here moves the episode for everyone. A position is absolute across pages.
    const positionOf = (video) => {
        const index = content.items.findIndex((item) => item.id === video.id);
        return (content.pageInfo?.page ?? 0) * MANAGE_PAGE_SIZE + index + 1;
    };
    const moveTo = (video, position) => move.mutate({ videoId: video.id, position }, {
        onError: (err) => showToast(describeError(err, t('channelManage.seriesView.moveFailed')), 'error'),
    });
    const rowActions = none ? extraActions : (video) => {
        const position = positionOf(video);
        const button = 'p-2 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none';
        return (
            <>
                <button type="button" className={button} disabled={position <= 1 || move.isPending}
                        onClick={() => moveTo(video, position - 1)}
                        title={t('channelManage.seriesView.moveUp')} aria-label={t('channelManage.seriesView.moveUp')}>
                    <ArrowUp size={16} />
                </button>
                <button type="button" className={button} disabled={position >= content.totalItems || move.isPending}
                        onClick={() => moveTo(video, position + 1)}
                        title={t('channelManage.seriesView.moveDown')} aria-label={t('channelManage.seriesView.moveDown')}>
                    <ArrowDown size={16} />
                </button>
                {extraActions?.(video)}
            </>
        );
    };

    return (
        <div className="grid gap-4">
            <ConfirmDialog {...content.confirmDialog} />
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                    <ArrowBack size={16} />
                    {t('channelManage.seriesView.backToSeries')}
                </button>
                {!none && (
                    <SeriesActions slug={slug} series={series} onChanged={onSeriesChange} onDeleted={onBack} />
                )}
            </div>

            <ManagedContentList
                type="videos"
                slug={slug}
                heading={t('channelManage.seriesView.seriesVideosHeading', { title, count: content.totalItems })}
                content={content}
                getHref={videoPageHref}
                extraActions={rowActions}
                renderStatus={(video) => (
                    <VideoManageStatus video={video} slug={slug} isOwner={isOwner} replaceAction={replaceAction} />
                )}
            />
        </div>
    );
}

/**
 * Whether an uploaded video's file can be replaced now: a file we host, and no transcode that
 * could still report on it. The backend refuses the same cases (`VIDEO_FILE_STILL_PROCESSING`);
 * this only decides whether the control is drawn.
 */
export function canReplaceFile(video) {
    if (video?.sourceType !== 'UPLOAD') return false;
    return video.status === 'FAILED' || (video.status === 'READY' && !video.transcodeQueue);
}

/**
 * The two per-row actions that put a new file under an existing video.
 *
 * <p><b>Upload the original</b> replaces an imported video's YouTube embed with the real file, and
 * needs the owner's own verification with Google. <b>Replace the file</b> is for a video already
 * uploaded here — a refused one, a wrong one, one ffmpeg could not read — and needs nothing more
 * than managing the channel; it asks first, because the old file is deleted. Both keep the video:
 * its comments, views and place in a series.
 *
 * <p>Both reuse the ordinary presigned upload; only the final call differs — it attaches the
 * session to a video that already exists rather than creating one. Deliberately NOT routed
 * through the resume machinery: resume is keyed per (channel, kind) and one remembered session
 * cannot describe which of two thousand videos it belongs to. A second, independent uploader, so
 * it shares no progress or cancellation with the publish form on the same tab — and one at a
 * time: while a row is uploading, every other row's control waits.
 *
 * <p>`sourceType === 'YOUTUBE'` is the eligibility test for the first rather than a "has a file"
 * flag, because object keys never appear on a DTO — and it is exactly right: a video still typed
 * YOUTUBE is one we do not host.
 *
 * @returns `rowAction(video)` for the row's icons, `replaceAction(video, { labelled })` for the
 *          same replace control with its words, `confirmDialog` to render once, and `busy`
 */
function useFileActions(slug, youtubeState) {
    const { showToast } = useToast();
    const uploader = usePresignedUpload();
    const uploadOriginal = useUploadOriginal(slug);
    const replaceFile = useReplaceVideoFile(slug);
    const [busyVideoId, setBusyVideoId] = useState(null);
    const [ask, confirmDialog] = useConfirmation();

    const handleUpload = async (e, video, replacing) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        if (replacing && !(await ask(t('channelManage.videoStatus.replaceFile.confirmTitle', { title: video.title }), {
            body: t('channelManage.videoStatus.replaceFile.confirmBody'),
            confirmLabel: t('channelManage.videoStatus.replaceFile.confirm'),
            danger: true,
        }))) return;

        setBusyVideoId(video.id);
        let uploadSessionId = null;
        try {
            // Read while the bytes travel: it decides the transcode lane, as on a first upload.
            const claim = replacing ? readMediaClaim(file) : null;
            uploadSessionId = await uploader.upload(file, { kind: 'videos', slug });
            if (replacing) {
                await replaceFile.mutateAsync({ videoId: video.id, uploadSessionId, claim: await claim });
            } else {
                await uploadOriginal.mutateAsync({ videoId: video.id, uploadSessionId });
            }
            showToast(t(replacing ? 'channelManage.videoStatus.replaceFile.done' : 'youtube.uploadedOriginal'), 'success');
        } catch (err) {
            if (err.name !== 'AbortError') {
                // The refusals worth wording arrive as reason codes that only `describeError`
                // reads: `YOUTUBE_NEEDS_OWNER_VERIFICATION`, `VIDEO_FILE_STILL_PROCESSING`.
                showToast(t(replacing ? 'channelManage.videoStatus.replaceFile.failed' : 'youtube.uploadOriginalFailed',
                    { reason: describeError(err) }), 'error');
            }
            // A refusal leaves a finished upload attached to nothing: free the channel's slot.
            // Only on an answer — a timeout may be the server still assembling it.
            if (uploadSessionId && err.response) uploader.discard(slug, 'videos', uploadSessionId);
        } finally {
            setBusyVideoId(null);
        }
    };

    const fileInput = (video, replacing, disabled) => (
        <input
            type="file"
            accept={acceptAttribute('videos')}
            disabled={disabled}
            onChange={(e) => handleUpload(e, video, replacing)}
            // sr-only, not hidden: display:none takes the input out of the tab order, so
            // the keyboard could never reach it. FilePicker does the same.
            className="sr-only"
        />
    );

    const iconLabel = (video, replacing, enabled, title) => {
        const busy = busyVideoId === video.id;
        const usable = enabled && busyVideoId === null;
        return (
            <label
                title={title}
                aria-label={title}
                className={`p-2 rounded-md transition-colors focus-within:ring-2 focus-within:ring-primary ${
                    usable
                        ? 'text-text-secondary hover:bg-surface-hover hover:text-primary cursor-pointer'
                        : 'text-text-muted opacity-50 cursor-not-allowed'
                }`}
            >
                {busy
                    ? <span className="text-xs">{formatPercent(uploader.progress)}</span>
                    : replacing ? <FileUp size={16} /> : <Upload size={16} />}
                {fileInput(video, replacing, !usable)}
            </label>
        );
    };

    const rowAction = (video) => {
        if (video.sourceType === 'YOUTUBE') {
            const ownerVerified = youtubeState?.verifiedBy === 'OWNER';
            return iconLabel(video, false, ownerVerified,
                ownerVerified ? t('youtube.uploadOriginal') : t('youtube.uploadOriginalNeedsOwner'));
        }
        if (!canReplaceFile(video)) return null;
        return iconLabel(video, true, true, t('channelManage.videoStatus.replaceFile.action'));
    };

    const replaceAction = (video, { labelled = false } = {}) => {
        if (!canReplaceFile(video)) return null;
        if (!labelled) return iconLabel(video, true, true, t('channelManage.videoStatus.replaceFile.action'));
        const busy = busyVideoId === video.id;
        const usable = busyVideoId === null;
        return (
            <label
                className={`inline-flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-primary ${
                    usable ? 'text-text-secondary hover:bg-surface-hover cursor-pointer' : 'text-text-muted opacity-60 cursor-not-allowed'
                }`}
            >
                <FileUp size={13} />
                {busy
                    ? t('channelManage.forms.uploadingProgress', { progress: uploader.progress })
                    : t('channelManage.videoStatus.replaceFile.action')}
                {fileInput(video, true, !usable)}
            </label>
        );
    };

    return { rowAction, replaceAction, confirmDialog, busy: busyVideoId !== null };
}

/**
 * What a channel with no videos shows instead of «لا يوجد محتوى بعد»: the three ways to put
 * something in it. A new owner landed on that sentence with the upload button in a corner and no
 * word that a YouTube channel could be brought over, or that books live one tab along.
 */
function FirstSteps({ onUpload }) {
    const [, setSearchParams] = useSearchParams();
    const goTo = (tab) => setSearchParams({ tab }, { replace: true });
    const steps = [
        { key: 'upload', icon: Upload, onClick: onUpload },
        { key: 'import', icon: Import, onClick: () => goTo('youtube') },
        { key: 'book', icon: BookOpen, onClick: () => goTo('books') },
    ];
    return (
        <section className="rounded-lg border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-serif text-[1.6rem] font-semibold leading-tight">{t('channelManage.firstSteps.title')}</h2>
            <p className="text-text-secondary mt-1 mb-5">{t('channelManage.firstSteps.text')}</p>
            <div className="grid gap-3 sm:grid-cols-3">
                {steps.map(({ key, icon: Icon, onClick }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={onClick}
                        className="text-start flex flex-col gap-1.5 p-4 rounded-md border border-border-light hover:border-primary hover:bg-primary-light/40 transition-colors"
                    >
                        <Icon size={20} className="text-primary" />
                        <span className="font-bold">{t(`channelManage.firstSteps.${key}.title`)}</span>
                        <span className="text-sm text-text-secondary">{t(`channelManage.firstSteps.${key}.text`)}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
