# أَبْصَرْنا (Absarna) Platform — Frontend

**React 18 + Vite SPA**, plain JavaScript (`.jsx`, no TypeScript), **RTL Arabic throughout**. The
reader-facing app for an Islamic educational media platform: videos, books, articles, posts, grouped
into channels.

## The three repos

| Repo | What it is |
|---|---|
| `absarna-frontend` (this) | The SPA. |
| `absarna-backend` | The API (Spring Boot). Owns all data and authorization; see "Backend contract". |
| `absarna-worker` | Transcode worker. **Nothing here talks to it** — it produces the rendition ladder behind `playback-url`'s `qualities` and the poster frames in `thumbnailUrl`. |

`HISTORY.md` holds closed review passes and the rebrand — archaeology only.
**Logging and metrics across all three repos are designed once, in `absarna-backend/OBSERVABILITY.md`.**
This repo's part is `lib/telemetry.js` (Grafana Faro RUM); don't restate the design here.

## Layout

```
src/
  components/
    ui/        Button, Card, Input, Modal, Badge, Grid, Spinner, EmptyState, QueryState, Avatar,
               LinkifiedText, ExpandableText, SwapLabel
    layout/    Navbar, SideBar, PageShell, SearchBar
    content/   VideoCard, BookCard, ArticleCard, PostCard, VideoPlayer, VideoControlBar,
               PlayerSettingsMenu, PdfReader, CommentsSection, BookmarkButton, LikeButton,
               SubscribeButton, ShareButton
    channel/   ContentPublishForm, ContentManageList, ContentEditModal, YouTubeImportPanel
    auth/      EmailVerificationNotice
  pages/       one per route, all lazy-loaded in App.jsx
  hooks/       one per domain (useVideos, useChannels, useBooks, useLikes, useBookmarks,
               useSeries, useMediaUrl, usePresignedUpload, useComments, …)
  contexts/    AuthContext, ThemeContext, ToastContext
  i18n/        index.js (t / tOptional) + ar.js — EVERY user-facing string
  lib/         api/ (axios client + interceptors), queryKeys, queryCache, describeError,
               safeStorage, media, numbers, dayjsAr, user, uploadResume, env, telemetry
```

Path alias `@/` → `src/`. Import from a folder's `index.js` barrel, not the individual file.

## Conventions

- **Two Arabic faces, and the split is prose vs interface.** `font-sans` is Cairo — buttons, nav,
  cards, counts, anything that is a label. `font-reading` is Noto Naskh Arabic, for prose someone
  *wrote* (comments) and prose someone *reads at length* (video and book descriptions, article
  bodies, the legal pages); the comment box uses it too, so what you type looks like what lands.
  `font-serif` (Markazi Text) stays the wordmark and reading-page headings. **Cairo replaced IBM
  Plex Sans Arabic because Plex has no ligature rule for «الله»** — the glyph is in the font and
  nothing forms it — and a fallback font cannot fix that, since fallback is per missing CHARACTER
  and lam/lam/heh all exist in Plex.
- **Tailwind only.** Brand colours are theme tokens resolving through CSS custom properties
  (`rgb(var(--color-x) / <alpha-value>)`), with light values on `:root` and dark under `.dark` in
  `index.css` — which is why dark mode is a two-file change and every existing `bg-surface` call site
  repaints for free. Inline `style={{}}` only for genuinely runtime-variable values Tailwind's JIT
  can't see (`Grid`'s `minWidth`, `Spinner`'s `size`).
- **Every user-facing string lives in `src/i18n/ar.js` and reaches the screen through `t()`.** ~420
  entries, ~590 call sites. A missing key returns the key and warns in dev. `tOptional` is for keys
  that come from *data* (a quality rung name), where a miss is normal. Namespace by the screen that
  shows it; promote to `common` only when a second screen needs the same words for the same reason.
  A test walks the source and asserts every literal `t('...')` key resolves.
- **Every GET goes through a `useQuery`/`useInfiniteQuery` hook in `hooks/`**, never a raw `api.get`
  in a `useEffect`. The one exception is `AuthContext`'s own profile fetch.
