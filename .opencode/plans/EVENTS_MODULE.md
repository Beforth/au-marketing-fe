# Exhibition / Roadshow Events Module

## Overview

Events module for managing exhibitions and roadshows with full CRUD, phase-based expense tracking, file uploads, employee assignment, budget analysis, notifications, and visitor tracking.

**Code files:**
- Backend: `au-marketing-api/app/routers/events.py`, `au-marketing-api/app/models.py` (lines 1252-1382), `au-marketing-api/app/schemas.py` (lines 1286-1367)
- Frontend: `pages/EventsListPage.tsx`, `pages/EventFormPage.tsx`, `pages/EventDetailPage.tsx`
- API client: `lib/marketing-api.ts` (lines 1798-1862)
- Scheduler: `au-marketing-api/app/scheduler.py`

---

## What Exists (Done)

### Data Model

Single `ExhibitionEvent` table (`events`) with JSONB columns for sub-features:

| Phase | Column(s) | Type |
|---|---|---|
| Core | `type` (exhibition/roadshow), `name`, `location`, `start_date`, `end_date`, `status` (active/ended), `budget`, `total_spent`, `selected_employee_ids` | Various |
| Space Booking | `space_booking_vendor`, `space_booking_amount`, `space_booking_pi_sent`, `space_booking_payment_status`, `space_booking_installments` | Scalar + JSONB |
| Stall Design (exhibition) | `stall_vendors`, `stall_selected_vendor_id`, `stall_po_created` | JSONB + Scalar |
| Banner Design (exhibition) | `banner_design_source` | Scalar |
| Table Booking (roadshow) | `table_booking_venue`, `table_booking_count`, `table_booking_cost_per_table`, `table_booking_total_cost` | Scalar |
| Travel | `travel_days_before`, `travel_employee_ids`, `travel_notification_sent` | Scalar + JSONB |
| Hotel | `hotel_name`, `hotel_employee_ids`, `hotel_cost` | Scalar + JSONB |
| Local Travel | `local_travel_entries` | JSONB array |
| Gifting | `gifting_entries` | JSONB array |

**File uploads** — separate `event_files` table with types: `stall_design`, `banner_design`, `travel_ticket`, `local_travel_proof`. Linked to events via FK.

**File type enum** (`app/models.py:1269`):
```python
class FileType(str, enum.Enum):
    STALL_DESIGN = "stall_design"
    BANNER_DESIGN = "banner_design"
    TRAVEL_TICKET = "travel_ticket"
    LOCAL_TRAVEL_PROOF = "local_travel_proof"
```

### API Endpoints (`events.py`)

| Method | Path | Description |
|---|---|---|
| GET | `/events/` | Paginated list (type, status, search filters) |
| GET | `/events/{id}` | Get single event |
| POST | `/events/` | Create event |
| PUT | `/events/{id}` | Update event (partial, all phase fields) — also handles total_spent recalculation |
| DELETE | `/events/{id}` | Delete event |
| POST | `/events/{id}/end` | End event (locks editing) |
| POST | `/events/{id}/files` | Upload file (stall_design/banner_design/travel_ticket/local_travel_proof) |
| GET | `/events/{id}/files/{file_id}/download` | Download/preview file |
| DELETE | `/events/{id}/files/{file_id}` | Delete file |

**Permissions required:** `marketing.view_exhibition`, `marketing.create_exhibition`, `marketing.edit_exhibition`, `marketing.delete_exhibition`

### Global Exception Handler (`main.py`)

Handles `"integer out of range"` / `"numeric value out of range"` errors by extracting the column name from the SQL SET clause and showing a helpful message: *"Value too large for field: [column_name]"*

### DB Migrations (`main.py` startup)

Runs `ALTER TABLE` for new columns on startup:
- `stall_selected_vendor_id` → BIGINT (migration from INTEGER)
- `travel_notification_sent` → BOOLEAN
- `local_travel_entries` → JSONB (migrates existing single amount to "Legacy" entry)
- `gifting_entries` → JSONB (migrates existing gifting_count/gifting_amount to a "Gift" entry)
- `entry_index` → INTEGER on `event_files`

### Frontend Pages

**EventsListPage.tsx** — List with:
- SegmentToggle (Exhibition / Roadshow)
- Search input
- DataTable with columns: Name (clickable), Type, Location, Start Date, End Date, Status, Budget, Spent, Actions
- Action buttons: View, Edit, Delete, End Event
- **Design:** Tooltip (Radix) + Button(ghost, xs, w-8 h-8 p-0) with blue-600 for edit/view, rose-500 for delete/end
- Pagination with border-t separator from table
- Create Event passes `?type=` query param (fixes Roadshow create bug)
- ConfirmModal for both Delete and End Event

**EventFormPage.tsx** — Create/Edit form with:
- SegmentToggle for type (exhibition/roadshow)
- Name, Location, Start Date, End Date
- Budget with `toLocaleString('en-IN')` comma formatting
- AsyncSelect for employee selection
- Reads `?type=` query param for initial event type

