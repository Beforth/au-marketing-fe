# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

S&M Hub frontend — a React 19 + TypeScript + Vite 6 SPA for Aureole Group's Sales & Marketing module: leads, orders, quotations, contacts/organizations/customers, domains & regions (org hierarchy), events/exhibitions, team performance/targets, DSR (daily status reports). `design.md` and `UI_COMPONENTS_LIBRARY.md` are the authoritative design-token/component-pattern references — consult them when building UI rather than guessing at colors/spacing. `ROLE_SCOPING_RULES.md` is the authoritative reference for who-sees-what by role — consult it before changing any query filter, visibility check, or scoping logic rather than inferring rules from one page's behavior.

### How the system fits together
Three independent backends, talked to directly from the browser — there is no BFF/proxy layer:
- **Marketing API** (FastAPI + SQLAlchemy + PostgreSQL, submodule at `au-marketing-api/`, default `:8003`) — all business CRUD (leads, orders, events, etc.), ~24 routers / 150+ endpoints. Also runs an APScheduler background worker (reminders, notifications) and re-validates permissions against HRMS on every request (5-min cache).
- **HRMS RBAC** (external, default `:8000`) — login, JWT issuance, permissions/roles/scope. The Marketing API is *not* the source of truth for auth.
- **Firebase Cloud Messaging** (optional) — web push notifications, plus a legacy OneSignal path.

