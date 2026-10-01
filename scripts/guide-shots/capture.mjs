#!/usr/bin/env node
/**
 * Takes the page guides' screenshots from the real app (components/guide).
 *
 *   ../absarna-backend/infra/local/seed-journey-demo.sh   # a lived-in «طريقي» for the demo reader
 *   npm run dev                                           # the SPA on :5173, the API on :8080
 *   npm run guide:shots                                   # this script (or `-- name …` for some)
 *
 * For every shot below it opens the page as the demo reader at phone width, crops the element
 * named by its `data-guide` anchor, and writes one PNG per locale and theme to
 * `public/guide/{locale}/{theme}/{name}.png`. It also measures each callout — the boxes the
 * guide's numbered marks point at — relative to the crop, per locale (the layout mirrors, so an
 * Arabic mark and an English one are not at the same place), into
 * `src/components/guide/guideShots.json`. The marks are measured, never placed by hand, so a
 * rerun after a layout change moves them with the layout.
 *
 * Local only: it signs in as the seed script's demo reader and refuses any other API.
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ar } from '../../src/i18n/ar.js';
import { en } from '../../src/i18n/en.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const API = process.env.API || 'http://localhost:8080';
const SPA = process.env.SPA || 'http://localhost:5173';
for (const url of [API, SPA]) {
    if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(url)) throw new Error(`Refusing: ${url} is not local`);
}
const USER = 'demo';
const PASSWORD = process.env.DEMO_PASSWORD || 'DemoReader2026!';
const LOCALES = { ar, en };
const THEMES = ['light', 'dark'];
const VIEWPORT = { width: 420, height: 900 };
const only = process.argv.slice(2);
/** The zone the shots are taken in unless a shot names a part of the day. */
const HOME_ZONE = 'Asia/Riyadh';

/**
 * Today's portions change state with the clock — a make-up card before noon, «أضِفه إلى يومك» after
 * it, a portion moved to its evening time — and the backend decides those states from the zone the
 * SPA sends, not from any clock a browser could fake. So a shot that needs a time of day is taken
 * in a zone where it IS that time of day now: one of the fixed-offset zones (`Etc/GMT-3` is UTC+3;
 * the sign is POSIX's, reversed), which every browser and the backend both accept, on the same
 * calendar date as this machine, since the seed wrote the reader's days against its date. Run it
 * between 06:00 and 21:00 local: in the small hours no zone is in a morning of today's date.
 */
const OFFSET_ZONES = Array.from({ length: 27 }, (_, i) => {
    const offset = i - 12;
    return offset === 0 ? 'Etc/GMT' : `Etc/GMT${offset > 0 ? '-' : '+'}${Math.abs(offset)}`;
});
const PARTS = { morning: [4, 12], afternoon: [12, 18], evening: [18, 24] };
function dateAndHour(zone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type).value;
    return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}
function zoneWhere(part) {
    const [from, to] = PARTS[part];
    const today = dateAndHour(Intl.DateTimeFormat().resolvedOptions().timeZone).date;
    const zone = OFFSET_ZONES.find((candidate) => {
        const { date, hour } = dateAndHour(candidate);
        return date === today && hour >= from && hour < to;
    });
    if (!zone) throw new Error(`No zone is in the ${part} of ${today} right now; run the shots between 06:00 and 21:00`);
    return zone;
}

/** A first-portion card for a reader with no goal, built as TodayProgress#firstWird builds it. */
function withoutGoals(today) {
    const proposals = [];
    const watching = (today.continueWatching || []).find((item) => item.next?.seriesId);
    if (watching) {
        proposals.push({ kind: 'FINISH_SERIES', targetId: watching.next.seriesId, title: watching.next.seriesTitle, amount: 1, measure: 'EPISODES' });
    }
    const reading = (today.continueReading || []).find((entry) => entry.book?.pages > (entry.currentPage || 0));
    if (reading) {
        proposals.push({ kind: 'FINISH_BOOK', targetId: reading.bookId, title: reading.book.title,
            amount: Math.max(1, Math.ceil((reading.book.pages - (reading.currentPage || 0)) / 30)), measure: 'PAGES' });
    }
    proposals.push({ kind: 'HABIT', targetId: null, title: null, amount: 15, measure: 'MINUTES' });
    return { ...today, wird: { goals: [], firstWird: proposals }, recentMilestones: [] };
}

