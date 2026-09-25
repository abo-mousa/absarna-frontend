import { tOptional } from '@/i18n';

/**
 * Viewer content reporting: the vocabulary, and the pure decisions around it.
 *
 * <p>Sits beside `lib/review.js` and is deliberately not part of it. Review is what a *detector*
 * found and what a platform admin did about it; this is what a *reader* objected to. The two
 * queues look similar from a distance and answer different questions — a review finding always
 * names a video and a detector, while a report names any of five target types and a human's
 * reason — so sharing a module would mean a union of two vocabularies where every call site has
 * to know which half it is holding.
 *
 * <p>Nothing here imports React or touches the network, so the parts worth checking — the reason
 * ordering, the open-set fallbacks, where a reported item actually lives — are testable without a
 * harness, which is this repo's standing preference.
 */

/**
 * The app's route-style content words mapped to the backend's `ReportTargetType`.
 *
 * <p>Mirrors `useBookmarks`/`useLikes`' `ITEM_TYPE` on purpose: every call site in this app
 * already says `type="video"`, and a component that took `VIDEO` would be the one control on a
 * detail page spelling it differently. The set is wider than theirs — a post and a comment are
 * both reportable and neither is a "content item" in the bookmark/like/view sense — which is
 * exactly why the backend gave this its own enum rather than widening `ContentItemType`.
 */
export const REPORT_TARGET_TYPE = {
    video: 'VIDEO',
    book: 'BOOK',
    article: 'ARTICLE',
    post: 'POST',
    comment: 'COMMENT',
};

/** The wire value for one of this app's type words, or `null` for anything not reportable. */
export const targetTypeOf = (type) => REPORT_TARGET_TYPE[type] ?? null;

/*
 * No list of reasons here. The dialog shows what `GET /api/reports/reasons` returns, in the order
 * it returns them (useReportReasons) — every order on this platform is the backend's, and the
 * argument for this one lives on `ReportReason` beside the codes it orders.
 */
/** Matches `ReportRequest.note`'s `@Size(max = 1000)`, which matches the column. */
export const NOTE_MAX_LENGTH = 1000;

/**
 * The Arabic wording for a reason code, falling back to the code itself.
 *
 * <p>`tOptional`, not `t`, because <b>the reason list is an open set</b>: the backend may add a
 * code before this repo learns the word for it, and `t()` would then render
 * `report.reasons.WHATEVER.label` into a radio list in the middle of an Arabic form. Falling back
 * to the raw code keeps the option readable, keeps the form usable, and keeps the two repos
 * independently deployable — the same rule `describeError` follows for `reason` codes.
 */
export const reasonLabel = (reason) => tOptional(`report.reasons.${reason}.label`) ?? String(reason ?? '');

/** The one-line explanation under a reason, or `null` where there is nothing to add. */
export const reasonHint = (reason) => tOptional(`report.reasons.${reason}.hint`) ?? null;

/** Where a report sits in a moderator's hands — mirrors the backend's `ReportStatus`. */
export const REPORT_STATUS = {
    OPEN: 'OPEN',
    ACTIONED: 'ACTIONED',
    DISMISSED: 'DISMISSED',
};

/**
 * What a moderator may write back.
 *
 * <p>OPEN is deliberately absent: the backend refuses it with a 400, because re-opening a decided
 * report is not a decision and the queue's meaning depends on a decided row staying decided. A
 * report reopens only one way — the reporter's own repeat report, which the backend treats as an
 * update of the row it already holds.
 */
export const REPORT_DECISIONS = [REPORT_STATUS.ACTIONED, REPORT_STATUS.DISMISSED];

/** Reviewer-facing wording for a status, falling back to the raw value. Open set, as above. */
export const statusLabel = (status) =>
    tOptional(`adminReports.statuses.${String(status ?? '').toLowerCase()}`) ?? String(status ?? '');

/** Reviewer-facing wording for a target type, falling back to the raw value. Open set, as above. */
export const targetTypeLabel = (targetType) =>
    tOptional(`adminReports.targetTypes.${String(targetType ?? '').toLowerCase()}`) ?? String(targetType ?? '');

/**
 * The in-app route for a reported item, or `null` when it has no page of its own.
 *
 * <p>Two of the five target types have no detail route in this app at all: a post is rendered as
 * a card inside its channel's page and a comment lives under whatever it was posted on. Returning
 * `null` rather than a plausible-looking guess is the point — the moderation screen falls back to
 * the reported item's channel, which is somewhere a moderator can actually act, whereas a
 * fabricated `/posts/7` would 404 and teach them the link is broken.
 *
 * <p>Deliberately pure and id-only: no lookup, no channel slug, nothing that needs a request. The
 * caller decides whether to spend a query resolving a channel.
 */
export const targetPath = (targetType, targetId) => {
    if (targetId == null) return null;
    switch (targetType) {
        case 'VIDEO': return `/video/${targetId}`;
        case 'BOOK': return `/books/${targetId}`;
        case 'ARTICLE': return `/articles/${targetId}`;
        default: return null;
    }
};

/**
 * How many OPEN reports stand against a target, as something to show — or `null` for "one".
 *
 * <p>A lone complaint is the ordinary case and needs no decoration; the number is worth rendering
 * precisely when it is more than one, because that is the moment a queue of individual objections
 * becomes "ten people said this". Rendering «1» on every row would make the interesting rows
 * harder to spot, not easier.
 */
export const corroboration = (openReportsOnTarget) => {
    const count = Number(openReportsOnTarget);
    return Number.isFinite(count) && count > 1 ? count : null;
};
