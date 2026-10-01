import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, KhatamStar, QueryState, SearchField } from '@/components/ui';
import { ArrowBack, ChevronForward } from '@/components/ui/DirectionalIcon';
import { useGoalChannels, useGoalSearch, useGoalSuggestions, useGoalTopics } from '@/hooks/useGoalChoice';
import { useChannel, useChannelBooks } from '@/hooks/useChannels';
import { useChannelSeries } from '@/hooks/useSeries';
import { useGoals } from '@/hooks/useGoals';
import { useToday } from '@/hooks/useToday';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { goalFor } from '@/lib/journey';
import { itemKey, itemMeta } from '@/lib/goalChoice';
import { countOf } from '@/lib/plural';
import { resolveMediaUrl } from '@/lib/media';
import { subjectLabel } from '@/lib/subjects';
import { Poster, Shelf, ShortlistMark } from './parts';
import { t } from '@/i18n';

/**
 * «أتصفّح بنفسي»: the catalogue laid out for choosing — shelves by reason, channels by what they
 * hold (and inside one, its programmes and books), and search. Every card opens the preview; the
 * tab, the field and the open channel live in the URL, so Back leaves a channel before the page.
 */

function FieldChips({ fields, value, onChange }) {
    if (!fields?.length) return null;
    const chip = (code, label) => (
        <button
            key={code || 'all'}
            type="button"
            aria-pressed={(value || '') === (code || '')}
            onClick={() => onChange(code)}
            className={`h-9 px-4 rounded-full border text-sm font-semibold whitespace-nowrap flex-shrink-0 ${
                (value || '') === (code || '') ? 'bg-primary border-primary text-white' : 'bg-surface border-border'
            }`}
        >
            {label}
        </button>
    );
    return (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {chip('', t('journey.choose.allFields'))}
            {fields.map((code) => chip(code, subjectLabel(code)))}
        </div>
    );
}

function Suggestions({ field, setField, onOpen, shortlist, onToggle }) {
    const suggestions = useGoalSuggestions(field);
    const data = suggestions.data;
    return (
        <div className="flex flex-col gap-7">
            <FieldChips fields={data?.fields} value={field} onChange={setField} />
            <QueryState
                isLoading={suggestions.isLoading}
                isError={suggestions.isError}
                error={suggestions.error}
                onRetry={suggestions.refetch}
                errorTitle={t('journey.loadFailed')}
                isEmpty={!data?.shelves?.length}
                emptyTitle={t('journey.choose.emptyShelves')}
            >
                {(data?.shelves || []).map((shelf) => (
                    <Shelf
                        key={shelf.kind}
                        title={t(`journey.choose.shelves.${shelf.kind}`)}
                        items={shelf.items}
                        onOpen={onOpen}
                        shortlist={shortlist}
                        onToggle={onToggle}
                    />
                ))}
            </QueryState>
        </div>
    );
}