/**
 * The shots. `anchor` is the element's `data-guide` (or `crop`, a selector); `marks` are selectors
 * inside it, in the order of the guide's captions (`{ sel, nth }` for the nth match, `all` for the
 * union of every match — a column of names — and `box` for the element's box rather than what is
 * drawn in it, for a bar whose fill is shorter than its track). Only matches on screen count: the
 * phone and the wide layout of a chart are often both in the page, one of them hidden. `until` ends the crop at the
 * bottom of a child; `maxHeight` cuts a tall one (from its top, or centred on `around`);
 * `before` runs before the page loads (to intercept a request) and `prepare` before cropping; `jpeg`
 * is for a shot made mostly of photographs. `fixed` is for something pinned to the screen (a dialog): it is
 * taken from the screen as it is, since a full-page capture stretches the screen to the page's
 * height and a pinned dialog re-centres in it.
 */
const SHOTS = [
    { name: 'intention', path: '/journey', anchor: 'intention', marks: [':scope > p', 'li.bg-primary-light', { sel: ':scope > p', nth: 1 }] },
    {
        name: 'goal-card', path: '/journey', crop: '[data-guide="goals"] a[href^="/journey/goals/"]',
        marks: ['p.font-bold', 'span[class*="border-gold"]', 'ul', '[role="img"]', 'span[title]', 'p.justify-between > span:last-child'],
    },
    { name: 'almost', path: '/journey', anchor: 'almost', marks: ['a svg', 'a p.text-xs'] },
    { name: 'steady', path: '/journey', anchor: 'steady', marks: ['li:last-child', 'p.text-sm'] },
    { name: 'month', path: '/journey', anchor: 'month', marks: [':scope > div > div:first-child'] },
    { name: 'shelf', path: '/journey', anchor: 'shelf', marks: ['li:first-child a'] },
    {
        // The review opens only after Jumu'ah: the page is told it is open, in this browser only.
        name: 'review', path: '/journey', anchor: 'review', marks: ['h2', 'button'],
        before: (page) => page.route('**/api/user/review/current**', async (route) => {
            const response = await route.fetch();
            route.fulfill({ response, json: { ...(await response.json()), open: true, savedAt: null } });
        }),
    },
    // Today's portion states are the clock's: each of these is taken in a zone where it is that
    // time of day now (`part`), and the seed's reader has one portion in each state.
    { name: 'wird', path: '/', part: 'morning', anchor: 'wird', until: 'article', marks: ['article svg', 'article a.font-bold', 'article a.rounded-md', 'article span.text-xs'] },
    {
        // Morning: the morning portion is current, the book was kept at its minimum, the paused
        // habit is excused, and the reading habit is done — in that order (orderPortions).
        name: 'wird-cards', path: '/', part: 'morning', anchor: 'wird-cards',
        marks: [{ sel: 'article', nth: 0 }, 'article:nth-of-type(2) > p.flex', { sel: 'article', nth: 2 }, 'article:nth-of-type(4) > p.flex'],
    },
    {
        // Evening: the morning portion, unmet, has moved to its second time («لم يفتك بعد»).
        name: 'wird-evening', path: '/', part: 'evening', anchor: 'wird-cards', until: 'article:nth-of-type(2)',
        marks: ['article:nth-of-type(1) > p.flex', 'article:nth-of-type(2) > p.flex'],
    },
    { name: 'qada', path: '/', part: 'morning', anchor: 'qada', marks: ['h2', 'button'] },
    { name: 'carry', path: '/', part: 'afternoon', anchor: 'carry', marks: [':scope > p', 'button.text-primary'] },
    { name: 'wird-weekly', path: '/', part: 'morning', anchor: 'wird-weekly', marks: [':scope'] },
    {
        // The demo reader has goals; Today is answered as if they had none, with the proposals the
        // backend would build from what they started.
        name: 'first-wird', path: '/', part: 'morning', fresh: true, anchor: 'first-wird', marks: [':scope > div.flex-wrap.gap-2', ':scope > div.gap-4'],
        before: (page) => page.route('**/api/today**', async (route) => {
            const response = await route.fetch();
            route.fulfill({ response, json: withoutGoals(await response.json()) });
        }),
    },
    // Said once per browser, so this shot gets a browser of its own (`fresh`).
    { name: 'milestone', path: '/', part: 'morning', fresh: true, anchor: 'milestone', marks: ['a'] },
    {
        // The review's own questions: opened from its banner, told it is Friday afternoon.
        name: 'review-sheet', path: '/journey', crop: '[role="dialog"]', pad: 0, fixed: true,
        marks: ['[data-guide="review-sheet"] ul.flex', { sel: '[data-guide="review-sheet"] [role="group"]', nth: 0 }],
        before: (page) => page.route('**/api/user/review/current**', async (route) => {
            const response = await route.fetch();
            route.fulfill({ response, json: { ...(await response.json()), open: true, savedAt: null } });
        }),
        prepare: async (page) => {
            await page.locator('[data-guide="review"] button').click();
            await page.waitForTimeout(500);
        },
    },
    {
        // Opened, never confirmed.
        name: 'erase', path: '/journey/record', crop: '[role="dialog"]', pad: 0, fixed: true,
        marks: ['[data-guide="erase"] label', { sel: '[data-guide="erase"] button', nth: -1 }],
        prepare: async (page) => {
            await page.locator('[data-guide="control"] button.underline').click();
            await page.waitForTimeout(500);
        },
    },
    {
        // The reader is told recording is paused, in this browser only.
        name: 'paused', path: '/journey', anchor: 'paused', marks: ['button'],
        before: (page) => page.route('**/api/user/history/settings**', async (route) => {
            if (route.request().method() !== 'GET') return route.continue();
            const response = await route.fetch();
            return route.fulfill({ response, json: { ...(await response.json()), paused: true } });
        }),
    },
    // A programme the demo reader has no goal for, or the button reads «في وِردك» instead.
    { name: 'make-wird', path: '/series/10', crop: 'div.bg-surface:has(> [data-guide="make-wird"])', marks: ['[data-guide="make-wird"]'] },
    // «هدف جديد» opens the choosing page; what a goal pursues is chosen there, not in the dialog.
    { name: 'choose-start', path: '/journey/choose', anchor: 'choose-start', marks: [] },
    ...['amount', 'time', 'intention'].map((step, index) => ({
        name: `dialog-${step}`,
        path: '/journey/choose',
        crop: '[role="dialog"]',
        pad: 0,
        fixed: true,
        marks: [],
        prepare: async (page) => {
            // A habit, never a real programme: the script walks the steps and never commits.
            await page.locator('[data-guide="choose-habits"]').click();
            await page.locator('[data-guide="habit-MINUTES"]').click();
            await page.waitForTimeout(500);
            for (let i = 0; i < index; i++) {
                await page.locator('[role="dialog"] button').filter({ hasText: new RegExp(`^${page.catalog.journey.dialog.next}$`) }).click();
                await page.waitForTimeout(350);
            }
        },
    })),
    { name: 'goal-head', path: '/journey/goals/PRIMARY', anchor: 'goal-head', marks: ['p.font-reading', 'p[dir="auto"].text-text-primary', 'a.bg-primary', 'button'] },
    { name: 'goal-pace', path: '/journey/goals/PRIMARY', anchor: 'goal-pace', marks: ['[data-track="done"]', '[data-track="left"]', 'span[title]', '[data-track="status"]'] },
    { name: 'goal-week', path: '/journey/goals/PRIMARY', anchor: 'goal-week', marks: ['ul', 'div.mt-5', '[data-guide="legend"]'] },
    {
        name: 'goal-cumulative', path: '/journey/goals/PRIMARY', anchor: 'goal-cumulative',
        marks: ['dl', { sel: 'svg text[font-size="12"]', nth: 1 }, 'svg path[stroke-dasharray]', { sel: 'svg text[font-size="12"]', nth: 0 }],
    },
    { name: 'goal-excuse', path: '/journey/goals/PRIMARY', anchor: 'goal-excuse', marks: [':scope > p', 'div.flex-wrap'] },
    {
        // Opened, never confirmed.
        name: 'goal-end', path: '/journey/goals/PRIMARY', crop: '[role="dialog"]', pad: 0, fixed: true,
        marks: ['div.gap-5 > div[class*="border-gold"]', 'div.gap-5 > p'],
        prepare: async (page) => {
            await page.locator('[data-guide="goal-end"] > button').click();
            await page.waitForTimeout(500);
        },
    },
    { name: 'thread', path: '/journey/milestones', anchor: 'thread', maxHeight: 560, marks: ['use.fill-gold', '[class*="fill-primary/60"]'] },
    { name: 'thread-end', path: '/journey/milestones', anchor: 'thread', maxHeight: 460, around: 'circle.stroke-primary', marks: ['circle.stroke-primary', 'use.fill-surface'] },
    {
        // A lesson the demo reader wrote about; the box is opened and never saved.
        name: 'reflection-write', path: '/video/1462', anchor: 'video-reflection',
        marks: ['form label', 'form input', 'form button[type="submit"]', 'ol li:first-child button'],
        prepare: async (page) => {
            await page.locator('[data-guide="video-reflection"] > button').click();
            await page.waitForTimeout(300);
            await page.locator('[data-guide="video-reflection"] input').blur();
        },
    },
    { name: 'reflections', path: '/journey/reflections', anchor: 'reflections', until: 'li:nth-child(2)', marks: ['li:first-child blockquote', 'li:first-child p a'] },
    {
        name: 'year', path: '/journey/record', anchor: 'year',
        marks: ['figure span.text-primary.font-bold', { sel: 'figure > div > div:first-child > span.text-text-muted', all: true }, 'figcaption > span.inline-flex', 'dl'],
    },
    {
        name: 'weeks', path: '/journey/record', anchor: 'weeks',
        marks: [
            { sel: 'figure > p, figure > div > div:first-child', all: true },
            { sel: '[role="group"] > button:last-of-type', box: true },
            { sel: 'div.h-4', box: true },
        ],
    },
    {
        name: 'slots', path: '/journey/record', anchor: 'slots',
        marks: [':scope > p', { sel: 'ul li > span:first-child', all: true }, { sel: 'ul li:first-child > span:nth-child(2)', box: true }, 'ul li:first-child > span:last-child'],
    },
    {
        // The field names are framed together: the point is that the time is split by kind of knowledge.
        name: 'fields', path: '/journey/record', anchor: 'fields',
        marks: [':scope > p', { sel: 'ul li > span:first-child', all: true }, { sel: 'ul li:first-child > span:nth-child(2)', box: true }, 'ul li:first-child > span:last-child'],
    },
    // Thumbnails are photographs, so this one is a JPEG: as a PNG it weighed as much as ten others.
    { name: 'history', path: '/journey/record', anchor: 'history', maxHeight: 540, jpeg: true, marks: [':scope div.mb-5', { sel: '.grid > :first-child [class*="h-[3px]"]', box: true }, '.grid > :first-child > button'] },
    { name: 'control', path: '/journey/record', anchor: 'control', marks: [{ sel: ':scope > div', nth: 1 }, { sel: ':scope button', nth: -2 }, { sel: ':scope button', nth: -1 }] },
];

