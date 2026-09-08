# History — closed work and the decisions behind it

Review passes and the fixes that came out of each. **Nothing here is outstanding.** It is kept
because the *why* is expensive to re-derive, and because several entries record things
deliberately **not** done. What is still open lives in `CLAUDE.md`.

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
