# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

S&M Hub frontend — a React 19 + TypeScript + Vite 6 SPA for Aureole Group's Sales & Marketing module: leads, orders, quotations, contacts/organizations/customers, domains & regions (org hierarchy), events/exhibitions, team performance/targets, DSR (daily status reports). `design.md` and `UI_COMPONENTS_LIBRARY.md` are the authoritative design-token/component-pattern references — consult them when building UI rather than guessing at colors/spacing.

### How the system fits together
Three independent backends, talked to directly from the browser — there is no BFF/proxy layer:
- **Marketing API** (FastAPI + SQLAlchemy + PostgreSQL, submodule at `au-marketing-api/`, default `:8003`) — all business CRUD (leads, orders, events, etc.), ~24 routers / 150+ endpoints. Also runs an APScheduler background worker (reminders, notifications) and re-validates permissions against HRMS on every request (5-min cache).
- **HRMS RBAC** (external, default `:8000`) — login, JWT issuance, permissions/roles/scope. The Marketing API is *not* the source of truth for auth.
- **Firebase Cloud Messaging** (optional) — web push notifications, plus a legacy OneSignal path.

Auth flow: browser POSTs credentials to HRMS RBAC → gets JWT + permissions/roles → stored in Redux (`authSlice`) and `localStorage` → every subsequent Marketing API call sends the JWT, and the Marketing API independently calls back to HRMS to verify the permission for that route (not just trusting the frontend's claim).

### Frontend structure
- `App.tsx` — root: React Router setup (all routes registered here), `AppContext` (toast/notifications/demo-mode), providers.
- `pages/` — ~34 route-level components, one per URL (Leads, Orders, Domains, Events, Settings, Reports, etc.). Most list pages follow a kanban-and/or-table pattern with a paired `*FormPage.tsx` for create/edit.
- `components/layout/` — `DashboardLayout`, `DatabaseLayout`, `PageLayout` (page chrome/sidebar/breadcrumbs); `components/ui/` — ~28 shared building blocks (DataTable, Modal, Button, Sidebar, etc.); `UI/` — lower-level atoms (Button, Input, Badge, Tooltip).
- `lib/api.ts` — base `APIClient` (fetch wrapper, XHR upload-progress, 401 handling, `ApiError`). `lib/marketing-api.ts` — the single `marketingAPI` object with ~150 typed methods + every request/response TS interface for the Marketing API. `lib/hrms-rbac.ts` — HRMS auth client. `lib/firebase-push.ts` — FCM registration.
- `store/` — Redux Toolkit: `authSlice` (token/user/permissions), `dsrSlice`, `organizationPlantsSlice`, plus `middleware.ts` handling forced logout on token expiry. (Zustand is used separately for calendar-local state, not global app state.)
- `components/ProtectedRoute.tsx` — route guard: redirects to `/login` if unauthenticated, renders an "Access Denied" screen if the route's `requiredPermission`/`requireAnyPermission`/`requireAllPermissions` prop isn't satisfied.

## Commands

- `npm run dev` — Vite dev server on :3000
- `npm run build` — runs `tsc && vite build`; typechecking is part of the build. Run `npx tsc --noEmit` alone for a faster type check without bundling.
- `npm run test` — Vitest in watch mode
- `npm run test:run` — Vitest single run (CI)
- `npm run test:ui` — Vitest UI
- Single test file: `npx vitest run path/to/file.test.ts`
- No lint script/config exists in this repo (no ESLint/Prettier) — `tsc --noEmit` is the only automated correctness check.

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

## Testing

Vitest + jsdom + React Testing Library, global setup in `src/test/setup.ts`. Coverage is currently limited to smoke tests under `src/test/` — don't assume broader test coverage exists elsewhere before relying on `npm run test:run` to catch a regression.
