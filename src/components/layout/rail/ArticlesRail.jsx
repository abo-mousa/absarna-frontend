import { useSuggestedChannels } from '../../../hooks/useChannels';
import { RailFrame, RailSection, RailChannel, RailItem } from './RailFrame';
import { t } from '@/i18n';

/**
 * The Articles tab's column: the page's topics as a one-click way to narrow it (a second press
 * lets go), and the channels that write — on the reader's interests first (`kind=ARTICLES`).
 */
function ArticlesRail({ categories = [], category = '', onCategory }) {
    const writers = useSuggestedChannels(8, 'ARTICLES');
    const channels = writers.data?.pages.flatMap((page) => page.content) ?? [];

    if (categories.length === 0 && channels.length === 0) return null;

    return (
        <RailFrame label={t('rail.articlesLabel')}>
            {categories.length > 0 && (
                <RailSection title={t('rail.topics')}>
                    {categories.map((name) => (
                        <RailItem key={name} label={name} selected={category === name} onClick={() => onCategory(category === name ? '' : name)} />
                    ))}
                </RailSection>
            )}
            {channels.length > 0 && (
                <RailSection title={t('rail.writers')} pages={writers}>
                    {channels.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} kind={channel.defaultFormat} />
                    ))}
                </RailSection>
            )}
        </RailFrame>
    );
}

export default ArticlesRail;
