import { useAuth } from '../../contexts/AuthContext';
import { useMyChannels, useSubscriptionsPage, useSuggestedChannels } from '../../hooks/useChannels';
import { RailFrame, RailSection, RailChannel } from './rail';
import { t } from '@/i18n';

/** A page of each list; «تحميل المزيد» fetches the next. */
const FOLLOWED_PAGE = 10;
const SUGGESTED_PAGE = 8;

/**
 * Discover's channel column: the reader's own channels, the ones they follow, and channels
 * suggested to them — on their interests first, then the largest (the backend's ranking, the same
 * one Today's welcome uses; `kind=VIDEOS`). The frame and rows are the tabs' shared ones
 * (`layout/rail`).
 *
 * <p><b>By the product owner's decision (2026-09-25)</b> a column came back on the browsing tabs
 * only — Discover, Books, Articles, Posts — never on Today, a page that ends, and never as a drawer:
 * below `lg` the Channels tab is this list.
 */
function ChannelRail() {
    const { token } = useAuth();
    const { data: myChannels = [] } = useMyChannels(!!token);
    const followed = useSubscriptionsPage(!!token, FOLLOWED_PAGE);
    const suggestions = useSuggestedChannels(SUGGESTED_PAGE, 'VIDEOS');
    const subscriptions = followed.data?.pages.flatMap((page) => page.content) ?? [];
    const suggested = suggestions.data?.pages.flatMap((page) => page.content) ?? [];

    if (myChannels.length === 0 && subscriptions.length === 0 && suggested.length === 0) return null;

    return (
        <RailFrame label={t('channelRail.label')}>
            {myChannels.length > 0 && (
                <RailSection title={t('channelRail.mine')}>
                    {myChannels.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} manage />
                    ))}
                </RailSection>
            )}
            {subscriptions.length > 0 && (
                <RailSection
                    title={t('channelRail.following')}
                    more={{ to: '/subscriptions', label: t('channelRail.manageFollowing') }}
                    pages={followed}
                >
                    {subscriptions.map((sub) => (
                        <RailChannel key={sub.subscriptionId} slug={sub.channelSlug} name={sub.channelName} logoUrl={sub.channelLogoUrl} />
                    ))}
                </RailSection>
            )}
            {suggested.length > 0 && (
                // No «كل القنوات» link here: the Channels tab in the navbar is that page, one
                // glance away, and the column should not restate the navigation above it.
                <RailSection title={t('channelRail.suggested')} pages={suggestions}>
                    {suggested.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} kind={channel.defaultFormat} />
                    ))}
                </RailSection>
            )}
        </RailFrame>
    );
}

export default ChannelRail;
