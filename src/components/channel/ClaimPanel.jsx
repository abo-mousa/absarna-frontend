import { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import { isGoogleConsentUrl, rememberOAuthReturn } from '@/lib/youtubeOAuth';
import { useStartClaimToken, useCheckClaimToken, useStartClaimOAuth } from '@/hooks/useChannelClaim';
import { t } from '@/i18n';

/**
 * Where a scholar proves that a channel the platform built for them is theirs.
 *
 * <p><b>Two proofs, and the Google one is offered first on purpose.</b> Signing in with the
 * account that owns the channel is one screen and cannot be got wrong; the description token asks
 * someone to leave, edit another website, come back and press a button. The token is not legacy
 * though — it is the only route open when Google sign-in is switched off, and the only one open to
 * someone who manages a channel through YouTube Studio rather than owning its Brand Account.
 *
 * <p><b>Neither proof lets the claimant choose what they are proving.</b> The channel is already
 * bound to a YouTube channel an admin vouched for, and that is what must be proved — which is why
 * this panel shows the linked channel and offers no field to change it.
 */
function ClaimPanel({ slug, status, onClaimed }) {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);
    const startToken = useStartClaimToken(slug);
    const checkToken = useCheckClaimToken(slug);
    const startOAuth = useStartClaimOAuth(slug);

    const token = startToken.data?.token || status?.token;

    /** Fetch Google's consent URL and leave for it. The callback page brings them back. */
    const handleGoogle = async () => {
        let authorizationUrl;
        try {
            ({ authorizationUrl } = await startOAuth.mutateAsync());
        } catch (error) {
            showToast(describeError(error, t('channel.claim.failed')), 'error');
            return;
        }
        // The same guard the import panel applies: a URL from the API becomes a navigation only
        // if it is Google's own consent screen.
        if (!isGoogleConsentUrl(authorizationUrl)) {
            showToast(t('channel.claim.failed'), 'error');
            return;
        }
        rememberOAuthReturn(slug);
        window.location.assign(authorizationUrl);
    };

    const handleStartToken = async () => {
        try {
            await startToken.mutateAsync();
        } catch (error) {
            showToast(describeError(error, t('channel.claim.failed')), 'error');
        }
    };

    /**
     * A check that does not find the token is the ordinary case, not a failure — YouTube's API
     * trails a description save by up to a minute. It gets the informational toast and the button
     * stays where it is.
     */
    const handleCheck = async () => {
        try {
            const result = await checkToken.mutateAsync();
            if (result?.claimed) {
                showToast(t('channel.claim.success'), 'success');
                onClaimed?.();
            } else {
                showToast(t('channel.claim.notYet'), 'info');
            }
        } catch (error) {
            showToast(describeError(error, t('channel.claim.failed')), 'error');
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard access is refused in plenty of ordinary situations (an insecure origin, a
            // permission prompt declined). The token is on screen and selectable, so there is
            // nothing to repair and nothing worth interrupting anyone about.
        }
    };

    return (
        <Card className="p-5 sm:p-6">
            <h2 className="font-serif text-xl m-0 mb-2">{t('channel.claim.title')}</h2>
            <p className="font-reading text-text-secondary text-sm leading-relaxed m-0 mb-4">
                {t('channel.claim.intro')}
            </p>

            {status?.youtubeChannelId && (
                <p className="text-sm text-text-secondary m-0 mb-5 flex items-center gap-2">
                    <Link2 size={18} className="text-text-muted flex-shrink-0" />
                    <span>{t('channel.claim.linkedChannel')}:</span>
                    {/* LTR island: a UC… id reads left-to-right and bidi would otherwise
                        reorder it against the Arabic around it. */}
                    <bdi dir="ltr" className="font-mono text-xs">{status.youtubeChannelId}</bdi>
                </p>
            )}

            {/* Offered only where the deployment has Google sign-in configured — see the hook. */}
            {status?.oauthAvailable && (
                <div className="mb-6">
                    <Button onClick={handleGoogle} disabled={startOAuth.isPending}>
                        {t('channel.claim.withGoogle')}
                    </Button>
                    <p className="font-reading text-text-secondary text-sm mt-2 m-0">
                        {t('channel.claim.withGoogleHint')}
                    </p>
                </div>
            )}

            <div className={status?.oauthAvailable ? 'pt-5 border-t border-border' : ''}>
                <h3 className="text-base font-semibold m-0 mb-3">
                    {/* "or prove via the description" only reads as a second option when there
                        is a first one. With Google sign-in switched off this is the whole flow,
                        and the «أو» would dangle. */}
                    {t(status?.oauthAvailable ? 'channel.claim.withToken' : 'channel.claim.withTokenOnly')}
                </h3>

                {!token ? (
                    <Button variant="outline" onClick={handleStartToken} disabled={startToken.isPending}>
                        {t('channel.claim.getToken')}
                    </Button>
                ) : (
                    <ol className="font-reading text-sm text-text-secondary m-0 ps-5 space-y-3">
                        <li>
                            {t('channel.claim.tokenStep1')}
                            <div className="flex items-center gap-2 mt-2">
                                <code dir="ltr" className="flex-1 min-w-0 px-3 py-2 bg-surface-hover rounded text-xs break-all">
                                    {token}
                                </code>
                                <Button variant="ghost" size="sm" onClick={handleCopy}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>
                        </li>
                        <li>{t('channel.claim.tokenStep2')}</li>
                        <li>
                            {t('channel.claim.tokenStep3')}
                            <div className="mt-2">
                                <Button onClick={handleCheck} disabled={checkToken.isPending}>
                                    {t('channel.claim.check')}
                                </Button>
                            </div>
                        </li>
                    </ol>
                )}
            </div>
        </Card>
    );
}

export default ClaimPanel;
