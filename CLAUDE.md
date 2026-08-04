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
- **Known gap: the server can run this script against a stale `CHANGELOG.md`.** The script reads the file from disk relative to itself (`au-marketing-api/../CHANGELOG.md`, falling back to `au-marketing-api/CHANGELOG.md`) — but since `au-marketing-api` is a separate git repo from the frontend, nothing automatically syncs the frontend's `CHANGELOG.md` into the backend's deployment. This has already caused a real miss (v1.2.0 and v1.2.1 didn't show up after running the script on the server — it was reading a copy stuck at v1.1.9). Before troubleshooting "why didn't my new entry show up," confirm the server actually has an up-to-date `CHANGELOG.md` first — the script itself was working correctly, the file it read was just old.

## Repo layout

- This repo is frontend-only. `au-marketing-api/` is a **nested git repo** (gitlink, mode `160000` per `git ls-files`) containing the FastAPI backend — it has its own commit history and remote, separate from this repo's. Use `git -C au-marketing-api ...` (not plain `git`) to inspect or commit backend changes, and never assume a `git log`/`git status` run from the repo root covers it.
- Copy `.env.example` → `.env`. Key vars: `VITE_API_BASE_URL` (Marketing API, default `:8003`), `VITE_HRMS_RBAC_API_URL` (HRMS auth/RBAC service, default `:8000`). Firebase vars are optional (push notifications).

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

### A disabled feature still lives in the tree
The AI-generated dashboard widgets / report-template feature is currently commented out (not deleted) in both the frontend and `au-marketing-api/app/routers/saved_dashboards.py`. Don't mistake the commented blocks for dead code to clean up — `ai_dashboard_restoration.md` has the exact restore snippets and locations if this feature needs to come back.

## Testing

Vitest + jsdom + React Testing Library, global setup in `src/test/setup.ts`. Coverage is currently limited to smoke tests under `src/test/` — don't assume broader test coverage exists elsewhere before relying on `npm run test:run` to catch a regression.
