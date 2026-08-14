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
- [Orders (Kanban & Inquiry Log)](#orders-kanban--inquiry-log) — rev 1.2.2, 1.2.3, 1.2.7
- [Database — Contacts & Customers Scoping](#database--contacts--customers-scoping) — rev 1.2.7
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

### Rev 14 — 2026-08-14 (v1.2.8)
- **"New Quotation" is now always available in the Log Activity composer, not just for a lead with zero quotations.** Previously it disappeared from the dropdown the moment a lead got its first quote number — so there was no way to add a *second, separate* quotation number at all, only "Revise" (which updates an existing one, not adds a new one). The underlying flow already fully supports this (generate-or-manual per entry, "+ Add to list" for multiple in one go) and already correctly only adopts the *first* quotation as the lead's own `quote_number` — later ones just log as additional quotation entries without disturbing it. Removing the gate was the actual fix; no other logic needed to change.
- Files: `pages/LeadFormPage.tsx`

### Rev 13 — 2026-08-14 (v1.2.8)
- **Fixed a crash on lead creation: `UnboundLocalError: cannot access local variable 'EmployeeRegionAssignment'`.** Introduced in Rev 11 (the on-behalf-of domain check): `EmployeeRegionAssignment` was added as a module-level import, but a leftover local `from app.models import EmployeeRegionAssignment` later in the same `create_lead` function made Python treat the name as local to the *entire* function — so the earlier reference in the new domain check broke, regardless of the top-level import. Removed the now-redundant local import; confirmed no other local shadowing of it remains in the file.
- Files: `au-marketing-api/app/routers/leads.py`

### Rev 12 — 2026-08-14 (v1.2.8)
- **Fixed a redundant "Inquiry 0 (SYSTEM)" placeholder appearing alongside a real quotation entry.** Using the Log Activity composer's "New Quotation" option (added in Rev 9) with a file attached would log the real activity correctly, but the follow-up step that syncs the new number onto the lead itself was blindly triggering pre-existing placeholder-creation logic (originally meant only for a bare number-only edit with no file) — resulting in a confusing duplicate "attach the quotation file here" entry even though the file was already attached. That logic now checks whether a real quotation attachment already exists on the lead first, and skips creating the placeholder if so. The original case it was built for (setting a quote number with no file yet) is unchanged. Verified both cases directly.
- Files: `au-marketing-api/app/routers/leads.py`

### Rev 11 — 2026-08-14 (v1.2.8)
- **Loosened who a Region Coordinator can name when creating a lead on behalf of someone — from "must be in my region" to "must be in my domain."** A Region Coordinator can now file a lead for any employee in their whole domain, not just their own region; a Domain Coordinator's ability to name anyone across their domain was already unrestricted and is unchanged. First pass removed the restriction entirely, then corrected to keep it domain-scoped once clarified. Verified: a region coordinator can name someone in a different region of the same domain, but still can't name someone in a different domain.
- Files: `au-marketing-api/app/routers/leads.py`, `ROLE_SCOPING_RULES.md`

### Rev 10 — 2026-08-14 (v1.2.8)
- **Fixed a real id-space mismatch that could hide subordinates' leads/orders/contacts/customers from a head/coordinator even with a correctly set up org chart.** `Domain.head_employee_id`/`Region.head_employee_id`/`EmployeeRegionAssignment.employee_id` are always the HRMS employee ID, but every create endpoint across the app has always saved `created_by_employee_id` as the Django auth `user_id` instead (pre-existing, not introduced this session — harmless under the old territory-based scoping since it never compared creator identity to org-chart data, but a real gap once creator-chain visibility started depending on it). Rather than changing what 15 create endpoints store (which wouldn't help existing records anyway), `get_chain_visible_creator_ids` now also translates each subordinate's HRMS employee_id to their Django user_id via `MarketingEmployee` (the existing local id-mapping cache) and includes both — no data changes, no creation-code changes. Verified with a mock domain head + subordinate whose employee_id and user_id differ: the subordinate's records are now correctly visible via either id.
- **Caveat**: this only works for people who actually have a `MarketingEmployee` row with `hrms_user_id` populated. If that table is sparse for some employees in production, their records will still be invisible until that row exists — this fix can't invent a mapping that was never recorded anywhere.
- Also fixed a `NameError: name 'user' is not defined` crash on create/update/delete Domain (blocked assigning a Domain Head/Coordinator entirely) and the same typo in `series.py` — see the "Regions, Domains & Employee Sync" section for the full writeup. Documented both this id-space trap and the `log_action` param-name trap in `CLAUDE.md`/`AGENTS.md` so they don't get rediscovered from scratch next time.
- Files: `au-marketing-api/app/scope.py`, `CLAUDE.md`, `AGENTS.md`

### Rev 9 — 2026-08-14 (v1.2.7)
- **"New Quotation" option added to the Inquiry Log's Log Activity composer**, for leads that were created with no quote number and no file at all (previously such a lead had no way to add its first quotation from the log — the option existed in the option list logic but wasn't in the dropdown). It only appears when the lead has no quote number yet and no quotation attached, so it doesn't clutter leads that already have one. Supports generating the number from a series or typing it manually, and — reusing the same "add another" list the composer already had — adding more than one quotation number/file in the same submission. The first number saved is automatically adopted as the lead's own quote number, and the normal Revise Quotation flow picks it up from there with no further changes needed.
- Files: `pages/LeadFormPage.tsx`

