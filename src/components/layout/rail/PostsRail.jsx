import { useAuth } from '../../../contexts/AuthContext';
import { useSubscriptionsPage, useSuggestedChannels } from '../../../hooks/useChannels';
import { RailFrame, RailSection, RailChannel } from './RailFrame';
import { t } from '@/i18n';

/**
 * The Posts tab's column. First, the channels this reader follows as a FILTER: pressing one shows
 * only its posts (the one narrowing a stream of short posts was missing), pressing it again lets go.
 * Then channels that post, on the reader's interests first (`kind=POSTS`), as links.
 */
function PostsRail({ selected = null, onSelect }) {
    const { token } = useAuth();
    const followed = useSubscriptionsPage(!!token, 10);
    const subscriptions = followed.data?.pages.flatMap((page) => page.content) ?? [];
    const posters = useSuggestedChannels(8, 'POSTS');
    const channels = posters.data?.pages.flatMap((page) => page.content) ?? [];

    if (subscriptions.length === 0 && channels.length === 0) return null;

    return (
        <RailFrame label={t('rail.postsLabel')}>
            {subscriptions.length > 0 && (
                <RailSection title={t('rail.fromFollowed')} pages={followed}>
                    {subscriptions.map((sub) => (
                        <RailChannel
                            key={sub.subscriptionId}
                            slug={sub.channelSlug}
                            name={sub.channelName}
                            logoUrl={sub.channelLogoUrl}
                            selected={selected?.id === sub.channelId}
                            onSelect={() => onSelect(selected?.id === sub.channelId ? null : { id: sub.channelId, name: sub.channelName })}
                        />
                    ))}
                </RailSection>
            )}
            {channels.length > 0 && (
                <RailSection title={t('rail.posters')} pages={posters}>
                    {channels.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} kind={channel.defaultFormat} />
                    ))}
                </RailSection>
            )}
        </RailFrame>
    );
}

export default PostsRail;
