import { useEffect, useState } from 'react';
import { Link2, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { Input, Button, Spinner } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdoptionProgress } from '@/hooks/useChannelAdoption';
import { adoptionRemainingLine, adoptionState } from './MetadataAdoptionView';
import {
    useChannelYouTube,
    useLinkYouTubeChannel,
    useStartYouTubeImport,
    useAttestYouTubeChannel,
    useStartYouTubeOAuth,
} from '@/hooks/useChannelYouTube';
import { isGoogleConsentUrl, rememberOAuthReturn } from '@/lib/youtubeOAuth';
import { t, tOptional } from '@/i18n';
import { describeError } from '@/lib/describeError';
import { formatCount } from '@/lib/numbers';
import dayjs, { dateLocale, parseTimestamp } from '@/lib/datetime';

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
 * The Arabic sentence for the run's `importReason` code — or `null` when there is no code, or none
 * this build knows.
 *
 * <p>Why a run paused used to be `importMessage` alone, an English string that could be a quoted
 * Spring exception («السبب: I/O error on GET request for …: Read timed out»). The code says the
 * same thing in words an owner can act on; `importMessage` stays as the fallback for a code added
 * on the backend before this side learned it.
 */
export function importReasonText(state) {
    const reason = state?.importReason;
    if (typeof reason !== 'string' || !reason) return null;
    return tOptional(`youtube.importReasons.${reason}`) ?? null;
}

/**
 * Which sentence describes where this channel stands with the daily catch-up.
 *
 * <p>Four cases, and the order is the rule: <b>a check having happened is the only proof that the
 * channel is in the rotation</b>, so it is tested first and everything below it is a statement about
 * the future. `PENDING` comes next because it is the one case where the owner is waiting on somebody
 * else — an admin — rather than on us. A `SUCCESS` import with no check yet is "within a day". Any
 * other import state means the walk is not finished, and a refresh reads the NEWEST page, so running
 * one against a half-walked catalogue would be starting from the wrong end.
 *
 * <p>Deliberately derived from what the backend reports rather than re-implementing its eligibility
 * rule: this only ever decides a sentence, so if the two drift the cost is wording, never whether a
 * channel is refreshed.
 */
export function autoUpdateIntro(state) {
    if (state?.refreshRanAt) return t('youtube.autoUpdate.active');
    if (state?.importReview === 'PENDING') return t('youtube.autoUpdate.afterApproval');
    if (state?.importStatus === 'SUCCESS') return t('youtube.autoUpdate.soon');
    return t('youtube.autoUpdate.afterImport');
}

/**
 * «آخر تحقق منذ 3 ساعات — لا جديد» — or `null` before the first check has happened.
 *
 * <p><b>A check that found nothing still says so</b>, and that is the whole reason this line exists.
 * Finding nothing is the ordinary answer on almost every day, so rendering nothing for it would
 * leave an owner unable to tell a working feature from a stopped one — which is the only question a
 * background job with no button can raise.
 *
 * <p>`refreshNewVideos` is the LAST check's count, not a running total, so it is 0 most days and
 * never accumulates. One gets its own wording because one is the common case for a daily check.
 *
 * <p>`when` is passed in rather than computed here so this stays a pure function of the state: the
 * relative phrasing depends on the current clock, and a test asserting «منذ ساعة» would otherwise
 * pass or fail according to when it ran.
 */
export function refreshSummary(state, when) {
    if (!state?.refreshRanAt) return null;
    const count = Number(state.refreshNewVideos);
    if (!Number.isFinite(count) || count <= 0) {
        return t('youtube.autoUpdate.lastCheckedNothing', { when });
    }
    if (count === 1) return t('youtube.autoUpdate.lastCheckedAddedOne', { when });
    return t('youtube.autoUpdate.lastCheckedAdded', { when, count: formatCount(count) });
}