- **Cache tiers are named** (`lib/queryCache.js`): `NO_CACHE` (the feed), `LIVE`, `STANDARD`
  (default, 2 min), `STATIC` (1h). `refetchOnWindowFocus` stays off everywhere. Put the tier spread
  **last** or a literal silently overrides it.
- **User-scoped query keys carry the viewer's identity as the LAST segment** (`lib/queryKeys.js`), so
  every existing prefix invalidation keeps working. The scope comes from the token, not from `user`
  (which is null while the profile fetch is in flight). Public catalogue keys are deliberately *not*
  scoped. `AuthContext` also clears the whole cache on logout.
- **All `localStorage` goes through `lib/safeStorage.js`** — unguarded access *throws* when a browser
  blocks site data, and at module scope that renders a blank page.
- **The session's tokens go through `lib/authStorage.js`, never either storage directly** — and
  *which* store holds them is the whole of what "stay logged in" means: a ticked box puts the pair
  in `localStorage`, an unticked one in `sessionStorage`, which the browser drops with the tab.
  Reads check the session store first, which is also what keeps a pair stored before the split
  existed working. Both halves are needed and neither substitutes for the other: a 90-day refresh
  token in `sessionStorage` still dies with the tab, and a persisted one still expires. A refresh
  rotates **in place** (`storeRotatedTokens`) — it is not a new session and must not re-tier one.
- **Anything that sticks under the navbar positions against `--navbar-h`**, which `Navbar`
  measures into on mount and on every resize. The `60px` two sidebars used to hardcode was a pixel
  short of the bar plus its border, so their top edge painted over it on scroll — and it cannot be
  a constant anyway: the logo and wordmark change size at `sm`, and the Arabic webfont arrives
  after first paint (`display=swap`) and re-lays the line box. The sidebar is also `z-[1100]` as a
  phone drawer and `lg:z-[900]` as a desktop column — one element, opposite stacking, and at the
  navbar's own 1000 the tie was broken by document order.
- **The navbar is full-bleed on purpose — do not put a `max-w`/`mx-auto` back on it.** It had
  `max-w-[1400px] mx-auto`, which is right for a column of prose and wrong for a bar whose content
  is two anchored ends: past 1400px the cap stopped moving the logo and the account controls
  outward, so on a wide monitor both drifted toward the middle with a growing empty margin outside
  them. The row spans the viewport and its padding grows with it; the search box carries its own
  `max-w-[500px]` rather than the bar carrying one for it, and its wrapper is `min-w-0` so it may
  shrink instead of pushing the account controls off a phone screen.
- **The navbar logo is `IrisMark`, and it turns for exactly as long as something is loading** —
  `useIsFetching() + useIsMutating() > 0`. It is the one piece of chrome on every screen, so it can
  report "still working" for the whole app including a background refetch, which no per-section
  spinner covers because those only render where content is absent. **`state="turn"`, never
  `"draw"`**: redrawing a logo the visitor has been looking at reads as the page falling apart and
  reassembling, dozens of times a session. `IrisMark`'s three states are `draw` (appears because
  something is loading — what `Spinner` uses), `turn` (already on screen, now busy) and `still`.
- **A control that changes its words must not change its size** — `SwapLabel` renders every
  wording in one grid cell so the widest fixes the width. A button that resizes on the press moves
  under the finger that pressed it and shoves its neighbours sideways, twice. `SubscribeButton`
  does it by hand because CSS, not a prop, picks its face.
- **A mutation behind a toggle writes the cache in `onMutate`**, rolls back in `onError` and
  invalidates in `onSettled` (`useToggleSubscription`, `useToggleContentVisibility`). Waiting for
  the server means the control ignores the press for a round trip and then jumps; cancel in-flight
  queries first or a refetch lands afterwards and puts the old answer back.
- **`PageShell` + `QueryState`** are the shared shells: don't hand-roll `<Navbar/><SideBar/><main>` or
  another loading/error/empty ternary.
- **Errors go through `lib/describeError.js`**, which prefers the backend's `reason` code (worded in
  `errors.reasons`), then the backend's own Arabic sentence, then a status-based fallback. It only
  trusts a server body **that contains an Arabic letter** — the backend writes Arabic for people and
  English for logs, and both arrive under `error` or `message` depending on the handler.
