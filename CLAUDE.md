# Manara Platform — Frontend

React 18 + Vite frontend for the Manara media platform (videos/books/articles). Plain JavaScript (`.jsx`, not TypeScript). RTL (Arabic) throughout. Backend lives at `/Users/kareemismail/IdeaProjects/manara-platform` (separate repo, has its own `CLAUDE.md`).

The repo directory is still named `elhamy-frontend-enhanced` (old project name) and `.idea/` project files still reference it — cosmetic leftovers, not renamed. `package.json`'s `name` field is `manara-frontend`.

Keep this file updated when architecture/conventions change — not a changelog for every commit, just what a fresh session would otherwise have to re-derive by reading everything.

## Styling: Tailwind CSS

Fully migrated from hand-rolled inline `style={{}}` objects to Tailwind (`tailwind.config.js`). Brand palette is defined as Tailwind theme tokens — primary green `#0D6B4D`, gold `#D4AF37` — under `colors.primary`/`colors.gold`/etc. Don't reintroduce inline style objects for anything Tailwind can express; the one legitimate exception is a handful of components with genuinely runtime-variable values Tailwind's JIT can't see (`Grid.jsx`'s `minWidth`/`gap`, `Spinner.jsx`'s `size`) — those stay inline on purpose, commented as such.

**Design language**: YouTube-style for browsing (Home, Search, ChannelPage's video tab — thumbnail grid, sticky top nav, collapsible sidebar). Medium-style for reading (Books, Articles, Biography — centered `max-w-reading` column, generous whitespace). Logo is a hand-authored SVG lighthouse mark (`منارة` = "lighthouse/beacon") at `src/assets/logo.svg`, also used as `public/favicon.svg`.

## File structure

```
src/
  assets/       logo.svg
  components/
    ui/         Button, Card, Input, Modal, Badge, Grid, Spinner, EmptyState, Avatar — barrel export via index.js
    layout/     Navbar, SideBar, PageShell, SearchBar — barrel export via index.js
    content/    VideoCard, BookCard, ArticleCard, VideoPlayer, CommentsSection — barrel export via index.js
    admin/      5 CMS tab components — barrel export via index.js (see "Known gaps" — currently unrouted)
    auth/       EmailVerificationNotice — barrel export via index.js, see "Email verification" below
  pages/        route-level components
  hooks/        useContents, useBooks, useArticles, useBiography, useChannels, useComments,
                useAdminData, useParallelUpload, useDebouncedValue, useOutsideClick —
                see "Data fetching: React Query" below and "Search suggestions" below
  contexts/     AuthContext
  lib/
    api/        client.js (axios instance + interceptors), auth.js, contents.js (thin per-domain wrappers)
    env.js       API_BASE_URL / STREAM_BASE_URL, from VITE_API_BASE_URL env var (no more hardcoded localhost:8080)
    media.js     resolveMediaUrl(), extractYouTubeId(), youtubeThumbnail() — shared, don't reimplement per-component
```
Path alias `@/` → `src/` (configured in `vite.config.js`). Import from a component folder's `index.js` (e.g. `import { Button, Card } from '@/components/ui'`), not the individual file, unless there's a specific reason not to.

## `PageShell`

Shared app shell (`components/layout/PageShell.jsx`) wrapping `Navbar` + collapsible `SideBar` (mobile drawer) + a `<main>`. Most browsing pages should render `<PageShell contentClassName="...">{children}</PageShell>` rather than hand-rolling `<Navbar/><SideBar/><main>` — pages that don't want a sidebar pass `sidebar={false}` (used by the Medium-style reading pages and auth forms).

## Comment auth model

Comments (top-level and replies) require login. `userName`/`userEmail` are **derived server-side from the JWT**, never trusted from the request body — this was a deliberate security fix (previously anyone could post as any name, including impersonating "Admin"). `CommentsSection.jsx` shows a "سجّل الدخول" prompt instead of a comment form when logged out; don't reintroduce free-text name/email inputs.

## Email verification

Backend gates two actions on `user.emailVerified` (login itself is never blocked, see backend `CLAUDE.md`): posting a comment/reply and creating a channel. Both now fail with `403` + `{"emailVerificationRequired": true}` (plus a human-readable message under either `error` or `message` depending on which controller — don't rely on that key, it's inconsistent; see backend `CLAUDE.md`'s email-verification section).

- `src/pages/VerifyEmail.jsx` (routed at `/verify-email`, public) reads `?token=` from the URL, calls `verifyEmail(token)` from `lib/api/auth.js`, and shows a success/error state. If the browser also happens to be logged in as that user, it calls `refreshUser()` (exposed from `AuthContext`, wraps the existing `fetchUserProfile`) so the cached `user.emailVerified` flips without a re-login.
- `src/components/auth/EmailVerificationNotice.jsx` (barrel: `components/auth`) is the shared "verify your email" banner + resend button, used by `CommentsSection.jsx` and `CreateChannel.jsx` — both catch the 403, check `err.response?.data?.emailVerificationRequired`, and render this instead of (or alongside) their existing generic error handling. Reach for this component rather than a new inline banner if a third gated action shows up.
- `lib/api/auth.js` exports `verifyEmail(token)` and `resendVerification()` (the latter relies on the shared `client.js` interceptor to attach the JWT, same as every other authenticated call).
- `user.emailVerified` needs no special plumbing beyond this — it's just another field on the `user` object from `/auth/login`, `/auth/register`, and `/user/profile`, all already consumed as-is (see "no formal type" — the user shape is implicit, inferred from usage).
- `Register.jsx` shows a one-off `alert()` after a successful registration noting a verification email was "sent" (it's actually just logged server-side for now — see backend `CLAUDE.md`, no real provider wired up yet) — this predates the toast system below and is now the outlier, not the convention; don't copy this pattern for a new success/error message.

## Data fetching: React Query

`App.jsx` wraps the app in a `QueryClientProvider` (`staleTime` 10min, `cacheTime` 30min, no refetch-on-focus/mount/reconnect). Every GET that reads app data should go through a `useQuery`/`useInfiniteQuery` hook in `hooks/`, not a raw `api.get` in a page's `useEffect` — a direct `useEffect` fetch bypasses the cache entirely, re-hits the backend on every mount, and can't be deduped against another component fetching the same thing (this used to happen: `SideBar.jsx` and `Home.jsx` each independently re-fetched `/channels/my-channels` before both were switched to the shared `useMyChannels()` hook in `hooks/useChannels.js`). The one deliberate exception is `AuthContext`'s own profile fetch — it's session state tightly coupled to login/logout's `localStorage` side effects, not cacheable "data" in this sense, so it stays a plain `api.get` in `fetchUserProfile`.

- `hooks/useContents.js` — home feed, infinite content browsing, infinite search (`useInfiniteSearch`, mirrors `useInfiniteContents`'s accumulating-pages shape for `SearchPage.jsx`'s "load more"), search-box typeahead (`useSearchSuggestions`, see "Search suggestions" below), single content (`useContent`), related content, categories, watch/reading history.
- `hooks/useBooks.js` — public `useBooks`/`useBook`, plus `useBookReadProgress`/`useSaveReadProgress` (the latter updates its cache optimistically in `onMutate`, not `onSuccess`, matching the reader's original never-block-on-network behavior for a best-effort progress write).
- `hooks/useArticles.js`, `hooks/useBiography.js` — same shape, straightforward.
- `hooks/useBiography.js`'s query key (`['biography']`) is deliberately the same key `useUpdateBiography` (`hooks/useAdminData.js`) invalidates on save — an admin edit shows up on the public page with no extra wiring.
- `hooks/useComments.js` — `useComments(type, id)` plus `useCreateComment`/`useReplyComment` mutations that invalidate that same key.
- `hooks/useChannels.js` — the big one: public channel page data (`useChannel`, `useChannelContents`/`Books`/`Articles`/`Posts`, `useSubscriptionStatus`, `useToggleSubscription`), sidebar/subscriptions data (`useAllChannels`, `useSubscriptions`, `useUnsubscribe`, `useMyChannels`), owner management (`useChannelContentList`, `useUpdateChannel`, `useCreateChannelContent`, `useToggleContentVisibility`, `useDeleteContent` — these last three share an `invalidateChannelContent` helper keyed off a `type → public query key` map, so a publish/toggle/delete on `ChannelManage.jsx` refreshes the same list `ChannelPage.jsx`'s visitors see), and admin channel moderation (`usePendingChannels`, `useAllAdminChannels`, `useApproveChannel`/`useRejectChannel`/`useSuspendChannel` — shared by both `Admin.jsx`'s dashboard and `AdminChannels.jsx`).
- Video visibility/delete toggled from `Home.jsx`'s feed (owner's own videos, mixed into the feed) can't use the fixed-`(slug, type)` hooks above since the slug varies per video — it stays a direct `api.patch`/`api.delete`, but its `refreshFeed(slug)` helper invalidates that specific channel's `channel-contents`/`channel-manage` cache keys too, not just `['feed']`/`['contents']`.
- `ChannelManage.jsx`'s two file-upload handlers (`handleVideoFileSelect`/`handleBookFileSelect`) stay plain `api.post` with `onUploadProgress` — they populate a form with a returned URL, not something cacheable, and `useMutation` doesn't have a clean spot for upload-progress callbacks.

## Search suggestions (`components/layout/SearchBar.jsx`)

Replaces `Navbar.jsx`'s old inline `<form>` — shows suggestions on focus (before typing, via a blank-`q` request), narrows them as the user types, backed by `GET /api/search/suggestions` (see backend `CLAUDE.md`'s own section on this endpoint, including its `pg_trgm` close-match fallback for typos).

- `hooks/useSearchSuggestions(rawQuery, limit, enabled)` (in `useContents.js`) debounces `rawQuery` itself via `hooks/useDebouncedValue.js` (200ms) rather than debouncing the request — the debounced value becomes the `queryKey`, so React Query's own cache handles "retype something already seen" for free, no separate cache needed. The queryFn passes React Query's `signal` through to axios so a superseded in-flight request (a fast typist moving past `"qur"` before it resolves) gets cancelled instead of racing back and clobbering a newer result.
- **Text-only suggestion rows, deliberately no thumbnails**: an earlier version showed a small thumbnail per row (by analogy to the app's YouTube-style browsing elsewhere), but real YouTube's own search-suggestion dropdown is text-only — thumbnails only appear once you're on the actual results grid. Reverted to text + a small search icon per row: no extra per-row image request, no broken-image/layout-shift edge cases in a compact dropdown, faster to scan.
- **Distinguishes "no matches" from "request failed"**: `showNoMatches` in `SearchBar.jsx` is `true` only once a fetch for the current (non-blank) query has actually settled successfully with zero results — gated on `!isFetching && !isError`, so a debounce-triggered refetch never flashes "no results" before the real one lands, and a genuine network error never gets mislabeled as "nothing matches" (mirrors the same distinction `SearchPage.jsx` already made between its `isError` and empty-`results` branches).
- `hooks/useOutsideClick.js` closes the dropdown on an outside click; suggestion rows use `onMouseDown` (fires before both this listener and the input's own blur) so a click still registers as a selection rather than the dropdown just closing out from under it.
- Keyboard: ArrowUp/ArrowDown move a `highlightIndex` through the suggestion list, Enter selects the highlighted suggestion (or submits the typed text as a full search if nothing's highlighted), Escape closes the dropdown.
- Clicking a suggestion navigates straight to `/video/{id}`; submitting the form (or Enter with nothing highlighted) navigates to `/search?q=...` same as before.

## Password reset & change password

- `src/pages/ForgotPassword.jsx` (`/forgot-password`, public) and `src/pages/ResetPassword.jsx` (`/reset-password?token=...`, public) mirror `VerifyEmail.jsx`'s status-state pattern (form → success/error). `ForgotPassword` always renders the same success state after a successful request — the backend's response is deliberately identical whether or not the email is registered (see backend `CLAUDE.md`), so there's no separate "email not found" branch to build.
- `lib/api/auth.js` exports `forgotPassword(email)`, `resetPassword(token, newPassword)`, `changePassword(currentPassword, newPassword)`. None of these go through `AuthContext` — they don't touch the token/localStorage — called directly the same way `VerifyEmail.jsx` calls `verifyEmail`.
- `UserProfile.jsx` has a second card, `ChangePasswordCard`, below the profile-save form — its own local state and submit handler, deliberately not merged into the profile form (different validation, different endpoint).
- `Login.jsx` links to `/forgot-password` ("نسيت كلمة المرور؟") under the password field.

## `Input.jsx`: floating-label fields

Redesigned from a static label-above-the-box to a Material/Hetzner-style floating label (starts centered inside the box like a placeholder, animates to sit on the border on focus or once filled — pure CSS via `peer-focus`/`peer-[:not(:placeholder-shown)]`, no extra JS state for the animation itself). One shared component, so this affects every page listed in "File structure" that imports `Input` (11 call sites) at once.

- **`dir` controls only the typed *value*'s direction/alignment, never the label.** The floating `<label>` is hardcoded `dir="rtl"` + `text-right` regardless of the field's own `dir` — labels are always Arabic in this app, while a field's own `dir="ltr"` describes Latin-script *content* (email, slug). An earlier iteration shared one `dir` between both, which rendered Arabic labels left-aligned on every `dir="ltr"` field.
- **Label/icon slots are physical (`right-3`/`left-2.5`), not logical (`start-*`/`end-*`).** They need to sit on the same visual side regardless of a field's `dir` — logical properties flip with `dir`, which put the label and the password eye-toggle on the same physical side for `dir="ltr"` fields, overlapping. Only the typed value's own alignment follows `dir` (`text-left`/`text-right`, or unset for `dir="auto"` — see below).
- **Gotcha**: don't rely on class order to make a conditional utility "win" over a base one on the same property (e.g. a base `pl-3.5` plus a conditional `pl-11` for password fields) — Tailwind's generated stylesheet isn't ordered by numeric value, so the base class can land *later* in the compiled CSS and silently override the "override," with no visual sign anything is wrong. Use one mutually-exclusive expression instead (`isPassword ? 'pl-11' : 'pl-3.5'`).
- Vertical padding is symmetric (`py-2.5`) — the floated label doesn't need reserved top room (it already straddles the border via `top-0 -translate-y-1/2`, independent of the input's own padding); asymmetric padding was tried and pushed typed text/cursor below the box's true center, out of alignment with the (fully-centered) password eye-toggle button.
- `date`/`color` input types keep the old static label-above-the-box layout (`FLOATING_LABEL_UNSUPPORTED_TYPES`) — native browser chrome for those doesn't respect a custom placeholder or `:placeholder-shown` reliably.
- Password show/hide eye-icon toggle behavior is unchanged (`showPassword` state flips the `<input>`'s `type`), just repositioned per the physical-side rule above.

## Auth fields: username/password are Latin-only, by design

`Login`/`Register`/`UserProfile`/`ResetPassword`'s username and password `Input`s are `dir="ltr"`, not `dir="auto"` — this was deliberately tried and reverted. Backend (`AuthService.register`, see backend `CLAUDE.md`) now restricts usernames to `[a-zA-Z0-9_]` — an identifier field, same category as email/slug, as opposed to free-text display fields (full name, bio, channel name/description) which stay unrestricted and Arabic-friendly. Password fields were never going to be usably Arabic either way: `PasswordValidator` requires at least one Latin uppercase/lowercase letter, which Arabic script has no equivalent of, so `dir="auto"` was advertising a flexibility validation would immediately reject. The floating label above stays Arabic regardless of any of this — only the value's own direction changed.

## Owner content management (videos only, so far)

- Sidebar has a distinct "قنواتي" (My Channels) section (via `GET /channels/my-channels`) separate from subscriptions and "اكتشف قنوات أخرى" (discover) — each list excludes items already shown in the others.
- `Home.jsx` fetches the viewer's owned channels and builds a `channelId → slug` map. `VideoCard` receives `isOwner`/`onToggleVisibility`/`onDelete` props and, when the viewer owns that video's channel, shows an eye/eye-off and delete icon directly on the thumbnail (always-visible, not hover-gated — this was raised as a possible UX concern but the hover-only change was never actually implemented, so don't assume it happened). A hidden video also shows a "مخفي" badge.
- `ChannelManage.jsx`'s Videos/Books/Articles tabs each show a full list of that channel's content (visible + hidden) with the same toggle/delete controls — this is the one place all three content types get this treatment; Books/Articles don't have it on their own public listing pages the way Home does for videos.

## Watch/reading progress: reliability on refresh & tab-close (`lib/api/beacon.js`)

`VideoPlayer.jsx`'s watch-progress reporting and `PdfReader.jsx`/`BookDetail.jsx`'s reading-progress reporting each have three layers, not just a periodic timer:

1. A coarse periodic/per-event checkpoint (video: `onTimeUpdate` throttled to 60s — widened from 15s once the layers below covered the common exit paths, so this only bounds worst-case loss on an ungraceful crash; books: every page turn, debounced 1s just to coalesce rapid flipping).
2. A same-page flush on React unmount (`useEffect` cleanup) — covers in-app (SPA) navigation away.
3. A `pagehide` listener using `flushOnUnload()` (`lib/api/beacon.js`) — covers hard refresh/tab-close/hard navigation, where React never unmounts (the whole JS context is torn down first, so layer 2 never runs) and a normal axios/XHR call would get cancelled mid-flight by the browser anyway. `flushOnUnload` sidesteps both with a `fetch(..., { keepalive: true })`, reading the JWT straight from `localStorage` (same source `client.js`'s interceptor uses) since it deliberately bypasses axios.

None of this adds request volume — layer 1 actually got *less* frequent for video (60s vs. 15s); layer 3 is a reliability fix for a write that was already attempted via layer 2 but silently lost on refresh, not a new one.

- `VideoPlayer.jsx`'s `MIN_WATCH_SECONDS` (5s) gate: a play under 5 seconds never creates/bumps a watch-history row — otherwise an accidental click-and-immediately-back-out would count as "watched" and could push a genuinely-watched video out of the backend's per-user 200-row cap (see backend `CLAUDE.md`'s watch-history section).
- `PdfReader.jsx` exposes a second callback, `onPageChangeImmediate(page, total)`, fired synchronously on every page turn (unlike the debounced `onPageChange`) at zero network cost — `BookDetail.jsx` uses it to keep a ref of the *true* latest page for its own `pagehide` flush, since the debounced network write (1s) might not have fired yet.

## Toast notifications (`contexts/ToastContext.jsx`)

`ToastProvider`/`useToast()`, mounted at the app root in `App.jsx` (alongside `AuthProvider`). Renders bottom-center, auto-dismissing (3s) toasts with enter/exit animation (`animate-toast-in` keyframe in `tailwind.config.js`). Added to replace the static, in-page success/error banner pattern in `UserProfile.jsx` (profile form + `ChangePasswordCard`) and `ChannelManage.jsx` (its `showMessage(...)` helper, used by every video/book/article/post upload/publish/delete/visibility-toggle/channel-save action) — reach for `useToast()` for any new success/error feedback rather than another local banner.

## Home feed & related videos (deliberately non-addictive)

`Home.jsx`'s default view ("الكل" / no category selected) is a **bounded, non-paginated** three-section feed via `useFeed()` (`hooks/useContents.js` → `GET /api/feed`): "من القنوات التي تتابعها" (subscribed channels), "اقتراحات لك" (discover — same categories as your subscriptions, other channels), "استكشف" (featured picks). This is a fixed snapshot, not an infinite scroll — no "load more" on any of the three sections, no autoplay, no watch-history-driven ranking. That's intentional, not a missing feature: the explicit design goal (see backend `CLAUDE.md`'s `feed` package notes) is a platform that suggests useful related content without becoming an engagement-optimized, hard-to-put-down feed. Selecting a category chip switches to the old plain paginated `useInfiniteContents(...)` browsing (unchanged) — that's the user deliberately choosing to keep looking, so pagination there is fine.

`VideoDetail.jsx` shows a bounded "قد يعجبك أيضاً" related-videos row via `useRelatedContent(id)` (`GET /api/contents/{id}/related`) — same category, capped, no autoplay/next-video chaining. Same reasoning: recommend, don't hook.

## Known gaps

- The 5 admin CMS tab components (`VideosTab`/`BooksTab`/`ArticlesTab`/`DashboardTab`/`BiographyTab`) are fully built but **not wired into any route** — `Admin.jsx` (the page actually routed at `/admin`) is a separate, simpler stats+channel-approval dashboard. The Navbar's "رفع" (Upload) link points to `/upload`, which isn't a registered route.
- No git repository as of the last check — if one still doesn't exist, that's worth flagging to the user rather than assuming.

## Build / verify

```
npm run dev      # localhost:5173
npm run build    # ALWAYS run before trusting a session's changes
```
`npm run build` (Rollup) does full static import/export resolution and will catch things `npm run dev` (esbuild, lazy) won't — e.g. an imported named export that doesn't actually exist in the package. This exact class of bug (a `lucide-react` icon that didn't exist in the installed version) once broke the entire app with a blank white screen on every page, because `App.jsx` statically imports every page up front rather than lazy-loading per route — one bad import anywhere breaks the whole module graph on load. `npm run build` catches it in ~1.5s; a dev-mode HMR log won't.

Backend must be running (see its own `CLAUDE.md`) on `localhost:8080` for the app to have real data — `VITE_API_BASE_URL` env var overrides this if needed.

---

# Review findings — 2026-09-01

Full read-through of the frontend (no code changed). Everything below is **open**; delete an
entry when it's actually fixed rather than leaving it here as history. Backend-side findings
live in the backend's own `CLAUDE.md` under the same heading — several items here have a
matching entry there and are best fixed on both sides at once.

## Bugs

Fixed 2026-09-01 (session after the review that logged this list): the React Query v4→v5
option renames (`cacheTime`→`gcTime` in `App.jsx`, `keepPreviousData: true`→`placeholderData:
keepPreviousData` in `useContents.js`), `AuthContext.fetchUserProfile` no longer logging out on
a non-401/403 failure, client-side password/username validation now mirroring the backend's
actual rules via new `lib/validation.js` (used by `Register.jsx`, `ResetPassword.jsx`,
`UserProfile.jsx`'s `ChangePasswordCard`), `/admin` and `/admin/channels` now gated on
`user.role === 'PLATFORM_ADMIN'` (`ProtectedRoute`'s new `adminOnly` prop in `App.jsx`),
`client.js`'s token refresh now deduped behind a shared in-flight promise, stores a rotated
refresh token when the backend returns one, and signals expiry via a `window` event
(`auth:session-expired`, handled in `AuthContext`) instead of a hard `window.location.href`
reload, `extractYouTubeId` now checks an exact hostname set instead of `.includes(...)`, and
`VideoCard`'s broken-thumbnail `onError` now falls back to the 🎬 placeholder instead of
leaving an empty box.

**Postponed — all below are in `ChannelManage.jsx`/`Navbar.jsx`'s content-publish path, which
is getting a rewrite alongside a dedicated upload backend service; fixing them now would be
wasted work.** Revisit once that lands.

1. **Empty date/number form fields are sent as `""`.** `ChannelManage`'s video/book/article/post
   payloads always spread the whole form object, so an untouched `publishDate` or `pages` goes
   over the wire as an empty string rather than being omitted. Jackson's coercion of `""` into
   `LocalDate`/`Integer` is version- and config-dependent — verify what the API actually does
   with it, and strip empty strings from the payload either way.
2. **The video publish form has no publish-date input at all** (books and articles do), so every
   video is created with `publishDate = null` — and because every backend list sorts
   `ORDER BY publish_date DESC` and Postgres sorts NULLs first, **newly published videos pin
   themselves to the top of the home feed and channel pages forever**. Add the field (and see
   the backend note about `NULLS LAST`). **Needs a BE-side look too** (the `NULLS LAST` sort
   fix) even once the form gets the field, for any existing NULL rows.
3. **`videoForm.speaker` and `videoForm.isFeatured` are dead state** — neither has an input, and
   `handleVideoSubmit` overrides `speaker` with `channel.name` after the spread anyway. Drop
   them or render them.
4. **Platform admins get a channel-management page where every action 403s.**
   `ChannelManage` admits `isOwner || isAdmin`, but the backend's `canManageChannel` is
   owner-only for all content operations (only `PUT /api/channels/{id}` has an admin bypass).
   **Needs a BE decision**: either give admins real access server-side (extend
   `canManageChannel`'s bypass) or drop `isAdmin` from the frontend guard to match reality.
5. **The Navbar's "رفع" link points at `/upload`, which is not a route** — the `*` fallback
   silently redirects to Home. Already listed under "Known gaps"; leave as-is until the new
   upload service defines where this should point.

## UX / UI

- **`<html lang="en">` and no `dir="rtl"` on the root element.** The app is Arabic RTL
  throughout but sets direction on 29 individual page wrappers instead. Screen readers announce
  it as English, and anything rendered outside those wrappers (the `ErrorBoundary` fallback,
  toasts) inherits LTR. One-line fix in `index.html`: `<html lang="ar" dir="rtl">`, then delete
  the per-page `dir="rtl"`.
- **No per-page `<title>` and no OG/Twitter meta.** Every page is "منارة | Manara" in the tab,
  in history and in every shared link — for a public content platform whose whole point is
  spreading educational material, shared video/book/article links render as an untitled,
  imageless card. Highest-value UX item on this list.
- **A video's detail page never names its channel.** `VideoDetail` shows duration, category,
  series and speaker but no channel link — on a multi-channel platform you can't get from a
  video to the channel that published it. `VideoCard` has the same gap in a mixed feed. Add
  channel name + avatar + link to both.
- **Channel pages ignore `bannerUrl` and `description`.** `ChannelManage` lets an owner set both,
  `ChannelDTO` returns both, and `ChannelPage` renders neither — just a flat `primaryColor`
  band and an initial-letter avatar. Owners are filling in fields that never appear.
- **Logged-out visitors always see "0 مشترك"** on channel pages, because `useSubscriptionStatus`
  is gated on `!!token` (correctly — the endpoint 500s for anonymous callers). Needs the
  backend split of public count vs. per-caller flag; until then the count should be hidden
  rather than shown as zero.
- **`alert()` and `window.confirm()` are still the interaction model in five places** —
  `Home` (visibility toggle + delete), `CommentsSection` (×2), `Admin` (×2), `Register` — even
  though `ToastContext` exists and is documented as the convention, and `Modal` exists unused
  for confirmations. Destructive deletes in particular deserve the real modal.
- **A channel's public video tab silently caps at 50** (`useChannelContents` hard-codes
  `size=50`) with no "load more", and the tab count badge shows the truncated number. Books,
  articles and posts have no pagination at all, client or server.
- **`/books` and `/articles` have no search, filter, sort or pagination** — just a full grid.
  The library is the page most likely to grow past usability first.
- **Thumbnails use `object-contain` inside a fixed-height box**, so YouTube's 4:3 `hqdefault`
  images sit letterboxed against the card background and the grid reads as ragged. An
  `aspect-video` container with `object-cover` fixes it.
- **Comment count counts top-level comments only** (`comments.length`), so a thread with 3
  comments and 10 replies reads "التعليقات (3)".
- **No comment editing, deleting or reporting for the person who wrote it** — the only deletion
  path is a platform-admin API call with no UI. Also no character limit or counter on the
  textarea.
- **`ar-EG` date formatting renders Arabic-Indic digits** (`٢٠٢٦`) in comments, while durations,
  subscriber counts and publish dates elsewhere use Latin digits. Pick one.
- **The comment date has no time component** and no relative formatting ("منذ ساعتين") — `dayjs`
  is already a dependency and unused for this.
- **No 404 page.** `*` redirects to Home, so a typo'd or dead link looks like a successful
  navigation.
- **Category chips can lead to empty result grids** — `/api/categories` includes categories that
  only hidden content uses (backend issue, but it surfaces here).
- **Watch history never records for YouTube-sourced videos** (no `timeupdate` without the
  IFrame Player API), which is most of the catalogue — so "continue watching" is empty for the
  content people actually watch. Loading the IFrame API for `onStateChange`/`getCurrentTime`
  would close this without changing the feature's design.
- **The YouTube embed uses `youtube.com` rather than `youtube-nocookie.com`**, sets no `rel=0`,
  no `loading="lazy"`, and passes the deprecated `frameBorder` prop. A privacy-respecting
  platform should use the no-cookie domain.

## Accessibility

- Six `aria-*` attributes in the entire app. The most concrete gaps:
- **`VideoCard`/`BookCard` are clickable `<div>`s** with nested `<button>`s — not focusable,
  not keyboard-activatable, no `role`. Every card grid in the app is mouse-only.
- **No focus management on route change** and no skip-to-content link; focus stays wherever it
  was, so keyboard and screen-reader users restart from the top of the DOM on every navigation.
- **The mobile sidebar drawer** doesn't trap focus, isn't marked `role="dialog"`/`aria-modal`,
  and doesn't restore focus on close. Same for `Modal`.
- Icon-only buttons rely on `title` rather than `aria-label` in most places (`Navbar`'s menu
  button is the exception that does it right).
- Colour-only state signalling on the visible/hidden toggle and the subscribe button.

## Refactoring / structure

- **`ChannelManage.jsx` is 507 lines** holding five tabs, four content forms, twelve mutations
  and four lists, with the per-type logic copy-pasted four times. Extract a
  `<ContentPublishForm type=… fields=… />` driven by a per-type field schema and a
  `useChannelContentTab(slug, type)` hook that bundles list + create + toggle + delete. This
  mirrors the identical duplication on the backend (`ChannelContentController`) and the two are
  worth fixing together — adding a fifth content type currently means editing eight files
  across both repos.
- **`PageShell` is bypassed by the pages that most need it** — `ChannelPage`, `VideoDetail`,
  `ChannelManage`, `Admin`, `Register` and others hand-roll `<div dir="rtl"><Navbar/>…`. That's
  also why the loading and error states differ subtly from page to page.
- **Loading/error/empty states are re-implemented per page.** `Spinner` + `EmptyState` exist;
  a small `<QueryState query={…}>` wrapper (or a shared `renderQuery` helper) would remove the
  same four-branch ternary from ~12 files, and would stop new pages from inventing a
  thirteenth variant.
- **`ProtectedRoute` hand-rolls an inline-styled spinner** using CSS variables
  (`var(--bg)`, `var(--border)`) — the one surviving pocket of the pre-Tailwind style, and it
  duplicates `Spinner`.
- **The `user` object shape is implicit** and read as `user?.role`, `user.id`, `user.emailVerified`
  across a dozen files. Even without TypeScript, one `lib/user.js` exporting
  `isPlatformAdmin(user)` / `canManageChannel(user, channel)` would stop role strings being
  compared inline in `Navbar`, `ChannelManage` and `App`.
- **Direct `api.get/post/patch/delete` calls still leak into pages** — `Home`'s visibility
  toggle and delete, `ChannelManage`'s two upload handlers. The `Home` ones have a documented
  reason (variable slug) but could be a `useToggleVideoVisibilityByChannelId` hook instead of
  hand-rolled cache invalidation.
- **Every page is statically imported in `App.jsx`.** `React.lazy` per route (as already done
  for `PdfReader`) would cut the initial bundle substantially — `framer-motion`,
  `react-hook-form` and the admin tabs are all paid for on first paint. Worth checking whether
  `framer-motion` and `react-hook-form` are used at all; several dependencies look unreferenced.
- **The five admin CMS tab components remain unrouted dead code** (existing "Known gaps" entry)
  — either wire them up or delete them; they're currently a second, divergent implementation of
  what `ChannelManage` does.
- **`.DS_Store` files are committed in `src/`, `src/components/` and `src/lib/`**, and the repo
  still has no git repository per the note above — worth resolving both.

## Feature ideas that fit the platform's values

Matching the backend's list; these follow the "surface useful content, don't optimise for
time-on-site" principle rather than fighting it.

- **Bookmarks / "read later"** as an explicit, user-owned list — the honest alternative to
  behavioural recommendation.
- **Series navigation**: a lecture that knows it's part 3 of 12, with previous/next and a
  progress indicator. This is the feature that turns the library into a course, and it's the
  strongest argument for the non-addictive feed — people come back for a reason they chose.
- **A share sheet with proper link previews** (depends on the meta-tag work above) plus copy-
  link-at-timestamp for videos.
- **Reader improvements on `PdfReader`**: text search inside the PDF, page-number jump,
  a table of contents, and per-page notes/highlights keyed to the existing reading history.
- **Offline/PWA for downloaded books and articles** — genuinely useful for an audience with
  intermittent connectivity, and it doesn't require any engagement machinery.
- **Transcript view alongside the video player** (needs the backend transcript work), with
  click-to-seek. Biggest accessibility and skimmability win available.
- **A "من القنوات التي تتابعها" digest/inbox page** — an explicit list of what's new since your
  last visit, which you can clear, instead of an implicit ranked feed.
- **Dark mode.** The Tailwind theme is already fully tokenised; a `dark:` variant pass is
  mostly mechanical and it matters for long-form reading at night.
- **Arabic search normalization on the client's typeahead display** (alef/hamza forms,
  diacritics) to match the backend fix.