/**
 * «منذ 3 ساعات» for the last check — or «قبل قليل» when its timestamp is not in the past.
 *
 * <p><b>The future guard is the whole reason this is a function.</b> `refreshRanAt` is a
 * `LocalDateTime` that names no zone, read as UTC because the servers run UTC — so any drift
 * between the server's clock and the reader's puts it slightly ahead, and dayjs renders that as
 * «آخر تحقق بعد 39 دقيقة»: last checked *in* 39 minutes. On a line whose entire job is to reassure
 * an owner that the daily check is running, a sentence that cannot be true reads as a broken page.
 * `formatPublishDate` makes the same call about a publish date in the future, for the same reason.
 *
 * <p>Always relative, never an absolute date: a daily check is by definition recent, and the one
 * case where it is not — «منذ شهر» — is exactly the reading worth having.
 *
 * <p>`now` is injectable so a test can assert the guard without racing the clock.
 */
export function lastCheckedWhen(value, now = dayjs()) {
    if (!value) return null;
    const at = parseTimestamp(value);
    if (!at.isValid()) return null;
    if (!at.isBefore(now)) return t('youtube.autoUpdate.justNow');
    return at.locale(dateLocale()).from(now);
}

/**
 * What to say about a check that did not finish — or `null` when the last one was fine.
 *
 * <p>Never asks for an action, unlike a failed import: there is no button here, and the next day's
 * check is the retry. A `refreshReason` this build does not know falls back to the reasonless
 * sentence rather than printing its own key, so the backend can add one first.
 */
export function refreshFailureText(state) {
    if (state?.refreshStatus !== 'FAILED') return null;
    const reason = typeof state.refreshReason === 'string' && state.refreshReason
        ? tOptional(`youtube.autoUpdate.reasons.${state.refreshReason}`)
        : null;
    return reason
        ? t('youtube.autoUpdate.failedReason', { reason })
        : t('youtube.autoUpdate.failed');
}

/**
 * The one line the panel gives to metadata confirmation, and the way in.
 *
 * <p>Its own component and its own query, rather than more fields on the panel's status call:
 * these numbers move when the OWNER acts, and the panel's status polls on a five-second timer
 * while an import runs. Folding them together would either poll a count that cannot change or
 * stop polling an import that can.
 *
 * <p><b>Renders a sentence in every state, including the finished one.</b> «تم تأكيد ٢٠٠٠ مقطعاً»
 * is worth saying: this is a task an owner works through over several sittings, and a section that
 * empties itself on completion would leave them unsure whether they finished or whether it broke.
 * The one state with nothing to say is a channel whose import produced no rows at all.
 */
export function AdoptionPanelLine({ slug, onOpen }) {
    const { data: progress } = useAdoptionProgress(slug);
    const state = adoptionState(progress);

    if (state === 'loading' || state === 'none') return null;

    return (
        <>
            {state === 'blocked' ? (
                <p className="text-sm text-gold leading-loose" dir="auto">
                    {t('youtube.adoption.needsOwnerVerification')}
                </p>
            ) : (
                <p className="text-sm text-text-muted leading-loose" dir="auto">
                    {t('youtube.adoption.intro')}
                </p>
            )}

            {adoptionRemainingLine(progress) && (
                <p className="text-sm text-text-secondary font-semibold" dir="auto">
                    {adoptionRemainingLine(progress)}
                </p>
            )}

            {/* No button on a blocked channel: the remedy is the verification section above, and a
                control that can only be refused is worse than no control. None on a finished one
                either — there is nothing behind it. */}
            {state === 'working' && (
                <Button variant="outline" onClick={onOpen} className="w-fit">
                    {t('youtube.adoption.open')}
                </Button>
            )}
        </>
    );
}

/**
 * Link a YouTube channel, prove you own it, import it once.
 *
 * <p>Three states in sequence — not linked, linked but unverified, verified — and the import sits
 * behind all three. Rendered as one panel rather than a wizard because the middle step sends the
 * owner to another website and back, and a wizard that loses its place while they are gone is
 * worse than a page that simply shows where they got to.
 *
 * <p><b>Rendered by its own tab (`tabs/YouTubeTab`)</b>, which says why it moved out from under
 * the settings form. The <em>videos</em> it imports still land in the videos tab beside uploaded
 * ones, which is the entire reason to import into this platform rather than link out: they can
 * join a series, be searched, be bookmarked and be resumed.
 */
