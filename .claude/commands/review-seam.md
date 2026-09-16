---
description: Review the seam between absarna-backend, absarna-worker and absarna-frontend — the contracts no compiler enforces
argument-hint: "[what changed, or a branch/PR] (default: the current branch's diff)"
---

You are reviewing the **seam** between `absarna-backend`, `absarna-worker` and
`absarna-frontend`. All three are checked out side by side under
`~/IdeaProjects/`. Nothing across this seam is enforced by a compiler and most of
its failures are **silent** — the symptom looks nothing like the cause, and the
usual one is "the video just never appears", with nothing thrown and nothing
logged.

Change under review: $ARGUMENTS
If that is empty, take the diff on the current branch against `master` and work
outward from whatever it touches.

Read all three `CLAUDE.md` files first. Then check every item below. For each, say
whether it currently **HOLDS**, is **BROKEN** (with the failure it produces), or is
**AT RISK** from this change — and quote the two lines that have to agree.

1. **The transcode contract.** `contract/transcode-contract.json` must be
   byte-identical in both Java repos with its SHA-256 asserted on each side. Diff
   the two files and check both hashes. A renamed field is indistinguishable from a
   worker that never reported: the video stays `UPLOADED` forever and nothing
   throws. Changing it is a three-part edit — fixture in both, hash in both, then
   whatever the assertions catch.
2. **The detector sets.** Every `ReviewFindingType` the backend *requires* must be
   one the worker actually *sends* with its current enabled flags
   (`WORKER_MUSIC_DETECTION` / `WORKER_NSFW_DETECTION`). A required type the worker
   never sends holds every video forever, and "videos stuck in review" looks nothing
   like its cause. Turning a detector off in the worker without relaxing the
   backend's required set does the same thing.
3. **Absence vs `UNSCANNED`.** An absent `review` field means no detector ran; a
   present-but-unreadable one is `UNCHECKED` for every detector. Collapsing the two
   in either direction either un-queues the platform on one `enabled=false` deploy
   or publishes unmoderated video past a fail-closed type. Check both sides agree,
   and that neither ever *rejects* the result (that leaves the row `UPLOADED` and
   the reconciler re-queues hours of CPU over a moderation note).
4. **The fail-open / fail-closed asymmetry**, stated once in the backend's
   `content/video/ReviewFindingType`. Both detectors send the same `UNSCANNED` wire
   value; what it costs is per type and lives on the backend. If any of the three
   repos has grown a second copy of that rule, that is a finding on its own.
5. **Open sets on the reading side.** The worker's four outcome values (`CLEAN`,
   `ADVISORY`, `BLOCKED`, `UNSCANNED`) and the frontend's six states (`CLEAN`,
   `ADVISORY`, `HELD`, `UNCHECKED`, `CLEARED`, `REJECTED`) must each degrade to
   "unknown note" on an unrecognised value — never throw, and never fall through to
   "fine". A new detector or state must not need all three repos deployed at once.
6. **The two timeouts.** `WORKER_JOB_TIMEOUT` (6h) and the backend's
   `TRANSCODE_STUCK_AFTER` (7h) move together. Nothing writes `PROCESSING`, so a
   video is `UPLOADED` for the whole of its transcode; narrowing one without
   widening the other brings back duplicate transcodes.
7. **The object key.** The backend mints `videos.media_prefix_token` once and
   **reads it back**; the worker never derives a key and validates the prefix it is
   handed. A freshly minted token on a re-queue writes a second full ladder and
   strands the first, which `MediaOrphanSweeper` will never reclaim because it only
   deletes objects whose video row is *gone*. Check the replaced-file path too: the
   token is kept, so a replacement job carries a new master under a byte-identical
   prefix — which is why `CompletedJobs` is keyed on the master as well.
8. **The stream groups.** The worker creates `absarna-workers` on
   `video-transcode-jobs`; the backend creates `absarna-backend` on
   `video-transcode-results`. Neither creates the other's, and the backend only
   `XADD`s to the jobs stream.
9. **The API shape the SPA relies on.** `playback-url` returns
   `{url, quality, qualities}` and `quality` is the rung actually served; confirm is
   idempotent on `uploadSessionId`; `playback-url`/`read-url` refuse with **404, not
   403**; a YouTube import can end `PARTIAL` meaning *paused, press resume*; 429
   bodies are readable Arabic and are not auto-retried; `viewCount` does not move on
   a re-fetch; object keys never appear on a DTO; `sourceUrl` and `thumbnailUrl`
   null means "not yet", never an error; `/api/search` and `/api/search/suggestions`
   must always agree.
10. **CORS and CSP.** Both buckets need CORS — masters for the browser's direct
    upload, media because hls.js fetches segments over XHR — and **no test in any
    repo can catch a missing one**: MinIO's CORS is permissive and Safari's native
    HLS player does not use the CORS path, so it passes locally and on a reviewer's
    Mac and fails in Chrome and Firefox. A new outbound host also needs the SPA's
    `connect-src`, where `VITE_FARO_URL` is the trap.
11. **Observability join keys.** `service` in each `logback-spring.xml`'s
    `customFields` must equal that service's `management.metrics.tags.service`, or a
    dashboard cannot pivot from a metric to the logs behind it. An alert rule naming
    a metric that no longer exists does not error — it silently never fires. Check
    `absent()`-based down-detection still matches the `service` label the Alloy
    scrape targets attach.
12. **Deploy ordering.** If this change needs two repos deployed together, say so
    explicitly and say which order is safe — and whether the intermediate state
    (new backend + old worker, or the reverse) holds videos, publishes unchecked
    ones, or blanks the SPA.

Then verify. For anything you report, follow the same rule the per-repo review
uses: a concrete failure sentence — specific state → the specific wrong outcome —
or it does not get reported. Mark each **CONFIRMED** or **PLAUSIBLE**.

Finish with: which of the twelve are at risk from this change, the single most
likely silent failure, and whether the three repos can be deployed independently.
