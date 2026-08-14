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
