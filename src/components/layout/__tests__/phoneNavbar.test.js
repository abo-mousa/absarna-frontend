import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accountMenuActions } from '@/components/layout/AccountMenu';
import { canUpload, uploadPathFor } from '@/lib/user';
import { t } from '@/i18n';

/**
 * The phone navbar. Pure-function tests, as elsewhere in this repo (no jsdom).
 *
 * <p>The regression being guarded: below `md` the bar held every control in one unwrapping row,
 * and the search box — the only item allowed to shrink — was squeezed to nothing. The fix takes
 * controls out of the phone's bar and puts them in the account menu, which is only a fix while
 * every one of them actually arrives there: a control
 * hidden from the bar and forgotten there is unreachable on a phone, and nothing on a desktop
 * would show it.
 */

const admin = { role: 'PLATFORM_ADMIN' };
const creator = { role: 'CREATOR' };
const viewer = { role: 'USER' };

describe('accountMenuActions', () => {
    it('gives a platform admin every account control', () => {
        expect(accountMenuActions(admin)).toEqual(['profile', 'upload', 'admin', 'theme', 'language', 'logout']);
    });

    it('offers upload to a creator and not the admin panel', () => {
        expect(accountMenuActions(creator)).toEqual(['profile', 'upload', 'theme', 'language', 'logout']);
    });

    it('offers a plain account its profile, the settings and sign-out', () => {
        expect(accountMenuActions(viewer)).toEqual(['profile', 'theme', 'language', 'logout']);
    });

    it('offers a visitor sign-in first, then registration and the settings', () => {
        expect(accountMenuActions(null, false)).toEqual(['login', 'register', 'theme', 'language']);
    });

    /**
     * The pairing itself. Every button `Navbar` hides below `md` uses `desktopIconButtonClass`:
     * a creator's upload, and a visitor's theme and language. Each must be in the menu for the
     * state it belongs to, or a phone cannot press it. A button added to the bar that way, and
     * not to the menu, changes the count and fails here.
     */
    it('puts every button the navbar hides on a phone into the menu', () => {
        const navbar = readFileSync('src/components/layout/Navbar.jsx', 'utf8');
        const hidden = [...navbar.matchAll(/className=\{`?\$?\{?desktopIconButtonClass/g)].length;
        expect(hidden).toBe(3);
        expect(accountMenuActions(creator)).toContain('upload');
        expect(accountMenuActions(null, false)).toEqual(expect.arrayContaining(['theme', 'language']));
    });

    it('hides the visitor sign-in buttons only where the menu offers them', () => {
        const navbar = readFileSync('src/components/layout/Navbar.jsx', 'utf8');
        for (const to of ['/login', '/register']) {
            expect(navbar).toMatch(new RegExp(`<Link to="${to}" className="hidden md:block`));
        }
    });
});

describe('strings', () => {
    it('labels the phone controls with strings the catalog has', () => {
        for (const key of ['nav.closeSearch', 'nav.accountMenu', 'searchBar.label']) {
            expect(t(key)).not.toBe(key);
        }
    });
});

describe('upload shortcut', () => {
    it('is for accounts that can publish', () => {
        expect(canUpload(creator)).toBe(true);
        expect(canUpload({ role: 'CHANNEL_ADMIN' })).toBe(true);
        expect(canUpload(admin)).toBe(true);
        expect(canUpload(viewer)).toBe(false);
        expect(canUpload(null)).toBe(false);
    });

    it('leads to the first owned channel, or to creating one', () => {
        expect(uploadPathFor([{ slug: 'tafsir' }, { slug: 'fiqh' }])).toBe('/channel/tafsir/manage');
        expect(uploadPathFor([])).toBe('/create-channel');
        expect(uploadPathFor(undefined)).toBe('/create-channel');
    });
});
