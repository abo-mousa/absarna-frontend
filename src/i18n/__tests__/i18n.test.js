import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { currentLocale, direction, isRtl, setActiveLocale, t, tOptional } from '@/i18n';
import { ar } from '@/i18n/ar';
import { TRANSLATED, en } from '@/i18n/en';

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

/**
 * The English catalog against the Arabic one.
 *
 * <p>Two assertions pulling in opposite directions, which is the point. English is being filled in
 * namespace by namespace, so an *absent* key is a planned state and must not fail; a *stale* key is
 * a bug in every case — it is either a typo or a string whose Arabic counterpart was renamed or
 * deleted, and because `t()` falls back to Arabic, neither one is visible by looking at a screen.
 */
describe('en.js against ar.js', () => {
    const flatten = (node, prefix = '') => Object.entries(node).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'string' ? [path] : flatten(value, path);
    });

    const arKeys = new Set(flatten(ar));
    const enKeys = flatten(en);

    it('has no key Arabic does not have', () => {
        // A stale or mistyped English key. Invisible at runtime: the screen falls back to Arabic
        // and looks exactly like a namespace nobody has translated yet.
        expect(enKeys.filter((key) => !arKeys.has(key))).toEqual([]);
    });

    it('is complete for every namespace it declares translated', () => {
        const declared = new Set(TRANSLATED);
        const have = new Set(enKeys);
        const missing = [...arKeys].filter((key) => declared.has(key.split('.')[0]) && !have.has(key));
        expect(missing).toEqual([]);
    });

    it('declares only namespaces that exist', () => {
        expect(TRANSLATED.filter((ns) => !(ns in ar))).toEqual([]);
    });

    /**
     * <b>The brand is not a translatable string.</b> «أَبْصَرْنا» is the name of the thing rather
     * than a word describing it, so it reads the same to every reader — the same rule the language
     * switcher's own labels follow. A wordmark that changes script between builds is two
     * identities, and the top of the page is the one place a reader checks they are still where
     * they think they are.
     *
     * <p>Pinned rather than trusted, because "Absarna" is exactly what a translator reaches for and
     * nothing about it looks wrong on the screen it appears on.
     */
    it('carries the brand unchanged, never transliterated', () => {
        for (const key of ['nav.brand', 'nav.brandAlt', 'meta.defaultTitle', 'meta.titleSuffix']) {
            setActiveLocale('en');
            const english = t(key);
            setActiveLocale('ar');
            expect(english).toBe(t(key));
        }
    });

    it('names what is still outstanding', () => {
        // Not an assertion about the gap's size — that would turn every translation pass red on
        // its way to green. It prints the list, so `vitest --reporter=verbose` answers "what is
        // left" without anyone grepping two catalogs.
        const declared = new Set(TRANSLATED);
        const outstanding = Object.keys(ar).filter((ns) => !declared.has(ns));
        expect(Array.isArray(outstanding)).toBe(true);
        if (outstanding.length) console.info(`[i18n] not translated yet: ${outstanding.join(', ')}`);
    });
});

/**
 * Switching locale, and the fallback that makes a partial catalog safe.
 *
 * <p>Every test here restores Arabic afterwards, because `setActiveLocale` is module state: this
 * file's other suites assert against `ar` and would start failing in whatever order vitest happened
 * to run them in.
 */
describe('the active locale', () => {
    afterEach(() => setActiveLocale('ar'));

    it('serves the English catalog once switched', () => {
        setActiveLocale('en');
        expect(t('common.save')).toBe(en.common.save);
        expect(direction()).toBe('ltr');
        expect(isRtl()).toBe(false);
    });

    it('falls back to Arabic for a key English does not have', () => {
        setActiveLocale('en');
        // A namespace that is deliberately untranslated for now. Renders Arabic rather than the
        // dotted key — legible, obviously untranslated, and safe.
        expect(t('legal.terms.title')).toBe(ar.legal.terms.title);
    });

    it('still returns the key when neither catalog has it', () => {
        setActiveLocale('en');
        expect(t('nothing.here.at.all')).toBe('nothing.here.at.all');
        expect(tOptional('nothing.here.at.all')).toBeUndefined();
    });

    it('falls back to Arabic rather than accepting an unknown locale', () => {
        setActiveLocale('fr');
        expect(currentLocale()).toBe('ar');
        expect(direction()).toBe('rtl');
    });

    it('fills placeholders in the English catalog too', () => {
        setActiveLocale('en');
        expect(t('common.views', { count: 12 })).toBe('12 views');
    });
});
