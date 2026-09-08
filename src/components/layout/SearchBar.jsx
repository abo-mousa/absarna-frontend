import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/useVideos';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { t } from '@/i18n';

/**
 * Whether the dropdown may say "nothing matches <query>".
 *
 * Extracted and exported so the condition itself is testable: it is a claim about the user's
 * text, and it was making that claim about text nobody had searched for. `isFetching` is false
 * for the whole debounce window, so mid-typing the message quoted what was in the box while the
 * data underneath still answered an earlier keystroke — most visibly when the earlier query had
 * no matches and the current one does. `settled` is the query the suggestions actually answer;
 * unless it equals the input, nothing is known about the input yet.
 *
 * `isError` stays separate from an empty result so a failed request is not reported as "nothing
 * matches", which is a different thing and would send the user off to rephrase a fine query.
 */
export function shouldShowNoMatches({ open, input, settled, isFetching, isError, count }) {
    const typed = (input || '').trim();
    return Boolean(open && typed && settled === typed && !isFetching && !isError && count === 0);
}

function SearchBar() {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    const { data: suggestions = [], isFetching, isError, settledQuery } = useSearchSuggestions(query, 8, open);
    const showNoMatches = shouldShowNoMatches({
        open,
        input: query,
        settled: settledQuery,
        isFetching,
        isError,
        count: suggestions.length,
    });

    const goToSearch = (value) => {
        if (!value.trim()) return;
        navigate(`/search?q=${encodeURIComponent(value.trim())}`);
        setQuery('');
        setOpen(false);
        setHighlightIndex(-1);
    };

    const goToSuggestion = (item) => {
        navigate(`/video/${item.id}`);
        setQuery('');
        setOpen(false);
        setHighlightIndex(-1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (open && highlightIndex >= 0 && suggestions[highlightIndex]) {
            goToSuggestion(suggestions[highlightIndex]);
        } else {
            goToSearch(query);
        }
    };

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === 'Escape') {
            setOpen(false);
            setHighlightIndex(-1);
        }
    };

    // Closes the dropdown on an outside click. Suggestion rows use onMouseDown (fires
    // before this listener and before the input's blur) so a click still registers as
    // a selection instead of just closing the dropdown out from under it.
    const closeDropdown = useCallback(() => setOpen(false), []);
    useOutsideClick(containerRef, closeDropdown);

    return (
        <div ref={containerRef} className="w-full max-w-[500px] relative">
            <form
                onSubmit={handleSubmit}
                className="relative rounded-full transition-shadow duration-200 focus-within:shadow-md"
            >
                <input
                    type="text"
                    placeholder={t('searchBar.placeholder')}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setHighlightIndex(-1);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    className="peer w-full pr-10 pl-4 py-2 rounded-full border border-border bg-surface text-sm outline-none focus:border-primary transition-colors"
                />
                <button
                    type="submit"
                    aria-label={t('searchBar.label')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-primary peer-focus:text-primary"
                >
                    <Search size={16} />
                </button>
            </form>

            {open && suggestions.length > 0 && (
                <ul className="absolute top-[calc(100%+6px)] left-0 right-0 bg-surface border border-border-light rounded-lg shadow-lg overflow-hidden z-[1001] max-h-[70vh] overflow-y-auto">
                    {suggestions.map((item, index) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    goToSuggestion(item);
                                }}
                                onMouseEnter={() => setHighlightIndex(index)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-right text-sm transition-colors
                                    ${index === highlightIndex ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                            >
                                <Search size={14} className="text-text-muted flex-shrink-0" />
                                <span className="truncate text-text-primary">{item.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {showNoMatches && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-surface border border-border-light rounded-lg shadow-lg z-[1001] px-3 py-4 text-center text-sm text-text-muted">
                    {t('searchBar.noMatches', { query: settledQuery })}
                </div>
            )}
        </div>
    );
}

export default SearchBar;