/** The demo reader's primary goal — the goal page's shots are of it, whatever id the seed gave it. */
async function primaryGoalId(token) {
    const res = await fetch(`${API}/api/user/goals`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Could not list the demo reader's goals (${res.status})`);
    const goals = await res.json();
    const primary = goals.find((goal) => goal.primary) || goals[0];
    if (!primary) throw new Error('The demo reader has no goal — has seed-journey-demo.sh run?');
    return primary.id;
}

async function signIn() {
    const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USER, password: PASSWORD }),
    });
    if (!res.ok) throw new Error(`Sign-in failed (${res.status}) — has seed-journey-demo.sh run?`);
    return res.json();
}

/** The crop's page rectangle and each mark's box inside it, in percent of the crop. */
async function measure(page, shot) {
    return page.evaluate(({ shot }) => {
        const element = shot.crop ? document.querySelector(shot.crop) : document.querySelector(`[data-guide="${shot.anchor}"]`);
        if (!element) return { error: 'crop not found' };
        // What a mark points at is what shows, not the box around it: a row of seven stars or a
        // title is laid out full-width, and a line to that box's edge would end in empty space.
        // A range over the element's contents is the union of what is drawn; an element with no
        // contents of its own (a tick, a bar's track) keeps its box.
        const contentBox = (node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const drawn = range.getBoundingClientRect();
            return drawn.width > 0 && drawn.height > 0 ? drawn : node.getBoundingClientRect();
        };
        const box = element.getBoundingClientRect();
        let bottom = box.bottom;
        if (shot.until) {
            const end = element.querySelector(shot.until);
            if (end) bottom = end.getBoundingClientRect().bottom;
        }
        const pad = shot.pad ?? 12;
        const full = bottom - box.top + 2 * pad;
        const height = Math.min(full, shot.maxHeight ?? Infinity);
        let top = box.top - pad;
        if (shot.around) {
            const focus = element.querySelector(shot.around)?.getBoundingClientRect();
            if (!focus) return { error: `around not found: ${shot.around}` };
            top = Math.min(Math.max(focus.top + focus.height / 2 - height / 2, box.top - pad), box.top - pad + full - height);
        }
        const rect = {
            x: Math.max(0, box.left - pad),
            y: top + (shot.fixed ? 0 : window.scrollY),
            width: Math.min(document.documentElement.clientWidth, box.right + pad) - Math.max(0, box.left - pad),
            height,
        };
        const marks = [];
        for (const mark of shot.marks) {
            const spec = typeof mark === 'string' ? { sel: mark, nth: 0 } : mark;
            const shown = (node) => node.getBoundingClientRect().width > 0 && node.checkVisibility?.() !== false;
            const matches = (spec.sel === ':scope' ? [element] : [...element.querySelectorAll(spec.sel)]).filter(shown);
            const targets = spec.all ? matches : [matches.at(spec.nth ?? 0)].filter(Boolean);
            if (!targets.length) return { error: `mark not found: ${spec.sel}` };
            const boxes = targets.map((node) => (spec.box ? node.getBoundingClientRect() : contentBox(node)));
            const left = Math.min(...boxes.map((b) => b.left));
            const topmost = Math.min(...boxes.map((b) => b.top));
            const r = {
                left, top: topmost,
                width: Math.max(...boxes.map((b) => b.right)) - left,
                height: Math.max(...boxes.map((b) => b.bottom)) - topmost,
                bottom: Math.max(...boxes.map((b) => b.bottom)),
            };
            if (r.bottom < top || r.top > top + height) return { error: `mark outside the crop: ${spec.sel}` };
            const pct = (value, of) => Math.round((value / of) * 1000) / 10;
            marks.push([
                pct(r.left - rect.x, rect.width),
                pct(r.top - top, rect.height),
                pct(r.width, rect.width),
                pct(Math.min(r.height, height - (r.top - top)), rect.height),
            ]);
        }
        return { rect, marks };
    }, { shot: { ...shot, prepare: undefined, before: undefined } });
}

