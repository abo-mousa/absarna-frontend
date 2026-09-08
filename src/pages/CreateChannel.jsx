import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/client';
import PageShell from '../components/layout/PageShell';
import { Input, Button } from '../components/ui';
import { EmailVerificationNotice } from '../components/auth';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { FieldLabel } from '@/components/channel';
import { useResolveYouTubeChannel } from '@/hooks/useChannelYouTube';
import { useAuth } from '../contexts/AuthContext';
import { isPlatformAdmin } from '@/lib/user';
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

function CreateChannel() {
    usePageMeta({ title: t('createChannel.title') });
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', slug: '', description: '', primaryColor: '#0D6B4D', logoUrl: '', youtubeSource: '',
    });
    const [error, setError] = useState('');
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
                // Hotlinked, not copied — a default the owner can replace, not a claim on the image.
                logoUrl: current.logoUrl || found.thumbnailUrl || '',
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
        setNeedsVerification(false);
        setLoading(true);

        try {
            await api.post('/channels', form);
            showToast(t('createChannel.created'), 'success');

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
                const endpoint = isPlatformAdmin(user)
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
            if (err.response?.data?.emailVerificationRequired) {
                setNeedsVerification(true);
            } else {
                setError(err.response?.data?.message || t('createChannel.failed'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[500px] mx-auto my-8 sm:my-10 px-4">
                <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-sm border border-border-light">
                    <h1 className="text-xl font-bold mb-2">{t('createChannel.heading')}</h1>
                    <p className="text-text-muted text-sm mb-6">{t('createChannel.subheading')}</p>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <Input
                            label={t('createChannel.nameLabel')}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            onBlur={(e) => { if (!form.slug) handleSlugChange(e.target.value); }}
                            required
                            placeholder={t('createChannel.namePlaceholder')}
                        />

                        <div>
                            <Input
                                label={t('createChannel.slugLabel')}
                                value={form.slug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                required
                                dir="ltr"
                                placeholder="my-channel"
                            />
                            <p className="text-xs text-text-muted mt-1">{t('createChannel.slugHint')}</p>
                        </div>

                        <Input
                            label={t('fields.description')}
                            textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder={t('createChannel.descriptionPlaceholder')}
                        />

                        <div>
                            <Input
                                label={t('createChannel.youtubeLabel')}
                                value={form.youtubeSource}
                                onChange={(e) => setForm({ ...form, youtubeSource: e.target.value })}
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
                                channel's own settings once it exists — see YouTubeImportPanel.
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

                        <div>
                            <FieldLabel>{t('fields.primaryColor')}</FieldLabel>
                            <input
                                type="color"
                                value={form.primaryColor}
                                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                                className="w-[60px] h-10 cursor-pointer"
                            />
                        </div>

                        {needsVerification && (
                            <EmailVerificationNotice message={t('auth.verificationNotice.beforeChannel')} />
                        )}

                        {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950/40 p-2.5 rounded-md">{error}</p>}

                        <Button type="submit" disabled={loading || needsVerification} fullWidth>
                            {loading ? t('createChannel.submitting') : t('createChannel.submit')}
                        </Button>
                    </form>
                </div>
            </div>
        </PageShell>
    );
}

export default CreateChannel;
