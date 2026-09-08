import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { t, tOptional } from '@/i18n';
import { ar } from '@/i18n/ar';

describe('t', () => {
    it('resolves a dotted key', () => {
        expect(t('common.save')).toBe(ar.common.save);
        expect(t('channelManage.forms.video.heading')).toBe(ar.channelManage.forms.video.heading);
    });

    it('returns the key itself when there is no string for it', () => {
        // Visibly wrong beats invisibly wrong: an empty string is a button with no label that
        // nobody notices in review, while the key on screen names its own bug.
        expect(t('common.definitelyNotAKey')).toBe('common.definitelyNotAKey');
        expect(t('nothing.here.at.all')).toBe('nothing.here.at.all');
    });

    it('does not return a namespace object as if it were a string', () => {
        // 'common' resolves to an object, which must not be rendered into JSX.
        expect(t('common')).toBe('common');
    });

    it('fills placeholders', () => {
        expect(t('common.views', { count: 12 })).toContain('12');
        expect(t('search.heading', { query: 'ابن تيمية' })).toContain('ابن تيمية');
    });

    it('fills the same placeholder everywhere it appears', () => {
        expect(t('search.emptyDescription', { query: 'x' })).not.toContain('{query}');
    });

    it('leaves a placeholder the caller did not supply as written', () => {
        // Better than the string "undefined": the literal {count} on screen says which value the
        // call site forgot to pass.
        expect(t('common.views', {})).toContain('{count}');
        expect(t('common.views', { count: null })).toContain('{count}');
    });

    it('treats zero as a value, not as missing', () => {
        expect(t('common.videoCount', { count: 0 })).toContain('0');
        expect(t('common.videoCount', { count: 0 })).not.toContain('{count}');
    });
});

describe('tOptional', () => {
    it('returns undefined instead of the key for a miss', () => {
        // The quality selector asks whether the catalog has a word for a rung name the worker
        // chose. "1080p" has none and should render as itself, so a miss is the normal case.
        expect(tOptional('video.qualityLabels.1080p')).toBeUndefined();
        expect(tOptional('video.qualityLabels.audio')).toBe(ar.video.qualityLabels.audio);
    });
});

/**
 * Walks the source for `t('some.key')` and checks every one resolves.
 *
 * <p><b>This is the test that makes the catalog safe to refactor.</b> A renamed or mistyped key is
 * otherwise invisible: `t()` returns the key, so the page still renders and the bug is a line of
 * dotted ASCII sitting in the middle of an Arabic screen that only a human looking at that exact
 * screen would catch. There is no type system here to do it instead.
 */
describe('every key used in the source exists in the catalog', () => {
    const SRC = new URL('../../', import.meta.url).pathname;
    // Literal keys only. A template literal is a runtime lookup (see qualityLabel) and is
    // deliberately allowed to miss — that is what tOptional is for.
    const KEY = /\bt(?:Optional)?\(\s*'([A-Za-z0-9_.]+)'/g;

    const walk = (dir) => readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) return walk(path);
        return path.endsWith('.js') || path.endsWith('.jsx') ? [path] : [];
    });

    const usages = walk(SRC)
        .filter((path) => !path.includes('/i18n/'))
        .flatMap((path) => [...readFileSync(path, 'utf8').matchAll(KEY)]
            .map((match) => ({ key: match[1], file: path.slice(SRC.length) })));

    it('finds the call sites at all', () => {
        // Guards the guard: a regex that matched nothing would make every assertion below pass
        // vacuously, which is the classic way a test like this rots into decoration.
        expect(usages.length).toBeGreaterThan(200);
    });

    it('resolves every one of them', () => {
        const missing = usages.filter(({ key }) => tOptional(key) === undefined);
        expect(missing).toEqual([]);
    });
});