**EventDetailPage.tsx** — Tabbed detail page:

| Tab | Exhibition | Roadshow |
|---|---|---|
| Overview | ✓ | ✓ |
| Space Booking | ✓ | ✓ |
| Stall Design | ✓ | — |
| Banner Design | ✓ | — |
| Table Booking | — | ✓ |
| Travel | ✓ | ✓ |
| Hotel | ✓ | ✓ |
| Local Travel | ✓ | ✓ |
| Gifting | ✓ | ✓ |
| Analysis | ✓ | ✓ |

Features:
- **Local Travel** — entry list (add/edit/read-only cards), each entry has: **Note** (what was this for?), **Amount**, **Employee chips**, **Proof upload** (local_travel_proof file type). Running total at bottom.
- **Gifting** — entry list (add/edit/read-only cards), each entry: **Name** (Pen, Diary, etc.), **Count**, **Per-unit cost**, total = count x per-unit. Running total at bottom.
- **Hotel** — hotel name, cost, employee selection chips
- **Travel** — days before exhibition, employee list, ticket upload per employee, notification helper text showing estimated departure date
- **Analysis** — budget/spent/remaining cards, per-category breakdown table
- **Files** per phase (stall design files with revision tracking, banner design, travel tickets)
- **Vendor management** for Stall Design (add/edit/select-winner with auto-save)
- **End Event button** with ConfirmModal
- `₹` used everywhere (not `\u20B9`)
- Employee names resolved from API before render

### Notifications

- **Immediate:** When `travel_days_before` is set, sends push notification to selected employees with departure date
- **Scheduled:** `send_travel_reminders()` job in `scheduler.py` runs every 1 min, sends departure-day reminder if `travel_notification_sent == false`
- Uses existing `Notification` model + `send_web_push` (FCM)

### Print Budget (Known Issue)

`\u20B9` in JSX text content or string attributes renders literally (not parsed as Unicode escape) — must use actual `₹` character.

### Vendor ID Strategy

Vendors use sequential counter (`nextVendorIdRef`) initialized past existing max IDs instead of `Date.now()` (which caused integer overflow on `stall_selected_vendor_id`). Column uses `BigInteger` to handle legacy large IDs.

---

## What's In Progress (Not Yet Done)

### 1. Add `domain_id` to ExhibitionEvent

**Purpose:** Every event needs a domain so that visitor contact auto-creation can use `event.domain_id`.

**Backend changes:**

`app/models.py` — add column:
```python
domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False, default=1)
```

`app/schemas.py` — add to:
- `EventCreate`: `domain_id: int`
- `EventUpdate`: `domain_id: Optional[int] = None`
- `EventResponse`: `domain_id: int`

`app/routers/events.py` — in `_event_to_response()`:
```python
domain_id=event.domain_id,
```

`app/main.py` — migration:
```python
conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS domain_id INTEGER NOT NULL DEFAULT 1;"))
```

**Frontend changes:**

