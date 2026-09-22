import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { currentLocale, direction, formatDigits, isRtl, normalizeDigits, setActiveLocale, t, tData, tOptional } from '@/i18n';
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
        // The default locale is Arabic, so a NUMBER arrives in Arabic digits — see the rule below.
        expect(t('common.views', { count: 12 })).toContain('١٢');
        expect(t('search.heading', { query: 'ابن تيمية' })).toContain('ابن تيمية');
    });

    /**
     * <b>A number is the app's, a string is somebody's.</b> Everything the app counts or numbers
     * arrives as a number and reads in the locale's digits; everything a person wrote arrives as a
     * string and is nobody's to rewrite. That split is the entire rule about digits, and it is
     * enforced here rather than at ~40 call sites.
     */
    it('localises a numeric placeholder and never a string one', () => {
        expect(t('common.views', { count: 12 })).toContain('١٢');
        // A title carrying Latin digits is the case this protects: it is the owner's text.
        expect(t('home.deleteVideoConfirm', { title: 'Lecture 103' })).toContain('Lecture 103');
        // And a count already grouped by `formatCount` arrives as a string, carrying digits it has
        // localised itself — a second pass would find no ASCII in it anyway.
        expect(t('common.views', { count: '١٬٩٤٣' })).toContain('١٬٩٤٣');

        setActiveLocale('en');
        try {
            expect(t('common.views', { count: 12 })).toContain('12');
        } finally {
            setActiveLocale('ar');
        }
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
        expect(t('common.videoCount', { count: 0 })).toContain('٠');
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
/**
 * The legal documents are the one part of the catalog that is structure rather than sentences, and
 * the one part `t()` cannot serve. The bug this pins was invisible from the catalog: `en.js` was
 * complete and correct, and the pages rendered Arabic anyway, because all three imported `{ ar }`
 * and read `ar.legal.terms` out of it directly.
 */
describe('tData', () => {
    afterEach(() => setActiveLocale('ar'));

    it('returns the document for the active locale', () => {
        setActiveLocale('en');
        expect(tData('legal.terms')).toBe(en.legal.terms);
        setActiveLocale('ar');
        expect(tData('legal.terms')).toBe(ar.legal.terms);
    });

    it('serves all three documents in both languages', () => {
        for (const locale of ['ar', 'en']) {
            setActiveLocale(locale);
            for (const name of ['privacy', 'terms', 'contact']) {
                const doc = tData(`legal.${name}`);
                expect(doc, `${name} in ${locale}`).toBeTruthy();
                expect(doc.sections.length, `${name} sections in ${locale}`)
                    .toBe(ar.legal[name].sections.length);
            }
        }
    });

    it('refuses to hand back a string, so a node caller never renders one', () => {
        // `t()` answers with the key for a non-string; this is the mirror of that rule.
        expect(tData('legal.contentsHeading')).toBeUndefined();
        expect(tData('nothing.here')).toBeUndefined();
    });
});

/**
 * The two halves of the digit rule that are NOT grouping. `formatDigits` is for a number that is a
 * label — a page, an index, a year — where `Intl` would wrongly group it; `normalizeDigits` reads
 * one back out of something a person typed.
 */
describe('formatDigits and normalizeDigits', () => {
    afterEach(() => setActiveLocale('ar'));

    it('maps glyphs without grouping, so a year stays a year', () => {
        setActiveLocale('ar');
        expect(formatDigits(2026)).toBe('٢٠٢٦');
        expect(formatDigits(3)).toBe('٣');
        // The whole point of not going through Intl here: «٢٬٠٢٦» is not a year.
        expect(formatDigits(2026)).not.toContain('٬');
        // Non-digits are left exactly as they are, which is what lets a clock through.
        expect(formatDigits('45:30')).toBe('٤٥:٣٠');
    });

    it('is identity on the English build', () => {
        setActiveLocale('en');
        expect(formatDigits(2026)).toBe('2026');
        expect(formatDigits('45:30')).toBe('45:30');
    });

    it('is idempotent, since a value may pass through more than one layer', () => {
        setActiveLocale('ar');
        expect(formatDigits(formatDigits(1234))).toBe('١٢٣٤');
    });

    /**
     * <b>Accepts either script, whatever the locale.</b> The PDF reader's page box is the caller:
     * its value is shown in Arabic digits but a reader may type on a Latin keyboard, and refusing
     * one of the two would be a worse answer than accepting both.
     */
    it('reads a number back from either script', () => {
        expect(normalizeDigits('٩٩')).toBe('99');
        expect(normalizeDigits('99')).toBe('99');
        expect(normalizeDigits('١٠٣')).toBe('103');
        expect(parseInt(normalizeDigits('٤٢'), 10)).toBe(42);
        // Non-digits survive, so the caller still has to parse.
        expect(normalizeDigits('صفحة ٥')).toBe('صفحة 5');
        expect(normalizeDigits(null)).toBe('');
    });
});

describe('the active locale', () => {
    afterEach(() => setActiveLocale('ar'));

    it('serves the English catalog once switched', () => {
        setActiveLocale('en');
        expect(t('common.save')).toBe(en.common.save);
        expect(direction()).toBe('ltr');
        expect(isRtl()).toBe(false);
    });

    /**
     * <b>No dotted key can ever reach a screen on the English build.</b> This used to name a
     * namespace that was deliberately untranslated and assert it rendered Arabic; every namespace
     * is translated now, so there is no such example left to point at — and pinning one would mean
     * pinning a gap, which is the opposite of what this file is for.
     *
     * <p>Walking every Arabic key under the English locale is the stronger property and it
     * maintains itself: it passes today because `en.js` is complete, and it will still pass on the
     * day somebody adds a key to `ar.js` alone, because `t()` falls back. What it refuses is the
     * third case — a key in neither — which is the only one that puts `legal.terms.titel` in the
     * middle of a page.
     */
    it('never renders a dotted key on the English build', () => {
        setActiveLocale('en');
        const flat = (node, prefix = '') => Object.entries(node).flatMap(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            return typeof value === 'string' ? [path] : flat(value, path);
        });
        expect(flat(ar).filter((key) => t(key) === key)).toEqual([]);
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
