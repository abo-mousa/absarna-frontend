# أَبْصَرْنا (Absarna) Platform — Frontend

React 18 + Vite frontend for the أَبْصَرْنا (Absarna) media platform (videos/books/articles) — renamed 2026-09-03 from its original "منارة" (Manara, "lighthouse/beacon") branding; see "Rebrand: منارة → أَبْصَرْنا" under History for the full rationale and what changed. Plain JavaScript (`.jsx`, not TypeScript). RTL (Arabic) throughout. Backend lives at `/Users/kareemismail/IdeaProjects/absarna-backend` (separate repo, has its own `CLAUDE.md`; renamed from `manara-platform`/`com.manara.*` on 2026-09-03 — see "Rename: Manara → Absarna" under History).

The repo directory is `/Users/kareemismail/IdeaProjects/absarna-frontend` (renamed 2026-09-03 from `elhamy-frontend-enhanced` and moved out of `~/Desktop` to sit alongside the backend under `~/IdeaProjects` — see "Rename: Manara → Absarna" under History; `.idea/` project files need reopening from the new path). `package.json`'s `name` field is `absarna-frontend` (updated as part of the rebrand; `package-lock.json` resynced via `npm install --package-lock-only`).

Keep this file updated when architecture/conventions change — not a changelog for every commit, just what a fresh session would otherwise have to re-derive by reading everything.

## Styling: Tailwind CSS

Fully migrated from hand-rolled inline `style={{}}` objects to Tailwind (`tailwind.config.js`). Brand palette is defined as Tailwind theme tokens under `colors.primary`/`colors.gold`/etc — primary turquoise `#17A398`, gold `#F2AE30`, both resolved through the CSS-variable indirection described under "Dark mode" below (see that section, and the rebrand History entry, for the light/dark values and why they changed from the original green/brass palette). Don't reintroduce inline style objects for anything Tailwind can express; the one legitimate exception is a handful of components with genuinely runtime-variable values Tailwind's JIT can't see (`Grid.jsx`'s `minWidth`/`gap`, `Spinner.jsx`'s `size`) — those stay inline on purpose, commented as such.

**Wordmark font**: `fontFamily.serif` (`Markazi Text`, an Arabic-and-Latin serif from Google Fonts, loaded in `index.html`) is used only for the "أَبْصَرْنا" wordmark in `Navbar.jsx` (`font-serif` class) — not a general body/heading font swap. `fontFamily.sans` (IBM Plex Sans Arabic) stays the UI-wide default everywhere else.

**Design language**: YouTube-style for browsing (Home, Search, ChannelPage's video tab — thumbnail grid, sticky top nav, collapsible sidebar). Medium-style for reading (Books, Articles, Biography — centered `max-w-reading` column, generous whitespace). Logo is a hand-authored SVG lighthouse mark (`منارة` = "lighthouse/beacon") at `src/assets/logo.svg`, also used as `public/favicon.svg`.

### Dark mode

`tailwind.config.js` sets `darkMode: 'class'`, and every brand color token (`primary`/`primary-dark`/`primary-light`, `gold`/`gold-light`, `surface`/`surface-hover`, `bg`, `border`/`border-light`, `text-primary`/`secondary`/`muted`) resolves through a CSS custom property (`rgb(var(--color-x) / <alpha-value>)`) instead of a literal hex, with light values on `:root` and dark values under `.dark` in `src/index.css`. That's what makes this a two-file change instead of a `dark:`-variant pass across every component: any existing `bg-surface`/`text-text-secondary`/etc. call site already repaints correctly the moment the `dark` class is toggled on `<html>` — nothing else needed changing. Dark-mode values are chosen independently per token, not a mechanical "invert" (e.g. `primary` is *brighter* in dark mode — `#22C4BC` vs. light mode's `#17A398` — since it doubles as `text-primary` link/accent color against a near-black page, not just a button fill; `primary-light`/`gold-light` become dark tinted backgrounds rather than lightened primaries). Background/surface/border/text neutrals also shifted with the rebrand — light mode is a warm parchment (`#FBF7EE` page, `#FEFDF9` surface) rather than a neutral off-white, and dark mode is an indigo-tinted near-black (`#10141C`) rather than a neutral charcoal — see the rebrand History entry for the reasoning.

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
                useBookmarks, useSeries, useCommentModeration, useAdminData, useMediaUrl,
                usePresignedUpload, useDebouncedValue, useOutsideClick, useFocusTrap,
                usePageMeta — see "Data fetching: React Query" and "Media URLs" below
  contexts/     AuthContext, ThemeContext (see "Dark mode"), ToastContext (see "Toast notifications")
  lib/
    api/        client.js (axios instance + interceptors), auth.js, contents.js (thin per-domain wrappers)
    env.js       API_BASE_URL, from VITE_API_BASE_URL env var (no more hardcoded localhost:8080)
    uploadResume.js  which upload session a channel has in flight, per (slug, kind), in localStorage —
                 only the id, never progress; see "Presigned uploads" below
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
- `hooks/useMediaUrl.js` — `useVideoPlaybackUrl`/`useBookReadUrl`, presigned URLs for media in
  object storage. `hooks/usePresignedUpload.js` — direct-to-storage multipart upload. See
  "Media URLs" below. (Replaced `useMediaToken`/`useParallelUpload`, both deleted.)
