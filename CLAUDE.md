# Manara Platform — Frontend

React 18 + Vite frontend for the Manara media platform (videos/books/articles). Plain JavaScript (`.jsx`, not TypeScript). RTL (Arabic) throughout. Backend lives at `/Users/kareemismail/IdeaProjects/manara-platform` (separate repo, has its own `CLAUDE.md`).

The repo directory is still named `elhamy-frontend-enhanced` (old project name) and `.idea/` project files still reference it — cosmetic leftovers, not renamed. `package.json`'s `name` field is `manara-frontend`.

Keep this file updated when architecture/conventions change — not a changelog for every commit, just what a fresh session would otherwise have to re-derive by reading everything.

## Styling: Tailwind CSS

Fully migrated from hand-rolled inline `style={{}}` objects to Tailwind (`tailwind.config.js`). Brand palette is defined as Tailwind theme tokens — primary green `#0D6B4D`, gold `#D4AF37` — under `colors.primary`/`colors.gold`/etc. Don't reintroduce inline style objects for anything Tailwind can express; the one legitimate exception is a handful of components with genuinely runtime-variable values Tailwind's JIT can't see (`Grid.jsx`'s `minWidth`/`gap`, `Spinner.jsx`'s `size`) — those stay inline on purpose, commented as such.

**Design language**: YouTube-style for browsing (Home, Search, ChannelPage's video tab — thumbnail grid, sticky top nav, collapsible sidebar). Medium-style for reading (Books, Articles, Biography — centered `max-w-reading` column, generous whitespace). Logo is a hand-authored SVG lighthouse mark (`منارة` = "lighthouse/beacon") at `src/assets/logo.svg`, also used as `public/favicon.svg`.

### Dark mode

`tailwind.config.js` sets `darkMode: 'class'`, and every brand color token (`primary`/`primary-dark`/`primary-light`, `gold`/`gold-light`, `surface`/`surface-hover`, `bg`, `border`/`border-light`, `text-primary`/`secondary`/`muted`) resolves through a CSS custom property (`rgb(var(--color-x) / <alpha-value>)`) instead of a literal hex, with light values on `:root` and dark values under `.dark` in `src/index.css`. That's what makes this a two-file change instead of a `dark:`-variant pass across every component: any existing `bg-surface`/`text-text-secondary`/etc. call site already repaints correctly the moment the `dark` class is toggled on `<html>` — nothing else needed changing. Dark-mode values are chosen independently per token, not a mechanical "invert" (e.g. `primary` is *brighter* in dark mode — emerald-500 — since it doubles as `text-primary` link/accent color against a near-black page, not just a button fill; `primary-light`/`gold-light` become dark tinted backgrounds rather than lightened primaries).

- `src/contexts/ThemeContext.jsx` (`ThemeProvider`/`useTheme()`, wraps the app in `App.jsx` outside `BrowserRouter`) owns the toggle: flips the `dark` class on `document.documentElement` and persists to `localStorage['theme']`. An inline script in `index.html`'s `<head>` applies the stored (or system-preference-derived) theme *before* React mounts, so there's no flash of the wrong theme on load — `ThemeProvider`'s initial state is read back from the DOM class that script already set, so the two can't disagree.
- Toggle lives in `Navbar.jsx` (sun/moon icon, same `iconButtonClass` as the other nav icons), visible whether or not the visitor is logged in.
- **What still needed a manual `dark:` variant**: only the handful of spots using a raw Tailwind stock color instead of a brand token — mainly the `bg-red-100 text-red-600` light-pink error-banner pattern (auth pages, `ChannelManage`'s delete buttons, `Badge`'s `success`/`danger` variants) and Input's required-field asterisk. Anything pairing `text-white`/`bg-black/NN` with an explicitly-colored surface (a primary/red button, a video-thumbnail hover overlay, `ChannelPage`'s banner using `channel.primaryColor`) was deliberately left alone — those aren't part of the light/dark surface hierarchy, they're colored regardless of theme.

## File structure

```
src/
  assets/       logo.svg
  components/
    ErrorBoundary.jsx — top-level class component, wraps <App/> in main.jsx (not in a barrel)
    ui/         Button, Card, Input, Modal, Badge, Grid, Spinner, EmptyState, QueryState, Avatar — barrel export via index.js
    layout/     Navbar, SideBar, PageShell, SearchBar — barrel export via index.js
    content/    VideoCard, BookCard, ArticleCard, PostCard, VideoPlayer, CommentsSection,
                BookmarkButton, ShareButton — barrel export via index.js (PdfReader is the
                deliberate exception, see its own barrel comment)
    auth/       EmailVerificationNotice — barrel export via index.js, see "Email verification" below
  pages/        route-level components, each lazy-loaded per route in App.jsx (see "Build / verify" below).
                Bookmarks.jsx (`/bookmarks`) and SeriesDetail.jsx (`/series/:id`) are the newest —
                see "Bookmarks" and "Series" below.
  hooks/        useVideos, useBooks, useArticles, useBiography, useChannels, useComments,
                useBookmarks, useSeries, useCommentModeration, useAdminData, useParallelUpload,
                useDebouncedValue, useOutsideClick, useFocusTrap, usePageMeta —
                see "Data fetching: React Query" below and "Search suggestions" below
  contexts/     AuthContext, ThemeContext (see "Dark mode"), ToastContext (see "Toast notifications")
  lib/
    api/        client.js (axios instance + interceptors), auth.js, contents.js (thin per-domain wrappers)
    env.js       API_BASE_URL / STREAM_BASE_URL, from VITE_API_BASE_URL env var (no more hardcoded localhost:8080)
    media.js     resolveMediaUrl(), safeExternalUrl(), extractYouTubeId(), youtubeThumbnail() — shared, don't reimplement per-component
    user.js      isPlatformAdmin(user), isChannelOwner(user, channel), canManageChannel(user, channel) —
                 the `user`/`channel` shape is still implicit (no TypeScript), but role/ownership checks go
                 through these instead of comparing `user.role === 'PLATFORM_ADMIN'` inline
```
Path alias `@/` → `src/` (configured in `vite.config.js`). Import from a component folder's `index.js` (e.g. `import { Button, Card } from '@/components/ui'`), not the individual file, unless there's a specific reason not to.

