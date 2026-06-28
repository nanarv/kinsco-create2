# Build-flow UI (Base → Mix-ins → Topping → Shape → Name → Submit)

GitHub issue: https://github.com/nanarv/kinsco-create/issues/4

## Problem Statement

The pieces needed to build and save a Cookie already exist and are tested (`TintedIcon`, `CookieRenderer`, `submitCookie`/`fetchCookies`, `submitEmailSignup`), but there is no screen that lets a player actually use them. Right now the app is a single static placeholder with no buttons — a player at the pop-up table can't build anything.

## Solution

A step-by-step build flow takes a player through Base → Mix-ins → Topping → Shape → Name, assembling their choices into a `Cookie` object as they go, with a live preview rendered via `CookieRenderer` at every step. At the end, the player optionally leaves an email, then submits — calling `submitCookie` (and `submitEmailSignup` if they opted in) and, on success, switching straight to the Gallery so they see their own Cookie appear. The step/selection logic lives in a single pure `buildFlowReducer`, with the actual screens kept as thin, mostly-presentational components driven by that reducer's state.

## User Stories

1. As a player, I want to land on the Base step with a sensible default already selected, so that I can move forward immediately if I don't have a strong preference.
2. As a player, I want to pick a different Base than the default, so that I can customize it if I do have a preference.
3. As a player, I want to see up to four Mix-in slots that fill in as I click presets, so that I can build up my Mix-ins one at a time.
4. As a player, I want to be told there's a 4-Mix-in limit before I hit it, so that I'm not surprised when clicking does nothing.
5. As a player, when I'm at 4 Mix-ins and click a 5th preset, I want nothing to happen (or the option to look clearly disabled), so that I don't lose a Mix-in I didn't ask to remove.
6. As a player, I want to remove a specific Mix-in via an "x" on its slot, so that I can change my mind about just that one ingredient.
7. As a player, when I remove a Mix-in, I want the remaining ones to shift down and close the gap, so that my filled slots always stay contiguous from the top.
8. As a player, I want a Topping step with a sensible default, same as Base, so that I can move forward immediately or change it if I want.
9. As a player, I want a Shape step with a sensible default, so that my Cookie always has a valid overall silhouette even if I don't pick one myself.
10. As a player, for each of Base/Mix-in/Topping, I want to either pick a preset option or type my own custom name, so that I'm not limited to the presets.
11. As a player, for each of Base/Mix-in/Topping, I want to choose a color from a set of swatches, so that I can make the Component look the way I want.
12. As a player, for each Mix-in, I want to choose a render Pattern (flecks or swirl), so that it visually matches how I imagine that ingredient sitting on the cookie.
13. As a player, I want to see a live preview of my Cookie as I make choices, so that I know what I'm building before I commit to it.
14. As a player, I want to go back to a previous step and change an earlier choice, so that I'm not locked into my first decision.
15. As a player, I want a "Restart Cookie" option that clears everything and takes me back to the Base step, so that I can start over completely if I want a do-over rather than fixing individual choices.
16. As a player, I want to be asked to confirm before "Restart Cookie" actually clears my build, so that I don't lose my progress to a misclick.
17. As a player, I want to type a name for my finished Cookie (up to 50 characters), so that it has an identity in the Gallery.
18. As a player, I want to be required to enter a name before I can submit, so that my Cookie never shows up in the Gallery with a blank title.
19. As a player, I want to optionally leave my email at the end, so that I can hear about future pop-ups, without it being required to finish.
20. As a player, once I submit successfully, I want to be taken straight to the Gallery so I can see my Cookie, so that I get immediate payoff for finishing.
21. As a player, if saving my Cookie fails (e.g. a network error), I want to see an error message and be able to try again without losing my build, so that a transient failure doesn't cost me my work.
22. As a player, if my Cookie saves successfully but my optional email fails to save, I want to still be taken to the Gallery without an extra error message, so that a minor, optional side-feature failing doesn't spoil the moment.
23. As a developer, I want the step/selection logic centralized in one pure reducer, so that the flow's behavior (which step is current, what's selected, when you can advance) is testable without rendering any screen.
24. As a developer, I want each step screen to be a thin consumer of the reducer's state, so that screens can be built/restyled without touching the underlying flow logic.
25. As a developer, I want the final assembled object to be a valid `Cookie` (per `src/types.ts`) with no further transformation needed before calling `submitCookie`, so that the UI layer and the persistence layer stay decoupled through the existing typed shape.

