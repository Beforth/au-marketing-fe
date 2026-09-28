# ISSUES.md — Reported Issue Log

> **Internal-only** log of bugs/issues reported (by the client or found internally), investigated, and fixed — grouped by feature area, most recent first within each section.
> This is *not* the same as `CHANGES.md` (dev-facing log of every change, including planned feature work) or `CHANGELOG.md` (client-facing release notes). Every entry here should also have a matching `CHANGES.md` revision tagged `[Issue]` (see that file's "How to update" section) — this file carries the full plain-language writeup (what the user reported, root cause, fix, edge cases); `CHANGES.md` carries the short version.

## How to update this file (Claude must follow this)

1. Whenever an issue is investigated and fixed, add an entry here **in the same turn as the code change** — same rule as `CHANGES.md`.
2. Find the feature section it belongs to (index below). If none exists, create one and add it to the index.
3. Add a new entry at the **top** of that section:
   ```markdown
   ### YYYY-MM-DD — Short title
   **What was reported:** plain-language description of the symptom, as the user described it.
   **Root cause:** the actual mechanism, in plain language first, technical detail after.
   **Fix:** what changed, with file:line references.
   **Status:** e.g. "fixed, not yet committed" / "fixed and committed" / "existing affected records not recoverable — see note".
   ```
4. Also add a matching entry to `CHANGES.md` under the right feature section, tagged `[Issue]`.
5. Root copy only — do not mirror into `au-marketing-api/ISSUES.md`.

## Feature index

- [Quote Numbers / Enquiry Log](#quote-numbers--enquiry-log)
- [Events & Exhibitions](#events--exhibitions)
- [Leads](#leads)
- [Reports](#reports)
- [Service Module](#service-module)
- [External Visiting Card Integration](#external-visiting-card-integration)
- [HRMS Daily Service Reports](#hrms-daily-service-reports)

---

## HRMS Daily Service Reports

### 2026-09-25 — The same lead log could be turned into a DSR twice

**What was reported:** found internally while listing open gaps — clicking "Create DSR from lead activity" a second time for the same day offered the same logs again, so a log could become two DSRs (two approvals, double-counted hours).

**Root cause:** nothing linked a DSR back to the lead log it came from. The box always listed every log of the day with its tick box on.

**Fix:** every DSR created from a log now carries a last line "Lead log #<id>" in its description ([`buildDSRForLog`](lib/dsr-from-lead-logs.ts)). When the box opens, [`CreateDSRFromLeadsModal`](components/dsr/CreateDSRFromLeadsModal.tsx) loads the user's Indoor DSRs for that date from HRMS and [`existingDSRsForLogs`](lib/dsr-from-lead-logs.ts) locks any log that already has a (non-rejected) DSR — greyed out, unticked, badge "Already in DSR · <status>". The link lives in HRMS itself, so no database/migration is needed, a deleted DSR frees its log, and a rejected one can be redone.

**Status:** fixed, not yet committed (frontend only). DSRs created before this fix have no reference line; they're still detected by their exact generated title. If someone edits such an old DSR's title in HRMS, its log would be offered again — rare, and only for DSRs made before this fix.

### 2026-09-24 — Indoor DSR saved with the wrong Hours (8 hours regardless of Start/End Time)

**What was reported:** found internally when the HRMS integration guide (`docs/DSR_MODULE_INTEGRATION.md` §3.2 / §9.3 note C) was updated: the HRMS API does not calculate Hours from Start/End Time the way the HRMS website does.

**Root cause:** our Indoor DSR form had its own "Hours" box, separate from Start Time and End Time. HRMS's create/update API saves whatever `hours` value it receives and ignores the times; if no `hours` is sent it saves **8.0**. So anyone who filled in Start/End Time but left Hours empty got a report saved as 8 hours no matter what the times were, and anyone who typed Hours could contradict their own times. Our form also rejected End Time earlier than Start Time, while HRMS treats that as an overnight shift.

**Fix:** the Hours box is gone. [`hoursBetween`](lib/dsr-helpers.ts) computes hours from the two times exactly like the HRMS web form (end − start, rounded to 0.1 h, +24 h when End is earlier = overnight) and [`DSRForm`](components/dsr/DSRForm.tsx) sends that as `hours`, with a live "Duration: X hours Y minutes" preview. When both times are blank nothing is sent and HRMS's own 8-hour default applies, matching the web form. The overnight-blocking check was removed. The history table's Hours cell now shows "09:00 - 17:30 (8 hours 30 minutes)" / "8 hours" ([`HoursCell`](components/dsr/DSRHistoryTable.tsx)).

**Status:** fixed, not yet committed. This only affected reports created through this app's DSR page, which hadn't been released yet. Any such report already saved with the wrong Hours isn't corrected automatically; editing it (while still pending) recalculates Hours from its times.

---

## External Visiting Card Integration

### 2026-09-11 — Scanning a card shows "req rejected 307"

**What was reported:** scanning a visiting card in the external card-capture app returned a rejection showing status `307` instead of saving the card.

**Root cause:** `POST /api/visiting-card-contacts` (and the `GET` list) were only registered in FastAPI with a trailing slash — the real route is `/api/visiting-card-contacts/`. The scanner app calls the URL *without* the trailing slash. FastAPI's default `redirect_slashes` behavior doesn't 404 that mismatch — it responds with a `307 Temporary Redirect` pointing at the slash version, expecting the caller to retry there. That's normally invisible (browsers and most HTTP libraries auto-follow a 307), but the scanner app's HTTP client doesn't follow redirects on a POST, so it treated the 307 itself as the response and surfaced it as a rejected request. This is unrelated to the HRMS permission grant for this endpoint — a missing permission would show as `403`, and the redirect happens before any permission check runs.

**Fix:** [`app/routers/visiting_card_contacts.py`](au-marketing-api/app/routers/visiting_card_contacts.py) now registers both the create (`POST`) and list (`GET`) routes on two paths — with and without the trailing slash — pointing at the same handler, so no redirect is ever issued no matter which form the caller uses. No change needed on the scanner app's side; it does not need to be updated or reinstalled.

**Status:** fixed, not yet committed.

---

## Service Module

### 2026-09-09 — Saving a work order crashes when it has checklist items

**What was reported:** "Instance '<ServiceWorkOrderPrerequisite …>' has been deleted. Use the make_transient() function…" error when clicking Save on a work order.

**Root cause:** on save, the backend rebuilt the material list and the site-checklist from scratch — it called `wo.materials.clear()` / `wo.prerequisites.clear()` and then re-added the rows. Because both collections use SQLAlchemy's `delete-orphan` cascade, `.clear()` marks *every* existing row for deletion, and the following `db.flush()` actually deletes them. The prerequisites helper then tried to re-attach the rows it wanted to keep (to preserve their tick state), but those Python objects now pointed at deleted database rows → SQLAlchemy raised "instance has been deleted". The materials helper didn't crash (it always created fresh rows) but it had a quieter data-loss bug: every save wiped the store's dispatch status (Not/Partly/Fully sent), dispatch note and proof attachments for parts that were already handled.

**Fix:** both helpers now do a proper diff instead of clear-and-recreate — [`_apply_materials`](au-marketing-api/app/routers/service_work_orders.py:100) and [`_apply_prerequisites`](au-marketing-api/app/routers/service_work_orders.py) match incoming lines against stored ones by name/text, remove only the ones actually taken out, add only the new ones, and leave the rest in place. Existing material lines keep their dispatch state + attachments; existing checklist items keep their is_done / confirmed_by / confirmed_at.

**Status:** fixed, not yet committed. No data migration needed. Any dispatch status / proof lost to a prior save of an affected work order is not recoverable — the store would need to re-enter it.

---

## Leads

### 2026-09-22 — Attaching a quote file later doesn't move the card to "Quotation submitted"

**What was reported:** Create a lead with no quotation file (so it has an empty "Inquiry 0" placeholder), then later upload the actual file to that placeholder — the kanban card stays in its original column instead of moving to "Quotation submitted."

**Root cause:** The kanban board decides which column a lead sits in purely from `lead.status_id` (`pages/LeadsPage.tsx:370-387`). There are two different backend endpoints that can attach a quotation file, and only one of them advances that status:
- `POST /leads/{id}/activities/{id}/attachments` (brand-new attachment) already checks for a lead status flagged `set_when_quotation_added` and moves the lead there after saving the file (`au-marketing-api/app/routers/leads.py:1073-1088`).
- `POST /leads/{id}/activities/{id}/attachments/{id}/replace` (the "Attach file" / reattach action used to fill in a file-less quotation placeholder — exactly what a bare-created lead has) saved the file but never ran that same check, so `status_id` was left untouched.

This is what a lead created with a quote number but no file goes through: the backend auto-creates a file-less "Inquiry 0" placeholder at creation time, and the user later fills it in via "Attach file," which hit the endpoint missing the fix.

**Fix:** Added the identical status-advance check (skipped if the lead is already Won/Lost) to the reattach endpoint (`au-marketing-api/app/routers/leads.py:1265-1274`). Also updated `LeadFormPage`'s reattach handler to refresh the lead record, not just the activity list, so the status badge on that page updates immediately (`pages/LeadFormPage.tsx:841`).

**Already-affected leads:** this fix only applies to uploads from now on — leads that already got a file attached through the broken path are still stuck. A one-time backfill script was drafted and tested, but was not used — decided to have users move those specific leads to "Quotation submitted" manually on the Leads board instead (see the bolded note added to CHANGELOG.md).

**Status:** fixed, not yet committed.

---

### 2026-08-30 — `POST /api/leads/` fails with "cannot access local variable 'EmployeeRegionAssignment'"

**What was reported:** Creating a lead on the live API (`http://api-marketing.encryptedbar.com/api/leads/`) returned `cannot access local variable 'EmployeeRegionAssignment' where it is not associated with a value` (a Python `UnboundLocalError`).

**Root cause:** `EmployeeRegionAssignment` is imported once at the top of `au-marketing-api/app/routers/leads.py` and used inside `create_lead` (the "add lead on behalf of another employee" coordinator check, ~line 1447). Python's rule: if a name is *assigned or imported anywhere in a function*, it is treated as **local for the entire function** — so a `from app.models import …, EmployeeRegionAssignment` placed *inside* `create_lead` (below that check) makes the earlier use at line 1447 read an unassigned local and crash. The committed repo code does **not** have such a local import — the version running on the server does (an edit made directly on the host, not committed; the deployment bakes in whatever `.py` files physically sit in the directory regardless of git — see CLAUDE.md "Database migrations" note about the same drift with migration files).

**Fix:**
- On the server: open `app/routers/leads.py`, find the `from app.models import …` line **inside** `create_lead()`, and delete it (everything it imports is already imported at the top of the file) — or at minimum remove `EmployeeRegionAssignment` from it. Then rebuild/restart.
- In the repo (hardening so a redeploy can't reintroduce it): `ExhibitionEvent` — added this session for exhibition attribution — was moved from two function-local `from app.models import ExhibitionEvent` statements up into the module-level import block, so no name in `create_lead`/`update_lead` is function-local by accident.
- `au-marketing-api/app/routers/leads.py`

**Status:** Repo hardened, not yet committed. The actual crash is in the server's own uncommitted copy of `leads.py` and must be fixed there (or replaced by deploying the repo version).

---

## Reports

### 2026-08-30 — Reports crash with 500 instead of "access denied"

**What was reported:** `name 'logger' is not defined` error hit while using a reports endpoint.

**Root cause:** `au-marketing-api/app/routers/reports.py` used `logger.warning(...)` in three spots — the permission checks for viewing another employee's *report summary* (`reports.py:502`), *expected orders* (`reports.py:732`), and *OD plans* (`reports.py:829`) — but the file never ran `import logging` or created a `logger`. Every other router does. So on the exact path where a user asked for a report they weren't allowed to see, the code tried to log the denial, hit the undefined name, and returned a generic HTTP 500 instead of a clean 403. Pre-existing bug (not introduced by recent work); only reachable on the denied-access branch, which is why it went unnoticed.

**Fix:** added `import logging` and `logger = logging.getLogger(__name__)` at the top of `reports.py`, matching the pattern in every other router. No behaviour change beyond denials now logging and returning 403 as intended.
- `au-marketing-api/app/routers/reports.py`

**Status:** Fixed, not yet committed.

---

## Events & Exhibitions

### 2026-08-30 — Exhibitions were visible to every user regardless of domain

**What was reported:** An employee who isn't in a given domain could still see that domain's exhibitions (in the Events list and in the new exhibition picker) — "that isn't good".

**Root cause:** `ROLE_SCOPING_RULES.md` §4 documents that exhibition/roadshow events are domain-scoped, but `get_events` in `au-marketing-api/app/routers/events.py` never implemented it — the query was a plain `db.query(ExhibitionEvent)` with only type/status/search filters, no `get_user_scope` call. `GET /api/events/{id}` was likewise open, so any event could be opened by ID. The generic `apply_scope_to_query` helper couldn't be reused because it keys off `model.region_id`, which `ExhibitionEvent` doesn't have (events carry only `domain_id`).

**Fix:** new `apply_event_scope()` and `can_access_event()` in `app/scope.py` implementing §4 (super = all; domain/region roles = domain-level; plain employee = only events they're listed on or created). Wired into `GET /api/events/`, `GET /api/events/{id}`, `GET /api/events/{id}/lead-attribution`, and the file-download endpoint (out-of-scope → 404). `GET /api/exhibitions/active` is scoped at domain level for all roles so the card-capture picker stays usable. Event **creation** deliberately left unrestricted by domain (permission-only), per product decision.
- `au-marketing-api/app/scope.py`, `au-marketing-api/app/routers/events.py`, `au-marketing-api/app/routers/exhibitions.py`

**Status:** Fixed, not yet committed. No data migration. Needs a backend restart; verify with a domain-head and an employee account after deploy.

---

### 2026-08-30 — Travel expense for exhibitions was never counted

**What was reported:** In an exhibition's Travel section you can only upload tickets (plane/train), there's nowhere to record what the travel cost — so travel spend never shows up anywhere. It should be a proper expense, sitting before Local Travel like it does now.

**Root cause:** The Travel tab (`pages/EventDetailPage.tsx`) was built to capture only two things — how many days before the event the production team travels, and per-employee ticket file uploads. There was never an amount field. As a result:
- The Analysis tab listed a "Travel" row but its amount was the literal `0` (`pages/EventDetailPage.tsx`, `expenseCategories` array).
- The backend's `total_spent` recalculation (`au-marketing-api/app/routers/events.py`, in `update_event`) summed space booking + table booking + hotel + local travel + gifting, with no travel term at all.

So every exhibition's reported total spend was understated by the entire cost of flights/tickets.

**Fix:**
- New `travel_cost` column on the events table (`au-marketing-api/app/models.py`, `ExhibitionEvent`), exposed through `EventUpdate` / `EventResponse` (`au-marketing-api/app/schemas.py`) and returned + included in the `total_spent` sum in `au-marketing-api/app/routers/events.py`.
- Frontend: `travel_cost` added to `ExhibitionEvent` / `EventUpdateInput` (`lib/marketing-api.ts`); a "Travel Cost (₹) — flights / tickets" `CurrencyInput` on the Travel tab, saved by the existing "Save Travel" button; Analysis tab "Travel" row now reads `event.travel_cost`.
- Tab order unchanged — Travel already sits before Local Travel.

**Status:** Fixed, not yet committed. Needs the `events.travel_cost` migration run on production (`alembic revision --autogenerate` + `alembic upgrade head`). Existing events show ₹0 travel until someone opens the Travel tab and enters the amount — the figure was never captured before, so there is nothing to backfill from.

---

## Quote Numbers / Enquiry Log

### 2026-09-28 — "Add another quotation" on Inquiry 0 says one quote number but saves under another

**What was reported:** on lead #396 (Autopro Technologies) the Inquiry 0 "Add another quotation" box said *"Using this lead's quote number: AP/QUOTE-TT/029…"*, but the uploaded file was saved as `AP/QUOTE-CL/011…(rev1)` — a revision of a different quote.

**Root cause:** two parts. (1) The box only *displayed* the lead's Quote No.; the upload sent no quote number at all, so the server fell back to "revision of the lead's **first** quotation" (CL). (2) The server's revise path ignored the chosen number even when one was sent — the "Revise Quotation → Which quotation?" picker in the log form and in "Add attachments" sent it, but every revision still became `first quotation(revN)`. So on any lead with several quote numbers, revising the 2nd/3rd one was saved as a revision of the 1st.

**Fix:** the server now saves each revised file as the next version of the quote number it was given (`base` if none exist yet, else `base(revN)`), falling back to the first quotation only when no number is sent ([`leads.py`](au-marketing-api/app/routers/leads.py) `upload_activity_attachments`). The Inquiry 0 box now has a **"This file is for:"** picker (the lead's Quote No. + every quotation on the lead) and a **"Will be saved as: …"** preview that uses the same numbering rule; the upload sends the picked number. If the picked quote still has a file-less row, the box says to use that row's **Attach file** instead and blocks the upload (otherwise the file would land as a revision next to an empty row). Quote value is now required there (the server already required it). The outdated "This value won't be reflected in the kanban quotation bar" note on revisions was reworded — since the 2026-09-25 fix the latest revision's value *is* what counts.

**Status:** fixed, not yet committed; needs a backend redeploy. **Already-saved rows are not changed** — e.g. lead #396's `CL…(rev1)` stays as is (per the user it was intended as a CL revision). Separately, lead #396's TT row is missing with no "Deleted attachment" audit entry; the code has no path that removes a row without logging, so this is still unexplained (see server checks suggested in the session).

### 2026-09-25 — Revised quote price not reflected on the kanban card or the Quotation target bar

**What was reported:** when a lead's quote value is updated later — the new price can be lower or higher than the original, and a quote can be revised many times — the kanban card still shows the first value, and the question was which value counts toward the targets.

**Root cause:** a revised quote is saved as a new quotation row numbered `QTN-001(rev1)`, `QTN-001(rev2)`, … each with its own price. Every place that totals quote value — the lead list (kanban card), the single-lead view, the lead returned after marking Won, and the dashboard's `quotation_submitted_value` behind the Domains page "Quotation" target bar — filtered with `quotation_number NOT LIKE '%(rev%'`, i.e. summed only the original quotations and ignored all revisions. So the card and the Quotation bar were stuck on the first price. (The sales "Target" bar was never affected: it sums the Won value `Lead.closed_value` of leads won in the period, which is the intended behaviour and wasn't changed.)

**Fix:** one shared rule in [`app/quote_values.py`](au-marketing-api/app/quote_values.py): group each quotation's base number with all its revisions, count it **once**, at the **latest revision's value** (highest rev number; a revision with no price falls back to the previous priced one). For date-based totals the quotation counts in the period it was **first sent**, so a revision updates the value without moving it to another quarter. Used by [`leads.py`](au-marketing-api/app/routers/leads.py) (list, single lead, post-Won) and [`dashboard.py`](au-marketing-api/app/routers/dashboard.py) (Quotation bar). Tests: `au-marketing-api/tests/test_quote_values.py`.

**Status:** fixed, not yet committed; needs a backend redeploy. **Existing leads are corrected automatically** — the totals are computed live from the stored revision rows, nothing needs re-entering and no migration. Side effect to expect: past quarters' Quotation-bar figures change for any lead that had revisions (they now reflect the latest price).

### 2026-08-14 — "Attach quotation file" button still shows after a file is already attached

**What was reported:** On an Inquiry #0 entry that already had quotations with files attached, a "+ Attach quotation file" button/box was still shown underneath them, making it look like something was still missing even though the files were genuinely there.

**Root cause:** This button is intentionally always present on Inquiry #0 — it's meant to let you add *another* quotation later, not just attach the first one. The bug was purely in its label: it was hard-coded to always read "Attach quotation file" for Inquiry #0, regardless of whether a quotation already had a file — unlike every other log entry, where the same button correctly reads "Add attachments" (which reads fine either way).

**Fix:** The label now checks whether Inquiry #0 already has a quotation with a real file attached — if so, it reads "Add another quotation" instead, only showing "Attach quotation file" when nothing has been attached yet.
- `pages/LeadFormPage.tsx:4177`, `pages/LeadFormPage.tsx:4182`

**Status:** Fixed, not yet committed.

---

### 2026-08-14 — Enquiry log shows stale data right after saving a quotation

**What was reported:** After using the "Inquiry #0 / System Quote" box to generate/type a quote number and attach a file, the saved entry in the Enquiry log still showed a "+ Attach quotation file" prompt right after saving — as if no file had been attached, even though a file was clearly selected before clicking Save.

**Root cause:** `loadActivities` (`pages/LeadFormPage.tsx:847-850`) fetches the fresh activity/attachment list but never `return`s the promise chain. `handleCreateSystemQuote` calls `await loadActivities()` expecting to wait for the refreshed data before finishing — but since nothing was returned, the `await` resolved immediately, and the "Saving…" state cleared while the UI was still showing data from *before* the save. The file was genuinely saved correctly on the server the whole time (confirmed via a direct database check) — this was purely a display timing bug, not data loss.

**Fix:** `loadActivities` now returns its fetch chain, so every caller that awaits it (this one, specifically) genuinely waits for the refreshed data before continuing.
- `pages/LeadFormPage.tsx:847-850`

**Status:** Fixed, not yet committed.

---

### 2026-08-14 — "Inquiry #0" banner shows on leads that already have a quotation

**What was reported:** Opening a lead that already had a quotation attached still showed the blue "Inquiry #0 · System · System Quote — Generate or type this lead's first quotation number..." box, as if no quotation existed yet.

**Root cause:** The banner's visibility check only looked at one field (`lead.quote_number`) and one specific log entry (an activity literally numbered `0`). It never checked whether the lead had a quotation anywhere else in its log — a broader check for that (`hasExistingQuotation`) already existed elsewhere in the same file but wasn't being used here.

**Fix:** The banner now also checks `hasExistingQuotation` before showing itself, so it correctly stays hidden once any quotation exists on the lead, not just the one narrow case it checked before.
- `pages/LeadFormPage.tsx:3591` (condition), `pages/LeadFormPage.tsx:141-143` (`hasExistingQuotation`, pre-existing)

**Status:** Fixed, not yet committed.

---

### 2026-08-14 — Lead's own quote number field silently stays blank

**What was reported:** Underlying cause of the banner issue above — a lead could have a real quotation in its log, but the lead's main quote-number field never got updated to match.

**Root cause (two bugs, same symptom):**
1. When a quotation number was **auto-generated by the system** (rather than typed in by hand) through the "Log Activity" screen, the sync code only recognized manually-typed numbers — a generated one was never picked up, so the lead's record never got the update.
2. Separately, the save-back step was wrapped in error handling that silently did nothing on failure — so even a typed number could fail to sync with zero indication to the user.

**Fix:**
- The sync step now reads the number back from the server's response after upload (which includes server-generated numbers), instead of only trusting what the user typed client-side.
- A failed sync now shows an error toast instead of failing silently.
- `pages/LeadFormPage.tsx:920-951`

**Status:** Fixed, not yet committed.

---

### 2026-08-14 — Extra quote number silently vanishes when creating a lead with multiple numbers

**What was reported:** Creating a new lead with more than one quote number generated at once — sometimes one of the extra numbers just disappeared from the system log, no error shown.

**Root cause:** Quote numbers shown while filling out the "create lead" form are only **previews** — the real, final number is only decided at Save. The lead's *primary* quote number was already generated fresh, for real, at Save time. But the *extra* numbers were still using their earlier preview values. If another quote number got generated from the same numbering series while the user was still filling out the form (a second employee, or the same person in another tab), the counter moved — and the primary number generated at Save could end up textually identical to one of the stale "extra" previews already in the list. The backend had a rule that silently discarded any extra number matching the primary, treating it as a duplicate — so the extra number was deleted with no warning.

**Fix (generate everything together, only at Save):**
- The frontend no longer sends stale preview numbers for extra, series-generated quote-number rows — it sends the **series code** for each such row instead.
- The backend now generates all extra series-based numbers for real, in the same request as the primary, right at the moment the lead is actually saved — nothing is decided ahead of time, so nothing can go stale or collide.
- The silent-drop rule was removed entirely — every quote number the user added is now kept.

Confirmed edge cases handled correctly:
- **Two employees saving at the same instant** — already protected: number generation locks the series row in the database, so concurrent saves can never produce the same number.
- **A user cancels lead creation instead of saving** — costs nothing; nothing is generated or reserved until an actual successful Save.
- **Preview numbers do not reflect what will actually be assigned** — only save order determines real numbers.

- `pages/LeadFormPage.tsx:1574-1594` (frontend: send series codes for extras instead of stale previews)
- `au-marketing-api/app/schemas.py:620-627` (new `extra_quote_series_codes` field)
- `au-marketing-api/app/routers/leads.py:1622-1652` (backend: generate all extras atomically at save time)
- `lib/marketing-api.ts:401-403` (frontend type)

**Known remaining edge case (not yet fixed):** extra numbers are generated one at a time in a loop, each committing for real immediately. If generating the 2nd or 3rd extra number fails (e.g. an invalid/paused series), the earlier ones in that same request were already committed and burned, even though the whole request then fails with an error. The user sees an error (not silent), but 1-2 real numbers can still be wasted in that specific failure case. Proposed fix: validate all series codes up front, before generating any of them.

**Status:** Fixed, not yet committed. Existing leads affected by the pre-fix version of this bug are **not recoverable** — the dropped number was never saved anywhere, so there's no record of what it was. Would need manual correction using the client's own outside records.

---
