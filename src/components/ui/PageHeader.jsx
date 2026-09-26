/**
 * The top of a tab's page — Today, Discover, Books, Articles, Posts, Channels.
 *
 * <p><b>No visible title, on purpose.</b> The tab the reader just pressed is already marked — the
 * gold underline in the navbar strip, the lit item in the phone's bottom bar — so a large «الكتب»
 * under a lit «الكتب» said the same word twice at the top of every page. The title stays as the
 * page's `<h1>` for screen readers, which have no tab strip to look at, and is visually hidden.
 *
 * <p>What is left is the page's own control, when it has one — Discover's view switch, the Posts
 * filter, Today's dateline — on a line with a hairline under it, at the reading start. `tabs`
 * drops the bottom padding so a switch drawn as tabs puts its gold underline ON that hairline,
 * the way the navbar's tabs sit on theirs. A page with no control starts with its content.
 *
 * <p>`belowLg` is for a control only the narrow layout needs — Books and Articles, which share
 * the phone bar's one «اقرأ» item and so need a switch between them that the wide navbar strip
 * already is. The line and its hairline disappear from `lg`; the `<h1>` never does.
 */
function PageHeader({ title, action = null, tabs = false, belowLg = false }) {
    const line = `flex flex-wrap items-end gap-4 mb-6 border-b border-border ${tabs ? '' : 'pb-3'}`;
    if (action && belowLg) {
        return (
            <>
                <h1 className="sr-only">{title}</h1>
                <header className={`${line} lg:hidden`}>{action}</header>
            </>
        );
    }
    return (
        <header className={action ? line : ''}>
            <h1 className="sr-only">{title}</h1>
            {action}
        </header>
    );
}

export default PageHeader;
