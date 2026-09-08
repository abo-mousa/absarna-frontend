# أَبْصَرْنا (Absarna) Platform — Frontend

React 18 + Vite SPA for the Absarna media platform (videos, books, articles). Plain JavaScript
(`.jsx`, not TypeScript), RTL Arabic throughout.

**Two companion repos**, each with its own `CLAUDE.md`:

- `/Users/kareemismail/IdeaProjects/absarna-backend` — the API. What this app relies on from it is
  under "Backend contract" below.
- `/Users/kareemismail/IdeaProjects/absarna-worker` — the transcode worker. **Nothing here talks
  to it**: it has no HTTP surface and reaches the backend only over Redis streams. It matters to
  this repo for one reason — it produces the rendition ladder behind `playback-url`'s `qualities`
  and the poster frames that fill `thumbnailUrl`. Until a rung exists there is no quality to pick.

**Two files here.** This one is loaded into every session; `HISTORY.md` is not, so read it when
the work calls for it: it holds the closed review passes, the منارة → أَبْصَرْنا rebrand, and the
calls that were considered and rejected. Read it when you need to know *why* code looks defensive.

Keep this file updated when architecture or conventions change — not a changelog for every commit,
just what a fresh session would otherwise re-derive by reading everything. When work closes, move
the narrative to `HISTORY.md` rather than growing this file.

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
                BookmarkButton, LikeButton, SubscribeButton, ShareButton — barrel export via
                index.js (PdfReader is the deliberate exception, see its own barrel comment)
    auth/       EmailVerificationNotice — barrel export via index.js, see "Email verification" below
    channel/    ContentPublishForm (+ FieldLabel), ContentManageList — the channel dashboard's
                shared publish/list pieces, see "Channel dashboard" below
  pages/        route-level components, each lazy-loaded per route in App.jsx (see "Build / verify" below).
                Bookmarks.jsx (`/bookmarks`) and SeriesDetail.jsx (`/series/:id`) are the newest —
                see "Bookmarks" and "Series" below.
  hooks/        useVideos, useBooks, useArticles, useBiography, useChannels, useComments,
                useBookmarks, useLikes, useSeries, useCommentModeration, useAdminData, useMediaUrl,
                usePresignedUpload, useDebouncedValue, useOutsideClick, useFocusTrap,
                usePageMeta, useChannelContentTab — see "Data fetching: React Query",
                "Media URLs" and "Channel dashboard" below
  contexts/     AuthContext, ThemeContext (see "Dark mode"), ToastContext (see "Toast notifications")
  i18n/         index.js (`t`/`tOptional`) + ar.js (the whole catalog) — EVERY user-facing string
                lives here, see "Strings: the catalog" below
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

## Strings: the catalog (`src/i18n`) — extracted 2026-09-07

**Every user-facing string lives in `src/i18n/ar.js` and reaches the screen through `t()`.** There
were ~600 Arabic literals across 51 files before this; there are now **422 catalog entries** read
from **587 call sites** in 51 files. Do not add a bare Arabic literal to a component — the whole
point is that there is exactly one place to look.

- **`t('some.key')`, `t('key', { name })` for a `{name}` placeholder.** Prefer a placeholder over
  concatenating at the call site: a sentence assembled from fragments can't be reordered by a
  translator, and Arabic and English don't order these the same way.
- **A missing key returns the key itself** and warns in dev. Visibly wrong beats invisibly wrong —
  an empty string is a button with no label that nobody notices in review.
- **`tOptional(key)` returns `undefined` instead**, for lookups whose key comes from *data* rather
  than source. The one caller is `VideoPlayer`'s quality selector: it asks whether the catalog has
  a word for a rung name the transcode worker chose, and "1080p" correctly has none, so a miss is
  the normal case and warning about it would train everyone to ignore the warning that matters.
- **Hand-rolled, not react-i18next, and that is the point.** `index.js` is ~40 lines with no
  dependencies; neither it nor `ar.js` imports React, touches the DOM, or knows what a bundler is,
  so **a React Native app can import both verbatim** — the largest single thing this app can hand a
  mobile one. i18next's weight is in plural rules, language detection and lazy namespaces, none of
  which a single-locale app needs. The call sites are identical either way, so swapping the
  implementation later is a one-file change; extracting the strings was the irreversible half.
- **Namespacing rule**: put a string in the namespace of the screen that shows it; promote it to
  `common` only once a *second* screen needs the same words *for the same reason*. Same words is
  not enough — the tab label «كتب» and the page heading «المكتبة» are both about books and stay
  separate, because a translation of one isn't a translation of the other.
- **Deliberately NOT in the catalog**: `lib/dayjsAr.js` (month names and relative-time forms are
  dayjs *locale data* — a second locale swaps the whole object rather than translating entries);
  Arabic inside code comments; and test fixtures that happen to be Arabic (`{ title: 'درس' }`
  stands for "some text"). Tests that assert a *user-visible* string do go through `t()`, so
  rewording a message updates its test instead of turning it red — see `validation.test.js`.
- **`src/i18n/__tests__/i18n.test.js` walks the source for every literal `t('...')` key and asserts
  it resolves.** This is the test that makes the catalog safe to refactor: a mistyped key is
  otherwise invisible, since `t()` returns the key and the page still renders — the bug is a line
  of dotted ASCII in the middle of an Arabic screen that only a human looking at that exact screen
  would catch. There's no type system here to do it instead. The suite also asserts it found more
  than 200 call sites, so a regex that stops matching can't make the check pass vacuously.

**Why this landed now**: it's the precondition for sharing copy with a mobile app, and for an
English build ever being possible. It was cheap while this app was the only consumer, and gets
steadily more expensive after that.

## Channel dashboard (`ChannelManage` + `components/channel` + `useChannelContentTab`)

The refactor this file had been flagging as "unblocked" landed 2026-09-07. `ChannelManage.jsx` was
789 lines holding five tabs and four near-identical publish forms; it is 701 now, and — more to the
point — the duplication is gone rather than merely moved:

- **`useChannelContentTab(slug, type, active)`** replaces what was **sixteen hook calls** (four
  types × list/create/toggle/delete) plus `deleteItem`, `toggleVisibility` and a `showMessage`
  helper shared between them. Four calls now. A new content type is one more call, not four more
  hooks and another copy of the handlers. **It is called unconditionally, once per type** — `active`
  gates the *query*, not the hook, because making the call conditional would break the rules of
  hooks the moment someone switched tabs.
- **`ContentPublishForm`** owns the shell all four forms share: the card, its heading, the optional
  file picker with its progress bar, the submit button. **The fields stay at the call site as
  children** — a series picker for a video, a page count for a book, a fifteen-row body for an
  article are genuinely different, and a schema prop would trade four readable forms for one
  form-builder DSL that's harder to read than any of them. Hoist what's shared; write out what
  differs.
- **The scaffolding was the part that had drifted**, which is the argument for extracting it: the
  book tab showed a "جاري الرفع..." string where the video tab showed a progress bar, from the same
  hook reporting the same number. Both show the bar now.
- **`showMessage('success:...')` is gone.** That string-prefix hack was kept "to avoid touching all
  twelve call sites"; the call sites moved anyway, and it split on the first colon in a message.
  Everything goes through `showToast(message, 'success'|'error')` directly.
