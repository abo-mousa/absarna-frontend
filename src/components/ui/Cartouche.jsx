import { KhatamStar } from './Khatam';

/**
 * A section heading: the star, the title in Markazi, and a hairline that fades toward the page
 * edge — the band a manuscript puts above a new section, and what replaces the plain
 * `text-lg font-bold` heading every section used to open with.
 *
 * <p><b>The fade is the one direction-aware piece.</b> The line starts where the title ends and
 * dies out at the far edge, which is the physical left in Arabic and the right in English. A
 * gradient's direction is physical CSS with no logical form, so it takes `rtl:`/`ltr:` variants —
 * the same exception the sidebar drawer's transform makes, and for the same reason.
 *
 * <p>`action` is an optional link or button at the far end («كل الاشتراكات»). `as` sets the
 * heading level so a page keeps a correct outline; the look does not change with it.
 */
function Cartouche({ title, action = null, as: Heading = 'h2', className = '' }) {
    return (
        <div className={`flex items-center gap-3 mb-4 ${className}`}>
            <KhatamStar className="w-3.5 h-3.5 flex-shrink-0 text-gold" />
            <Heading className="font-serif text-[1.75rem] font-semibold leading-none whitespace-nowrap">
                {title}
            </Heading>
            <span
                aria-hidden="true"
                className="flex-1 min-w-4 h-px from-border to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r"
            />
            {action && <div className="flex-shrink-0 text-sm font-semibold">{action}</div>}
        </div>
    );
}

export default Cartouche;