- **Latin digits everywhere** (`lib/numbers.js` `formatCount`) — counts and dates must agree.
  `displayDate(item)` = `originalPublishDate || publishDate`, or an imported back catalogue all reads
  «منذ ١٩ ساعة».

## Notable pieces

- **`VideoPlayer`** — a `<video>` with `controls` off plus our own `VideoControlBar` for uploaded
  media, YouTube IFrame API for embeds. Owns the settings the bar's menu offers (quality, playback
  speed, repeat, picture-in-picture), fullscreen on the wrapper, the `?t=` start time, and
  watch-progress reporting.
- **The player's control bar is ours, not the browser's** (`VideoControlBar`), and that is what
  makes quality reachable in fullscreen. A browser renders only the fullscreen element's own
  subtree, so a control that is a sibling of the `<video>` does not exist there — and it cannot be
  fixed from outside the bar: the native fullscreen button targets the element itself, it can't be
  intercepted (closed shadow root), re-pointing the request at our wrapper needs a second
  fullscreen request the browser may refuse, and **Safari's button doesn't use that API at all** —
  it puts the element into its own presentation mode, where no `fullscreenchange` fires. So
  `controls` is off, the wrapper `<div>` is what goes fullscreen, and the bar (with the settings
  menu in it) comes along. Turning `controls` off also means **we owe the viewer everything it
  gave**: play/pause, scrubbing with buffered ranges, the clock, volume, a buffering spinner,
  AirPlay where Safari reports a receiver, and the keyboard (space/k, ←→, ↑↓, f, m — the wrapper is
  a focus stop for them). iOS still has element fullscreen only for the `<video>`, so there the
  system player takes over and the menu cannot follow.
- **The whole bar is mirrored, timeline included: the video starts at the RIGHT edge and plays
  leftwards.** `dir="rtl"` governs the bar, `ratioFromPointer` measures from the track's *right*
  edge, the played/buffered fills are anchored `right-0` and the handle is positioned with `right`,
  ArrowLeft seeks **forward** (the keys follow the timeline, not the document), the double-tap
  zones put "back" on the right, the play triangle is mirrored to point left, and the settings
  panel opens `left-0` so it grows into the picture rather than off it. Two islands stay LTR on
  purpose and say so where they are: the clock (`12:04 / 45:10` — bidi otherwise shows the total
  first) and the volume `<input type="range">` **itself, not its group** — the group mirrors like
  everything else, and only the element opts out, because the browser draws and mirrors that thumb
  while the fill under it is painted by hand, and a browser that does not mirror it leaves fill and
  thumb pointing opposite ways. A volume level has no direction to respect either way.
- **Double-tap the sides of the picture to jump ±10s, touch only** (`lib/player/gestures.js`,
  `useDoubleTapSeek`). The sides deliberately do **not** toggle playback — that is what lets the
  first tap of a run be harmless without delaying every single tap by the double-tap window. The
  centre 40% keeps play/pause, which is where the centre disc is drawn. Taps accumulate (10, 20,
  30) while they stay on the same side; the synthesised `click` **and** `dblclick` are both
  suppressed for 400ms after one, or a double-tap would also pause and then enter fullscreen.
- **A centre pause disc shows while a video is playing and the controls are up**, fading with them
  rather than unmounting. The older rule still holds for the *paused* state: no 64px disc over a
  frame someone paused in order to read.
- **Leaving the browser stops the video** (`shouldPauseWhenHidden`). Chrome on Android keeps the
  audio going with a media notification — deliberate, and right for a music site — so a lecture
  left behind carried on talking on someone's data. Picture-in-picture and casting are exempt:
  those are the two cases where playing on with the page hidden is what the viewer *asked for*.
  Nothing ever presses play on return, either — a video the app paused stays paused until the
  viewer says otherwise.