- **The one rule worth knowing before touching `publish()`**: a client-side timeout is reported as
  "still working, try again shortly" for `videos`/`books` and as an ordinary failure for
  `articles`/`posts`. That asymmetry is not cosmetic — the upload-backed create call is idempotent
  on the upload session id, so a retry returns the row the first attempt made; an article publish
  has no session, so the same wording would invite a duplicate. `UPLOAD_BACKED` in
  `useChannelContentTab.js` is that rule, and `useChannelContentTab.test.js` pins both directions.

## YouTube import (`components/channel/YouTubeImportPanel`, `hooks/useChannelYouTube`)

Added 2026-09-07. Lets a channel owner import their existing YouTube catalogue **once**.

**Also on `CreateChannel`**: a YouTube link field with a "جلب البيانات" button that resolves the
channel and prefills name, description, logo and slug (`useResolveYouTubeChannel` →
`POST /api/youtube/resolve`). Most of that form is something the owner already wrote once on
YouTube. **A button, never on-blur or on-keystroke** — each call spends a unit of the platform's
shared daily quota. **Only empty fields are overwritten**, so someone who typed a name and then
pasted their channel link does not watch their own words disappear.

**The slug comes from the YouTube handle, not the title** — and that is the field that would
otherwise stall the whole form. The slug is required and Latin-only, and an Arabic channel title
reduces to the empty string, so prefilling from the title left the one required field blank on
exactly the channels this feature exists for. `@melhamy` → `melhamy` is already Latin, already
unique, and already what the owner is known by.

**Creating the channel also links it** (2026-09-07). The lookup button only fills in the form; it
establishes no relationship. Without this the flow was: paste the link, watch it say it fetched
something, create the channel, land on a different page, and paste the same link *again* before
anything was actually imported — two of those steps being the same step. `handleSubmit` now calls
`/youtube/attest` for a platform admin (who cannot put a token in someone else's description, which
is what attest is for) or `/youtube/verification` for anyone else, so the manage page opens on the
step that actually needs the user: one "ابدأ الاستيراد" button for an admin, the token for an owner.
**A failure there is non-fatal** — the channel exists and the panel can link it by hand; the one
thing that must not happen is losing the channel over a YouTube hiccup.

**A successful lookup is confirmed under the field, not only in a toast.** If every form field was
already filled, nothing visibly changes and a toast alone reads as "it did nothing" — which is
exactly how it was reported.

- **It lives in the overview tab, not a tab of its own.** A YouTube link is a property of the
  channel, like its name and colour; every other tab is a content *type*, and a source is not one.
  **Imported videos land in the videos tab beside uploaded ones** — that is the whole reason to
  import rather than link out, since an imported video can then join a series, be searched,
  bookmarked and resumed.
- **Three states in one panel, not a wizard**: not linked → linked but unverified → verified. The
  middle step sends the owner to another website to edit their channel description and back, and a
  wizard that loses its place while they are gone is worse than a page that shows where they got to.
- **The verification steps name the actual place.** "Add it to your channel description" assumed
  the owner knows that means YouTube Studio → Customisation → Basic info, which is three levels
  deep and not called "description" at the top level. There is now a numbered sequence, a deep link
  to that exact Studio page (built from the channel id we just resolved), an explicit "you can
  delete the code afterwards", and a note that YouTube's API lags a save by a minute — without
  which a correct attempt reads as a failure and people redo work they already did right.
- **The whole token row copies, not just the icon**, and the icon becomes a tick for a moment —
  the confirmation belongs where the click was, not only in a toast at the edge of the screen
  (`ShareButton` established that pattern). On a phone, tapping a twelve-character random string to
  select it by hand is the fiddliest gesture in this flow.
- **A clipboard refusal is no longer silent.** `navigator.clipboard` needs a secure context and can
  be refused by privacy settings; the catch used to swallow that, so the owner clicked and *nothing
  happened* with no hint to select the text themselves. It now selects the token for them, making
  the fallback one keystroke rather than a careful drag.
- **A failed verification check is not an error.** Almost always YouTube's API has not caught up
  with the owner's save yet, so the copy says "try again in a minute" rather than "failed" — and
  that message only appears *after* a check, never on first render, where it would be an
  accusation rather than a hint.
- **`ChannelManage` reacts to the import finishing**, watching the `RUNNING` → terminal
  transition (not the status alone, so it fires once rather than on every poll after). It toasts
  the outcome and invalidates `['channel-manage', slug]` and `['channel-series-manage', slug]` —
  the import wrote videos and series straight into the channel, and the lists were last
  invalidated when it *started*. Without this an import that added 1,926 videos left the videos
  tab showing none of them. **Nothing reaches an owner who navigated away**: the platform has no
  notification channel, deliberately, the same call the transcode pipeline makes.
- **The panel polls only while an import is `RUNNING`** (`refetchInterval` as a function of the
  data, not a constant). Nothing pushes progress from the server, and a finished import polls
  nothing.

### A channel awaiting review can import now — 2026-09-08

The backend used to require an **approved** channel for `/import` and both verification calls; it
now requires only that the channel is not REJECTED or SUSPENDED, so **a PENDING channel can import
and be reviewed on its content rather than on its name**. Nothing it imports is publicly visible —
the backend gates every public query on the channel being active — so what an owner gets is a
review copy on their own dashboard.

Two consequences for this repo: the panel's import button no longer 403s on a freshly created
channel, and the two refusals that remain arrive as `CHANNEL_REJECTED` / `CHANNEL_SUSPENDED` reason
codes with their own sentences in `errors.reasons` (see above). They are separate codes because
suspension lifts and rejection does not.

### `PARTIAL`, progress, and a button that said nothing when it failed — 2026-09-08

Three holes in the same panel, all of them invisible: each one looked exactly like a working page.

- **`PARTIAL` had no branch anywhere in this app**, and neither did `importTotalEstimate` — the
  backend has emitted both since the resumable import landed. A paused import fell through all four
  conditions, so the panel rendered the «الاستيراد» heading with **nothing under it and no button**:
  no way to continue, and no way to tell a pause from a broken page. It is not an edge case —
  a catalogue larger than the platform's shared daily YouTube quota reaches `PARTIAL` as a matter
  of course, several days running, so **the state that read as broken was the one that happens
  most**. Now: an amber "paused, press resume" line, the backend's own reason under it, and
  `importButtonLabel` giving «متابعة الاستيراد» rather than «أعد المحاولة» — the wrong one of those
  tells an owner their import broke when the quota simply ran out.
- **`importedVideos` is written per committed page, not once at the end**, so it climbs during a
  walk that can last hours. Nothing showed it. `importProgress` now renders «تم استيراد 25,000 من
  ~137,412 فيديو» while `RUNNING` **and** while `PARTIAL` — a pause that already brought in 25,000
  videos should say so, not only that it stopped. The "~" is deliberate: the denominator is
  YouTube's own `pageInfo.totalResults`, and it is null before the first page and once the import
  finishes, so the shape has to read correctly without it.
- **`startImport.mutate()` had no error handling at all** — no `onError`, and there is no global
  error interceptor (`api/client.js` handles only the 401 refresh). React Query captured the
  failure in `startImport.error` and **nothing rendered it**: the button re-enabled and the panel
  looked identical. Reported as "I press import and get a 403 that is not displayed at all". The
  reason now renders inline beside the button, not as a toast, because the button stays on screen
  and the reason should stay next to it.

