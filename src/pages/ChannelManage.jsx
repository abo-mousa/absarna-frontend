import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Video, BookOpen, FileText, MessageSquare, Settings, Save, ArrowRight, Eye, EyeOff, Trash2, Tv, Plus, Pin, PinOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { usePageMeta } from '@/hooks/usePageMeta';
import PageShell from '@/components/layout/PageShell';
import { QueryState, Input, Button } from '@/components/ui';
import { ContentPublishForm, ContentManageList, FieldLabel, YouTubeImportPanel, ContentEditModal } from '@/components/channel';
import { canManageChannel } from '@/lib/user';
import { useChannel, useUpdateChannel } from '@/hooks/useChannels';
import { useChannelContentTab } from '@/hooks/useChannelContentTab';
import { useChannelSeriesManage, useCreateSeries, useDeleteSeries } from '@/hooks/useSeries';
import { usePresignedUpload, ResumeUnavailableError, acceptAttribute } from '@/hooks/usePresignedUpload';
import { rememberSession, forgetSession, resumableSessionId, rememberedSession } from '@/lib/uploadResume';
import { useChannelComments, useModerateComment } from '@/hooks/useCommentModeration';
import { useChannelYouTube, useUploadOriginal } from '@/hooks/useChannelYouTube';
import { t } from '@/i18n';

const TABS = [
    { id: 'overview', label: t('channelManage.tabs.overview'), icon: Settings },
    { id: 'videos', label: t('channelManage.tabs.videos'), icon: Video },
    { id: 'books', label: t('channelManage.tabs.books'), icon: BookOpen },
    { id: 'articles', label: t('channelManage.tabs.articles'), icon: FileText },
    { id: 'posts', label: t('channelManage.tabs.posts'), icon: MessageSquare },
    { id: 'series', label: t('channelManage.tabs.series'), icon: Tv },
    { id: 'comments', label: t('channelManage.tabs.comments'), icon: MessageSquare },
];

// Empty shapes, named so that "reset the form after publishing" is one reference rather than a
// second copy of the field list that can silently fall out of step with the first.
const EMPTY_VIDEO_FORM = {
    title: '', description: '', sourceType: '', sourceUrl: '', uploadSessionId: '',
    category: '', seriesId: '', orderInSeries: '', originalPublishDate: '',
};
const EMPTY_BOOK_FORM = {
    title: '', description: '', pdfUrl: '', uploadSessionId: '', previewImageUrl: '',
    category: '', originalPublishDate: '', pages: '',
};
const EMPTY_ARTICLE_FORM = { title: '', content: '', category: '', originalPublishDate: '' };
const EMPTY_POST_FORM = { content: '' };

// An untouched date/number field is '' in form state; Jackson's coercion of "" into a
// LocalDate/Integer on the backend is version-dependent, so strip empty strings rather than send
// them and hope.
const stripEmpty = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== ''));

function ErrorScreen({ emoji, title, description, onBack }) {
    return (
        <PageShell sidebar={false}>
            <div className="max-w-[600px] mx-auto my-16 sm:my-20 p-8 sm:p-10 text-center bg-surface rounded-lg shadow-md border border-border-light">
                <div className="text-5xl mb-4">{emoji}</div>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-text-muted">{description}</p>
                <Button className="mt-5" onClick={onBack}>{t('common.backHome')}</Button>
            </div>
        </PageShell>
    );
}