- **Coming back from the background is its own failure and its own repair** (`lib/player/resume.js`,
  `useResumeAfterBackground`). Backgrounding a phone browser aborts the fetches in flight, which on
  the hls.js path is a fatal NETWORK_ERROR: handled as an ordinary one it spent the whole refresh
  budget in seconds against a network nobody was using and destroyed the player before the viewer
  returned. A hidden page now spends nothing and reports nothing — it records that loading must
  restart and waits to be looked at again. On return the element is read (`resumeAction`), given a
  `play()` where that is all it needs, and re-checked a second later (`stillStalled`) for the quiet
  case: not paused, no error, not moving. The repair differs by path — hls.js gets `startLoad` at
  the playhead (plus `recoverMediaError` if the element is errored), the element-owned paths get a
  `load()` with the position and play state carried in the same two refs a quality switch uses.
  Nothing resumes a video the viewer had paused before they left — and since the app now pauses on
  the way out, nothing resumes anything: `wasPlaying` survives only to tell the repair whether
  there was something to repair.
- **On the HLS path the element has no `duration` until the first play** — `autoStartLoad: false`
  defers the *level* playlist (the master is parsed, which is where the quality list comes from),
  and the length lives in the level playlist. So the bar shows `VideoDTO.duration` (a display
  string, parsed by `parseDuration`) until the element knows better, rather than fetching a
  playlist to learn something the API already said. It is a display value only: seeking still
  gates on the element's own duration, since a scrub that moves the handle and does nothing on
  release is worse than one that cannot move.
- **`maxBufferLength` is a floor, not a ceiling.** hls.js reaches its 30s target and then keeps
  doubling towards `maxMaxBufferLength` (default 600s) while `maxBufferSize` (default 60 MB)
  allows — six minutes of the 480p rung — so a press of play pulled most of a lecture nobody had
  decided to finish. Capped at `maxMaxBufferLength: 90` / `maxBufferSize: 20 MB`, the same bill
  `autoStartLoad: false` protects. `backBufferLength: 60` too, since the default keeps every
  watched second in memory.
- **Element state lives in the bar, not in `VideoPlayer`**: `timeupdate` fires several times a
  second, and holding the playhead in the player's state would re-render the `<video>`, the hls.js
  wiring and the settings tree on every tick.
- **Picture-in-picture has a button in the top-right corner as well as a menu row** (both the same
  toggle): it is the one setting a viewer reaches for *while leaving*, so a menu is a step in the
  wrong direction — and with native controls gone, ours is the only way to reach PiP at all. The
  volume slider's fill is painted by hand (a gradient with a hard stop): `appearance-none` stops
  the browser drawing the fill, and `accent-color` cannot restore it on a track with a background.
- **`controls={false}` does not remove the browser's own PiP button.** Chromium draws one over a
  hovered `<video>` that is separate from the control bar, so an uploaded video showed two. It is
  in the closed UA shadow root, so CSS cannot reach it; `disablePictureInPicture` is the only
  opt-out and it is all-or-nothing — it also makes `requestPictureInPicture()` reject. So the
  attribute is **held on and lifted for the single call**, and restored on `leavepictureinpicture`
  rather than after the await (the viewer can close the window from the window's own button) and
  never while still in PiP (setting it then is specified to evict). Gated on `pipSupported`: the
  browser's affordance is only worth removing where ours replaces it, and **Firefox honours the
  attribute while exposing no page-facing PiP API**, so setting it unconditionally would delete
  picture-in-picture for Firefox rather than deduplicate it.
- **A hover-only affordance does not exist on a phone**, and the two in this app are handled
  differently on purpose. The volume slider is revealed by hover under a mouse; `w-0 opacity-0` is
  not a hidden control but a control with no *tap target*, so `[@media(hover:none)]` leaves it
  permanently out — CSS, because it is the same slider either way and there is no behaviour to
  branch. `SubscribeButton` changes what a press *does*, which CSS cannot express, so it reads
  `primaryPointerCanHover()` (`lib/pointer.js`) and arms on the first press instead: hover is
  already a first step, and on touch that step is made pressable. It expires in 3s — an armed
  button left armed is a trap for whoever presses it next.
- **On iOS `HTMLMediaElement.volume` is read-only** — the assignment is accepted, ignored, and
  reads back unchanged, so a volume slider there drags and is never heard. `volumeIsSettable`
  probes a detached `<video>` (never the playing one, and never a user-agent string: iPadOS reports
  itself as a Mac) and the slider is not rendered at all where it fails. `muted` is a separate
  property and *is* settable, so the mute button stays and is the whole of what the page can do to
  the sound on that platform.
- **The settings menu is one level deep, not one flat list**: a root row per setting showing its
  current value («الجودة … تلقائي»), drilling into that setting's options, with toggles (repeat,
  picture-in-picture) on the root. Flat, it was every rung and every speed at once — a dozen rows
  where eleven are noise, and a panel that grows taller with every setting added.
