import { CalendarCheck, Milestone, NotebookPen, Route, ScrollText, Target } from 'lucide-react';

/**
 * The page guides: what the «؟» on a page opens (`PageGuideSheet`) and what `/guide/:slug` shows
 * in full. One entry per page, its blocks in the order the page has them. A guide is mostly
 * pictures — screenshots of the real page, numbered where the captions point — so a block is one
 * of:
 *
 * - `shot`: a screenshot (`guideShots.json`, taken by `npm run guide:shots`) with `marks`
 *   captions, each tied to the part of the picture it describes. The count must equal the marks the capture script measured for it, which
 *   `pageGuides.test.js` pins.
 * - `steps`: a few screenshots stepped through, one caption each (creating a goal).
 * - `legend`: the day symbols drawn live by the real `DayStar`, so they can never disagree with it.
 *
 * <p>Every block has a picture: a block of words alone read as an empty section (product owner,
 * 2026-09-29). What the page shows only sometimes is photographed anyway — the Friday review with
 * its request answered as if it were Friday, a dialog opened and not confirmed.
 *
 * `anchor` is the page element's `data-guide`: present, the block offers «أرِني» (the spotlight);
 * absent — the page hides sections until they have something in them — the block says when it
 * appears instead (`…blocks.<key>.appears`). `copyOf` borrows another page's wording for a block
 * both pages show. Wording lives in `guide.pages.<id>.*`.
 */
export const PAGE_GUIDES = {
    today: {
        slug: 'today',
        icon: CalendarCheck,
        to: '/',
        blocks: [
            { key: 'portions', type: 'shot', shot: 'wird-cards', marks: 4, anchor: 'wird-cards' },
            { key: 'evening', type: 'shot', shot: 'wird-evening', marks: 2, anchor: 'wird-cards' },
            { key: 'qada', type: 'shot', shot: 'qada', marks: 2, anchor: 'qada' },
            { key: 'carry', type: 'shot', shot: 'carry', marks: 2, anchor: 'carry' },
            { key: 'weekly', type: 'shot', shot: 'wird-weekly', marks: 1, anchor: 'wird-weekly' },
            { key: 'first', type: 'shot', shot: 'first-wird', marks: 2, anchor: 'first-wird' },
            { key: 'milestone', type: 'shot', shot: 'milestone', marks: 1, anchor: 'milestone' },
        ],
        faq: ['hidden', 'order', 'remind'],
    },
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
            { key: 'review', type: 'shot', shot: 'review', marks: 2, anchor: 'review' },
            { key: 'reviewSheet', type: 'shot', shot: 'review-sheet', marks: 2, anchor: 'review-sheet' },
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
            { key: 'end', type: 'shot', shot: 'goal-end', marks: 2, anchor: 'goal-end' },
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
            { key: 'write', type: 'shot', shot: 'reflection-write', marks: 4 },
        ],
        faq: ['who', 'removed', 'delete'],
    },
    journeyRecord: {
        slug: 'journey-record',
        icon: ScrollText,
        to: '/journey/record',
        blocks: [
            { key: 'year', type: 'shot', shot: 'year', marks: 4, anchor: 'year' },
            { key: 'weeks', type: 'shot', shot: 'weeks', marks: 3, anchor: 'weeks' },
            { key: 'slots', type: 'shot', shot: 'slots', marks: 4, anchor: 'slots' },
            { key: 'fields', type: 'shot', shot: 'fields', marks: 4, anchor: 'fields' },
            { key: 'history', type: 'shot', shot: 'history', marks: 3, anchor: 'history', cut: 'bottom' },
            { key: 'control', type: 'shot', shot: 'control', marks: 3, anchor: 'control' },
            { key: 'erase', type: 'shot', shot: 'erase', marks: 2, anchor: 'erase' },
            { key: 'paused', type: 'shot', shot: 'paused', marks: 1, anchor: 'paused' },
        ],
        faq: ['erase', 'pause', 'keep'],
    },
};

/** The guides in the order the full guide lists them. */
export const PAGE_GUIDE_ORDER = ['today', 'journey', 'journeyGoals', 'journeyGoal', 'journeyMilestones', 'journeyReflections', 'journeyRecord'];

export const guideBySlug = (slug) => PAGE_GUIDE_ORDER.find((id) => PAGE_GUIDES[id].slug === slug) || null;

/** Where a block's wording lives. */
export const blockKey = (id, block) => `guide.pages.${block.copyOf || id}.blocks.${block.key}`;