### Rev 8 — 2026-08-14 (v1.2.7)
- **On-behalf-of leads now use a narrower, separate visibility rule instead of the normal creator chain (Rev 7).** When a Domain/Region Coordinator files a lead on someone else's behalf, it's now visible only to: the coordinator who actually submitted it, the employee it was filed for, and the Head of the lead's domain — nobody else. Previously (and still, for normal leads) the full chain applied; on-behalf-of leads deliberately skip levels — e.g. a Region Coordinator filing for an Employee no longer makes it visible to the Region Head or Domain Coordinator.
- Added `Lead.on_behalf_of_by_employee_id` / `on_behalf_of_by_username` to record the actual submitter separately from `created_by_employee_id` (which stays the named "for" person) — needed because the two are no longer the same person for on-behalf-of leads. **Requires a migration** (`alembic revision --autogenerate` + `alembic upgrade head`) before this takes effect on the server.
- Files: `au-marketing-api/app/models.py`, `au-marketing-api/app/schemas.py`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/routers/orders.py`, `au-marketing-api/app/scope.py`, `ROLE_SCOPING_RULES.md`

### Rev 7 — 2026-08-14 (v1.2.7)
- **Lead visibility flipped from territory-shared to creator-chain-only.** Previously, any lead automatically became visible to everyone in its domain/region (so a domain head's own lead was visible to their whole domain). Now a lead is visible only to its creator and to whoever is *above* the creator in the chain (Domain Head → Domain Coordinator → Region Head → Region Coordinator/Supervisor → Employee) — never to peers, never to anyone below the creator, and no longer based on the lead's own domain/region. The assignee can still always see it, same as before. Super Admin still sees everything. Example: an employee's lead is visible to that employee plus their Region Coordinator, Region Head, Domain Coordinator, and Domain Head — but not to other employees, even on the same team. A Domain Head's own-created lead is now visible only to that Domain Head.
- This only changes **Leads** — Orders, Contacts, Customers, Organizations, Events, and Dashboard widgets keep their existing territory-based scoping unchanged.
- Files: `au-marketing-api/app/scope.py`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/routers/reports.py`, `ROLE_SCOPING_RULES.md`

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

