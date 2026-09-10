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

## Layout

```
src/
  components/
    ui/        Button, Card, Input, Modal, Badge, Grid, Spinner, EmptyState, QueryState, Avatar
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
               safeStorage, media, numbers, dayjsAr, user, uploadResume, env
```

Path alias `@/` → `src/`. Import from a folder's `index.js` barrel, not the individual file.

## Conventions

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
- **The timeline runs left-to-right in an otherwise fully RTL app.** Time flows left→right in every
  language (so does YouTube in Arabic), so the bar declares `dir="ltr"` and only the *button order*
  mirrors; the settings panel re-asserts `dir="rtl"` for its prose, and ArrowRight seeks forward
  because it follows the timeline, not the document.
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
- **`vite.config.js` injects the CSP at build time** and reads `VITE_API_BASE_URL` +
  **`VITE_STORAGE_ORIGIN`**. Omitting the latter in a production build ships an app that renders fine
  and cannot play a video or open a book. Adding a new remote image host means adding it to `img-src`.
- **Never `dangerouslySetInnerHTML`** — user text (YouTube descriptions) goes through `LinkifiedText`,
  which splits on a URL pattern and renders React children.
- **Any URL from data passes `safeExternalUrl`** before it becomes an `href` or a `<Document file>`.
- `react-hooks/exhaustive-deps` is an **error**. `npm run lint` must stay at zero.
- Prefer **exporting the pure function and testing that** over standing up jsdom. There is no jsdom
  in this repo, on purpose.

## Backend contract

What this app relies on; the mirror lives in the backend's `CLAUDE.md`.

- **`playback-url` / `read-url` are the only source of a playable media URL**, and refuse with **404,
  not 403**. Never construct a bucket URL here. `playback-url` returns `{url, quality, qualities}` and
  takes `?quality=`; `quality` is the rung actually served, which is not necessarily the one asked
  for. Switching rungs restarts a `<video>`, so carry the playhead across by hand and use
  `placeholderData: keepPreviousData` or the element unmounts mid-switch.
- **`audio` is a rung like any other and is never the default.** It sorts last (null height,
  `NULLS LAST`) and is the one rung with a catalog label.
- **`VideoDTO.sourceUrl` is null for an upload-backed video; `thumbnailUrl` is null until the worker
  produces a poster.** Treat null as "not yet", never as an error. Object keys never appear on a DTO.
- **An uploaded video is not merely un-transcoded — it is invisible** until `status` is `READY`. There
  is **no notification channel by design**, so re-fetch when the user comes back and never imply a
  quick turnaround.
- **Confirm is idempotent on `uploadSessionId`**, which is what lets a timed-out publish read as
  "still working" for videos/books — and why it must read as an ordinary failure for articles/posts,
  which have no session.
- **`DELETE .../upload-url/{sessionId}` releases the per-channel quota slot** (5 open sessions per
  channel). Call it when the user declines a resume offer.
- **`GET /api/search` and `/api/search/suggestions` answer the same question** — the dropdown is a
  preview of what Enter will show. If they diverge, it is a backend bug; don't paper over it here.
- **`GET /api/feed` is stable for a viewer for a whole day**, so a refresh is not a way to reshuffle it.
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
npm test         # vitest, ~190 tests, node environment, no jsdom
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