Auth flow: browser POSTs credentials to HRMS RBAC → gets JWT + permissions/roles → stored in Redux (`authSlice`) and `localStorage` → every subsequent Marketing API call sends the JWT, and the Marketing API independently calls back to HRMS to verify the permission for that route (not just trusting the frontend's claim).

### Frontend structure
- `index.tsx` — deliberately renders **without** `<StrictMode>` (see comment at `index.tsx:14-15`) to avoid React 18/19's dev-mode double-invoke of effects, which was firing duplicate API calls. If you re-add StrictMode, page-level `useEffect` fetches need `AbortController` cleanup first.
- `App.tsx` — root: React Router setup (all routes registered here), `AppContext` (toast/notifications/demo-mode), providers.
- `pages/` — ~34 route-level components, one per URL (Leads, Orders, Domains, Events, Settings, Reports, etc.). Most list pages follow a kanban-and/or-table pattern with a paired `*FormPage.tsx` for create/edit.
- `components/layout/` — `DashboardLayout`, `DatabaseLayout`, `PageLayout` (page chrome/sidebar/breadcrumbs); `components/ui/` — ~28 shared building blocks (DataTable, Modal, Button, Sidebar, etc.); `UI/` — lower-level atoms (Button, Input, Badge, Tooltip).
- `lib/api.ts` — base `APIClient` (fetch wrapper, XHR upload-progress, 401 handling, `ApiError`). `lib/marketing-api.ts` — the single `marketingAPI` object with ~150 typed methods + every request/response TS interface for the Marketing API. `lib/hrms-rbac.ts` — HRMS auth client. `lib/firebase-push.ts` — FCM registration.
- `store/` — Redux Toolkit: `authSlice` (token/user/permissions), `dsrSlice`, `organizationPlantsSlice`, plus `middleware.ts` handling forced logout on token expiry. (Zustand is used separately for calendar-local state, not global app state.)
- `components/ProtectedRoute.tsx` — route guard: redirects to `/login` if unauthenticated, renders an "Access Denied" screen if the route's `requiredPermission`/`requireAnyPermission`/`requireAllPermissions` prop isn't satisfied.

## Working with this user

- **Check before building.** Before writing new code for a request, search the codebase for anything that already does this (a helper, component, page, field, API method). Tell the user what you found either way — "this already exists at X, reusing it" or "nothing like this exists yet, so it'll be new." Never silently duplicate something that's already there.
- **Say what you're touching.** If satisfying the request means modifying, removing, or deprecating existing code, name the specific file(s) and what's changing before (or as) you do it — don't make that call silently.
- **Explain in plain language, not just code terms.** Alongside any technical detail (file paths, function names), give a short plain-English version: what the actual problem or gap was, and what will be different after the change — written so someone with no coding background can follow it. Lead with that; keep file:line references as supporting detail, not the main explanation.
- **Don't make code changes until the user explicitly says to proceed.** When asked to look into a bug or a "why does X happen" question, investigate and explain the cause/plan first, then stop and wait — even if a fix seems small or obvious. Only edit files after the user confirms (e.g. "yes", "go ahead", "proceed", "fix it"). This applies to every change, not just large ones.

## Commands

- `npm run dev` — Vite dev server on :3000
- `npm run build` — runs `tsc && vite build`; typechecking is part of the build. Run `npx tsc --noEmit` alone for a faster type check without bundling.
- `npm run test` — Vitest in watch mode
- `npm run test:run` — Vitest single run (CI)
- `npm run test:ui` — Vitest UI
- Single test file: `npx vitest run path/to/file.test.ts`
- No lint script/config exists in this repo (no ESLint/Prettier) — `tsc --noEmit` is the only automated correctness check.

## Changelog convention

`CHANGELOG.md` (repo root) is the single source of truth for release notes — not just a log, since the backend and the in-app "What's New" modal both derive from it. When a set of changes is done and the user asks for a changelog entry:
- Check the **topmost** `## [date] — Title (vX.Y.Z)` entry in `CHANGELOG.md` first — don't assume a version number, confirm what's actually there. New entries go directly below the `---` under the title block, newest first. Each entry needs its own unique version — never reuse the top entry's version number for a different date's changes; bump it (patch for fixes/small additions, minor for new features) per semver.
- Format: `## [YYYY-MM-DD] — Title (vX.Y.Z)` using an em dash (`—`), then `###`/`####` sub-headers (e.g. `### 🖥️ Frontend`, `#### Feature Name`) with `-` bullet items underneath. This isn't just style — `au-marketing-api/scripts/populate_changelog.py` parses this exact structure to sync entries into the `ChangelogVersion` DB table that backs the in-app changelog UI, and it specifically treats "Frontend"/"Backend"/"Backend (API)"/"Files Changed" as generic wrapper headers to skip — any other heading text becomes a real named section shown to users.
- After adding the entry, keep the version number in sync in two more places: `package.json`'s `version` field, and the `useState('vX.Y.Z')` placeholder in `components/ui/Sidebar.tsx` (shown briefly before the real version loads from the backend `/health` check). The backend itself needs no manual bump — `au-marketing-api/app/version.py` reads its version live from whatever heading is topmost in `CHANGELOG.md`.
- The database table is not updated automatically by editing the markdown file — `python scripts/populate_changelog.py` (run from `au-marketing-api/`) pushes new entries into the DB. That's a real write to the database, so confirm with the user before running it rather than running it as a matter of course.
- **There are two separate `CHANGELOG.md` files that must both be updated, identically, by hand.** `au-marketing-api/CHANGELOG.md` is not a stray/stale copy — it's a real file tracked in the backend repo's own git history (separate remote, separate commits from the frontend). The populate script resolves its path relative to itself: `au-marketing-api/../CHANGELOG.md` first, falling back to `au-marketing-api/CHANGELOG.md` — on a standalone backend deployment (not nested inside a frontend checkout) the first path won't exist, so it's the **backend-local file** that actually gets read on the server. Nothing auto-syncs the two files; they had already diverged in content once (different wording for the same version) and gone stale once (backend copy stuck at v1.1.9 while the frontend moved on to v1.2.1) before this was caught. Whenever you add a changelog entry: write the **identical full entry** (not a backend-only trimmed version) into both `CHANGELOG.md` (repo root) and `au-marketing-api/CHANGELOG.md`, and commit each in its own repo — one commit is not enough.
- **The changelog is client-facing first, internal reference second.** It's what the client reads (via the in-app "What's New" modal), not a dev log — write entries as plain feature/fix descriptions only. Don't add a "Files Changed" table (file paths/code-level detail) or a "Documentation" section (CLAUDE.md or other internal process/doc changes) — a client has no use for either, and unlike "Files Changed" (which the populate script already skips syncing to the DB), a "Documentation" heading isn't on the script's skip-list and would actually show up in the in-app changelog UI as a real section. Default to a **patch** version bump for a day's changes unless the user says otherwise, even if several features landed — the version number itself shouldn't overstate the release.

## Feature revision log (CHANGES.md)

`CHANGES.md` (repo root) is the **developer-facing, feature-grouped revision log** — distinct from the client-facing `CHANGELOG.md`. **Read it before starting any change** (its `## How to update this file` block at the top is the canonical rule) and **update it on every change, in the same turn as the code** — not just on release. Rules:

- Find the feature section the change belongs to (see the index at the top of `CHANGES.md`). If none exists, create one and add it to the index.
- Add a new `### Rev N — YYYY-MM-DD (vX.Y.Z)` block **at the top** of that section (bump N), with a short plain-language description and the key `Files:` touched.
- **Never create a second section for the same feature** — the point of this file is that a feature touched repeatedly accumulates revisions under one section, with dates and versions, so its evolution is traceable.
- Root copy only — do **not** mirror into `au-marketing-api/CHANGES.md`. This file complements, and does not replace, the dual-copy `CHANGELOG.md` convention above.

## Repo layout

- This repo is frontend-only. `au-marketing-api/` is a **nested git repo** (gitlink, mode `160000` per `git ls-files`) containing the FastAPI backend — it has its own commit history and remote, separate from this repo's. Use `git -C au-marketing-api ...` (not plain `git`) to inspect or commit backend changes, and never assume a `git log`/`git status` run from the repo root covers it.
- Copy `.env.example` → `.env`. Key vars: `VITE_API_BASE_URL` (Marketing API, default `:8003`), `VITE_HRMS_RBAC_API_URL` (HRMS auth/RBAC service, default `:8000`). Firebase vars are optional (push notifications).

## Database migrations (production)

- Migrations are applied directly against the production database by the user, via SSH into the Docker host and exec'ing into the running backend container — there is no separate staging environment or CI migration step. The actual commands used:
  ```
  sudo docker compose exec web alembic revision --autogenerate -m "..."
  sudo docker compose exec web alembic upgrade head
  ```
- **The server's migration history does not reliably match what's committed to `au-marketing-api/migrations/versions/` in this repo.** The production host's working directory accumulates migration files generated directly by past `alembic revision --autogenerate` runs that were never `git add`/committed — Docker's `COPY . .` bakes whatever physically sits in that directory into the image regardless of git status, so those files persist and keep chaining across rebuilds even though they don't exist in this repo's history. Don't add a hand-written migration file to this repo expecting it to be the next one applied on production — it will likely create a second, disconnected head and break the next `alembic revision --autogenerate` with a "multiple heads" error instead. If a migration needs a change autogenerate can't produce on its own, fix the *tooling* (see below) rather than hand-writing a one-off migration file.
- **The user only wants to run plain `alembic revision --autogenerate` + `alembic upgrade head` — no hand-written migrations, no raw SQL run by hand.** Design fixes around that constraint. For the specific case of adding a new value to an existing Postgres `Enum` column (something plain Alembic autogenerate cannot detect at all, a hard limitation not a config issue), the fix already in place is the `alembic-postgresql-enum` package (`requirements.txt`) plus `import alembic_postgresql_enum` in `migrations/env.py` — it patches autogenerate's comparator to detect enum value additions/removals, so a plain `--autogenerate` run now picks them up automatically like any other schema change.

## Architecture essentials (beyond README)

### Two backends, two concerns
- **HRMS RBAC** (`lib/hrms-rbac.ts`) — login, JWT, permissions/roles only.
- **Marketing API** (`lib/marketing-api.ts`, ~150 typed methods) — all business CRUD. It independently re-checks permissions against HRMS server-side (5-min cache), so a frontend permission gate and the backend's actual enforcement can drift apart if someone adds backend-only logic — always check both sides when debugging a permission-denied error that the frontend UI didn't predict.

### Permission gating pattern
UI elements gate on `useAppSelector(selectHasPermission('marketing.xxx'))` (`store/slices/authSlice.ts`); routes gate via `<ProtectedRoute requiredPermission=... />` (`components/ProtectedRoute.tsx`). When adding a new gated action, copy an existing `selectHasPermission('marketing.xxx')` call from the same page rather than inventing a new check.

### RBAC permissions vs. Visibility Settings — these are not the same system
Two separate authorization concepts show up across this codebase and are easy to conflate:
- **RBAC permissions** (`marketing.create_lead`, `marketing.edit_lead`, `marketing.admin`, etc.) gate *actions* — who can create/edit/delete something.
- **Visibility Settings** (`Settings → Visibility` tab in `pages/SettingsPage.tsx`, backed by `MarketingSettingsPayload.past_quarter_access` in `lib/marketing-api.ts`) is an admin-curated, per-fiscal-quarter allow-list that controls only whether *already-recorded historical* numbers are *displayed* on the Domains tab (`pages/DomainsPage.tsx`, see `checkManagementRoleOrQuarterAccess` / `hideQ`). It is a display filter, not a permission gate, and must never be used to authorize a write/create action — that has happened once already (a backend check on backdated Won-date writes wrongly required presence on this list) and had to be reverted.

### Won-date / kanban status-change flow has multiple entry points
`LeadsPage.tsx` (kanban drag-to-column, and a per-card "Won" button) and `pages/LeadFormPage.tsx` (a separate "Mark as Won" modal in Edit Lead) each independently trigger a status-change-to-Won flow (closed value + PO + optional backdated Won date), each calling `marketingAPI.updateLead` / `createLeadActivity` directly. There is no shared hook/component for this — if you change the Won-flow behavior (e.g. backdating rules), all entry points need to be updated in lockstep or they'll silently diverge. `OrdersPage.tsx` has a kanban+table `ViewMode` toggle; `LeadsPage.tsx` currently does not (kanban only), despite what the README's page list implies.

### Settings live-reload
Backend responses carry an `X-Marketing-Settings-Version` header; the frontend compares it against the last-seen version and reloads settings-dependent UI on change (`lib/api.ts` / `lib/marketing-api.ts`).

### Role scoping model
Access is governed by two independent layers that are easy to conflate: RBAC permissions (above) gate *actions*, while a separate **role-scoping** layer gates *which rows a query returns* — e.g. a `region_head` and an `employee` can both hold `marketing.view_lead` but see completely different lead sets. The five roles (`super_admin` → `domain_head` → `region_head`/`supervisor` → `region_coordinator` → `employee`) form a hierarchy of Domain → Region → Organization → Plant scoping, enforced primarily server-side (`au-marketing-api/app/scope.py` and per-router filters) with some display-only mirroring on the frontend (`pages/DomainsPage.tsx`). Full role-by-role visibility matrices for Domains, Leads/Orders, Database (Organizations/Customers/Contacts), and Events are in `ROLE_SCOPING_RULES.md` — read it before touching any scoping filter rather than reverse-engineering the rule from one role's observed behavior.

### Two different "who created this" ID spaces — a real trap
`Domain.head_employee_id`, `Region.head_employee_id`/`coordinator_employee_id`, and `EmployeeRegionAssignment.employee_id` are always the HRMS **employee** ID. But every `created_by_employee_id` column across the app (Lead, Order, Contact, Customer) is actually populated with the Django auth **user** ID at creation time (`created_by_employee_id=user_id` in every create endpoint) — a pre-existing inconsistency, not a naming choice. The old territory-based scoping never compared creator identity to org-chart data, so this never mattered; the creator-chain scoping in `app/scope.py` (`get_chain_visible_creator_ids`) does, and silently drops anyone whose `user_id` differs from their `employee_id` unless both are checked. The fix in place: translate HRMS employee_id → user_id via `MarketingEmployee.hrms_employee_id`/`hrms_user_id` (the existing local id-mapping cache) and include both — don't "fix" this by changing what create endpoints store, since that breaks nothing new but doesn't help records already saved, and a real fix would need a data backfill, not a code change.

### `log_action(current_user=...)` param-name mismatches
Routers don't use a fixed name for the auth-dependency parameter — some use `user`, some `user_info`. `domains.py` and `series.py` both had a `NameError: name 'user' is not defined` bug where `log_action(current_user=user, ...)` referenced a name that didn't exist in that function (the actual param was `user_info`) — a silent runtime crash that blocked every domain/series edit until fixed (2026-08-14). When adding a new `log_action` call, check the actual dependency parameter name in *that specific function* — don't copy-paste from a nearby one.

### A disabled feature still lives in the tree
The AI-generated dashboard widgets / report-template feature is currently commented out (not deleted) in both the frontend and `au-marketing-api/app/routers/saved_dashboards.py`. Don't mistake the commented blocks for dead code to clean up — `ai_dashboard_restoration.md` has the exact restore snippets and locations if this feature needs to come back.

## Testing

Vitest + jsdom + React Testing Library, global setup in `src/test/setup.ts`. Coverage is currently limited to smoke tests under `src/test/` — don't assume broader test coverage exists elsewhere before relying on `npm run test:run` to catch a regression.