`importButtonLabel` and `importProgress` are **exported pure functions with their own test**
(`__tests__/youtubeImportPanel.test.js`), the same shape as `VideoPlayer`'s `watchThreshold` — this
repo's tests are pure-function, with no jsdom. What they pin is precisely what is not visible in a
rendered page: that `PARTIAL` is not `FAILED`, and that `RUNNING`/`SUCCESS` get **no button at
all**, since a second walk of a large catalogue spends the whole platform's daily quota.
- **Starting an import invalidates `['channel-manage', slug]`** — the import writes videos and
  series into this channel, so the dashboard's own lists are stale the moment it finishes.
  Invalidated on *start* because nothing tells the client when that is; the poll is what notices.
- **`CreateChannel` collects the YouTube URL but does nothing with it.** It is stored on the
  channel; importing needs the owner to prove they control that channel first, which happens from
  the channel's settings once it exists. Backend: `Channel.youtubeSource`.
- The backend accepts a channel URL, an `@handle`, or a raw `UC…` id, and **the parsing is
  deliberately server-side** — a frontend regex would have to be kept in step with it, and a
  mismatch would reject a form the backend supports.
- `verifiedBy` is `OWNER` or `ADMIN` and the panel says which: "verified by the platform" and
  "verified by the channel's owner" are different claims to show a visitor.
- **The admin link button is hidden for non-admins**, not shown-and-rejected — the backend 403s
  anyone else, and offering an action that cannot succeed is worse than not offering it. It appears
  in both states an admin might use it from: before anything is linked, and after a link whose
  token will never appear because the admin does not control that description. When a channel is
  ADMIN-linked the panel says so *and* says what it does not license — importing and embedding yes,
  hosting the file no.

## `SourceBadge` (`components/content`)

Marks a video that plays from YouTube rather than from this platform, on cards (mark only, bottom
right — the one thumbnail corner not already taken by duration, the hidden badge, owner actions or
the progress bar) and on the detail page (mark plus the word, where there is room).

- **Driven by `sourceType`**, so it is self-maintaining in the direction that matters: when an
  owner uploads the original file `sourceType` flips `YOUTUBE` → `UPLOAD` and the badge disappears
  on its own.
- **Inline SVG, because lucide-react ships no brand marks** — the same reason `ShareButton` uses
  text pills rather than approximating WhatsApp and Telegram logos.
- **The mark is unmodified and unplated.** YouTube's brand guidelines allow it to identify YouTube
  content and forbid recolouring or distorting it, so legibility over an arbitrary thumbnail comes
  from a drop-shadow on the mark rather than a background box or a tint. Don't restyle it to fit a
  palette.

`VideoCard` also shows which **series** a video belongs to (`seriesTitle`, batch-attached on the
backend), as a link to the series page with `stopPropagation` so it doesn't also fire the card's
own navigation.

## Deleting a channel (`AdminChannels`)

`DELETE /api/channels/admin/{id}` is `PLATFORM_ADMIN`-only and had **no caller at all** until
2026-09-07 — the endpoint existed and nothing in the app could reach it.

**Guarded by typing the slug, not by a confirm dialog.** The delete cascades in SQL (backend
migration 013) through every video, book, article and post, and through the comments, bookmarks
and watch-history rows hanging off them — thousands for a channel that has imported a back
catalogue, none of it recoverable, with no Java running that could spare anything. A click-through
confirm is the wrong weight for that. The dialog also points at **suspend**, which is the
reversible option and usually the one actually wanted.

## Editing content (`components/channel/ContentEditModal`)

One editor for videos, books and articles; `type` decides which fields it renders (`content` and
`pages` are the only real divergences). Reached from a pencil on every row of `ContentManageList`.

- **Sends only what changed.** Every Update DTO on the backend merges rather than replaces, so an
  omitted field is left alone — sending the whole object would silently overwrite anything the form
  does not render, like a video's `seriesId`.
- **Re-seeded on `item.id`**, or the dialog would briefly show the previous item's values and a
  quick save would write them onto the new one.
- **Stays open on failure**, so a rejected save does not discard what the owner typed.
- For a video still sourced from YouTube it says the edit is local. An owner retitling an embedded
  video should not be left wondering whether they just renamed it on YouTube.

## Query caching (`lib/queryCache.js`)

Four named tiers — `NO_CACHE`, `LIVE`, `STANDARD`, `STATIC` — so "how long is this good for" is a
decision with a reason attached rather than a number copied from the query above it.

**The default used to be `staleTime: 10min` *and* `refetchOnMount: false`, which together mean
stale data is never refetched at all.** Navigating away and back showed exactly what you left, for
as long as the tab lived. Invisible on a small catalogue; on a large one it read as "the home page
is frozen". The default is `STANDARD` now (2 min, refetch on mount).

- **The feed is `NO_CACHE`.** Its discover section is randomised server-side precisely so a return
  visit shows something different; any caching makes that randomisation invisible.
- `STATIC` (1h) for the category list and the biography — refetching those per navigation is waste.
- **`refetchOnWindowFocus` stays off everywhere.** Reshuffling a page under someone who just tabbed
  back is disorienting in a way that refreshing on navigation is not.
- Watch the spread order: `{ ...STATIC, staleTime: X }` silently overrides the tier. Put the spread
  last, or don't add the literal.

**Clicking the wordmark on the home page refreshes it.** A plain `<Link to="/">` is a no-op when
the location is already `/` — React Router sees the same route and nothing remounts — so the one
gesture everybody uses to mean "give me the page again" did nothing. It now invalidates the feed
and scrolls to top, rather than doing a full reload to refresh a dozen cards.

## The cache knows whose data it holds — 2026-09-08 (F1)

**The security fix of this pass.** The cache had no notion of a viewer. `['watch-history']`,
`['bookmarks']`, `['my-channels']`, `['like-status', …]` and the owner-dashboard keys were keyed by
resource alone, and **nothing cleared them on logout** — so on a shared device the next person to
log in saw the previous person's progress bars, likes, bookmarks and owner controls until each
stale window ran out. Signed out, `useLikeStatus` kept serving `liked: true` from cache.

Two mechanisms, both needed:

- **`AuthContext` calls `queryClient.clear()`** in `logout` and in the `auth:session-expired`
  handler, and invalidates after `applySession`. That covers the sequential case.
- **`lib/queryKeys.js` carries the viewer's identity in every user-scoped key**, which covers a
  login with no logout in between and the anonymous → signed-in transition on a like button.

Three rules to keep, because each is load-bearing:

1. **The scope is the LAST segment, never the second.** Every existing prefix invalidation
   (`['bookmarks']`, `['channel-manage', slug]`, `['subscription-status', channelId]`) then keeps
   matching every viewer's copy unchanged. Only exact reads and writes — `setQueryData`,
   `getQueryData` — need the scope, and they are the sites that have it. A hand-built key passed
   to `invalidateQueries` is therefore *correct*, not an oversight.
2. **Public catalogue keys are deliberately not in the factory** (`['video', id]`,
   `['channel', slug]`, `['books', size]`). They are the same for everyone, and they are what a
   persisted cache would be allowed to keep across sessions.
