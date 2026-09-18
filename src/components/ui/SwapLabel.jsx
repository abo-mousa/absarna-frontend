/**
 * Several wordings of one control, stacked in a single grid cell.
 *
 * <p>A control whose words change is re-measured by the browser every time they do — «نشر» to
 * «جاري الإرسال...», «مسح» to «جاري المسح...» — so the press that changes them also changes the
 * button's width, moving it under the finger that just pressed it and shoving whatever sits beside
 * it sideways. Then it all moves back. That is the whole of what "the button glitches" is.
 *
 * <p>Rendering every wording in the same cell makes the control as wide as its widest one and
 * constant from then on, whichever is showing.
 *
 * <p><b>`invisible`, not `hidden`</b>: the cell has to keep the width of the labels that are not
 * showing, which `display: none` would remove. `visibility: hidden` takes the text out of the
 * accessible tree just as thoroughly, so a screen reader still reads exactly one label.
 *
 * <p>`SubscribeButton` does the same thing by hand rather than through this, because which of its
 * faces shows is decided by `group-hover`/`group-focus-visible` in CSS and not by a prop — there
 * is no `showing` to pass.
 *
 * @param faces   the wordings, keyed by name
 * @param showing which key is visible
 */
function SwapLabel({ faces, showing, className = '' }) {
    return (
        <span className={`grid place-items-center ${className}`}>
            {Object.entries(faces).map(([key, label]) => (
                <span
                    key={key}
                    className={`col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap
                        ${key === showing ? '' : 'invisible'}`}
                >
                    {label}
                </span>
            ))}
        </span>
    );
}

export default SwapLabel;
