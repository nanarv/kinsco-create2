# Anonymous Email Signup capture (no Customer entity)

GitHub issue: https://github.com/nanarv/kinsco-create/issues/3

## Problem Statement

Kinsco Create's pop-up bakery has no brick-and-mortar location and no other way to build a repeat-customer list — without some way to capture interest at the exact moment someone's excited about the cookie they just made, the bakery owner loses the only natural opportunity to ever reach that person again. At the same time, the game must stay fully anonymous: there is no login, and nothing about gameplay should require or imply that a player has an identity tracked by the system.

## Solution

At Submission time, a player can optionally leave their email address to hear about future pop-ups. Per ADR 0003, this is captured as a standalone Email Signup with no link to the Cookie they made or to any other Email Signup — there is no Customer entity anywhere in the system, and the capture is structurally incapable of being tied back to a specific Cookie.

## User Stories

1. As a player, I want to optionally leave my email after finishing my Cookie, so that I can hear about future pop-ups.
2. As a player, I want leaving my email to be entirely optional, so that I'm not blocked from finishing my Cookie if I don't want to share it.
3. As a player, I want my email capture to be unrelated to the Cookie I just made, so that the bakery can't trace a specific cookie design back to me.
4. As the bakery owner, I want to collect emails from interested players, so that I can build a mailing list for future pop-up announcements.
5. As the bakery owner, I want the email list to be separate from Cookie data, so that I'm not maintaining per-customer cookie history I never asked for and don't need.
6. As a developer, I want the Email Signup capture function to make it structurally impossible to attach a Cookie reference, so that no future change can accidentally start linking emails to Cookies without a deliberate, separate decision.
7. As a developer, I want the Email Signup write path to be a single, narrow function, so that there's exactly one place in the codebase where emails get persisted.
8. As a player, if I submit an email, I want it stored even if I never finish or come back to the game again, so that my interest is captured regardless of what I do afterward.

## Implementation Decisions

- **`submitEmailSignup` function** (new): signature `submitEmailSignup(email: string): Promise<void>`. Inserts a row into the existing `email_signups` table (`supabase/migrations/0001_init.sql`: `email`, `created_at`) via the existing `src/lib/supabaseClient.ts` client. The signature intentionally accepts only an email — no Cookie id, no other identifier — making it structurally impossible to link a signup to a Cookie.
- **No Customer entity**: no new table, type, or function introduces any concept of a Customer or persistent identity. `submitEmailSignup` and `submitCookie` (from the Cookie persistence PRD) remain entirely independent write paths called at the same moment in the UI but sharing no data.
- **No read path**: no `fetchEmailSignups` or any other query function is introduced. Nothing in the product currently consumes the list of signups (no admin UI exists); the bakery owner accesses the list directly via the Supabase dashboard, consistent with how Gallery moderation is already handled (deleting rows directly in the dashboard).
- **No validation beyond basic shape**: this PRD does not specify email format validation rules (e.g. regex, confirmation step) — that's a UI-layer concern for whatever build-flow/Submission screen eventually calls this function, not part of the persistence boundary itself.
- **Scope boundary**: this PRD covers only the `submitEmailSignup` function and its boundary guarantees. The Submission UI (the actual optional input field, the "no thanks" path, where it sits in the build flow) is a separate, not-yet-built feature that will call this function.

## Testing Decisions

- A good test for `submitEmailSignup` asserts on external behavior: calling it with an email results in a row written with that email and a timestamp, and the function's signature/call accepts no Cookie-related argument — there is no code path by which a Cookie id could reach the `email_signups` table. Tests should exercise this against a fake/mocked Supabase client, consistent with the round-trip testing approach used for `submitCookie`/`fetchCookies` in the Cookie persistence PRD, rather than the real linked project.
- Primary module under test: `submitEmailSignup`.
- Prior art: the `submitCookie`/`fetchCookies` repository functions from the Cookie persistence PRD (https://github.com/nanarv/kinsco-create/issues/2) establish the pattern — a narrow function wrapping `supabaseClient`, tested via a mocked client — that this PRD follows.

## Out of Scope

- The Submission UI / optional email input field and its placement in the build flow.
- Email format validation or confirmation UX.
- Any read/query path over collected Email Signups (the owner uses the Supabase dashboard directly).
- Any integration with a mailing list provider (Mailchimp/Substack/etc.) — emails are stored in the project's own database only, with no external sync.
- Any future Customer entity or identity system — explicitly not part of this or any current PRD.

## Further Notes

- Relevant ADR: `docs/adr/0003-anonymous-gameplay-no-customer-entity.md`.
- Relevant glossary term (`CONTEXT.md`): Email Signup.
- Mirrors the persistence pattern established in the Cookie persistence PRD (https://github.com/nanarv/kinsco-create/issues/2) but is intentionally simpler — one write, no fetch, no relationships.