### Rev 3 — 2026-08-14 (v1.2.7)
- **Order visibility flipped from territory-shared to creator-chain-only**, matching the Leads change in the same revision (see Leads Kanban Rev 7). An order is now visible only to whoever created it (i.e. whoever converted the lead into an order) plus everyone above that creator in the chain (Domain Head → Domain Coordinator → Region Head → Region Coordinator/Supervisor → Employee) — no longer to everyone sharing its domain/region. The assignee can still always see it.
- **Note**: the order's "creator" is whoever clicked "convert to order," not necessarily the original lead's creator — if a manager converts an employee's won lead on their behalf, the employee only keeps visibility into the resulting order if they're also its assignee.
- The lead-access check on order creation (`create_order`) was also fixed to check access to the **lead** via `can_access_lead`, instead of incorrectly reusing the order-shaped `can_access_order` check against lead fields.
- Files: `au-marketing-api/app/scope.py`, `au-marketing-api/app/routers/orders.py`, `ROLE_SCOPING_RULES.md`

### Rev 2 — 2026-08-06 (v1.2.3)
- **Inquiry log redesign**: orders' inquiry log now matches the Leads enquiry log — numbered entries, edit/delete your own entries, attach files after the fact (previously attachments only at creation).
- Files: `pages/OrderFormPage.tsx`, `pages/LeadsPage.tsx` (shared patterns), `lib/marketing-api.ts`

### Rev 1 — 2026-08-05 (v1.2.2)
- **Card redesign**: removed hover tooltip — phone, email, Won date now on the card face; extracted shared `OrderKanbanCard` used by both "no status" and grouped columns (removed a ~65-line duplicate); columns widened (`w-72`→`w-80`), larger padding/text.
- **Smooth scroll & scrollbar fix**: board now bleeds to full container width (removes gray padding "pillar"); auto-scroll when dragging near edges.
- Files: `pages/OrdersPage.tsx`

---

## Database — Contacts & Customers Scoping

