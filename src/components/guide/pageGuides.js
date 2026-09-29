import { CalendarCheck, Milestone, NotebookPen, PenLine, Route, ScrollText, Target, Archive, History } from 'lucide-react';

/**
 * The page guides: what the «؟» on a page opens (`PageGuideSheet`) and what `/guide/:slug` shows
 * in full. One entry per page, its blocks in the order the page has them. A guide is mostly
 * pictures — screenshots of the real page, numbered where the captions point — so a block is one
 * of:
 *
 * - `shot`: a screenshot (`guideShots.json`, taken by `npm run guide:shots`) with `marks`
 *   numbered captions. The count must equal the marks the capture script measured for it, which
 *   `pageGuides.test.js` pins.
 * - `steps`: a few screenshots stepped through, one caption each (creating a goal).
 * - `legend`: the day symbols drawn live by the real `DayStar`, so they can never disagree with it.
 * - `note`: a sentence and a glyph, for what no screenshot can show (the Friday review exists only
 *   on Fridays).
 *
 * `anchor` is the page element's `data-guide`: present, the block offers «أرِني» (the spotlight);
 * absent — the page hides sections until they have something in them — the block says when it
 * appears instead (`…blocks.<key>.appears`). `copyOf` borrows another page's wording for a block
 * both pages show. Wording lives in `guide.pages.<id>.*`.
 */
export const PAGE_GUIDES = {
    journey: {
        slug: 'journey',
        icon: Route,
        to: '/journey',
        blocks: [
            { key: 'intention', type: 'shot', shot: 'intention', marks: 3, anchor: 'intention' },
            { key: 'goals', type: 'shot', shot: 'goal-card', marks: 6, anchor: 'goals' },
            { key: 'symbols', type: 'legend', anchor: 'legend' },
            { key: 'today', type: 'shot', shot: 'wird', marks: 4, to: '/' },
            { key: 'almost', type: 'shot', shot: 'almost', marks: 2, anchor: 'almost' },
            { key: 'steady', type: 'shot', shot: 'steady', marks: 2, anchor: 'steady' },
            { key: 'month', type: 'shot', shot: 'month', marks: 1, anchor: 'month' },
            { key: 'shelf', type: 'shot', shot: 'shelf', marks: 1, anchor: 'shelf' },
            { key: 'review', type: 'note', icon: CalendarCheck, anchor: 'review' },
        ],
        faq: ['miss', 'rest', 'day', 'private'],
    },
    journeyGoals: {
        slug: 'journey-goals',
        icon: Target,
        to: '/journey/goals',
        blocks: [
            { key: 'create', type: 'steps', shots: ['dialog-target', 'dialog-amount', 'dialog-time', 'dialog-intention'], anchor: 'new-goal' },
            { key: 'makeWird', type: 'shot', shot: 'make-wird', marks: 1 },
            { key: 'goals', type: 'shot', shot: 'goal-card', marks: 6, anchor: 'goals', copyOf: 'journey' },
        ],
        faq: ['period', 'minimum', 'slots', 'many'],
    },
    journeyGoal: {
        slug: 'journey-goal',
        icon: Target,
        // A goal's page needs a goal: the full guide's «افتح الصفحة» goes to the list instead, and
        // does not open the list's guide, which is not this one.
        to: '/journey/goals',
        openHere: false,
        blocks: [
            { key: 'head', type: 'shot', shot: 'goal-head', marks: 4, anchor: 'goal-head' },
            { key: 'pace', type: 'shot', shot: 'goal-pace', marks: 4, anchor: 'goal-pace' },
            { key: 'week', type: 'shot', shot: 'goal-week', marks: 3, anchor: 'goal-week' },
            { key: 'cumulative', type: 'shot', shot: 'goal-cumulative', marks: 4, anchor: 'goal-cumulative' },
            { key: 'excuse', type: 'shot', shot: 'goal-excuse', marks: 2, anchor: 'goal-excuse' },
            { key: 'end', type: 'note', icon: Archive, anchor: 'goal-end' },
        ],
        faq: ['behind', 'excused', 'edit'],
    },
    journeyMilestones: {
        slug: 'journey-milestones',
        icon: Milestone,
        to: '/journey/milestones',
        blocks: [
            { key: 'thread', type: 'shot', shot: 'thread', marks: 2, anchor: 'thread', cut: 'bottom' },
            { key: 'ahead', type: 'shot', shot: 'thread-end', marks: 2, anchor: 'thread', cut: 'top' },
        ],
        faq: ['lose', 'compare'],
    },
    journeyReflections: {
        slug: 'journey-reflections',
        icon: NotebookPen,
        to: '/journey/reflections',
        blocks: [
            { key: 'list', type: 'shot', shot: 'reflections', marks: 2, anchor: 'reflections', cut: 'bottom' },
            { key: 'write', type: 'note', icon: PenLine },
        ],
        faq: ['who', 'removed', 'delete'],
    },
    journeyRecord: {
        slug: 'journey-record',
        icon: ScrollText,
        to: '/journey/record',
        blocks: [
            { key: 'year', type: 'shot', shot: 'year', marks: 3, anchor: 'year' },
            { key: 'weeks', type: 'shot', shot: 'weeks', marks: 1, anchor: 'weeks' },
            { key: 'slots', type: 'shot', shot: 'slots', marks: 2, anchor: 'slots' },
            { key: 'fields', type: 'shot', shot: 'fields', marks: 1, anchor: 'fields' },
            { key: 'history', type: 'note', icon: History, anchor: 'history' },
            { key: 'control', type: 'shot', shot: 'control', marks: 3, anchor: 'control' },
        ],
        faq: ['erase', 'pause', 'keep'],
    },
};

/** The guides in the order the full guide lists them. */
export const PAGE_GUIDE_ORDER = ['journey', 'journeyGoals', 'journeyGoal', 'journeyMilestones', 'journeyReflections', 'journeyRecord'];

export const guideBySlug = (slug) => PAGE_GUIDE_ORDER.find((id) => PAGE_GUIDES[id].slug === slug) || null;

/** Where a block's wording lives. */
export const blockKey = (id, block) => `guide.pages.${block.copyOf || id}.blocks.${block.key}`;
