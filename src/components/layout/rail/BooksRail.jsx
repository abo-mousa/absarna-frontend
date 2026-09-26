import { useSuggestedChannels } from '../../../hooks/useChannels';
import { RailFrame, RailSection, RailChannel, RailItem } from './RailFrame';
import { t } from '@/i18n';

/**
 * The Books tab's column: the channels that publish books — on the reader's interests first,
 * the backend's ranking (`kind=BOOKS`) — and an index of the page's shelves, so a click goes to a
 * shelf instead of scrolling a long page to find it.
 */
function BooksRail({ shelves = [] }) {
    const publishers = useSuggestedChannels(8, 'BOOKS');
    const channels = publishers.data?.pages.flatMap((page) => page.content) ?? [];
    const jump = (index) => document.getElementById(`shelf-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // An empty frame is a panel of ornament around nothing: no column until there is something.
    if (shelves.length < 2 && channels.length === 0) return null;

    return (
        <RailFrame label={t('rail.booksLabel')}>
            {shelves.length > 1 && (
                <RailSection title={t('rail.shelves')}>
                    {shelves.map((shelf, index) => (
                        <RailItem key={shelf.category} label={shelf.category} onClick={() => jump(index)} />
                    ))}
                </RailSection>
            )}
            {channels.length > 0 && (
                <RailSection title={t('rail.bookPublishers')} pages={publishers}>
                    {channels.map((channel) => (
                        <RailChannel key={channel.id} slug={channel.slug} name={channel.name} logoUrl={channel.logoUrl} kind={channel.defaultFormat} />
                    ))}
                </RailSection>
            )}
        </RailFrame>
    );
}

export default BooksRail;