## `PageShell`

Shared app shell (`components/layout/PageShell.jsx`) wrapping `Navbar` + collapsible `SideBar` (mobile drawer) + a `<main>`. Every page renders `<PageShell contentClassName="...">{children}</PageShell>` rather than hand-rolling `<Navbar/><SideBar/><main>` — pages that don't want a sidebar pass `sidebar={false}` (used by the Medium-style reading pages, auth forms, and detail/manage pages that were never meant to show the browsing sidebar).

## `QueryState`

`components/ui/QueryState.jsx` collapses the loading/error/empty/success four-branch ternary that used to be hand-rolled per page around a `useQuery`/`useInfiniteQuery` result: `<QueryState isLoading isError isEmpty errorTitle emptyTitle emptyDescription emptyAction errorAction>{children}</QueryState>` renders a `Spinner`, an `EmptyState` (for either the error or empty case, swapping icon/copy), or `children` once data's ready. Reach for this instead of inventing another loading/error/empty variant per page.

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

- `hooks/useVideos.js` (was `useContents.js`, renamed alongside the backend's Content→Video rename — see backend `CLAUDE.md`'s "Video rename") — home feed, infinite video browsing, infinite search (`useInfiniteSearch`, mirrors `useInfiniteVideos`'s accumulating-pages shape for `SearchPage.jsx`'s "load more"), search-box typeahead (`useSearchSuggestions`, see "Search suggestions" below), single video (`useVideo`), related videos (`useRelatedVideo`), categories, watch/reading history.
- `hooks/useBooks.js` — public `useBooks`/`useBook`, plus `useBookReadProgress`/`useSaveReadProgress` (the latter updates its cache optimistically in `onMutate`, not `onSuccess`, matching the reader's original never-block-on-network behavior for a best-effort progress write).
- `hooks/useArticles.js`, `hooks/useBiography.js` — same shape, straightforward.
- `hooks/useBiography.js`'s query key (`['biography']`) is deliberately the same key `useUpdateBiography` (`hooks/useAdminData.js`) invalidates on save — an admin edit shows up on the public page with no extra wiring.
- `hooks/useMediaToken.js` — `useMediaToken(required)`, the credential for a gated media URL's
  `?token=` param. See "Media tokens" below.
- `hooks/useComments.js` — `useComments(type, id)` plus `useCreateComment`/`useReplyComment` mutations that invalidate that same key.
- `hooks/useChannels.js` — the big one: public channel page data (`useChannel`, `useChannelContents`/`Books`/`Articles`/`Posts`, `useSubscriptionStatus`, `useToggleSubscription`), sidebar/subscriptions data (`useAllChannels`, `useSubscriptions`, `useUnsubscribe`, `useMyChannels`), owner management (`useChannelContentList`, `useUpdateChannel`, `useCreateChannelContent`, `useToggleContentVisibility`, `useDeleteContent` — these last three share an `invalidateChannelContent` helper keyed off a `type → public query key` map, so a publish/toggle/delete on `ChannelManage.jsx` refreshes the same list `ChannelPage.jsx`'s visitors see), and admin channel moderation (`usePendingChannels`, `useAllAdminChannels`, `useApproveChannel`/`useRejectChannel`/`useSuspendChannel` — shared by both `Admin.jsx`'s dashboard and `AdminChannels.jsx`).
- Video visibility/delete toggled from `Home.jsx`'s feed (owner's own videos, mixed into the feed) can't use the fixed-`(slug, type)` hooks above since the slug varies per video — it stays a direct `api.patch`/`api.delete`, but its `refreshFeed(slug)` helper invalidates that specific channel's `channel-contents`/`channel-manage` cache keys too, not just `['feed']`/`['contents']`.
- `ChannelManage.jsx`'s two file-upload handlers (`handleVideoFileSelect`/`handleBookFileSelect`) stay plain `api.post` with `onUploadProgress` — they populate a form with a returned URL, not something cacheable, and `useMutation` doesn't have a clean spot for upload-progress callbacks.

## Search suggestions (`components/layout/SearchBar.jsx`)

Replaces `Navbar.jsx`'s old inline `<form>` — shows suggestions on focus (before typing, via a blank-`q` request), narrows them as the user types, backed by `GET /api/search/suggestions` (see backend `CLAUDE.md`'s own section on this endpoint, including its `pg_trgm` close-match fallback for typos).

