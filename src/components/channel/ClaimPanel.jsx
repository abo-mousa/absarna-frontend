import { Link2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { describeError } from '@/lib/describeError';
import { isGoogleConsentUrl, rememberOAuthReturn } from '@/lib/youtubeOAuth';
import { useStartClaimOAuth } from '@/hooks/useChannelClaim';
import { t } from '@/i18n';

/**
 * Where a scholar proves that a channel the platform built for them is theirs.
 *
 * <p><b>One proof, and it is Google sign-in.</b> A description-token method stood beside it until
 * Google reviewed this app's sensitive `youtube.readonly` scope — the review is what the fallback
 * was waiting for, so it went when the review landed. Signing in with the account that owns the
 * channel is one screen and cannot be got wrong, where the token asked someone to leave, edit
 * another website, come back and press a button.
 *
 * <p><b>The proof does not let the claimant choose what they are proving.</b> The channel is
 * already bound to a YouTube channel an admin vouched for, and that is what must be proved — which
 * is why this panel shows the linked channel and offers no field to change it. Signing in as a
 * different channel is refused rather than silently relinking.
 *
 * <p><b>A deployment with no OAuth client cannot take claims at all</b>, and says so. There is
 * nothing behind the button any more, so rendering it without `oauthAvailable` would offer a route
 * that fails on the first press.
 */
function ClaimPanel({ slug, status, claimToken }) {
    const { showToast } = useToast();
    const startOAuth = useStartClaimOAuth(slug, claimToken);

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

            {status?.oauthAvailable ? (
                <>
                    <Button onClick={handleGoogle} disabled={startOAuth.isPending}>
                        {t('channel.claim.withGoogle')}
                    </Button>
                    <p className="font-reading text-text-secondary text-sm mt-2 m-0">
                        {t('channel.claim.withGoogleHint')}
                    </p>
                </>
            ) : (
                /* Not an error state and not the claimant's problem to solve — the deployment has
                   no Google client configured. Saying so is better than an empty panel, which
                   reads as a page that failed to load. */
                <p className="font-reading text-text-secondary text-sm m-0">
                    {t('channel.claim.unavailable')}
                </p>
            )}
        </Card>
    );
}

export default ClaimPanel;
