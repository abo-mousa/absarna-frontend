import { useEffect } from 'react';
import { currentLocale, t } from '@/i18n';

/**
 * The language these documents were written in.
 *
 * <p>Everything else in the app is copy that happens to exist in two languages. These are an
 * operative text that exists in one, plus a translation of it \u2014 and the difference has to be
 * visible to the person reading the translation, or there are two texts and no answer to which one
 * governs. Below, that is the only thing `sourceNotice` says.
 */
const SOURCE_LOCALE = 'ar';

/**
 * Renders one long legal document — the privacy policy and the terms of use, today.
 *
 * <h4>Why the prose arrives as DATA rather than through `t()`</h4>
 *
 * <p>The rule in CLAUDE.md is that every user-facing string lives in `ar.js`, and it still does:
 * there is not one Arabic word in this file or in the two pages that use it. What is different is
 * how it gets here. `t()` is a *string* API by contract — it resolves a dotted path and returns the
 * key itself when the result is not a string, which `i18n/__tests__` pins deliberately — asking
 * it for a namespace path renders that path back, never the object behind it. A policy is not a bag
 * of named strings; it is an ordered list of sections, each an ordered list of paragraphs, and the
 * single most likely edit anyone will ever make to it is <b>inserting a paragraph</b>.
 *
 * <p>Modelled as `t()` keys that would mean `legal.privacy.collect.p1 … p4`, and a JSX file that
 * names each one. Inserting a paragraph in the middle then means renumbering the rest and editing
 * this component — so the lawyer or translator cannot touch the text without touching React, which
 * is the exact failure the catalog exists to prevent. As arrays, `ar.legal.privacy` is the whole
 * document and editing it is editing a list.
 *
 * <h4>Links</h4>
 *
 * <p>A paragraph (or a bullet) may be an ARRAY of parts rather than a string, where a part is
 * either text or `{ text, href }` — see `paragraphParts`. This exists because YouTube's API terms
 * require these pages to <em>display links</em> to documents of theirs, which a page that renders
 * every paragraph as a bare string cannot do at all.
 *
 * <p>The cost is real and worth stating: the i18n test walks the source for literal `t('…')` calls,
 * so these strings are NOT covered by it. A section whose `heading` is missing renders an empty
 * `<h2>` rather than a visible `legal.privacy.…` on screen. That is the trade — and it is bounded,
 * because the pages' chrome (titles, the last-updated line, the contents heading) does go through
 * `t()` and is checked.
 *
 * <h4>Anchors</h4>
 *
 * <p>Every section carries a stable `id` from the catalog, so a specific clause can be linked —
 * "see §الحقوق on your privacy page" is a sentence people actually write, and a policy you can only
 * link to as a whole is one that gets quoted by screenshot instead. The contents list at the top is
 * how a reader *obtains* such a link without a devtools trip: clicking an entry puts the hash in
 * the address bar, which is then copyable.
 *
 * <p>`scroll-mt-24` on the heading is not decoration. The navbar is `sticky top-0` and about 60px
 * tall, so a browser scrolling an element to y=0 parks it underneath — the reader follows a link to
 * a clause and lands on the paragraph after it, with no indication anything is hidden.
 */
/**
 * One paragraph's pieces, as a list — plain text, and the occasional link.
 *
 * <h4>Why a legal document needs links at all, and why this shape</h4>
 *
 * <p>YouTube's API Services Terms III.A require that our terms of use <b>display a link</b> to
 * their terms, and that our privacy policy link to Google's. "Display a link" is not satisfied by
 * naming a URL in prose, and until this existed there was no way to put one in these pages: every
 * paragraph was rendered as a bare string. The same is true of the revocation link Google requires
 * once OAuth sign-in is offered.
 *
 * <p><b>Parts rather than a per-section list of links.</b> A trailing «انظر: …» block would have
 * been less work and reads as boilerplate nobody follows; what these clauses actually need is the
 * link inside the sentence that makes the commitment, because the sentence is the commitment.
 *
 * <p><b>A plain string is still a paragraph</b>, which is the whole reason this is a normalising
 * function instead of a new field. Every existing paragraph in `ar.legal` — the overwhelming
 * majority, and all of them written before this — is untouched and must stay that way: a policy
 * whose format changes underneath the person editing it is a policy that stops being edited.
 */
export function paragraphParts(paragraph) {
    if (typeof paragraph === 'string') return [paragraph];
    return Array.isArray(paragraph) ? paragraph : [];
}

/**
 * One piece of a paragraph. A string renders as text; `{ text, href }` renders as a link.
 *
 * <p>Every link here points off this site by nature — these exist to satisfy a requirement to link
 * to somebody else's terms — so `rel="noopener noreferrer"` and a new tab are the default rather
 * than a per-call-site decision. A reader sent away mid-policy and unable to get back is how a
 * page nobody finishes becomes a page nobody starts.
 */
