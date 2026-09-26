import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';
import PageShell from '../components/layout/PageShell';
import { Input, Button, ImageUploadField, RejectedFields } from '../components/ui';
import { EmailVerificationNotice } from '../components/auth';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useResolveYouTubeChannel } from '@/hooks/useChannelYouTube';
import { useAuth } from '../contexts/AuthContext';
import { describeError } from '@/lib/describeError';
import { keepRefusal } from '@/lib/rejectedFields';
import { uploadOwnerImage, channelImagePath } from '@/hooks/useOwnerImage';
import { IMAGE_LIMITS } from '@/lib/imageResize';
import { t } from '@/i18n';

/**
 * The slug rule, hoisted out of the name field's onBlur so the YouTube prefill derives one the
 * same way. An Arabic channel title reduces to nothing here, which is correct — the slug is a
 * Latin identifier like a username, not a display name — and leaves the field empty for the owner
 * to fill rather than producing a run of hyphens.
 */
const slugFrom = (value) =>
    value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '');

/**
 * A slug taken from the YouTube handle, when the pasted link has one.
 *
 * <p><b>This is the field that would otherwise stall the whole form.</b> The slug is required and
 * Latin-only, and `slugFrom` reduces an Arabic channel title to the empty string — correctly, since
 * a slug is an identifier and not a display name. So prefilling from the title left the one
 * required field blank on exactly the channels this feature is for.
 *
 * <p>The handle is already what the owner is known by, already Latin, and already unique on
 * YouTube — `@melhamy` → `melhamy`. It is a far better source for this than a translated title.
 */
const slugFromYouTube = (source) => {
    const handle = source.match(/@([A-Za-z0-9._-]{3,30})/)
        || source.match(/youtube\.com\/(?:c|user)\/([A-Za-z0-9._-]{1,64})/i);
    return handle ? slugFrom(handle[1]) : '';
};

/**
 * A picture chosen on the form but not uploaded yet: the File, and a local preview of it. The
 * object URL is revoked when the picture is replaced or the form goes away, so choosing several in
 * a row does not keep every one of them in memory.
 */
function usePickedImage() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
    return {
        file,
        previewUrl,
        pick: (picked) => {
            setFile(picked);
            setPreviewUrl(URL.createObjectURL(picked));
        },
        clear: () => {
            setFile(null);
            setPreviewUrl(null);
        },
    };
}