async function main() {
    const { token, refreshToken } = await signIn();
    const goalId = await primaryGoalId(token);
    const pathOf = (shot) => shot.path.replace('/journey/goals/PRIMARY', `/journey/goals/${goalId}`);
    const browser = await chromium.launch();
    const manifest = {};
    let failed = 0;
    for (const [locale, catalog] of Object.entries(LOCALES)) {
        for (const theme of THEMES) {
            // One browser context per zone the shots need — the zone is fixed when a context is
            // made — and a throwaway one for a shot that must be the first visit in its browser.
            const contexts = new Map();
            const open = async (zone, fresh) => {
                const key = fresh ? `fresh:${Math.random()}` : zone;
                if (contexts.has(key)) return contexts.get(key);
                const context = await browser.newContext({
                    viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale, timezoneId: zone,
                });
                await context.addInitScript(([values]) => {
                    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
                }, [{
                    token, refreshToken, locale, theme,
                    'consent.youtube.v1': 'granted', 'consent.views.v1': 'denied',
                    'absarna.guideSeen': '1', 'absarna.dayLegendHidden': '0',
                }]);
                const page = await context.newPage();
                page.catalog = catalog;
                contexts.set(key, page);
                return page;
            };
            for (const shot of SHOTS) {
                if (only.length && !only.includes(shot.name)) continue;
                try {
                    const page = await open(shot.part ? zoneWhere(shot.part) : HOME_ZONE, shot.fresh);
                    await page.unrouteAll({ behavior: 'ignoreErrors' });
                    if (shot.before) await shot.before(page);
                    await page.goto(SPA + pathOf(shot), { waitUntil: 'networkidle' });
                    // What is pinned to the screen would be drawn across a crop further down the page: the
                    // phone's tab bar, the sticky navbar (unpinned — it keeps its place in the flow), and the
                    // drawn scrollbar at the page's edge.
                    await page.addStyleTag({
                        content: '[class*="fixed"][class*="bottom-0"], .drawn-track { display: none !important; }'
                            + ' nav.sticky { position: static !important; }',
                    });
                    await page.waitForTimeout(700);
                    if (shot.prepare) await shot.prepare(page);
                    const target = shot.crop ? page.locator(shot.crop) : page.locator(`[data-guide="${shot.anchor}"]`);
                    await target.first().scrollIntoViewIfNeeded();
                    await page.waitForTimeout(300);
                    const measured = await measure(page, shot);
                    if (measured.error) throw new Error(measured.error);
                    const ext = shot.jpeg ? 'jpg' : 'png';
                    const file = resolve(root, `public/guide/${locale}/${theme}/${shot.name}.${ext}`);
                    await mkdir(dirname(file), { recursive: true });
                    await page.screenshot({
                        path: file, fullPage: !shot.fixed, clip: measured.rect, animations: 'disabled',
                        ...(shot.jpeg ? { type: 'jpeg', quality: 82 } : {}),
                    });
                    manifest[shot.name] ??= {};
                    manifest[shot.name][locale] = {
                        w: Math.round(measured.rect.width), h: Math.round(measured.rect.height), marks: measured.marks,
                        ...(shot.jpeg ? { ext: 'jpg' } : {}),
                    };
                    console.log(`✓ ${locale}/${theme}/${shot.name}`);
                    if (shot.fresh) await page.context().close();
                } catch (error) {
                    failed++;
                    console.error(`✗ ${locale}/${theme}/${shot.name}: ${error.message.split('\n')[0]}`);
                }
            }
            for (const page of contexts.values()) {
                await page.context().close().catch(() => {});
            }
        }
    }
    await browser.close();
    // A run of named shots (`npm run guide:shots -- year control`) replaces only theirs.
    const path = resolve(root, 'src/components/guide/guideShots.json');
    const merged = only.length ? { ...JSON.parse(await readFile(path, 'utf8')), ...manifest } : manifest;
    const sorted = Object.fromEntries(Object.keys(merged).sort().map((key) => [key, merged[key]]));
    await writeFile(path, `${JSON.stringify(sorted, null, 2)}\n`);
    if (failed) {
        console.error(`${failed} shot(s) failed`);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