function ParagraphPart({ part }) {
    if (typeof part === 'string') return part;
    if (!part?.href) return part?.text ?? null;
    return (
        <a
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            // The URL itself, for a reader who wants to see where a link goes before following it
            // — and for anyone reading this page on paper, where the link is invisible otherwise.
            dir="ltr"
        >
            {part.text}
        </a>
    );
}

function LegalDocument({ doc }) {
    const sections = doc?.sections ?? [];

    // A deep link into a clause does not work in a SPA without this.
    //
    // On a normal server-rendered page the browser resolves `#term-of-use` against a document it
    // already has. Here the route is `React.lazy`, so at the moment the browser looks for that id
    // the page is a spinner and there is nothing to scroll to; it gives up silently and the reader
    // lands at the top of a very long document having been promised a specific paragraph. Running
    // once after mount is the fix. `location.hash` rather than `useLocation()` because this is a
    // question about the DOM's current position, not about routing state.
    //
    // Deliberately not depending on the hash: an in-page click is handled natively by the browser
    // (these are plain `<a href="#…">`, not router links) and re-running this would fight it.
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id) return;
        document.getElementById(id)?.scrollIntoView();
    }, []);

    return (
        // `font-reading` on the whole document rather than paragraph by paragraph: a privacy
        // policy is the longest continuous prose in the app and the one page nobody reads twice,
        // so it gets the reading face and keeps it through its lists and its table of contents.
        // The headings inherit it too, which is right — they are sentences here, not labels.
        // `dir="auto"` rather than inheriting: the browser reads the first strong character and
        // lays the document out for whichever language it turns out to be in. That was load-bearing
        // while these pages were the untranslated part of the catalog, and it stays correct now
        // that they are translated — at no cost, and it is what a third language would need too.
        <article dir="auto" className="font-reading">
            <h1 className="text-3xl font-serif font-bold mb-3">{doc?.title}</h1>

            {/* Stated at the top and in muted type: it is the first thing a careful reader looks
                for and the last thing anyone else wants to read. The date is a claim about when a
                human last reviewed the wording, so it is written in the catalog rather than
                computed — a clock cannot know it, and a policy that silently dates itself to today
                is worse than one with an old date honestly on it. */}
            <p className="text-sm text-text-muted mb-8 pb-6 border-b border-border-light">
                {t('legal.lastUpdated', { date: t('legal.lastUpdatedDate') })}
            </p>

            {/* WHICH VERSION GOVERNS, and only to the reader of a translation. An Arabic reader is
                reading the original, and telling them they are reading a translation would be
                false; an English reader is reading one, and not saying so would leave two texts
                that both read as operative. `dir="auto"` so it lays out in its own language rather
                than the document's. */}
            {currentLocale() !== SOURCE_LOCALE && (
                <p
                    dir="auto"
                    className="text-sm text-text-secondary mb-8 p-4 rounded-lg bg-surface border border-border-light"
                >
                    {t('legal.sourceNotice')}
                </p>
            )}

            {doc?.intro?.map((paragraph, index) => (
                <p key={index} className="leading-loose text-[1.05rem] mb-4">{paragraph}</p>
            ))}

            {sections.length > 0 && (
                <nav aria-labelledby="legal-contents" className="my-10 p-5 bg-surface rounded-lg border border-border-light">
                    <h2 id="legal-contents" className="text-base font-bold mb-3">{t('legal.contentsHeading')}</h2>
                    <ol className="list-decimal ps-5 space-y-1.5 text-[0.95rem] marker:text-text-muted">
                        {sections.map((section) => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} className="text-primary hover:underline">{section.heading}</a>
                            </li>
                        ))}
                    </ol>
                </nav>
            )}

            {sections.map((section) => (
                <section key={section.id} className="mb-10">
                    <h2 id={section.id} className="scroll-mt-24 text-xl font-bold mb-3">{section.heading}</h2>

                    {section.paragraphs?.map((paragraph, index) => (
                        <p key={index} className="leading-loose text-[1.05rem] text-text-secondary mb-3">
                            {paragraphParts(paragraph).map((part, partIndex) => (
                                <ParagraphPart key={partIndex} part={part} />
                            ))}
                        </p>
                    ))}

                    {/* `ps-5` and `marker:` rather than `pl-5`: the list marker sits on the reading
                        side, which is the right in this app, and a logical property is the only
                        spelling that stays correct if any of this is ever laid out LTR. */}
                    {section.bullets?.length > 0 && (
                        <ul className="list-disc ps-5 space-y-2 leading-loose text-[1.05rem] text-text-secondary marker:text-text-muted">
                            {section.bullets.map((bullet, index) => (
                                <li key={index}>
                                    {paragraphParts(bullet).map((part, partIndex) => (
                                        <ParagraphPart key={partIndex} part={part} />
                                    ))}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            ))}
        </article>
    );
}

export default LegalDocument;
