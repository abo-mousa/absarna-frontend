import { isGoogleHostedImage } from '@/lib/consent';
import { useConsent } from '../contexts/ConsentContext';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Video, BookOpen, FileText, MessageSquare, Settings, Tv, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../components/layout/PageShell';
import { QueryState, Avatar, SearchField, KhatamStar } from '../components/ui';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { VideoCard, BookCard, ArticleCard, PostCard, SubscribeButton } from '../components/content';
import { useWatchProgressMap, useReadingProgressMap } from '../hooks/useVideos';
import { usePageMeta } from '../hooks/usePageMeta';
import { resolveMediaUrl } from '@/lib/media';
import { channelTabPath, resolveChannelTab } from '@/lib/navigation';
import {
    useChannel,
    useChannelVideos,
    useChannelBooks,
    useChannelArticles,
    useChannelPosts,
    useSubscriptionStatus,
} from '../hooks/useChannels';
import { useChannelSeries } from '../hooks/useSeries';
import { useChannelClaim } from '../hooks/useChannelClaim';
import { ClaimPanel } from '@/components/channel';
import {
    shouldShowClaimNotice, shouldOfferClaim,
    rememberClaimInvite, claimInviteFor,
} from '@/lib/claim';
import { t } from '@/i18n';

function ChannelPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    // In the URL, not in state — see resolveChannelTab. `replace`, as on the dashboard: switching
    // tabs does not fill the history, so Back still leaves the channel.
    const [searchParams] = useSearchParams();
    const activeTab = resolveChannelTab(searchParams.get('tab'));
    const setActiveTab = (tab) => navigate(channelTabPath(slug, tab), { replace: true });
    const [bannerFailed, setBannerFailed] = useState(false);
    // A Google-hosted cover waits for consent like every other request to Google (see Avatar).
    const { youtubeAllowed } = useConsent();
    const watchProgress = useWatchProgressMap(!!token);
    const readingProgress = useReadingProgressMap(!!token);

    const { data: channel, isLoading: channelLoading, isError: channelError, error: channelErrorObject, refetch: refetchChannel } = useChannel(slug);

    // Debounced so typing costs one request per pause, not one per keystroke — the same
    // treatment the global search box gets. Not in the URL: a channel filter is a transient
    // narrowing of one tab, and putting it in the query string would make Back walk keystrokes.
    const [videoSearch, setVideoSearch] = useState('');
    const videoSearchTerm = useDebouncedValue(videoSearch.trim(), 250);
    const {
        data: videoPages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChannelVideos(slug, 24, !!channel, videoSearchTerm);
    const videos = videoPages?.pages.flatMap((page) => page.content) || [];
    // The tab badge must keep counting the WHOLE channel, so it is frozen while a filter is
    // active: a search's totalItems is the number of matches, and letting it through would make
    // the tab read "فيديوهات 2" — as if the channel had lost the rest.
    const videoTotal = videoPages?.pages[0]?.totalItems ?? videos.length;
    const [unfilteredVideoCount, setUnfilteredVideoCount] = useState(null);
    useEffect(() => {
        if (!videoSearchTerm && videoPages) setUnfilteredVideoCount(videoTotal);
    }, [videoSearchTerm, videoPages, videoTotal]);
    const videoCount = videoSearchTerm ? (unfilteredVideoCount ?? videoTotal) : videoTotal;

    const {
        data: bookPages,
        fetchNextPage: fetchNextBooksPage,
        hasNextPage: hasNextBooksPage,
        isFetchingNextPage: isFetchingNextBooksPage,
    } = useChannelBooks(slug, 24, !!channel);
    const books = bookPages?.pages.flatMap((page) => page.content) || [];
    const bookCount = bookPages?.pages[0]?.totalItems ?? books.length;

    const {
        data: articlePages,
        fetchNextPage: fetchNextArticlesPage,
        hasNextPage: hasNextArticlesPage,
        isFetchingNextPage: isFetchingNextArticlesPage,
    } = useChannelArticles(slug, 24, !!channel);
    const articles = articlePages?.pages.flatMap((page) => page.content) || [];
    const articleCount = articlePages?.pages[0]?.totalItems ?? articles.length;

    const {
        data: postPages,
        fetchNextPage: fetchNextPostsPage,
        hasNextPage: hasNextPostsPage,
        isFetchingNextPage: isFetchingNextPostsPage,
    } = useChannelPosts(slug, 24, !!channel);
    const posts = postPages?.pages.flatMap((page) => page.content) || [];
    const postCount = postPages?.pages[0]?.totalItems ?? posts.length;
    // Still read here for the subscriber count in the header; the toggle itself moved into
    // SubscribeButton, which runs this same cached query.
    // For everyone, signed in or not: the backend answers a signed-out caller with the count and
    // `subscribed: false`, and the count is what a visitor sizing up a channel reads first.
    const { data: subscriptionStatus } = useSubscriptionStatus(channel?.id, !!channel);
    const {
        data: seriesPages,
        fetchNextPage: fetchNextSeriesPage,
        hasNextPage: hasNextSeriesPage,
        isFetchingNextPage: isFetchingNextSeriesPage,
    } = useChannelSeries(slug, !!channel);
    const series = seriesPages?.pages.flatMap((page) => page.content) || [];
    const seriesCount = seriesPages?.pages[0]?.totalItems ?? series.length;

    const subscriberCount = subscriptionStatus?.subscriberCount || 0;

    usePageMeta({
        title: channel?.name,
        description: channel?.description?.slice(0, 200),
        image: resolveMediaUrl(channel?.bannerUrl || channel?.logoUrl),
    });

    // canManageChannel, not isChannelOwner — the same rule the backend's own
    // canManageChannel(userId, id, isAdmin) has always applied, and the same one ChannelManage
    // gates itself on. A platform admin could already open that page; nothing offered them the
    // link, so managing a channel they do not own meant building the URL from the slug by hand.
    const canManage = !!channel?.viewerCanManage;

    /**
     * Whether this channel is still waiting for the scholar it was built for.
     *
     * <p><b>Asked for every viewer, signed in or not.</b> The person this banner is written for
     * arrives from an email we sent and has no account yet — gating the question on a login would
     * hide the offer from exactly the one reader it exists for, and they would leave seeing a page
     * about themselves with nothing on it that spoke to them.
     */
    /**
     * The invitation token, when this visit came from the email we sent.
     *
     * <p>Kept in the URL rather than stripped after reading, unlike the OAuth callback's code:
     * that one is single-use and a refresh with it would fail, while this is reusable and a
     * refresh without it would silently take the offer away.
     */
    const claimFromUrl = searchParams.get('claim');
    // Remembered on arrival, so the offer survives the trip through login and registration that
    // the invited reader necessarily makes — see lib/claim.js.
    useEffect(() => {
        rememberClaimInvite(slug, claimFromUrl);
    }, [slug, claimFromUrl]);
    const claimToken = claimInviteFor(slug, claimFromUrl);
    const { data: claim } = useChannelClaim(slug, claimToken);
    const [claimOpen, setClaimOpen] = useState(false);
    // The notice is public; the offer is not. See lib/claim.js.
    const showNotice = shouldShowClaimNotice(claim, user, channel);
    const showClaim = shouldOfferClaim(claim, user, channel);

    /**
     * Where to send the claimant back to after signing in — WITH the invitation on it.
     *
     * <p>`channelTabPath` builds a clean path, so using it here dropped the `?claim=` token and
     * the offer vanished on return: they signed in because they were invited, and arrived to a
     * page that no longer said so. The token is what makes the offer visible, so it has to
     * survive the round trip exactly as the tab does.
     */
    const claimReturnPath = claimToken
        ? `/channel/${encodeURIComponent(slug)}?claim=${encodeURIComponent(claimToken)}`
        : channelTabPath(slug, activeTab);

    const tabs = [
        { id: 'videos', label: t('common.videos'), icon: Video, count: videoCount },
        { id: 'books', label: t('common.books'), icon: BookOpen, count: bookCount },
        { id: 'articles', label: t('common.articles'), icon: FileText, count: articleCount },
        { id: 'posts', label: t('common.posts'), icon: MessageSquare, count: postCount },
        { id: 'series', label: t('common.series'), icon: Tv, count: seriesCount },
    ];

    if (channelLoading || !channel) {
        return (
            <PageShell>
                {/* A failed request used to land in the empty branch — "this channel does not
                    exist" for what may be a dropped connection. isError separates the two. */}
                <QueryState
                    isLoading={channelLoading}
                    isError={channelError}
                    error={channelErrorObject}
                    onRetry={refetchChannel}
                    errorTitle={t('channel.loadFailed')}
                    isEmpty={!channelLoading && !channelError}
                    emptyTitle={t('channel.notFound')}
                />
            </PageShell>
        );
    }

    return (
        <PageShell contentClassName="p-4 sm:p-6">
            {/* The cover on its own, and the channel's identity BELOW it rather than on a coloured
                band fused to it. They used to share one box — the cover, then a primaryColor panel
                carrying the photo, name and subscriber count — which read as text laid over the
                cover, and a strong colour under someone's own banner fought with it. Now the cover
                is only a picture, and the identity row sits on the page like the rest of it.

                Owner-supplied or copied from YouTube; on failure the cover is dropped and the page
                simply starts at the identity row, which is what a channel with no cover looks like. */}
            {channel.bannerUrl && !bannerFailed && !(isGoogleHostedImage(channel.bannerUrl) && !youtubeAllowed) && (
                <div className="rounded-lg overflow-hidden mb-4 aspect-[16/5] max-h-[260px] w-full bg-surface-hover">
                    <img
                        src={resolveMediaUrl(channel.bannerUrl)}
                        alt=""
                        onError={() => setBannerFailed(true)}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="flex items-center gap-4 flex-wrap mb-5">
                <Avatar
                    src={resolveMediaUrl(channel.logoUrl)}
                    name={channel.name}
                    size="lg"
                    className="sm:!w-20 sm:!h-20"
                />

                <div className="flex-1 min-w-[150px]">
                    <h1 className="m-0 text-xl sm:text-2xl font-bold text-text-primary">{channel.name}</h1>
                    {/* Subscribers and videos, for everyone. The video count is the channel's whole
                        public catalogue — the same frozen total the Videos tab badge shows, so a
                        search on the page does not make it shrink. Each waits for its own answer
                        rather than printing a zero it has not been told. */}
                    <p className="text-text-muted text-sm mt-1 flex flex-wrap items-center gap-x-2">
                        {subscriptionStatus && <span>{t('channel.subscriberCount', { count: subscriberCount })}</span>}
                        {subscriptionStatus && videoPages && <span aria-hidden="true">·</span>}
                        {videoPages && <span>{t('common.videoCount', { count: videoCount })}</span>}
                    </p>
                    {channel.description && (
                        <p className="text-text-secondary text-sm mt-2 max-w-[600px]">{channel.description}</p>
                    )}
                </div>

                {canManage && (
                    <Link
                        to={`/channel/${slug}/manage`}
                        className="flex items-center gap-1.5 px-4 py-2.5 border border-border text-text-secondary rounded-full font-semibold text-sm hover:bg-surface-hover"
                    >
                        <Settings size={18} /> {t('channel.manage')}
                    </Link>
                )}

                <SubscribeButton channelId={channel.id} />
            </div>

            {/* WHAT THIS CHANNEL KEEPS HERE, stated exactly. An upload is a file this platform
                holds and it stays whatever another platform does; a YouTube import is YouTube's
                player and goes when YouTube removes it. The promise is made about the first
                number only, and the second is said beside it so the promise is not overheard as
                covering both. */}
            {channel.hostedVideoCount > 0 && (
                <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-gold-light border border-border-light">
                    <KhatamStar className="w-6 h-6 flex-shrink-0 text-gold mt-0.5" />
                    <div className="text-sm">
                        <p className="font-serif text-[1.3rem] font-semibold leading-tight">{t('voice.keptTitle')}</p>
                        <p className="text-text-secondary mt-1">{t('voice.keptHosted', { count: channel.hostedVideoCount })}</p>
                        {channel.embeddedVideoCount > 0 && (
                            <p className="text-text-muted">{t('voice.keptEmbedded', { count: channel.embeddedVideoCount })}</p>
                        )}
                    </div>
                </div>
            )}

            {/* TWO AUDIENCES, ONE BANNER, AND THEY GET DIFFERENT WEIGHTS.
                The channel URL is the invitation we email, so this renders to every visitor, not
                only the scholar it concerns. The NOTICE is therefore third-person and is the
                thing worth telling all of them — this page was assembled by us and its subject
                has not endorsed it. The INVITATION underneath asks rather than assumes, and is
                deliberately quieter than Subscribe: a stranger should be able to read it, answer
                "no" and carry on, without a full-weight call to action addressed to somebody
                they are not. */}
            {showNotice && (
                <div className="mb-5 rounded-lg border border-border bg-surface-hover/50 p-4 sm:p-5">
                    <h2 className="font-serif text-base m-0 mb-1.5">{t('channel.claim.banner')}</h2>
                    <p className="font-reading text-sm text-text-secondary leading-relaxed m-0">
                        {t('channel.claim.bannerBody')}
                    </p>
                    {/* The person the link was for, arriving after it lapsed (backend
                        INVITATION_VALID). Only the token's holder is told; saying nothing read as a
                        broken link. The contact link beside it is how they ask for a fresh one. */}
                    {claim?.invitationExpired && (
                        <p className="text-sm text-gold-ink font-semibold mt-3 mb-0">{t('channel.claim.expired')}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                        {showClaim && (token ? (
                            <button
                                type="button"
                                onClick={() => setClaimOpen((open) => !open)}
                                className="text-sm font-semibold text-primary underline underline-offset-4"
                            >
                                {t('channel.claim.cta')}
                            </button>
                        ) : (
                            /* A control that said "claim" and opened a login form would have lied
                               about what the press does, so the signed-out face says so itself.
                               `state.from` is what Login reads, and it brings them back to this
                               channel rather than to the home page — the one thing that makes a
                               sign-up worth finishing for someone who came here for one page. */
                            <Link
                                to="/login"
                                state={{ from: claimReturnPath }}
                                className="text-sm font-semibold text-primary underline underline-offset-4"
                            >
                                {t('channel.claim.ctaSignedOut')}
                            </Link>
                        ))}
                        {claim?.invitationExpired && (
                            <Link to="/contact" className="text-sm font-semibold text-primary underline underline-offset-4">
                                {t('channel.claim.expiredCta')}
                            </Link>
                        )}
                        <Link to="/contact" className="text-sm text-text-muted underline underline-offset-4">
                            {t('channel.claim.removeInstead')}
                        </Link>
                    </div>

                    {claimOpen && token && (
                        <div className="mt-5">
                            {/* No `onClaimed`: the claim finishes on Google's side now, so this
                                page is left rather than updated. The callback clears the spent
                                invitation and lands the new owner on their manage page. */}
                            <ClaimPanel slug={slug} status={claim} claimToken={claimToken} />
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === tab.id
                                ? 'bg-primary text-white border-2 border-primary'
                                : 'bg-surface text-text-secondary border border-border'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface-hover'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === 'videos' && (
                <>
                    {/* Shown whenever the channel has videos to filter, and kept mounted while a
                        search matches nothing — otherwise the box that produced the empty state
                        would disappear along with the results, leaving no way back. */}
                    {(videos.length > 0 || videoSearch) && (
                        <div className="mb-4 max-w-md">
                            <SearchField
                                value={videoSearch}
                                onChange={setVideoSearch}
                                placeholder={t('channel.searchVideos')}
                            />
                        </div>
                    )}
                <QueryState
                    isEmpty={videos.length === 0}
                    emptyTitle={videoSearchTerm ? t('channel.noVideosMatch') : t('channel.noVideos')}
                >
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                        {videos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                onClick={() => navigate(`/video/${video.id}`)}
                                watch={watchProgress[video.id]}
                                showChannel={false}
                            />
                        ))}
                    </div>

                    {hasNextPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={fetchNextPage}
                                disabled={isFetchingNextPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
                </>
            )}

            {activeTab === 'books' && (
                <QueryState isEmpty={books.length === 0} emptyTitle={t('books.emptyOnChannel')}>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8">
                        {books.map((book) => (
                            <BookCard key={book.id} book={book} progress={readingProgress[book.id]} />
                        ))}
                    </div>

                    {hasNextBooksPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextBooksPage()}
                                disabled={isFetchingNextBooksPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextBooksPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'articles' && (
                <QueryState isEmpty={articles.length === 0} emptyTitle={t('articles.emptyOnChannel')}>
                    <div className="grid gap-3">
                        {articles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>

                    {hasNextArticlesPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextArticlesPage()}
                                disabled={isFetchingNextArticlesPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextArticlesPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'posts' && (
                <QueryState isEmpty={posts.length === 0} emptyTitle={t('channel.noPosts')}>
                    <div className="grid gap-3">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>

                    {hasNextPostsPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={() => fetchNextPostsPage()}
                                disabled={isFetchingNextPostsPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextPostsPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}

            {activeTab === 'series' && (
                <QueryState isEmpty={series.length === 0} emptyTitle={t('series.emptyOnChannel')}>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8">
                        {series.map((s) => (
                            // `publiclyListed === false` reaches only the channel's owner: a series
                            // no visitor can see, marked the way a hidden video card is — dashed
                            // border and a badge — so it reads as hidden rather than as missing.
                            <Link
                                key={s.id}
                                to={`/series/${s.id}`}
                                className={`block bg-surface rounded-lg p-5 border shadow-sm hover:shadow-md transition-shadow ${
                                    s.publiclyListed === false ? 'border-dashed border-border' : 'border-border-light'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="flex items-center gap-2 text-primary font-semibold text-xs">
                                        <Tv size={14} /> {t('series.badge')}
                                    </span>
                                    {s.publiclyListed === false && (
                                        <span className="flex items-center gap-1 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded">
                                            <EyeOff size={12} /> {t('series.hiddenBadge')}
                                        </span>
                                    )}
                                </div>
                                <h3 dir="auto" className="text-base font-semibold mb-2 leading-snug line-clamp-2">{s.title}</h3>
                                {s.description && (
                                    <p dir="auto" className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-2">{s.description}</p>
                                )}
                                <span className="text-xs text-text-muted">{t('common.videoCount', { count: s.contentCount ?? 0 })}</span>
                            </Link>
                        ))}
                    </div>

                    {hasNextSeriesPage && (
                        <div className="text-center mt-6">
                            <button
                                onClick={fetchNextSeriesPage}
                                disabled={isFetchingNextSeriesPage}
                                className="px-8 py-2.5 bg-primary text-white rounded-md font-semibold disabled:opacity-60"
                            >
                                {isFetchingNextSeriesPage ? t('common.loading') : t('common.loadMore')}
                            </button>
                        </div>
                    )}
                </QueryState>
            )}
        </PageShell>
    );
}

export default ChannelPage;