- `hooks/useSearchSuggestions(rawQuery, limit, enabled)` (in `useVideos.js`) debounces `rawQuery` itself via `hooks/useDebouncedValue.js` (200ms) rather than debouncing the request — the debounced value becomes the `queryKey`, so React Query's own cache handles "retype something already seen" for free, no separate cache needed. The queryFn passes React Query's `signal` through to axios so a superseded in-flight request (a fast typist moving past `"qur"` before it resolves) gets cancelled instead of racing back and clobbering a newer result.
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

## Media tokens (`hooks/useMediaToken.js`)

A hidden (or suspended-channel) item's own file is gated by the backend's
`MediaAccessInterceptor`, but `<img>`/`<video>`/`<a>` tags can't send an `Authorization` header,
so the credential goes in the URL as `?token=`. That part is unchanged. What changed is **what**
goes there: this used to be the session token from `useAuth()` — the same JWT that authenticates
every API call, valid for a day — and a query param is not a private place, since it reaches the
API's own access logs, every proxy log in between, and the browser's history. `useMediaToken`
fetches a separate credential from `GET /api/user/media-token`: media-only (the backend rejects
it on every other route and from the `Authorization` header — see `MediaTokenIT` there) and
bounded to an hour.

Three things about using it, each of which is load-bearing:

- **Pass `required`.** Only a hidden item's file needs a token at all, so
  `useMediaToken(video.visible === false)` keeps the request from firing for the ordinary public
  case. `VideoPlayer` narrows it further (`visible === false` *and* a `LOCAL`/`STREAM` source) —
  a YouTube-hosted video never needs one whatever its visibility.
- **Don't render the media until it arrives.** The hook returns `isLoading` for exactly this:
  painting a tokenless `<img>`/`<video>` first fires a request that's certain to 404, and
  `VideoCard`'s `onError` handler latches that failure for the life of the page, so the
  thumbnail would stay blank even after the token showed up. `VideoCard`/`BookCard`/`BookDetail`
  hold their URLs back while it's loading; `VideoPlayer` renders a placeholder.
- **The token is deliberately not refreshed on a timer.** A new token means a new URL, and
  swapping a `<video>`'s `src` mid-playback restarts it from zero — so it's fetched once and
  held for as long as the component is mounted. That's why the backend's TTL is an hour rather
  than the few minutes a single request would need: it has to outlast playing a full-length
  lecture. Staleness is handled on the next mount instead (`staleTime` derived from the
  response's own `expiresInSeconds`, minus a minute of margin, with `refetchOnMount: true` to
  override the app-wide `refetchOnMount: false`).

Note the split inside `VideoPlayer`/`BookDetail`: they still take the session token from
`useAuth()`, because the watch/read-progress writes go through axios and want a real
`Authorization` header. The media token is only ever for a URL.

## Bookmarks (`hooks/useBookmarks.js`, `components/content/BookmarkButton.jsx`, `pages/Bookmarks.jsx`)

