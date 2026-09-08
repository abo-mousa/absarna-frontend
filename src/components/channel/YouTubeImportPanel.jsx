import { useEffect, useRef, useState } from 'react';
import { Link2, Check, Copy, RefreshCw } from 'lucide-react';
import { Input, Button, Spinner } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformAdmin } from '@/lib/user';
import {
    useChannelYouTube,
    useLinkYouTubeChannel,
    useCheckYouTubeVerification,
    useStartYouTubeImport,
    useAttestYouTubeChannel,
} from '@/hooks/useChannelYouTube';
import { t } from '@/i18n';
import { describeError } from '@/lib/describeError';
import { formatCount } from '@/lib/numbers';

/**
 * The label for the one button that starts, retries and resumes an import — or `null` where there
 * must be no button at all.
 *
 * <p>Four statuses, three of which the owner reads as the same intent. `PARTIAL` is the one worth
 * naming separately: it is <b>not</b> a failure, and «أعد المحاولة» would tell an owner their
 * import broke when in fact the platform's shared daily YouTube quota ran out and the backend saved
 * its place. On a catalogue of any size that is the normal path, several days running.
 */
export function importButtonLabel(status) {
    if (!status) return t('youtube.startImport');
    if (status === 'PARTIAL') return t('youtube.resumeImport');
    if (status === 'FAILED') return t('youtube.retryImport');
    // RUNNING is already working and SUCCESS is done; a button on either invites a second walk of
    // a catalogue that costs the whole platform's quota to walk once.
    return null;
}

/**
 * «تم استيراد 25,000 من ~137,412 فيديو» — or `null` while there is nothing yet to report.
 *
 * <p>`importedVideos` is written per committed page rather than once at the end, so this climbs
 * during a walk that can last hours; without it a multi-day import is a spinner over a zero, which
 * is indistinguishable from one that is stuck. `importTotalEstimate` is YouTube's own
 * `pageInfo.totalResults` and is null before the first page and once the import finishes — hence
 * the "~", and hence a shape that reads correctly with the denominator missing.
 */
export function importProgress(state) {
    const count = Number(state?.importedVideos);
    if (!Number.isFinite(count) || count <= 0) return null;
    const total = Number(state?.importTotalEstimate);
    return Number.isFinite(total) && total > 0
        ? t('youtube.progressOfTotal', { count: formatCount(count), total: formatCount(total) })
        : t('youtube.progress', { count: formatCount(count) });
}

/**
 * Link a YouTube channel, prove you own it, import it once.
 *
 * <p>Three states in sequence — not linked, linked but unverified, verified — and the import sits
 * behind all three. Rendered as one panel rather than a wizard because the middle step sends the
 * owner to another website and back, and a wizard that loses its place while they are gone is
 * worse than a page that simply shows where they got to.
 *
 * <p><b>Lives in the overview tab, not a tab of its own.</b> A YouTube link is a property of the
 * channel, like its name and colour — every other tab is a content type, and a source is not one.
 * Imported videos land in the videos tab beside uploaded ones, which is the entire reason to
 * import into this platform rather than link out: they can join a series, be searched, be
 * bookmarked and be resumed.
 */
