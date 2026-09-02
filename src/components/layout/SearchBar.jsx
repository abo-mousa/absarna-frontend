import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/useVideos';
import { useOutsideClick } from '@/hooks/useOutsideClick';

function SearchBar() {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    const { data: suggestions = [], isFetching, isError } = useSearchSuggestions(query, 8, open);
    // Only "no matches" once a fetch for the current query has actually settled — otherwise
    // a debounce-triggered refetch would flash this message before the real result lands.
    // Distinct from isError (a genuinely failed request) so a network hiccup isn't mislabeled
    // as "nothing matches".
    const showNoMatches = open && query.trim() && !isFetching && !isError && suggestions.length === 0;

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
                    placeholder="ابحث..."
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
                    aria-label="بحث"
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
                    لا توجد نتائج مطابقة لـ "{query.trim()}"
                </div>
            )}
        </div>
    );
}

export default SearchBar;
