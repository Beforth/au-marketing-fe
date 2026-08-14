# CHANGES.md — Developer Feature Revision Log

> **Internal-only** history of every change to the S&M Hub, grouped **by feature** rather than by release date.
> Unlike `CHANGELOG.md` (client-facing release notes, one entry per version), this is the dev-side log: whenever a feature is touched again, it gets a **new revision** under its existing section, with date + version, instead of a fresh one-off note.

This file complements, and does **not** replace, the `CHANGELOG.md` conventions (both root and `au-marketing-api/CHANGELOG.md` must still be updated per that convention). It also complements `ISSUES.md` — the full plain-language writeup (what was reported, root cause, fix, edge cases) for any bug fix belongs there; this file just gets the short version tagged `[Issue]`.

## How to update this file (Claude must follow this)

1. On **every** change — frontend, backend, tooling, or script — update this file **in the same turn as the code**.
2. Find the feature section the change belongs to (index below). If none exists, create one and add it to the index.
3. Add a new revision block **at the TOP** of that section, bumping the revision number, and tag it `[Issue]` or `[Revision]` right after the version:
   ```markdown
   ### Rev N — YYYY-MM-DD (vX.Y.Z) — [Issue]
   - Short plain-language description of what changed.
   - Files: `path/to/file.tsx`, `au-marketing-api/app/routers/leads.py`, ...
   ```
   Use **`[Issue]`** for a bug fix — something that was reported (by the client or found internally) and broken, working incorrectly, or missing that should have existed. Use **`[Revision]`** for planned/requested feature work, redesigns, or scope changes that weren't a bug. A block can mix both if it genuinely contains both kinds of changes — say so in the text rather than picking one tag to hide the other.
4. **Never create a second section for the same feature** — always add a revision to the existing one. This keeps per-feature history in one place.
5. Root copy only — do **not** mirror into `au-marketing-api/CHANGES.md`.

## Feature index

