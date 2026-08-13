# AGENTS.md

S&M Hub — React 19 + TypeScript + Vite 6 SPA (Aureole Group sales/marketing: leads, orders, quotations, contacts, events, DSR). **Read `CLAUDE.md` first — it is the primary, authoritative project guide.** Consult it before touching auth, permissions, role scoping, changelog logic, or anything it covers; treat it as the source of truth wherever this file or other docs conflict. This file covers only the traps that are easy to hit.

## Layout trap: source is at repo root, not `src/`

App code lives at the **repo root**: `App.tsx`, `index.tsx`, `pages/`, `components/`, `lib/`, `store/`, `UI/`, `constants.tsx`, `types.ts`. The `src/` directory contains **only Vitest setup + smoke tests** (`src/test/`). Do not search `src/` for pages or components.

## Nested git repo

`au-marketing-api/` is a **nested git repo** (gitlink, mode `160000` in `git ls-files`), not part of this frontend repo's history. It has its own remote and commit history. Use `git -C au-marketing-api ...` for backend work; plain `git status`/`git log` from root won't cover it.

## Commands

- `npm run dev` — Vite dev server on `:3000`
- `npm run build` — `tsc && vite build` (typecheck is part of build)
- `npx tsc --noEmit` — fast typecheck only (no lint script exists; this is the only automated correctness check)
- `npm run test:run` — Vitest single run; `npm run test` — watch; single file: `npx vitest run path/to/file.test.ts`
- Tests are smoke-only (`src/test/`). Don't assume broader coverage catches regressions.

## Changelog conventions (client-facing, strict)

- **Two files must both be updated identically, by hand**: root `CHANGELOG.md` and `au-marketing-api/CHANGELOG.md` (separate repos/remotes; nothing auto-syncs them).
- Add entries under the **topmost** `## [date] — Title (vX.Y.Z)` block; bump the version (patch by default) and never reuse the top version.
- After editing, sync the version in **two more places**: `package.json` `version` and the `useState('vX.Y.Z')` in `components/ui/Sidebar.tsx`.
- Headings `### Frontend` / `### Backend` / `### Files Changed` are treated as wrapper sections and skipped; any other heading shows as a real named section in the in-app "What's New" UI. No "Files Changed" or "Documentation" sections.

## Feature revision log (CHANGES.md) — update on every change

`CHANGES.md` (repo root) is the **dev-side, feature-grouped revision log**, separate from the client-facing CHANGELOG. **Every change — frontend, backend, tooling, or docs — gets a revision in the same turn as the code.** Rules:

- Read the feature index at the top of `CHANGES.md`; add the revision to the matching section, or create a new section and add it to the index. Never create a second section for the same feature.
- Add `### Rev N — YYYY-MM-DD (vX.Y.Z)` at the top of that section (bump N), with a plain-language description and the key `Files:`.
- Root copy only — never mirror into `au-marketing-api/CHANGES.md` (`CHANGELOG.md` is the one that gets mirrored).

## Architecture facts that matter

- **Three backends, no BFF**: HRMS RBAC (`lib/hrms-rbac.ts`, `:8000`) for login/JWT/permissions; Marketing API (`lib/marketing-api.ts`, `:8003`) for all business CRUD — it **independently re-checks permissions server-side** (5-min cache), so backend and frontend gates can drift; FCM (optional) for push.
- **Two separate authorization systems, don't conflate**: RBAC permissions (`marketing.xxx`) gate *actions*; Visibility Settings (`past_quarter_access`) is a *display-only* allow-list for past-quarter numbers on the Domains tab and must never gate a write. `ROLE_SCOPING_RULES.md` is authoritative for who-sees-which-rows — read it before changing any scoping filter.
- **`index.tsx` deliberately renders without `<StrictMode>`** to avoid dev double-invoke of effects firing duplicate API calls. Don't re-add it without AbortController cleanup first.
- **Won-date/kanban status-change flow has multiple entry points** (`LeadsPage.tsx` drag/Won button, `LeadFormPage.tsx` "Mark as Won" modal) — they call the API independently; keep changes in lockstep.
- AI dashboard/report-template feature is **commented out, not dead** — restore per `ai_dashboard_restoration.md`; don't delete it as cleanup.
- Design tokens/component patterns: `design.md` + `UI_COMPONENTS_LIBRARY.md` are authoritative — consult before styling.
- Backend run via Docker: **restart ≠ reload code**; code changes need a rebuild. Production DB migrations are applied manually on the host, and the production migration history does not match the repo's — don't hand-write migration files.
