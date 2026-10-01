import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useConsent } from '@/contexts/ConsentContext';
import { KhatamStar } from '@/components/ui';
import { resolveMediaUrl, videoPoster } from '@/lib/media';
import { chosenByText, itemKey, itemMeta } from '@/lib/goalChoice';
import { t } from '@/i18n';

/**
 * The pieces every screen of `JourneyChoose` shares: a programme's or book's picture, its card, the
 * week strip that draws a pace, and the shortlist's mark.
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

const STRIP_WEEKS = 12;

/**
 * A pace drawn instead of written: a cell per day from today, filled through the finish, and the
 * deadline marked in gold. Past twelve weeks it would be a wall of cells, so it says nothing and the
 * sentence beside it carries the whole answer.
 */
export function WeekStrip({ days, deadlineDays = null }) {
    // A deadline beyond the strip's reach (Ramadan five months off) is left to the sentence beside
    // it rather than hiding the strip: the finish is what the reader needs to see.
    const deadline = deadlineDays != null && Math.ceil((deadlineDays + 1) / 7) <= STRIP_WEEKS ? deadlineDays : null;
    const weeks = Math.max(Math.ceil(days / 7), deadline != null ? Math.ceil((deadline + 1) / 7) : 0);
    if (!days || weeks > STRIP_WEEKS) return null;
    return (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }} aria-hidden="true">
            {Array.from({ length: weeks }, (_, week) => (
                <div key={week} className="grid grid-cols-7 gap-[2px]">
                    {Array.from({ length: 7 }, (__, d) => {
                        const day = week * 7 + d;
                        const cls = day < days ? 'bg-primary' : day === deadline ? 'bg-gold' : 'bg-border-light';
                        return <i key={d} className={`block h-2 rounded-[1px] ${cls}`} />;
                    })}
                </div>
            ))}
        </div>
    );
}