function YouTubeImportPanel({ slug, isOwner, onOpenAdoption }) {
    const { showToast } = useToast();
    const { user } = useAuth();
    // Hidden rather than shown-and-rejected: the backend 403s anyone else, and offering an action
    // that cannot succeed is worse than not offering it.
    const isAdmin = !!user?.platformAdmin;

    const { data: state, isLoading } = useChannelYouTube(slug);
    const link = useLinkYouTubeChannel(slug);
    const startImport = useStartYouTubeImport(slug);
    const attest = useAttestYouTubeChannel(slug);
    const startOAuth = useStartYouTubeOAuth(slug);

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

    /**
     * "Verify with Google": fetch the consent URL and leave for it. The callback page brings the
     * owner back to this tab. Nothing to clean up on the way out — the backend holds no state for
     * a flow that is never finished.
     */
    const handleGoogle = async () => {
        let authorizationUrl;
        try {
            ({ authorizationUrl } = await startOAuth.mutateAsync());
        } catch (error) {
            showToast(describeError(error, t('youtube.oauth.startFailed')), 'error');
            return;
        }
        if (!isGoogleConsentUrl(authorizationUrl)) {
            showToast(t('youtube.oauth.startFailed'), 'error');
            return;
        }
        rememberOAuthReturn(slug);
        window.location.assign(authorizationUrl);
    };

    /**
     * Offered only when the backend says the deployment has it (`oauthAvailable`). When it does not
     * — no OAuth client configured — nothing
     * steps are the whole flow, so there is no disabled button explaining a feature nobody can use.
     */
    // The owner's alone: signing in with Google proves control of the YouTube channel with
    // whichever account signs in, so offered to an admin managing somebody else's channel it can
    // only verify the wrong person. An admin has the attestation instead.
    const googleVerify = (hint) =>
        state?.oauthAvailable && isOwner ? (
            <div className="grid gap-1.5">
                <Button
                    type="button"
                    onClick={handleGoogle}
                    // Stays disabled after success too: the page is navigating away.
                    disabled={startOAuth.isPending || startOAuth.isSuccess}
                    className="w-fit"
                >
                    {startOAuth.isPending || startOAuth.isSuccess
                        ? t('youtube.oauth.redirecting')
                        : t('youtube.oauth.button')}
                </Button>
                <p className="text-xs text-text-muted">{hint}</p>
            </div>
        ) : null;

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


    return (
        <div className="grid gap-4 bg-surface p-6 rounded-lg border border-border-light">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Link2 size={20} /> {t('youtube.heading')}
            </h3>
            <p className="text-sm text-text-muted">{t('youtube.intro')}</p>

            {/* Not linked yet: signing in with Google links AND verifies in one step, so it goes
                first. The URL form stays below as the other way in. */}
            {!state?.youtubeChannelId && state?.oauthAvailable && isOwner && (
                <div className="grid gap-3">
                    {googleVerify(t('youtube.oauth.hintUnlinked'))}
                    <p className="text-sm text-text-secondary">{t('youtube.oauth.orManual')}</p>
                </div>
            )}

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

            {/* Linked but unverified: Google sign-in, which is the whole of it now. */}
            {state?.youtubeChannelId && !state.verified && (
                <div className="grid gap-2 p-4 rounded-md bg-surface-hover border border-border">
                    <strong className="text-sm">{t('youtube.verifyHeading')}</strong>
                    {!isOwner ? null : state.oauthAvailable ? (
                        <>
                            <p className="text-sm text-text-secondary">{t('youtube.verifyIntro')}</p>
                            {googleVerify(t('youtube.oauth.hintLinked'))}
                        </>
                    ) : (
                        /* No OAuth client on this deployment. There is no second method behind it
                           any more, so this is a dead end for the owner and saying so is the only
                           honest thing on screen — an empty box reads as a page that failed. */
                        <p className="text-sm text-gold">{t('youtube.oauth.unavailable')}</p>
                    )}

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

            {/* The only route from an admin link to the owner's own. Only for the owner — it is
                their Google account that has to sign in (googleVerify checks) — and never for an
                admin, including one who owns a channel they seeded for somebody else. */}
            {state?.verifiedBy === 'ADMIN' && !isAdmin && googleVerify(t('youtube.oauth.hintUpgrade'))}

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

                    {/* The one reason a RUNNING run carries: YouTube stopped answering and the
                        backend is waiting out a retry. The poll picks it up, and the next page
                        committed clears it. */}
                    {state.importStatus === 'RUNNING' && importReasonText(state) && (
                        <p className="text-sm text-gold">{importReasonText(state)}</p>
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
                            {t('youtube.failed', {
                                reason: importReasonText(state) || state.importMessage || '',
                            })}
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

                    {state.importStatus === 'PARTIAL' &&
                        (importReasonText(state) || state.importMessage) && (
                            <p className="text-xs text-text-muted" dir="auto">
                                {t('youtube.pausedReason', {
                                    reason: importReasonText(state) || state.importMessage,
                                })}
                            </p>
                        )}

                    {/* Said BEFORE the click, not after, because the consequence is not obvious
                        and is not reversible by the owner: starting the import takes the channel
                        off the site until a platform admin has looked at what arrived. An
                        imported video never reaches the transcode worker, so nothing has examined
                        it — which is the whole reason this one step is reviewed while ordinary
                        publishing is not. Shown only for a channel that has not already been
                        through it; on a resume the channel is already approved and nothing
                        happens. */}
                    {importButtonLabel(state.importStatus) && state.importReview !== 'APPROVED' && (
                        <p className="text-sm text-gold-dark dark:text-gold bg-gold/10 border border-gold/30 rounded-md p-3" dir="auto">
                            {state.importReview === 'PENDING'
                                ? t('youtube.reviewPending')
                                : t('youtube.reviewOnImport')}
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

            {/* Confirming the imported metadata. Sits between the import and the daily catch-up
                because that is its place in the sequence: it becomes possible the moment an import
                has produced rows, and it is the one thing on this panel the OWNER has to do rather
                than watch.

                A line and a button, never the screen itself. The confirmation needs the
                affirmation sentence next to it, needs a page the owner actually reads, and needs
                an end — none of which survives being a third block on a panel that is already
                verification plus a multi-day import. See MetadataAdoptionView. */}
            {/* The owner's statement to make, and nobody else's — see ChannelManage's isOwner. */}
            {state?.verified && state?.importStatus && isOwner && (
                <div className="grid gap-2 pt-2 border-t border-border-light">
                    <strong className="text-sm flex items-center gap-1.5">
                        <ShieldCheck size={14} /> {t('youtube.adoption.heading')}
                    </strong>
                    <AdoptionPanelLine slug={slug} onOpen={onOpenAdoption} />
                </div>
            )}

            {/* The daily catch-up. Rendered only once an import exists, because that is what puts a
                channel in the rotation at all — before then «التحديث التلقائي» would be a promise
                about something the owner has not started.

                There is no button and nothing to poll here on purpose: the sweep is a background
                job, and the panel's own poll runs only while an import is RUNNING. So these two or
                three lines are the entire surface of the feature, and the one they exist for is the
                "nothing new" case — an owner who sees nothing cannot tell a working daily check from
                one that stopped, and that is the only question this can answer for them. */}
            {state?.verified && state?.importStatus && (
                <div className="grid gap-2 pt-2 border-t border-border-light">
                    <strong className="text-sm flex items-center gap-1.5">
                        <RefreshCw size={14} /> {t('youtube.autoUpdate.heading')}
                    </strong>

                    <p className="text-sm text-text-muted" dir="auto">{autoUpdateIntro(state)}</p>

                    {refreshSummary(state, lastCheckedWhen(state?.refreshRanAt)) && (
                        <p className="text-sm text-text-secondary" dir="auto">
                            {refreshSummary(state, lastCheckedWhen(state?.refreshRanAt))}
                        </p>
                    )}

                    {/* Gold rather than red: nothing is broken from the owner's side and there is
                        nothing for them to do — the next day's sweep is the retry. Colouring it as
                        an error would ask for an action that does not exist. */}
                    {refreshFailureText(state) && (
                        <p className="text-sm text-gold" dir="auto">{refreshFailureText(state)}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default YouTubeImportPanel;