- [Leads Kanban](#leads-kanban) — rev 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5, 1.2.7
- [Quotations & Quote Numbers](#quotations--quote-numbers) — rev 1.2.3, 1.2.5, 1.2.6, 1.2.8
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

### Rev 15 — 2026-08-14 (v1.2.8)
- **A bare lead (no quote number, no file) now shows a real "Inquiry #0" quotation card automatically** at the top of its Enquiry Log — no need to log a Call/Note first and stumble into the composer's "New Quotation" mode as a side effect. Generate-from-series or type manually, attach the file, add more than one in the same action ("+ Add another quotation"). Saving sets the lead's quote number (which is what makes the backend create the real Inquiry 0 entry) and attaches every quotation to it in one upload.
- **Known tradeoff**: clicking "Generate" on a row commits that number from the series immediately, not as a cancelable preview — if the form is abandoned after generating, that number is used up. The Log Activity composer's equivalent flow defers commit until save; this one doesn't, for simplicity across multiple rows. Revisit if this becomes a real problem.
- Files: `pages/LeadFormPage.tsx`

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

### Rev 6 — 2026-08-14 (v1.2.8) — [Issue]
- **Fixed the "Attach quotation file" button/label still showing after a quotation already has a file attached**, making it look like something was missing on Inquiry #0 even when it wasn't. The button is intentionally always present (it lets you add another quotation later), but its label was hard-coded to always say "Attach quotation file" for Inquiry #0 regardless of state — now it reads "Add another quotation" once a real file is already attached, matching how every other log entry's equivalent button ("Add attachments") already reads fine either way.
- See `ISSUES.md` for the full writeup.
- Files: `pages/LeadFormPage.tsx`

### Rev 5 — 2026-08-14 (v1.2.8) — [Issue] + [Revision]
- **[Issue] Fixed the Enquiry log showing stale data right after saving a quotation from the "Inquiry #0 / System Quote" box** — e.g. a file the user had just attached could still show a "+ Attach quotation file" prompt immediately after save, even though it was correctly saved server-side (confirmed via direct DB check). Root cause: `loadActivities` didn't `return` its fetch promise, so `await loadActivities()` resolved immediately without actually waiting for the refreshed activity/attachment data — the "Saving…" state cleared and the UI re-rendered using data from before the save. Fixed by returning the promise chain.
- **[Revision] Reworked the "Inquiry #0 / System Quote" box to a review-list pattern**, matching the create-lead form's quotation UX: fill in a series/generated-or-manual number, value, and file, click **"+ Add to list"** to stage it (reviewable, removable), repeat for more, then a single **"Save quotation"** commits everything in the list together. Previously "Save quotation" acted on the currently-filled row(s) directly with no staging/review step, and multi-row support meant separate always-editable rows rather than a confirmed list. Requested by the client to be able to review/build a batch before it actually saves.
- **[Revision] "Generate" is now a true preview, same as the create-lead form (Rev 15's tradeoff, now closed here too).** Clicking it no longer reserves a real number immediately — it only shows what the next number would look like. Real numbers are only reserved, for every entry in the list together, atomically, at the moment "Save quotation" is clicked — the primary's real number comes back from the same `updateLead` call that sets it on the lead (sending its series code, not a stale literal), and every other generated entry in the list is grouped by series and generated fresh in the same upload call, mirroring the create-lead form's `generatedBySeries` batching exactly. Removing an entry from the list before saving now costs nothing, even if "Generate" was clicked for it — nothing was ever reserved.
- Files: `pages/LeadFormPage.tsx`

### Rev 4 — 2026-08-14 (v1.2.8) — [Issue]
- **Fixed the "Inquiry #0" banner reappearing on a lead that already has a quotation.** The banner's visibility check only looked at `lead.quote_number` and a literal `inquiry_number = 0` activity, never at whether a quotation existed anywhere else in the log — now also checks the existing `hasExistingQuotation` helper.
- **Fixed the lead record silently failing to record that a quotation exists**, which was the underlying cause of the above: adding a quotation via the Log Activity composer only synced a *typed* number back onto `lead.quote_number`, never a *system-generated* one, and the sync call swallowed failures silently. Now reads the number back from the upload response (covers generated numbers) and surfaces a toast if the sync itself fails.
- **Fixed an extra quote number silently vanishing when creating a lead with more than one generated number.** Extra quote numbers were resolved to a preview value client-side when added to the list, but only the *primary* number was regenerated for real at Save — if the series advanced in between (a second employee, or another tab, generating from the same series), the freshly-committed primary could coincidentally match a stale "extra" preview, and a backend rule silently deleted the extra as a "duplicate." Fix: extras generated from a series are no longer resolved client-side at all — the frontend now sends the series code, and the backend generates every extra number for real, atomically, in the same request as the primary, only at the moment of Save. Nothing is reserved before Save (so cancelling costs nothing), and concurrent saves were already safe (series generation row-locks). The silent-drop rule was removed. New `extra_quote_series_codes` field on `LeadCreate`; caught and fixed before it shipped that it was initially missing from `create_lead`'s `model_dump(exclude=...)` set, which would have crashed the `Lead(...)` constructor (no such column) the first time a request used it.
- See `ISSUES.md` for the full writeup of all three issues, including one known remaining edge case (partial number waste on a mid-loop generation failure) flagged there as not yet fixed.
- Files: `pages/LeadFormPage.tsx`, `lib/marketing-api.ts`, `au-marketing-api/app/routers/leads.py`, `au-marketing-api/app/schemas.py`, `ISSUES.md`

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

### Rev 21 — 2026-08-15 (v1.2.8) — [Issue]
- **Closed the long-flagged scoping gap**: Head Summary's region breakdown and Performer of the Month were still reading from old territory-based (domain/region membership) scoping instead of the creator-chain scoping the rest of the app moved to — meaning a Domain/Region Head could see broader numbers here than on the actual Leads page. Fixed:
  - `get_head_dashboard_summary` (region breakdown, total leads, won/lost, hot cases) now filters every lead query through `apply_scope_to_lead_query` (same helper `/leads/` and `/role-summary` use), instead of raw `Lead.domain_id.in_(...)` filtering.
  - `get_performer_of_month`'s "who's on my team" list is left as-is (region-assignment-based org structure — a legitimately different, correct question from lead visibility, same concept `_get_reportable_employee_ids_and_role` already uses for the Assigned-To picker). What changed: the **achieved-value calculation** (won leads counted toward each performer's total) now also passes through `apply_scope_to_lead_query`, so a won lead only counts on the leaderboard if the viewer could actually open that specific lead elsewhere in the app.
- Files: `au-marketing-api/app/routers/dashboard.py`

### Rev 20 — 2026-08-15 (v1.2.8) — [Revision]
- **Added a "Last updated" timestamp + manual refresh button** to the dashboard, visible to every role (not just Super Admin's preview switcher row). Updates itself every 30s without a refetch (`just now` → `Xs ago` → `X min ago` → clock time), and the refresh button re-fetches on demand with its own `refreshing` state, independent of the initial page-load spinner.
- Files: `pages/dashboards/useRoleDashboardSummary.ts`, `pages/dashboards/RoleDashboardRouter.tsx`
- **All 5 role-dashboard charts switched from `recharts` to `apexcharts`/`react-apexcharts`** (`MonthlyTrendChart`, `RegionBreakdownChart`, `LeadSourceChart`, `LeadStatusChart`, `RevenuePipelineChart`), per a request for "more modern chart libraries." Same data, same validated color tokens (`chartTokens.ts`'s `CATEGORICAL`/`SEQUENTIAL_BLUE_ORDINAL`/`colorForLabel`), same behavior (scroll-capped `LeadStatusChart`, top-8-limited `LeadSourceChart`) — just a different rendering engine, with gradient fills and smoother interactions.
- **`@tremor/react` was evaluated and rejected, not installed.** It was the other library requested alongside ApexCharts, but its components depend on custom Tailwind theme tokens (`bg-tremor-background-subtle`, `text-tremor-content-emphasis`, etc. — confirmed by grepping its compiled source) that only resolve with Tremor's own `tailwind.config.js` preset. This project runs Tailwind from a CDN with no config file at all (a deliberate, documented setup — see `CLAUDE.md`/`design.md` §0), so Tremor components would have rendered unstyled — no backgrounds, no borders, no rounded corners. Installed, confirmed broken by inspecting source, then uninstalled rather than shipped.
- **`recharts` was not removed** — it's still used by the legacy `pages/DashboardPage.tsx` (unreachable, no route points to it, kept as a safety net per Rev 5's "Not done in this pass" note) and the shared `components/ui/ChartsSection.tsx`, neither of which were in scope here.
- Files: `components/dashboard/MonthlyTrendChart.tsx`, `RegionBreakdownChart.tsx`, `LeadSourceChart.tsx`, `LeadStatusChart.tsx`, `RevenuePipelineChart.tsx`, `package.json`

### Rev 19 — 2026-08-15 (v1.2.8) — [Issue]
- **Fixed the charts-vs-sidebar layout collapsing into 3 visually equal columns, with no hierarchy between primary charts and secondary widgets.** The outer split was 2:1 (charts area : sidebar) via `lg:grid-cols-3` + `lg:col-span-2`, but the charts area was itself split into 2 columns internally — so each individual chart ended up at exactly 1/3 of the page width, identical to the sidebar's 1/3, even though the intent was "wide charts, narrower sidebar." Changed the outer split to 3:1 (`lg:grid-cols-4` + `lg:col-span-3`), so each chart is now 3/8 (37.5%) of the width versus the sidebar's 1/4 (25%) — charts read as clearly primary, sidebar as clearly secondary.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`, `RegionHeadDashboard.tsx`, `EmployeeDashboard.tsx`
- **Fixed a visible empty gap on Super Admin and Domain Head dashboards**, where "Leads by Status" sat alone in its own row with a blank space beside it. Root cause: Rev 15 made `MonthlyTrendChart` a forced full-width "hero" above the 2-per-row chart grid — fine when the *remaining* chart count is even (Region Head: 2 left over, pairs cleanly), but Super Admin and Domain Head each have exactly 4 charts total, so pulling one out as a hero left 3 remaining (an odd number) — always guaranteed to leave the last one alone in a half-empty row. Fix: for these two dashboards specifically, `MonthlyTrendChart` is no longer special-cased — all 4 charts sit as plain, equal grid items, filling a clean 2×2 with no gap. Region Head (3 charts total) and Employee (2 charts total) already had the right chart count for their respective treatments and are unaffected.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`
- **Fixed the real cause of "High Value Leads"/"Recent Leads" still looking huge after Rev 16's height cap**: the cap worked (content itself was correctly capped with a scrollbar), but the outer 2-column grid (`lg:grid-cols-3`, charts column + sidebar column) had no `items-start`, so CSS Grid's default `align-items: stretch` forced the shorter sidebar column to stretch to match the taller charts column's height — and since every `Card` is hardcoded `h-full`, each sidebar card (including the now height-capped ones) inflated to fill that stretched space with visible empty white area below its content, inside the card's own border. Added `items-start` to that grid on all 4 dashboards, so each card in the sidebar only takes its own natural (capped) height.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`, `RegionHeadDashboard.tsx`, `EmployeeDashboard.tsx`

### Rev 16 — 2026-08-14 (v1.2.8) — [Revision]
- **Capped the 3 unbounded list widgets** (`RecentLeadsList`, `HighValueLeadsList`, `FollowUpsDueList`) at 320px with a scrollbar, instead of growing one row per item forever — per feedback that High Value Leads / Recent Leads specifically were too tall.
- **Correction to Rev 15**: that revision's `LeadStatusChart` cap used the `Card` component's `maxHeight` prop, which forces its scrollbar hidden (`scrollbar-hide` — checked via `git grep`, this exact prop is used nowhere else in the app with a real cap, so it had never been visibly exercised before). Since a hidden scrollbar gives no visual hint there's more to scroll, all 4 of these capped widgets instead wrap their own inner content in `max-h-[…] overflow-y-auto` directly (bypassing `Card`'s `maxHeight` prop entirely), which inherits the app's existing default visible thin scrollbar styling (`index.html`'s global `::-webkit-scrollbar` rules) instead of hiding it.
- Files: `components/dashboard/RecentLeadsList.tsx`, `HighValueLeadsList.tsx`, `FollowUpsDueList.tsx`, `LeadStatusChart.tsx`

### Rev 15 — 2026-08-14 (v1.2.8) — [Revision]
- **Reverses Rev 13/14's KPI-row placement**: "Monthly Target" and "Performer of the Month" pulled back out of the top stat-card row (which was getting cramped at 5-6 columns) into their own dedicated 2-column row directly below it — still full stat-card width/prominence, just not squeezed in alongside the 4 KPI cards. Per feedback: "move them below the KPI card... follow a good layout."
- **Charts no longer stack one after another in a single narrow column.** All 4 dashboards' main content area now grids charts 2-per-row (`MonthlyTrendChart` stays full-width as the lead chart, the rest pair up beside each other) instead of every chart stacking vertically in the `lg:col-span-2` column — this was the real cause of "every card is long vertically": not any one chart being unusually tall, but 3-4 charts stacked one after another in a column only 2/3 the page width, making the whole page require a lot of scrolling even though individual charts weren't extreme.
- **Flagged the one genuinely unbounded chart** (`LeadStatusChart`, height grows with how many distinct lead statuses exist, no cap) — capped in this revision; see Rev 16 for a correction to how.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`, `RegionHeadDashboard.tsx`, `EmployeeDashboard.tsx`, `components/dashboard/LeadStatusChart.tsx`

### Rev 14 — 2026-08-14 (v1.2.8) — [Revision]
- **Same treatment as Rev 13, now for "Performer of the Month"**: moved out of the sidebar into the top KPI row on the 3 dashboards that have it (Super Admin, Domain Head, Region Head — Employee dashboard doesn't show this widget at all, so it's unaffected and stays at 5 columns). Row is now 6 equal-width cards (`lg:grid-cols-6`) on those three. Same underlying issue as Target Progress: `PerformerOfMonthCard` already had identical KPI-tile styling to `DashboardStatCard` (from Rev 8) — sidebar placement alone made it read as smaller.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`, `RegionHeadDashboard.tsx`

### Rev 13 — 2026-08-14 (v1.2.8) — [Revision]
- **Reverses part of Rev 12**: "Monthly Target" moved back out of the sidebar and into the top KPI stat-card row, on all 4 dashboards — now a 5th equal-width card alongside the 4 stat cards (`lg:grid-cols-4` → `lg:grid-cols-5`), rather than sitting in the narrower 1/3-width sidebar column. Per feedback that it should be "as big as the KPI card": the card's own styling (`TargetProgressBar`) already matched `DashboardStatCard` exactly (same padding/font sizes, from Rev 8), but its sidebar placement made it noticeably narrower/less prominent than the top-row cards despite identical component styling — this was a container-width issue, not a component-styling one.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`, `RegionHeadDashboard.tsx`, `EmployeeDashboard.tsx`

### Rev 12 — 2026-08-14 (v1.2.8) — [Revision]
- **Reworked all 4 dashboards from one long vertical stack of equal-weight sections into an asymmetric 2-column layout**, per feedback that it "looks like a page filled with cards" rather than a dashboard. KPI stat-card row stays as the hero strip at top (unchanged); everything below it now splits into a wider main column (`lg:col-span-2`) holding the primary trend/breakdown charts, and a narrower side column holding the smaller widgets (Target Progress, Performer of the Month, Recent Leads, Follow-ups Due, High Value Leads). Employee dashboard's Target Progress bar was also pulled out of the KPI row (previously a 5th grid item alongside the 4 stat cards) into the side column, matching the other 3 dashboards' pattern.
- Files: `pages/dashboards/SuperAdminDashboard.tsx`, `DomainHeadDashboard.tsx`, `RegionHeadDashboard.tsx`, `EmployeeDashboard.tsx`

### Rev 11 — 2026-08-14 (v1.2.8) — [Revision]
- **Flipped `DASHBOARD_LIVE` to `true`** in `RoleDashboardRouter.tsx` — the 4 role dashboards (Super Admin, Domain Head, Region Head, Employee) are now live for everyone instead of showing the "in development" placeholder.
- **Known caveat, not fixed in this revision**: Head Summary's region breakdown and Performer of the Month (both surfaced on the dashboards) still read from their original endpoints, which remain on the old territory-based scope rather than the creator-chain scoping the rest of the app now uses (see Rev 5's "Not done in this pass" note) — those two widgets can show broader data than a Domain/Region Head sees elsewhere in the app until migrated separately.
- Files: `pages/dashboards/RoleDashboardRouter.tsx`

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