function Channels({ field, setField, openChannel, onOpen }) {
    const topics = useGoalTopics();
    const channels = useGoalChannels(field);
    const list = channels.data?.pages.flatMap((page) => page.channels) || [];
    return (
        <div className="flex flex-col gap-5">
            <FieldChips fields={(topics.data?.fields || []).map((f) => f.field)} value={field} onChange={setField} />
            <QueryState
                isLoading={channels.isLoading}
                isError={channels.isError}
                error={channels.error}
                onRetry={channels.refetch}
                errorTitle={t('journey.loadFailed')}
                isEmpty={!list.length}
                emptyTitle={t('journey.choose.emptyShelves')}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {list.map((channel) => (
                        <div key={channel.channelId} className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
                            <button type="button" onClick={() => openChannel(channel.slug)} className="flex items-center gap-3 text-start">
                                <Avatar src={resolveMediaUrl(channel.logoUrl)} name={channel.name} size="md" />
                                <span className="flex-1 min-w-0">
                                    <span dir="auto" className="block font-semibold truncate">{channel.name}</span>
                                    <span className="block text-xs text-text-secondary">
                                        {[channel.field ? subjectLabel(channel.field) : null,
                                            channel.programmes ? countOf('journey.units.PROGRAMMES', channel.programmes) : null,
                                            channel.books ? countOf('journey.units.BOOKS', channel.books) : null,
                                        ].filter(Boolean).join(' · ')}
                                    </span>
                                </span>
                                <ChevronForward size={18} className="text-text-muted" />
                            </button>
                            {channel.items.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {channel.items.map((item) => (
                                        <button key={itemKey(item)} type="button" onClick={() => onOpen(item)} className="text-start">
                                            <Poster item={item} className="aspect-video w-full" />
                                            <span dir="auto" className="mt-1 block text-xs font-semibold line-clamp-2">{item.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {channels.hasNextPage && (
                    <Button variant="ghost" className="self-center" onClick={() => channels.fetchNextPage()} disabled={channels.isFetchingNextPage}>
                        {channels.isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                    </Button>
                )}
            </QueryState>
        </div>
    );
}

/** One row of a channel's programmes or books: tap for the preview, the bookmark for the shortlist. */
function Row({ item, note, onOpen, shortlist, onToggle }) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-border-light">
            <button type="button" onClick={() => onOpen(item)} className="flex items-center gap-3 flex-1 min-w-0 text-start">
                <Poster item={item} className="w-28 aspect-video flex-shrink-0" />
                <span className="flex-1 min-w-0">
                    <span dir="auto" className="block text-sm font-semibold line-clamp-2">{item.title}</span>
                    <span className="block text-xs text-text-secondary">{itemMeta(item)}</span>
                    {note}
                </span>
            </button>
            <ShortlistMark item={item} shortlist={shortlist} onToggle={onToggle} className="shadow-none border border-border-light" />
        </div>
    );
}

function ChannelShelf({ slug, back, onOpen, shortlist, onToggle }) {
    const [tab, setTab] = useState('programmes');
    const channel = useChannel(slug);
    const series = useChannelSeries(slug, tab === 'programmes');
    const books = useChannelBooks(slug, 30, tab === 'books');
    const goals = useGoals();
    const today = useToday();
    const started = new Set((today.data?.continueWatching || []).map((entry) => entry.next?.seriesId).filter(Boolean));
    const info = channel.data;

    const seriesItems = (series.data?.pages.flatMap((page) => page.content) || [])
        .filter((s) => s.publiclyListed !== false)
        .map((s) => ({ kind: 'FINISH_SERIES', targetId: s.id, title: s.title, episodes: s.contentCount, channelName: info?.name, subject: s.subject }));
    const bookItems = (books.data?.pages.flatMap((page) => page.content) || [])
        .map((b) => ({ kind: 'FINISH_BOOK', targetId: b.id, title: b.title, pages: b.pages, book: b, channelName: info?.name }));
    const active = tab === 'programmes' ? series : books;
    const items = tab === 'programmes' ? seriesItems : bookItems;

    const note = (item) => {
        const goal = goalFor(goals.data, item.kind === 'FINISH_SERIES' ? { seriesId: item.targetId } : { bookId: item.targetId });
        if (goal) {
            return (
                <span className="flex items-center gap-1 text-xs font-semibold text-gold-ink">
                    <KhatamStar filled className="w-3 h-3" strokeWidth={10} />{t('journey.inWird')}
                </span>
            );
        }
        if (item.kind === 'FINISH_SERIES' && started.has(item.targetId)) {
            return <span className="text-xs font-semibold text-primary">{t('journey.choose.started')}</span>;
        }
        return null;
    };

    return (
        <div className="flex flex-col gap-4">
            <button type="button" onClick={back} className="self-start flex items-center gap-1 text-sm font-semibold text-primary">
                <ArrowBack size={16} />{t('journey.choose.allChannels')}
            </button>
            {info && (
                <div className="flex items-center gap-3">
                    <Avatar src={resolveMediaUrl(info.logoUrl)} name={info.name} size="lg" />
                    <div className="min-w-0">
                        <h2 dir="auto" className="font-serif text-2xl font-bold truncate">{info.name}</h2>
                        <Link to={`/channel/${info.slug}`} className="text-xs font-semibold">{t('journey.choose.openChannel')}</Link>
                    </div>
                </div>
            )}
            <div className="flex gap-1.5 p-1 rounded-full bg-surface-hover self-start" role="tablist">
                {['programmes', 'books'].map((name) => (
                    <button
                        key={name}
                        type="button"
                        role="tab"
                        aria-selected={tab === name}
                        onClick={() => setTab(name)}
                        className={`h-9 px-5 rounded-full text-sm font-semibold ${tab === name ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary'}`}
                    >
                        {t(`journey.choose.${name}Tab`)}
                    </button>
                ))}
            </div>
            <QueryState
                isLoading={active.isLoading}
                isError={active.isError}
                error={active.error}
                onRetry={active.refetch}
                errorTitle={t('journey.loadFailed')}
                isEmpty={!items.length}
                emptyTitle={t('journey.choose.emptyChannel')}
            >
                <div className="flex flex-col">
                    {items.map((item) => (
                        <Row key={itemKey(item)} item={item} note={note(item)} onOpen={onOpen} shortlist={shortlist} onToggle={onToggle} />
                    ))}
                </div>
                {active.hasNextPage && (
                    <Button variant="ghost" className="self-center" onClick={() => active.fetchNextPage()} disabled={active.isFetchingNextPage}>
                        {active.isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                    </Button>
                )}
            </QueryState>
        </div>
    );
}

function Search({ onOpen, shortlist, onToggle }) {
    const [query, setQuery] = useState('');
    const q = useDebouncedValue(query.trim(), 300);
    const found = useGoalSearch(q);
    const results = found.data || [];
    return (
        <div className="flex flex-col gap-4">
            <SearchField value={query} onChange={setQuery} placeholder={t('journey.choose.searchPlaceholder')} autoFocus />
            {q.length >= 2 && (
                <QueryState
                    isLoading={found.isLoading}
                    isError={found.isError}
                    error={found.error}
                    onRetry={found.refetch}
                    isEmpty={!results.length}
                    emptyTitle={t('journey.choose.noResults')}
                >
                    <div className="flex flex-col">
                        {results.map((item) => (
                            <Row
                                key={itemKey(item)}
                                item={item}
                                note={item.channelName ? <span className="text-xs text-text-muted">{item.channelName}</span> : null}
                                onOpen={onOpen}
                                shortlist={shortlist}
                                onToggle={onToggle}
                            />
                        ))}
                    </div>
                </QueryState>
            )}
        </div>
    );
}

const TABS = ['suggestions', 'channels', 'search'];

function BrowseChoice({ params, go, onOpen, shortlist, onToggle }) {
    const tab = TABS.includes(params.tab) ? params.tab : 'suggestions';
    const setField = (field) => go({ field: field || '' });

    if (params.channel) {
        return (
            <ChannelShelf
                slug={params.channel}
                back={() => go({ channel: '' })}
                onOpen={onOpen}
                shortlist={shortlist}
                onToggle={onToggle}
            />
        );
    }
    return (
        <div className="flex flex-col gap-5">
            <div className="flex gap-1.5 p-1 rounded-full bg-surface-hover self-start" role="tablist">
                {TABS.map((name) => (
                    <button
                        key={name}
                        type="button"
                        role="tab"
                        aria-selected={tab === name}
                        onClick={() => go({ tab: name })}
                        className={`h-10 px-5 rounded-full text-sm font-semibold ${tab === name ? 'bg-surface text-primary shadow-sm' : 'text-text-secondary'}`}
                    >
                        {t(`journey.choose.tabs.${name}`)}
                    </button>
                ))}
            </div>
            {tab === 'suggestions' && <Suggestions field={params.field} setField={setField} onOpen={onOpen} shortlist={shortlist} onToggle={onToggle} />}
            {tab === 'channels' && (
                <Channels field={params.field} setField={setField} openChannel={(slug) => go({ channel: slug }, true)} onOpen={onOpen} />
            )}
            {tab === 'search' && <Search onOpen={onOpen} shortlist={shortlist} onToggle={onToggle} />}
        </div>
    );
}

export default BrowseChoice;
