/**
 * The app's places, and which one a URL belongs to — shared by the desktop tab strip in the
 * navbar and the phone's bottom tab bar, so the two can never disagree about where the reader is.
 *
 * <p>Six on a wide screen; five on a phone, where Books and Articles are one «اقرأ» tab (a phone
 * bar holds five comfortably, and the two are the same act). A detail page belongs to the tab its
 * list lives under — a book to Books, a channel to Channels — so the bar keeps saying where the
 * reader came from.
 */
export const TABS = [
    { key: 'today', to: '/' },
    { key: 'discover', to: '/discover' },
    { key: 'books', to: '/books' },
    { key: 'articles', to: '/articles' },
    { key: 'posts', to: '/posts' },
    { key: 'channels', to: '/channels' },
    // «طريقي» — a seventh place on a wide screen; on a phone the bar is full, so it is in the
    // account menu and on Today (PROGRESS-AND-GOALS.md D1's default).
    { key: 'journey', to: '/journey' },
];

export const PHONE_TABS = [
    { key: 'today', to: '/' },
    { key: 'discover', to: '/discover' },
    { key: 'read', to: '/books' },
    { key: 'posts', to: '/posts' },
    { key: 'channels', to: '/channels' },
];

const startsWith = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * The tab `pathname` belongs to, or null for a page under none of them (a video, the profile,
 * the admin screens) — which then highlights nothing rather than the wrong thing.
 */
export function activeTab(pathname, { phone = false } = {}) {
    const path = pathname || '/';
    if (path === '/') return 'today';
    if (startsWith(path, '/discover')) return 'discover';
    if (startsWith(path, '/books')) return phone ? 'read' : 'books';
    if (startsWith(path, '/articles')) return phone ? 'read' : 'articles';
    if (startsWith(path, '/posts')) return 'posts';
    // The record (and /history, which redirects to it) is the journey's.
    if (startsWith(path, '/journey') || startsWith(path, '/history')) return phone ? null : 'journey';
    if (startsWith(path, '/channels') || startsWith(path, '/channel') || startsWith(path, '/subscriptions')
        || startsWith(path, '/series')) {
        return 'channels';
    }
    return null;
}
