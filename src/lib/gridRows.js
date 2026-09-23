/**
 * The home page's "for you" view, cut into complete grid rows.
 *
 * <p><b>Why the page sizes alone cannot do it.</b> The grid is 1, 2, 3 or 4 columns wide depending
 * on the screen, so no count the backend picks is a whole number of rows everywhere — discover's 8
 * is two rows at four columns and two-and-two-thirds at three. And the counts are not fixed anyway:
 * subscribed and featured return what exists, and the tail loses whatever the sections above already
 * showed, so a page of 12 arrives as 11. A ragged last row under full ones reads as a page that ran
 * out of content, on a catalogue that has thousands of videos. So the rows are made to fit the grid
 * that is actually on screen, here, where the column count is known.
 *
 * <p><b>Nothing is dropped; only moved or held back.</b>
 * <ul>
 *   <li><b>Discover</b> is topped up to a full row from the front of the tail. Both are general
 *       suggestions, so a video crossing from one to the other is not mislabelled.</li>
 *   <li><b>Subscribed and featured</b> are never padded: a video from a channel the reader does not
 *       follow is not "from your subscriptions", and nobody featured it. Their short last row moves to
 *       the front of the tail instead, where it is still the first thing below. A section with less
 *       than one row is left alone — trimming it would hide the section, and a single short row does
 *       not look unfinished.</li>
 *   <li><b>The tail</b> shows complete rows while more pages exist; the remainder waits for the next
 *       page and appears in its place, in order. On the last page everything is shown.</li>
 * </ul>
 *
 * <p>Pure, so the arithmetic is tested without a browser; {@code useGridColumns} supplies the width.
 */
const FILL_FROM_TAIL = new Set(['discover']);

export function fitFeedToRows({ sections, tail, columns, tailComplete }) {
    const cols = Math.max(1, columns | 0);
    let remaining = [...tail];
    const spilled = [];
    const fitted = sections.map(({ key, items }) => {
        const shortBy = items.length % cols;
        if (shortBy === 0) return { key, items };
        const gap = cols - shortBy;
        if (FILL_FROM_TAIL.has(key) && remaining.length >= gap) {
            const filled = [...items, ...remaining.slice(0, gap)];
            remaining = remaining.slice(gap);
            return { key, items: filled };
        }
        if (items.length < cols) return { key, items };
        spilled.push(...items.slice(items.length - shortBy));
        return { key, items: items.slice(0, items.length - shortBy) };
    });

    const allTail = [...spilled, ...remaining];
    const visible = tailComplete ? allTail : allTail.slice(0, allTail.length - (allTail.length % cols));
    return { sections: fitted, tail: visible, heldBack: allTail.length - visible.length };
}