- `hooks/useComments.js` — `useComments(type, id)` plus `useCreateComment`/`useReplyComment` mutations that invalidate that same key.
- `hooks/useChannels.js` — the big one: public channel page data (`useChannel`, `useChannelContents`/`Books`/`Articles`/`Posts`, `useSubscriptionStatus`, `useToggleSubscription`), sidebar/subscriptions data (`useAllChannels`, `useSubscriptions`, `useUnsubscribe`, `useMyChannels`), owner management (`useChannelContentList`, `useUpdateChannel`, `useCreateChannelContent`, `useToggleContentVisibility`, `useDeleteContent` — these last three share an `invalidateChannelContent` helper keyed off a `type → public query key` map, so a publish/toggle/delete on `ChannelManage.jsx` refreshes the same list `ChannelPage.jsx`'s visitors see), and admin channel moderation (`usePendingChannels`, `useAllAdminChannels`, `useApproveChannel`/`useRejectChannel`/`useSuspendChannel` — shared by both `Admin.jsx`'s dashboard and `AdminChannels.jsx`).
- Video visibility/delete toggled from `Home.jsx`'s feed (owner's own videos, mixed into the feed) can't use the fixed-`(slug, type)` hooks above since the slug varies per video — it stays a direct `api.patch`/`api.delete`, but its `refreshFeed(slug)` helper invalidates that specific channel's `channel-contents`/`channel-manage` cache keys too, not just `['feed']`/`['contents']`.
- `ChannelManage.jsx`'s two file-upload handlers (`handleVideoFileSelect`/`handleBookFileSelect`) call `usePresignedUpload` rather than a mutation: the file goes straight to object storage, and what lands in the form is an `uploadSessionId`, not a cacheable resource. Progress comes from the hook, which counts bytes object storage actually accepted rather than bytes handed to axios.

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
- `lib/api/auth.js` exports `forgotPassword(email)`, `resetPassword(token, newPassword)`, `changePassword(currentPassword, newPassword)`. All three are called directly, the same way `VerifyEmail.jsx` calls `verifyEmail`, rather than being wrapped by `AuthContext` — but `changePassword` is **not** token-neutral the way the other two are: its response carries a replacement `{token, refreshToken}` pair (the backend's `tokenVersion` bump invalidates the one this session is holding), and its caller has to hand that to `AuthContext`'s `applySession` or it logs itself out. See the change-password entry under History.
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

## Media URLs (`hooks/useMediaUrl.js`, `hooks/usePresignedUpload.js`)

**The media token is gone** (2026-09-04), along with `useMediaToken`, `useParallelUpload`, and
`resolveMediaUrl`'s `token` parameter. The backend no longer serves media bytes at all — no
`/uploads`, no `/stream`, no `MediaAccessInterceptor`. Media lives in object storage.

### Reading media

`useVideoPlaybackUrl(videoId, enabled)` / `useBookReadUrl(bookId, enabled)` fetch a short-lived
**presigned URL** from `GET /api/videos/{id}/playback-url` / `GET /api/books/{id}/read-url`. The
backend runs its visibility check and, if it passes, signs a URL. **The URL is the access grant** —
a caller who may not see the item simply never receives one (404, matching the detail endpoint so
a gated item is indistinguishable from a missing one).

- **Don't render the media until it arrives.** Same reasoning as the old token: painting an
  unsigned `<video>` first fires a request certain to 403, and `VideoCard`'s `onError` latches
  that failure for the life of the page. `VideoPlayer` renders a placeholder while loading.
- **Not refetched on a timer.** A new signature means a new URL, and swapping a `<video>`'s `src`
  mid-playback restarts it from zero. The backend's TTL (12h by default) is set to outlast a full
  lecture *including seeks* — a player re-requests on every scrub, so an expired URL mid-playback
  is an opaque 403.
- **`retry: false`.** A 404 here means "not visible to you", which retrying cannot change.
- **Mint on intent, never once per rendered card.** A presigned URL is a bearer credential for
  its whole TTL, which is what the `enabled` flag is for: don't create one for media nobody has
  asked for. `BookCard` used to call `useBookReadUrl` unconditionally, so a listing minted — and
  held in the query cache — a live download credential for every book on screen, again per
  infinite-scroll page, on `/books`, `History`, `Bookmarks` and `ChannelPage` alike. It now
  enables the query on pointer-enter/focus/pointer-down (all of which precede a click), and the
  rare click that lands first opens a blank tab inside the gesture and points it at the URL once
  it arrives — a popup opened outside the gesture is blocked. Detail pages are the exception and
  still fetch on mount: opening one *is* the intent. Fixed 2026-09-05, see History.
- The session token from `useAuth()` is still right for watch/read-progress writes — those go
  through axios with a real `Authorization` header. Nothing goes into a media URL any more.

`resolveMediaUrl(url)` now only resolves things that are *already* URLs (an external channel logo,
a YouTube thumbnail). It **returns null for an object key**, and callers fall back to their
placeholder. That is correct rather than degraded: an uploaded video has no thumbnail until a
worker produces one, and no worker exists yet.

### Uploading media

`usePresignedUpload()` uploads a file **straight to object storage** — bytes never transit the
backend, which only mints presigned part URLs. Four backend endpoints (shared by videos and
books), then the returned `sessionId` goes to the create endpoint as `uploadSessionId`, which is
what actually finalises the upload. Nothing exists as content until then, so an abandoned upload
leaves no row behind.

Three things that are load-bearing:

- **The presigned `PUT` uses raw `fetch`, never the shared axios client.** That client's
  interceptor attaches the user's JWT to every call; sending it to object storage would leak a
  session token to a third-party host, and the presigned signature covers the URL and host only —
  extra headers can invalidate it outright. The signature is the entire credential.
- **Resume is server-driven, and wired up as of 2026-09-05** (backend finding R1). Progress comes
  from `GET .../upload-url/{sessionId}/parts`, which returns `partSizeBytes`/`totalParts`
  alongside what already landed — deliberately, so a resume works from another tab or after a
  cleared cache without any local state to consult. `lib/uploadResume.js` stores **only the
  session id**, per `(slug, kind)`; losing it costs a resume offer, not correctness, and it is
  what bounds the honest claim (across tabs on one machine, not across devices).
  - The id is persisted through `upload`'s new `onSessionStart` callback, **before a single byte
    goes out** — the hook used to expose `sessionId` only after the first window finished, so an
    upload interrupted at 3% was precisely the case a resume could not serve.
  - A resume requires the same **name and size**, and `requireSessionFits` re-derives the part
    count from the picked file. Missing byte ranges are computed from the file's own size, so
    filling one upload's gaps from a different file of equal length would assemble a corrupt
    object with nothing downstream to notice.
  - Declining the offer — or picking a different file — **cancels the stale session** through the
    backend's `DELETE .../upload-url/{sessionId}`, which had no caller until now. The per-channel
    quota counts open sessions, so silently abandoning them is how a user ends up locked out
    behind "finish or cancel one".
  - A session that was swept, cancelled, published, or no longer matches raises
    `ResumeUnavailableError` and falls through to an ordinary upload. "The resume did not apply"
    is not a failure worth reporting to the user.
- **URLs arrive in bounded windows.** A 10 GB file is ~1,280 parts and the server caps how many
  it signs at once; later windows come through the same reissue endpoint resume uses. Parts
  upload with a concurrency limit of 3.

Book uploads use the same hook (`kind: 'books'`). Note the old server-side PDF preview image and
page count are gone with the upload module — a book reads fine without either.

## Testing (`vitest`)

Added 2026-09-04; broadened 2026-09-05. `npm test` (`vitest run`) / `npm run test:watch`.
**95 tests across 8 files**, all in the node environment — there is still no jsdom, on purpose.
`uploadResume` supplies its own `globalThis.localStorage` for the same reason, which is also why
the module reads storage through `globalThis.localStorage?.` inside a `try` rather than assuming
a DOM: privacy modes throw outright, and "no resume offered" is the correct answer there.

| File | Covers |
|---|---|
| `hooks/__tests__/usePresignedUpload.test.js` | byte-range arithmetic incl. the short final part, resume diffing with out-of-order gaps, batching, the concurrency cap, error propagation |
| `lib/__tests__/validation.test.js` | username/password rules **as mirrors of the backend's** — most importantly the 72-**byte** BCrypt ceiling measured with `TextEncoder`, which no character-count check can express |
| `lib/__tests__/media.test.js` | `safeExternalUrl` as a scheme *allowlist* (`javascript:` in every spelling, scheme-less values, tab/newline smuggling), `resolveMediaUrl` returning null for a bare object key, YouTube id extraction rejecting lookalike hosts |
| `lib/__tests__/uploadResume.test.js` | what may be resumed: same channel *and* kind, same name *and* size, the 7-day bound matching the backend's sweep, and storage that throws or is absent |
| `lib/__tests__/user.test.js` | the three permission helpers, incl. every null/loading case |
| `lib/api/__tests__/client.test.js` | the 401-refresh interceptor: one shared in-flight refresh for parallel 401s, single retry, `auth:session-expired` on each dead end, auth endpoints excluded |
| `lib/api/__tests__/beacon.test.js` | the unload flush: no token → no request, `keepalive` set, both sync and async failures swallowed |
| `hooks/__tests__/useChannels.test.js` | `contentCreateConfig`: only a payload carrying an `uploadSessionId` gets the long confirm timeout, everything else stays on the client default |

**Two conventions worth keeping.**

1. **Prefer exporting the pure function and testing that** over standing up React Testing Library
   for logic that doesn't need a DOM. Nothing has needed jsdom yet, and adding it would be a
   dependency plus a per-file environment pragma for no coverage gain.
2. **Fake transport by replacing axios's `adapter`, not with a mocking library.** `client.test.js`
   sets `api.defaults.adapter` (and `axios.defaults.adapter`, since the refresh call is made with
   bare `axios.post`, not the configured instance). That keeps the real axios interceptor pipeline
   — the thing actually under test — in play, and adds no dependency. Re-import the client per
   test with `vi.resetModules()`: the shared refresh promise is module-level state, so it leaks
   between tests otherwise.

**One latent gap is pinned rather than fixed**, in `user.test.js`: `isChannelOwner` compares
`channel.ownerUserId === user.id`, so two *absent* ids compare equal and it returns true. Not
reachable today (a `ChannelDTO` always carries `ownerUserId`, a signed-in user always has an id,
and `AuthContext` holds `null` while loading), and changing a permission helper is a decision to
take deliberately rather than as a side effect of adding tests. If it's ever fixed, invert that
assertion.

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

- `VideoPlayer.jsx`'s minimum-watch gate: a very short play never creates/bumps a watch-history row — otherwise an accidental click-and-immediately-back-out would count as "watched" and could push a genuinely-watched video out of the backend's per-user 200-row cap (see backend `CLAUDE.md`'s watch-history section). The floor is **duration-aware** (`watchThreshold(durationSeconds)`), not the flat `MIN_WATCH_SECONDS` (5s) it started as: `min(5s, max(1s, 10% of duration))`, falling back to the flat 5s whenever the player doesn't know the duration yet (non-finite/zero — an unloaded source or a live stream). 5s is right for a 45-minute lecture and wrong for a 13-second clip, where it silently swallowed the first 38% of the video — see the watch-history entry under History. Duration comes from the native element's `onLoadedMetadata` or the YouTube player's `getDuration()` on its first state change, held in `durationRef`; all four report paths (throttled `onTimeUpdate`, pause/ended, unmount flush, `pagehide` flush, both native and YouTube) share the one helper.
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

- The Navbar's "رفع" (Upload) link (see "Navbar upload link" under History) now routes to the viewer's own channel-manage page rather than the old unrouted `/upload`. There used to be 5 unrouted admin CMS tab components under `components/admin/` meant to eventually back a dedicated upload page; they were deleted 2026-09-01 (dead code, fully duplicated by `ChannelManage.jsx`) rather than wired up. If per-type CMS tabs come back, build them as part of the `ChannelManage` rewrite mentioned under "Refactoring / structure" below, not as a second implementation.

## Build / verify

```
npm run dev      # localhost:5173
npm run build    # ALWAYS run before trusting a session's changes
```
`npm run build` (Rollup) does full static import/export resolution and will catch things `npm run dev` (esbuild, lazy) won't — e.g. an imported named export that doesn't actually exist in the package. This exact class of bug (a `lucide-react` icon that didn't exist in the installed version) once broke the entire app with a blank white screen on every page, because `App.jsx` statically imports every page up front rather than lazy-loading per route — one bad import anywhere breaks the whole module graph on load. `npm run build` catches it in ~1.5s; a dev-mode HMR log won't.

Backend must be running (see its own `CLAUDE.md`) on `localhost:8080` for the app to have real data — `VITE_API_BASE_URL` env var overrides this if needed.

---

# Open items

Everything still outstanding, consolidated from all three review passes. This is the list to work
from; completed work and the verification record behind it live under "History" at the bottom.
Delete an entry here when it's actually fixed rather than moving it up — History is where
finished work goes.

## Bugs

From **Review 4 — 2026-09-05**, a staff-level pass over frontend *and* backend together, focused
on the presigned-upload/playback code that landed 2026-09-04 and had never been reviewed. The
backend half is filed in `absarna-backend/CLAUDE.md` under "Review 5"; several items below are
one bug with two halves and are cross-referenced. The three earlier passes remain fully closed —
everything here is new surface.

- **Abandoned uploads permanently lock a channel out of uploading.** The normal flow — pick a
  file, watch it upload, then navigate away without pressing "نشر الفيديو" — leaves a `PENDING`
  `UploadSession` on the backend forever. The backend caps a channel at 5 concurrent `PENDING`
  sessions, counts them with no age filter, has no sweep, and exposes no cancel endpoint, so the
  sixth abandoned upload is refused with "Finish or cancel one before starting another" and
  there is no way to do either. The fix is mostly backend (see C1 there), but the frontend is
  what makes it trivially reachable: `handleVideoFileSelect` uploads immediately on file
  selection, long before the user commits to publishing, and nothing cleans up if they change
  their mind. Worth pairing the backend fix with a cancel call on unmount/replace.

- **A single failed part aborts the whole upload, with no retry and no way back.** `putPart`
  throws on any non-OK response and `uploadParts` lets it propagate, so one transient blip
  anywhere in a 1,280-part upload discards every byte already transferred — the parts are still
  in object storage and the session is still resumable, but nothing in the UI can reach them
  (see "resume is unreachable" below). At multi-GB sizes over real mobile/MENA connectivity this
  is the difference between a feature that works and one that doesn't. Add bounded retry with
  backoff around `putPart`; it is the single highest-value change to this hook.

- **A 429 mid-upload kills the upload.** The backend's `RateLimitFilter` still carries a
  `uri.contains("/upload") && POST → 5/min` rule written for the deleted chunked uploader, and
  it catches `POST .../upload-url/{sessionId}/parts`. Every reissue batch for one session shares
  a bucket, and this hook re-signs 50 parts (≈400 MB) per call, so a client sustaining more than
  roughly 270 Mbit/s runs into a hard 429 partway through. Nothing retries it. Backend fix is
  C6; the frontend should still treat 429 as retryable-with-backoff rather than fatal.

- ~~**`contentType` is taken from `file.type`, which browsers often leave empty.**~~ **Fixed
  2026-09-05**: the field is no longer sent at all. The backend derives the content type from the
  allowlisted extension (finding C7) and accepts-and-ignores the field, so the fallback to
  `'application/octet-stream'` — which is not on the allowlist and 400'd perfectly valid `.mov`
  and `.m4v` files — has nothing left to break. Nothing is lost: the header was client-asserted
  either way.

- **`accept="video/*"` on the file input doesn't match what the backend accepts** (`mp4`, `mov`,
  `m4v`). Picking a `.webm` or `.avi` is allowed by the picker, uploads nothing, and fails at
  session creation with a server-side error. Narrow the `accept` to the real allowlist so the
  rejection happens in the file dialog.

- **Progress can exceed the file on a resume.** `let done = file.size - outstanding.length *
  session.partSizeBytes` assumes every missing part is full-sized; when the *last* part is
  missing (and it is smaller than `partSizeBytes`), `done` starts too high and the bar overstates
  progress. Cosmetic, and it self-corrects at the 99% cap, but the arithmetic is worth fixing
  since the correct value — the sum of the `size` fields the backend already returns per
  uploaded part — is right there in the response and is being discarded.

## Refactoring / structure

- ~~**Resume is fully built and completely unreachable.**~~ **Wired up 2026-09-05** (backend
  finding R1) — `lib/uploadResume.js` + `ChannelManage`'s shared `runUpload`, details under
  "Presigned uploads" above. Four built endpoints stopped being dead weight, and the failed-part
  and 429 bugs above are now survivable rather than fatal: an interrupted upload can be picked up
  where it stopped instead of started over.

- **This section's own entry was stale and is now corrected.** The previous text said, "checked
  2026-09-03, that rewrite has not happened" and described `ChannelManage.jsx` posting to
  `/channels/{slug}/content/{videos,books}/upload` with a separate backend `upload` module
  (`ChunkUploadController`/`FileUploadController`) alongside it. **All of that is gone as of
  2026-09-04**: the backend's `upload` and `streaming` modules were deleted outright, and
  `ChannelManage.jsx` now uploads through `usePresignedUpload` straight to object storage. So
  the condition this extraction was parked on — "wait until the upload endpoints change
  underneath it" — **has been met**. `ChannelManage.jsx` is still ~700 lines holding five tabs
  and four near-identical content forms, and the `<ContentPublishForm type=… />` +
  `useChannelContentTab(slug, type)` extraction is now genuinely unblocked. Doing it is also the
  natural place to land the resume UI above, since the video and book upload handlers are
  near-duplicates of each other.

- ~~**`STREAM_BASE_URL` in `lib/env.js` is dead**~~ — **deleted 2026-09-05** along with the
  `VITE_STREAM_BASE_URL` env var it read. It pointed at the backend's `/stream/**` range-request
  endpoints, which went with the `streaming` module.

## UX

- **Comment reporting.** Author-only comment edit/delete exist, but a reader still has no way to
  report someone else's comment — there's no backend endpoint for it yet.

## Feature ideas

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

---

# History — completed work, verifications, and decisions

Three review passes with the fixes that came out of each. Nothing here is outstanding — it's kept
because the *why* is expensive to re-derive, and because several entries record things
deliberately **not** done. Open items live under "Open items" above.

## Frontend security pass — 2026-09-05

A pass over this side alone, deliberately scoped to what the frontend can fix without touching
the backend. Three things changed; the rest of the section records what was checked and found
sound, so the next pass doesn't re-derive it. **No backend change was needed for any of it.**

- **`BookCard` minted a presigned read URL for every card it rendered.** The worst of the three,
  and the only one that scales: a presigned URL is a bearer credential valid for hours, and a
  listing page created one per book on screen — twelve on `/books`, twelve more per
  infinite-scroll page, again on `History`, `Bookmarks` and `ChannelPage` — for books nobody
  downloaded. Not a privilege escalation (the backend runs `ContentVisibility` before signing, so
  every one of those URLs was for a book the viewer may already read), but it turned one careless
  page view into a cache full of live download links and made the backend's
  `playback_url_minted_total` counter — its stated proxy for concurrent viewers — measure card
  impressions instead. Now fetched on intent; the mechanics and why a blank tab is opened inside
  the click gesture are under "Reading media" above.
- **`AuthContext` logged the whole axios error on a failed profile fetch**, and an axios error
  carries `config.headers.Authorization` — the live session JWT. Console output is not a private
  channel: extensions read it, screenshots capture it, and any error-reporting hook added later
  would ship it. Now logs the status alone. (`ErrorBoundary`'s `console.error` is left as-is —
  a React error and its component stack carry no credential.)
- **Dependency advisories cleared: 7 → 0.** `vite` 5.4.21 → 6.4.3, `vitest` 2.1.9 → 3.2.7,
  `react-router-dom` 6.30.6 → 7.18.3. The critical and high were dev-only (vitest UI arbitrary
  file read/execute; vite dev-server path traversal and `server.fs.deny` bypass) but genuinely
  live for anyone running `npm run dev --host` to test on a phone. The one touching shipped code
  was React Router's open redirect via a backslash in `<Link>`/`useNavigate` — **checked as
  unreachable here** before bumping: every `to=` in `src/` is a template literal over an id or a
  channel slug, and the backend constrains slugs to `^[a-z0-9-]+$`, so no backslash can reach a
  route target. Bumped anyway rather than left as an argued exception.
  - Note the earlier entry's "needs vite 8 / vitest 3" was pessimistic: **vite 6.4.3 and vitest
    3.2.7 are already past every advisory range**, which is why this stayed a two-major bump on
    the tooling rather than a jump to vite 8 (whose `@vitejs/plugin-react` 6 pulls in
    oxc/rolldown and a React-compiler babel plugin — a real migration, for no extra security).
  - **Verified by `npm run build` and the full 95-test suite on the new toolchain, not by a
    browser click-through** — the Chrome extension wasn't connected. Every React Router API this
    app imports (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useLocation`,
    `useNavigate`, `useParams`, `useSearchParams`) was confirmed present in 7.18.3, and the app
    uses component routes rather than a data router, so none of v7's loader/action-era breaking
    changes apply. Worth one manual pass over the routes anyway.

Checked and found sound, for the record: no `dangerouslySetInnerHTML`, `eval`, or `innerHTML`
anywhere in `src/`; every externally-sourced URL that becomes an `href`/`src` goes through
`safeExternalUrl` or `resolveMediaUrl` (both of which reject anything but absolute http(s), see
`lib/media.js`); every `target="_blank"` carries `rel="noopener noreferrer"`; the presigned `PUT`
still uses raw `fetch` so the JWT never reaches the storage host; the YouTube embed passes a
parsed video id to `YT.Player` on the `youtube-nocookie.com` host rather than interpolating a URL;
and no route target, redirect, or API path is built from a query parameter.

## Confirm timeout — 2026-09-05 (Review 4 / backend C5)

**The one Review-4 item that was a pure frontend fix.** `lib/api/client.js`'s blanket
`timeout: 30000` also governed the create call that confirms a presigned upload — where the
backend pages through `ListParts` and runs `CompleteMultipartUpload` over an object that can be
several GB, routinely well past 30s. Axios aborted, the user was told "فشل في نشر الفيديو", and
the backend went on to assemble the object and create the video anyway: a failure message for a
publish that had actually succeeded.

- **A per-request override, not a higher global timeout.** `UPLOAD_CONFIRM_TIMEOUT_MS` (5 min) is
  exported from `client.js` and applied by `contentCreateConfig(payload)` in `useChannels.js`,
  which hands it only to a payload carrying an `uploadSessionId`. The 30s default exists so an
  ordinary stalled read fails fast; raising it globally would make every hung request hang five
  minutes to suit the slowest call in the app.
- **The decision is an exported pure function** so it could be tested without standing up a React
  tree — convention 1 of the Testing section, applied rather than restated.
- **A timeout now says something different from a failure.** `ChannelManage`'s `publishError`
  reports a slow confirm as "لم يضِع ما رفعته — أعد المحاولة بعد قليل" instead of "فشل". That is
  accurate rather than merely kinder: the create endpoint is idempotent on the session, and the
  error path deliberately leaves `uploadSessionId` in form state, so pressing publish again
  returns the row the first attempt created without re-uploading a byte. Telling the user it
  failed was pointing them at starting over.

## Review findings — 2026-09-01

Full read-through of the frontend (no code changed). Everything below is **open**; delete an
entry when it's actually fixed rather than leaving it here as history. Backend-side findings
live in the backend's own `CLAUDE.md` under the same heading — several items here have a
matching entry there and are best fixed on both sides at once.

### Bugs

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


### UX / UI

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


### Accessibility

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

### Refactoring / structure

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

## Review findings — 2026-09-02

Second full read-through (frontend + backend), no code changed. Everything below is **open**;
delete an entry when it's actually fixed. The backend's `CLAUDE.md` has a matching section under
the same heading — the first two items here are two halves of one fix and should be done together.

### Bugs / security

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

### Notes

- `resolveMediaUrl(url, token)` now appends `?token=` only to `/uploads` and `/stream` paths on
  our own origin — it used to append to any URL whose string merely *started with* the API base,
  which turned out to be a real leak, not just a wide contract. Fixed 2026-09-02; see the third-
  pass section at the end of this file.
- (Historical — the token parameter no longer exists.) The `token` it took was the **media token**, never the session
  token — see "Media tokens" below.
- `<html lang="ar" dir="rtl">`, per-page `usePageMeta`, `ErrorBoundary`, focus trapping and the
  skip link are all in place; no `dangerouslySetInnerHTML` anywhere in `src/` — the XSS item above
  is the only injection path found.

## Review findings — 2026-09-02 (third pass)

Third full read-through (frontend + backend), no code changed. Everything below is **open**;
delete an entry when it's actually fixed. The backend's `CLAUDE.md` has a matching section under
the same heading — the media-token item below is the frontend half of a fix that is *entirely*
frontend-side (the backend's own credential separation was probed and is sound), and the
change-password item is one half of a fix that needs both sides.

### Bugs / security

Fixed 2026-09-02 (same day as this review): **changing your password no longer logs you out of
the session you changed it from.** The backend's `tokenVersion` bump invalidates every JWT
issued before the change — correctly, that's what kills a pre-change stolen token — but it also
kills the pair this session holds, and `POST /api/user/change-password` returned nothing but
`{"changed": true}`, so the next request 401'd, the refresh 401'd, `auth:session-expired` fired,
and `ChangePasswordCard` dropped the user at `/login` moments after a successful change. The
backend now returns a fresh `{changed, token, refreshToken}` (see its `CLAUDE.md`); this side
adopts it. `AuthContext` gained **`applySession({token, refreshToken})`** — the one place a
fresh pair is written to `localStorage` and to `token` state — and `login`/`register` were
rewritten to use it rather than each repeating the same three lines, so no caller can set one of
the two keys and forget the other. `UserProfile.jsx`'s `ChangePasswordCard` now pulls
`applySession` from `useAuth()` and passes it the response. Note this makes `changePassword` the
one function in `lib/api/auth.js` whose result must reach `AuthContext` — the bullet under
"Password reset" above says so.

Fixed 2026-09-02 (same day as this review): **`resolveMediaUrl` appended the media token on a
string-prefix match, not an origin match.** `lib/media.js` guarded the `?token=` append with
`resolved.startsWith(API_BASE_URL)` — a prefix test on a URL *string*, so it also passed for any
host whose name merely begins with ours (`https://api.example.com.evil.tld/…`) and for userinfo
syntax (`https://api.example.com@evil.tld/…`, which the browser sends to evil.tld). That was
reachable, not theoretical: the backend's `SafeUrl` allowlist admits any absolute `https` URL, so
a channel owner could store such a value as a hidden video's `sourceUrl` and collect the media
token of anyone able to view it — a platform admin moderating that channel included, whose token
is good for an hour against any gated file on the platform. `VideoPlayer.jsx` renders
`<source src={resolveMediaUrl(sourceUrl, mediaToken)}>` for exactly the hidden + `LOCAL`/`STREAM`
case; `BookCard.jsx`/`BookDetail.jsx` had the same shape via `pdfUrl`/`previewImageUrl`.

The guard is now a new `isOwnMediaUrl(resolved)` helper comparing **parsed origins**
(`new URL(resolved, window.location.href).origin === apiOrigin`, the latter parsed once at module
load), *and* narrowed to the two paths `MediaAccessInterceptor` actually gates — the token
authenticates nothing else, since `JwtFilter` only accepts it from `?token=` on `/uploads` and
`/stream`, so sending it anywhere else was pure leak surface. That also closes the
"`resolveMediaUrl` appends `?token=` to **any** URL on the API host" note under "Notes" in the
2026-09-02 section above, which can be deleted with it. Verified across all seven shapes: the two
attack URLs and an on-origin `/api/user/profile` get no token; `/stream/…`, `/uploads/…` and a
bare filename still do.

Fixed 2026-09-02 (reported live: "when I click on the home page logo or refresh the watch history
isn't saved; only saved when I press pause"): **two separate bugs in watch/reading-progress
reporting, one write-side and one read-side.**

Write-side — `VideoPlayer.jsx`'s unmount-flush effect read `videoRef.current` *inside* its
cleanup function:
```js
useEffect(() => {
    return () => {
        const el = videoRef.current; // already null here
        if (el && el.currentTime > 0) reportProgress(el.currentTime, authRef.current);
    };
}, []);
```
React nulls a `ref={...}`-attached ref for a removed host element as part of the *same* unmount
pass that runs this cleanup, so by the time the closure ran, `videoRef.current` was already
`null` and the guard silently skipped the report — meaning any in-app navigation away from a
locally-hosted video (clicking the navbar logo, any other `<Link>`, `navigate()`) never sent the
final progress write. YouTube playback was unaffected — its player lives in a plain `useRef` we
set ourselves (`youtubePlayerRef.current = new YT.Player(...)`), which React has no special
unmount behavior for. Fixed by capturing `videoRef.current` into a local variable when the effect
is *set up*, not read fresh at cleanup time — the standard fix for this exact class of React bug.

Read-side — even with the write landing, the UI still wouldn't show it. `VideoPlayer` posts
progress via a raw `api.post(...)`, entirely outside React Query, so nothing marked the cached
`['watch-history']` query (which backs History/Home/Bookmarks/`VideoCard`'s progress bar) stale.
A same-day fix added `queryClient.invalidateQueries({ queryKey: ['watch-history'] })` after each
successful write — necessary but, on its own, insufficient: `invalidateQueries` only forces an
*immediate* refetch for queries with an active (currently-mounted) observer, which `['watch-
history']` almost never has at the moment a watch is reported (you're on `VideoDetail`, not
History). For an inactive query, invalidation just sets `state.isInvalidated = true` and waits for
the next mount — but the app-wide `QueryClientProvider` sets `refetchOnMount: false`, and (checked
directly against the installed `@tanstack/query-core` source, `queryObserver.js`'s
`shouldFetchOnMount`/`shouldFetchOn`) that option short-circuits *before* the invalidated-check
ever runs when there's already cached data — so a query invalidated while inactive still doesn't
refetch on its next mount. Net effect: the backend row was correct the whole time (confirmed
directly via `curl` against `/api/videos/{id}/watch` and `/api/user/history`, bypassing the
frontend entirely) and only the cache serving History/the progress bars was stale. Fixed by
overriding `refetchOnMount: true` on `useWatchHistory` (and, for the identical gap, on
`useReadingHistory`, which `useSaveReadProgress` invalidates on every page-turn write) — same
precedent as the old `useMediaToken`'s override of the app-wide default, for the same reason: an
explicitly-invalidated query has to be allowed to actually refetch on its next mount, not just
get flagged and ignored.

Fixed 2026-09-02 (reported live: "when I watch a couple of seconds of any video and then click
on the logo to go to home page the video is not added to my watch history"): **the flat 5-second
`MIN_WATCH_SECONDS` floor, not the flush plumbing.** The three-layer reporting fixed earlier the
same day is working — `watch_history` in the local DB holds rows written by it — but every row's
`progress_seconds` is ≥ 5 and none is 1–4, because `reportProgress` drops anything below the
floor before it ever reaches axios. Every video seeded locally is 13 seconds long, so the floor
was eating the first 38% of the clip: watching "a couple of seconds" and navigating away was
correctly flushed on unmount and then correctly discarded, indistinguishably (from the outside)
from not being flushed at all. Replaced with the duration-aware `watchThreshold()` described
under "Watch/reading progress" above; the accidental-click protection it exists for is also
narrower than it looks, since nothing in the player autoplays — the viewer has to press play.

Fixed in the same pass, found while reading that path: **the unmount flush captured a `null`
element for any hidden video.** The effect took `const el = videoRef.current` at *setup* time to
dodge React's null-out-on-unmount, but it's a `[]` effect, so it runs on the first render — and
on the hidden-item path the first render is the media-token placeholder `<div>`, not the
`<video>`. `el` was therefore `null` for the life of the component and the final progress write
never fired at all for a hidden video (the `pagehide` layer was unaffected — it reads the ref at
event time). `videoRef` is now populated by a `useCallback`'d callback ref that ignores the null
write, so the last real element stays readable at cleanup time whichever render produced it.

### Checked and holding

Probed specifically this pass, not assumed from this file's changelog:

- **No injection sinks anywhere in `src/`.** No `dangerouslySetInnerHTML`, no `innerHTML`, no
  `eval`. Every external `href` goes through `safeExternalUrl` (`VideoPlayer`'s two fallbacks and
  its `TELEGRAM` `<source>`, `Biography`'s three social links) or is a `mailto:` with a fixed
  scheme prefix that can't be escaped. Every `target="_blank"` carries `rel="noopener noreferrer"`.
- (Historical, code since deleted.) **`useMediaToken`'s `required` gating, hold-back-until-loaded, and no-refetch-on-a-timer
  behavior all worked as documented** — the only media-token problem was `resolveMediaUrl`'s host
  check above, not the hook.
- **`client.js`'s deduped refresh, rotated-refresh-token storage, and both `auth:session-expired`
  paths are correct**, including the no-refresh-token branch fixed in `e3f13c3`.
- **`validation.js` mirrors the backend's real rules**, including the 72-**byte** BCrypt cap
  measured with `TextEncoder` rather than `String.length`.

## Rebrand: منارة → أَبْصَرْنا — 2026-09-03

Platform renamed from "منارة" (Manara, "lighthouse/beacon") to "أَبْصَرْنا" (Absarna) — a real
change in meaning, not just a new word: "منارة" describes a fixed guiding light, "أَبْصَرْنا"
("we perceived / we gained insight/sight", from the root بصر) describes the act of seeing itself.
Direction was worked out iteratively against a design canvas (Islamic-Andalusian/Cairo geometric
reference, several logo concepts tried and rejected — an eye motif, a pierced-brass lantern, a
lantern-in-star hybrid — before landing on the current mark) before touching any code; only the
final approved direction is described here.

- **Logo/favicon** (`src/assets/logo.svg`, copied to `public/favicon.svg`): two overlapping
  squares, one turquoise (`#17A398`→`#0A4A45` gradient) and one gold (`#F2AE30`→`#A66E14`
  gradient) rotated 45° from each other — a literal construction from Islamic geometric
  ornament (the intersection of two squares gives a regular octagon; their eight combined
  corners give the classic 8-point star), not a stock "8-point star" glyph. Deliberately **not**
  a lantern or an eye — both were explored and rejected (lantern read as visually busy/cluttered
  at favicon size and is a fairly generic Middle-Eastern-branding trope; an eye motif was
  explicitly ruled out for feeling too literal about "sight"). A richer malachite-textured
  octagon-on-square "showcase" variant (gold-engraved star medallion, backlit glow, built with an
  SVG `feTurbulence` filter for the stone texture rather than a raster asset) exists in the design
  canvas for splash-screen/marketing use but was **not** shipped as the in-app icon — its fine
  lattice detail doesn't hold up below hero size, same reason the lantern was dropped.
- **Color tokens** (`src/index.css`'s `:root`/`.dark`, see "Dark mode" above): primary shifted
  from a muted forest green (`#0D6B4D`) to a more saturated zellige turquoise (`#17A398` light /
  `#22C4BC` dark), gold shifted from a muted brass (`#D4AF37`) to a warmer, more saturated gold
  (`#F2AE30` light / `#F5C15A` dark) — both pushed more vivid than the first pass, which read as
  "dull" against the Islamic-ornament reference material. Light-mode neutrals also moved from a
  cool off-white to a warm parchment (`#FBF7EE` page / `#FEFDF9` surface / `#E5DFD3` border), and
  dark-mode neutrals from a neutral charcoal to an indigo-tinted near-black (`#10141C`) — matching
  the design canvas's full palette, not just the two brand accent tokens.
- **Wordmark**: `Navbar.jsx` now renders "أَبْصَرْنا" (fully vocalized with tashkeel — hamza,
  sukūn, fatha — since a bare `ابصرنا` is ambiguous/harder to read as a fresh brand name) in the
  new `font-serif` token (`Markazi Text`, added to `tailwind.config.js`'s `fontFamily` and loaded
  in `index.html`'s Google Fonts link) — used only for the wordmark, not a body/heading font swap.
- **Copy**: every user-facing "منارة" string replaced with "أَبْصَرْنا" —
  `index.html`'s title/OG/Twitter meta, `usePageMeta.js`'s defaults and per-page suffix,
  `Register.jsx`'s post-registration line, and the `usePageMeta` description strings in
  `Articles.jsx`/`Books.jsx`.
- **`package.json`'s `name`** changed from `manara-frontend` to `absarna-frontend`;
  `package-lock.json` resynced via `npm install --package-lock-only`. The repo directory
  (`elhamy-frontend-enhanced`) and `.idea/` project files stay as they were before this rebrand —
  already-documented cosmetic leftovers, unaffected by this change. The **backend** repo
  (`/Users/kareemismail/IdeaProjects/manara-platform`) is untouched — its directory name and
  `com.manara.*` Java package naming are that repo's own decision, out of this session's scope.
- Not changed (at the time): comment in `src/hooks/useVideos.js` and `src/lib/validation.js`
  referencing "manara-platform"/"com/manara/..." — these named the actual backend repo/package,
  not the product brand, and stayed accurate only as long as the backend itself wasn't renamed.
  It was, six days later — see "Rename: Manara → Absarna" below.

## Rename: Manara → Absarna (repo/folder/backend cross-refs) — 2026-09-03

The rebrand above changed user-facing copy and `package.json`'s `name`, but deliberately left the
repo directory, GitHub repo, and the backend untouched (both scoped out at the time — see the
bullet above). All three closed today, together with the matching backend-side rename (see the
backend's own `CLAUDE.md`, "Rename: Manara → Absarna" entry, for the Java-package/DB/SQL-function
side of it — that repo's rename is out of this repo's scope to describe in detail, same as before).

- Local directory: `~/Desktop/elhamy-frontend-enhanced` → `~/Desktop/absarna-frontend` → (same
  day) `~/IdeaProjects/absarna-frontend`, moved a second time to sit next to the backend under
  `~/IdeaProjects` rather than `~/Desktop` — see the intro paragraph above, now updated. GitHub
  repo: `abo-mousa/manara-fe` → `abo-mousa/absarna-frontend` (the GitHub repo name had already
  drifted from the local folder name pre-rename — it was never actually
  `elhamy-frontend-enhanced` on GitHub, just locally).
- Backend path references updated to match its own rename: the intro paragraph above, and the
  two source comments (`src/hooks/useVideos.js`'s `useWatchHistory` comment,
  `src/lib/validation.js`'s header comment) that name the backend repo/package by its old name —
  see the bullet directly above this entry for why those were deliberately left alone the first
  time.
- Nothing else in this repo's own code changed — the frontend has no runtime dependency on the
  backend's package names, DB name, or SQL function name (those only matter inside the backend's
  own JVM/DB), so this was purely a documentation/comment-accuracy pass on this side.

## Video resume-playback — 2026-09-03

Opening a video (from History or anywhere else) always restarted from 0, never resuming from a
previously saved watch position — reported live ("when I open a video that I already opened
before it doesn't continue from where it stopped").

Two separate bugs, found in sequence:

- **Never wired up at all.** `VideoDetail.jsx` computed `startTime` only from the `?t=`
  share-timestamp query param — it never looked at `useWatchProgressMap`, even though that data
  was already being fetched on the same page (for the related-videos row's progress bars).
  Fixed: `startTime = sharedTime || Math.floor(watchProgress[video.id] || 0)`.
- **A race, found while fixing the above.** `VideoPlayer.jsx`'s YouTube branch bakes its start
  position into `playerVars.start` once, at player-creation time, and its creation `useEffect`
  doesn't depend on `startTime` (deliberately, to avoid recreating the player on every seek) — so
  if the ~200-item `/user/history` request hadn't resolved yet by the time the video's own
  (single-row) fetch completed, the player got created with `start: undefined` and never resumed,
  silently, not just late. Native `<video>` had the same theoretical exposure via
  `onLoadedMetadata`, just less likely to actually lose the race.
  Fixed by holding `<VideoPlayer>` itself back — a `Spinner` in its place — until
  `useWatchHistory`'s `isLoading` clears, so the player is only ever constructed once the true
  resume point is known; every entry point (Home, Search, ChannelPage, Bookmarks, History,
  SeriesDetail, the navbar search bar) benefits automatically since they all just navigate to
  `/video/{id}` and this fix lives at the destination.
- Checked and already correct by comparison: `BookDetail.jsx`/`PdfReader.jsx`'s reading-progress
  resume has no equivalent race — `PdfReader` has an explicit effect that applies `initialPage`
  even if it "arrives asynchronously," precisely the robustness `VideoPlayer`'s one-shot YouTube
  player creation lacked.

## Comment counts on `VideoCard`/`VideoDetail` — 2026-09-03

`video.commentCount` is now a real field on every video DTO the backend returns (see backend
`CLAUDE.md`'s matching entry for how — a computed `COUNT()` per response, not a stored/synced
counter). Counts both top-level comments and replies, matching `CommentsSection`'s own
"التعليقات (N)" total exactly, so the number never disagrees between a card and the video's own
page.

- `VideoCard.jsx`'s info area is now two columns: title → channel name → category on one side,
  publish date · views · comments stacked on the other (`min-w-0` on the title column — without
  it a flex item won't shrink below its content's natural width, which silently breaks
  `line-clamp-2`).
- `VideoDetail.jsx` reads `video.commentCount` directly now instead of separately fetching every
  comment via `useComments` just to run them through `countComments` — that workaround predated
  the backend field and is gone; `CommentsSection` still does its own full fetch, for the actual
  comment list, unrelated to this count.
- Publish dates across every card/detail page (`VideoCard`, `VideoDetail`, `BookCard`,
  `ArticleCard`, `PostCard`, `BookDetail`, `ArticleDetail`, `Articles.jsx`) now render through a
  shared `formatPublishDate()` (`lib/dayjsAr.js`) — relative ("منذ يومين") under a week old, an
  absolute date past that, date-only (no time-of-day, unlike `CommentsSection`'s own
  timestamp formatter, since a publish date has none).

## Two quick cleanups — 2026-09-03

- **`ChannelManage.jsx`'s four create handlers no longer send a `channelId`.** They previously did
  `{ ...stripEmpty(form), channelId: channel.id }`; none of `VideoCreateRequest`/
  `BookCreateRequest`/`ArticleCreateRequest`/`PostCreateRequest` has that field, so it was always
  silently discarded by Jackson's default unknown-property handling on arrival —
  `ChannelContentController` sets the real `channelId` server-side after mapping, which *is* the
  mass-assignment fix, so the client was never trusted with it. Harmless, but it read as though
  the client picks the channel. Dropped from all four `mutateAsync` calls; `handleVideoSubmit`'s
  `speaker: channel.name` is unrelated (still genuinely sent) and stays.
- **Navbar's "رفع" (Upload) link no longer points at the unrouted `/upload`.** It now uses
  `useMyChannels()` (already the hook `SideBar.jsx` uses for its own "قنواتي" list) to route to
  the viewer's first owned channel's `/channel/{slug}/manage` — the only place uploading actually
  happens, per "Owner content management" above — falling back to `/create-channel` for a
  CREATOR/CHANNEL_ADMIN who hasn't created a channel yet. No new page was built; multi-channel
  owners land on their first channel's manage tab and can switch via `SideBar`'s channel list, same
  as before this fix. Verified via `npm run build`.