3. **The scope comes from the token, not from `user`** (`useUserScope` → `userScopeOf`). `user` is
   `null` while the profile fetch is in flight on every page load, so keying on it would run each
   scoped query twice per load and briefly serve anonymous answers to a signed-in viewer. A token
   whose payload will not decode still yields a per-session scope rather than falling back to
   anonymous — falling back would be the leak this exists to close.

## Storage is always guarded (`lib/safeStorage.js`) — 2026-09-08 (F1)

Every `localStorage` read and write goes through `safeStorage` (try/catch, in-memory fallback):
`AuthContext`, `ThemeContext`, `client.js`, `beacon.js`, `uploadResume`. Unguarded access **throws**
when a browser blocks site data — Safari's Lock Down Mode, a private window with cookies blocked,
enterprise policy — and the throw happened at module scope, so the app rendered a blank page rather
than degrading. The in-memory fallback means a session works for the tab's lifetime and simply does
not survive a reload, which is the correct behaviour for a browser that has been told not to store
anything. Only test files use raw `localStorage`, on purpose.

## Errors say what happened (`lib/describeError.js`, `QueryState`) — 2026-09-08 (F1)

Every failed GET rendered the same «حدث خطأ» and every mutation toasted a fixed string, so being
offline, being rate-limited, asking for something deleted and a server fault all read identically —
and the backend's own Arabic 429 message, which the CORS filter ordering exists to make readable,
was shown in eight places and dropped everywhere else.

- `describeError(error, fallback)` returns one sentence: offline/timeout, the backend's own
  sentence on a 4xx that carries one, 404, 403, 5xx, else the caller's own wording. **Offline, and
  any 4xx the server explained itself, override the caller's fallback** because what to do next is
  different in those cases, which is the whole point of the sentence.

#### A refusal says why: `reason` codes — 2026-09-08

The layer above everything below it. «ليس لديك صلاحية لهذا الإجراء» on the import button was true
of nothing — the caller was the channel's owner and was authorised; the channel had not been
reviewed yet — and **no sentence keyed off a status can express that**, however well worded.

The backend now names the situation in a `reason` field (`CHANNEL_REJECTED`,
`YOUTUBE_NOT_VERIFIED`, …) and **this repo words it**, in `errors.reasons` in `ar.js`.
`reasonMessage` is consulted first in `describeError`, ahead of the server's own sentence and the
caller's fallback alike, because it is the only layer that can say *why* rather than restate the
status.

- **The backend sends codes, never Arabic.** Deliberate, and asked explicitly: every user-facing
  message it writes is English ("Channel slug already exists" is shown verbatim to Arabic readers
  wherever a caller renders it), and this app keeps ~600 strings in one catalog so a rewording is
  one edit and a second locale stays possible. Copy in Java would have fixed one screen and
  entrenched the split.
- **`tOptional`, not `t`** — the key comes from data, so an unknown code is an *expected* answer,
  not a typo: it returns undefined without warning and falls through to the generic sentence for
  that status. **That is what lets the two repos deploy separately**; drift costs a specific
  sentence, never a raw code or an English string on screen.
- **Read at every status, including 5xx**, unlike the raw-body fallback below. A code selects a
  sentence we wrote, so it cannot leak internals — and a 503 is exactly where «حدث خلل في الخادم»
  is least useful, since `YOUTUBE_NOT_CONFIGURED` is not a fault anyone should wait out.
- **Every sentence names the reason, then what to do about it**, in that order — and a refusal a
  user can do nothing about is worded differently from one that clears itself. «حاول لاحقاً» on the
  first kind is how people learn to ignore it.
- Codes are stable: a rename silently falls back, so add a new one rather than repurposing.
  `grep` the backend for `ActionNotAllowedException(` and the two-argument
  `InvalidRequestException(` for the full set.

#### The body is read on every 4xx now, and which key holds it is not obvious — 2026-09-08

Only 429 ever looked at a response body, so `403 {"error":"غير مصرح لك"}` — a sentence the backend
wrote for the reader — was discarded and «ليس لديك صلاحية لهذا الإجراء» shown instead. That was the
half that was missing. **The half that is easy to get wrong in the other direction is which key to
read**, because the backend uses `error` for two different things:

| Answered by | `error` | `message` |
|---|---|---|
| `GlobalExceptionHandler.buildResponse` | `"Forbidden"`, `"Not Found"` — the HTTP reason phrase | `"Access denied"`, `"Channel not found"` — internal detail |
| `EmailNotVerifiedException`, `RateLimitFilter` | `"Too many requests"` | **Arabic** |
| a controller's own `forbidden()` | **«غير مصرح لك»** | *absent* |

So neither key can simply be preferred: reading `error` first prints **"Forbidden"** at an Arabic
reader on every 403 the global handler answers, and reading `message` first and trusting it prints
"Access denied". What separates them is not the key but the **script** — this backend writes
everything meant for a person in Arabic and everything meant for a log in English. `serverMessage`
takes `message ?? error` and returns it **only if it contains an Arabic letter**, which fails safe
in both directions: an English body falls through to our own copy, and a body shape nobody
anticipated cannot put internals on the screen. **Never extended to 5xx** — there the server knows
only that it broke. Pinned by `__tests__/describeError.test.js`, whose English-body cases exist to
catch the "just prefer `error`" fix, which looks correct in review because the body really is being
used.
- `QueryState` takes `error` and `onRetry` and renders a retry action by default. **Every list
  page passes its `refetch`**; the detail pages deliberately pass an explicit `errorAction`
  («back home») instead, because their commonest error is a 404 for an item that is gone or not
  visible to this viewer, and offering "retry" there invites the reader to press it forever. An
  explicit `errorAction` wins over the default. Sites that use `QueryState` only for its
  loading/empty branches (the two admin pages, the dashboard) need neither.
- The query client's `retry` predicate is `shouldRetryQuery` (`App.jsx`): **no 4xx is retried**,
  so a 404 detail page renders immediately instead of sitting through a request, a backoff and a
  second request. **429 is in the not-retried set even though it is transient** — the backend's
  limiter is per-IP and per-rule, so an automatic retry spends the next token of the same bucket
  and makes the situation worse; `describeError` tells the user to wait instead. `isRetryable` in
  `describeError.js` is a *different* judgement — whether to offer the user a retry button — and
  it does include 429, because a person waiting a moment and clicking is exactly right.

## Deploy: cache headers and the chunk graph — 2026-09-08 (F1)

**The host must serve `index.html` with `no-cache` and `/assets/*` as `immutable`.** Asset
filenames are content-hashed, so they are safe to cache forever; `index.html` is the only file that
names them, and a cached copy of it points at chunks that no longer exist. That is a blank page
after every deploy, for exactly as long as the stale HTML lives.

`vite:preloadError` is the belt to that braces: a lazily-loaded route chunk that 404s after a
deploy triggers **one** reload, guarded by a `sessionStorage` flag through `safeStorage` so a
genuinely broken chunk cannot become a reload loop.

