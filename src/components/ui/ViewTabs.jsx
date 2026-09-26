/**
 * A page's view switch — Discover's «المقترح لك | كل الفيديوهات», the Posts page's «من أتابعهم |
 * الكل» — drawn as the navbar's tabs are: words, and a gold underline under the current one that
 * sits on the page header's hairline (`PageHeader tabs`). They were a teal block beside grey
 * boxes, the one control on those pages drawn like a form.
 *
 * @param items `[{ key, label, active, onClick }]`
 */
function ViewTabs({ items, label }) {
    return (
        <div className="flex items-end gap-5" role="group" aria-label={label}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    aria-pressed={item.active}
                    onClick={item.onClick}
                    // Hover and focus as the navbar's tabs: a faint gold preview of the current line.
                    className={`group relative pb-2.5 text-sm font-semibold focus:outline-none transition-colors ${
                        item.active ? 'text-text-primary' : 'text-text-muted hover:text-text-primary focus-visible:text-text-primary'
                    }`}
                >
                    {item.label}
                    <span aria-hidden="true" className={`absolute inset-x-0 -bottom-px h-0.5 bg-gold transition-opacity duration-150 ${
                            item.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 group-focus-visible:opacity-70'
                        }`} />
                </button>
            ))}
        </div>
    );
}

export default ViewTabs;
