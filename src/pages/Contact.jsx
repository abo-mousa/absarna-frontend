import { Mail, AlertTriangle } from 'lucide-react';
import { PageShell } from '../components/layout';
import { usePageMeta } from '../hooks/usePageMeta';
import { CONTACT_EMAIL } from '@/lib/env';
import { ar } from '@/i18n/ar';
import { t } from '@/i18n';

/**
 * The contact page — and, today, the only route from a reader to a human.
 *
 * <h4>Why the missing-address state is a designed screen and not an assertion</h4>
 *
 * <p>`VITE_CONTACT_EMAIL` is read at build time (`lib/env.js`), so a deploy that forgets it cannot
 * be fixed by restarting anything, and there is no runtime check that could have caught it. Two
 * bad answers were available: invent a plausible address, or render a `mailto:` with an empty
 * target. Both produce a page that looks finished — the first sends takedown notices into a
 * mailbox nobody owns, the second opens a mail client with a blank To: field that the reader
 * helpfully fills in with whatever they guess. Either way the complaint is lost and neither side
 * can tell.
 *
 * <p>So an unconfigured deploy says so, out loud, on the page whose whole subject is reachability.
 * That is embarrassing in exactly the right proportion to the mistake, which is the point: nobody
 * launches past this notice by accident, and the operator note names the one variable that fixes
 * it.
 *
 * <p>The rest of the page still renders. A reader who arrives from a takedown clause in the terms
 * should at least learn *what* this address is for and what to put in the message, even on the
 * deploy that has not configured it yet.
 *
 * <h4>Why this does not reuse `LegalDocument`</h4>
 *
 * <p>That component opens with a "last updated" line and a numbered contents list, both of which
 * are right for a document that is a legal instrument and wrong for a four-paragraph page about
 * how to send an email. What is shared is the shape of the data in `ar.legal`, which is the half
 * that matters for editing the copy.
 */
function Contact() {
    const doc = ar.legal.contact;
    const hasAddress = CONTACT_EMAIL.length > 0;

    usePageMeta({
        title: doc.title,
        description: doc.metaDescription,
    });

    return (
        <PageShell sidebar={false} contentClassName="max-w-reading mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-serif font-bold mb-6">{t('legal.contact.title')}</h1>

            {doc.intro.map((paragraph, index) => (
                <p key={index} className="leading-loose text-[1.05rem] mb-4">{paragraph}</p>
            ))}

            {hasAddress ? (
                <section className="my-8 p-6 bg-surface rounded-lg border border-border-light text-center">
                    <h2 className="text-base font-bold mb-3">{t('legal.contact.emailHeading')}</h2>

                    {/* The address as selectable text as well as a link. A `mailto:` is useless to
                        anyone whose browser has no mail client registered — which on a shared or
                        managed machine is most people — and they need to be able to copy it.
                        `dir="ltr"` because an email address is a Latin string: inside an RTL
                        paragraph the browser would reorder a trailing dot or bracket around it.
                        `break-all` so a long address wraps instead of widening the card past the
                        phone screen. */}
                    <p dir="ltr" className="font-mono text-lg break-all mb-4">{CONTACT_EMAIL}</p>

                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-semibold bg-primary text-white hover:bg-primary-dark no-underline hover:no-underline transition-colors"
                    >
                        <Mail size={16} />
                        {t('legal.contact.emailAction')}
                    </a>
                </section>
            ) : (
                <section className="my-8 p-6 bg-gold-light rounded-lg border border-gold">
                    <h2 className="flex items-center gap-2 text-base font-bold mb-3">
                        <AlertTriangle size={18} className="text-gold flex-shrink-0" />
                        {t('legal.contact.missingHeading')}
                    </h2>
                    <p className="leading-loose">{t('legal.contact.missingBody')}</p>
                    {/* Latin, and left as one unbroken token on purpose: it is the name of an
                        environment variable, so it is a string to be copied exactly, not prose. */}
                    <p dir="rtl" className="mt-3 text-sm text-text-secondary leading-loose">
                        {t('legal.contact.missingOperatorNote')}
                    </p>
                </section>
            )}

            <p className="text-sm text-text-muted leading-loose mb-10">{t('legal.contact.responseNote')}</p>

            {doc.sections.map((section) => (
                <section key={section.id} className="mb-8">
                    <h2 id={section.id} className="scroll-mt-24 text-xl font-bold mb-3">{section.heading}</h2>
                    {section.paragraphs.map((paragraph, index) => (
                        <p key={index} className="leading-loose text-[1.05rem] text-text-secondary mb-3">{paragraph}</p>
                    ))}
                </section>
            ))}
        </PageShell>
    );
}

export default Contact;
