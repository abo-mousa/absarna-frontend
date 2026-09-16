import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import PageShell from '@/components/layout/PageShell';
import { QueryState, Button } from '@/components/ui';
import { canManageChannel } from '@/lib/user';
import { useChannel } from '@/hooks/useChannels';
import { useChannelYouTube } from '@/hooks/useChannelYouTube';
import ChannelManageNav, { resolveTab } from '@/components/channel/ChannelManageNav';
import ChannelSettingsTab from '@/components/channel/tabs/ChannelSettingsTab';
import VideosTab from '@/components/channel/tabs/VideosTab';
import BooksTab from '@/components/channel/tabs/BooksTab';
import ArticlesTab from '@/components/channel/tabs/ArticlesTab';
import PostsTab from '@/components/channel/tabs/PostsTab';
import SeriesTab from '@/components/channel/tabs/SeriesTab';
import CommentsTab from '@/components/channel/tabs/CommentsTab';
import YouTubeTab from '@/components/channel/tabs/YouTubeTab';
import { t } from '@/i18n';

/** One tab's contents, hidden rather than unmounted while another tab is showing. */
function TabPanel({ active, children }) {
    return <div hidden={!active}>{children}</div>;
}

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

/**
 * The channel owner's dashboard.
 *
 * <p>This file is the frame: who may be here, which tab is showing, and the chrome around it. Each
 * tab owns its own queries, form state and mutations, so adding a content type is one component and
 * one row in `MANAGE_SECTIONS` rather than another four hooks and another copy of the handlers here.
 *
 * <p><b>The open tab lives in the URL (`?tab=videos`)</b>, not in component state. In state, a
 * refresh always dropped the owner back on the first tab and no section could be linked to.
 * Written with `replace`, so switching sections does not fill the history: Back leaves the
 * dashboard, which is where an owner expects it to go.
 */
function ChannelManage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = resolveTab(searchParams.get('tab'));
    const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });

    const {
        data: channel, isLoading: channelLoading, isError: channelError, error: channelFetchError,
    } = useChannel(slug, !authLoading);
    usePageMeta({
        title: channel
            ? t('channelManage.titleFor', { name: channel.name })
            : t('channelManage.title'),
    });

    // Fetched once here and enabled on every tab, unlike the per-tab queries below. The menu's dot
    // shows a running or paused import from whichever section the owner is in, and the YouTube
    // tab's completion toast needs the same live status to fire from there; the videos tab also
    // reads the verification level from it. One GET per visit, polling only while RUNNING.
    const { data: youtubeState } = useChannelYouTube(slug, Boolean(channel));

    useEffect(() => {
        if (!authLoading && !user) navigate('/');
    }, [authLoading, user, navigate]);

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
            {/* The menu against the screen's edge, and only the content centred beside it — see
                ChannelManageNav. First in the row, which in RTL is the right. */}
            <div className="lg:flex lg:items-start">
                <ChannelManageNav
                    channel={channel}
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                    youtubeState={youtubeState}
                />

                <div className="flex-1 min-w-0 px-4 sm:px-6 py-6">
                    <div className="max-w-[1000px] mx-auto">
                        {/* Every tab stays MOUNTED and is hidden rather than unmounted, and that is
                            load-bearing rather than tidy. A half-finished upload lives in its tab — the
                            transfer itself, its progress, and the session id the publish form is holding —
                            so unmounting on a tab switch would abort a 2 GB lecture and lose the form that
                            was about to publish it. Each tab is told whether it is on screen and gates its
                            own queries on that, so a tab nobody has opened still costs a disabled query
                            rather than a request. */}
                        <TabPanel active={activeTab === 'videos'}>
                            <VideosTab
                                slug={slug}
                                channel={channel}
                                youtubeState={youtubeState}
                                active={activeTab === 'videos'}
                            />
                        </TabPanel>
                        <TabPanel active={activeTab === 'books'}>
                            <BooksTab slug={slug} active={activeTab === 'books'} />
                        </TabPanel>
                        <TabPanel active={activeTab === 'articles'}>
                            <ArticlesTab slug={slug} active={activeTab === 'articles'} />
                        </TabPanel>
                        <TabPanel active={activeTab === 'posts'}>
                            <PostsTab slug={slug} active={activeTab === 'posts'} />
                        </TabPanel>
                        <TabPanel active={activeTab === 'series'}>
                            <SeriesTab slug={slug} active={activeTab === 'series'} />
                        </TabPanel>
                        <TabPanel active={activeTab === 'comments'}>
                            <CommentsTab slug={slug} active={activeTab === 'comments'} />
                        </TabPanel>
                        <TabPanel active={activeTab === 'youtube'}>
                            <YouTubeTab
                                slug={slug}
                                youtubeState={youtubeState}
                                active={activeTab === 'youtube'}
                            />
                        </TabPanel>
                        <TabPanel active={activeTab === 'settings'}>
                            <ChannelSettingsTab slug={slug} channel={channel} />
                        </TabPanel>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

export default ChannelManage;