**`manualChunks` is a function matching resolved module paths, not the object form.** The object
form (`{'vendor-react': ['react', 'react-dom']}`) matches the module id `react` exactly, and
nothing imports that: React 18's automatic JSX runtime imports `react/jsx-runtime` and the app
imports `react-dom/client`. So `vendor-react` built **empty** — Rollup printed "Generated an empty
chunk" — while React was absorbed into whichever chunk reached it first, leaving `vendor-router` at
181 kB. Now 143 kB in `vendor-react` and 39 kB in `vendor-router`. **Verify a chunking change
against `npm run build`'s chunk list**, never against the config looking plausible.

## Numbers shown to readers (`lib/numbers.js`) — 2026-09-08 (F1)

`formatCount` everywhere, Latin digits. The app had two digit systems on one card:
`toLocaleString('ar')` gave Arabic-Indic digits (١٢٣) for view/comment/like counts while every date
(`lib/dayjsAr.js`, deliberately), «{count} صفحة», the subscriber count, «الجزء 3 من 99» and the
result count used Latin. Latin was already the recorded decision for dates; this makes the counts
agree, in one place, so the next count cannot re-open the question by copying whichever call site
it sits next to. `null`/non-numeric renders as `''`, never `NaN`.

## Linting (`eslint.config.js`) — 2026-09-08 (F1)

There was no linter at all, in plain JavaScript with no type system. `npm run lint`, and it must
stay at **zero errors**.

- **`react-hooks/exhaustive-deps` is an error, not a warning** — a stale closure renders
  correct-looking output from values captured several renders ago, which no test that mounts a
  component once will catch. Where a dependency genuinely must not be there, the call site carries
  an `eslint-disable-next-line` **saying why**; there are four, each a mount-only effect or one
  keyed on a transition on purpose. `reportUnusedDisableDirectives` is on, so a disable left behind
  after the code moved is itself an error.
- **`eslint-plugin-react` is installed for exactly one rule, `react/jsx-uses-vars`.** None of its
  stylistic set is on. That rule is not style: it is what tells `no-unused-vars` a name referenced
  in JSX is used. Without it every component imported to be rendered read as unused — 300 false
  errors, and a linter that is 95% noise is one nobody runs, so `exhaustive-deps` would have been
  lost inside it.
- The six remaining `react-refresh/only-export-components` **warnings are deliberate**: those files
  export a pure helper beside the component precisely so it can be tested without a DOM
  (`shouldShowNoMatches`, `watchThreshold`, `shouldRetryQuery`).

## Back navigation from a video

`VideoDetail`'s back button was a hardcoded link to the home page, so arriving from a series — or a
search, or a channel — and pressing it dumped you on the home page instead of back into the list
you were working through. On a 99-video series that is the difference between watching a course and
re-finding your place after every episode.

It uses `navigate(-1)` now, gated on `window.history.state?.idx > 0` — React Router's own cursor
into session history, which is zero for a deep link opened in a fresh tab. In that case it falls
back to home **and the label says so**, because a button reading "back" that goes somewhere you
have never been is worse than one that admits where it is taking you.

## Dates shown to readers (`lib/dayjsAr.js`)

`displayDate(item)` = `originalPublishDate || publishDate`, and every card and detail page uses it.
`publishDate` means "when this landed on the platform" — right for the backend to sort on, wrong to
show a reader. A YouTube import stamps a whole back catalogue with one day, so nineteen years of
lectures all read «منذ ١٩ ساعة». `PostCard` is the deliberate exception: `Post` has no
`originalPublishDate`.

`formatPublishDate` now sets the locale on **both** branches. Only the relative one did, so
anything older than a week fell through to dayjs's default and printed its month in English inside
an otherwise Arabic card — invisible while the catalogue was days old, universal the moment content
was imported.

## `LinkifiedText` (`components/ui`)

Renders user-authored text with bare URLs as links — YouTube descriptions are largely links, and
importing them as plain text throws that away. **Never `dangerouslySetInnerHTML`**: the text is
untrusted, so it is split on a URL pattern and the pieces are rendered as React children, which
makes injection impossible by construction rather than by sanitising. Each candidate still passes
`safeExternalUrl`, and links get `dir="ltr"` so bidi does not scramble a URL inside Arabic prose.

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

Replaces `Navbar.jsx`'s old inline `<form>` — shows suggestions on focus (before typing, via a blank-`q` request), narrows them as the user types, backed by `GET /api/search/suggestions` (see backend `CLAUDE.md`'s own "Search" section, including word-by-word matching and the `pg_trgm` close-match fallback for typos).

**The dropdown is a preview of what pressing Enter will show, and that is now guaranteed on the backend** (2026-09-08): the suggestions endpoint and `GET /api/search` run the same query and the same typo fallback. Until then only the dropdown had the fallback, so it offered eight videos for a query — a typo, reversed word order, a dropped `ال`, a doubled space — that `SearchPage` then answered with *"لا توجد نتائج"*. Nothing here compensated for it and nothing here should: if the two ever diverge again it is a backend bug, not something to paper over in `SearchBar`.

