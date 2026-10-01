import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useConsent } from '@/contexts/ConsentContext';
import { KhatamStar } from '@/components/ui';
import { resolveMediaUrl, videoPoster } from '@/lib/media';
import { chosenByText, finishText, itemKey, itemMeta } from '@/lib/goalChoice';
import { formatDay } from '@/lib/dayFormat';
import { t } from '@/i18n';

/**
 * The pieces every screen of `JourneyChoose` shares: a programme's or book's picture, its card, the
 * timeline that draws a pace, and the shortlist's mark.
 */

const TINTS = ['bg-primary-light text-primary', 'bg-gold-light text-gold-ink', 'bg-surface-hover text-text-secondary'];

/**
 * A programme's first-episode poster (the consent gate included — see `videoPoster`) or a book's
 * preview; failing both, the star on a tint picked from the id, so a row of placeholders is not
 * one grey block.
 */
export function Poster({ item, className = '', children = null }) {
    const { youtubeAllowed } = useConsent();
    const [failed, setFailed] = useState(false);
    const src = failed ? null : item.kind === 'FINISH_BOOK'
        ? resolveMediaUrl(item.book?.previewImageUrl)
        : videoPoster(item.firstEpisode, youtubeAllowed);
    const tint = TINTS[Number(item.targetId || 0) % TINTS.length];
    return (
        <div className={`relative overflow-hidden rounded-md ${src ? 'bg-surface-hover' : tint} ${className}`}>
            {src ? (
                <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <KhatamStar className="w-1/4 h-1/4 opacity-60" strokeWidth={6} />
                </span>
            )}
            {children}
        </div>
    );
}

/** The shortlist's mark on a card: a bookmark, filled when the item is on the list. */
export function ShortlistMark({ item, shortlist, onToggle, className = '' }) {
    const saved = shortlist.some((entry) => itemKey(entry) === itemKey(item));
    return (
        <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? t('journey.choose.saved') : t('journey.choose.save')}
            onClick={(event) => { event.stopPropagation(); onToggle(item); }}
            className={`w-9 h-9 rounded-full bg-surface/95 flex items-center justify-center shadow-sm ${saved ? 'text-primary' : 'text-text-primary'} ${className}`}
        >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
    );
}



/** A card on a shelf: the picture, the shortlist mark, the title and its size. Tapping opens the preview. */
export function ItemCard({ item, onOpen, shortlist, onToggle, width = 'w-40 sm:w-44' }) {
    return (
        // The mark is the button's sibling, not its child — a button inside a button is invalid and
        // swallows the inner click — and sits over the poster's corner, which starts the card.
        <div className={`${width} relative flex-shrink-0 snap-start`}>
            <button type="button" onClick={() => onOpen(item)} className="block w-full text-start group">
                <Poster item={item} className="aspect-video w-full group-hover:opacity-90" />
                <span dir="auto" className="mt-2 block text-sm font-semibold leading-snug line-clamp-2">{item.title}</span>
                <span className="block text-xs text-text-secondary mt-0.5">{itemMeta(item)}</span>
                {item.chosenBy ? <span className="block text-xs text-gold-ink mt-0.5">{chosenByText(item.chosenBy)}</span> : null}
            </button>
            <ShortlistMark item={item} shortlist={shortlist} onToggle={onToggle} className="absolute top-1.5 start-1.5" />
        </div>
    );
}

/** A titled row of cards that scrolls sideways — a shelf. */
export function Shelf({ title, items, onOpen, shortlist, onToggle }) {
    if (!items?.length) return null;
    return (
        <section className="flex flex-col gap-3">
            <h2 className="font-serif text-xl font-bold">{title}</h2>
            <div className="flex gap-3 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {items.map((item) => (
                    <ItemCard key={itemKey(item)} item={item} onOpen={onOpen} shortlist={shortlist} onToggle={onToggle} />
                ))}
            </div>
        </section>
    );
}

const isoPlus = (days) => {
    const now = new Date();
    const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days, 12));
    return day.toISOString().slice(0, 10);
};

/**
 * A pace drawn as a road: today at one end, the finish — the khatam star — where this amount gets
 * the reader, and their own date flagged in gold when they gave one. Proportional, so it reads the
 * same for three weeks or a year (the cell grid it replaced gave up past twelve weeks), with a tick
 * per week, or per month once weeks would crowd. Running past the date paints the overrun gold.
 *
 * @param days         days to finish at this amount (day 1 is today)
 * @param deadlineDays days from today to the reader's date; null for none
 */
export function PaceTimeline({ days, deadlineDays = null }) {
    if (!days) return null;
    const deadline = deadlineDays != null && deadlineDays >= 0 ? deadlineDays : null;
    const span = Math.max(days, deadline ?? 0);
    // Headroom at the end, so the star and the flag never sit on the rail's edge.
    const scale = span * 1.08 + 1;
    const at = (d) => `${Math.min(100, (d / scale) * 100)}%`;
    const late = deadline != null && days > deadline;
    const step = span / 7 <= 26 ? 7 : 30;
    const ticks = [];
    for (let d = step; d < span; d += step) ticks.push(d);
    const finishIso = isoPlus(days - 1);
    const deadlineIso = deadline != null ? isoPlus(deadline) : null;

    return (
        <div className="flex flex-col gap-2">
            <div className="relative h-7" aria-hidden="true">
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-border-light" />
                {ticks.map((d) => (
                    <span key={d} className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-border" style={{ insetInlineStart: at(d) }} />
                ))}
                {/* Positioned inline, not with a `start-0` class: the build has no logical inset utilities. */}
                <span
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-primary"
                    style={{ insetInlineStart: 0, width: at(late ? deadline : days) }}
                />
                {late && (
                    <span
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gold/70"
                        style={{ insetInlineStart: at(deadline), width: `calc(${at(days)} - ${at(deadline)})` }}
                    />
                )}
                <span className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-surface border-2 border-primary" style={{ insetInlineStart: 0 }} />
                {deadline != null && (
                    <span className="absolute top-0 bottom-0 w-0.5 rounded-full bg-gold" style={{ insetInlineStart: at(deadline) }} />
                )}
                <span
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm ring-1 ring-border-light"
                    style={{ insetInlineStart: at(days) }}
                >
                    <KhatamStar filled className={`w-4 h-4 ${late ? 'text-gold' : 'text-primary'}`} strokeWidth={8} />
                </span>
            </div>
            <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-text-muted pt-0.5">{t('journey.choose.pace.today')}</span>
                <span className="flex flex-col items-end text-end gap-0.5">
                    <span className={`text-sm font-bold ${late ? 'text-gold-ink' : 'text-primary-dark dark:text-primary'}`}>
                        {finishText(days)}
                    </span>
                    <span className="text-xs text-text-secondary">
                        {formatDay(finishIso)}
                        {deadlineIso && (
                            <span className="text-gold-ink">{' · '}{t('journey.choose.pace.deadline', { date: formatDay(deadlineIso) })}</span>
                        )}
                    </span>
                </span>
            </div>
        </div>
    );
}
