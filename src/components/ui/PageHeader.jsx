/**
 * The heading of a tab's page — Books, Articles, Posts, Channels: the title in the serif face over
 * a hairline, and room at the far end for the page's one control (the Posts toggle). One component
 * so the four cannot drift apart again: they had three styles between them, and two carried a
 * sentence under the title that the others did not. No subtitle, on purpose — the tab has already
 * said where the reader is, and the page's contents say what it is.
 */
function PageHeader({ title, action }) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4 pb-4 mb-6 border-b border-border">
            <h1 className="font-serif text-[2.4rem] font-semibold leading-none">{title}</h1>
            {action}
        </header>
    );
}

export default PageHeader;