## Implementation Decisions

- **`buildFlowReducer`** (new, pure function): `(state, action) => state`. Actions cover selecting a Base/Topping/Shape preset or custom name, adding a Mix-in (by clicking a preset — no separate "confirm add" step), removing a specific Mix-in by slot (with the remaining Mix-ins compacting to close the gap), setting each Component's color and (for Mix-ins) Pattern, setting the Cookie name, advancing/going back a step, and restarting the whole build. State tracks the current step and the in-progress selections in the same shape as `ComponentChoice`/`MixInChoice`/`Cookie` from `src/types.ts`, so the final state requires no transformation before being passed to `submitCookie`.
- **Defaults on entry**: entering the Base, Topping, or Shape step auto-selects the first catalog entry for that category if nothing is already selected, so a player can always advance without being forced to make a choice. Mix-ins have no default — the step starts empty, since "zero Mix-ins" is a valid, deliberate choice rather than something to default away from.
- **Custom-named entries**: per the existing `ComponentChoice` type, choosing a preset sets `iconId` and clears `customName`; typing a custom name sets `customName` and sets `iconId` to `null`. `TintedIcon`'s existing fallback behavior (issue #1) already handles rendering `iconId: null` correctly — no new rendering logic needed here.
- **Mix-ins step UI**: four fixed slots are always visible. Clicking any Mix-in preset (or entering a custom name) immediately fills the next empty slot — there is no separate "add" confirmation. Once all four slots are filled, further preset clicks are no-ops (the option should look visually disabled) rather than replacing an existing Mix-in. Each filled slot has an "x" to remove it; removing a slot shifts every subsequent filled slot down by one so filled slots stay contiguous from the top. The step displays copy stating the limit ("Select up to 4 ingredients") so the cap isn't a surprise.
- **Color selection**: implemented as a row of preset swatch buttons, not a literal color-wheel input widget. This PRD adds a small placeholder palette (e.g. 4-6 colors) purely so the picker has real values to render and test against — the final palette/swatch count (~12-16 colors, per earlier planning) is a separate content decision, not finalized here.
- **Shape selection**: a simple set of preset Shape options, presented the same way as the swatch pattern — pick one, it's highlighted, advance. This PRD adds a small placeholder set (e.g. 3 shapes: round, star, heart) for the same reason as the color palette — real content/expansion is a separate task.
- **Icon catalog content**: out of scope for this PRD. The catalog currently has one real preset per category (issue #1); the build flow renders whatever presets exist generically, and expanding the catalog with more options is a separate follow-up content task, not part of this UI/logic work.
- **Live preview**: at every step, the in-progress state (cast to a partial `Cookie`-shaped preview) is rendered via the existing `CookieRenderer` (issue #2), reusing it rather than building a second preview renderer.
- **Name step**: the name field starts empty (no pre-filled default) and has a 50-character limit. The player must enter a non-empty name before advancing past this step; there is no fallback name generated on their behalf.
- **Restart Cookie**: a destructive action, available throughout the build flow, that — after an explicit confirmation step ("Restart your cookie? This clears everything you've picked so far" / Cancel / Restart) — clears all selections and returns the player to the Base step. It is not the same as removing a single Mix-in slot; it resets the entire build.
- **Submission**: on the final step, calls `submitCookie` (issue #2) with the assembled `Cookie`, and — only if the player entered an email — also calls `submitEmailSignup` (issue #3). On success, the app switches to the Gallery screen (per ADR 0004's state-based screen switching) so the player immediately sees their Cookie. If `submitCookie` fails, the Submission step shows an inline error message with a retry action and the in-progress build state is preserved (nothing is lost, since `buildFlowReducer`'s state isn't cleared on failure). If `submitCookie` succeeds but `submitEmailSignup` fails, the app still switches to the Gallery — the email failure is not surfaced to the player.
- **Navigation**: forward/back between steps only; no ability to jump directly to an arbitrary step out of order for this v1.

## Testing Decisions

- A good test for `buildFlowReducer` dispatches a sequence of actions and asserts the resulting state: current step advances/regresses correctly; Base/Topping/Shape default-select on entry and can be overridden; Mix-ins fill slots in order, no-op past four, and removing a slot compacts the remaining ones; the Name field enforces the 50-character limit and blocks advancing while empty; "Restart Cookie" clears everything back to the Base step; and the state at the final step is a valid `Cookie` shape ready for `submitCookie`. This is the primary, most heavily tested module — same "assert on output, not internals" approach used for `TintedIcon`/`CookieRenderer`.
- The step screens themselves (the thin, mostly-presentational components) get lighter testing — primarily that they render the current reducer state and dispatch the right action on the right interaction (e.g. clicking a Base option dispatches the right action, clicking a filled Mix-in slot's "x" removes that slot) — using the same React Testing Library approach already established (`TintedIcon.test.tsx`, `CookieRenderer.test.tsx`).
- The submission step's behavior — `submitCookie` always, `submitEmailSignup` only if an email was entered, success switching to the Gallery, `submitCookie` failure showing a retryable error, `submitEmailSignup` failure being silent — should be tested against fake/mocked repository functions, consistent with how `submitCookie`/`fetchCookies` and `submitEmailSignup` are already tested with injectable fake Supabase clients (`src/lib/testHelpers/fakeSupabaseClient.ts`).
- Prior art: `buildFlowReducer` tests follow the same vertical-slice TDD approach already used for `TintedIcon`, `CookieRenderer`, and the repository functions (issues #1-#3) — one behavior, one test, minimal implementation, repeat.

## Out of Scope

- The Gallery page itself (a separate, not-yet-built PRD per issue #2's scope boundary) — this PRD only switches *to* it on success.
- Expanding the icon catalog, color palette, or Shape options beyond small placeholder lists — that's a separate content task.
- A polished rotating/visual color-wheel widget — preset swatch buttons only for this v1.
- Real homemade art — placeholder grayscale Icons only (per issue #1).
- QR code generation or pop-up signage design — this PRD covers the in-browser flow only, not how players physically reach the URL.
- Email format validation beyond basic non-empty input (per issue #3's scope boundary — validation UX is explicitly deferred, and this PRD is where it would have landed, but is still not being specified here).
- Jumping directly to an arbitrary step out of sequence.
- Editing or deleting a Cookie after submission.
- Undo for "Restart Cookie" (confirmation is the only safeguard).

## Further Notes

- Depends on `TintedIcon` (issue #1: https://github.com/nanarv/kinsco-create/issues/1), `CookieRenderer`/`submitCookie` (issue #2: https://github.com/nanarv/kinsco-create/issues/2), and `submitEmailSignup` (issue #3: https://github.com/nanarv/kinsco-create/issues/3) — this PRD is the first one that actually renders a usable screen, composing all three.
- Relevant ADRs: `docs/adr/0001`-`0003` apply transitively through the components/functions this PRD consumes. `docs/adr/0004-state-based-screen-switching-no-router.md` (introduced while grilling the Gallery PRD) is directly used here for the success → Gallery transition.
- Relevant glossary terms (`CONTEXT.md`): Cookie, Component, Icon, Pattern, Shape, Email Signup, Restart Cookie.
