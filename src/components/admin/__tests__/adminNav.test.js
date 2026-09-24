import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@/components/admin/AdminNav';
import { t } from '@/i18n';

/**
 * The admin section's menu. Pure-function tests, as elsewhere in this repo (no jsdom).
 *
 * <p>The regression being guarded is a navigation dead end: the row of links lived only on
 * `/admin`, so pressing any of them landed on a page that rendered no admin navigation at all —
 * and two of those pages carry no sidebar either, so nothing on screen led anywhere. The browser's
 * Back button was the only way out, which reads as "the buttons disappeared".
 */

describe('AdminNav sections', () => {
    it('names each destination once', () => {
        const ids = SECTIONS.map((s) => s.id);
        const paths = SECTIONS.map((s) => s.to);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it('labels every entry with a string the catalog actually has', () => {
        // `t` returns the key itself when a string is missing, which on screen is a nav full of
        // «admin.review.title» rather than a visibly broken page — worth catching here.
        for (const section of SECTIONS) {
            expect(t(section.labelKey)).not.toBe(section.labelKey);
        }
    });

    /**
     * The guard that matters. A fifth admin screen added to the router without an entry here is
     * the same dead end again, and nothing about adding a route makes its absence visible.
     */
    it('covers every admin route the router defines', () => {
        const app = readFileSync('src/App.jsx', 'utf8');
        const routed = [...app.matchAll(/path="(\/admin[^"]*)"/g)].map((m) => m[1]);
        // A redirect kept for old links is not a destination — it has no page of its own.
        const redirects = [...app.matchAll(/path="(\/admin[^"]*)"\s+element=\{<Navigate/g)]
            .map((m) => m[1]);
        const destinations = routed.filter((path) => !redirects.includes(path));

        expect(destinations.length).toBeGreaterThan(0);
        expect(new Set(SECTIONS.map((s) => s.to))).toEqual(new Set(destinations));
    });

    /** Every count a tab names is one the attention endpoint returns — a typo would badge nothing, silently. */
    it('names only counts the attention endpoint returns', () => {
        const returned = ['pendingChannels', 'reviewBacklog', 'openReports', 'total'];
        for (const section of SECTIONS.filter((s) => s.countKey)) {
            expect(returned).toContain(section.countKey);
        }
        expect(t('admin.nav.waiting', { label: 'x', count: 3 })).not.toBe('admin.nav.waiting');
    });
});
