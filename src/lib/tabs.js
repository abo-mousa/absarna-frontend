/**
 * The app's places, and which one a URL belongs to — shared by the navbar's strip on a wide screen
 * and the phone's bottom bar, so the two can never disagree about where the reader is.
 *
 * <p>Five, and the same five at every width (product owner, 2026-09-29). The wide strip had seven
 * — Books, Articles and Posts each a tab — while the phone folded them, so a reader learned the
 * site twice. Now «اقرأ» holds all three behind one switch (`ReadSwitch`) everywhere, which is also
 * what gives «طلب العلم», the one place about the reader rather than the catalogue, a slot on a phone.
 * A detail page belongs to the tab its list lives under — a book to «اقرأ», a channel to Channels
 * — so the bar keeps saying where the reader came from.
 */
export const TABS = [
    { key: 'today', to: '/' },
    { key: 'discover', to: '/watch' },
    { key: 'read', to: '/books' },
    { key: 'channels', to: '/channels' },
    { key: 'journey', to: '/journey' },
];

/** «اقرأ»'s three sections, in the switch's order. */
export const READ_SECTIONS = [
    { key: 'books', to: '/books' },
    { key: 'articles', to: '/articles' },
    { key: 'posts', to: '/posts' },
];

const startsWith = (pathname, prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Which of «اقرأ»'s sections `pathname` is in, or null outside it. */
export function readSection(pathname) {
    const path = pathname || '/';
    return READ_SECTIONS.find((section) => startsWith(path, section.to))?.key ?? null;
}

/**
 * The tab `pathname` belongs to, or null for a page under none of them (a video, the profile,
 * the admin screens) — which then highlights nothing rather than the wrong thing.
 */
export function activeTab(pathname) {
    const path = pathname || '/';
    if (path === '/') return 'today';
    // «شاهد»; `/discover` is its old address, redirected (App.jsx).
    if (startsWith(path, '/watch') || startsWith(path, '/discover')) return 'discover';
    if (readSection(path)) return 'read';
    // The record (and /history, which redirects to it) is the journey's.
    if (startsWith(path, '/journey') || startsWith(path, '/history')) return 'journey';
    if (startsWith(path, '/channels') || startsWith(path, '/channel') || startsWith(path, '/subscriptions')
        || startsWith(path, '/series')) {
        return 'channels';
    }
    return null;
}