`pages/EventFormPage.tsx` — add Domain dropdown on create form only:
- AsyncSelect fetching domains via existing `GET /domains/` API
- Default to user's domain from auth context
- Disabled/hidden on edit (domain shouldn't change after creation)

`lib/marketing-api.ts` — add `domain_id` to `EventCreateInput` and `ExhibitionEvent` interface

---

### 2. Visitors Tab

**Purpose:** Track people who visited the exhibition/roadshow stall. Search contacts to link, auto-create if new.

**Data structure** — JSONB array on event (`visitors`), same as gifting/local_travel.

**Each visitor entry:**
```typescript
interface VisitorEntry {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  checked_in: boolean;
  check_in_time?: string;       // ISO timestamp, auto-set on check-in
  contact_id?: number;           // Link to CRM Contact (if found/created)
  auto_created?: boolean;        // Was the Contact auto-created?
}
```

**Backend changes:**

`app/models.py` — add column:
```python
visitors = Column(JSONB, default=list)
```

`app/schemas.py` — add:
- `EventUpdate`: `visitors: Optional[List[dict]] = None`
- `EventResponse`: `visitors: List[dict] = []`

`app/routers/events.py` — in `_event_to_response()`:
```python
visitors=event.visitors or [],
```

**Visitor auto-link/auto-create logic** — inside `update_event()` when visitors are in the update data:

```python
if "visitors" in update_data:
    processed = []
    for v in update_data["visitors"]:
        email = (v.get("email") or "").strip()
        phone = (v.get("phone") or "").strip()
        contact_id = v.get("contact_id")

        if contact_id is None and (email or phone):
            from sqlalchemy import or_
            existing = db.query(Contact).filter(
                Contact.domain_id == event.domain_id,
                or_(
                    Contact.contact_email == email if email else False,
                    Contact.contact_phone == phone if phone else False,
                )
            ).first()
            if existing:
                contact_id = existing.id
            else:
                new_contact = Contact(
                    contact_person_name=v.get("name", ""),
                    contact_email=email or None,
                    contact_phone=phone or None,
                    contact_job_title=v.get("job_title"),
                    domain_id=event.domain_id,
                    created_by_employee_id=user.get("employee", {}).get("id"),
                )
                db.add(new_contact)
                db.flush()
                contact_id = new_contact.id
                v["auto_created"] = True

        v["contact_id"] = contact_id
        processed.append(v)
    update_data["visitors"] = processed
```

**Frontend changes:**

`lib/marketing-api.ts`:
```typescript
export interface VisitorEntry {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  checked_in: boolean;
  check_in_time?: string;
  contact_id?: number;
  auto_created?: boolean;
}
```

Add `visitors: VisitorEntry[]` to `ExhibitionEvent` interface
Add `visitors?: VisitorEntry[]` to `EventUpdateInput` interface

`pages/EventDetailPage.tsx`:

1. Add `'visitors'` to `TabKey` type
2. Add `{ key: 'visitors', label: 'Visitors' }` to both `TABS_EXHIBITION` and `TABS_ROADSHOW`
3. Add `case 'visitors': return visitorsTab;` in `renderTab()`
4. Add `visitorsTab` constant following the same pattern as `giftingTab`:

**Add form:**
- AsyncSelect at top: searches `GET /contacts/search?q=...`
  - (contacts search endpoint — searches by name, email, phone, company)
  - Found -> select -> pre-fills name/phone/email/company/job_title, stores `contact_id`
  - Not found -> type into manual inputs
- Fields: Name (required), Phone, Email, Company, Job Title, Notes
- **Checked in** toggle — when toggled on, auto-stamps `check_in_time`

**Read-only saved entries:**
Each card shows:
- Name (bold)
- Phone | Email
- Company | Job Title
- Notes (if any)
- Check-in badge: "Checked in at 10:30 AM" or "Not checked in" (gray)
- If linked to contact: small "Linked to Contact" badge with contact name
- Edit / Delete buttons

**Edit mode:**
Same inline editable form pattern as gifting/local_travel (opens blue editable box, Cancel to close)

**Save button** at bottom calls `updateField({ visitors })` — backend auto-links/auto-creates contacts.

### 3. DB Migration

In `app/main.py` startup, add:
```python
# Add visitors column
try:
    conn.execute(text("ALTER TABLE events ADD COLUMN IF NOT EXISTS visitors JSONB DEFAULT '[]'::jsonb;"))
    conn.commit()
except Exception as e:
    logger.info(f"Column visitors migration skipped: {e}")
```

---

## UI Patterns Summary

### Entry List Pattern (Gifting, Local Travel, Visitors)

All use the same component structure:

```
Header "Title"          [Add Entry button]
------------------------------------------
[Editable blue box]     <- only visible when editingIndex !== null
  Field inputs...
  [Cancel] button

[Read-only card]        <- one per saved entry, unless editing
  Summary text...
  [Edit icon] [Delete icon]

Total: Rs.X,XXX          <- running total
------------------------------------------
[Save button]           <- persists all entries at once
```

### Action Buttons Pattern (DataTable)

```tsx
<Tooltip content="Edit Event">
  <Button variant="ghost" size="xs" className="w-8 h-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent" onClick={...}>
    <Edit size={16} strokeWidth={2} />
  </Button>
</Tooltip>
```

- Colors: View/Edit -> `text-blue-600`, Delete/End -> `text-rose-500`
- Tooltips via `../UI/Tooltip` (Radix @radix-ui/react-tooltip)
- Column: `sortable: false, align: 'right'`

### ConfirmModal Danger Variant

```
[AlertTriangle icon] Message text here...
```
- Icon in `bg-rose-100` circle
- Confirm button: `bg-rose-600 hover:bg-rose-700`

---

## Key Learnings & Gotchas

1. **`\u20B9` in JSX** — renders literally. Always use actual `₹` character.
2. **Vendor IDs** — use `nextVendorIdRef` counter, not `Date.now()`. Column needs `BigInteger`.
3. **Employee names** — fetch async before `setEvent()`; use ref for cache (ref doesn't trigger re-render).
4. **total_spent** — recalculated on every update from individual phase amounts.
5. **File upload pattern** — hidden `<input>` inside a styled `<label>` with Upload icon.
6. **JSONB columns** — raw `list` type in Python/SQLAlchemy. Always provide `default=list`.
7. **Entry index in file uploads** — `entry_index` on `EventFile` links proof files to specific JSONB entry positions. Fragile if entries are reordered — entries should only be appended, never reordered.
8. **domain_id** — must be set on event creation for visitor auto-create to work.
9. **Scheduler** — runs every 1 min. Uses `BackgroundScheduler` from `apscheduler`.
10. **Push notifications** — use `send_web_push` from `app.push_notifications` + `Notification` DB model.
