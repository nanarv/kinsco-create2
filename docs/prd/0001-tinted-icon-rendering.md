# Tinted Icon rendering system (grayscale art + live color via blend mode)

GitHub issue: https://github.com/nanarv/kinsco-create/issues/1

## Problem Statement

Kinsco Create's homemade Icon art doesn't exist yet, and even once it does, the artist can't realistically hand-draw a separately colored version of every Icon for every swatch on the color wheel. Without a way to recolor a single grayscale drawing at runtime, every new color option would mean new art, and the shading/highlight detail that makes the Icons feel "homemade" would be lost the moment a color is applied on top.

## Solution

Each Icon (a Base, Mix-in, or Topping option's art asset) is drawn once in grayscale with its shading baked in. A reusable `TintedIcon` component renders that grayscale art with the player's chosen color applied live via `mix-blend-mode: multiply`, so the hue changes but the underlying light/dark shading shows through unchanged. Mix-in Icons additionally support a Pattern (flecks or swirl) describing how the tinted Icon repeats or distributes. Per ADR 0001, this keeps the art pipeline to one grayscale drawing per Icon regardless of how many colors the wheel offers.

## User Stories

1. As a player, I want to pick any color from the wheel for my Base, so that my cookie's dough looks the way I want.
2. As a player, I want to pick any color from the wheel for each Mix-in, so that my chocolate chips, drizzle, etc. match my taste.
3. As a player, I want to pick any color from the wheel for my Topping, so that the finishing layer matches my overall design.
4. As a player, when I change a Component's color, I want the shading and highlights on that Icon to stay visible, so that the cookie still looks textured and not flat.
5. As a player, when I select a Mix-in's render Pattern (flecks or swirl), I want the tinted Icon to actually render in that Pattern, so that different Mix-ins look visually distinct on the cookie.
6. As a player, I want every Base/Mix-in/Topping option to have *some* visual representation even before real art exists, so that the game is playable today.
7. As the bakery owner (consumer of the Gallery), I want past Cookies to visually upgrade automatically when real Icon art replaces placeholders, so that I don't have to regenerate old gallery entries (per ADR 0002 — Cookies are re-rendered live from stored data, and `TintedIcon` is what performs that re-render).
8. As a developer extending the Icon catalog, I want to add a new Icon by registering one grayscale asset, so that I don't need to produce per-color art.
9. As a developer, I want `TintedIcon` to work identically whether the Icon is a placeholder flat-grayscale shape or final polished art, so that swapping in real art later requires no changes to the rendering component.
10. As a developer, I want a typed Icon catalog (per Component category: Base, Mix-in, Topping) so that the build-flow UI (a separate, not-yet-built feature) can list available options without duplicating Icon metadata.
11. As a player using a custom-typed Mix-in name (not a preset), I want it to still render as some tinted Icon (e.g. a generic placeholder shape) and still respect my chosen color and Pattern, so that custom mix-ins aren't visually broken.

## Implementation Decisions

- **`TintedIcon` component** (new): the single rendering seam for this feature. Props: an Icon reference (id from the catalog, or a generic fallback for custom-named Mix-ins/Bases/Toppings), a color value, and an optional Pattern (`'flecks' | 'swirl'`) — only meaningful when rendering a Mix-in.
- **Rendering technique** (per ADR 0001): the grayscale Icon asset is rendered as a base layer; the chosen color is applied as an overlay with CSS `mix-blend-mode: multiply` so the grayscale shading shows through the tint. No canvas/WebGL — pure CSS/SVG, consistent with the "no extra art skill required" placeholder strategy already in place.
- **Pattern rendering**: when a Pattern is provided, `TintedIcon` tiles or distributes the tinted Icon according to the Pattern (`flecks`: scattered small repeats; `swirl`: a single rotated/elongated repeat) rather than rendering one centered shape. Exact visual tiling approach (CSS background-repeat vs. multiple SVG `<use>` instances) is left to implementation, but must not require per-Pattern art assets — same grayscale Icon, different distribution.
- **Icon catalog** (new, typed data module): a map from Component category (Base, Mix-in, Topping) to a list of Icons, each with an id, display name, default color, and grayscale asset path. Placeholder assets are flat grayscale SVG shapes (no extra polish), matching the previously agreed placeholder strategy — real art swaps in later without changing the catalog's shape or `TintedIcon`'s interface.
- **Custom-named entries**: when a player types a custom name instead of picking a preset, `TintedIcon` falls back to a generic placeholder Icon for that Component category, still tinted with the chosen color (and Pattern, for Mix-ins).
- **No snapshot rendering**: consistent with ADR 0002, `TintedIcon` is the same component used both during the build flow and when the Gallery re-renders a stored Cookie from its structured JSON — there is no separate "render once and save a picture" path.
- **Scope boundary**: this PRD covers only the Icon rendering system (`TintedIcon` + Icon catalog). The build-flow UI (step-by-step Base → Mix-ins → Topping → Shape → Name screens), the color wheel/swatch picker UI, and the Gallery grid are separate, not-yet-built features that will consume `TintedIcon` but are out of scope here.

## Testing Decisions

- A good test here renders `TintedIcon` with a given Icon reference, color, and (for Mix-ins) Pattern, and asserts on the rendered output's external behavior: the correct grayscale asset is present, the chosen color is applied as an overlay with `mix-blend-mode: multiply` set, and — when a Pattern is given — the Icon is rendered as a repeated/distributed pattern rather than a single shape. Tests should not assert on internal implementation details (e.g. exact DOM nesting or class names) that could change without changing behavior.
- Primary module under test: `TintedIcon`. The Icon catalog is exercised indirectly through `TintedIcon` tests (rendering a known catalog Icon) rather than tested in isolation, since it's static data.
- There is no existing test setup or prior art for tests in this repo yet (the scaffold currently has no test runner configured) — setting up a test runner (e.g. Vitest + React Testing Library, consistent with the existing Vite + React + TS stack) is part of delivering this feature, not a pre-existing convention to follow.

## Out of Scope

- The build-flow UI (step screens for Base/Mix-ins/Topping/Shape/Name).
- The color wheel/swatch picker UI itself (this PRD assumes a color value is already chosen and handed to `TintedIcon`).
- The Gallery grid/listing UI.
- Producing final (non-placeholder) homemade art — placeholder grayscale shapes only.
- Supabase persistence of Cookies (schema already exists per `supabase/migrations/0001_init.sql`; wiring it up is a separate feature).
- Email Signup capture.

## Further Notes

- Relevant ADRs: `docs/adr/0001-grayscale-icons-tinted-via-blend-mode.md` (the rendering technique this PRD implements), `docs/adr/0002-cookies-stored-as-structured-data-not-snapshots.md` (why `TintedIcon` must work identically for live building and Gallery re-render).
- Relevant glossary terms (`CONTEXT.md`): Icon, Component, Pattern, Shape (note: Shape refers to the cookie's outer silhouette, not Icon art — not part of this PRD).