function YouTubeImportPanel({ slug }) {
    const { showToast } = useToast();
    const { user } = useAuth();
    // Hidden rather than shown-and-rejected: the backend 403s anyone else, and offering an action
    // that cannot succeed is worse than not offering it.
    const isAdmin = isPlatformAdmin(user);

    const { data: state, isLoading } = useChannelYouTube(slug);
    const link = useLinkYouTubeChannel(slug);
    const check = useCheckYouTubeVerification(slug);
    const startImport = useStartYouTubeImport(slug);
    const attest = useAttestYouTubeChannel(slug);

    const [source, setSource] = useState('');

    // Carries forward whatever was typed on the create-channel form. Without this the owner enters
    // their channel URL once, lands here, and is asked for the same URL again — which is what
    // "nothing happened" looks like from their side. Only fills an untouched field, so it cannot
    // overwrite something they are in the middle of typing.
    useEffect(() => {
        if (state?.youtubeSource && !state.youtubeChannelId) {
            setSource((current) => current || state.youtubeSource);
        }
    }, [state?.youtubeSource, state?.youtubeChannelId]);
    // Only after a check that came back unverified — not on first render, where the owner has not
    // done anything yet and "we couldn't find it" would be an accusation rather than a hint.
    const [checkedAndMissing, setCheckedAndMissing] = useState(false);
    // Mirrors ShareButton: the icon becomes a tick for a moment, so the confirmation is where the
    // click was rather than only in a toast at the edge of the screen.
    const [copied, setCopied] = useState(false);
    const copiedTimer = useRef(null);
    const tokenRef = useRef(null);
    useEffect(() => () => clearTimeout(copiedTimer.current), []);

    if (isLoading) {
        return <div className="bg-surface p-6 rounded-lg border border-border-light"><Spinner /></div>;
    }

    const handleLink = async (e) => {
        e.preventDefault();
        try {
            await link.mutateAsync(source.trim());
        } catch {
            showToast(t('youtube.linkFailed'), 'error');
        }
    };

    const handleCheck = async () => {
        const result = await check.mutateAsync();
        setCheckedAndMissing(!result.verified);
    };

    /**
     * The admin path. Uses whichever source is on screen — the field while nothing is linked, the
     * already-resolved channel once something is.
     */
    const handleAttest = async () => {
        const claimed = source.trim() || state?.youtubeChannelId;
        if (!claimed) return;
        try {
            await attest.mutateAsync(claimed);
        } catch {
            showToast(t('youtube.adminAttestFailed'), 'error');
        }
    };

    const adminAttestButton = (
        <div className="grid gap-1.5">
            <Button
                type="button"
                variant="outline"
                onClick={handleAttest}
                disabled={attest.isPending || (!source.trim() && !state?.youtubeChannelId)}
                className="w-fit"
            >
                {attest.isPending ? t('youtube.adminAttesting') : t('youtube.adminAttest')}
            </Button>
            <p className="text-xs text-text-muted">{t('youtube.adminAttestHint')}</p>
        </div>
    );

    /**
     * Copies the token, and degrades to selecting it when the clipboard is unavailable.
     *
     * <p>`navigator.clipboard` requires a secure context and can be refused by privacy settings.
     * This used to swallow that failure silently: the owner clicked, nothing happened, and there
     * was no hint that they should select the text by hand. Selecting it for them turns the
     * fallback into one keystroke instead of a careful drag across a random-looking string.
     */
    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(state.token);
            setCopied(true);
            clearTimeout(copiedTimer.current);
            copiedTimer.current = setTimeout(() => setCopied(false), 2000);
            showToast(t('youtube.tokenCopied'), 'success');
        } catch {
            selectToken();
            showToast(t('youtube.tokenCopyManually'), 'error');
        }
    };

    /** Puts the whole token in the selection, so the manual path is Ctrl+C and nothing else. */
    const selectToken = () => {
        const node = tokenRef.current;
        if (!node || !window.getSelection) return;
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    };

    return (
        <div className="grid gap-4 bg-surface p-6 rounded-lg border border-border-light">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Link2 size={20} /> {t('youtube.heading')}
            </h3>
            <p className="text-sm text-text-muted">{t('youtube.intro')}</p>

            {!state?.youtubeChannelId && (
                <form onSubmit={handleLink} className="grid gap-3">
                    <Input
                        label={t('youtube.sourceLabel')}
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder={t('youtube.sourcePlaceholder')}
                        dir="ltr"
                        required
                    />
                    <p className="text-xs text-text-muted">{t('youtube.sourceHint')}</p>
                    <Button type="submit" disabled={link.isPending}>
                        {link.isPending ? t('youtube.linking') : t('youtube.link')}
                    </Button>
                    {isAdmin && adminAttestButton}
                </form>
            )}

            {state?.youtubeChannelId && (
                <div className="text-sm text-text-secondary" dir="auto">
                    {/* The status endpoint deliberately makes no YouTube call — a page load should
                        not spend from the shared daily quota — so it has no title to give. It does
                        know what the owner typed, and "youtube.com/@melhamy" identifies the channel
                        just as well as its display name. Falling back to that beats rendering an
                        empty line where a confirmation should be. */}
                    {t('youtube.foundChannel', {
                        title: state.youtubeTitle || state.youtubeSource || state.youtubeChannelId,
                    })}
                </div>
            )}

            {/* Unverified: the token and what to do with it. */}
            {state?.youtubeChannelId && !state.verified && state.token && (
                <div className="grid gap-2 p-4 rounded-md bg-surface-hover border border-border">
                    <strong className="text-sm">{t('youtube.verifyHeading')}</strong>
                    <p className="text-sm text-text-secondary">{t('youtube.verifyIntro')}</p>
                    <p className="text-sm text-text-secondary">{t('youtube.verifyStep1')}</p>
                    {/* The whole row copies, not just the icon. On a phone, tapping a 12-point
                        random string to select it is the fiddliest gesture in this flow, and the
                        button beside it is easy to miss. */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={copyToken}
                            title={t('youtube.copyToken')}
                            className="flex-1 min-w-0 text-start px-3 py-2 rounded-md bg-surface border border-border
                                hover:border-primary transition-colors cursor-pointer"
                        >
                            <code ref={tokenRef} dir="ltr" className="text-sm block overflow-x-auto">
                                {state.token}
                            </code>
                        </button>
                        <button
                            type="button"
                            onClick={copyToken}
                            title={t('youtube.copyToken')}
                            aria-label={t('youtube.copyToken')}
                            className={`p-2.5 rounded-md text-white flex-shrink-0 transition-colors ${
                                copied ? 'bg-emerald-600' : 'bg-primary'
                            }`}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                    <p className="text-xs text-text-muted">{t('youtube.tokenCopyHint')}</p>
                    <p className="text-sm text-text-secondary">{t('youtube.verifyStep2')}</p>
                    {/* Straight to the page that holds the description, rather than leaving the
                        owner to find Customisation → Basic info themselves. Deep-linked by channel
                        id, which is exactly what we just resolved. */}
                    <a
                        href={`https://studio.youtube.com/channel/${state.youtubeChannelId}/editing/details`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary font-semibold w-fit hover:underline"
                    >
                        {t('youtube.openStudio')} ↗
                    </a>
                    <p className="text-sm text-text-secondary">{t('youtube.verifyStep3')}</p>
                    <p className="text-sm text-text-muted">{t('youtube.verifyStep4')}</p>

                    {checkedAndMissing && (
                        <p className="text-sm text-gold">{t('youtube.notFoundYet')}</p>
                    )}
                    <p className="text-xs text-text-muted">{t('youtube.verifyPatience')}</p>

                    <Button onClick={handleCheck} disabled={check.isPending} className="w-fit">
                        {check.isPending ? t('youtube.verifying') : t('youtube.verify')}
                    </Button>

                    {isAdmin && (
                        <div className="pt-3 mt-1 border-t border-border">
                            {adminAttestButton}
                        </div>
                    )}
                </div>
            )}

            {state?.verified && (
                <p className="text-sm text-primary flex items-center gap-1.5">
                    <Check size={16} />
                    {state.verifiedBy === 'ADMIN'
                        ? t('youtube.verifiedByAdmin')
                        : t('youtube.verified')}
                </p>
            )}

            {state?.verifiedBy === 'ADMIN' && (
                // Said on screen, not only in the API: an admin link allows importing and embedding,
                // and stops short of letting the platform host the file itself.
                <p className="text-xs text-text-muted">{t('youtube.adminAttestWarning')}</p>
            )}

            {state?.verified && (
                <div className="grid gap-2 pt-2 border-t border-border-light">
                    <strong className="text-sm">{t('youtube.importHeading')}</strong>

                    {!state.importStatus && (
                        <p className="text-sm text-text-muted">{t('youtube.importIntro')}</p>
                    )}

                    {state.importStatus === 'RUNNING' && (
                        <p className="text-sm text-text-secondary flex items-center gap-2">
                            <RefreshCw size={14} className="animate-spin" />
                            {t('youtube.running')}
                        </p>
                    )}

                    {state.importStatus === 'SUCCESS' && (
                        <p className="text-sm text-primary flex items-center gap-1.5">
                            <Check size={16} />
                            {t('youtube.succeeded', {
                                count: formatCount(state.importedVideos ?? 0),
                            })}
                        </p>
                    )}

                    {/* PARTIAL is a pause, not a failure — the backend saved a resume point and
                        the button below continues from it. Styled as information rather than as an
                        error for that reason: a catalogue bigger than the platform's shared daily
                        YouTube quota lands here every day until it is finished, and colouring the
                        ordinary path red teaches the owner to ignore the one time it is red. */}
                    {state.importStatus === 'PARTIAL' && (
                        <p className="text-sm text-gold">{t('youtube.paused')}</p>
                    )}

                    {state.importStatus === 'FAILED' && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {t('youtube.failed', { reason: state.importMessage || '' })}
                        </p>
                    )}

                    {/* The count climbs while a walk is running and is what the owner watches on a
                        multi-day import. Shown for both, because a paused import that has already
                        brought in 25,000 videos should say so rather than only that it stopped. */}
                    {(state.importStatus === 'RUNNING' || state.importStatus === 'PARTIAL') &&
                        importProgress(state) && (
                            <p className="text-sm text-text-secondary" dir="auto">
                                {importProgress(state)}
                            </p>
                        )}

                    {state.importStatus === 'PARTIAL' && state.importMessage && (
                        <p className="text-xs text-text-muted" dir="auto">
                            {t('youtube.pausedReason', { reason: state.importMessage })}
                        </p>
                    )}

                    {/* One button for start, retry and resume, because from the owner's side they
                        are one intent — and `importButtonLabel` returns null for RUNNING and
                        SUCCESS, which is what keeps a second walk from being one click away. */}
                    {importButtonLabel(state.importStatus) && (
                        <Button
                            onClick={() => startImport.mutate()}
                            disabled={startImport.isPending}
                            variant={state.importStatus ? 'outline' : 'primary'}
                            className="w-fit"
                        >
                            {importButtonLabel(state.importStatus)}
                        </Button>
                    )}

                    {/* Pressing the button can fail on its own — a PENDING channel is refused with
                        a 403 whose Arabic body the panel used to throw away, so the click did
                        nothing visible at all and the button simply re-enabled. Rendered inline
                        rather than toasted because the button stays on screen and the reason
                        should stay next to it. */}
                    {startImport.isError && (
                        <p className="text-sm text-red-600 dark:text-red-400" dir="auto">
                            {t('youtube.startFailed', {
                                reason: describeError(startImport.error),
                            })}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default YouTubeImportPanel;
