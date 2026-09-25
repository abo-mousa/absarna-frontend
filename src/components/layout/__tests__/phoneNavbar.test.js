import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accountMenuActions } from '@/components/layout/AccountMenu';
import { uploadPathFor } from '@/lib/navigation';
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

// As the profile now describes them: the rights are the backend's (Capabilities), sent as flags.
const admin = { role: 'PLATFORM_ADMIN', platformAdmin: true, canUpload: true };
const creator = { role: 'CREATOR', platformAdmin: false, canUpload: true };
const viewer = { role: 'USER', platformAdmin: false, canUpload: false };

describe('accountMenuActions', () => {
    it('gives a platform admin every account control', () => {
        expect(accountMenuActions(admin)).toEqual(['profile', 'history', 'bookmarks', 'upload', 'admin', 'theme', 'language', 'logout']);
    });

    it('offers upload to a creator and not the admin panel', () => {
        expect(accountMenuActions(creator)).toEqual(['profile', 'history', 'bookmarks', 'upload', 'theme', 'language', 'logout']);
    });

    it('offers a plain account its profile, the settings and sign-out', () => {
        expect(accountMenuActions(viewer)).toEqual(['profile', 'history', 'bookmarks', 'theme', 'language', 'logout']);
    });

    it('offers a visitor sign-in first, then registration and the settings', () => {
        expect(accountMenuActions(null, false)).toEqual(['login', 'register', 'theme', 'language']);
    });

    /**
     * The pairing itself. Every button `Navbar` hides below `md` uses `desktopIconButtonClass`:
     * a creator's upload, a platform admin's panel, and a visitor's theme and language. Each must
     * be in the menu for the state it belongs to, or a phone cannot press it. A button added to
     * the bar that way, and not to the menu, changes the count and fails here.
     */
    it('puts every button the navbar hides on a phone into the menu', () => {
        const navbar = readFileSync('src/components/layout/Navbar.jsx', 'utf8');
        const hidden = [...navbar.matchAll(/className=\{`?\$?\{?desktopIconButtonClass/g)].length;
        expect(hidden).toBe(4);
        expect(accountMenuActions(creator)).toContain('upload');
        expect(accountMenuActions(admin)).toContain('admin');
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
    // Who is offered it is the backend's (CapabilitiesTest); only the route is this app's.
    it('leads to the channel the backend names, or to creating one', () => {
        expect(uploadPathFor({ uploadChannelSlug: 'tafsir' })).toBe('/channel/tafsir/manage');
        expect(uploadPathFor({ uploadChannelSlug: '' })).toBe('/create-channel');
        expect(uploadPathFor(null)).toBe('/create-channel');
    });

    it('follows the flags, not the role', () => {
        // A role the backend has not granted upload to is not offered it, whatever its name.
        expect(accountMenuActions({ role: 'CREATOR', canUpload: false })).not.toContain('upload');
        expect(accountMenuActions({ role: 'USER', platformAdmin: true, canUpload: true })).toContain('admin');
    });
});

describe('admin badge', () => {
    it('shows nothing at zero, the number up to 99, then 99+', async () => {
        const { badgeText } = await import('@/hooks/useAdminAttention');
        expect(badgeText(0)).toBeNull();
        expect(badgeText(undefined)).toBeNull();
        // In the interface's digits — the test runs the Arabic build, like every visitor by default.
        const { formatCount } = await import('@/lib/numbers');
        expect(badgeText(7)).toBe(formatCount(7));
        expect(badgeText(99)).toBe(formatCount(99));
        expect(badgeText(100)).toBe(`${formatCount(99)}+`);
    });
});