- `hooks/useSearchSuggestions(rawQuery, limit, enabled)` (in `useVideos.js`) debounces `rawQuery` itself via `hooks/useDebouncedValue.js` (200ms) rather than debouncing the request — the debounced value becomes the `queryKey`, so React Query's own cache handles "retype something already seen" for free, no separate cache needed. The queryFn passes React Query's `signal` through to axios so a superseded in-flight request (a fast typist moving past `"qur"` before it resolves) gets cancelled instead of racing back and clobbering a newer result.
- **Text-only suggestion rows, deliberately no thumbnails**: an earlier version showed a small thumbnail per row (by analogy to the app's YouTube-style browsing elsewhere), but real YouTube's own search-suggestion dropdown is text-only — thumbnails only appear once you're on the actual results grid. Reverted to text + a small search icon per row: no extra per-row image request, no broken-image/layout-shift edge cases in a compact dropdown, faster to scan.
- **Distinguishes "no matches" from "request failed"**: `shouldShowNoMatches` (exported from `SearchBar.jsx` so the condition itself is testable — `__tests__/searchBarNoMatches.test.js`) is `true` only once a fetch for the current (non-blank) query has actually settled successfully with zero results — gated on `!isFetching && !isError`, so a debounce-triggered refetch never flashes "no results" before the real one lands, and a genuine network error never gets mislabeled as "nothing matches" (mirrors the same distinction `SearchPage.jsx` already made between its `isError` and empty-`results` branches).
- **…and from "no answer about this text yet"** (2026-09-08). `!isFetching` is not enough on its own: the query is debounced by 200ms and `isFetching` is `false` for that whole window, so mid-typing the dropdown claimed *"لا توجد نتائج مطابقة لـ «X»"* about the text now in the box on the strength of a search for what was there two keystrokes ago — most visibly when the earlier query had no matches and the current one does. `useSearchSuggestions` now also returns **`settledQuery`**, the query its data actually answers, and both the condition and the quoted message use it; unless it equals the trimmed input, nothing is known about the input yet. Any future "did you mean" or result-count line in this dropdown has the same duty.
- `hooks/useOutsideClick.js` closes the dropdown on an outside click; suggestion rows use `onMouseDown` (fires before both this listener and the input's own blur) so a click still registers as a selection rather than the dropdown just closing out from under it.
- Keyboard: ArrowUp/ArrowDown move a `highlightIndex` through the suggestion list, Enter selects the highlighted suggestion (or submits the typed text as a full search if nothing's highlighted), Escape closes the dropdown.
- Clicking a suggestion navigates straight to `/video/{id}`; submitting the form (or Enter with nothing highlighted) navigates to `/search?q=...` same as before.

## Password reset & change password

- `src/pages/ForgotPassword.jsx` (`/forgot-password`, public) and `src/pages/ResetPassword.jsx` (`/reset-password?token=...`, public) mirror `VerifyEmail.jsx`'s status-state pattern (form → success/error). `ForgotPassword` always renders the same success state after a successful request — the backend's response is deliberately identical whether or not the email is registered (see backend `CLAUDE.md`), so there's no separate "email not found" branch to build.
- `lib/api/auth.js` exports `forgotPassword(email)`, `resetPassword(token, newPassword)`, `changePassword(currentPassword, newPassword)`. All three are called directly, the same way `VerifyEmail.jsx` calls `verifyEmail`, rather than being wrapped by `AuthContext` — but `changePassword` is **not** token-neutral the way the other two are: its response carries a replacement `{token, refreshToken}` pair (the backend's `tokenVersion` bump invalidates the one this session is holding), and its caller has to hand that to `AuthContext`'s `applySession` or it logs itself out. See the change-password entry in `HISTORY.md`.
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
  still fetch on mount: opening one *is* the intent. Fixed 2026-09-05, see `HISTORY.md`.
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

Four things that are load-bearing:

- **Every network call retries, and the classification is the point** (`withRetry`, added
  2026-09-05). A 1,280-part upload makes 1,280 independent requests over a connection that only
  has to blink once, so 408/425/429/5xx and status-less transport failures (`fetch` rejects with
  a `TypeError`) get four attempts with jittered exponential backoff — applied per part, and
  around the reissue call, which is where the backend's own rate limit produces a 429. A **403 is
  never *re-sent*** — it means the presigned URL is dead, and the same bytes to the same dead
  signature can never work — but as of 2026-09-06 it is **re-signed once and then retried**
  (`uploadParts`' `resign` callback, one part at a time through the same `reissue-parts` endpoint).
  A window is 50 parts, 400 MB, signed for one hour, so finishing one inside its signatures'
  lifetime needs roughly 0.9 Mbit/s sustained; below that the URLs died mid-window and the whole
  upload failed with everything already transferred discarded. A *second* 403 on a freshly signed
  URL is not an expiry — it is a permission or configuration problem — and is surfaced rather than
  re-signed in a loop. Cancellation is likewise never retried: `sleep` wakes on the abort signal
  instead of sitting out a backoff someone already cancelled.
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

Added 2026-09-04; broadened 2026-09-05, 2026-09-07 and twice on 2026-09-08. `npm test`
(`vitest run`) / `npm run test:watch`. **163 tests across 15 files**, all in the node environment
— there is still no jsdom, on purpose.
`uploadResume` supplies its own `globalThis.localStorage` for the same reason, which is also why
the module reads storage through `globalThis.localStorage?.` inside a `try` rather than assuming
a DOM: privacy modes throw outright, and "no resume offered" is the correct answer there.

| File | Covers |
|---|---|
| `hooks/__tests__/usePresignedUpload.test.js` | byte-range arithmetic incl. the short final part, resume diffing with out-of-order gaps, batching, the concurrency cap, error propagation; and the retry rules — what is retried (429/5xx, a status-less transport failure) versus what must not be (a 403 dead signature, a cancellation), that a retried part counts its bytes once, that `sleep` wakes on abort, and that `ALLOWED_EXTENSIONS` still mirrors the backend |
| `lib/__tests__/validation.test.js` | username/password rules **as mirrors of the backend's** — most importantly the 72-**byte** BCrypt ceiling measured with `TextEncoder`, which no character-count check can express |
| `lib/__tests__/media.test.js` | `safeExternalUrl` as a scheme *allowlist* (`javascript:` in every spelling, scheme-less values, tab/newline smuggling), `resolveMediaUrl` returning null for a bare object key, YouTube id extraction rejecting lookalike hosts |
| `lib/__tests__/uploadResume.test.js` | what may be resumed: same channel *and* kind, same name *and* size, the 7-day bound matching the backend's sweep, and storage that throws or is absent |
| `i18n/__tests__/i18n.test.js` | `t`'s lookup, interpolation and miss behaviour, `tOptional`'s silence — and the one that earns its keep: a walk over the whole source asserting **every literal `t('...')` key resolves**, since a mistyped key renders as dotted ASCII rather than throwing. It also asserts it found 200+ call sites, so the regex can't rot into a vacuous pass |
| `hooks/__tests__/useChannelContentTab.test.js` | that a timed-out publish reads as "still working" for `videos`/`books` and as a failure for `articles`/`posts` — the create call is idempotent on an upload session and not otherwise, so the wrong wording either sends someone to re-upload gigabytes or invites a duplicate post |
| `lib/__tests__/user.test.js` | the three permission helpers, incl. every null/loading case |
| `lib/api/__tests__/client.test.js` | the 401-refresh interceptor: one shared in-flight refresh for parallel 401s, single retry, `auth:session-expired` on each dead end, auth endpoints excluded |
| `lib/api/__tests__/beacon.test.js` | the unload flush: no token → no request, `keepalive` set, both sync and async failures swallowed |
| `hooks/__tests__/useChannels.test.js` | `contentCreateConfig`: only a payload carrying an `uploadSessionId` gets the long confirm timeout, everything else stays on the client default |
| `lib/__tests__/dayjsAr.test.js` | the two date functions the YouTube import broke, added 2026-09-08. `formatPublishDate`'s absolute branch carried no locale, so anything older than a week printed its month in English — "17 June 2007" mid-Arabic-card — which was invisible until a back catalogue arrived and made *every* card take that branch; asserted against the whole string, since an English month is a substring failure rather than a missing one. Plus that Latin digits survive (dayjs's own `ar` postformats to ١٢٣), the empty-not-"Invalid Date" cases, and `displayDate` preferring `originalPublishDate` — without which nineteen years of lectures all read "منذ ١٩ ساعة" |

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

## Subscribing / unsubscribing (`components/content/SubscribeButton.jsx`) — 2026-09-08

**Unsubscribing was never missing — the affordance was.** `DELETE /channels/{id}/subscribe` has
always been wired, in two places: the `/subscriptions` page's explicit "إلغاء" button, and
`ChannelPage`'s subscribe button, which is a toggle. But the subscribed state rendered as
`✓ مشترك` with no hover or focus treatment, so it read as a *status* rather than a control and
people concluded there was no way out.

- **One `SubscribeButton` now serves both places it appears**, because defining the affordance
  twice would mean fixing it twice. `variant="banner"` is `ChannelPage`'s white-on-primary
  treatment; `inline` is the ordinary pill.
- **While subscribed, hover *and keyboard focus* swap the label to "إلغاء الاشتراك" with an ✕.**
  Done with `group-hover`/`group-focus-visible` utilities toggling two hidden spans, not React
  state — no re-render, and keyboard focus works for free.
- **`aria-label` always names the action, never the state** (`إلغاء الاشتراك` while subscribed): a
  screen-reader user gets no hover to reveal it. `aria-pressed` carries the state instead.
- **`VideoDetail` gained the control too.** Following a channel previously required opening its
  page — the only place the button existed. `ChannelPage` still reads `useSubscriptionStatus`
  itself for the subscriber count in its header; that is the same cached query the button uses, so
  it is not a second request.

## Likes (`hooks/useLikes.js`, `components/content/LikeButton.jsx`) — 2026-09-08

Backed by the backend's `content/like` package. `<LikeButton type="video"|"book"|"article" id={...}
initialCount={...} />` sits beside `BookmarkButton` in all three detail-page headers.

- **The count renders for everyone; only the action needs a login.** `useLikeStatus` is *not*
  gated on `!!token` (unlike `useBookmarkStatus`, which is): the backend's status endpoint is
  public and returns `{liked: false, likeCount: N}` for an anonymous caller. Hiding the button
  when logged out would hide the count, which is the part a visitor came for. An anonymous press
  routes to `/login`.
- **The count is updated optimistically, with rollback** (`onMutate`/`onError`). The number is
  directly beside the control that changes it, so a press that does nothing visible for a round
  trip reads as broken, and invalidate-and-refetch shows a stale count for the same window. The
  arithmetic is a pure exported `nextLikeState`, tested in `useLikes.test.js` — the clamp is the
  part worth pinning: before the status query resolves there is no cached count, and unclamped
  the first press on an uncached item renders "-1 إعجاب".
- **`VideoCard` shows the count read-only, from `VideoDTO.likeCount`** — not a toggle. The DTO
  carries the public count but no per-viewer `liked`, and giving each card its own status request
  would be one request per card on every feed page. `initialCount` on the detail page is that same
  DTO value, so the number does not flash 0 while the status query resolves.

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

- `VideoPlayer.jsx`'s minimum-watch gate: a very short play never creates/bumps a watch-history row — otherwise an accidental click-and-immediately-back-out would count as "watched" and could push a genuinely-watched video out of the backend's per-user 200-row cap (see backend `CLAUDE.md`'s watch-history section). The floor is **duration-aware** (`watchThreshold(durationSeconds)`), not the flat `MIN_WATCH_SECONDS` (5s) it started as: `min(5s, max(1s, 10% of duration))`, falling back to the flat 5s whenever the player doesn't know the duration yet (non-finite/zero — an unloaded source or a live stream). 5s is right for a 45-minute lecture and wrong for a 13-second clip, where it silently swallowed the first 38% of the video — see the watch-history entry in `HISTORY.md`. Duration comes from the native element's `onLoadedMetadata` or the YouTube player's `getDuration()` on its first state change, held in `durationRef`; all four report paths (throttled `onTimeUpdate`, pause/ended, unmount flush, `pagehide` flush, both native and YouTube) share the one helper.
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

- The Navbar's "رفع" (Upload) link (see "Navbar upload link" in `HISTORY.md`) now routes to the viewer's own channel-manage page rather than the old unrouted `/upload`. There used to be 5 unrouted admin CMS tab components under `components/admin/` meant to eventually back a dedicated upload page; they were deleted 2026-09-01 (dead code, fully duplicated by `ChannelManage.jsx`) rather than wired up. If per-type CMS tabs come back, build them into `ChannelManage`, not as a second implementation.

## Backend contract

`absarna-backend` is a separate repo with its own `CLAUDE.md` (plus `DESIGN.md` for the
upload/playback pipeline and `HISTORY.md` for closed findings). Neither repo's docs describe the
other's internals — what belongs here is only what this app *relies on*, so a backend change that
would break it is visible before it ships. The mirror of this list lives there under "Frontend
contract".

- **Confirm is idempotent on `uploadSessionId`.** This is what lets the 5-minute confirm timeout
  report "still working, try again shortly" instead of a failure: pressing publish again returns
  the row the first attempt created. The blanket 30s axios timeout used to abort while the backend
  went on to assemble a multi-GB object and create the row, reporting failure for a publish that
  had succeeded (Review 5, C5). Keep the override scoped to payloads carrying an
  `uploadSessionId` — the global timeout exists so ordinary reads fail fast.
- **`read-url`'s value is passed through `safeExternalUrl` in `useBookReadUrl`.** For a book with
  no uploaded master the backend falls back to the stored `pdfUrl`, and every caller renders it as
  something the browser navigates to (an `href`, a `location.replace`, `<Document file>`). The
  backend checks it on the way out too, but the guard belongs where the consequence is — the same
  reason `sourceUrl` has always gone through it. Anything not absolute http(s) becomes null, and
  the callers already render their no-file state for that.
- **`playback-url` / `read-url` are the only source of a *playable* media URL**, and they answer
  **404, not 403**, when refused. `VideoDTO.sourceUrl` is **null** for an upload-backed video, so
  render a placeholder rather than treating null as an error. Never construct a bucket URL here;
  that seam is what keeps a future CDN a backend change.
- **`VideoDTO.thumbnailUrl` is populated again as of 2026-09-06** — it carries a presigned URL
  once the transcode worker has produced a poster frame, and the backend caches it for an hour so
  it is byte-identical between calls and the browser can cache the image. It is still **null**
  while a video is transcoding and for any video with no poster, so `VideoCard`'s placeholder path
  stays load-bearing; treat null as "not yet", never as an error. Object keys still never appear
  on a DTO.
- **`playback-url` returns `{url, quality, qualities}` and takes an optional `?quality=`.**
  `qualities` is the rendition ladder's names (`1080p`/`720p`/`480p`, plus **`audio`** for any
  source with sound — whatever the worker produced) — names only, never object keys — and
  `quality` is the rung actually served,
  which is *not* necessarily the one asked for: with no parameter the backend picks the default
  rung, and the player has no other way to learn which. An unknown quality is a 404, deliberately,
  rather than a silent downgrade. Two consequences for the player, both in `VideoPlayer`:
  swapping a `<video>` source always restarts from zero, so the playhead and play/pause state
  must be carried across a quality switch by hand; and the query needs
  `placeholderData: keepPreviousData`, or the hook goes undefined mid-switch, the element
  unmounts, and the position is gone before the seek can be applied.
- **`audio` is a rung like any other, and is never the default.** The worker added an audio-only
  rung on 2026-09-07 (AAC 64 kbit/s mono, ~a twentieth of 480p) for a lecture audience on mobile
  data. Nothing about the API changed: it arrives in `qualities` and `?quality=audio` serves it.
  Two things on this side — the selector labels it from the catalog
  (`video.qualityLabels.audio` → «صوت فقط»; every other rung name is an identifier, not a word, and
  renders as itself via `tOptional`), and it always sorts last, because the backend orders the
  ladder by height `NULLS LAST` and this rung has none. A player that asks for no quality never
  lands on it.
- **Resume is `list-parts` → diff → `reissue-parts`.** Object storage is the source of truth, so
  persist only the session id (never progress), keyed per channel *and* kind. Persist it **before
  the first byte goes out** — an upload interrupted at 3% is exactly the case resume must serve.
  Require name *and* size to match and re-derive the part count from the picked file: a resume
  uploads only the missing byte ranges, so filling one upload's gaps from a different file of
  equal length assembles a corrupt object nothing downstream would catch.
- **`DELETE .../upload-url/{sessionId}` releases the per-channel quota slot.** Call it when the
  user declines a resume offer. The quota counts open sessions (5 per channel), so silently
  abandoning them is how someone restarts three uploads by hand and then hits "finish or cancel
  one". A session that was swept, cancelled or published raises `ResumeUnavailableError` — fall
  through to an ordinary upload; "the resume did not apply" is not a failure worth reporting.
- **Uploads are always multipart**, `{ext}` is allowlisted (`mp4`/`mov`/`pdf`), and **the backend
  derives `contentType` from that extension** — `file.type` is accepted and ignored, because
  browsers commonly leave it empty for `.mov`/`.m4v` and `application/octet-stream` used to 400
  a perfectly valid file (Review 5, C7).
- **Rate limits are per client IP and per rule**, not per URL. The limiter runs after the
  backend's CORS filter, so a 429 body is genuinely readable from here rather than surfacing as an
  opaque network error. Since 2026-09-05 the backend keys
  buckets on the matched rule, so hitting the same rule from many different paths shares one
  bucket: general API reads are 300/min and writes 60/min across the whole app, with tighter
  per-rule limits on login (5/min), register (3/min), comments (10/min) and password reset
  (3/hour). Part reissue is 60/min, deliberately generous — it is a step inside one upload. A 429
  body is `{error, message}`, the `message` half user-facing Arabic.
- **An uploaded video is not immediately visible, not merely un-transcoded.** `status` is
  `UPLOADED` until the transcode worker reports back, and every public listing query gates on
  `READY` — so until then the video is absent from the feed, from search and from its channel's
  public page, not just missing a quality selector. The owner still sees it on their own dashboard,
  which is the only surface that shows it. There is **no notification channel by design** — no SSE,
  no WebSocket, no polling loop — so re-fetch `GET /videos/{id}` when the user comes back, and never
  imply a quick turnaround: a long lecture is measured in hours.

## Build / verify

```
npm run dev      # localhost:5173
npm run build    # ALWAYS run before trusting a session's changes
```
`npm run build` (Rollup) does full static import/export resolution and will catch things `npm run dev` (esbuild, lazy) won't — e.g. an imported named export that doesn't actually exist in the package. This exact class of bug (a `lucide-react` icon that didn't exist in the installed version) once broke the entire app with a blank white screen on every page. `App.jsx` lazy-loads every route now, so a bad import in one page is confined to that page's chunk rather than the whole module graph — but the failure mode simply moved: the chunk fails to load at navigation time, which is what the `vite:preloadError` handler below exists for. Either way `npm run build` catches it in ~2s and a dev-mode HMR log won't, so **run the build before trusting a session's changes** remains the rule.

Backend must be running (see its own `CLAUDE.md`) on `localhost:8080` for the app to have real data — `VITE_API_BASE_URL` env var overrides this if needed.

### Content-Security-Policy (`vite.config.js`, added 2026-09-06)

`vite.config.js` injects a CSP meta tag into `index.html` at build time. A meta tag rather than a
header because the SPA is static files — there is no server of ours in the request path, and the
backend's own CSP rides on API responses only, never on this document.

- **The inline theme script is hashed, not `'unsafe-inline'`-allowed.** The hash is computed from
  the file actually being served, so it cannot drift when that script is edited — a hash pasted
  into the HTML by hand is wrong the first time someone changes a character of it. **This is why
  adding a second inline `<script>` to `index.html` needs no action**, and why moving the theme
  script to a separate file would need the policy revisited.
- **`img-src` names every remote image host the app can end up rendering**, and that list is not
  obvious from the code: `img.youtube.com`/`i.ytimg.com` are video posters derived from a YouTube
  id, and `yt3.ggpht.com`/`yt3.googleusercontent.com` are **channel avatars** —
  `POST /api/youtube/resolve` prefills a new channel's `logoUrl` with one and it is then hotlinked
  on every card, detail page and channel header. The yt3 hosts were missing until 2026-09-08, so a
  YouTube-prefilled logo rendered fine in review and broke in production; a host that only reaches
  the page through data typed by a user is exactly the one this list forgets.
- **`frame-ancestors` is inert in a meta tag** and is kept only as documentation of intent —
  browsers ignore it (along with `sandbox` and `report-uri`) when the policy is delivered this way.
  Real clickjacking protection for the SPA has to come from an `X-Frame-Options` or
  `Content-Security-Policy` **header** on whatever serves these static files.
- **`style-src` keeps `'unsafe-inline'`**, deliberately: react-pdf's text and annotation layers
  position every span with a generated style rule and there is no hash-based way to express that.
  Inline style cannot execute, so it is the one concession.
- **Two env vars are read at build time and baked into the policy**: `VITE_API_BASE_URL` and
  **`VITE_STORAGE_ORIGIN`** (see `.env.example`). In dev both fall back to the compose stack
  (`localhost:8080` / `localhost:9000`), so `npm run dev` needs no `.env` — the policy applies in
  dev exactly as in a build, so without that fallback it would block MinIO on every machine. **A
  production build does not guess**: leaving `VITE_STORAGE_ORIGIN` unset there builds an app that
  renders fine and then **cannot play a video or open a book** — `connect-src`/`media-src`/`img-src`
  will not include the bucket host and the browser blocks the request as a CSP violation, nowhere
  near the missing variable. The build warns loudly; do not ignore it.

---

# Open items

Only what is still outstanding. Closed findings and the reasoning behind them are in `HISTORY.md`;
delete an entry here when it is fixed rather than striking it through.

## Bugs

Nothing outstanding. Review 4 (2026-09-05) closed all six of its findings across both repos —
abandoned-upload lockout, per-part retry, the 429 mid-upload, `contentType`, the `accept`
allowlist, and resume progress. Three of them were fixed differently from what the finding
proposed, which is worth knowing before re-applying the original suggestion: see "Review 4" in
`HISTORY.md`.

## UX

- **Comment reporting.** Author-only edit/delete exist; a reader has no way to flag someone
  else's comment. Blocked on a backend endpoint.
- **A wedged YouTube import used to have no way out of the panel.** The backend now fails a
  `RUNNING` record left behind by a restart, so the panel falls through to its FAILED branch and
  its retry button. If `importStatus` ever gains a third stuck state, the 5-second poll in
  `useChannelYouTube` needs a matching escape — it currently polls `RUNNING` forever.

## Feature ideas

Matching the backend's list; these follow the "surface useful content, don't optimise for
time-on-site" principle rather than fighting it.

- **Offline/PWA for downloaded books and articles** — useful for an audience with intermittent
  connectivity, and it needs no engagement machinery.
- **Transcript view alongside the player** (needs the backend transcript work), with
  click-to-seek. The biggest accessibility and skimmability win available.
- **A "من القنوات التي تتابعها" digest page** — an explicit list of what is new since your last
  visit, which you can clear, instead of an implicit ranked feed.
- **Per-page notes/highlights on `PdfReader`**, keyed to the existing reading history. The rest of
  that idea (search, TOC, page-jump) shipped.
- **A per-channel takeout/export view** for the backend export idea — an owner downloads
  everything they have published.
- **Series completion state on `ChannelPage`'s سلاسل tab** — "4 of 11" per card, from the data
  `VideoDetail`'s previous/next block already computes.