function ChannelManage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');

    const { data: channel, isLoading: channelLoading, isError: channelError, error: channelFetchError } = useChannel(slug, !authLoading);
    usePageMeta({ title: channel ? t('channelManage.titleFor', { name: channel.name }) : t('channelManage.title') });

    const [form, setForm] = useState({ name: '', description: '', primaryColor: '#0D6B4D', logoUrl: '', bannerUrl: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (channel) {
            setForm({
                name: channel.name || '',
                description: channel.description || '',
                primaryColor: channel.primaryColor || '#0D6B4D',
                logoUrl: channel.logoUrl || '',
                bannerUrl: channel.bannerUrl || '',
            });
        }
    }, [channel]);

    useEffect(() => {
        if (!authLoading && !user) navigate('/');
    }, [authLoading, user, navigate]);

    // sourceType/sourceUrl stay for the external-URL path (a YouTube link, say); a presigned
    // upload sets uploadSessionId instead. The create endpoint requires exactly one of the two
    // shapes, which is why neither is pre-filled any more.
    const [videoForm, setVideoForm] = useState(EMPTY_VIDEO_FORM);
    const [bookForm, setBookForm] = useState(EMPTY_BOOK_FORM);
    const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE_FORM);
    const [postForm, setPostForm] = useState(EMPTY_POST_FORM);
    const [seriesForm, setSeriesForm] = useState({ title: '', description: '' });

    const [videoUploading, setVideoUploading] = useState(false);
    const [bookUploading, setBookUploading] = useState(false);
    // Progress comes from the hook, which counts bytes actually accepted by object storage rather
    // than bytes handed to axios.
    const videoUpload = usePresignedUpload();
    // A second, independent uploader: replacing one imported video's source must not share
    // progress or cancellation with the "publish a new video" form on the same tab.
    const originalUpload = usePresignedUpload();
    const [claimingVideoId, setClaimingVideoId] = useState(null);
    // One editor for every content type; `type` decides which fields it renders.
    const [editing, setEditing] = useState(null);
    const uploadOriginal = useUploadOriginal(slug);
    const { data: youtubeState } = useChannelYouTube(slug, activeTab === 'overview' || activeTab === 'videos');

    /**
     * Reacts to the import finishing.
     *
     * <p>The panel polls while a run is `RUNNING`, so its own status text updates in place — but
     * that is the only thing that noticed. The lists on this page were invalidated when the import
     * *started*, which is the one moment they are guaranteed to be correct, and never again: an
     * import that added 1,926 videos left the videos tab showing none of them until something else
     * happened to refetch.
     *
     * <p>Watching the RUNNING → terminal transition rather than the status alone, so this fires
     * once on completion instead of on every poll after it.
     *
     * <p>Nothing here reaches a viewer who has navigated away. The platform has no notification
     * channel — deliberately, the same call the transcode pipeline makes — so this is an in-session
     * update, and the state is still correct whenever the owner comes back.
     */
    const previousImportStatus = useRef(null);
    useEffect(() => {
        const status = youtubeState?.importStatus;
        const previous = previousImportStatus.current;
        previousImportStatus.current = status;

        if (previous !== 'RUNNING' || status === 'RUNNING') return;

        if (status === 'SUCCESS') {
            showToast(t('youtube.succeeded', { count: youtubeState?.importedVideos ?? 0 }), 'success');
            // The import wrote videos and series straight into this channel; every list on this
            // page is stale.
            queryClient.invalidateQueries({ queryKey: ['channel-manage', slug] });
            queryClient.invalidateQueries({ queryKey: ['channel-series-manage', slug] });
        } else if (status === 'FAILED') {
            showToast(t('youtube.failed', { reason: youtubeState?.importMessage || '' }), 'error');
        }
    }, [youtubeState?.importStatus]);
    const bookUpload = usePresignedUpload();

    // Leaving the page stops the transfer — it does NOT give up the session.
    //
    // Three parallel PUTs would otherwise keep saturating the connection for an upload whose
    // session id has nowhere left to go: the form that would carry it to the create call is
    // unmounted with the page. A hard refresh already behaves this way (the browser kills the
    // fetches), so this only makes SPA navigation consistent with it.
    //
    // Deliberately not `discard()` here, though the original finding said "cancel on unmount":
    // that predates resume. Aborting the multipart session would throw away every byte already
    // transferred and turn the remembered session id into a dead one — destroying precisely the
    // upload that resume exists to pick back up. The quota this was meant to protect is bounded
    // on the backend now (24h for counting, a 7-day sweep), and the sessions worth releasing
    // early — declined resumes and replaced files — are released where the user actually says so.
    useEffect(() => () => {
        videoUpload.cancel();
        bookUpload.cancel();
        originalUpload.cancel();
    }, []);

    // One call per content type, each carrying its own list, mutations, confirm and toasts.
    const videos = useChannelContentTab(slug, 'videos', activeTab === 'videos');
    const books = useChannelContentTab(slug, 'books', activeTab === 'books');
    const articles = useChannelContentTab(slug, 'articles', activeTab === 'articles');
    const posts = useChannelContentTab(slug, 'posts', activeTab === 'posts');

    // The videos tab needs the series list too, for its picker.
    const { data: seriesList = [], isLoading: seriesListLoading } = useChannelSeriesManage(
        slug, activeTab === 'videos' || activeTab === 'series'
    );
    const createSeries = useCreateSeries(slug);
    const deleteSeriesMutation = useDeleteSeries(slug);

    const {
        data: commentPages,
        isLoading: commentsLoading,
        fetchNextPage: fetchNextCommentsPage,
        hasNextPage: hasNextCommentsPage,
        isFetchingNextPage: isFetchingNextCommentsPage,
    } = useChannelComments(slug, 50, activeTab === 'comments');
    const channelComments = commentPages?.pages.flatMap((page) => page.content) || [];
    const channelCommentsCount = commentPages?.pages[0]?.totalItems ?? channelComments.length;

    const updateChannel = useUpdateChannel(slug, channel?.id);
    const moderateComment = useModerateComment(slug);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateChannel.mutateAsync(form);
            showToast(t('channelManage.saved'), 'success');
        } catch (err) {
            showToast(t('channelManage.saveFailed'), 'error');
        } finally {
            setSaving(false);
        }
    };

    // Presigned direct-to-storage upload: bytes go from the browser to object storage and never
    // through the backend, which only signs part URLs. Nothing exists as content until the
    // publish call sends the resulting uploadSessionId to the create endpoint — so an abandoned
    // upload leaves no row behind, and the "upload" step returns a session id, not a URL.
    /**
     * Runs one upload, resuming the channel's remembered session when the same file is picked
     * again. The session id is persisted the moment the backend mints it — before any bytes go
     * out — so an upload interrupted at 3% is as resumable as one interrupted at 97%.
     *
     * Declining the offer releases the old session rather than abandoning it: the per-channel
     * quota counts open sessions, and a user who restarts three uploads by hand should not find
     * themselves locked out behind an error telling them to cancel something.
     */
    const runUpload = async (file, kind, hook) => {
        const resumeSessionId = resumableSessionId(slug, kind, file);
        const remembered = rememberedSession(slug, kind);

        if (resumeSessionId && !window.confirm(t('channelManage.resumePrompt', { name: file.name }))) {
            forgetSession(slug, kind);
            await hook.discard(slug, kind, resumeSessionId);
            return runFreshUpload(file, kind, hook);
        }
        if (!resumeSessionId && remembered) {
            // A different file: the old session will never be finished, so free its slot now
            // instead of leaving it to the 24h age bound.
            forgetSession(slug, kind);
            await hook.discard(slug, kind, remembered.sessionId);
        }

        if (!resumeSessionId) return runFreshUpload(file, kind, hook);

        try {
            const uploadSessionId = await hook.upload(file, { kind, slug, resumeSessionId });
            // Deliberately still remembered: the upload is finished but the session is not spent
            // until the create call confirms it, and that call can fail. Re-stamped so a resume
            // that ran days after the original start isn't measured from the original start.
            rememberSession(slug, kind, file, uploadSessionId);
            return uploadSessionId;
        } catch (err) {
            if (!(err instanceof ResumeUnavailableError)) throw err;
            // Swept, cancelled, already published, or no longer describing this file. Nothing to
            // report: from here it is simply an ordinary upload.
            forgetSession(slug, kind);
            return runFreshUpload(file, kind, hook);
        }
    };

    const runFreshUpload = async (file, kind, hook) => {
        // Kept until the content row is created, not cleared on success: the confirm call is what
        // finishes the upload, and it is idempotent on the session, so a failed publish should
        // still find a resumable session behind it.
        return hook.upload(file, {
            kind,
            slug,
            onSessionStart: (id) => rememberSession(slug, kind, file, id),
        });
    };

    /**
     * The shared half of both file-select handlers. What differs is only which form the resulting
     * session id lands in, which the caller supplies.
     *
     * <p>An `AbortError` is not reported: it means the page was left, the session survives it, and
     * by then there is nothing mounted to show a toast to.
     */
    const handleFileSelect = async (e, { kind, hook, setUploading, apply, onFailure }) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const uploadSessionId = await runUpload(file, kind, hook);
            apply(uploadSessionId, file.name.replace(/\.[^/.]+$/, ''));
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast(onFailure(err.response?.data?.message || err.message), 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleVideoFileSelect = (e) => handleFileSelect(e, {
        kind: 'videos',
        hook: videoUpload,
        setUploading: setVideoUploading,
        onFailure: (reason) => t('channelManage.forms.video.uploadFailed', { reason }),
        apply: (uploadSessionId, fallbackTitle) => {
            setVideoForm((current) => ({
                ...current,
                // sourceType/sourceUrl are the server's to set on this path — the create request
                // rejects a payload carrying both a sourceUrl and an uploadSessionId.
                sourceType: '',
                sourceUrl: '',
                uploadSessionId,
                title: current.title || fallbackTitle,
            }));
            showToast(t('channelManage.forms.video.uploaded'), 'success');
        },
    });

    // Same presigned front door as video — the backend differs only by allowlist and size cap.
    // Unlike video there is no transcode afterwards: the PDF is readable the moment the create
    // call confirms it.
    const handleBookFileSelect = (e) => handleFileSelect(e, {
        kind: 'books',
        hook: bookUpload,
        setUploading: setBookUploading,
        onFailure: (reason) => t('channelManage.forms.book.uploadFailed', { reason }),
        apply: (uploadSessionId, fallbackTitle) => {
            setBookForm((current) => ({
                ...current,
                // pdfUrl stays empty — the create request rejects a payload carrying both a
                // pdfUrl and an uploadSessionId. Preview image and page count came from the old
                // server-side PDF processing, which went away with the upload module; a book
                // reads fine without either.
                pdfUrl: '',
                uploadSessionId,
                title: current.title || fallbackTitle,
            }));
            showToast(t('channelManage.forms.book.uploaded'), 'success');
        },
    });

    const handleVideoSubmit = (e) => {
        e.preventDefault();
        videos.publish({ ...stripEmpty(videoForm), speaker: channel.name }, {
            action: t('channelManage.forms.video.action'),
            successMessage: t('channelManage.forms.video.published'),
            onSuccess: () => {
                // The session is spent: confirm assembled the object and created the row.
                forgetSession(slug, 'videos');
                setVideoForm(EMPTY_VIDEO_FORM);
            },
        });
    };

    const handleBookSubmit = (e) => {
        e.preventDefault();
        books.publish(stripEmpty(bookForm), {
            action: t('channelManage.forms.book.action'),
            successMessage: t('channelManage.forms.book.published'),
            onSuccess: () => {
                forgetSession(slug, 'books');
                setBookForm(EMPTY_BOOK_FORM);
            },
        });
    };

    const handleArticleSubmit = (e) => {
        e.preventDefault();
        articles.publish(stripEmpty(articleForm), {
            action: t('channelManage.forms.article.submit'),
            successMessage: t('channelManage.forms.article.published'),
            onSuccess: () => setArticleForm(EMPTY_ARTICLE_FORM),
        });
    };

    const handlePostSubmit = (e) => {
        e.preventDefault();
        posts.publish(stripEmpty(postForm), {
            action: t('channelManage.forms.post.submit'),
            successMessage: t('channelManage.forms.post.published'),
            onSuccess: () => setPostForm(EMPTY_POST_FORM),
        });
    };

    const handleSeriesSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSeries.mutateAsync(stripEmpty(seriesForm));
            setSeriesForm({ title: '', description: '' });
            showToast(t('channelManage.seriesCreated'), 'success');
        } catch (err) {
            showToast(t('channelManage.seriesCreateFailed', {
                reason: err.response?.data?.message || err.message,
            }), 'error');
        }
    };

    const handleDeleteSeries = (series) => {
        if (!window.confirm(t('channelManage.deleteSeriesConfirm', { title: series.title }))) return;
        deleteSeriesMutation.mutate(series.id, {
            onSuccess: () => showToast(t('channelManage.seriesDeleted'), 'success'),
            onError: () => showToast(t('channelManage.seriesDeleteFailed'), 'error'),
        });
    };

    /**
     * Uploads the original file for an imported video, replacing its YouTube embed.
     *
     * <p>Reuses the ordinary presigned upload; only the final call differs — it attaches the
     * session to a video that already exists rather than creating one. Deliberately NOT routed
     * through the resume machinery: resume is keyed per (channel, kind) and one remembered session
     * cannot describe which of two thousand videos it belongs to.
     */
    const handleUploadOriginal = async (e, video) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        setClaimingVideoId(video.id);
        try {
            const uploadSessionId = await originalUpload.upload(file, { kind: 'videos', slug });
            await uploadOriginal.mutateAsync({ videoId: video.id, uploadSessionId });
            showToast(t('youtube.uploadedOriginal'), 'success');
        } catch (err) {
            if (err.name !== 'AbortError') {
                showToast(t('youtube.uploadOriginalFailed', {
                    reason: err.response?.data?.message || err.message,
                }), 'error');
            }
        } finally {
            setClaimingVideoId(null);
        }
    };

    /**
     * The per-row action, for imported videos only.
     *
     * <p>`sourceType === 'YOUTUBE'` is the eligibility test rather than a "has a file" flag,
     * because object keys never appear on a DTO — and it is exactly right: a video still typed
     * YOUTUBE is one we do not host.
     */
    const renderUploadOriginal = (video) => {
        if (video.sourceType !== 'YOUTUBE') return null;

        const busy = claimingVideoId === video.id;
        const ownerVerified = youtubeState?.verifiedBy === 'OWNER';

        return (
            <label
                title={ownerVerified ? t('youtube.uploadOriginal') : t('youtube.uploadOriginalNeedsOwner')}
                className={`p-2 rounded-md transition-colors ${
                    ownerVerified && !busy
                        ? 'text-text-secondary hover:bg-surface-hover hover:text-primary cursor-pointer'
                        : 'text-text-muted opacity-50 cursor-not-allowed'
                }`}
            >
                {busy
                    ? <span className="text-xs">{originalUpload.progress}%</span>
                    : <Upload size={16} />}
                <input
                    type="file"
                    accept={acceptAttribute('videos')}
                    disabled={!ownerVerified || busy}
                    onChange={(e) => handleUploadOriginal(e, video)}
                    className="hidden"
                />
            </label>
        );
    };

    const tabFor = (type) => ({ videos, books, articles, posts })[type];

    const handleModerate = (comment, changes) => {
        moderateComment.mutate({ id: comment.id, ...changes }, {
            onError: () => showToast(t('channelManage.commentUpdateFailed'), 'error'),
        });
    };

    if (authLoading || channelLoading) {
        return (
            <PageShell sidebar={false}>
                <QueryState isLoading />
            </PageShell>
        );
    }

    if (channelError || !channel) {
        const description = channelFetchError?.response?.status === 404
            ? t('channelManage.notFound')
            : t('channelManage.notFoundDescription');
        return <ErrorScreen emoji="🔍" title={t('channelManage.notFound')} description={description} onBack={() => navigate('/')} />;
    }

    if (!canManageChannel(user, channel)) {
        return (
            <ErrorScreen
                emoji="⛔"
                title={t('channelManage.forbidden')}
                description={t('channelManage.forbiddenDescription')}
                onBack={() => navigate('/')}
            />
        );
    }

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(`/channel/${slug}`)} className="text-text-secondary">
                        <ArrowRight size={20} />
                    </button>
                    <h1 className="text-xl font-bold">{t('channelManage.heading', { name: channel.name })}</h1>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-semibold text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white border-2 border-primary'
                                    : 'bg-surface text-text-secondary border border-border'
                            }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <form onSubmit={handleSave} className="grid gap-4 bg-surface p-6 rounded-lg border border-border-light">
                        <Input label={t('channelManage.channelName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        <Input label={t('fields.description')} textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        <div>
                            <FieldLabel>{t('fields.primaryColor')}</FieldLabel>
                            <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-[60px] h-10 cursor-pointer" />
                        </div>
                        <Button type="submit" disabled={saving} icon={<Save size={18} />}>
                            {saving ? t('common.saving') : t('common.save')}
                        </Button>
                    </form>
                )}

                {/* A YouTube link is a property of the channel, like its name and colour — every
                    other tab is a content type, and a source is not one. Imported videos land in
                    the videos tab beside uploaded ones. */}
                {activeTab === 'overview' && (
                    <div className="mt-6">
                        <YouTubeImportPanel slug={slug} />
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="grid gap-6">
                        <ContentPublishForm
                            heading={t('channelManage.forms.video.heading')}
                            onSubmit={handleVideoSubmit}
                            submitLabel={t('channelManage.forms.video.submit')}
                            submitIcon={<Upload size={18} />}
                            file={{
                                label: t('channelManage.forms.video.fileLabel'),
                                accept: acceptAttribute('videos'),
                                onChange: handleVideoFileSelect,
                                uploading: videoUploading,
                                progress: videoUpload.progress,
                            }}
                        >
                            <Input label={t('fields.title')} value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} required />
                            <Input label={t('fields.description')} textarea rows={3} value={videoForm.description} onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })} />
                            <Input label={t('fields.category')} value={videoForm.category} onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })} />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel>{t('channelManage.seriesSelectLabel')}</FieldLabel>
                                    <select
                                        value={videoForm.seriesId}
                                        onChange={(e) => setVideoForm({ ...videoForm, seriesId: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary transition-colors bg-surface"
                                    >
                                        <option value="">{t('channelManage.seriesSelectNone')}</option>
                                        {seriesList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                    </select>
                                </div>
                                {videoForm.seriesId && (
                                    <Input
                                        label={t('channelManage.seriesOrderLabel')}
                                        type="number"
                                        min="1"
                                        value={videoForm.orderInSeries}
                                        onChange={(e) => setVideoForm({ ...videoForm, orderInSeries: e.target.value })}
                                    />
                                )}
                            </div>
                            <Input label={t('fields.originalPublishDateOptional')} type="date" value={videoForm.originalPublishDate} onChange={(e) => setVideoForm({ ...videoForm, originalPublishDate: e.target.value })} />
                        </ContentPublishForm>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('channelManage.forms.video.listHeading', { count: videos.items.length })}</h3>
                            <ContentManageList
                                items={videos.items}
                                loading={videos.loading}
                                onEdit={(item) => setEditing({ type: 'videos', item })}
                                onToggleVisibility={videos.toggleVisibility}
                                onDelete={videos.deleteItem}
                                extraActions={renderUploadOriginal}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'books' && (
                    <div className="grid gap-6">
                        <ContentPublishForm
                            heading={t('channelManage.forms.book.heading')}
                            onSubmit={handleBookSubmit}
                            submitLabel={t('channelManage.forms.book.submit')}
                            file={{
                                label: t('channelManage.forms.book.fileLabel'),
                                accept: acceptAttribute('books'),
                                onChange: handleBookFileSelect,
                                uploading: bookUploading,
                                progress: bookUpload.progress,
                            }}
                        >
                            <Input label={t('fields.title')} value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
                            <Input label={t('fields.description')} textarea rows={3} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <Input label={t('fields.category')} value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} />
                                <Input label={t('channelManage.forms.book.pagesLabel')} type="number" value={bookForm.pages} onChange={(e) => setBookForm({ ...bookForm, pages: e.target.value })} />
                            </div>
                            <Input label={t('fields.originalPublishDateOptional')} type="date" value={bookForm.originalPublishDate} onChange={(e) => setBookForm({ ...bookForm, originalPublishDate: e.target.value })} />
                        </ContentPublishForm>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('channelManage.forms.book.listHeading', { count: books.items.length })}</h3>
                            <ContentManageList
                                items={books.items}
                                loading={books.loading}
                                onEdit={(item) => setEditing({ type: 'books', item })}
                                onToggleVisibility={books.toggleVisibility}
                                onDelete={books.deleteItem}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'articles' && (
                    <div className="grid gap-6">
                        <ContentPublishForm
                            heading={t('channelManage.forms.article.heading')}
                            onSubmit={handleArticleSubmit}
                            submitLabel={t('channelManage.forms.article.submit')}
                        >
                            <Input label={t('fields.title')} value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })} required />
                            <Input label={t('fields.content')} textarea rows={15} className="min-h-[300px]" value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })} required />

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                                <Input label={t('fields.category')} value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })} />
                                <Input label={t('fields.originalPublishDateOptional')} type="date" value={articleForm.originalPublishDate} onChange={(e) => setArticleForm({ ...articleForm, originalPublishDate: e.target.value })} />
                            </div>
                        </ContentPublishForm>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('channelManage.forms.article.listHeading', { count: articles.items.length })}</h3>
                            <ContentManageList
                                items={articles.items}
                                loading={articles.loading}
                                onEdit={(item) => setEditing({ type: 'articles', item })}
                                onToggleVisibility={articles.toggleVisibility}
                                onDelete={articles.deleteItem}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <div className="grid gap-6">
                        <ContentPublishForm
                            heading={t('channelManage.forms.post.heading')}
                            onSubmit={handlePostSubmit}
                            submitLabel={t('channelManage.forms.post.submit')}
                        >
                            <Input
                                label={t('fields.content')}
                                textarea
                                rows={4}
                                value={postForm.content}
                                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                required
                            />
                        </ContentPublishForm>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('channelManage.forms.post.listHeading', { count: posts.items.length })}</h3>
                            <ContentManageList
                                items={posts.items}
                                loading={posts.loading}
                                getLabel={(item) => item.content?.length > 60 ? `${item.content.substring(0, 60)}...` : item.content}
                                onToggleVisibility={posts.toggleVisibility}
                                onDelete={posts.deleteItem}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'series' && (
                    <div className="grid gap-6">
                        <ContentPublishForm
                            heading={t('channelManage.newSeriesHeading')}
                            onSubmit={handleSeriesSubmit}
                            submitLabel={t('channelManage.createSeries')}
                            submitIcon={<Plus size={18} />}
                        >
                            <Input
                                label={t('channelManage.seriesTitleLabel')}
                                value={seriesForm.title}
                                onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                                required
                            />
                            <Input
                                label={t('fields.description')}
                                textarea
                                rows={2}
                                value={seriesForm.description}
                                onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                            />
                        </ContentPublishForm>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{t('channelManage.seriesListHeading', { count: seriesList.length })}</h3>
                            {seriesListLoading ? (
                                <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>
                            ) : seriesList.length === 0 ? (
                                <p className="text-sm text-text-muted py-4">{t('series.emptyOnChannel')}</p>
                            ) : (
                                <div className="grid gap-2">
                                    {seriesList.map((s) => (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between gap-3 p-3 rounded-md border border-border-light bg-surface"
                                        >
                                            <div className="min-w-0">
                                                <strong className="block truncate">{s.title}</strong>
                                                <span className="text-xs text-text-muted">{t('common.videoCount', { count: s.contentCount ?? 0 })}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSeries(s)}
                                                title={t('channelManage.deleteSeries')}
                                                aria-label={t('channelManage.deleteSeries')}
                                                className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'comments' && (
                    <div>
                        <h3 className="text-lg font-bold mb-3">{t('channelManage.commentsHeading', { count: channelCommentsCount })}</h3>
                        {commentsLoading ? (
                            <p className="text-sm text-text-muted py-2">{t('common.loading')}</p>
                        ) : channelComments.length === 0 ? (
                            <p className="text-sm text-text-muted py-4">{t('channelManage.noComments')}</p>
                        ) : (
                            <div className="grid gap-2">
                                {channelComments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`p-3 rounded-md border border-border-light ${
                                            comment.hidden ? 'bg-surface-hover' : 'bg-surface'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-1.5">
                                            <div className="min-w-0">
                                                <strong className="text-primary text-sm">{comment.userName}</strong>
                                                {comment.hidden && (
                                                    <span className="mr-2 text-xs text-text-muted">{t('channelManage.commentHidden')}</span>
                                                )}
                                                {comment.pinned && (
                                                    <span className="mr-2 text-xs text-gold">{t('channelManage.commentPinned')}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    onClick={() => handleModerate(comment, { pinned: !comment.pinned })}
                                                    title={comment.pinned ? t('channelManage.unpin') : t('channelManage.pin')}
                                                    aria-label={comment.pinned ? t('channelManage.unpin') : t('channelManage.pin')}
                                                    className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-primary transition-colors"
                                                >
                                                    {comment.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleModerate(comment, { hidden: !comment.hidden })}
                                                    title={comment.hidden ? t('channelManage.show') : t('channelManage.hide')}
                                                    aria-label={comment.hidden ? t('channelManage.show') : t('channelManage.hide')}
                                                    className="p-1.5 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                                                >
                                                    {comment.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`text-sm ${comment.hidden ? 'text-text-muted' : 'text-text-secondary'}`}>
                                            {comment.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasNextCommentsPage && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => fetchNextCommentsPage()}
                                    disabled={isFetchingNextCommentsPage}
                                    className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                                >
                                    {isFetchingNextCommentsPage ? t('common.loading') : t('common.loadMore')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ContentEditModal
                open={!!editing}
                type={editing?.type}
                item={editing?.item}
                onClose={() => setEditing(null)}
                onSave={(id, changes) => tabFor(editing.type).save(id, changes)}
                saving={editing ? tabFor(editing.type).isSaving : false}
            />
        </PageShell>
    );
}

export default ChannelManage;
