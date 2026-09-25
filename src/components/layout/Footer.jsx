import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SwapLabel } from '../ui';
import { isViewerIdOff, setViewerIdOff } from '@/lib/viewerId';
import { t } from '@/i18n';
import { useConsent } from '@/contexts/ConsentContext';

// Muted on purpose, and it overrides index.css's base `a { @apply text-primary }`.
//
// A footer link rendered in the brand colour competes with the actual content of a reading page:
// the eye is drawn to the one saturated thing on screen, and here that thing is "شروط الاستخدام".
// These want to be findable when looked for and invisible when not, which is what a muted colour
// that resolves on hover says. The utilities layer beats the base layer, so no `!important`.
const footerLinkClass = 'text-text-muted hover:text-text-secondary hover:underline transition-colors';

/**
 * The site-wide footer: the legal/contact surface, and nothing else.
 *
 * <h4>Why it is this quiet</h4>
 *
 * <p>This is a reading app, so the footer is not a navigation hub — the sidebar is, and it is
 * already on screen. The whole job here is that a reader who goes looking for "who runs this and
 * how do I complain" finds it in the place every website has trained them to look. Three links,
 * one line of copyright, at 0.8rem in the muted token. A fat footer of channel lists and content
 * categories would be a second sidebar that disagrees with the first one the first time a category
 * is added.
 *
 * <p><b>Hidden in print</b>, for the same reason `index.css` hides `nav` and `aside`: somebody
 * printing an article wants the article. Site chrome on the last page is wasted paper.
 *
 * <h4>The year is a plain number, not `formatCount`</h4>
 *
 * <p>`lib/numbers.js` is the right answer for every *count* and the wrong one here: it groups
 * Western-style, so 2026 would render as «2,026». It is still Latin digits either way, which is
 * the rule that actually matters (`lib/numbers.js`'s note on the app having had two digit systems
 * on one card) — `String(year)` gets that for free, since JavaScript has no other digits to offer.
 *
 * <p>Computed from the clock rather than written into `ar.js`: a hardcoded year is correct for a
 * few months and then quietly wrong on a page whose entire subject is being trustworthy about
 * facts. The "last updated" date on the legal pages is the opposite case and IS in the catalog —
 * it is a claim about when a human last read the text, which no clock knows.
 */
function Footer() {
    const { reset: resetConsent } = useConsent();
    const [viewerIdOff, setViewerIdOffState] = useState(() => isViewerIdOff());
    const toggleViewerId = () => {
        setViewerIdOff(!viewerIdOff);
        setViewerIdOffState(!viewerIdOff);
    };
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border-light bg-bg print:hidden">
            {/* `max-w-reading` matches the legal pages themselves, so the footer's left edge lines
                up with the prose above it rather than running the full width of a desktop window.
                Column on a phone and a row from `sm:` up: three links plus a copyright line do not
                fit on one 360px row without either wrapping mid-phrase or shrinking below the size
                this text can afford to be. */}
            <div className="max-w-reading mx-auto px-4 sm:px-6 py-6
                            flex flex-col sm:flex-row items-center justify-between gap-3
                            text-[0.8rem] text-text-muted">
                {/* `nav` with a label, not a bare row of links: a screen-reader user landing in the
                    landmark list needs these distinguished from the main and side navigation, and
                    "روابط" alone would not do it. */}
                <nav aria-label={t('legal.footer.navLabel')} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                    <Link to="/about" className={footerLinkClass}>{t('legal.footer.about')}</Link>
                    <Link to="/privacy" className={footerLinkClass}>{t('legal.footer.privacy')}</Link>
                    <Link to="/terms" className={footerLinkClass}>{t('legal.footer.terms')}</Link>
                    <Link to="/contact" className={footerLinkClass}>{t('legal.footer.contact')}</Link>
                    {/* WITHDRAWAL, and it is here because it has to be as easy as consenting was.
                        A decision that can only be undone by clearing site data is not a decision
                        that was freely given. A button rather than a Link: it changes state on
                        this page — the banner comes back and anything loaded from Google stops
                        being loaded — and navigating somewhere to find a toggle is the friction
                        the rule is about. */}
                    <button type="button" onClick={resetConsent} className={footerLinkClass}>
                        {t('consent.footerLink')}
                    </button>
                    {/* The view-counting id's off switch, beside the other choice and as easy to
                        reach: one press, and it is deleted (lib/viewerId). Its words say what the
                        press will do, and both wordings share one cell so the link does not move. */}
                    <button type="button" onClick={toggleViewerId} className={footerLinkClass} aria-pressed={viewerIdOff}>
                        <SwapLabel showing={viewerIdOff ? 'turnOn' : 'turnOff'} faces={{ turnOff: t('legal.footer.viewerIdOff'), turnOn: t('legal.footer.viewerIdOn') }} />
                    </button>
                </nav>

                <p className="text-center">{t('legal.footer.rights', { year })}</p>
            </div>
        </footer>
    );
}

export default Footer;