- **Playback speed and volume persist across videos** (`safeStorage`), and the rate is re-applied on
  every `loadedmetadata`: the media load algorithm resets it to `defaultPlaybackRate`, and a rung
  swap is a load, so without that a quality change silently dropped a 1.5× lecture to 1×.
- **Progress reporting has three layers** (`lib/api/beacon.js`): a throttled checkpoint, a flush on
  React unmount (SPA navigation), and a `pagehide` listener using `fetch(..., {keepalive:true})` —
  React never unmounts on a hard refresh, and a normal XHR is cancelled mid-flight.
- **`usePresignedUpload`** — multipart straight to object storage. Raw `fetch`, never the shared axios
  client (its interceptor would leak the JWT to a third-party host, and extra headers can invalidate
  the signature). Retries on 429/5xx/transport, re-signs once on a 403, never retries a cancellation.
  Resume is server-driven: only the session id is persisted locally, and name + size must match.
- **`useMediaUrl`** — presigned playback/read URLs. **Mint on intent, not per rendered card**: a
  presigned URL is a bearer credential, so `BookCard` enables the query on pointer-enter/focus.
- **`YouTubeImportPanel`** — three states in one panel (not linked → linked → verified), polls only
  while `RUNNING`, and must treat `PARTIAL` as *paused, press resume* rather than an error.
  "Verify with Google" appears **only when the status says `oauthAvailable`**, above the token steps
  and never instead of them — the token is the fallback while the backend has OAuth switched off.
  It leaves the SPA for Google and returns through `pages/YouTubeOAuthCallback` at
  `/youtube/oauth/callback`, a path registered verbatim on the Google client: **don't move it**.
  The page strips the one-time code off the URL before doing anything else (history, RUM), and
  `lib/youtubeOAuth.js` refuses to navigate anywhere but `https://accounts.google.com`.
- **`ExpandableText`** — long prose collapsed to four lines with a fade and a disclosure button,
  on a video's and a book's description. The toggle is rendered from a **measurement**, never a
  character count: whether text overflows four lines depends on the width and the face it is laid
  out with, and a "عرض المزيد" that opens nothing teaches readers to distrust the next one. One
  `ResizeObserver` on the *unconstrained inner* element catches all three things that move that
  height — the column resizing, the text changing, and the webfont arriving (`display=swap` means
  the first measurement runs against a fallback face). Nothing is measured while it is open, or
  the box would report "fits" and remove the only control that closes it.
- **`PdfReader`** — react-pdf, lazy-loaded (pdfjs is ~470 KB). TOC, in-document search and page jump
  are all client-side against the loaded document.

## Rules that are easy to break

- **Run `npm run build` before trusting a session's changes.** Rollup does full static import/export
  resolution; `npm run dev` (esbuild, lazy) does not, and a non-existent named import has blanked the
  whole app before. Routes are lazy-loaded, so the failure now shows up at navigation time instead.
- **Verify a `manualChunks` change against the build's chunk list**, not against the config looking
  plausible — the object form matches module ids exactly and silently produces empty chunks.
- **The host must serve `index.html` as `no-cache` and `/assets/*` as `immutable`.** Stale HTML points
  at chunks that no longer exist; that is a blank page after every deploy.
- **`vite.config.js` injects the CSP at build time** and reads `VITE_API_BASE_URL`,
  **`VITE_STORAGE_ORIGIN`** and `VITE_FARO_URL`. Omitting the storage origin in a production build
  ships an app that renders fine and cannot play a video or open a book. Adding a new remote image
  host means adding it to `img-src`.