### Rev 1 — 2026-08-14 (v1.2.7)
- **Contact/Customer visibility flipped from territory-shared to creator-chain-only**, matching the Leads/Orders change in the same revision. Previously Domain/Region Heads saw every contact and customer in their domain/region regardless of who created it; employees were already isolated to their own. Now a record is visible only to whoever created it, plus everyone above that creator in the chain (Domain Head → Domain Coordinator → Region Head → Region Coordinator/Supervisor → Employee). The assignee override still applies — `assigned_to_employee_id` on Contact, and `account_manager_employee_id` on Customer (Customer has no `assigned_to_employee_id` field, so account manager is its equivalent override).
- **Not changed**: Organizations & Plants still use their own domain-derived scoping (linked contact/customer's domain), independent of this rule — flagged in `ROLE_SCOPING_RULES.md` as a follow-up worth reversing too if wanted.
- Files: `au-marketing-api/app/scope.py`, `au-marketing-api/app/routers/contacts.py`, `au-marketing-api/app/routers/customers.py`, `ROLE_SCOPING_RULES.md`

---

## Dashboard, Reports & Performance Leaderboard

### Rev 10 — 2026-08-14 (v1.2.8)
- **Gated the new role dashboards behind a `DASHBOARD_LIVE` flag** in `RoleDashboardRouter.tsx`, currently `false`. These files are being pushed ahead of the feature being finished (separately from the urgent scope/domains fixes going out in the same push), so every user — including Super Admin — now sees a plain "Dashboard is in development" screen instead of the half-built dashboards. No API call is made while gated. Flip the one flag to `true` when it's actually ready to launch.
- Files: `pages/dashboards/RoleDashboardRouter.tsx`

### Rev 9 — 2026-08-14 (v1.2.8)
- **High Value Leads now also counts quotation value, not just the lead's own Potential Value field.** A lead with a low/empty Potential Value but a quotation attached worth over ₹50L now correctly shows up — previously it only checked `Lead.potential_value`, so a real high-value deal could be invisible to this widget if the big number only ever got entered as a quotation rather than the lead's potential value field. Each entry now shows which figure qualified it ("Potential value" vs "From quotation"). Verified: a lead with only a big potential_value, a lead with only a big quotation, and a lead with neither — each behaves correctly.
- Files: `au-marketing-api/app/routers/dashboard.py`, `lib/marketing-api.ts`, `components/dashboard/HighValueLeadsList.tsx`

### Rev 8 — 2026-08-14 (v1.2.8)
- **Monthly Target Progress & Performer of the Month → compact KPI-tile style**, matching the small stat cards (label, big value, subtitle, icon) instead of taller standalone cards. Performer of the Month now shows just the #1 performer as the headline (name, value, won count) rather than a 5-row list — trades the runner-up detail for a card that actually reads as a KPI at a glance. Both moved out of the large chart rows into the compact card rows alongside the other stat tiles on all 4 dashboards.
- Files: `components/dashboard/TargetProgressBar.tsx`, `PerformerOfMonthCard.tsx`, `pages/dashboards/*.tsx`

### Rev 7 — 2026-08-14 (v1.2.8)
- **Redid all dashboard chart visuals against the `dataviz` skill's method instead of ad-hoc styling** — the previous colors/marks weren't run through any real validation. New shared `components/dashboard/chartTokens.ts`: a validated categorical palette (this app's own brand blue as slot 1, `node scripts/validate_palette.js` confirms it still passes CVD/contrast checks with the reference order's other 7 hues), a color-by-entity hash so a status/source keeps the same color regardless of row order, and shared chrome tokens (solid hairline gridlines, muted axis text) replacing the previous dashed grids and ad-hoc grays.
- **LeadStatusChart & LeadSourceChart**: pie donuts → horizontal bar charts. A donut with 7+ slices (a real lead-status pipeline easily has that many) is a known anti-pattern for comparing values — a ranked bar with a direct count label at the tip reads faster and scales past 6 categories cleanly.
- **RevenuePipelineChart**: was 3 unrelated hues (green/blue/gray) for Pipeline/Committed/Achieved — recognized this is actually a funnel (Pipeline ⊇ Committed ⊇ Achieved), not nominal categories, so switched to one hue light→dark (validated with `--ordinal`), which is what an ordered sequence should use.
- **RegionBreakdownChart**: Won/Lost now use the fixed status palette (good/critical) instead of generic categorical colors, since they're a status pairing, not arbitrary series identity; added the 2px surface-color gap between the stacked segments instead of them touching directly.
- Removed `tabular-nums` from the large stat-card and target-progress numbers (equal-width digits make a big standalone number look loose at display size — reserved for table/axis columns instead, where it's still correct).
- Files: `components/dashboard/chartTokens.ts` (new), `components/dashboard/LeadStatusChart.tsx`, `LeadSourceChart.tsx`, `RevenuePipelineChart.tsx`, `RegionBreakdownChart.tsx`, `MonthlyTrendChart.tsx`, `DashboardStatCard.tsx`, `TargetProgressBar.tsx`

### Rev 6 — 2026-08-14 (v1.2.8)
- **Super Admin dashboard switcher**: a segmented control (Super Admin / Domain Head / Region Head / Employee) lets Super Admin instantly preview any of the 4 dashboard layouts without logging in as another user. Clearly labeled as a layout preview using their own org-wide data — not that role's actual scoped numbers (true "view as" impersonation would need separate auth work).
- **Closed the gap against the original per-role dashboard spec** (`scripts/seed_demo_data.py`'s `seed_dashboards()`, the widget lists originally envisioned for each role before the dynamic system existed). Added to the new `role-summary` endpoint and wired into the relevant dashboards: Conversion Rate (all roles), Revenue Pipeline — Achieved/Committed/Pipeline 3-bucket view (Domain Head), Avg Open Lead Age (Domain Head), Hot Leads count (all roles), Follow-ups Due "Act Now" list (Employee, Region Head), Lead Source breakdown (Region Head, Super Admin), High Value Leads >₹50L (Super Admin). Skipped two items from the original spec as noted bugs: a duplicated "Lead Sources" widget and a "Conversion Trend" chart that was actually mislabeled domestic-vs-export volume.
- Still deferred: stage-grouped (not just status) lead breakdown, Active Deals (negotiation-stage) table, quotation revision stats, follow-up activity cadence chart, target burn-up, Top Won Customers, Region Performance (achieved vs. potential).
- New shared components: `RevenuePipelineChart`, `FollowUpsDueList`, `LeadSourceChart`, `HighValueLeadsList`.
- Files: `au-marketing-api/app/routers/dashboard.py`, `lib/marketing-api.ts`, `pages/dashboards/*`, `components/dashboard/*`

### Rev 5 — 2026-08-14 (v1.2.8)
- **Replaced the customizable dashboard with 4 hardcoded, role-specific dashboards** — Employee, Region Head, Domain Head, Super Admin — each its own file, no more Add Widget / drag-drop / custom SQL / multiple saved dashboards. The `/` route now renders `RoleDashboardRouter`, which fetches one data payload and picks the right dashboard by role.
- **New backend endpoint `GET /dashboard/role-summary`** is the single data source for all 4: leads/orders/contacts/customers figures are computed using the *same creator-chain scoping* as the Leads/Orders/Contacts/Customers pages (`apply_scope_to_lead_query`/`apply_scope_to_order_query`/`apply_scope_to_contact_customer_query`), so a Region Head's dashboard numbers now always match what they can actually open on those pages — no more mismatch. Monthly target still uses the existing domain/region administrative lookup (targets aren't "created by" records, so the creator-chain reversal doesn't apply there). Verified against a mock org chart + sample leads/orders/contacts (creator-chain totals, status breakdown, monthly trend, recent leads all matched expected values exactly).
- New shared chart components in `components/dashboard/` (stat cards, target progress bar, lead-status pie chart, monthly trend area chart, recent leads list, performer-of-month card, region breakdown bar chart) built on `recharts`, reused across all 4 dashboards.
- **Not done in this pass**: the old dynamic `DashboardPage.tsx` and its backend (`saved_dashboards.py`'s widget/custom-SQL machinery, `SavedDashboard`/`SavedDashboardAssignment` tables) are now unreachable (no route points to them) but not yet deleted — kept as a safety net until the new dashboards are confirmed working in production. Head Summary's region breakdown and Performer of the Month still read from their original endpoints, which remain on the *old* territory-based scope (not yet migrated to creator-chain) — a known follow-up. Audit Log widget deferred entirely.
- Files: `au-marketing-api/app/routers/dashboard.py`, `lib/marketing-api.ts`, `App.tsx`, `components/dashboard/*` (new), `pages/dashboards/*` (new)

### Rev 4 — 2026-08-14 (v1.2.8)
- **Prep step for the planned hardcoded-dashboard rebuild**: extracted the SQL-template scoping helpers (`_scope_context`, `_compile_sql_template`, `_run_sql_query`, `_validate_sql`, `_normalize_date_range` — the mechanism that fills `{{employee_id}}`/`{{domain_id}}`/etc. placeholders into saved SQL with the current viewer's scope before running it) out of `saved_dashboards.py` into a new standalone `sql_template_utils.py`. Report Templates was importing these directly from the dashboard router's internals; now both import from the same independent module, so the planned removal of the dynamic dashboard's custom-SQL system won't take Report Templates down with it. Pure refactor — no behavior change, verified by re-running the import chain (`app.main`) cleanly.
- Files: `au-marketing-api/app/sql_template_utils.py` (new), `au-marketing-api/app/routers/saved_dashboards.py`, `au-marketing-api/app/routers/report_templates.py`

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

### Rev 4 — 2026-08-14 (v1.2.8)
- **Fixed "name 'user' is not defined" crash on create/update/delete Domain** — a pre-existing typo (unrelated to this session's scoping work): the audit-log call referenced an undefined `user` variable instead of the endpoint's actual dependency parameter, `user_info`. This blocked assigning a Domain Head/Coordinator entirely, since the update always crashed before saving. Also fixed the same exact typo in `series.py` (numbering series create/update/delete), found doing a full sweep of every router for the same pattern — no other files affected.
- Files: `au-marketing-api/app/routers/domains.py`, `au-marketing-api/app/routers/series.py`

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
