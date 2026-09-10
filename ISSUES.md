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

---

## Service Module

### 2026-09-09 — Saving a work order crashes when it has checklist items

**What was reported:** "Instance '<ServiceWorkOrderPrerequisite …>' has been deleted. Use the make_transient() function…" error when clicking Save on a work order.

**Root cause:** on save, the backend rebuilt the material list and the site-checklist from scratch — it called `wo.materials.clear()` / `wo.prerequisites.clear()` and then re-added the rows. Because both collections use SQLAlchemy's `delete-orphan` cascade, `.clear()` marks *every* existing row for deletion, and the following `db.flush()` actually deletes them. The prerequisites helper then tried to re-attach the rows it wanted to keep (to preserve their tick state), but those Python objects now pointed at deleted database rows → SQLAlchemy raised "instance has been deleted". The materials helper didn't crash (it always created fresh rows) but it had a quieter data-loss bug: every save wiped the store's dispatch status (Not/Partly/Fully sent), dispatch note and proof attachments for parts that were already handled.

**Fix:** both helpers now do a proper diff instead of clear-and-recreate — [`_apply_materials`](au-marketing-api/app/routers/service_work_orders.py:100) and [`_apply_prerequisites`](au-marketing-api/app/routers/service_work_orders.py) match incoming lines against stored ones by name/text, remove only the ones actually taken out, add only the new ones, and leave the rest in place. Existing material lines keep their dispatch state + attachments; existing checklist items keep their is_done / confirmed_by / confirmed_at.

**Status:** fixed, not yet committed. No data migration needed. Any dispatch status / proof lost to a prior save of an affected work order is not recoverable — the store would need to re-enter it.

---

## Leads

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
