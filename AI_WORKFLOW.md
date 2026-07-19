# Ajaia Docs — AI-Native Development Workflow

## 1. How I Used AI

I used three AI tools during this assessment, each for distinct phases:

**ChatGPT** — requirements analysis, scope prioritization, architecture planning, task decomposition, debugging strategy, prompt design for coding agents, QA checklist, and submission planning. I used it as a thinking partner to validate decisions before and after agent sessions.

**Antigravity** — initial repository/codebase adaptation. It helped bootstrap the project from the open-source Novel/Tiptap foundation, set up the workspace structure, and produce the early UI foundation.

**Kilo Code** — repository-level implementation, Supabase integration, persistence layer, mock-user/sharing integration, file import, access-control logic, automated test work, debugging, cleanup, and build/type verification. It was my primary implementation agent for the bulk of feature work.

## 2. Where AI Materially Accelerated Work

Concrete examples:

- **Adapting an existing editor foundation** instead of building rich-text editing from zero. Novel provided Tiptap extensions, slash commands, and toolbar primitives. I adapted these rather than reimplementing them.
- **Generating CRUD/data integration scaffolding** — Supabase queries, route handlers, and type mappings were drafted by agents and reviewed/refined by me.
- **Tracing cross-file persistence bugs** — the initial implementation had a localStorage bridge between Tiptap and Supabase. AI-assisted inspection of the data flow helped identify stale-state and race-condition risks.
- **Implementing sharing and access control** — the `document_shares` table, `grantShare()`, and application-level access resolution were scaffolded by agents.
- **Generating verification steps** — automated tests for access control and file import were generated based on the implemented rules.
- **Repository-wide cleanup** — searching for leftover Novel branding, demo content, and obsolete references across the codebase.

## 3. AI Output I Rejected or Changed

The most significant rework was the persistence architecture.

**Initial approach**: The first implementation used `localStorage` as a bridge — Tiptap wrote to `localStorage` on every change, and a polling mechanism synced to Supabase. After runtime testing, I identified concrete problems:

- Stale state risk between `localStorage` and the database
- Race conditions in the polling loop
- Demo/default content leaking into new documents because the localStorage fallback loaded `defaultEditorContent`
- The database not acting as a clean source of truth

I rejected this approach entirely.

**Final architecture**: Tiptap `onUpdate` → `editor.getJSON()` → debounced API PATCH (~1s) → Supabase. New documents initialize with `emptyEditorContent` (a single empty paragraph), never demo content. The database is the source of truth.

I also made scope judgment calls that AI could have expanded past:

- AI suggested exploring real authentication, real-time collaboration, and additional extensions. I deliberately kept seeded/mock users and focused on the core product behavior required by the assignment.
- When an agent session was interrupted mid-cleanup, I recovered the working tree first, verified what had actually changed, then completed only the safe remaining steps (removing unused `defaultEditorContent`, renaming the localStorage key).

## 4. How I Verified AI-Generated Work

Layered verification:

1. **Manual inspection** of every generated change before accepting it.
2. **TypeScript typecheck** (`pnpm typecheck`) — ensures all types align across packages.
3. **Automated tests** (`pnpm test`) — 8 tests covering access control and file import conversion.
4. **Production build** (`pnpm build`) — Next.js compile + headless package build.
5. **Manual browser QA** — end-to-end verification of creation, editing, formatting, persistence, ownership, sharing, cross-user edits, unauthorized isolation, import, and delete.
6. **Supabase table inspection** — verified row insertion, JSONB content shape, share records, and ownership.
7. **Multi-user scenario testing** — switched between all three seeded users to verify cross-user persistence and access boundaries.

## 5. Human Judgment / Decisions

The architecture and scope decisions were mine:

- Choosing seeded/mock users over real auth to focus assessment time on product behavior.
- Choosing TXT/MD import only, rejecting heavier DOCX dependencies.
- Prioritizing persistence and sharing over optional stretch features like real-time collaboration.
- Deciding not to rename internal `novel`/`novel-next-app` workspace identifiers because the risk to Turborepo resolution and lockfile integrity outweighed cosmetic benefit.
- Rejecting the localStorage bridge in favor of direct Supabase persistence.
- Verifying every agent output against the actual working tree before proceeding, rather than assuming prior session changes completed.

## 6. Example Workflow

Concrete example using the persistence rework:

1. **Requirement**: Documents must persist after refresh and be visible to shared users.
2. **Break into tasks**: Supabase client setup, table schema, document CRUD routes, editor integration, autosave.
3. **Prompt agent** with constraints: use server components for data, client component only for editor interaction, never store demo content as default.
4. **Inspect implementation** — found localStorage bridge and `defaultEditorContent` fallback.
5. **Run/test** — reproduced stale state in browser.
6. **Identify failure** — localStorage was not the right abstraction for this data flow.
7. **Refine architecture** — replaced with direct debounced PATCH to Supabase, `emptyEditorContent` as the only default.
8. **Retest** — verified persistence, cross-user visibility, and share flow.
9. **Accept/commit** — only after manual QA passed.

## 7. Limitations of AI-Assisted Workflow

- **Generated code can compile but fail at runtime** — the localStorage persistence compiled and ran, but had stale-state and race-condition bugs that only appeared during manual QA.
- **Agents can introduce unnecessary abstractions** — some early agent work included workarounds that I removed after understanding the actual data flow.
- **Context can be lost between sessions** — when a previous Kilo session was interrupted, the working tree did not match the reported plan. I had to recover state from `git diff` and `git status` before continuing.
- **Manual end-to-end verification remains necessary** — automated tests and builds cannot catch every UX or data-flow issue.

These were mitigated by: inspecting diffs before accepting changes, running the full verification stack (typecheck, tests, build, manual QA), and explicitly re-evaluating architecture decisions after runtime testing.