- **A new outbound host must go in `connect-src`, and `VITE_FARO_URL` is the trap.** Telemetry whose
  whole job is reporting failures cannot report that the CSP is blocking it — `lib/telemetry`
  swallows its own errors by design, which is right for the app and removes the last place this would
  surface. The symptom is an empty dashboard that reads as "no errors happened".
- **Never `dangerouslySetInnerHTML`** — user text (YouTube descriptions) goes through `LinkifiedText`,
  which splits on a URL pattern and renders React children.
- **Any URL from data passes `safeExternalUrl`** before it becomes an `href` or a `<Document file>`.
- `react-hooks/exhaustive-deps` is an **error**. `npm run lint` must stay at zero.
- Prefer **exporting the pure function and testing that** over standing up jsdom. There is no jsdom
  in this repo, on purpose.

## Backend contract

What this app relies on; the mirror lives in the backend's `CLAUDE.md`.

- **`playback-url` / `read-url` are the only source of a playable media URL**, and refuse with **404,
  not 403**. Never construct a bucket URL here — and note that this stopped being impossible and
  became merely forbidden. **A video's renditions and poster are served unsigned from a public
  delivery host** (`media.absarna.com`), because a presigned URL cannot serve HLS at all: a playlist
  names its segments by relative URI and no player propagates the playlist's query string to them,
  so a signed `master.m3u8` loads and the first segment 403s. So a hand-built key *would* load. What
  makes that a bug rather than a shortcut: object keys never appear on a DTO, the key carries an
  unguessable random segment minted per video that nothing here can reproduce, and constructing one
  skips the visibility check that is the whole access decision. **A book's PDF is still presigned**
  against the S3 endpoint — one file, so the relative-URI problem never arises, and it lives in the
  masters bucket, which never becomes publicly readable. That split is why `VITE_STORAGE_ORIGIN` is
  a list.
- **A video media URL does not expire; a book's does.** Do not build on the first half. The backend
  keeps a signed delivery mode as the upgrade path for gated content, so an app that has learned to
  cache a playback URL for a week — or to store one for offline instead of the file — breaks on the
  day that lands. Keep treating every media URL as short-lived, and keep the player's
  refresh-on-segment-error path: it also recovers from a CDN blip or a purge landing mid-session.
- **A poster URL is now stable for a given video**, rather than changing on every fetch as a
  re-signed one did. That makes it properly browser- and edge-cacheable, and it means a changed
  thumbnail URL is a real change rather than noise. `playback-url` returns `{url, quality, qualities}` and
  takes `?quality=`; `quality` is the rung actually served, which is not necessarily the one asked
  for. Switching rungs restarts a `<video>`, so carry the playhead across by hand and use
  `placeholderData: keepPreviousData` or the element unmounts mid-switch.
- **`audio` is a rung like any other and is never the default.** It sorts last (null height,
  `NULLS LAST`) and is the one rung with a catalog label.
- **`VideoDTO.sourceUrl` is null for an upload-backed video; `thumbnailUrl` is null until the worker
  produces a poster.** Treat null as "not yet", never as an error. Object keys never appear on a DTO.
- **`thumbnailUrl` may be a poster the OWNER chose, and `hasCustomThumbnail` is how you tell.** The
  backend ranks custom → worker frame → external URL in one place, so this side never picks; the
  flag exists only so the dashboard can offer "remove" when there is something to remove. Uploading
  one is a presigned single PUT (`useVideoThumbnail`) — three calls, and the PUT must carry the
  `contentType` the mint response gave and **no `Authorization` header**, which is why it uses
  `fetch` rather than the axios client. Replacing a poster changes the URL, so invalidate the lists
  that show it; nothing revalidates on its own.
- **A channel is live as soon as it is created — there is no approval wait to tell an owner about.**
  Starting a YouTube import *is* what sends a channel for review, and it hides the channel until an
  admin approves, so the import panel says so **before** the button rather than after. `importReview`
  (`NOT_REQUIRED` / `PENDING` / `APPROVED`) rides on both `ChannelDTO` and the YouTube status
  response; `APPROVED` is the resume case, where pressing import again changes nothing.
