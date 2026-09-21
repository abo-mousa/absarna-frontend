import { useId } from 'react';
import { Search, X } from 'lucide-react';
import { t } from '@/i18n';

/**
 * The one in-page "filter this list" box — the channel page's videos tab and the owner's
 * content dashboard both use it, so the two read as the same control rather than as two
 * separately-styled inputs that happen to do the same thing.
 *
 * Deliberately NOT `ui/Input`: that one is a *form field* with a floating label, which is the
 * wrong shape here. A filter box is an always-visible affordance whose label is its icon, and
 * a floating label would leave the placeholder text sitting on the border of a box a viewer is
 * meant to type into immediately.
 *
 * <p>`type="search"` rather than `text`, so a mobile keyboard offers a search key and the
 * browser's own clear affordance is available to people who expect it; the explicit clear
 * button stays because Firefox renders none and because clearing has to be reachable by
 * keyboard on every browser.
 *
 * <p>`form="none"`-style guard: the Escape key clears rather than closing anything, since this
 * box is never inside a dialog. Enter is a no-op — results are already live as you type, and
 * submitting would only reload the page.
 */
function SearchField({ value, onChange, placeholder, className = '', autoFocus = false }) {
    const id = useId();
    const hasValue = Boolean(value);

    return (
        // No `dir` of its own: it takes the page's, and every position below is logical, so the
        // icon leads and the clear button trails in either direction. It used to state
        // `dir="rtl"`, which on an LTR build would have pinned this one box backwards.
        <div className={`relative ${className}`}>
            <Search
                size={18}
                aria-hidden="true"
                className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
                id={id}
                type="search"
                value={value}
                autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape' && hasValue) {
                        e.preventDefault();
                        onChange('');
                    }
                }}
                placeholder={placeholder}
                aria-label={placeholder}
                // `pe-10` only when the clear button is there to occupy that space — reserving it
                // unconditionally leaves a visible gap on an empty box. `appearance-none` drops
                // WebKit's own clear glyph, which would otherwise sit beside ours.
                className={`w-full appearance-none rounded-full border border-border bg-surface py-2.5 ps-10
                    ${hasValue ? 'pe-10' : 'pe-3.5'} text-[0.95rem] text-start outline-none
                    transition-colors focus:border-primary [&::-webkit-search-cancel-button]:hidden`}
            />
            {hasValue && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    aria-label={t('common.clearSearch')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted
                        hover:bg-surface-hover hover:text-text-secondary"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

export default SearchField;
