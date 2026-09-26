import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '@/lib/media';
import { t } from '@/i18n';

/**
 * A book's cover as a link to the book — one drawing for BookCard's row and the Books page's
 * shelves, so the two can never disagree about what a book looks like.
 *
 * <p>`progress` is the backend's fraction read (`BookReadingHistoryDTO.progress`), never
 * worked out here from pages.
 *
 * <p>The preview image when there is one and it loads. It is not presigned; resolveMediaUrl
 * returns null for an object key, and it can also be an owner-supplied external URL that is dead,
 * moved, hotlink-blocked or outside the SPA's `img-src` allowlist — hence the onError, which falls
 * to the generated cover rather than a broken-image glyph. The generated one is the title in
 * Markazi inside a gold frame on the brand colour, decorative: the link's label carries the title.
 *
 * <p>The spine is an inset shadow on the binding edge, which is the start side — the right in
 * Arabic. A shadow's offset is physical with no logical form, so it takes `rtl:`/`ltr:`, like the
 * sidebar drawer's transform.
 */
/**
 * @param onOpen when given, the cover is a button that calls it instead of a link to the book —
 *        the book's own page, where the cover opens the reader rather than linking to itself.
 */
function BookCover({ book, progress, className = 'w-24', onOpen = null }) {
    const [previewFailed, setPreviewFailed] = useState(false);
    const previewUrl = !previewFailed ? resolveMediaUrl(book.previewImageUrl) : null;
    // The backend's fraction (0–1); below 1% it would draw a sliver that says nothing.
    const readPercent = progress > 0.01 ? Math.min(1, progress) * 100 : null;
    const Wrapper = onOpen ? 'button' : Link;

    return (
        <Wrapper
            {...(onOpen ? { type: 'button', onClick: onOpen } : { to: `/books/${book.id}` })}
            aria-label={onOpen ? t('books.read') : book.title}
            // `block`: a link is inline by default, and aspect-ratio does nothing to an inline
            // box — inside BookCard's flex row that was hidden (a flex item is blockified), and on a
            // shelf, whose parent is a plain block, the cover collapsed to the height of its text.
            className={`relative block ${className} flex-shrink-0 self-start aspect-[2/3] rounded-md overflow-hidden bg-surface-hover
                rtl:shadow-[inset_-5px_0_0_rgba(0,0,0,0.18),0_4px_10px_-4px_rgba(0,0,0,0.35)]
                ltr:shadow-[inset_5px_0_0_rgba(0,0,0,0.18),0_4px_10px_-4px_rgba(0,0,0,0.35)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        >
            {previewUrl ? (
                <img src={previewUrl} alt="" loading="lazy" decoding="async" onError={() => setPreviewFailed(true)} className="w-full h-full object-cover" />
            ) : (
                <div aria-hidden="true" className="relative w-full h-full flex items-center justify-center p-3 bg-primary-dark text-white text-center">
                    <span className="absolute inset-1.5 border border-gold/50" />
                    <span dir="auto" className="font-serif text-base leading-tight line-clamp-4">{book.title}</span>
                </div>
            )}

            {/* Released today or yesterday — the backend's NewRelease. */}
            {book.newRelease && (
                <span className="absolute top-1.5 start-1.5 bg-gold text-gray-900 text-[0.62rem] font-bold px-1.5 py-px rounded-sm shadow-sm">
                    {t('common.newRelease')}
                </span>
            )}

            {readPercent !== null && (
                <div className="absolute bottom-0 inset-x-0 h-[3px] bg-black/70">
                    {/* Gold, like VideoCard's watched bar. */}
                    <div className="h-full bg-gold" style={{ width: `${readPercent}%` }} />
                </div>
            )}
        </Wrapper>
    );
}

export default BookCover;
