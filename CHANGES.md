# CHANGES.md — Developer Feature Revision Log

> **Internal-only** history of every change to the S&M Hub, grouped **by feature** rather than by release date.
> Unlike `CHANGELOG.md` (client-facing release notes, one entry per version), this is the dev-side log: whenever a feature is touched again, it gets a **new revision** under its existing section, with date + version, instead of a fresh one-off note.

This file complements, and does **not** replace, the `CHANGELOG.md` conventions (both root and `au-marketing-api/CHANGELOG.md` must still be updated per that convention).

## How to update this file (Claude must follow this)

1. On **every** change — frontend, backend, tooling, or script — update this file **in the same turn as the code**.
2. Find the feature section the change belongs to (index below). If none exists, create one and add it to the index.
3. Add a new revision block **at the TOP** of that section, bumping the revision number:
   ```markdown
   ### Rev N — YYYY-MM-DD (vX.Y.Z)
   - Short plain-language description of what changed.
   - Files: `path/to/file.tsx`, `au-marketing-api/app/routers/leads.py`, ...
   ```
4. **Never create a second section for the same feature** — always add a revision to the existing one. This keeps per-feature history in one place.
5. Root copy only — do **not** mirror into `au-marketing-api/CHANGES.md`.

## Feature index

- [Leads Kanban](#leads-kanban) — rev 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.2.7
- [Quotations & Quote Numbers](#quotations--quote-numbers) — rev 1.2.3, 1.2.5, 1.2.6
- [Orders (Kanban & Inquiry Log)](#orders-kanban--inquiry-log) — rev 1.2.2, 1.2.3
- [Dashboard, Reports & Performance Leaderboard](#dashboard-reports--performance-leaderboard) — rev 1.2.0, 1.2.1, 1.2.5
- [Who's Online / Presence](#whos-online--presence) — rev 1.2.0, 1.2.1
- [Regions, Domains & Employee Sync](#regions-domains--employee-sync) — rev 1.2.0, 1.2.4, 1.2.5
- [Quotations Page (list & filters)](#quotations-page-list--filters) — rev 1.2.1, 1.2.2
- [DSR (Daily Status Reports)](#dsr-daily-status-reports) — rev 1.2.7
- [Audit Log](#audit-log) — rev 1.2.7
- [Global UI, Formatting & Bug Fixes](#global-ui-formatting--bug-fixes) — rev 1.2.2, 1.2.3, 1.2.5
- [Tooling & Scripts](#tooling--scripts) — rev 1.2.1, 1.2.6
- [Design System Documentation](#design-system-documentation) — rev 1.2.6

---

## Leads Kanban

### Rev 6 — 2026-08-13 (v1.2.7)
- **Assigned To properly gated & scoped**: the field is now only available to users who can actually assign (super admin / domain head / region head; hidden for region coordinators, supervisors, employees) and lists only their own team via the reports scope — not the whole company directory. The backend independently enforces the same rule on create/update.
- **Simpler lead form**: sections reordered (enquiry details → quotation), every section has a plain-language description, and "Through" / "Referred By" each show a short hint right next to their label ("Where the enquiry came from." / "Who sent this lead to you.").
- Files: `pages/LeadFormPage.tsx`, `components/ui/Select.tsx`, `ROLE_SCOPING_RULES.md`

### Rev 5 — 2026-08-10 (v1.2.5)
- Follow-up-highlighted cards now show a **steady** colored halo instead of a pulsing/blinking glow — urgency stays easy to spot without the distracting motion.
- Files: `pages/LeadsPage.tsx`

### Rev 4 — 2026-08-09 (v1.2.4)
- **Card cleanup**: removed the "Source" line and lead-type badge; merged "Next follow-up" + "Last inquiry" into a single "Next follow-up" line.
- **Automatic follow-up highlighting**: leads whose status carries a "follow up every N days" rule but no manually scheduled follow-up now get the same graded urgency highlighting as manually scheduled ones (previously only manual dates highlighted).
- Files: `pages/LeadsPage.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/follow_up.py`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/routers/tasks.py`, `au-marketing-api/app/scope.py`

### Rev 3 — 2026-08-06 (v1.2.3)
- **Plant field fix**: cards were showing "No plant" even when a plant was selected — the card read the wrong field name; now reads the correct one.
- Files: `pages/LeadsPage.tsx`

### Rev 2 — 2026-08-05 (v1.2.2)
- **Graded follow-up urgency highlighting**: red (overdue) / orange (today) / amber (tomorrow) / yellow (this week) / blue (later), each with a looping glow-pulse + "· Overdue"/"· Today" label — replaces the single amber "due" state.
- **Follow-up date picker timezone fix** (`LeadFormPage`): the custom follow-up picker displayed the wrong hour/minute because it built its value from a UTC ISO string instead of local time — display fixed (saved value was always correct).
- Files: `pages/LeadsPage.tsx`, `pages/LeadFormPage.tsx`, `components/ui/DatePicker.tsx` (indirect), `lib/marketing-api.ts`

### Rev 1 — 2026-08-04 (v1.2.1)
- **Card redesign**: phone, email, domain/region/lead-type badges, source, contact designation/location, plant name now shown directly on the card (previously only in a hover tooltip); every field renders with a muted placeholder when empty; quote number as a badge with a "view latest attachment" icon (fetched on click, not per card); owner shown only to `marketing.admin`.
- Removed the hover tooltip + dead `getFileTypeIcon` helper/imports; widened columns (`w-72`→`w-80`); board bleeds to page edge; smooth auto-scroll when dragging near edges.
- Files: `pages/LeadsPage.tsx`

---

## Quotations & Quote Numbers

### Rev 3 — 2026-08-11 (v1.2.6)
- **Quote number stays visible** when uploading a quotation file — picking a file no longer wipes the generated/typed number.
- **No duplicate quote numbers**: generated numbers (numbering series) and manually typed numbers are now committed separately at save — the series counter advances exactly once; manual numbers stored as typed.
- **File-less quotation values count toward targets**: quotation rows without a file carry a value counted the same as file-based ones; value can be added/edited directly from the enquiry log after the lead is created.
- **Backend**: `ActivityAttachment` gains `quote_value`; new endpoint to update a quotation's value without touching its file; create payload handles file-less values + `extra_quote_values`.
- Files: `pages/LeadFormPage.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/schemas.py`

### Rev 2 — 2026-08-10 (v1.2.5)
- **Multiple quote numbers without files**: a lead can register more than one quotation number before any file is uploaded — file-less quotation rows can have a file attached later without retyping the number.
- Quotations without a file now show "No file yet" instead of "Media Missing"; attachment file fields made optional.
- Files: `pages/LeadFormPage.tsx`, `pages/LeadsPage.tsx`, `pages/EnquiryQuotationsPage.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/schemas.py`, `au-marketing-api/app/storage.py`

### Rev 1 — 2026-08-06 (v1.2.3)
- **Auto quote-number placeholder ("Inquiry 0")**: creating/editing a lead with a quote number but no quotation file auto-creates a system entry in the enquiry log holding that number; attaching a file to it reuses the lead's existing quote number (no series/number selection needed).
- Files: `pages/LeadFormPage.tsx`, `au-marketing-api/app/routers/leads.py`

---

## Orders (Kanban & Inquiry Log)

### Rev 2 — 2026-08-06 (v1.2.3)
- **Inquiry log redesign**: orders' inquiry log now matches the Leads enquiry log — numbered entries, edit/delete your own entries, attach files after the fact (previously attachments only at creation).
- Files: `pages/OrderFormPage.tsx`, `pages/LeadsPage.tsx` (shared patterns), `lib/marketing-api.ts`

### Rev 1 — 2026-08-05 (v1.2.2)
- **Card redesign**: removed hover tooltip — phone, email, Won date now on the card face; extracted shared `OrderKanbanCard` used by both "no status" and grouped columns (removed a ~65-line duplicate); columns widened (`w-72`→`w-80`), larger padding/text.
- **Smooth scroll & scrollbar fix**: board now bleeds to full container width (removes gray padding "pillar"); auto-scroll when dragging near edges.
- Files: `pages/OrdersPage.tsx`

---

## Dashboard, Reports & Performance Leaderboard

### Rev 3 — 2026-08-10 (v1.2.5)
- **Role-scoped stats & widgets**: Leads/Contacts/Customers summary cards now state the scope ("In my scope" / "Domestic scope") instead of "Total in system"; leadership-only widgets (head summary, leads by region, quotation-submitted chart) and the audit-log widget are hidden from roles that can't view that data.
- **Performer of the Month** now ranks only people in your own scope (domain head → their domains; region head/employee → their regions) instead of company-wide.
- Files: `pages/DashboardPage.tsx`, `pages/DomainsPage.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/routers/dashboard.py`

### Rev 2 — 2026-08-04 (v1.2.1)
- **Top Performer month-to-date window**: `performer-of-month`'s date filter now runs through `end = now` instead of start-of-next-month (same result, now explicitly correct).
- Files: `au-marketing-api/app/routers/dashboard.py`

### Rev 1 — 2026-08-03 (v1.2.0)
- **Top Performer ranking fixes**: ties broken by achievement % → won count → achieved value → name (previously arbitrary); a "performer" with zero won deals is no longer shown.
- Files: `au-marketing-api/app/routers/dashboard.py`

---

## Who's Online / Presence

### Rev 2 — 2026-08-04 (v1.2.1)
- **Reconnecting WebSocket**: presence panel socket auto-reconnects with exponential backoff (1s→2s→4s→15s cap + jitter); 15s REST polling fallback keeps the panel live while reconnecting.
- **Record labels**: panel + Live Activity now show which record someone's viewing ("Editing Lead — Acme Corp") via new `lib/presence-label-store.ts`; backend `POST /api/presence/ping` accepts an optional `label`.
- Files: `components/ui/PresencePanel.tsx`, `pages/LiveActivityPage.tsx`, `pages/LeadFormPage.tsx`, `hooks/usePresence.ts`, `lib/presence-label-store.ts`, `lib/presence-utils.ts`, `lib/marketing-api.ts`, `au-marketing-api/app/presence.py`, `au-marketing-api/app/routers/presence.py`

### Rev 1 — 2026-08-03 (v1.2.0)
- **Live presence panel** added: who's online with page categories; **fixed `NameError: name 'user' is not defined`** on employee/region assignment endpoints (region assignment, update, remove, delete region) — `log_action(current_user=user, ...)` referenced a stale variable, now `current_user=user_info`.
- Files: `components/ui/PresencePanel.tsx`, `pages/LiveActivityPage.tsx`, `hooks/usePresence.ts`, `lib/presence-utils.ts`, `App.tsx`, `components/ui/Navbar.tsx`, `components/layout/DashboardLayout.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/routers/regions.py`, `au-marketing-api/app/routers/employees.py`

---

## Regions, Domains & Employee Sync

### Rev 3 — 2026-08-10 (v1.2.5)
- **Database role-value fix**: database was missing the "coordinator" enum value the app already uses (could break lead/event saves) — values patched, with a safe one-time patch script (`scripts/patch_enum_values.py` + `.server-operator/patch_enum_values.serop`).
- Files: `au-marketing-api/app/models.py`, `au-marketing-api/app/routers/regions.py`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/scripts/patch_enum_values.py`

### Rev 2 — 2026-08-09 (v1.2.4)
- **Employee sync**: employees who only appear as a lead's owner/creator (no region assignment of their own) now get real names in assignee filters — sync now covers lead owners/creators.
- **Deletion blocked by removed employees**: removing an employee from a region (or replacing a domain head/coordinator) now fully detaches them so regions/domains can be deleted; previously a hidden link remained.
- **Multiple coordinators**: regions can now have more than one Coordinator (same region-wide access); Edit Region shows everyone assigned (Head/Coordinators/Supervisors/Employees) with add/remove; a region with assigned staff can't be deleted until they're removed.
- Files: `au-marketing-api/app/routers/employees.py`, `au-marketing-api/app/routers/regions.py`, `au-marketing-api/app/routers/domains.py`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/models.py`, `au-marketing-api/app/scope.py`, `au-marketing-api/app/schemas.py`, `au-marketing-api/app/routers/reports.py`, `au-marketing-api/app/routers/saved_dashboards.py`, `au-marketing-api/app/routers/report_templates.py`, `au-marketing-api/app/routers/dashboard.py`, `au-marketing-api/app/routers/auth.py`, `au-marketing-api/migrations/env.py`, `au-marketing-api/requirements.txt`

### Rev 1 — 2026-08-03 (v1.2.0)
- **Region → Employee Assignment `NameError` fix** (see Who's Online rev 1 for the same shared fix): assign/update/remove/delete region endpoints crashed with `NameError: name 'user' is not defined`.
- Files: `au-marketing-api/app/routers/regions.py`

---

## Quotations Page (list & filters)

### Rev 2 — 2026-08-05 (v1.2.2)
- **Filters panel fixes**: fixed bottom-right corner rendering as a sharp edge (fractional-position rounding); panel enlarged (300px → 420px, larger inputs) and nudged right.
- Files: `pages/EnquiryQuotationsPage.tsx`, `components/ui/FilterPopover.tsx`

### Rev 1 — 2026-08-04 (v1.2.1)
- **Pagination**: quotations table now pages (page/page-size controls) instead of loading every row at once.
- **Admin-gated filters**: Domain/Region filters now require `marketing.admin` on frontend and backend (was a raw `is_superuser` check); Series dropdown lists all active series system-wide; fixed clipped series dropdown list.
- **Response-shape guard**: page degrades gracefully if backend hasn't picked up the paginated envelope yet.
- Files: `pages/EnquiryQuotationsPage.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/routers/quotations.py`

---

## DSR (Daily Status Reports)

### Rev 1 — 2026-08-13 (v1.2.7)
- **Enquiry logs at a glance**: the Leads and Orders logs now render as full-width table-style rows (cards stacked, not side-by-side); lead rows show potential value, expected closing date, enquiry source ("Through"), and assignee; order rows show assignee and expected delivery date. Clicking a row opens that lead/order.
- **View another employee's logs**: users with `marketing.admin` get an Employee dropdown to view that person's DSR tasks, leads, and orders for the selected period (leads/orders filtered via `assigned_to`, DSR via the HRMS `username` param).
- Files: `pages/DSRPage.tsx`

---

## Audit Log

### Rev 1 — 2026-08-13 (v1.2.7)
- **Lost leads log correctly**: marking a lead as Lost now records the audit action as `lost` instead of `edit`.
- **Expected orders & OD Plans tracked**: creating an expected order report and saving an OD Plan now write audit-log entries (`action=create`/`edit`, `entity_type=expected_order_report`/`od_plan`) with the lead/entry counts.
- Files: `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/routers/reports.py`

---

## Global UI, Formatting & Bug Fixes

### Rev 3 — 2026-08-10 (v1.2.5)
- **Consistent DD/MM/YYYY date format** across the app (with time where relevant) instead of the browser's default locale format.
- Files: `components/ui/DatePicker.tsx`, `index.html` (font), various pages

### Rev 2 — 2026-08-06 (v1.2.3)
- **Comma-formatted value fields**: potential/quote/closed/order values, event costs, and yearly targets now show Indian-style grouping (e.g. 1,00,000) as you type, via new `components/ui/CurrencyInput.tsx`.
- Files: `components/ui/CurrencyInput.tsx`, `pages/DomainsPage.tsx`, `pages/EventDetailPage.tsx`, `pages/LeadFormPage.tsx`, `pages/LeadsPage.tsx`, `pages/OrderFormPage.tsx`, `lib/marketing-api.ts`

### Rev 1 — 2026-08-05 (v1.2.2)
- **Global paste sanitizer**: pasting styled/fancy Unicode (bold/italic/script/fullwidth look-alikes) into any input now normalizes to plain characters; genuine accented text (café, Müller) untouched — single global paste listener in `lib/paste-sanitizer.ts`.
- **Profile pictures fixed**: HRMS `profile_picture` is a relative path (Django `ImageField.url`) — added `resolveHrmsMediaUrl()` so navbar/sidebar/Who's Online/Live Activity load it from HRMS's origin.
- **Top nav search bar spacing**: added the missing 64px left padding so the search box aligns with page content.
- **Shared-table robustness**: `DataTable` defaults `data` to `[]` instead of crashing on `undefined`/`null`.
- Files: `App.tsx`, `lib/paste-sanitizer.ts`, `lib/hrms-rbac.ts`, `components/ui/Navbar.tsx`, `components/ui/FilterPopover.tsx`, `components/ui/PresencePanel.tsx`, `pages/LiveActivityPage.tsx`, `components/ui/DataTable.tsx`, `index.html`

---

## Tooling & Scripts

### Rev 2 — 2026-08-11 (v1.2.6)
- Added `scripts/fix_empty_enquiry_log.py` — one-time data-repair script for quotation rows that lost their value/number when file-less quotation support landed.
- Files: `au-marketing-api/scripts/fix_empty_enquiry_log.py`

### Rev 1 — 2026-08-04 (v1.2.1)
- `scripts/populate_changelog.py` now prints exactly which versions were newly added vs. already-existed-and-refreshed.
- Files: `au-marketing-api/scripts/populate_changelog.py`

---

## Design System Documentation

### Rev 1 — 2026-08-12 (v1.2.6)
- Rewrote `design.md` from the live component source after an audit found most of its component specs no longer matched the code. Doc-only change — no code or UI was modified.
- **Root cause**: the old doc's Button/Select/Input/Breadcrumb specs described `UI/*` files, but every page imports `components/ui/*` — two directories with the same filenames holding different components. Added a verified import-count table so it's clear which directory is live (`UI/` is dead except `Tooltip` and `Switch`).
- **Corrections**: buttons have no `active:scale` and use `transition-colors`; controls are `h-10 rounded-lg`, not `h-11 rounded-xl`; Card's 1.25rem radius is an inline style; Card description is `text-[11px] text-slate-400`; Modal has no backdrop blur and its title has no size class; Breadcrumb auto-prepends a Home crumb; Badge's danger variant is named `error` and has no `info`. Removed the `StatCard` spec — no such component exists in the repo.
- **Reinstated as real**: the doc previously claimed arbitrary pixel sizes and `tracking-widest` were unused. They are used ~280 and ~70 times respectively and form the "micro-label" pattern, now documented as a first-class part of the system.
- **New sections**: §0 explains that there is no Tailwind build (browser CDN, stock defaults, no config, globals inline in `index.html`); §12 documents the two scrollbar treatments; §15 lists known inconsistencies left in place deliberately.
- **Flagged, not fixed**: `components/ui/Button.tsx` relies on `ring-ring` / `ring-offset-background`, which are undefined without a Tailwind config — buttons currently render no visible focus ring. Also documented that ~29 `animate-in` / `zoom-in-95` usages are inert because `tailwindcss-animate` isn't installed.
- Files: `design.md`
