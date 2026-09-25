import { CalendarCheck, Compass, BookOpen, MessageSquareText, Users, Megaphone } from 'lucide-react';

/**
 * The guide's steps, in the order a newcomer meets them: what Absarna is for, then each place in
 * the tab bar, then the marks a video can carry. Wording is `guide.steps.<key>.*`; `to` is the
 * place the step describes, for the full page's "open" link. Shared by the first-visit dialog and
 * the /guide page so the two can never describe different sites.
 */
export const GUIDE_STEPS = [
    { key: 'welcome', icon: null },
    { key: 'today', icon: CalendarCheck, to: '/' },
    { key: 'discover', icon: Compass, to: '/discover' },
    { key: 'read', icon: BookOpen, to: '/books' },
    { key: 'posts', icon: MessageSquareText, to: '/posts' },
    { key: 'channels', icon: Users, to: '/channels' },
    { key: 'voice', icon: Megaphone },
];

/** Set once the first-visit dialog has been closed, so it never opens by itself again. */
export const GUIDE_SEEN_KEY = 'absarna.guideSeen';