- **After the import, the backend keeps the channel caught up on its own, and this side is its only
  surface.** A daily sweep re-reads the new end of an approved, fully-imported channel's catalogue,
  so a video its owner publishes on YouTube appears here without anybody pressing anything. The
  status response carries `refreshStatus` / `refreshRanAt` / `refreshNewVideos` / `refreshReason`,
  and `YouTubeImportPanel`'s «التحديث التلقائي» block is the whole of it: **no button, no progress,
  nothing to poll** — the panel's poll still runs only while an import is `RUNNING`.
  - **A check that found nothing must still say so.** Zero is the answer on almost every day, so
    rendering nothing for it leaves an owner unable to tell a working daily check from one that
    stopped weeks ago — which is the only question a job with no button can raise. That is what
    `refreshSummary` exists for, and `refreshNewVideos` is the **last** check's count, never a
    running total.
  - `refreshRanAt` is the only honest proof the channel is in the rotation, so `autoUpdateIntro`
    tests it first and never re-implements the backend's eligibility rule — it decides a sentence,
    not whether a channel is refreshed.
  - A failed check is **gold, not red**, and asks for nothing: the next day's sweep is the retry.
    `refreshReason` codes live under `youtube.autoUpdate.reasons` and are deliberately *not* shared
    with `youtube.importReasons`, which tell the owner to press «متابعة الاستيراد».
- **Owner list endpoints take `?search=` and are deliberately ungated** — a dashboard search finds
  the hidden, the held and the still-transcoding, which are the rows an owner is most often hunting
  for. The public `GET /api/channels/{slug}/videos?search=` is the gated counterpart for the channel
  page. Neither has a typo fallback, so "no results" means exactly that.
- **An uploaded video is not merely un-transcoded — it is invisible** until `status` is `READY`. There
  is **no notification channel by design**, so re-fetch when the user comes back and never imply a
  quick turnaround.
- **`review` is owner-only, opt-in, and usually absent — a LIST, one entry per detector.** It
  replaced the `musicReview` / `musicSpans` pair, which could describe only one detector; a video can
  be held for music and noted for explicit content at the same time. Each entry is
  `{type, state, holds, peak, spans}` — `type` is `MUSIC` / `NUDITY` / …, and `state` is one of
  `CLEAN`, `ADVISORY`, `HELD`, `UNCHECKED`, `CLEARED`, `REJECTED`. Treat both as open sets: a new
  detector or a new state must render as an unknown note rather than throwing or falling through
  to "fine" — `ownerNotices` shows every finding that is not `CLEAN`/`CLEARED`, with the generic
  `video.review.unknown.*` copy when it has no words for the pair, and `groupByType` gives an
  unknown detector its own tab. `lib/review.js` owns all of this.
  - **Not mapped by default, by design.** A `CLEARED` video is fully public, so a
    mapped-by-default field would disclose on every feed card that this one had been looked at. The
    backend attaches it only at owner-facing call sites, so its *presence* is already a
    server-side disclosure decision — and `lib/review.js` checks ownership again as a second lock.
  - **Whether a finding hides the video is `holds`, read from the backend — never derived from
    the state here.** `HELD` and `REJECTED` hide for every detector, and `CLEAN`, `ADVISORY` and
    `CLEARED` publish, but `UNCHECKED` is *per type*: it publishes a music finding and hides an
    explicit-content one, because which types fail closed is a rule stated once in the backend's
    `ReviewFindingType` and this repo must not hold a copy. `lib/review.js` derived "hidden" from
    the state alone once, and told the owner of an unscanned explicit-content video, in the
    informational tone, that it was published — while nobody could see it. Wording or colouring a
    published note like a problem trains owners to ignore the tone by the time the one that
    matters arrives. `UNCHECKED` in particular means *the detector did not finish* — never "it
    found something" — and is deliberately never silent.
  - **A held video is `READY`, `visible`, and reachable by nobody.** There is no notification channel
    in this design, so **this field is the entire mechanism by which its owner is ever told** — if it
    renders nothing, their upload simply vanished.
  - **A reviewer decides per type**, so clearing the music says nothing about the explicit-content
    finding beside it. Never collapse the list to one verdict.
  - **`EXEMPT` is a state, and it is silent to the owner** — the only one besides `CLEAN` and
    `CLEARED` that is. It means a platform admin excused this channel from that detector, so
    nothing scanned the video; it publishes and never queues. Quiet for two reasons rather than
    one: nothing happened to the video, *and* telling an owner which detectors skip their channel
    tells them what would and would not be caught. It is an operational fact about the platform's
    moderation and it belongs on `AdminChannels`, which is where it is set.
  - `spans` is a jump-list, **not an edit decision list**, truncated to three: measured on a file
    that is music end to end they cover only 63% of it, so a recording comes back as many separate
    stretches. `peak` is the detector's highest score, for ranking a queue.
