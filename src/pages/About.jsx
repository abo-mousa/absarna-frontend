import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout';
import { usePageMeta } from '../hooks/usePageMeta';

import { t, tData } from '@/i18n';

/**
 * What this platform is — the page a reader lands on with no idea whose site they are on, and the
 * page an outside reviewer is pointed at.
 *
 * <h4>Why it is not `LegalDocument`</h4>
 *
 * <p>Same data shape as the legal pages, deliberately: a document is an ordered list of sections,
 * and `ar.legal.about` is editable by someone who does not read React, which is the whole reason
 * that shape exists. What it does not take is that component's chrome. The "last updated" line is
 * a single shared date meaning "when a human last reviewed the *terms*" — putting it here would
 * date this page to an edit of another document, and re-date it every time the terms change. The
 * numbered table of contents is for a text people cite by clause. Neither is true of five short
 * sections about what the site is. `Contact.jsx` makes the same trade for the same reason.
 *
 * <h4>The one link that is JSX rather than catalog</h4>
 *
 * <p>The route to the contact page is an internal `Link`, so it stays inside the SPA. The legal
 * documents' `{ text, href }` parts render a plain `<a target="_blank">`, which is right for the
 * outbound links they exist for and wrong for a link across this site — it would open a second tab
 * on the page you are already reading.
 */
function About() {
    const doc = tData('legal.about');

    usePageMeta({
        title: t('legal.about.title'),
        description: t('legal.about.metaDescription'),
    });

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-10">
            {/* `dir="auto"` and `font-reading`, matching LegalDocument: this is continuous prose in
                whichever language the catalog is serving, and the browser lays it out from the
                first strong character rather than from a hardcoded direction. */}
            <article dir="auto" className="font-reading">
                <h1 className="text-3xl font-serif font-bold mb-6">{doc?.title}</h1>

                {doc?.intro?.map((paragraph, index) => (
                    <p key={index} className="leading-loose text-[1.05rem] mb-4">{paragraph}</p>
                ))}

                {(doc?.sections ?? []).map((section) => (
                    <section key={section.id} className="mt-10">
                        <h2 id={section.id} className="scroll-mt-24 text-xl font-bold mb-3">{section.heading}</h2>

                        {section.paragraphs?.map((paragraph, index) => (
                            <p key={index} className="leading-loose text-[1.05rem] text-text-secondary mb-3">
                                {paragraph}
                            </p>
                        ))}

                        {section.bullets?.length > 0 && (
                            <ul className="list-disc ps-5 space-y-2 leading-loose text-[1.05rem] text-text-secondary marker:text-text-muted">
                                {section.bullets.map((bullet, index) => (
                                    <li key={index}>{bullet}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}

                {/* The routes out, and they are the two documents this page summarises. A reader
                    who has just been told what the platform does with their video is one click
                    from the clause that says it operatively. */}
                <nav className="mt-12 pt-6 border-t border-border-light flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
                    <Link to="/terms" className="text-primary hover:underline">{t('legal.footer.terms')}</Link>
                    <Link to="/privacy" className="text-primary hover:underline">{t('legal.footer.privacy')}</Link>
                    <Link to="/contact" className="text-primary hover:underline">{t('legal.footer.contact')}</Link>
                </nav>
            </article>
        </PageShell>
    );
}

export default About;