function CreateChannel() {
    usePageMeta({ title: t('createChannel.title') });
    const { showToast } = useToast();
    const navigate = useNavigate();
    // No primaryColor and no logoUrl. The colour only ever filled the letter circle of a channel
    // with no photo, which is not worth a form field now that a channel can have a photo; the
    // backend keeps its default. The logo used to be prefilled from the YouTube lookup as a
    // Google-hosted link — a request to Google from every reader's browser before consent. A
    // linked channel's logo and cover now arrive as stored copies when it imports, and a picture
    // chosen here is uploaded straight after creation and always comes first.
    const [form, setForm] = useState({
        name: '', slug: '', description: '', youtubeSource: '',
    });
    const logo = usePickedImage();
    const banner = usePickedImage();
    const [error, setError] = useState('');
    // An address refusal (CHANNEL_SLUG_*) is said under the address field, beside what is wrong,
    // rather than at the foot of the form — where «تعذّر إنشاء القناة» used to leave the owner
    // guessing which of five fields to change.
    const [slugError, setSlugError] = useState('');
    // The failed submit itself, for RejectedFields to mark the fields a VALIDATION_FAILED names.
    const [submitError, setSubmitError] = useState(null);
    const [needsVerification, setNeedsVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const resolveYouTube = useResolveYouTubeChannel();
    const { user } = useAuth();
    // The channel the lookup resolved to, kept so the page can show what it found.
    const [foundChannel, setFoundChannel] = useState(null);

    /**
     * Fills the form from the owner's existing YouTube channel.
     *
     * <p>Most of this form is something they have already written once, on YouTube. Fetching it
     * is one click and one quota unit — deliberately a button rather than an on-blur or
     * on-keystroke lookup, because every call spends from a daily budget shared by every channel's
     * import.
     *
     * <p><b>Only empty fields are overwritten.</b> Someone who typed a name and then pasted their
     * channel link should not watch their own words disappear; the slug follows the same rule and
     * derives from the fetched name only if they have not set one.
     */
    const handleFetchYouTube = async () => {
        if (!form.youtubeSource.trim()) return;
        try {
            const found = await resolveYouTube.mutateAsync(form.youtubeSource.trim());
            setForm((current) => ({
                ...current,
                name: current.name || found.title || '',
                description: current.description || found.description || '',
                // Handle first, title second: an Arabic title slugs to nothing.
                slug: current.slug || slugFromYouTube(current.youtubeSource) || slugFrom(found.title || ''),
            }));
            // Recorded as well as toasted: if every field was already filled, nothing on the form
            // appears to change and a toast alone reads as "it did nothing".
            setFoundChannel(found);
            showToast(t('createChannel.youtubeFetched', { title: found.title }), 'success');
        } catch {
            showToast(t('createChannel.youtubeFetchFailed'), 'error');
        }
    };

    const handleSlugChange = (value) => {
        setForm({ ...form, slug: slugFrom(value) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSlugError('');
        setSubmitError(null);
        setNeedsVerification(false);
        setLoading(true);

        try {
            await api.post('/channels', form);
            showToast(t('createChannel.created'), 'success');

            // The pictures need the channel to exist — there is no slug to upload under before
            // this — so they go now, and a failure here never loses the channel: it exists, and
            // the settings tab can take the picture again.
            const pictures = [['logo', logo.file], ['banner', banner.file]].filter(([, file]) => file);
            for (const [kind, file] of pictures) {
                try {
                    await uploadOwnerImage(channelImagePath(form.slug, kind), file, IMAGE_LIMITS[kind]);
                } catch (err) {
                    showToast(t('ownerImage.failed', { reason: describeError(err) }), 'error');
                }
            }

            const source = form.youtubeSource.trim();
            if (!source) {
                navigate('/');
                return;
            }

            /*
             * Link the channel here, rather than making the owner type the same URL a second time.
             *
             * The lookup button above only fills in the form; it establishes no relationship. So
             * without this the flow was: paste the link, watch it say it fetched something, create
             * the channel, land on another page, and paste the same link again before anything is
             * actually imported. Two of those steps were the same step.
             *
             * A platform admin can assert the link outright — they cannot put a token in someone
             * else's YouTube description, which is what `attest` exists for — so for them this
             * finishes the linking entirely and the next page has one button left. Everyone else
             * gets the link established and their verification token minted, so the next page
             * opens on the step that actually needs them.
             */
            try {
                const endpoint = user?.platformAdmin
                    ? `/channels/${form.slug}/youtube/attest`
                    : `/channels/${form.slug}/youtube/verification`;
                await api.post(endpoint, { source });
                showToast(t('createChannel.youtubeLinkedAfterCreate'), 'success');
            } catch {
                // Non-fatal on purpose: the channel exists and the panel can link it by hand. The
                // one thing that must not happen is losing the channel over a YouTube hiccup.
                showToast(t('createChannel.youtubeLinkFailedAfterCreate'), 'error');
            }

            navigate(`/channel/${form.slug}/manage`);
        } catch (err) {
            setSubmitError(keepRefusal(err));
            if (err.response?.data?.emailVerificationRequired) {
                setNeedsVerification(true);
            } else if (String(err.response?.data?.reason || '').startsWith('CHANNEL_SLUG_')) {
                setSlugError(describeError(err, t('createChannel.failed')));
            } else {
                setError(describeError(err, t('createChannel.failed')));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell>
            <div className="max-w-[500px] mx-auto my-8 sm:my-10 px-4">
                <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light">
                    <h1 className="text-xl font-bold mb-2">{t('createChannel.heading')}</h1>
                    <p className="text-text-muted text-sm mb-6">{t('createChannel.subheading')}</p>

                    <RejectedFields error={submitError}>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <Input
                            label={t('createChannel.nameLabel')}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            field="name"
                            onBlur={(e) => { if (!form.slug) handleSlugChange(e.target.value); }}
                            required
                            placeholder={t('createChannel.namePlaceholder')}
                        />

                        <div>
                            <Input
                                label={t('createChannel.slugLabel')}
                                value={form.slug}
                                onChange={(e) => { setSlugError(''); handleSlugChange(e.target.value); }}
                                field="slug"
                                required
                                dir="ltr"
                                placeholder="my-channel"
                                aria-invalid={slugError ? true : undefined}
                                aria-describedby={slugError ? 'slug-error' : undefined}
                                className={slugError ? '!border-red-600 dark:!border-red-500' : ''}
                            />
                            {slugError
                                ? <p id="slug-error" role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">{slugError}</p>
                                : <p className="text-xs text-text-muted mt-1">{t('createChannel.slugHint')}</p>}
                        </div>

                        <Input
                            label={t('fields.description')}
                            textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            field="description"
                            placeholder={t('createChannel.descriptionPlaceholder')}
                        />

                        <div>
                            <Input
                                label={t('createChannel.youtubeLabel')}
                                value={form.youtubeSource}
                                onChange={(e) => setForm({ ...form, youtubeSource: e.target.value })}
                            field="youtubeSource"
                                placeholder={t('youtube.sourcePlaceholder')}
                                dir="ltr"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFetchYouTube}
                                    disabled={!form.youtubeSource.trim() || resolveYouTube.isPending}
                                >
                                    {resolveYouTube.isPending
                                        ? t('createChannel.youtubeFetching')
                                        : t('createChannel.youtubeFetch')}
                                </Button>
                            </div>
                            {/* The link is stored but NOT acted on. Importing needs the owner to
                                prove they control that channel first, and that happens from the
                                channel's YouTube tab once it exists — see YouTubeImportPanel.
                                Fetching details here asserts no relationship to the channel; it
                                reads what YouTube already shows on its public page. */}
                            {foundChannel && (
                                <p className="text-xs text-primary mt-1">
                                    {t('createChannel.youtubeFound', { title: foundChannel.title })}
                                </p>
                            )}
                            <p className="text-xs text-text-muted mt-1">
                                {form.youtubeSource.trim()
                                    ? t('createChannel.youtubeWillLink')
                                    : t('createChannel.youtubeHint')}
                            </p>
                        </div>

                        <ImageUploadField
                            label={t('ownerImage.logo')}
                            hint={t('createChannel.logoHint')}
                            previewUrl={logo.previewUrl}
                            shape="round"
                            hasUpload={!!logo.file}
                            uploading={loading && !!logo.file}
                            onPick={logo.pick}
                            onRemove={logo.clear}
                        />

                        <ImageUploadField
                            label={t('ownerImage.banner')}
                            hint={t('ownerImage.bannerHint')}
                            previewUrl={banner.previewUrl}
                            shape="wide"
                            hasUpload={!!banner.file}
                            uploading={loading && !!banner.file}
                            onPick={banner.pick}
                            onRemove={banner.clear}
                        />

                        {needsVerification && (
                            <EmailVerificationNotice message={t('auth.verificationNotice.beforeChannel')} />
                        )}

                        {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md">{error}</p>}

                        <Button type="submit" disabled={loading || needsVerification} fullWidth>
                            {loading ? t('createChannel.submitting') : t('createChannel.submit')}
                        </Button>
                    </form>
                    </RejectedFields>
                </div>
            </div>
        </PageShell>
    );
}

export default CreateChannel;
