import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { Button, Spinner } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { useCompleteYouTubeOAuth } from '@/hooks/useChannelYouTube';
import { describeError } from '@/lib/describeError';
import {
    forgetOAuthReturn,
    manageYouTubePath,
    oauthReturnSlug,
    readOAuthCallback,
} from '@/lib/youtubeOAuth';
import { t } from '@/i18n';

/**
 * Where Google sends the owner back after "verify with Google".
 *
 * <p>A page of its own rather than a query parameter on the manage page, because the redirect URI
 * is registered on the Google client character for character and must not carry a slug. On success
 * it forwards straight to the channel's YouTube tab; it only renders anything of its own when the
 * sign-in did not work, and then it always offers the way back — where the description token still
 * works whatever went wrong here.
 */
function YouTubeOAuthCallback() {
    usePageMeta({ title: t('youtubeOAuth.title') });
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { mutateAsync: complete } = useCompleteYouTubeOAuth();
    const [failure, setFailure] = useState(null);
    // Read once: the storage entry is cleared below, and the back link must survive that.
    const [returnSlug] = useState(oauthReturnSlug);
    const ranOnce = useRef(false);

    useEffect(() => {
        // The code is single-use, so a second effect run (StrictMode) would redeem it twice and
        // show a failure after a success.
        if (ranOnce.current) return;
        ranOnce.current = true;

        const outcome = readOAuthCallback(searchParams);
        // Off the URL at once: a one-time code has no business in browser history or in the page
        // URL that RUM telemetry records.
        navigate(location.pathname, { replace: true });

        if (outcome.kind !== 'complete') {
            forgetOAuthReturn();
            setFailure(outcome.kind === 'denied' ? t('youtubeOAuth.denied') : t('youtubeOAuth.invalidLink'));
            return;
        }

        complete({ code: outcome.code, state: outcome.state })
            .then((data) => {
                forgetOAuthReturn();
                showToast(t('youtubeOAuth.success'), 'success');
                navigate(manageYouTubePath(data.slug), { replace: true });
            })
            .catch((error) => {
                forgetOAuthReturn();
                setFailure(describeError(error));
            });
    }, [searchParams, location.pathname, navigate, complete, showToast]);

    return (
        <PageShell sidebar={false}>
            <div className="max-w-[440px] mx-auto my-10 sm:my-16 p-6 sm:p-8 bg-surface rounded-lg shadow-md border border-border-light text-center">
                {!failure && (
                    <>
                        <Spinner />
                        <p className="text-text-secondary mt-4">{t('youtubeOAuth.verifying')}</p>
                    </>
                )}

                {failure && (
                    <>
                        <XCircle className="mx-auto text-red-600 dark:text-red-400" size={48} />
                        <h2 className="text-xl font-bold mt-4">{t('youtubeOAuth.failedHeading')}</h2>
                        <p className="text-text-muted mt-2" dir="auto">{failure}</p>
                        <p className="text-sm text-text-muted mt-2">{t('youtubeOAuth.tokenStillWorks')}</p>
                        {/* The CHANNEL page, not the manage page. This branch is also where a
                            failed claim lands — someone proving a seeded channel is theirs who
                            signed in with the wrong Google account — and they do not own the
                            channel, so the dashboard would bounce them. The channel page is
                            reachable for both, and carries the owner's way on to manage. */}
                        <Link to={returnSlug ? `/channel/${encodeURIComponent(returnSlug)}` : '/'} className="block mt-6">
                            <Button fullWidth>
                                {returnSlug ? t('youtubeOAuth.backToChannel') : t('common.backHome')}
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </PageShell>
    );
}

export default YouTubeOAuthCallback;