- **Confirm is idempotent on `uploadSessionId`**, which is what lets a timed-out publish read as
  "still working" for videos/books — and why it must read as an ordinary failure for articles/posts,
  which have no session.
- **`DELETE .../upload-url/{sessionId}` releases the per-channel quota slot** (5 open sessions per
  channel). Call it when the user declines a resume offer.
- **`GET /api/search` and `/api/search/suggestions` answer the same question** — the dropdown is a
  preview of what Enter will show. If they diverge, it is a backend bug; don't paper over it here.
- **`GET /api/feed` is stable for a viewer for a whole day**, so a refresh is not a way to reshuffle it.
- **`/auth/refresh` rotates the refresh token — store the one it returns.** The response is
  `{token, refreshToken}`, and the replacement carries a fresh expiry, which is what turns the
  session into a window measured from the last visit. Keeping only the access token pins the
  session to the first refresh token's expiry and signs the viewer out on that day however much
  they used the app — that was the bug. `rememberMe` on `/auth/login` (and on
  `/user/change-password`, whose `tokenVersion` bump forces a fresh pair) picks between a
  7-day and a 90-day refresh token; the backend never infers it, so this app has to send it, and
  has to store the pair at the matching tier.
- **The backend answers 401 for "authenticate again" and 403 for "not you" — `client.js` is the
  only thing allowed to act on the difference.** It refreshes on 401, and on 401 alone; a 403 is a
  caller the backend authenticated and refused, so refreshing it would be a round trip that
  changes nothing. It also ends the session on exactly one condition: the refresh itself was
  *rejected* (400/401/403). A refresh that failed for any other reason — offline, a timeout, a
  5xx, the endpoint's own 10/min limit — leaves the tokens alone and rejects the original error,
  which is still a 401. **Nothing else may read that 401 as a logout.** `AuthContext` did, on the
  mount-time `/user/profile` probe, and threw away good refresh tokens over a blip; the session
  now ends only via the `auth:session-expired` event `client.js` dispatches. A null `user` is not
  neutral either — `ProtectedRoute` reads `isPlatformAdmin(user)`, so a failed profile probe
  bounces an admin off `/admin` exactly as a logout would, which is why that probe retries once.
- **Likes' status endpoint is public** (`{liked:false, likeCount:N}` when anonymous); `POST`/`DELETE`
  need a login. `VideoDTO.likeCount` is on cards; books/articles use the status call.
- **Rate limits are per IP and per rule**, with a readable Arabic 429 body (the limiter runs after the
  backend's CORS filter). 429 is deliberately **not** auto-retried — retrying spends the same bucket.
- Uploads are always multipart, extensions allowlisted (`mp4`/`mov`/`pdf`), and `contentType` is
  derived server-side — `file.type` is accepted and ignored.

## Build / verify

```bash
npm run dev      # localhost:5173, expects the backend on localhost:8080
npm run build    # ALWAYS before trusting a session's changes
npm run lint     # must be zero errors
npm test         # vitest, ~270 tests, node environment, no jsdom
```

`VITE_API_BASE_URL` overrides the API host. In dev both CSP env vars fall back to the compose stack,
so no `.env` is needed locally.

## Open items

- **Comment reporting** — authors can edit/delete their own; readers cannot flag. Blocked on a backend
  endpoint.
- `useChannelYouTube` polls `RUNNING` forever; a third stuck import state would need a matching escape.
- Feature ideas: offline/PWA for downloaded books, a transcript view alongside the player with
  click-to-seek, an explicit "new since your last visit" digest page, per-page notes/highlights in
  `PdfReader`, a per-channel takeout view, and series completion state on channel cards.