"Read/watch later", backed by the backend's `content/bookmark` package (see backend `CLAUDE.md`). `BookmarkButton` (barrel-exported from `components/content`) is a reusable toggle — `<BookmarkButton type="video"|"book"|"article" id={item.id} />` — dropped into `VideoDetail`/`BookDetail`/`ArticleDetail`'s header next to the title. Anonymous click routes to `/login` rather than silently no-op-ing (same as `ChannelPage`'s subscribe button already did) — bookmarking is exactly the kind of action worth prompting login for, and `useBookmarkStatus` stays `enabled: !!token` so a logged-out viewer never fires the per-item status request at all.

- `useBookmarkStatus(type, id, enabled)` / `useToggleBookmark(type, id)` — per-item toggle state; `useBookmarks(enabled)` — the full list for the `/bookmarks` page (`Bookmarks.jsx`, protected route, linked from `SideBar`'s "المحفوظات" entry next to "سجل المشاهدة"), same bounded/non-paginated shape as `History.jsx`'s watch/reading tabs, three tabs (`VIDEO`/`BOOK`/`ARTICLE`) instead of two. `useClearBookmarks()` backs its "مسح الكل" button.
- Each `BookmarkDTO` from the list endpoint carries exactly one of `content`/`book`/`article` populated (matching `itemType`) — `Bookmarks.jsx` filters the flat list per active tab and hands the right one straight to `VideoCard`/`BookCard`/`ArticleCard`, no reshaping needed.

## Series (`hooks/useSeries.js`, `pages/SeriesDetail.jsx`)

Backed by the backend's `content/series` package — see backend `CLAUDE.md` for the full model (a `Series` replaced `Video`'s (then `Content`'s) old free-text `series` field; `VideoDTO.series` is gone, replaced by `seriesId`/`orderInSeries`). `SeriesDetail.jsx` (`/series/:id`, public) is the series' own page: title/description plus its videos in a `VideoCard` grid, same layout conventions as `VideoDetail`'s related-videos row. `ChannelPage.jsx` gained a "سلاسل" tab (`useChannelSeries(slug)`) listing the channel's series as link cards to `/series/{id}`, same tab-bar pattern as its other four tabs.

- Owner management lives on `ChannelManage.jsx`'s new "السلاسل" tab (`useChannelSeriesManage`/`useCreateSeries`/`useDeleteSeries`): a create form (title/description) plus a list of the channel's series with a delete button — deleting only detaches its videos server-side (`ON DELETE SET NULL`), doesn't touch them, so no extra confirmation copy beyond the standard `window.confirm`.
- The video upload form's old free-text "السلسلة" `Input` is now a `<select>` populated from `useChannelSeriesManage(slug, ...)` (bound to `videoForm.seriesId`) plus a conditional "الترتيب داخل السلسلة" number input (`videoForm.orderInSeries`, only shown once a series is picked) — sent through the same `stripEmpty` helper as every other form field here, unconverted (a `type="number"` input's `e.target.value` is still a string; this already worked for `bookForm.pages` the same way before this change, so no new coercion concern).
- **`VideoDetail.jsx`'s series block** (only when `video.seriesId` is set, via the same `useSeriesDetail(video.seriesId, enabled)` call) now shows "الجزء X من Y" plus Previous/Next buttons, not just a "جزء من سلسلة" link — computed client-side from `seriesData.content` (the same ordered array `SeriesDetail.jsx` renders from) by `findIndex`ing the current video's id, no separate endpoint. Previous/Next are disabled (not hidden) at the series' boundaries, and — matching the RTL convention `PdfReader.jsx`'s pager already used — "التالي" (forward) points `ChevronLeft`, "السابق" (back) points `ChevronRight`.

## Comment moderation (`hooks/useCommentModeration.js`, `ChannelManage.jsx`'s "التعليقات" tab)

Channel-owner hide/pin (not approve — see backend `CLAUDE.md`'s "Comment moderation" section for why), surfaced as a dedicated moderation dashboard rather than inline controls on `CommentsSection.jsx` — `CommentsSection` only ever shows non-hidden comments (that's the backend contract), so there'd be nothing to un-hide from inside it anyway; the owner needs the separate `GET /channels/{slug}/content/comments` listing (`useChannelComments`), which returns every comment on the channel's content regardless of state. `useModerateComment(slug)` wraps `PATCH /comments/{id}/moderate`. Pinned comments sorting first on the actual public `CommentsSection` needed no frontend change at all — that ordering comes from the backend query, for free.

- Deliberately **not** wired into `CommentsSection.jsx` itself (no inline hide/pin icons next to a comment on `VideoDetail`/`BookDetail`/`ArticleDetail`) — would need each of those three pages to additionally fetch the content's owning channel just to compute `canManageChannel`, for a control that (for "hide") would immediately remove its own target from the list it's rendered in anyway. Revisit as a real feature (not a drive-by addition) if the dashboard-only flow turns out to be too indirect for actual channel owners.

## Watch/reading progress: reliability on refresh & tab-close (`lib/api/beacon.js`)

`VideoPlayer.jsx`'s watch-progress reporting and `PdfReader.jsx`/`BookDetail.jsx`'s reading-progress reporting each have three layers, not just a periodic timer:

1. A coarse periodic/per-event checkpoint (video: `onTimeUpdate` throttled to 60s — widened from 15s once the layers below covered the common exit paths, so this only bounds worst-case loss on an ungraceful crash; books: every page turn, debounced 1s just to coalesce rapid flipping).
2. A same-page flush on React unmount (`useEffect` cleanup) — covers in-app (SPA) navigation away.
3. A `pagehide` listener using `flushOnUnload()` (`lib/api/beacon.js`) — covers hard refresh/tab-close/hard navigation, where React never unmounts (the whole JS context is torn down first, so layer 2 never runs) and a normal axios/XHR call would get cancelled mid-flight by the browser anyway. `flushOnUnload` sidesteps both with a `fetch(..., { keepalive: true })`, reading the JWT straight from `localStorage` (same source `client.js`'s interceptor uses) since it deliberately bypasses axios.

None of this adds request volume — layer 1 actually got *less* frequent for video (60s vs. 15s); layer 3 is a reliability fix for a write that was already attempted via layer 2 but silently lost on refresh, not a new one.

- `VideoPlayer.jsx`'s `MIN_WATCH_SECONDS` (5s) gate: a play under 5 seconds never creates/bumps a watch-history row — otherwise an accidental click-and-immediately-back-out would count as "watched" and could push a genuinely-watched video out of the backend's per-user 200-row cap (see backend `CLAUDE.md`'s watch-history section).
- `PdfReader.jsx` exposes a second callback, `onPageChangeImmediate(page, total)`, fired synchronously on every page turn (unlike the debounced `onPageChange`) at zero network cost — `BookDetail.jsx` uses it to keep a ref of the *true* latest page for its own `pagehide` flush, since the debounced network write (1s) might not have fired yet.

## Reader improvements (`components/content/PdfReader.jsx`)

Table of contents, in-document search, and direct page-jump, all client-side against the already-loaded PDF — none of this touches the reading-progress plumbing above (`onPageChange`/`onPageChangeImmediate`/the beacon flush); every new entry point (TOC row, search result, typed page number) just calls the existing `goToPage()`, so a jump from any of them reports progress exactly like a Prev/Next click always has. Deliberately no notes/highlights — that's still open, see "Feature ideas" below.

- **Table of contents**: `Document`'s `onLoadSuccess` now keeps the whole `PDFDocumentProxy` (not just `numPages`) in `pdfRef`, so opening the "المحتويات" panel can lazily call `pdf.getOutline()`. A `dest` entry is either a named destination (string — needs an extra `pdf.getDestination()` round trip) or an explicit destination array either way; `resolveOutline()` recursively resolves each to a 1-based page number via `pdf.getPageIndex()`, so nested outlines render nested (`OutlineList`, indented per depth). A PDF with no outline just shows "لا توجد قائمة محتويات" rather than hiding the button — the button itself is always there once the document has a known page count.
- **Search**: no `FindController` is available outside pdf.js's full viewer widget (which `react-pdf` doesn't ship), so this isn't highlight-in-place — it extracts every page's text via `page.getTextContent()` on first search (cached per-document in `pageTextCacheRef`, so a second search against the same file is instant) and returns a clickable list of matching page numbers. Explicit submit (button/Enter), not per-keystroke — the first search is an O(pages) walk and isn't worth re-running on every character typed.
- **Page jump**: the old static "صفحة X من Y" label is now a small `<input>` (submit-on-Enter) alongside the existing Prev/Next buttons — typing an out-of-range number gets clamped the same way `goToPage()` already clamped Prev/Next.

## Share sheet (`components/content/ShareButton.jsx`)

Dropped into `VideoDetail`/`BookDetail`/`ArticleDetail`'s header next to `BookmarkButton` (`<ShareButton title={...} path={...} />`). Link previews need no work here — `usePageMeta` (see below) already sets per-page OG/Twitter tags before this ever ships a link out; this component is only the "get the link out" UI: a copy-link input, the native share sheet (`navigator.share`, feature-detected — not every browser has it) and three plain-text quick-share links (WhatsApp/Telegram/X share-intent URLs). Text-only, no brand icons — `lucide-react` ships no brand marks, and this matches `SearchBar`'s existing "no logos" call for the same reason.

- **Copy-link-at-timestamp (video only)**: `ShareButton` takes an optional `getCurrentTime` prop — `VideoDetail.jsx` passes `() => playerRef.current?.getCurrentTime()`. `VideoPlayer.jsx` is now `forwardRef` and exposes `getCurrentTime()` via `useImperativeHandle` (native `<video>`'s `currentTime`, or the YouTube IFrame API player's `getCurrentTime()`) — read once, on share-sheet open, not tracked as React state, so it costs nothing on every playback tick the way lifting it into state would. Checking "مشاركة من الدقيقة" appends `?t={seconds}` to the copied/shared URL.
- **`?t=` on load**: `VideoDetail.jsx` reads the `t` search param and passes it to `VideoPlayer` as `startTime`. Native/Telegram `<video>` seeks via `onLoadedMetadata` (setting `currentTime` before metadata loads is silently ignored by the browser); YouTube uses the IFrame API's `playerVars.start` instead, since seeking only takes effect at initial load either way.

## Toast notifications (`contexts/ToastContext.jsx`)

`ToastProvider`/`useToast()`, mounted at the app root in `App.jsx` (alongside `AuthProvider`). Renders bottom-center, auto-dismissing (3s) toasts with enter/exit animation (`animate-toast-in` keyframe in `tailwind.config.js`). Added to replace the static, in-page success/error banner pattern in `UserProfile.jsx` (profile form + `ChangePasswordCard`) and `ChannelManage.jsx` (its `showMessage(...)` helper, used by every video/book/article/post upload/publish/delete/visibility-toggle/channel-save action) — reach for `useToast()` for any new success/error feedback rather than another local banner.

## Home feed & related videos (deliberately non-addictive)

`Home.jsx`'s default view ("الكل" / no category selected) is a **bounded, non-paginated** three-section feed via `useFeed()` (`hooks/useVideos.js` → `GET /api/feed`): "من القنوات التي تتابعها" (subscribed channels), "اقتراحات لك" (discover — same categories as your subscriptions, other channels), "استكشف" (featured picks). This is a fixed snapshot, not an infinite scroll — no "load more" on any of the three sections, no autoplay, no watch-history-driven ranking. That's intentional, not a missing feature: the explicit design goal (see backend `CLAUDE.md`'s `feed` package notes) is a platform that suggests useful related content without becoming an engagement-optimized, hard-to-put-down feed. Selecting a category chip switches to the old plain paginated `useInfiniteVideos(...)` browsing (unchanged) — that's the user deliberately choosing to keep looking, so pagination there is fine.

`VideoDetail.jsx` shows a bounded "قد يعجبك أيضاً" related-videos row via `useRelatedVideo(id)` (`GET /api/videos/{id}/related`) — same category, capped, no autoplay/next-video chaining. Same reasoning: recommend, don't hook.

## Known gaps

- The Navbar's "رفع" (Upload) link points to `/upload`, which isn't a registered route — the `*` fallback (`NotFound`) catches it. There used to be 5 unrouted admin CMS tab components under `components/admin/` meant to eventually back this; they were deleted 2026-09-01 (dead code, fully duplicated by `ChannelManage.jsx`) rather than wired up. If per-type CMS tabs come back, build them as part of the `ChannelManage` rewrite mentioned under "Bugs" below, not as a second implementation.

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

Fixed 2026-09-02: `ChannelManage.jsx`'s video/book/article/post submit handlers now run the
form object through a `stripEmpty` helper before sending, so an untouched `publishDate`/`pages`
is omitted from the payload instead of going over the wire as `""`; the video form gained a
`publishDate` input (previously only books/articles had one, so every video was created with
`publishDate = null` — the backend already defaults it to `LocalDate.now()` on create, matching
books/articles, so leaving the new field blank behaves the same as before); the still-missing
`NULLS LAST` on `ContentRepository.findDiscoverByCategoriesExcludingChannels` (the feed's
"اقتراحات لك" discover query — every other `publishDate DESC` query already had it) was fixed on
the backend, which would otherwise have kept pinning NULL-date videos to the top of that section
even after the form fix; and `videoForm`'s dead `speaker`/`isFeatured` state (neither had an
input, and `handleVideoSubmit` overrode `speaker` with `channel.name` anyway) was dropped, along
with the same dead `isFeatured` on `bookForm`/`articleForm` — the backend's create DTOs already
exclude `isFeatured` entirely by design (see `ContentCreateRequest`'s comment), so sending it was
always a no-op.

Turned out to already be fixed, this list just hadn't been updated: platform admins getting
403'd on channel-management actions. `ChannelContentController`'s `requireManageableChannel`/
`verifyOwnership` helpers — used by every video/book/article/post list/create/visibility-toggle/
delete/upload endpoint — already call `ChannelService.canManageChannel(userId, channelId,
isAdmin)`, the 3-arg admin-bypass overload; the frontend's `canManageChannel` (`lib/user.js`)
already matches. Only the four controllers' unrelated `isVisibleToCaller` helpers (gating whether
a hidden item is visible to *this* caller, not manage actions) still call the 2-arg owner-only
overload, but each already has its own explicit `isAdmin` early-return before that call, so
there's no gap there either.

**Still postponed**: the Navbar's "رفع" link points at `/upload`, which is not a route — the `*`
fallback silently redirects to Home. Already listed under "Known gaps"; leave as-is until the new
upload service defines where this should point.

## UX / UI

Fixed 2026-09-01: `<html lang="ar" dir="rtl">` set on the root element (per-page `dir="rtl"`
wrappers deleted — `Input.jsx`'s label `dir="rtl"` is unrelated and stays); per-page `<title>` +
OG/Twitter meta via the new `hooks/usePageMeta.js`, wired into every page; `VideoCard`/
`VideoDetail` now show the owning channel's name + avatar, linked to the channel page (via
`useChannel(video.channelId)` — `GET /channels/{identifier}` already accepted a numeric id as a
slug fallback, so no backend change was needed); `ChannelPage` renders `bannerUrl` and
`description`; the subscriber count is hidden (not shown as `0`) for logged-out visitors;
`alert()`/`window.confirm()` replaced with `useToast()`/`Modal` in `Home`, `CommentsSection`,
`Admin`, `Register`, and (bonus, same bug) `Subscriptions`, `History`, `AdminChannels`,
`CreateChannel`; a channel's video tab now paginates via `useChannelContents` as an
`useInfiniteQuery` with a "load more" button, and its tab badge shows the real total — this
needed a small backend change too, since `GET /channels/{slug}/contents` was returning a raw
`Page<Content>` with no `hasNext`/`currentPage` fields (see manara-platform's `ChannelController`,
now mirroring `GET /api/contents`'s `{content, currentPage, hasNext, totalItems}` shape); `/books`
and `/articles` got client-side search/category-filter/sort/"load more" (both endpoints already
return the full unfiltered list, so nothing server-side was needed); `VideoCard` thumbnails are
`aspect-video`/`object-cover` instead of a fixed-height `object-contain` box; comment counts
include replies; comment dates use `dayjs` (`lib/dayjsAr.js`, a custom locale that keeps Latin
digits — dayjs's bundled `ar` locale swaps to Arabic-Indic same as `ar-EG` did) with relative
formatting under a week old and an absolute date+time past that; comments gained a character
counter/limit and author-only edit/delete (the backend already had `PATCH`/`DELETE
/comments/{id}` gated on `Comment.userId` — `CommentDTO.userId` was already exposed specifically
for this, per its own code comment — the frontend just hadn't wired it up); a real `NotFound`
page now renders on the `*` route instead of silently redirecting to Home; YouTube videos are
now played through the IFrame Player API (`youtube-nocookie.com`, `rel=0`) instead of a bare
`<iframe src>`, which both drops the deprecated `frameBorder` prop and — as a side effect of
needing `onStateChange`/`getCurrentTime` for the embed anyway — closes the "watch history never
records for YouTube videos" gap from the same list.

Turned out to already be fixed, this list just hadn't been updated: **category chips leading to
empty result grids** — `ContentRepository.findAllCategories` (backing `GET /api/categories`,
the only categories endpoint) already filters to `visible = true` and active-channel content
only; `/books`/`/articles` derive their chips client-side from the already-fetched, already-
filtered list, so there was never a separate risk there either.

Still open:

- **Comment reporting.** Author-only edit/delete now exist (see above), but there's still no way
  for a reader to report someone else's comment — no backend endpoint for it yet.

## Accessibility

Fixed 2026-09-02: `VideoCard`'s outer clickable `<div>` now has `role="button"`/`tabIndex={0}`/
an Enter-Space `onKeyDown` handler/a focus ring, and `BookCard`'s clickable cover/title `<div>`/
`<h3>` became a real `<Link>` — both card grids are keyboard-operable now; route changes move
focus to a new `#main-content` landmark (`App.jsx`'s `AppRoutes`, skipped on first render) and
`PageShell` gained a skip-to-content link as the first focusable element on every page; `Modal`
and the mobile sidebar drawer (`SideBar.jsx`, only when its `open` prop is true — the same
`<aside>` is a persistent, non-modal nav rail on desktop) now use a shared `useFocusTrap` hook
(`hooks/useFocusTrap.js`): focus moves into the panel on open, Tab/Shift+Tab cycles within it,
Escape closes it, and focus is restored to whatever opened it on close; both also gained
`role="dialog"`/`aria-modal`, and `Modal`'s title is wired to the dialog via `aria-labelledby`;
icon-only buttons that relied on `title` alone now also have a matching `aria-label` (`Navbar`'s
upload/profile/admin/logout, `SideBar`'s manage-channel link, `VideoCard`'s visibility-toggle/
delete/channel-link, `ChannelManage`'s `ContentManageList` visibility-toggle/delete,
`CommentsSection`'s edit/delete, `Modal`'s close button, which previously had neither).

Checked and turned out not to be an issue: colour-only state signalling on the visible/hidden
toggle and the subscribe button — both already pair an icon change (`Eye`/`EyeOff`, `Bell`/
`Check`) with a text label (`مخفي عن الزوار`, `اشترك`/`مشترك`), not colour alone.

## Refactoring / structure

Resolved 2026-09-01: `PageShell` is now used by every page, including the ones that used to
hand-roll `<div className="min-h-screen bg-bg"><Navbar/>…` (`ChannelPage`, `VideoDetail`,
`BookDetail`, `ArticleDetail`, `ChannelManage`, `Admin`, `AdminChannels`, `Register`, `Login`,
`ForgotPassword`, `ResetPassword`, `VerifyEmail`, `NotFound`, `UserProfile`, `CreateChannel`,
`Biography`) — pages with no browsing sidebar pass `sidebar={false}`, see "`PageShell`" above;
loading/error/empty ternaries were collapsed into the new `QueryState` (see "`QueryState`"
above) across all of the pages listed there plus `Home`, `SearchPage`, `Books`, `Articles`,
`Subscriptions`, `History`; `ProtectedRoute` (`App.jsx`) now renders `<Spinner/>` inside a
Tailwind-classed wrapper instead of the old CSS-variable inline-styled spinner; `lib/user.js`
now exports `isPlatformAdmin`/`isChannelOwner`/`canManageChannel`, wired into `App.jsx`,
`Navbar.jsx`, `ChannelPage.jsx`, `ChannelManage.jsx` in place of inline `user?.role === …` /
`channel.ownerUserId === user.id` checks; `Home`'s visibility-toggle/delete direct `api.patch`/
`api.delete` calls became `useToggleVideoVisibilityByChannelId`/`useDeleteVideoByChannelId`
(`hooks/useChannels.js`, reusing the existing `invalidateChannelContent` helper) — `ChannelManage`'s
two file-upload handlers are unchanged, per their own documented reason (upload-progress
callbacks don't fit `useMutation` cleanly); every page in `App.jsx` is now `React.lazy`-loaded
per route behind one `<Suspense>` (mirroring the existing `PdfReader` pattern), and `framer-motion`/
`react-hook-form` — confirmed genuinely unreferenced anywhere in `src/` — were removed from
`package.json`; the five admin CMS tab components were deleted rather than wired up (see "Known
gaps"). Checked and turned out not to be an issue: `.DS_Store` was never actually git-tracked
(already covered by `.gitignore`), and the repo does have a git history now.

**Still open, deliberately not touched in the same pass**: `ChannelManage.jsx` is still ~500
lines holding five tabs, four content forms, and per-type logic copy-pasted four times — the
`<ContentPublishForm type=… fields=… />` + `useChannelContentTab(slug, type)` extraction
described in earlier notes here is real, but this file (along with `Navbar.jsx`'s upload link)
is the one getting a rewrite alongside a dedicated upload backend service per the "Bugs"
section below — restructuring its internals now would be thrown away. Revisit this extraction
once that rewrite lands, and pair it with the identical duplication on the backend's
`ChannelContentController`.

## Feature ideas that fit the platform's values

Matching the backend's list; these follow the "surface useful content, don't optimise for
time-on-site" principle rather than fighting it.

- **Offline/PWA for downloaded books and articles** — genuinely useful for an audience with
  intermittent connectivity, and it doesn't require any engagement machinery.
- **Transcript view alongside the video player** (needs the backend transcript work), with
  click-to-seek. Biggest accessibility and skimmability win available.
- **A "من القنوات التي تتابعها" digest/inbox page** — an explicit list of what's new since your
  last visit, which you can clear, instead of an implicit ranked feed.
- **Per-page notes/highlights on `PdfReader`**, keyed to the existing reading history — the rest
  of that idea (search, TOC, page-jump) shipped, see "Reader improvements" above; this piece was
  deliberately left out of that pass and is still open.

Shipped since this list was written (2026-09-02): series previous/next + "part X of Y" on
`VideoDetail` (see "Series" above), the share sheet + copy-link-at-timestamp (see "Share sheet"
above), PdfReader's search/TOC/page-jump (see "Reader improvements" above), and dark mode (see
"Dark mode" under "Styling: Tailwind CSS" above).

---

# Review findings — 2026-09-02

Second full read-through (frontend + backend), no code changed. Everything below is **open**;
delete an entry when it's actually fixed. The backend's `CLAUDE.md` has a matching section under
the same heading — the first two items here are two halves of one fix and should be done together.

## Bugs / security

Fixed 2026-09-02: **stored XSS via a video's `sourceUrl`**, on both sides as the finding
required. Here: `lib/media.js`'s new `safeExternalUrl(url)` returns `null` for anything that
isn't an absolute `http(s)` URL, and every place that renders a stored URL as-is now goes
through it — `VideoPlayer.jsx`'s two `<a href>` fallbacks and its `TELEGRAM` `<source src>`
(which render "رابط الفيديو غير صالح" instead of a live link when it returns null), plus
`Biography.jsx`'s three social links, which had exactly the same exposure. There: a `@Pattern`
allowlist on every user-supplied URL field (backend `core/validation/SafeUrl`).
`safeExternalUrl` parses with **no base URL**, so a scheme-less `www.example.com` is rejected
rather than silently resolved against our own origin, and it returns `parsed.href` rather than
the input, since the URL parser strips embedded tabs/newlines that would otherwise go straight
back into the href.
Fixed 2026-09-02 (session after the review that logged this list): **`client.js`'s 401-with-no-
refresh-token gap** — a 401 with an access token present but no refresh token to try (cleared,
another tab logged out, first-party storage eviction) now dispatches `auth:session-expired` on
that path too, not just inside the refresh-attempt branch (see `e3f13c3`).

Fixed 2026-09-02: **`validation.js` was missing the backend's 72-byte password cap.**
`PasswordValidator` rejects any password over 72 **UTF-8 bytes** (BCrypt truncates past that),
which a mixed-script password hits well under 72 characters. `getPasswordRules` now has a
`maxBytes` rule measured via `TextEncoder`, not `password.length` — rendered automatically by
`Register.jsx`/`ResetPassword.jsx`/`UserProfile.jsx`'s `ChangePasswordCard`, which already `.map()`
over the rules array generically.

Fixed 2026-09-02 (backend side): hidden content no longer shows up in `/history` or
`/bookmarks` — those endpoints gate on visibility now, both when recording and when listing, so
a card in either list can no longer be for an item whose own detail page 404s.

Turned out to already be fixed, this list just hadn't been updated: **`durationToSeconds`
returning `0` instead of `null` for an empty string** — it already guards `if (!duration ...)
return null` before ever reaching `.split(':')`, and an empty string is falsy, so this path was
never actually reachable.

## Notes

- `resolveMediaUrl(url, token)` appends `?token=` to **any** URL on the API host, not only
  `/uploads`/`/stream` ones — harmless today (only media URLs are passed to it) but it makes the
  function's contract wider than its comment claims.
- The `token` it takes is now the **media token** (`hooks/useMediaToken`), never the session
  token — see "Media tokens" below.
- `<html lang="ar" dir="rtl">`, per-page `usePageMeta`, `ErrorBoundary`, focus trapping and the
  skip link are all in place; no `dangerouslySetInnerHTML` anywhere in `src/` — the XSS item above
  is the only injection path found.

## Feature ideas beyond the existing list

The existing list (offline/PWA, transcript view, digest/inbox page, PdfReader notes/highlights)
still stands. Additional ones that fit the same values:

- **A per-channel "takeout"/export view** for the backend export idea — a channel owner can
  download everything they've published. Reinforces the not-locked-in stance the platform's
  design already implies.
- **Series completion state on `ChannelPage`'s "سلاسل" tab** — "4 of 11" per series card, from the
  same data `VideoDetail`'s Previous/Next block already computes client-side.

Shipped since this list was written (2026-09-02): **progress bars on cards beyond the history
page** — `VideoCard`/`BookCard` already accepted `watchedSeconds`/`currentPage` props (wired into
`Home`, `SearchPage`, `ChannelPage`'s videos tab, `VideoDetail`'s related row, `SeriesDetail`,
`Books`), but `ChannelPage`'s books tab and `Bookmarks.jsx` (both video and book tabs) weren't
passing them — now wired via the existing `useWatchProgressMap`/`useReadingProgressMap` hooks,
same pattern as everywhere else. **Print/clean-reading stylesheet for articles and biography** —
`index.css` gained a hand-written `@media print` block (not per-page `print:` utilities alone,
since forcing real black-on-white over the dark-mode CSS-variable tokens needs `!important` to
reliably win — see the block's own comment) hiding `nav`/`aside` globally and resetting
`.max-w-reading` content to black-on-white/no-shadow; `ArticleDetail.jsx` and `Biography.jsx` use
`print:hidden`/`print:p-0`/`print:shadow-none`/`print:border-0` on their own share/bookmark
buttons, metadata bar, comments section, and card chrome. Verified via `npm run build`'s compiled
CSS (both the hand-written block and the `print:` utilities are present); not verified against a
real printed article, since no article content is seeded in the local backend to load
`ArticleDetail` with.
