import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAGE_GUIDES, PAGE_GUIDE_ORDER, blockKey, guideBySlug } from '../pageGuides';
import shots from '../guideShots.json';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

/**
 * The page guides are three things that must agree and that nothing else ties together: the
 * registry (what each guide shows), the screenshots and their measured marks (written by
 * `npm run guide:shots`), and the wording in both catalogs. A caption without its mark, a mark
 * without its caption, or a picture missing for one theme would all render — just wrongly.
 */
const LOCALES = { ar, en };
const lookup = (catalog, key) => key.split('.').reduce((node, part) => node?.[part], catalog);
const blocks = PAGE_GUIDE_ORDER.flatMap((id) => PAGE_GUIDES[id].blocks.map((block) => ({ id, block })));

function sources(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path);
        return /\.jsx?$/.test(name) ? [readFileSync(path, 'utf8')] : [];
    });
}

describe('page guides', () => {
    it('lists every guide once, under a unique slug', () => {
        expect([...PAGE_GUIDE_ORDER].sort()).toEqual(Object.keys(PAGE_GUIDES).sort());
        const slugs = PAGE_GUIDE_ORDER.map((id) => PAGE_GUIDES[id].slug);
        expect(new Set(slugs).size).toBe(slugs.length);
        for (const id of PAGE_GUIDE_ORDER) expect(guideBySlug(PAGE_GUIDES[id].slug)).toBe(id);
    });

    it('has a screenshot, in both locales, for every picture a guide shows', () => {
        for (const { block } of blocks) {
            for (const name of block.shots || (block.shot ? [block.shot] : [])) {
                expect(shots[name], name).toBeDefined();
                expect(Object.keys(shots[name]).sort(), name).toEqual(['ar', 'en']);
            }
        }
    });

    it('numbers exactly as many captions as the capture script measured marks', () => {
        for (const { block } of blocks.filter(({ block: candidate }) => candidate.type === 'shot')) {
            for (const locale of ['ar', 'en']) {
                expect(shots[block.shot][locale].marks.length, `${block.shot} (${locale})`).toBe(block.marks);
            }
        }
    });

    it('keeps every mark inside its picture', () => {
        for (const [name, entry] of Object.entries(shots)) {
            for (const [locale, { marks }] of Object.entries(entry)) {
                for (const [x, y, w, h] of marks) {
                    expect(x >= -1 && y >= -1 && x + w <= 101 && y + h <= 101, `${name} (${locale})`).toBe(true);
                }
            }
        }
    });

    it('has the picture file for every locale and theme', () => {
        const root = join(process.cwd(), 'public/guide');
        for (const [name, entry] of Object.entries(shots)) {
            for (const [locale, { ext = 'png' }] of Object.entries(entry)) {
                for (const theme of ['light', 'dark']) {
                    expect(existsSync(join(root, locale, theme, `${name}.${ext}`)), `${locale}/${theme}/${name}`).toBe(true);
                }
            }
        }
    });

    it('has every word it shows in both catalogs', () => {
        for (const [code, catalog] of Object.entries(LOCALES)) {
            const missing = [];
            const need = (key) => { if (typeof lookup(catalog, key) !== 'string') missing.push(key); };
            for (const id of PAGE_GUIDE_ORDER) {
                need(`guide.pages.${id}.title`);
                need(`guide.pages.${id}.lede`);
                for (const question of PAGE_GUIDES[id].faq) {
                    need(`guide.pages.${id}.faq.${question}.q`);
                    need(`guide.pages.${id}.faq.${question}.a`);
                }
            }
            for (const { id, block } of blocks) {
                const key = blockKey(id, block);
                need(`${key}.title`);
                need(`${key}.text`);
                for (let i = 1; i <= (block.marks || 0); i++) need(`${key}.marks.${i}`);
                (block.shots || []).forEach((_, i) => { need(`${key}.steps.${i + 1}.title`); need(`${key}.steps.${i + 1}.text`); });
                if (block.type === 'legend') {
                    for (const state of ['FULL', 'MINIMUM', 'MADE_UP', 'REST', 'EXCUSED', 'PENDING']) need(`${key}.states.${state}`);
                }
            }
            expect(missing, code).toEqual([]);
        }
    });

    it('points «أرِني» only at parts of a page that exist', () => {
        const code = sources(join(process.cwd(), 'src')).join('\n');
        for (const { block } of blocks.filter(({ block: candidate }) => candidate.anchor)) {
            expect(code.includes(`data-guide="${block.anchor}"`), block.anchor).toBe(true);
        }
    });

    it('names a real page for every guide, and gives each «مسيرتي» page its button', () => {
        const code = sources(join(process.cwd(), 'src')).join('\n');
        for (const id of PAGE_GUIDE_ORDER) {
            expect(code.includes(`guide="${id}"`) || code.includes(`<PageGuideButton id="${id}"`), id).toBe(true);
        }
    });
});
