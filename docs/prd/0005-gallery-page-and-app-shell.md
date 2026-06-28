# Gallery page + screen-switching shell (AppShell)

GitHub issue: https://github.com/nanarv/kinsco-create/issues/5

## Problem Statement

A player who submits a Cookie has nowhere to actually see it — `submitCookie` and `fetchCookies` exist and are tested, but no screen renders the Gallery, and there's no way to move between the build flow and it. Per ADR 0004, the app deliberately has no router, so without a screen-switching shell there's also no mechanism at all for showing more than one screen.

## Solution

A top-level `AppShell` holds which screen is currently showing (`'build'` or `'gallery'`, per ADR 0004) and renders the build flow or the Gallery accordingly. A player can navigate to the Gallery manually at any time (a "View Gallery" link) or land there automatically after a successful Cookie submission (per the build-flow UI PRD, issue #4), and can navigate back to the build flow from the Gallery. The `GalleryPage` itself fetches all Cookies, shows a loading state, then either an error-with-retry state, an empty state, or a grid of `CookieRenderer` instances ordered newest-first.

## User Stories

1. As a player, I want a "View Gallery" link visible while I'm building my Cookie, so that I can check out the Gallery without having to finish and submit first.
2. As a player, I want a "Back to building" link visible while I'm viewing the Gallery, so that I can return to my in-progress Cookie.
3. As a player, after I successfully submit my Cookie, I want to land on the Gallery automatically, so that I immediately see my Cookie among everyone else's (per issue #4).
4. As a player, while the Gallery is loading, I want to see a loading indicator, so that I know the page is working rather than broken.
5. As a player, if the Gallery fails to load (e.g. a network error), I want to see an error message and a way to try again, so that a transient failure doesn't strand me on a broken-looking page.
6. As a player, if no Cookies have been submitted yet, I want to see an empty-state message rather than a blank grid, so that I understand there's nothing there yet rather than thinking something's broken.
7. As a player, I want to see every submitted Cookie in the Gallery, ordered with the most recently submitted first, so that I can see what's new.
8. As a player, I want each Cookie in the Gallery to look the same as it did while I was building it, so that the Gallery accurately reflects what everyone made (via `CookieRenderer`, issue #2).
9. As a player, I want the Gallery to show Cookies even if the placeholder art has since been replaced with real art, automatically reflecting whatever Icons currently exist, so that I never see a stale or broken rendering (per ADR 0002).
10. As a developer, I want the screen-switching mechanism (`AppShell`) to be a single, simple piece of state rather than a routing library, so that adding the Gallery doesn't introduce URL/history concerns the app doesn't need (per ADR 0004).
11. As a developer, I want the Gallery's "newest first" ordering to be a small pure function separate from the fetching/rendering component, so that the ordering logic is testable without rendering anything.
12. As a developer, I want `GalleryPage`'s data-fetching to be swappable in tests, so that I can test loading/error/empty/populated states deterministically without hitting Supabase.

## Implementation Decisions

- **`AppShell`** (new, top-level component): holds `screen: 'build' | 'gallery'` state (defaulting to `'build'`) and renders either the build flow or `GalleryPage` based on it, per ADR 0004. Provides a way to switch screens that's used by: a manual "View Gallery" link shown during the build flow, a manual "Back to building" link shown on the Gallery, and the build flow's own success path (issue #4) switching to `'gallery'` after a successful `submitCookie` call.
- **`GalleryPage`** (new component): `({ fetchCookies = defaultFetchCookies }: { fetchCookies?: () => Promise<Cookie[]> })`, defaulting to the real `fetchCookies` from issue #2's repository module. On mount, calls `fetchCookies()` and tracks a loading/error/success state. While loading, shows a loading indicator. On error, shows an error message with a "try again" action that re-triggers the fetch. On success with zero Cookies, shows an empty-state message. On success with one or more Cookies, renders a grid of `CookieRenderer` instances (issue #2), one per Cookie.
- **`sortCookiesByMostRecent`** (new, pure function): `(cookies: Cookie[]) => Cookie[]`, returning a new array ordered by `createdAt` descending. `GalleryPage` calls this on the fetched list before rendering. Kept separate from `GalleryPage` so the ordering logic is testable without rendering.
- **No pagination**: all Cookies returned by `fetchCookies` are loaded and rendered at once for this v1, consistent with the expected small-to-moderate volume from pop-up events. Pagination/infinite scroll is an explicit future follow-up if volume grows.
- **No realtime updates**: the Gallery fetches once on mount; it does not subscribe to live updates if another player submits while it's open. A player would need to navigate away and back (or use "try again") to see newly submitted Cookies.
- **Grid layout**: mobile-first single-column-or-grid layout consistent with the rest of the app's existing mobile-first direction; no new layout decision beyond what's already established for the build flow.

## Testing Decisions

- A good test for `sortCookiesByMostRecent` passes a list of Cookies with out-of-order `createdAt` values and asserts the returned order — pure input/output, no rendering involved.
- A good test for `GalleryPage` passes a fake `fetchCookies` function (resolving, rejecting, or resolving with an empty array) and asserts the resulting rendered state: loading indicator first, then either the error message + retry control, the empty-state message, or a `CookieRenderer` per Cookie in the expected order. This mirrors the injectable-function testability pattern already used for `submitCookie`/`fetchCookies`/`submitEmailSignup` (`src/lib/testHelpers/fakeSupabaseClient.ts`), but at the component level with a plain fake async function rather than a fake Supabase client.
- A good test for `AppShell` asserts that triggering a screen switch (e.g. clicking "View Gallery") renders `GalleryPage` instead of the build flow, and vice versa for "Back to building" — asserting on what's rendered, not on internal state shape.
- Primary modules under test: `sortCookiesByMostRecent`, `GalleryPage`, `AppShell`.
- Prior art: the same vertical-slice TDD approach and "assert on rendered output, not internals" testing style already used for `TintedIcon`, `CookieRenderer`, and the repository functions (issues #1-#3).

## Out of Scope

- Pagination or infinite scroll (explicit future follow-up if Cookie volume grows).
- Realtime/live-updating Gallery (explicit future follow-up).
- A routing library or shareable Gallery URL (explicitly rejected per ADR 0004).
- Gallery moderation UI — the bakery owner continues to moderate by deleting rows directly in the Supabase dashboard, as already established.
- Any changes to `CookieRenderer`, `fetchCookies`, or `TintedIcon` themselves — this PRD only consumes them.
- The build-flow UI's own submit-success behavior (already specified in issue #4) beyond it calling into `AppShell`'s screen switch.

## Further Notes

- Depends on `CookieRenderer`/`fetchCookies` (issue #2: https://github.com/nanarv/kinsco-create/issues/2) and integrates with the build-flow UI's success path (issue #4: https://github.com/nanarv/kinsco-create/issues/4).
- Relevant ADRs: `docs/adr/0002-cookies-stored-as-structured-data-not-snapshots.md` (why the Gallery always reflects current Icon art), `docs/adr/0004-state-based-screen-switching-no-router.md` (the navigation mechanism this PRD implements).
- Relevant glossary terms (`CONTEXT.md`): Gallery, Cookie, Component.
