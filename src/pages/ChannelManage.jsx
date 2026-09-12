import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, BookOpen, FileText, MessageSquare, Settings, ArrowRight, Tv } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import PageShell from '@/components/layout/PageShell';
import { QueryState, Button } from '@/components/ui';
import { canManageChannel } from '@/lib/user';
import { useChannel } from '@/hooks/useChannels';
import { useChannelYouTube } from '@/hooks/useChannelYouTube';
import ChannelSettingsTab from '@/components/channel/tabs/ChannelSettingsTab';
import VideosTab from '@/components/channel/tabs/VideosTab';
import BooksTab from '@/components/channel/tabs/BooksTab';
import ArticlesTab from '@/components/channel/tabs/ArticlesTab';
import PostsTab from '@/components/channel/tabs/PostsTab';
import SeriesTab from '@/components/channel/tabs/SeriesTab';
import CommentsTab from '@/components/channel/tabs/CommentsTab';
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
 * one row in `TABS` rather than another four hooks and another copy of the handlers here.
 */
function ChannelManage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const {
        data: channel, isLoading: channelLoading, isError: channelError, error: channelFetchError,
    } = useChannel(slug, !authLoading);
    usePageMeta({
        title: channel
            ? t('channelManage.titleFor', { name: channel.name })
            : t('channelManage.title'),
    });

    // Wanted by two tabs — the settings tab watches the import finish, the videos tab needs the
    // verification level to decide whether a row may claim its original file — so it is fetched
    // once here rather than by each.
    const { data: youtubeState } = useChannelYouTube(
        slug, activeTab === 'overview' || activeTab === 'videos',
    );

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

                {/* Every tab stays MOUNTED and is hidden rather than unmounted, and that is
                    load-bearing rather than tidy. A half-finished upload lives in its tab — the
                    transfer itself, its progress, and the session id the publish form is holding —
                    so unmounting on a tab switch would abort a 2 GB lecture and lose the form that
                    was about to publish it. Each tab is told whether it is on screen and gates its
                    own queries on that, so a tab nobody has opened still costs a disabled query
                    rather than a request. */}
                <TabPanel active={activeTab === 'overview'}>
                    <ChannelSettingsTab
                        slug={slug}
                        channel={channel}
                        youtubeState={youtubeState}
                        active={activeTab === 'overview'}
                    />
                </TabPanel>
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
            </div>
        </PageShell>
    );
}

export default ChannelManage;
