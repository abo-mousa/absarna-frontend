import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { phoneMenuActions } from '@/components/layout/SideBar';
import { canUpload, uploadPathFor } from '@/lib/user';
import { t } from '@/i18n';

/**
 * The phone navbar. Pure-function tests, as elsewhere in this repo (no jsdom).
 *
 * <p>The regression being guarded: below `md` the bar held every control in one unwrapping row,
 * and the search box — the only item allowed to shrink — was squeezed to nothing. The fix moves
 * five controls out of the phone's bar and into the drawer, which is only a fix while every one
 * of them is actually IN the drawer: a control hidden from the bar and forgotten here is
 * unreachable on a phone, and nothing on a desktop would show it.
 */

const admin = { role: 'PLATFORM_ADMIN' };
const creator = { role: 'CREATOR' };
const viewer = { role: 'USER' };

describe('phoneMenuActions', () => {
    it('gives a platform admin every control the phone bar drops', () => {
        expect(phoneMenuActions(admin, true)).toEqual(['upload', 'admin', 'theme', 'language', 'logout']);
    });

    it('offers upload to a creator and not the admin panel', () => {
        expect(phoneMenuActions(creator, true)).toEqual(['upload', 'theme', 'language', 'logout']);
    });

    it('offers a plain account the settings and sign-out only', () => {
        expect(phoneMenuActions(viewer, true)).toEqual(['theme', 'language', 'logout']);
    });

    it('offers a visitor registration and the settings, never sign-out', () => {
        expect(phoneMenuActions(null, false)).toEqual(['register', 'theme', 'language']);
    });

    /**
     * The pairing itself. Every control `Navbar` hides below `md` uses `desktopIconButtonClass`;
     * a signed-in platform admin sees all of them on a wide screen, so the drawer must offer that
     * account exactly as many. A sixth control added to the bar that way, and not here, fails.
     */
    it('matches every control the navbar hides on a phone', () => {
        const navbar = readFileSync('src/components/layout/Navbar.jsx', 'utf8');
        const hidden = [...navbar.matchAll(/className=\{`?\$?\{?desktopIconButtonClass/g)].length;
        expect(hidden).toBe(phoneMenuActions(admin, true).length);
    });

    it('labels the phone search with strings the catalog has', () => {
        expect(t('nav.closeSearch')).not.toBe('nav.closeSearch');
        expect(t('searchBar.label')).not.toBe('searchBar.label');
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
