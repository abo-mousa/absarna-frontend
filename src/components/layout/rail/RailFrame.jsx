import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Avatar, KhatamStar } from '../../ui';
import { ArrowForward } from '../../ui/DirectionalIcon';
import { resolveMediaUrl } from '@/lib/media';
import { formatChipLabel } from '@/lib/formats';
import { t } from '@/i18n';

/**
 * The tabs' side column, one frame for all of them — Discover's channels, and the Books, Articles
 * and Posts columns — so they read as one family: framed the way a page of a manuscript is (a gold
 * double rule down the edge that meets the page, a band of small stars across the head, one
 * thin-line star low in the far corner), full height against the reading-start edge under the
 * navbar, wide screens only. It holds what the page beside it does NOT — the channels behind that
 * kind of content, a way to move around the page, a filter — never more of the page's own items.
 */
export function RailFrame({ label, children }) {
    return (
        <aside
            aria-label={label}
            className="hidden lg:flex flex-col relative w-[256px] flex-shrink-0 bg-surface
                sticky top-[var(--navbar-h)] h-[calc(100vh-var(--navbar-h))] overflow-y-auto overflow-x-hidden"
        >
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 w-[5px] border-x border-gold/45" />
            <div aria-hidden="true" className="flex items-center justify-between px-4 pt-4 pb-3 me-[5px] border-b border-gold/25">
                {Array.from({ length: 11 }, (_, i) => (
                    <KhatamStar key={i} filled={i % 2 === 0} strokeWidth={10} className={`w-2.5 h-2.5 ${i % 2 === 0 ? 'text-gold/70' : 'text-gold/50'}`} />
                ))}
            </div>
            <KhatamStar
                filled={false}
                strokeWidth={1.5}
                className="pointer-events-none absolute -bottom-10 -start-10 w-44 h-44 text-gold/25"
            />
            <div className="relative flex-1 ps-3 pe-4 pt-5 pb-4 me-[5px]">{children}</div>
        </aside>
    );
}

/**
 * The page's Cartouche at the column's scale: star, serif title, a rule fading out after it.
 * `pages` is the section's infinite query, when it has further pages; `more` a link under it.
 */
export function RailSection({ title, more = null, pages = null, children }) {
    return (
        <section className="mb-7">
            <div className="flex items-center gap-2 mb-2.5 px-2">
                <KhatamStar className="w-3 h-3 flex-shrink-0 text-gold" />
                <h2 className="font-serif text-[1.2rem] font-semibold leading-none text-text-primary whitespace-nowrap">{title}</h2>
                <span aria-hidden="true" className="flex-1 min-w-3 h-px from-border to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
            </div>
            <ul className="flex flex-col gap-0.5">{children}</ul>
            {pages?.hasNextPage && (
                <button
                    type="button"
                    onClick={() => pages.fetchNextPage()}
                    disabled={pages.isFetchingNextPage}
                    className="block w-full mt-1 ps-3 pe-2 py-1.5 rounded-md text-start text-xs font-semibold text-text-secondary
                        hover:bg-gold-light/60 hover:text-gold-ink disabled:opacity-60 transition-colors"
                >
                    {pages.isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
                </button>
            )}
            {more && (
                <Link to={more.to} className="inline-flex items-center gap-1 mt-2 px-2 text-xs font-bold text-gold-ink hover:underline">
                    {more.label}
                    <ArrowForward size={12} />
                </Link>
            )}
        </section>
    );
}

const rowClass = (selected) => `flex flex-1 min-w-0 items-center gap-2.5 ps-3 pe-2 py-1.5 rounded-md text-start transition-colors
    ${selected ? 'bg-gold-light/70 text-gold-ink' : 'text-text-secondary hover:bg-gold-light/60 hover:no-underline focus-visible:bg-gold-light/60'}`;

/** The hover mark — a gold hairline on the row's reading-start edge — and always on when selected. */
function Hairline({ selected }) {
    return (
        <span
            aria-hidden="true"
            className={`absolute start-0 inset-y-1.5 w-0.5 rounded-full bg-gold transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}
        />
    );
}

/**
 * A channel row: a link to the channel, or — given `onSelect` — a toggle (the Posts filter), which
 * keeps its gold mark while it is the one chosen. `kind` is a channel's default format, shown in the
 * kicker's gold under its name when it has one.
 */
export function RailChannel({ slug, name, logoUrl, kind = null, manage = false, onSelect = null, selected = false }) {
    const kicker = kind ? formatChipLabel(kind) : '';
    const inner = (
        <>
            <Avatar
                src={resolveMediaUrl(logoUrl)}
                name={name}
                size="sm"
                className={`!w-8 !h-8 !text-xs flex-shrink-0 ring-1 transition-shadow ${selected ? 'ring-gold' : 'ring-border-light group-hover/row:ring-gold'}`}
            />
            <span className="min-w-0" dir="auto">
                <span className={`block truncate text-[0.88rem] font-semibold transition-colors ${selected ? '' : 'group-hover/row:text-gold-ink'}`}>{name}</span>
                {kicker && <span className="block truncate text-[0.68rem] font-bold text-gold-ink/80">{kicker}</span>}
            </span>
        </>
    );
    return (
        <li className="group/row relative flex items-center gap-1">
            <Hairline selected={selected} />
            {onSelect ? (
                <button type="button" aria-pressed={selected} onClick={onSelect} className={rowClass(selected)}>{inner}</button>
            ) : (
                <Link to={`/channel/${slug}`} className={rowClass(false)}>{inner}</Link>
            )}
            {manage && (
                <Link
                    to={`/channel/${slug}/manage`}
                    title={t('channelRail.manage')}
                    aria-label={t('channelRail.manage')}
                    className="p-1.5 rounded-md text-text-muted hover:bg-gold-light/60 hover:text-gold-ink flex-shrink-0"
                >
                    <Settings size={14} />
                </Link>
            )}
        </li>
    );
}

/** A text row — a shelf to jump to, a topic to narrow by — with the same hover and selected mark. */
export function RailItem({ label, onClick, selected = false }) {
    return (
        <li className="group/row relative">
            <Hairline selected={selected} />
            <button type="button" aria-pressed={selected} onClick={onClick} className={`${rowClass(selected)} w-full text-[0.88rem] font-semibold`}>
                <span dir="auto" className="truncate">{label}</span>
            </button>
        </li>
    );
}
