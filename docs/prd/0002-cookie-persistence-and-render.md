# Cookie persistence as structured data + live re-render (CookieRenderer)

GitHub issue: https://github.com/nanarv/kinsco-create/issues/2

## Problem Statement

Kinsco Create's Icon art is still placeholder and will be replaced with real homemade art later. If a submitted Cookie were saved as a flattened snapshot image, every Cookie already in the Gallery would be frozen with whatever placeholder art existed at the moment it was made — replacing placeholders with real art later would do nothing for past Cookies, and the bakery owner would be stuck with an inconsistent-looking gallery of old "ugly placeholder" Cookies next to new ones.

## Solution

A Cookie is persisted as structured data — which Icon, color, and Pattern were chosen for its Base, Mix-ins, and Topping, plus its Shape and name — rather than as a rendered image. A `CookieRenderer` component takes that structured data and renders it live using `TintedIcon` (the rendering primitive from the Tinted Icon PRD), the same way whether the Cookie was just built in the current session or fetched back out of storage. Per ADR 0002, this means swapping in real Icon art automatically upgrades every Cookie ever submitted, with no re-processing step.

## User Stories

1. As a player, after I finish building my Cookie, I want it saved so that it shows up in the Gallery.
2. As a player, I want my submitted Cookie to look the same in the Gallery as it did while I was building it, so that the Gallery accurately reflects what I made.
3. As the bakery owner, I want old Gallery Cookies to automatically look better once real Icon art replaces the placeholders, so that I don't have to regenerate or re-upload anything.
4. As a developer, I want one rendering path (`CookieRenderer`) used both for the in-progress build preview and for re-rendering a stored Cookie, so that there's no risk of the two diverging.
5. As a developer, I want to fetch a stored Cookie back as the same typed `Cookie` shape used during building, so that `CookieRenderer` doesn't need a separate code path for "live" vs. "persisted" data.
6. As a developer, I want a clear persistence boundary (`submitCookie`, `fetchCookies`) so that the rendering code never talks to Supabase directly.
7. As a developer extending the Icon catalog later, I want old stored Cookies that reference now-removed or changed Icon ids to fail gracefully (e.g. render a fallback) rather than crash the Gallery, since ADR 0002 explicitly accepts this as a known cost of not snapshotting.
8. As a player, I want my Cookie's name, Shape, and all chosen colors/Patterns to round-trip exactly through storage, so that nothing about my creation is lost or altered between submitting and seeing it rendered back.

## Implementation Decisions

- **`CookieRenderer` component** (new): takes a `Cookie` (the existing `src/types.ts` shape: `base`, `mixIns`, `topping`, `shape`, `name`) and renders it by composing one `TintedIcon` per Component — one for `base`, one per entry in `mixIns` (passing each Mix-in's `pattern`), one for `topping`. Used identically for the in-progress build preview and for re-rendering a Cookie fetched from storage — no separate "preview" vs. "gallery" rendering path.
- **Repository module** (new): `submitCookie(cookie: Cookie): Promise<void>` inserts a row into the existing `cookies` table (`supabase/migrations/0001_init.sql`: `name`, `shape`, `base` jsonb, `mix_ins` jsonb, `topping` jsonb, `created_at`); `fetchCookies(): Promise<Cookie[]>` reads rows back and maps the jsonb columns into the typed `ComponentChoice`/`MixInChoice` shapes from `src/types.ts`. Both live behind the existing `src/lib/supabaseClient.ts` client.
- **No snapshot/image storage**: no image is generated or uploaded at submission time. The `cookies` table has no image column and none should be added as part of this work.
- **Unknown/removed Icon handling**: when `CookieRenderer`/`TintedIcon` encounters an `iconId` that no longer exists in the Icon catalog (e.g. a stored Cookie referencing a since-removed placeholder), it falls back to the generic placeholder Icon for that Component category (the same fallback already used for custom-named Components) rather than throwing.
- **Scope boundary**: this PRD covers `CookieRenderer` and the `submitCookie`/`fetchCookies` repository functions only. The Gallery page (fetching a list, grid layout, reverse-chronological ordering, loading/empty states) is a separate, not-yet-built PRD that will consume these primitives. The build-flow UI that produces a `Cookie` object in the first place is also separate.

## Testing Decisions

- A good test for `CookieRenderer` renders it with a given `Cookie` object and asserts the right `TintedIcon` instances appear with the right Icon/color/Pattern per Component — same testing approach as `TintedIcon` itself (assert on rendered output, not internal DOM structure). One additional case: a `Cookie` referencing an unknown `iconId` should render the fallback Icon, not throw.
- A good test for `submitCookie`/`fetchCookies` exercises the round-trip — submit a `Cookie`, fetch it back, assert the returned object is deep-equal to what was submitted — against a fake/mocked Supabase client rather than hitting the real linked project, so tests are deterministic and don't depend on network/database state.
- Primary modules under test: `CookieRenderer`, and the `submitCookie`/`fetchCookies` repository functions.
- No prior art exists in this repo for either kind of test yet (test runner setup is being introduced as part of the Tinted Icon PRD); this PRD should reuse whatever test runner/mocking approach that PRD establishes rather than introducing a second one.

## Out of Scope

- The Gallery page (list fetching, grid layout, ordering, loading/empty states).
- The build-flow UI that constructs a `Cookie` object before submission.
- Email Signup capture (a separate, unlinked capture per ADR 0003).
- Any image/snapshot generation or storage.
- Icon catalog changes/removal policy beyond the fallback behavior described above.

## Further Notes

- Relevant ADR: `docs/adr/0002-cookies-stored-as-structured-data-not-snapshots.md`.
- Depends on `TintedIcon` and the Icon catalog from the Tinted Icon Rendering System PRD (https://github.com/nanarv/kinsco-create/issues/1) — `CookieRenderer` is a thin composition layer on top of that work, not a replacement for it.
- Relevant glossary terms (`CONTEXT.md`): Cookie, Component, Icon, Pattern, Shape, Gallery (Gallery itself is out of scope here, but the term is used to describe where rendered Cookies eventually appear).
