---
description: Review a change in absarna-frontend against the SPA's stated invariants
argument-hint: "[branch | PR number | path] (default: current branch vs master)"
---

You are reviewing code for the Absarna platform as the engineer who gets paged when
it breaks. Your bar for reporting something is: **"I would block this merge."**

## Scope

Review: $ARGUMENTS

If that is empty, review the diff on the current branch against `master`. A bare
number means PR #N; a path means those files; a branch name means that branch.

Read the changed files in full. Read the callers and callees of anything you are
unsure about. Read this repo's `CLAUDE.md` before you start and treat its stated
rules as review criteria — most of them exist because the opposite was tried and
broke something, and a diff that quietly reverses one looks completely correct in
isolation.

## Pass 1 — understand

State in one paragraph what this change is for and which invariants it leans on.
A finding that ignores the intent is noise.

## Pass 2 — hunt

In this priority order:

1. **Correctness of the change itself** — wrong logic, off-by-one, null/empty/absent
   cases, error paths never taken, exceptions swallowed, early returns skipping
   cleanup, resources not released on the failure path.
2. **Contract breaks at the seam** with the rest of the codebase and with the other
   two repos — a changed field name, shape, nullability, enum value, default or
   status that something else still assumes. Grep for every consumer before you
   decide it is fine. This is where the expensive bugs live here, because the
   three repos share no compiler.
3. **Security and access** — authorization checked per object, not just per session;
   a gate that fails open where it must fail closed; an existence oracle (403 vs
   404, a preview that differs for a gated item); secrets, presigned URLs, reset
   links or object keys reaching a log line, a DTO, or an error message.
4. **Data integrity and concurrency** — transaction boundaries, self-invocation
   silently disabling `@Transactional`, non-atomic writes across two stores, races
   on read-modify-write, retries that are not idempotent, partial failure leaving a
   half-finished state, ordering between publish / ack / delete.
5. **Failure behavior under load and outage** — what does this do when the worker is
   down, Redis blips, storage 5xxs, a model is missing, a disk is full? Does a
   transient fault become a permanent one? Does a permanent one get retried forever?
   Does an outage turn into mass deletion or mass holding?
6. **Resource behavior with real data** — unbounded queries, missing pagination,
   N+1, work in a loop that should be batched, memory or buffer held per item, an
   unread subprocess pipe, a log line emitted per object.
7. **Tests** — does the new test fail if the behavior regresses, or is it
   tautological? Is the risky path the untested one? Is an IT bound to Failsafe and
   therefore skipped by `mvn test`?
8. Only then: duplication, dead code, and simplifications that remove real
   complexity — never restyling.

## Pass 3 — verify (before writing anything)

For each candidate finding, write the concrete failure: specific inputs or state →
the specific wrong output, crash, leak, or stuck row. If you cannot write that
sentence, or one more file would settle it, go read that file. Delete every finding
that does not survive. Two confirmed bugs beat ten maybes.

## Do not report

Style, formatting, naming taste, "consider a comment", speculative future needs,
hypotheticals with no reachable trigger, or anything `CLAUDE.md` has already
decided — if you think a documented decision is wrong, say so once at the end as a
question, not as a finding.

## Output

Findings ranked most severe first. Each: `file:line`, one sentence on the defect,
the concrete failure scenario, the smallest fix, and **CONFIRMED** (you traced it)
or **PLAUSIBLE** (say what would settle it). If nothing survives Pass 3, say so —
do not pad. End with three lines: what the change does, the riskiest thing about
it, and merge / merge-with-fixes / block.

## Weight these, in this repo

`absarna-frontend` — React 18 + Vite, plain `.jsx`, RTL Arabic, Tailwind. Items 4-7
of Pass 2 read differently here: "transaction" means query-cache invalidation,
"resource" means bundle size and buffered bytes, and `mvn verify` means
`npm run build && npm run lint && npm test`.

- **Every user-facing string** through `t()` from `i18n/ar.js`; Latin digits via
  `lib/numbers`; `displayDate(item)` = `originalPublishDate || publishDate`.
- **Every GET through a `useQuery` hook in `hooks/`**, never a raw `api.get` in a
  `useEffect`. The cache-tier spread goes **last** or a literal silently overrides
  it. User-scoped query keys carry the viewer's identity as the **last** segment,
  taken from the token — not from `user`, which is null while the profile fetch is
  in flight.
- **Security**: never `dangerouslySetInnerHTML`; every data-derived URL through
  `safeExternalUrl`; **never construct a bucket URL** — it would now *work*, which is
  exactly why it is forbidden: it skips the visibility check that is the whole access
  decision. `usePresignedUpload` uses raw `fetch`, never the shared axios client, or
  the interceptor leaks the JWT to a third-party host and extra headers invalidate
  the signature.
- **A new outbound host needs `connect-src` in `vite.config.js`'s CSP**, and
  `VITE_FARO_URL` is the trap — telemetry cannot report that it is being blocked, and
  the symptom is an empty dashboard reading as "no errors happened".
- **All `localStorage` through `lib/safeStorage.js`** — unguarded access throws when a
  browser blocks site data, and at module scope that renders a blank page.
- **The `review` list is an open set**: an unknown `type` or `state` must render as an
  unknown note, never throw and never fall through to "fine". Only `HELD` and
  `REJECTED` hide a video. This field is the owner's **only** notification channel —
  if it renders nothing, their upload simply vanished.
- **Player**: element state lives in `VideoControlBar`, not `VideoPlayer`
  (`timeupdate` fires several times a second); the playback rate is re-applied on
  every `loadedmetadata` because a rung swap is a load; the hls.js buffer caps are
  deliberate and cost money if raised; the timeline is `dir="ltr"` inside an RTL app
  on purpose.
- **`react-hooks/exhaustive-deps` is an error**, and `npm run build` (Rollup, full
  static resolution) is the only thing that catches a bad named import —
  `npm run dev` does not, and routes are lazy-loaded so it surfaces at navigation.
- **Treat every media URL as short-lived** even though a video's no longer expires,
  and keep the player's refresh-on-segment-error path.

---

If this change touches anything that crosses a repo boundary — the transcode
contract, a `ReviewFinding` type or state, an API response shape, a timeout, an
object key, or a CORS/CSP host — stop and say so at the end: `/review-seam` is the
pass that checks those, and per-repo review structurally cannot.
