# DSR Module Integration Guide

How to integrate the **Daily Service Report (DSR)** family of features —
Indoor DSR, Outdoor DSR, the **Daily Expense Report**, and the
**employee To-Do/task-assignment system** — into another module,
including their REST APIs, the custom RBAC permission catalog, and the
shared approval-workflow engine underneath the DSR/Expense side of it.
Written from the actual code (`employees/models.py`,
`employees/api_views.py`, `employees/views.py`, `employees/permissions.py`,
`employees/management/commands/create_all_permissions.py`).

**Looking for the To-Do/task API specifically?** It's a related but
separate object from DSR (see §9.3) — full reference at
[§9.3's ToDoItem API section](#93-the-create-page):
`POST /api/rbac/todo/create/` (supports assigning to one employee or
several at once), `GET /api/rbac/todo/`,
`POST|PUT|PATCH /api/rbac/todo/<id>/update/`,
`POST|DELETE /api/rbac/todo/<id>/delete/`, and
`POST /api/rbac/todo/<id>/complete/` (auto-creates a DSR, same as
finishing the task on the website). It doesn't have Approve/Reject or a
Pending-for-me endpoint — those are DSR/Expense-specific approval-engine
concepts (§7) that don't apply to a to-do task.

**Building the screens in React?** Read **§10** — the S&M Hub's React/TypeScript
implementation (files, rules, layout and behaviour), matched to HRMS's live screens, so every
module's DSR UI looks and behaves the same.

If you are implementing a **new, unrelated module** that also needs a
submit → route-to-approver → approve/reject flow, read §7 first — DSR and
Expense Report are two examples built on the same reusable engine, and
your new module can plug into that same engine rather than inventing its
own approval logic.

---

## 0. Capabilities checklist — implement ALL of these, not just read/list

**DSR and Expense Report already have full Create, List, Pending-for-me,
Update, Delete, Approve, and Reject support, ready to call right now.**
If your task is "integrate DSR (or Expense Report) into this module,"
that means wiring up **all seven** of the following, not stopping after
List/View. Do not assume anything here is read-only or partially built —
every cell below is a real, working endpoint today:

| Feature | Create | List/View | Pending-for-me | Update | Delete | Approve | Reject |
|---|---|---|---|---|---|---|---|
| **DSR** (Indoor + Outdoor) | §3.2 `POST /api/rbac/dsr/create/` | §3.1 `GET /api/rbac/dsr/` | §3.7 `GET /api/rbac/dsr/pending-approval/` | §3.3 `POST\|PUT\|PATCH /api/rbac/dsr/<id>/update/` | §3.4 `POST\|DELETE /api/rbac/dsr/<id>/delete/` | §3.5 `POST /api/rbac/dsr/<id>/approve/` | §3.6 `POST /api/rbac/dsr/<id>/reject/` |
| **Expense Report** | §8.3 `POST /api/rbac/expense/create/` | §8.3 `GET /api/rbac/expense/` | §8.3 `GET /api/rbac/expense/pending-approval/` | §8.3 `POST\|PUT\|PATCH /api/rbac/expense/<id>/update/` | §8.3 `POST\|DELETE /api/rbac/expense/<id>/delete/` | §8.3 `POST /api/rbac/expense/<id>/approve/` | §8.3 `POST /api/rbac/expense/<id>/reject/` |

> Approve/Reject were added 2026-09-24. **"Pending for me" was added
> 2026-09-25** — if you read this doc before that date, there was no way
> for an approver to discover which reports needed their decision (only
> `api_dsr_list`/`api_expense_list`, which are scoped to one target
> employee's own reports, never "everything currently assigned to me
> across all employees"). Approvers without `dsr.view_all`/
> `expense_report.view_all` genuinely had no ✓/✗ buttons to show, because
> there was nothing to list them from — not a permissions bug, a missing
> endpoint. That's fixed now; re-check §3.7/§8.3 if you built around
> either the missing approve/reject API or the missing pending-list API.

Before considering DSR or Expense Report "integrated," confirm you have
working code for all seven columns above — a create-only or view-only
integration is incomplete, and so is one that can't approve/reject or
show an approver their own queue. Read §2 (permission catalog) alongside
this, since each action has its own RBAC requirement that must be
satisfied or the call 403s.

**This also means the UI, not just the API.** "Integrate DSR" implies a
real screen someone can use — a submit form and a history view — not a
backend that only you can call with curl. **Read §9 for what those
screens actually look like** (layout, fields, tabs, table columns) before
building your own from scratch.

> **Not in the table above: the To-Do task API.** ToDoItem (employee
> "My To-Do" tasks, and the "Assign DSR Task" delegation flow) has its
> own REST API — create, list, update, delete, complete — documented in
> §9.3, not in this table, because it doesn't have Approve/Reject or a
> Pending-for-me concept (it isn't routed through the approval engine
> §7 describes; a task just gets completed, which then creates a DSR
> that *does* go through that engine). If your integration touches task
> assignment at all, read §9.3's ToDoItem section too — it's easy to
> miss since it's filed under "UI reference" rather than its own
> top-level section.

---

## 1. Authentication

Every DSR endpoint requires a DRF **Token**:

```
Authorization: Token <api_token>
```

Get a token (also returns user, roles, and permission codes):

```bash
curl -X POST http://<host>/api/rbac/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "jane", "password": "secret"}'
```

Response contains `token`. Pass it in the `Authorization` header on every call.

> Webhook endpoints like `/api/rbac/attendance/webhook/` are public — the DSR
> endpoints are **not**.

---

## 2. DSR RBAC permission catalog

All 10 codes (from `create_all_permissions.py`, category `dsr`). `level` is a
relative sensitivity ranking, not a hierarchy.

| Code                  | Level | Meaning                                        |
|-----------------------|-------|------------------------------------------------|
| `dsr.indoor_view`     | 1     | View own indoor DSRs                           |
| `dsr.indoor_create`   | 1     | Create/submit indoor DSRs                      |
| `dsr.indoor_edit`     | 1     | Edit own indoor DSRs (pending only)            |
| `dsr.indoor_delete`   | 2     | Delete own indoor DSRs                         |
| `dsr.outdoor_view`    | 1     | View own outdoor DSRs                          |
| `dsr.outdoor_create`  | 2     | Create/submit outdoor DSRs                     |
| `dsr.outdoor_edit`    | 2     | Edit own outdoor DSRs (pending only)           |
| `dsr.outdoor_delete`  | 2     | Delete own outdoor DSRs                        |
| `dsr.view_all`        | 2     | View **all** employees' indoor + outdoor DSRs |
| `dsr.assign_task`     | 2     | Web-form-only, two different capabilities gated by the same code: (1) the Employee picker shown on the regular Indoor/Outdoor forms — submit/log a DSR **immediately, under another employee's name**, unchanged; (2) the "Assign DSR Task" page (`?dsr_type=assign`) — as of 2026-09-28 this **no longer creates a DSR directly**, see §9.3 "Assign DSR Task" for the new behavior. Deliberately separate from `dsr.view_all`, which is view-only. |

> **Known inconsistency:** the web form's "create for another employee"
> capability is gated on `dsr.assign_task`. The REST API's
> `POST /api/rbac/dsr/create/` still gates the same capability on
> `dsr.view_all` (see §3.2) — it was never updated to use the newer code.
> If you integrate against the API, a user needs `dsr.view_all` (not
> `dsr.assign_task`) to submit on someone else's behalf, even though the
> web UI now requires the opposite. Treat this as a gap to flag/fix rather
> than intended behavior if it matters to your integration.

Default role seeding (`create_all_permissions.py`):

| Role     | DSR permissions                                                         |
|----------|-------------------------------------------------------------------------|
| Employee | indoor_view, indoor_create, indoor_edit, outdoor_view                   |
| Manager  | indoor_view, indoor_create, indoor_edit, outdoor_view, `dsr.view_all`, `dsr.assign_task` |
| HR/Admin | all 10 codes                                                            |
| Marketing| indoor_view, outdoor_view, outdoor_create, outdoor_edit, outdoor_delete, `dsr.view_all`, `dsr.assign_task` |

Rules to remember:

- **Edit/Delete require ownership.** `dsr.view_all` only grants *viewing* others'
  reports — it does **not** grant editing or deleting them (matching the web form).
- `dsr.outdoor_create` OR `dsr.indoor_create` allows creating outdoor DSRs
  (parity with the web form).
- Updates are only allowed on **pending** reports (`pending_approval`, `pending`,
  `draft`); approved/rejected reports are read-only unless the actor is a superuser.

---

## 3. Endpoint reference

All routes are under `/api/rbac/` (Django URL names `rbac_api:*`).

### 3.1 List — `GET /api/rbac/dsr/`

Query params:

| Param              | Meaning                                          |
|--------------------|--------------------------------------------------|
| `username`         | Target user's username **or** employee `emp_id`. Defaults to the authenticated user. |
| `date` / `filter_date` | Filter by date (`YYYY-MM-DD`)                |
| `status` / `filter_status` | Filter by status (see §5)              |
| `type` / `dsr_type`| `indoor` or `outdoor`                            |

RBAC:

- Self: needs `dsr.indoor_view` and/or `dsr.outdoor_view`. Reports are filtered
  by type — you only see the types you have the matching view permission for.
- Others: needs `dsr.view_all` (403 otherwise).

```bash
curl http://<host>/api/rbac/dsr/?username=EMP999&status=pending_approval \
  -H "Authorization: Token <token>"
```

### 3.2 Create — `POST /api/rbac/dsr/create/`

RBAC: `dsr.indoor_create` (indoor) / `dsr.outdoor_create` or `dsr.indoor_create`
(outdoor), or superuser. Passing another employee's `employee_id`/`username`
additionally requires `dsr.view_all`.

Indoor payload:

```json
{
  "dsr_type": "indoor",
  "date": "2026-08-14",
  "title": "Fixed login timeout",
  "description": "Debugged and patched the login API.",
  "department": "Engineering",
  "task_type": "Development",
  "hours": 7.5,
  "start_time": "09:00",
  "end_time": "17:30",
  "call_for": "",
  "contact_person": "",
  "contact_number": "",
  "mail_id": "",
  "remarks": "",
  "next_follow_up": "2026-08-20"
}
```

> **Hours is NOT auto-calculated from `start_time`/`end_time` here — send
> it explicitly.** The web form's backend (`create_indoor` view) computes
> `hours` automatically from Start/End Time when both are given (rounds
> to 1 decimal, treats an End Time earlier than Start Time as an overnight
> shift by adding a day). `api_dsr_create` does **not** do this — it saves
> `start_time`/`end_time` as given but just stores whatever `hours` value
> you send (defaulting to `8.0` if omitted), regardless of what the times
> say. If you want the same auto-calculated behavior, compute it
> client-side before calling this endpoint: `hours = round((end - start
> in seconds) / 3600, 1)`, adding 24h worth of seconds if `end < start`.

Outdoor payload:

```json
{
  "dsr_type": "outdoor",
  "date": "2026-08-14",
  "company_name": "Acme Corp",
  "reason_for_visit": "Client Visit",
  "region": "South",
  "visit_plan": "Planned",
  "appointment_status": "Appointment Confirmed",
  "visit_status": "Completed",
  "visited_date": "2026-08-14",
  "meeting_output": "Discussed specs",
  "next_action_needed": "Send quotation",
  "mail_status": "Sent",
  "contact_person": "Ravi",
  "contact_number": "+91-9876543210",
  "mail_id": "ravi@acme.com",
  "remarks": "",
  "next_follow_up": "2026-08-21"
}
```

What happens server-side (mirrors the web form):

1. Report is created with `status = "pending_approval"`, `current_level = 1`.
2. Level-1 approver is resolved from the **Daily Service Report approval
   template**: `ApprovalTemplate` category `daily_report` via `LeaveApprovalRoute`
   (`workflow_type='daily_report'`), falling back to the first active employee
   with `dsr.view_all`.
3. A `DailyServiceReportHistory` **"Submitted"** entry is written.
4. The approver gets a `dsr_submitted` **notification**.

201 response includes the new `dsr_id` and the saved `title`/`description`.

> **The 9am–7pm submission window does NOT apply here.** The web form
> (`daily_service_report_list` view) blocks create actions outside
> 9:00–19:00 local time; `api_dsr_create` has no such check. If your
> integration needs the same restriction, enforce it in your own module
> before calling this endpoint — don't assume the API mirrors every web
> form rule.

### 3.3 Update — `POST|PUT|PATCH /api/rbac/dsr/<id>/update/`

RBAC: owner + `dsr.indoor_edit` / `dsr.outdoor_edit` (or superuser). Only
**pending** reports are editable (403 on approved/rejected).

Updateable fields: `date`, `department`, `task_type`, `title`, `description`,
`hours`, `start_time`, `end_time`, `company_name`, `region`, `visit_plan`,
`reason_for_visit`, `appointment_status`, `visit_status`, `visited_date`,
`meeting_output`, `next_action_needed`, `mail_status`, `contact_person`,
`contact_number`, `mail_id`, `call_for`, `remarks`, `next_follow_up`.

> `status` is **not** updateable — approval status can only change through the
> approve/reject flow, never via the API.

A successful update also writes a `DailyServiceReportHistory` **"Updated"** entry.

### 3.4 Delete — `POST|DELETE /api/rbac/dsr/<id>/delete/`

RBAC: owner + `dsr.indoor_delete` / `dsr.outdoor_delete` (or superuser).
`dsr.view_all` does **not** grant delete.

### 3.5 Approve — `POST /api/rbac/dsr/<id>/approve/`

Mirrors the web `dsr_approve` view exactly (`employees/api_views.py:api_dsr_approve`).

RBAC: superuser, or `dsr.view_all`, or being the report's actual
`current_approver`, or being in `report.get_approvers_for_current_level()`
(covers role/department-scoped routes too). 403 if none apply; 400 if the
report isn't currently `pending_approval`.

Body (optional): `{"comments": "..."}`.

Behavior: resolves `next_level = current_level + 1` via
`LeaveApprovalRoute.get_approver_for_level(employee, next_level, workflow_type='daily_report')`.
If a next approver exists, the report stays `pending_approval` at the new
level and that approver gets notified. If not, the report becomes fully
`approved` (`approved_by`/`approved_at` set). Either way, a
`DailyServiceReportHistory` "Approved" entry is written and an
`AuditLog` entry with `action='approve'` is recorded.

```bash
curl -X POST http://<host>/api/rbac/dsr/42/approve/ \
  -H "Authorization: Token <token>" -H "Content-Type: application/json" \
  -d '{"comments": "Looks good"}'
# => {"success": true, "message": "DSR fully approved.", "dsr_id": 42,
#     "status": "approved", "current_level": 1, "current_approver": null}
```

### 3.6 Reject — `POST /api/rbac/dsr/<id>/reject/`

Mirrors the web `dsr_reject` view exactly (`api_dsr_reject`). Same RBAC
as Approve (§3.5). Body: `{"rejection_reason": "..."}` (falls back to
`comments`, then a default string, if both are blank — but send a real
reason). Sets `status='rejected'` and `rejection_reason`, writes a
`DailyServiceReportHistory` "Rejected" entry, notifies the original
submitter, and records an `AuditLog` entry with `action='reject'`.

```bash
curl -X POST http://<host>/api/rbac/dsr/42/reject/ \
  -H "Authorization: Token <token>" -H "Content-Type: application/json" \
  -d '{"rejection_reason": "Missing task detail"}'
# => {"success": true, "message": "DSR rejected.", "dsr_id": 42,
#     "status": "rejected", "rejection_reason": "Missing task detail"}
```

### 3.7 "Pending for me" — `GET /api/rbac/dsr/pending-approval/` (new 2026-09-25)

**This is the fix for "approvers can't see what's waiting for them."**
`api_dsr_list` (§3.1) only ever lists one target employee's own reports —
there was never a way for an approver to ask "show me everything
currently waiting on *my* decision," regardless of whose report it is.
This endpoint answers exactly that.

RBAC: just being authenticated with an `Employee` profile — no
`dsr.view_all` or any other permission required. A report is included if
you are its resolved `current_approver`, **or** you show up in
`report.get_approvers_for_current_level()` (covers department/role-scoped
routes, and the `dsr.view_all` fallback path). This is the same
eligibility check `api_dsr_approve`/`api_dsr_reject` (§3.5/§3.6) already
use to authorize the actual approve/reject action — so if a report shows
up here, you are already allowed to act on it via those endpoints, no
extra permission lookup needed on your side.

```bash
curl http://<host>/api/rbac/dsr/pending-approval/ \
  -H "Authorization: Token <token>"
# => {"success": true, "count": 2, "pending": [
#      {"id": 42, "dsr_type": "indoor", "date": "2026-09-24",
#       "employee": {"id": 7, "name": "Ravi Kumar", "employee_id": "EMP007"},
#       "title": "...", "task_detail": "...", "current_level": 1,
#       "created_at": "2026-09-24T10:15:00"},
#      ...
#    ]}
```

No pagination and no filters beyond "pending and assigned to me" — same
small-team caveat as §6's existing "no pagination on list" gotcha. If the
requesting user has no `Employee` profile, 404.

---

## 4. Enforcing DSR RBAC in your own code

### Server-side (Python)

```python
from employees.permissions import check_user_permission, has_permission

# Direct check
if check_user_permission(request.user, 'dsr.view_all'):
    ...

# Decorator on a function view
@login_required
@has_permission('dsr.view_all')
def my_dsr_view(request):
    ...

# Any of a list
@has_any_permission(['dsr.indoor_view', 'dsr.outdoor_view', 'dsr.view_all'])
```

Find effective users of a permission (e.g. to build your own approver fallback):

```python
from employees.models import users_with_permission

view_all_users = users_with_permission('dsr.view_all')   # superusers + role grants + direct grants
```

### Frontend (Django templates)

The context processor injects `user_permission_codes` into every template:

```html
{% if 'dsr.view_all' in user_permission_codes %}
  <a href="{% url 'daily_service_report_list' %}">All DSRs</a>
{% endif %}
```

### External apps

Check the user's codes via `GET /api/rbac/user/permissions/list/`:

```bash
curl http://<host>/api/rbac/user/permissions/list/ -H "Authorization: Token <token>"
# => { "success": true, "total": N, "permissions": ["dsr.indoor_view", ...] }
```

---

## 5. DSR status values

| Value             | Display            |
|-------------------|--------------------|
| `pending_approval`| Pending Level N approval |
| `approved`        | Approved           |
| `rejected`        | Rejected           |
| `pending`         | Pending (legacy)   |
| `completed`       | Completed          |

---

## 6. Integration prerequisites & gotchas

### Prerequisites checklist

- **Users need DSR permissions assigned.** `python manage.py create_all_permissions`
  seeds the role defaults (Employee/Manager/HR/Marketing); anything custom is a
  `UserPermission` grant. A user with no DSR codes gets 403 on every endpoint.
- **Approval needs a template + route.** For reports to reach an approver, set up
  an `ApprovalTemplate` with `category='daily_report'` and a `LeaveApprovalRoute`
  with `workflow_type='daily_report'` (employee-, department-, or role-scoped).
  Without one, reports fall back to the first active employee with `dsr.view_all`.
  If nobody holds it, reports are created but nobody is notified.
- **External services need a provisioned identity.** Create the `User` (and its
  `Employee` profile), grant DSR permissions, then call `/api/rbac/login/` to get
  a token. The token is the only credential the APIs accept.
- **CORS is already enabled** (`CORS_ALLOW_ALL_ORIGINS = True`,
  `core/settings.py:251`) so cross-origin browser SPAs can call the APIs. In
  production, tighten it to `CORS_ALLOWED_ORIGINS` (settings.py:250).
- **Same-monolith module?** If the other module lives *inside this repo*, skip
  HTTP: `from employees.permissions import check_user_permission` and
  `from employees.models import users_with_permission` and call the DSR views /
  models directly. Only external systems need the REST API.

### Gotchas

- **Token auth only** — the DSR APIs never accept session/cookie auth; always
  send the `Authorization: Token` header.
- **Approver fallback is permission-based** — see checklist above; the fallback
  is the first active employee with `dsr.view_all` (never hardcoded roles).
- **Deleting a report removes its approval history** — same as the web form.
- **Thin validation** — malformed `hours` (negative/oversized) or bad
  `visited_date`/`start_time`/`end_time` values are not cleanly rejected and can
  surface as a 500. Sanitize client-side.
- **No pagination on list** — `GET /api/rbac/dsr/` returns every report for the
  target user. Fine for small teams; plan for volume if you integrate at scale.
- **`hours` is `DecimalField(max_digits=4, decimal_places=1)`** — max ~999.9.
- `title` is capped at 255 chars; `task_detail` is derived as
  `"title: description"` when you don't send it explicitly.
- Naive local datetimes (`USE_TZ = False`, Asia/Kolkata) — send plain
  `YYYY-MM-DD` dates.

---

## 7. The approval-workflow engine (reusable by any module)

DSR and Expense Report don't have their own approval logic — they're both
thin wrappers around one shared engine (`employees/models.py`). If your new
module needs "submit → route to the right approver(s) → approve/reject,
maybe over several levels", plug into this instead of writing new routing
logic.

### 7.1 The three models

```python
class ApprovalTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('leave', 'Leave Management'),
        ('daily_report', 'Daily Service Report'),
        ('expense', 'Expense'),
        ('attendance', 'Attendance'),
        ('marketing', 'Marketing'),
        # add your own, e.g. ('purchase_order', 'Purchase Order'),
    ]
    name = models.CharField(max_length=120, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    levels_needed = models.PositiveIntegerField(null=True, blank=True)
    # ... description, timestamps

class ApprovalTemplateStep(models.Model):
    template = models.ForeignKey(ApprovalTemplate, related_name='steps', ...)
    level = models.PositiveIntegerField(default=1)
    approver = models.ForeignKey(Employee, ...)

class LeaveApprovalRoute(models.Model):
    employee = models.ForeignKey(Employee, null=True, blank=True, ...)       # employee-specific override
    department = models.ForeignKey(Department, null=True, blank=True, ...)   # department-wide
    requester_role = models.ForeignKey(Role, null=True, blank=True, ...)     # role-wide
    template = models.ForeignKey(ApprovalTemplate, ...)
    workflow_type = models.CharField(max_length=50, choices=[
        ('leave', 'Leave Approval'),
        ('attendance', 'Attendance Approval'),
        ('marketing', 'Marketing Approval'),
        ('expenses', 'Expenses Approval'),
        ('daily_report', 'Daily Service Report Approval'),
        # add your own, e.g. ('purchase_order', 'Purchase Order Approval'),
    ])
```

`ApprovalTemplate.category` and `LeaveApprovalRoute.workflow_type` are two
separate string fields that must be kept in sync by convention (there's no
FK between them) — e.g. category `'expense'` pairs with workflow_type
`'expenses'` (note the `s` — an existing naming inconsistency, not a typo
you should copy but one you should expect). **To add a new module**, add
one new value to each `choices` list, migrate, and use that pair
end-to-end.

### 7.2 Resolution order — `LeaveApprovalRoute.get_approver_for_level(employee, level, workflow_type)`

1. Route scoped to that exact `employee` for this `workflow_type`.
2. Else, route scoped to the employee's `department`.
3. Else, route scoped to the employee's primary `Role`.
4. Whichever route is found (if any), look up `route.template.steps` for
   the requested `level`. If `template.levels_needed` is set and `level`
   exceeds it, there is no next approver — the item is done.
5. If no route exists at all, DSR/Expense fall back to (a) the employee's
   `performance_manager`, then (b) anyone holding the module's `*.view_all`
   permission. **This fallback is written per-model, not by the engine
   itself** — copy the pattern (see `DailyServiceReport.get_approvers_for_current_level`
   / `DailyExpenseVoucher.get_approvers_for_current_level` in `models.py`)
   into your own model's equivalent method rather than expecting the engine
   to do it for you.

### 7.3 What your new model needs to implement this pattern

Looking at `DailyServiceReport` / `DailyExpenseVoucher` as the reference
shape, your model needs:

- `status` (`pending_approval` / `approved` / `rejected`), `current_level`,
  `current_approver` (FK to `Employee`, `SET_NULL`), `approved_by`,
  `approved_at`, `rejection_reason`.
- A `get_approvers_for_current_level()` method following the resolution
  order in §7.2, ending in your own permission-based fallback.
- A `*History` model (mirrors `DailyServiceReportHistory` /
  `DailyExpenseVoucherHistory`) with `stage_name`, `actor`, `actor_name`,
  `action`, `status_before`, `status_after`, `comments`, `created_at` — an
  audit trail entry gets written on submit/approve/reject/update.
- Approve/reject view functions structurally identical to `dsr_approve` /
  `dsr_reject` / `expense_voucher_approve` / `expense_voucher_reject`:
  resolve `next_level = current_level + 1`, look up
  `LeaveApprovalRoute.get_approver_for_level(employee, next_level, your_workflow_type)`
  — if found, advance to that level and notify them; if not, mark
  `approved` and stop.

### 7.4 Managing templates and routes — through the real admin UI

There's a proper UI for this (not just Django admin), gated by
`workflow.approval_template_builder` / `.edit` permissions:

| Page | URL name | What it does |
|------|----------|--------------|
| Approval Template Builder | `approval_template_list` / `approval_template_new` / `approval_template_edit` | Create/edit an `ApprovalTemplate` — pick `category`, add ordered approval steps (employee per level). |
| Template Mapping | `leave_route_list` | Bulk-assign a template to employees/departments/roles, creating the matching `LeaveApprovalRoute` row(s). The `category → workflow_type` conversion (`category_to_workflow` dict in `leave_route_list` view) happens here — this is where you'd add your new category/workflow_type pair if you also want it selectable in this shared mapping UI. |
| Active Mappings | `active_mappings_list` | Read-only list of every existing `LeaveApprovalRoute`, across all workflow types. |

This means: to onboard a brand-new approval-driven module with **zero new
UI work**, add its `category`/`workflow_type` pair to the choices lists in
§7.1 and to `category_to_workflow` in `employees/views.py`'s
`leave_route_list`, and admins can create/assign templates for it through
the existing pages immediately.

### 7.5 Resolving a user's current approval templates via API

`GET /api/rbac/approval-templates/?username=<name>` (from
`api_user_approval_template` in `api_views.py`) already loops over
`workflow_types = ['leave', 'attendance', 'marketing', 'expenses', 'daily_report']`
and returns the resolved template (name, category, steps, approvers) or
`is_default: true` if none is mapped, for each type, in one call. If you
add a new workflow_type, add it to that list too so it shows up here.

---

## 8. Daily Expense Report (single-day expense voucher)

A second, simpler example of §7's engine — one flat entry per day (not a
multi-day header+lines structure), submitted the same way as Indoor/Outdoor
DSR.

### 8.1 Permission catalog (category `expense_report`)

| Code | Level | Meaning |
|------|-------|---------|
| `expense_report.view` | 1 | View own expense reports |
| `expense_report.create` | 1 | Create/submit an expense report |
| `expense_report.edit` | 1 | Edit own pending expense report |
| `expense_report.delete` | 2 | Delete an expense report |
| `expense_report.view_all` | 2 | View **all** employees' expense reports and approve/reject them |

Default role seeding: Admin/HR get all 5; Manager and Marketing Manager get
view/create/edit/view_all (no delete); Employee gets view/create/edit only.

### 8.2 Data model — `DailyExpenseVoucher` (`employees/models.py`)

One row = one day's expense claim (no separate line-items model):

```python
employee, date, tour_destination, description, company_name,
travelling_bus, travelling_shared_auto, lodging, day_allowance, phone,
material_purchase, cash_pay_to_other, total,
# + the same status/current_level/current_approver/approved_by/approved_at/
#   rejection_reason fields as DailyServiceReport
```

`total` is always computed **server-side** as the sum of the 7 expense
fields — never trust a client-submitted total. Routes through the engine
under `workflow_type='expenses'` / `ApprovalTemplate category='expense'`
(see §7).

### 8.3 REST API — `/api/rbac/expense/*` (same token auth as DSR)

Expense Report now has full REST API parity with DSR (§3), under
`/api/rbac/expense/` (Django URL names `rbac_api:api_expense_*`). Same
`Authorization: Token <token>` auth as everything else in §1 — **not**
the web form's session auth.

**List — `GET /api/rbac/expense/`**

Same query params as DSR's list (§3.1): `username` (defaults to self),
`date`/`filter_date`, `status`/`filter_status`. RBAC: self needs
`expense_report.view` (or `.view_all`); viewing another employee needs
`expense_report.view_all`.

```bash
curl "http://<host>/api/rbac/expense/?username=EMP999&status=pending_approval" \
  -H "Authorization: Token <token>"
```

**Create — `POST /api/rbac/expense/create/`**

RBAC: `expense_report.create` (or superuser) to create for yourself;
creating for another employee (`employee_id` or `username` in the body)
additionally requires `expense_report.view_all` — note this uses
`expense_report.view_all`, not an "assign" permission (there's no
Expense-Report equivalent of `dsr.assign_task`).

```json
{
  "date": "2026-06-01",
  "tour_destination": "Pune - Nashik",
  "description": "Client site visit",
  "company_name": "Acme Corp",
  "travelling_bus": 100,
  "travelling_shared_auto": 0,
  "lodging": 500,
  "day_allowance": 300,
  "phone": 0,
  "material_purchase": 0,
  "cash_pay_to_other": 0
}
```

All fields optional except `date` (defaults to today); all 7 amount
fields default to `0` and **`total` is always computed server-side** as
their sum — never send/trust a client-computed total. Same server-side
behavior as `api_dsr_create` (§3.2): resolves the level-1 approver via
`LeaveApprovalRoute.get_approver_for_level(employee, level=1, workflow_type='expenses')`
with the model's own fallback chain, writes a `DailyExpenseVoucherHistory`
"Submitted" entry, and notifies the approver (`expense_submitted`
notification type). 201 response includes `expense_id`.

> Like `api_dsr_create`, this endpoint does **not** enforce the 9am–7pm
> submission window (§8.4) — that's a web-form-only rule.

**Update — `POST|PUT|PATCH /api/rbac/expense/<id>/update/`**

RBAC: owner + `expense_report.edit` (or superuser). Only
`pending_approval` reports are editable. Updatable fields: `date`,
`tour_destination`, `description`, `company_name`, and the 7 amount
fields — `total` is recomputed server-side on every update, same as
create. Writes a `DailyExpenseVoucherHistory` "Updated" entry.

**Delete — `POST|DELETE /api/rbac/expense/<id>/delete/`**

RBAC: owner + `expense_report.delete` (or superuser) — mirrors the web
form's `delete_expense_voucher` view exactly.

**Approve — `POST /api/rbac/expense/<id>/approve/`**

Mirrors the web `expense_voucher_approve` view exactly
(`api_expense_approve`). RBAC: superuser, `expense_report.view_all`, being
the voucher's `current_approver`, or being in
`voucher.get_approvers_for_current_level()`. 403 otherwise; 400 if not
currently `pending_approval`. Body (optional): `{"comments": "..."}`.
Same next-level-or-final-approval behavior as DSR's approve (§3.5), using
`workflow_type='expenses'`. Writes a `DailyExpenseVoucherHistory`
"Approved" entry and an `AuditLog` `action='approve'` entry.

**Reject — `POST /api/rbac/expense/<id>/reject/`**

Mirrors `expense_voucher_reject` exactly (`api_expense_reject`). Same RBAC
as Approve above. Body: `{"rejection_reason": "..."}` (falls back to
`comments`, then a default string). Writes a `DailyExpenseVoucherHistory`
"Rejected" entry and an `AuditLog` `action='reject'` entry.

```bash
curl -X POST http://<host>/api/rbac/expense/17/approve/ \
  -H "Authorization: Token <token>" -H "Content-Type: application/json" -d '{}'
# => {"success": true, "message": "Expense report fully approved.",
#     "expense_id": 17, "status": "approved", "current_level": 1, "current_approver": null}

curl -X POST http://<host>/api/rbac/expense/18/reject/ \
  -H "Authorization: Token <token>" -H "Content-Type: application/json" \
  -d '{"rejection_reason": "No receipts attached"}'
```

**Pending for me — `GET /api/rbac/expense/pending-approval/` (new 2026-09-25)**

Same "pending for me" fix as DSR's §3.7 — `api_expense_list` (§8.3 above)
only ever lists one target employee's own vouchers, so there was no way
to ask "what expense reports are waiting on my approval right now."
Same RBAC as §3.7 (just authenticated + an `Employee` profile, no
`expense_report.view_all` required), same eligibility rule
(`current_approver` match or in `voucher.get_approvers_for_current_level()`).

```bash
curl http://<host>/api/rbac/expense/pending-approval/ \
  -H "Authorization: Token <token>"
# => {"success": true, "count": 1, "pending": [
#      {"id": 17, "date": "2026-09-24",
#       "employee": {"id": 7, "name": "Ravi Kumar", "employee_id": "EMP007"},
#       "tour_destination": "Pune - Nashik", "total": 650.0,
#       "current_level": 1, "created_at": "2026-09-24T10:15:00"}
#    ]}
```

### 8.4 Same 9am–7pm submission window as DSR (web form only)

`create_expense` is gated by the same
`DSR_SUBMISSION_WINDOW_START`/`END` (9:00–19:00 local time) check as
`create_indoor`/`create_outdoor`, in the same view
(`daily_service_report_list`). Backdating to any past date is allowed —
only the **time of day you submit at** is restricted, not the date on the
report.

---

## 9. UI reference — copy this literally for a 1:1 match

**This section is not a paraphrase — it is real markup copied verbatim
from the actual templates** (`templates/employees/daily_service_report_list.html`,
`daily_service_report_view.html`). If your other module renders HTML with
Tailwind available, copy these blocks byte-for-byte (just swap the Django
template tags for your own templating) and you will get a pixel-identical
result — this is the fix for "the AI didn't make the same UI": it was
working from a prose description before, not the actual code. If your
module uses a different CSS approach entirely (no Tailwind), reproduce the
same DOM structure/classes-as-hooks/behavior with your own styling, but do
not improvise the layout, table structure, or field order — they are
fixed below, exactly as they exist in HRMS today.

### 9.1 Where it lives in navigation

Sidebar, inside a collapsible "Work & Approvals" group:

```html
<a href="{% url 'daily_service_report_list' %}" class="sidebar-link">
    {% include 'components/icon.html' with name="clipboard-check" %} Log DSR
</a>
<a href="{% url 'daily_service_report_view' %}" class="sidebar-link">
    {% include 'components/icon.html' with name="file-spreadsheet" %} View DSR History
    <span class="sidebar-menu-badge ml-auto" data-menu="daily_service_reports"></span>
</a>
```

Only **two** sidebar entries — "Pending My Approval" (§9.7) is **not** a
separate sidebar link or a separate URL. It's the 4th tab on the same
"View DSR History" page (`?dsr_type=pending`), exactly like Indoor/
Outdoor/Expense Report are tabs on that same page rather than separate
sidebar entries. (An earlier revision of this doc, 2026-09-25, described
it as its own page at `/daily-service-reports/pending-approval/` with its
own sidebar link — that was reworked into a tab the same day for
consistency with how every other DSR view already works. If you're
integrating against the **API**, nothing changes: `/api/rbac/dsr/
pending-approval/` and `/api/rbac/expense/pending-approval/` (§3.7/§8.3)
are unaffected — only the internal HRMS web page structure changed.)

Navbar "+" quick-add dropdown (top of every page) — three shortcuts that
just deep-link into the create page with a different starting tab/mode:

```html
<a href="{% url 'daily_service_report_list' %}" class="navbar-add-task-panel__item">Add DSR</a>
<a href="{% url 'daily_service_report_list' %}?dsr_type=assign" class="navbar-add-task-panel__item">Assign DSR Task</a>
<a href="{% url 'daily_service_report_list' %}?dsr_type=expense" class="navbar-add-task-panel__item">Add Expense Report</a>
```

### 9.2 The reusable custom-dropdown component

Every non-native dropdown in these screens (Department, Task Type,
Visit Plan, Employee picker, Status, etc.) is **not** a plain `<select>` —
it's a hidden real `<select>` (so the value still posts normally) paired
with a styled button+menu that's purely visual. Reuse this exact pattern
for every dropdown in your own UI, don't invent a different one per field:

```html
<!-- The real, posted value — hidden, never shown -->
<select name="department" id="dsr-department" class="hidden" required>
    <option value="" disabled selected>-- Select Department --</option>
    <option value="Marketing">Marketing</option>
    <option value="Service">Service</option>
    <option value="Other">Other</option>
</select>

<!-- The visible, styled dropdown -->
<div class="custom-dropdown relative" data-target="dsr-department">
    <button type="button" class="custom-dropdown-button w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm transition-all duration-200 hover:border-gray-400 text-left flex items-center justify-between cursor-pointer">
        <span class="selected-text text-gray-400 italic">-- Select Department --</span>
        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-400 transition-transform duration-200"></i>
    </button>
    <div class="custom-dropdown-menu hidden absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
        <div class="py-1">
            <div class="dropdown-option px-3 py-2 text-sm text-gray-400 italic hover:bg-gray-50 cursor-pointer transition-colors" data-value="">-- Select Department --</div>
            <div class="dropdown-option px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors" data-value="Marketing">Marketing</div>
            <div class="dropdown-option px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors" data-value="Service">Service</div>
            <div class="dropdown-option px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors" data-value="Other">Other</div>
        </div>
    </div>
</div>
```

The JS that drives **every** `.custom-dropdown` on the page (one shared
init, not per-field code) — `data-target` on the wrapper points at the
hidden `<select>`'s `id`:

```javascript
function initCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const button = dropdown.querySelector('.custom-dropdown-button');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const hiddenSelect = document.getElementById(dropdown.getAttribute('data-target'));
        if (!button || !menu || !hiddenSelect) return;

        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const isHidden = menu.classList.contains('hidden');
            closeAllCustomDropdowns();
            if (isHidden) {
                menu.classList.remove('hidden');
                button.querySelector('[data-lucide="chevron-down"]').style.transform = 'rotate(180deg)';
            }
        });
        bindDropdownOptions(dropdown);
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.custom-dropdown')) closeAllCustomDropdowns();
    });
}

function closeAllCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        dropdown.querySelector('.custom-dropdown-menu')?.classList.add('hidden');
        const chevron = dropdown.querySelector('[data-lucide="chevron-down"]');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    });
}

function bindDropdownOptions(dropdown) {
    const hiddenSelect = document.getElementById(dropdown.getAttribute('data-target'));
    const selectedText = dropdown.querySelector('.selected-text');
    dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.onclick = function(e) {
            e.stopPropagation();
            const val = this.getAttribute('data-value');
            hiddenSelect.value = val;
            hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
            selectedText.textContent = this.textContent.trim();
            selectedText.className = val ? 'selected-text text-gray-900 font-medium' : 'selected-text text-gray-400 italic';
            dropdown.querySelector('.custom-dropdown-menu').classList.add('hidden');
        };
    });
}
```

A plain text/date/number field (for reference — everything that ISN'T a
dropdown uses this exact input styling, e.g. Date, Title, Tour
Destination):

```html
<label class="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">Date <span class="text-red-500">*</span></label>
<input type="date" name="date" class="w-full h-10 px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-200" required>
```

### 9.3 The Create page

**One page, not four** — Indoor DSR, Outdoor DSR, Expense Report, and
"Assign DSR Task" are all the same URL/view with different `?dsr_type=`.
Tab switcher markup (pill buttons in a light-gray track):

```html
<div class="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-gray-200">
    <div class="inline-flex items-center p-1 bg-gray-100/80 rounded-lg border border-gray-200 gap-1">
        <button type="button" data-dsr-type="indoor"
           class="dsr-tab inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all bg-white text-blue-600 shadow-sm border border-gray-200/60">
            <i data-lucide="building-2" class="w-4 h-4"></i> Indoor DSR
        </button>
        <button type="button" data-dsr-type="outdoor"
           class="dsr-tab inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50">
            <i data-lucide="map-pin" class="w-4 h-4"></i> Outdoor DSR (OD Plan &amp; Visit)
        </button>
        <button type="button" data-dsr-type="expense"
           class="dsr-tab inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all text-gray-600 hover:text-gray-900 hover:bg-white/50">
            <i data-lucide="file-text" class="w-4 h-4"></i> Expense Report
        </button>
    </div>
</div>
```
(Active tab = `bg-white text-blue-600 shadow-sm border border-gray-200/60`; inactive = `text-gray-600 hover:text-gray-900 hover:bg-white/50`. Clicking a tab fires an AJAX fetch of the same URL with a different `?dsr_type=`, swaps the returned HTML into the form-card container, then re-runs `initCustomDropdowns()`/icon init on the new DOM — no full page reload.)

Below the tabs, one card holds the active form:

```html
<div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6" id="dsr-form-card">
    <div class="bg-gray-50/80 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <i data-lucide="clipboard-check" class="w-5 h-5"></i>
            </div>
            <div>
                <h3 class="text-base font-semibold text-gray-900">Log Daily Service Report</h3>
                <p class="text-xs text-gray-500">Enter task information and optional client calling details</p>
            </div>
        </div>
    </div>
    <form method="post" class="p-6 space-y-5">
        <!-- fields go here, see field order below -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Reset Form</button>
            <button type="submit" class="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors">Submit</button>
        </div>
    </form>
</div>
```

**Field order, exact:**

- **Indoor DSR**: Employee picker (only if `dsr.assign_task`) → Date → Department + Task Type (two custom-dropdowns side by side; Task Type's options depend on Department picked, see table below) → Title → Description → Start Time / End Time / OT Minutes (one row, 3 fields — **but see the OT Minutes API gap noted below**), immediately followed by a **live "Duration: X hours Y minutes" line** that appears the instant both times are filled and updates on every keystroke — computed client-side with the exact same overnight-shift/rounding rules as the server (see `updateDsrDuration`/`hoursToWords` in the template's JS), so what's previewed always matches what gets saved → collapsible "Calling Details (Optional)" section (collapsed by default) → Contact Person, Contact Number, Mail ID, Call For, Remarks, Next Follow-up Date.
- **Outdoor DSR**: Employee picker (same rule) → Date → Visit Plan (fixed 3 options, see table) → Region (free text) → Department + Task Type (outdoor-specific options, see table) → Company Name → Contact Person / Contact Number / Mail ID → Reason for Visit (fixed list, see table) → Appointment Status (fixed 2 options) → Visit Status (fixed 3 options) → Visited Date → Meeting Output (free text) → Next Action Needed (free text) → Mail Status (free text, no fixed list) → Remarks → Next Follow-up Date.
- **Expense Report** (§8.2): Submitted By (read-only) → Date + Tour Destination (one row) → Description & Location of Work + Company Name (one row) → 4-column grid of the 7 amount fields + a read-only live-computed Total.
- **Assign DSR Task** (`?dsr_type=assign`, tab switcher hidden entirely): **Assign To** — a searchable multi-select picker (required, picks one *or more* employees the task is for; see the multi-assign note below) → Task Title → Task Description → **Complete By Date** (required, defaults to today) + **Complete By Time** (defaults to 18:00). Submitted with `action_type=assign_task` (not `create_indoor` — see the behavior change below).

**"Assign DSR Task" is a genuine pending assignment with a deadline, not
an instant DSR log (changed 2026-09-28).** Submitting this form does
**not** create a `DailyServiceReport` at all. Instead it creates a
`ToDoItem` (`employees/models.py`) with `employee=<the picked person>`,
`assigned_by=<whoever submitted the form>`, and `due_at=<the Complete By
date+time, combined>`. The assignee is sent a `task_assigned` notification
and sees the task appear — labeled "Assigned by {name}" plus its due
date — in **their own** "My To-Dos" dashboard card and full "My To-Do"
page (`/todo/`, `templates/employees/todo_list.html`), exactly alongside
tasks they created for themselves; nothing new was built for this, it
reuses the existing self-service To-Do system verbatim. A task overdue
(`due_at` in the past and still `status='pending'`, exposed as the
`ToDoItem.is_overdue` property) is shown with red styling in both places.

**You can assign the same task to multiple employees in one submission
(added 2026-09-28).** The "Assign To" field is a checkbox multi-select
with a live search box (filters the employee list client-side as you
type — there's no server-side search endpoint, the full employee list is
rendered into the page and filtered in JS), not a single `<select>`. Every
checked box shares the `name="employee_id"` attribute, so the form posts
**one or more** `employee_id` values under that same key —
`request.POST.getlist('employee_id')` on the server, not `.get()`. The
view filters those to numeric IDs, resolves them via
`Employee.objects.filter(id__in=...)`, and then loops: **one independent
`ToDoItem` and one `task_assigned` notification per selected employee**,
not one shared task. Each assignee sees only their own copy in their own
`/todo/` list; completing one has no effect on the others. The success
response/message reflects the count — `"Task assigned to {name}, due
..."` for a single employee, or `"Task assigned to N employees (A, B,
C), due ..."` for multiple. At least one valid employee ID is still
required (same 400 error as before if none resolve); Task Title and
Complete By Date are unchanged, required regardless of how many employees
are picked.

**The DSR only gets created later, when the assignee marks the task
complete** — `ToDoItem.mark_completed()` auto-creates an Indoor
`DailyServiceReport` for them at that point, with `hours` computed from
wall-clock time between the task being assigned and completed, and routes
it into the normal DSR approval flow exactly like any other submission.

**If the task was completed after its deadline, the resulting DSR's
`task_detail` carries a visible "late" note (added 2026-09-28).**
`ToDoItem.overdue_by` is a property (`completed_at - due_at`, or `None`
if completed on time or still pending) — no new DB field. When it's
completed late, `_create_dsr_entry()` appends a suffix like `[Completed 2
days 3 hours late — was due 06/06/2026 05:00 PM]` to the auto-created
DSR's **`task_detail` field only** (the DSR's `description` field still
gets the assignee's raw, un-suffixed `ToDoItem.description` verbatim).
That means **the DSR list/detail API responses (§3.1/§3.2) can contain
this bracketed suffix in `task_detail` for To-Do-generated DSRs** — if
your module parses or displays `task_detail` verbatim, be aware it isn't
always just the task title the assignee typed. On-time completions get
no such suffix. The same "late" information is also shown to the employee
themselves (a red "X late" note under the due date on both `/todo/` and
the dashboard "My To-Dos" card) — there's no separate API field for it,
it only exists as this text embedded in `task_detail`.

**There is now a REST API for ToDoItem (added 2026-09-28)** —
`api_todo_create`/`api_todo_list`/`api_todo_complete` in
`employees/api_views.py`, same token auth as the DSR/Expense endpoints.
This is the endpoint to use if your module needs to create tasks in
someone's HRMS To-Do list directly, rather than going through the web
"Assign DSR Task" form.

- **`POST /api/rbac/todo/create/`** — body: `title` (required),
  `description` (optional), `employee_id` (single) or `employee_ids`
  (list) — who the task is for; omit both to create it for the
  authenticated user themselves. Assigning to anyone other than yourself
  requires `dsr.assign_task` (or superuser) — same permission as the web
  form, checked the same way. `due_date` (`YYYY-MM-DD`) + `due_time`
  (`HH:MM`, defaults to `18:00` if `due_date` is given but `due_time`
  isn't) are both optional — unlike the web "Assign DSR Task" form, the
  API does **not** require a due date; omit `due_date` entirely for a
  task with no deadline. **One independent `ToDoItem` is created per
  resolved employee** when `employee_ids` has more than one entry —
  matching the web multi-select added the same day — not one shared
  task; each gets their own `task_assigned` notification. Response:
  `{"success": true, "message": "...", "count": N, "tasks": [...]}`
  (always a list, even for one employee), `201` on success.
- **`GET /api/rbac/todo/`** — list a user's tasks. `?username=` or
  `?employee_id=` picks whose list (defaults to the authenticated user);
  viewing anyone else's requires `dsr.assign_task`, `dsr.view_all`, or
  superuser. Optional `?status=pending|completed` and `?date=YYYY-MM-DD`
  filters. Each task in the response includes `is_overdue` (bool) and
  `overdue_by` (a words string like `"2 days 3 hours"`, or `null`) —
  the same properties described above, exposed directly here so you
  don't have to compute them yourself.
- **`POST /api/rbac/todo/<id>/complete/`** — marks the task complete.
  Only the task's own employee (or superuser) can call this — same rule
  as the web `todo_toggle` view; anyone else gets `403`. Calling it on an
  already-completed task returns `400`. On success, this triggers the
  exact same `ToDoItem.mark_completed()` → auto-create-a-DSR path as
  completing it from the web "My To-Do" list, and the response includes
  `"dsr_id": <id>` (or `null` if nothing was created, which shouldn't
  happen for a task that was genuinely `pending`) so you don't have to
  guess or search for the resulting DSR — you can immediately follow up
  with `GET /api/rbac/dsr/<dsr_id>/` semantics via §3.1 if you need its
  full detail.

- **`POST|PUT|PATCH /api/rbac/todo/<id>/update/`** (added 2026-09-28) —
  edit `title`, `description`, and/or the deadline. Only present fields
  are changed. To clear a deadline entirely, pass `due_date` as an empty
  string; to change only the time on an existing deadline, pass
  `due_time` alone (keeps the existing date). **Unlike DSR's update
  endpoint, this isn't mirroring a web capability — the web UI has no
  edit action for ToDoItem at all**, only create/toggle/delete. Allowed
  for the task's own employee, whoever originally assigned it
  (`assigned_by`), or a superuser. Only **pending** tasks can be updated
  — once completed, the DSR it generated is the record of what happened,
  not the task; `400` if you try.
- **`POST|DELETE /api/rbac/todo/<id>/delete/`** (added 2026-09-28) — same
  permission rule as update (owner, assigner, or superuser). No status
  restriction — you can delete a completed task too (matches the DSR
  delete endpoint's own behavior); doing so does not touch or delete the
  DSR that completing it already generated.

There is still no `reopen` endpoint for ToDoItem over the API (the web
`todo_toggle` view supports un-completing a task; the API doesn't). If
your module needs that, it doesn't exist yet; treat that the same way as
the other gaps in this file (OT Minutes, etc.) and flag it if it blocks
you.

**Exact option lists for every fixed dropdown** (from
`templates/employees/daily_service_report_list.html` — the `<option>`
values are what actually gets saved/sent, not the display text, though
here they're identical):

| Field | Options (in order) |
|---|---|
| Indoor **Department** | Marketing, Service, QC, QA, Design, Production, General, HR & Admin, IT, PLC, Other |
| Indoor **Task Type** by Department | Marketing: Quotation, FAT, Calling, Documentation, Meeting, Other · Service: Service Support, Software Installation, Software Support, Software Testing, PLC Support, Documentation, Demo, Training Session, Verification, FAT, Internal Meeting, Internal Audit, Meeting, Other · QC: Inward Testing, Machine Testing, FAT, Documentation, Testing, Meeting, Other · QA: File Preparation, Engg Support, Other Documentation, SOP Preparation & Manual, FAT Support, Meeting · Design: Design and Drawing, Meeting, Other · Production: Work, Meeting, Other · General: Interview, Training, Meeting, Other · HR & Admin: Interview, Onboarding, Other · IT: Complaints, Installation, Support, Software OQ, Other · PLC: Program Testing, Support, Complaint, Other · **Other: no fixed list — the Task Type field becomes a free-text input instead of a dropdown** |
| Outdoor **Department** | Marketing, Service, Other |
| Outdoor **Task Type** by Department | Marketing: Planned Visit, Unplanned Visit, Follow up, Order Closing, Layout Check, Cold Calling, Exhibition, Travelling, Other · Service: Installation, AMC / CAMC, Calibration & Validation, Complaint Resolution, Layout Check, Migration, Software Work, PLC Work, Travelling, Demo, Customer Meeting, Audit Support, Other · **Other: no fixed list — free-typed**, same as indoor |
| Outdoor **Visit Plan** | Planned (default), Unplanned, Direct Visit |
| Outdoor **Reason for Visit** | First Visit, Inquiry Collection, Follow up, Casual Visit, Order Finalization, Technical Discussions, Payment Follow up, Payment Collection, Any Issue/Escalation, Upgradation Requirement, AMC Requirement, Other |
| Outdoor **Appointment Status** | Appointment Confirmed (default), Direct Visit |
| Outdoor **Visit Status** | Completed (default), Rescheduled, Cancelled |
| Outdoor **Mail Status** | Free text — no fixed dropdown |

> **B. "OT Minutes" is a real gap between the web form and the API — and
> it's write-only even on the web form itself.** The Indoor DSR web form
> has an OT Minutes field (`DailyServiceReport.ot_minutes` on the model),
> but two separate things are true about it:
> 1. `api_dsr_create`/`api_dsr_update` (§3.2/§3.3) **do not accept or
>    return it at all** — only `hours`. There is currently no way to
>    submit or read OT minutes through the API.
> 2. Even in the real HRMS web UI, once you type an OT Minutes value and
>    save, **it is never shown again anywhere** — not in DSR History, not
>    anywhere else. It's stored in the database but nothing renders it
>    back. It's also completely independent of Start Time/End Time/Hours
>    (§C below) — it's just a plain number the user types, not calculated
>    from anything and not added into the Hours total.
>
> Net effect: don't build a UI field for something the API can't carry (as
> before), and don't assume OT Minutes is visible/meaningful anywhere
> downstream even if you did wire it up server-side — right now it's a
> pure write-only sink in HRMS itself.

> **C. Start Time / End Time auto-calculate Hours — live in the browser,
> and again (independently) on the server.** As of 2026-09-24, typing
> both Start Time and End Time on the Indoor create form shows a live
> "Duration: X hours Y minutes" preview instantly, computed client-side.
> On submit, the server recomputes the same thing from scratch (it does
> not trust the browser's number) and that becomes the saved `hours`
> value, rounded to the nearest 0.1 hour. If End Time is earlier than
> Start Time, both the preview and the server treat it as an **overnight
> shift** (add 24 hours) rather than erroring or going negative — e.g.
> Start 21:00 / End 02:00 → "5 hours", not an error. If either field is
> left blank, `hours` defaults to `8.0`.
>
> **A likely point of confusion when testing this, worth knowing in
> advance:** the `<input type="time">` field always stores/sends a plain
> 24-hour value like `"20:00"`, but browsers commonly *display* it to the
> user in their locale's 12-hour format with AM/PM (so `20:00` shows on
> screen as `08:00 PM`). This is standard browser behavior, not a bug in
> either HRMS or your own module if you use the same input type — but it
> can look alarming the first time (typing an hour and seeing a different
> number appear) if you don't already know the display and the underlying
> value are two different things.

### 9.4 The History page

Filter bar, exact markup (indoor shown; outdoor/expense are the same
shape with different search placeholder text):

```html
<div class="bg-gray-50/80 border-b border-gray-200 p-4">
    <form method="get" class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input type="hidden" name="dsr_type" value="indoor">
        <div class="flex flex-wrap items-center gap-3">
            <div class="relative min-w-[15rem]">
                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" name="q" placeholder="Search tasks, person, remarks..."
                       class="w-full h-9 pl-9 pr-3 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400">
            </div>
            <input type="date" name="filter_date" onchange="this.form.submit()"
                   class="h-9 px-3 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <select name="filter_status" onchange="this.form.submit()"
                    class="h-9 px-3 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Status</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
            <!-- Employee filter <select name="employee_id"> only rendered if the user has *.view_all -->
        </div>
        <a href="?dsr_type=indoor" class="inline-flex h-9 items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">Reset Filters</a>
    </form>
</div>
```

Table header — note the **two-tier `<thead>`**: a row of `rowspan="2"`
main columns plus one `colspan="6"` grouped header ("Calling Details")
whose own sub-columns are a second `<tr>` directly below it. Expense
Report has **no** second tier — its table is flat (single header row, see
§8.2/§8.3 for its column list).

**D. Outdoor's grouped header — the exact real columns, not a guess.**
Outdoor uses the same two-tier pattern but with `colspan="4"` and the
group is titled **"Contact Details"**, not "Visit Details" (that name
belongs to the *main*, non-grouped column next to it). The 4 grouped
sub-columns are exactly: **Contact Person, Contact No, Location / Site,
Next Follow-up** — not Company/Visit Plan/Visit Status/Meeting Output/
Next Action as one might guess. Those other fields (Visit Plan, Reason
for Visit, Appointment Status, Meeting Output) are **not separate
columns at all** — they're rendered as small inline colored badges/text
*inside* the single main "Visit Details" cell, stacked above the report's
main text line. Indoor's grouped header is titled "Calling Details" with
`colspan="6"`: Contact Person, Contact No, Mail Id, Call for, Remark /
Details, Next Follow-up:

```html
<table class="w-full text-left border-collapse text-xs">
    <thead>
        <tr class="bg-gray-100/90 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-700">
            <th rowspan="2" class="px-3 py-2.5 border-r border-gray-200" style="width:8%">Date</th>
            <th rowspan="2" class="px-3 py-2.5 border-r border-gray-200" style="width:12%">Employee</th>
            <th rowspan="2" class="px-3 py-2.5 border-r border-gray-200" style="width:16%">Task Details</th>
            <th rowspan="2" class="px-2 py-2.5 border-r border-gray-200 text-center" style="width:9%">Hours</th>
            <th colspan="6" class="px-3 py-1.5 border-r border-gray-200 text-center bg-blue-50/80 text-blue-800 font-bold border-b border-blue-200/80">
                <span class="inline-flex items-center gap-1.5"><i data-lucide="phone-call" class="w-3.5 h-3.5 text-blue-600"></i> Calling Details</span>
            </th>
            <th rowspan="2" class="px-3 py-2.5 border-r border-gray-200 text-center" style="width:10%">Approval Status</th>
            <th rowspan="2" class="px-2 py-2.5 text-center" style="width:8%">Actions</th>
        </tr>
        <tr class="bg-gray-50/90 border-b border-gray-200 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            <th class="px-3 py-1.5 border-r border-gray-200">Contact Person</th>
            <th class="px-2.5 py-1.5 border-r border-gray-200">Contact No</th>
            <th class="px-3 py-1.5 border-r border-gray-200">Mail Id</th>
            <th class="px-3 py-1.5 border-r border-gray-200">Call for</th>
            <th class="px-3 py-1.5 border-r border-gray-200">Remark / Details</th>
            <th class="px-2.5 py-1.5 border-r border-gray-200">Next Follow-up</th>
        </tr>
    </thead>
    <tbody class="divide-y divide-gray-200/70 bg-white">
        <!-- Hours cell content (Indoor, as of 2026-09-24): a spelled-out
             duration, not a decimal — "8 hours 30 minutes", not "8.5h".
             With a time range known, it's shown as two lines:
             <span class="block text-xs font-semibold text-gray-900 whitespace-nowrap">09:00 - 17:30</span>
             <span class="text-[10px] text-gray-500 font-normal">(8 hours 30 minutes)</span>
             Without a time range, just: <span>8 hours</span>.
             Singular/plural and zero-component omission are handled (1.0 -> "1 hour", 8.0 -> "8 hours", 0.5 -> "30 minutes"). -->
        <!-- one <tr> per record, see status badge + actions below -->
    </tbody>
</table>
```

Outdoor's header (`colspan="4"`, titled "Contact Details") and the
"Visit Details" main-column cell content (the inline badges replace what
would otherwise be plain text — this is the part easiest to get wrong
from a description alone):

```html
<!-- Outdoor's grouped header, in place of Indoor's colspan="6" block above -->
<th colspan="4" class="px-3 py-1.5 border-r border-gray-200 text-center bg-blue-50/80 text-blue-800 font-bold border-b border-blue-200/80">
    <span class="inline-flex items-center gap-1.5"><i data-lucide="phone-call" class="w-3.5 h-3.5 text-blue-600"></i> Contact Details</span>
</th>
<!-- its 4 sub-columns -->
<th class="px-3 py-1.5 border-r border-gray-200">Contact Person</th>
<th class="px-2.5 py-1.5 border-r border-gray-200">Contact No</th>
<th class="px-3 py-1.5 border-r border-gray-200">Location / Site</th>
<th class="px-2.5 py-1.5 border-r border-gray-200">Next Follow-up</th>

<!-- The "Visit Details" main-column CELL for one outdoor row -->
<td class="px-3 py-2.5 text-gray-900 border-r border-gray-100">
    <div class="flex flex-wrap items-center gap-1.5 mb-1">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{{ visit_plan }}</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">{{ reason_for_visit }}</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-normal bg-gray-100 text-gray-700 border border-gray-200">{{ appointment_status }}</span>
    </div>
    <span class="font-medium text-gray-900 leading-snug">{{ report_summary_text }}</span>
    <p class="text-xs text-gray-600 italic mt-0.5">{{ meeting_output }}</p>
</td>
```

**Approval Status badge** — exactly one of these three, chosen by
`report.status`:

```html
<!-- approved -->
<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
    <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Approved
</span>
<!-- rejected (title attr shows the rejection reason on hover) -->
<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800" title="{{ rejection_reason }}">
    <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rejected
</span>
<!-- pending (title attr shows "Pending Level N Approval — {approver}") -->
<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800" title="{{ status_display }}">
    <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Pending
</span>
```

**E. There is no Edit button in this table — confirmed, not an
oversight in this doc.** The Actions cell has exactly three possible
buttons: Approve, Reject, Delete. There is no pencil/Edit icon, no
"view details" link, no row-click-to-open-detail-modal — nothing. This is
true even though `dsr_edit` (web view) and `api_dsr_update` (§3.3, REST)
both exist and work if called directly; they're just never linked to from
anywhere in this table's UI. Editing a pending DSR in the real app can
only happen by calling that endpoint directly (there's no button a normal
user would click). Whether your module adds an Edit button anyway (a
reasonable enhancement, not a regression) or drops it to match this
table exactly is your call — this doc just confirms which one is
actually true of HRMS today, so you're deciding deliberately either way.

**Actions cell** — Approve/Reject only rendered if `can_approve` is true
for this row/user; Delete only if `can_delete` is true:

```html
<td class="px-2 py-2.5 text-center whitespace-nowrap">
    <div class="inline-flex items-center gap-1">
        <button type="button" onclick="openApproveModal('{{ id }}', '{{ employee_name }}', '{{ date }}')"
                class="p-1 rounded text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors" title="Approve Report">
            <i data-lucide="check" class="w-4 h-4 text-green-600"></i>
        </button>
        <button type="button" onclick="openRejectModal('{{ id }}', '{{ employee_name }}', '{{ date }}')"
                class="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Reject Report">
            <i data-lucide="x" class="w-4 h-4 text-red-600"></i>
        </button>
        <form method="post" action="/daily-service-reports/{{ id }}/delete/" onsubmit="return confirm('Delete this DSR entry?');" style="display:inline">
            <button type="submit" class="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Entry">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </form>
    </div>
</td>
```

Pagination footer (15 rows/page):

```html
<div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
    <div>Showing <span class="font-semibold text-gray-900">1</span> to <span class="font-semibold text-gray-900">15</span> of <span class="font-semibold text-gray-900">42</span> entries</div>
    <div class="flex items-center gap-1.5">
        <a href="?page=1" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i> Previous</a>
        <span class="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">Page 2 of 3</span>
        <a href="?page=3" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Next <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></a>
    </div>
</div>
```

### 9.5 Approve/Reject modal (one shared modal pair for the whole page)

There is exactly **one** approve modal and **one** reject modal per page
— every row's Approve/Reject buttons open the *same* modal, with JS
pointing the form's `action` at that specific record's URL before
showing it:

```html
<div id="approve-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i> Approve Daily Service Report
            </h3>
            <button type="button" onclick="closeApproveModal()" class="text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <form id="approve-form" method="post" action="">
            <div class="p-5 space-y-4">
                <p class="text-sm text-gray-600" id="approve-modal-text">Are you sure you want to approve this Daily Service Report?</p>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Review Comments <span class="text-gray-400 font-normal">(Optional)</span></label>
                    <textarea name="comments" rows="2" placeholder="Optional comments..." class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"></textarea>
                </div>
            </div>
            <div class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button type="button" onclick="closeApproveModal()" class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" class="px-4 py-2 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm">Confirm Approval</button>
            </div>
        </form>
    </div>
</div>

<div id="reject-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm hidden">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 flex items-center gap-2">
                <i data-lucide="x-circle" class="w-5 h-5 text-red-600"></i> Reject Daily Service Report
            </h3>
            <button type="button" onclick="closeRejectModal()" class="text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
        <form id="reject-form" method="post" action="">
            <div class="p-5 space-y-4">
                <p class="text-sm text-gray-600" id="reject-modal-text">Please provide a reason for rejecting this Daily Service Report.</p>
                <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Rejection Reason <span class="text-red-500">*</span></label>
                    <textarea name="rejection_reason" rows="3" required placeholder="Specify why the DSR is being rejected..." class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"></textarea>
                </div>
            </div>
            <div class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button type="button" onclick="closeRejectModal()" class="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" class="px-4 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm">Confirm Rejection</button>
            </div>
        </form>
    </div>
</div>
```

The JS that wires each row's buttons to this shared modal pair (this is
the actual, complete function — copy verbatim, just change the URL
pattern for your own endpoints):

```javascript
function openApproveModal(id, empName, dateStr) {
    const modal = document.getElementById('approve-modal');
    document.getElementById('approve-form').action = `/daily-service-reports/${id}/approve/`;
    document.getElementById('approve-modal-text').innerText = `Are you sure you want to approve the Daily Service Report for ${empName} (${dateStr})?`;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
}
function closeApproveModal() {
    document.getElementById('approve-modal').classList.add('hidden');
}
function openRejectModal(id, empName, dateStr) {
    const modal = document.getElementById('reject-modal');
    document.getElementById('reject-form').action = `/daily-service-reports/${id}/reject/`;
    document.getElementById('reject-modal-text').innerText = `Please provide a reason for rejecting the Daily Service Report for ${empName} (${dateStr}).`;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
}
function closeRejectModal() {
    document.getElementById('reject-modal').classList.add('hidden');
}
```

Expense Report reuses this **exact same modal pair** (same `#approve-modal`/
`#reject-modal` DOM) — it just has its own `openApproveExpenseModal`/
`openRejectExpenseModal` functions that point `form.action` at
`/daily-expense-vouchers/{id}/approve/` or `/reject/` instead. Don't build
a second modal for Expense Report; repoint the existing one.

### 9.6 Visual conventions that apply everywhere above

- Cards: `bg-white`, `rounded-xl`, `border border-gray-200`, `shadow-sm`,
  with a `bg-gray-50/80` header strip inside for section titles.
- One accent color (blue: `text-blue-600` / `bg-blue-600`) for anything
  active or primary — the active tab, the primary submit button, links.
- Every icon is from the Lucide set, rendered via `<i data-lucide="...">`
  and finalized with a `window.lucide.createIcons()` call after any DOM
  swap (tab switch, modal open) — icons silently don't render without it.
- Tab switching and dropdown selection never trigger a full page reload.

### 9.7 "Pending My Approval" tab (revised 2026-09-25 — now a tab, not a page)

The UI counterpart to the §3.7/§8.3 "pending for me" API. **This is a 4th
tab on the existing DSR History page** (`?dsr_type=pending`, same URL as
Indoor/Outdoor/Expense Report — see §9.4) — it was briefly shipped as a
separate page/URL/sidebar link earlier the same day, then folded into
History for consistency with how every other DSR view already works
(nobody gets their own sidebar link and URL just for being "another way
to look at DSR/Expense data"; they're all tabs on one page). If your
module wants the same "here's what's waiting on you" screen, this is the
reference implementation to copy — it reuses the same page shell as
§9.4's History tabs, just with different table content:

- **One combined table, not per-type.** Unlike Indoor/Outdoor/Expense
  Report (each scoped to one `dsr_type`), this tab shows Indoor DSR,
  Outdoor DSR, and Expense Report **together in a single table**, sorted
  by date — because "what's pending for me" is inherently cross-type, an
  approver shouldn't have to check three separate tabs to find everything.
  A colored **Type** badge column keeps rows distinguishable (green
  "Indoor DSR", blue "Outdoor DSR", violet "Expense Report").
- **A live count, not a static header.** The tab button itself shows a
  count badge (like Indoor/Outdoor/Expense Report's tabs already do), and
  the filter bar repeats it as a "N waiting on you" pill — both driven by
  the same list the table renders from, not a separately-computed number
  that could drift out of sync.
- **Just a search box** — no date/status/employee filters, since
  everything on this tab is already status=pending and already scoped to
  "assigned to me"; those two filters would be redundant here.
- **Reuses the exact same Approve/Reject modal pair and JS functions**
  already on this page from §9.5 (`openApproveModal`/`openRejectModal`
  for DSR rows, `openApproveExpenseModal`/`openRejectExpenseModal` for
  Expense rows) — no new interaction patterns, no duplicated modal markup.
- **No Delete action on this tab** — unlike the other three tabs, which
  show Delete to the report's owner. This tab is exclusively the
  approver's queue; deleting isn't a decision an approver makes here.
- **Empty state**: a green checkmark and "You're all caught up!" when
  nothing is pending — deliberately positive framing, not a bare "No
  results" message, since an empty queue is the good outcome here.
- Approving or rejecting from this tab redirects back to
  `?dsr_type=pending` (via the approve/reject views' existing
  `HTTP_REFERER` redirect logic — nothing tab-specific was added for
  this), so the item you just actioned simply disappears from the list
  and you can immediately handle the next one.

---

## 10. React reference implementation — S&M Hub (copy this for another React module)

§9 is HRMS's own Django/Tailwind markup. This section is the **React + TypeScript + Tailwind**
version built in the S&M Hub (`au-marketing-fe`), matched to HRMS's live screens (2026-09-28). If
your module is a React SPA, copy these files and rules instead of re-deriving them from §9 — that's
what keeps the DSR UI identical across modules. Everything below talks to the HRMS REST API directly
from the browser with the user's HRMS token (§1); no backend of your own is needed except for the
optional lead-activity feature (§10.8).

### 10.1 Pages, routes and navigation

| Route | Page file | What it is |
|---|---|---|
| `/daily-service-reports/new` | `pages/DailyServiceReportFormPage.tsx` | "Daily Service Report (DSR)" create page — tabs Indoor / Outdoor (OD Plan & Visit) / Expense Report. `?tab=indoor\|outdoor\|expense` picks the tab. |
| `/daily-service-reports/new?tab=assign` | same | "Assign DSR Task" — no tab switcher, To-Do form (§10.6). |
| `/daily-service-reports/:id/edit` | same | Edit a DSR (own + pending only), locked to its type. |
| `/daily-service-reports/expense/:id/edit` | same | Edit an expense report. |
| `/daily-service-reports` | `pages/DailyServiceReportsPage.tsx` | "Daily Service Report History & Log" — **exactly HRMS's 4 tabs**: Indoor DSR, Outdoor DSR (Marketing View), Expense Report, Pending My Approval. `?tab=indoor\|outdoor\|expense\|pending`. |
| `/my-todo` | `pages/MyTodoPage.tsx` | "My To-Do" — HRMS To-Do tasks (like HRMS `/todo/`). Tabs My Tasks / Tasks I Assigned (`?tab=assigned`, only with `dsr.assign_task`). |

Edit pages get the row from router state (`navigate(url, { state: { report } })`) and fall back
to re-fetching the list, because HRMS has no get-one endpoint.

Navigation (same as §9.1, plus the To-Do page):
- **Sidebar**, collapsible group **"Work & Approvals"**: *Log DSR* → `/daily-service-reports/new`,
  *View DSR History* → `/daily-service-reports` (or `?tab=pending` when something is waiting, with an
  **orange count badge** = pending-for-me total), *My To-Do* → `/my-todo`. Approvers get *View DSR
  History* even without DSR view permissions so they can reach their queue.
- **Navbar "+" (Add Task)** dropdown: *Add DSR* → `/daily-service-reports/new`, *Assign DSR Task* →
  `?tab=assign`, *Add Expense Report* → `?tab=expense`, *View my reports*. Each item is hidden
  without its permission; the whole button is hidden if none apply.

### 10.2 Files to copy

| File | Responsibility |
|---|---|
| `lib/hrms-rbac.ts` | HRMS client. Types `DSRTask`, `DSRInput`, `ExpenseReport`, `ExpenseInput`, `PendingDSR`, `PendingExpense`, `TodoTask`, `TodoCreateInput`. Methods: `getDSR`, `createDSR`, `updateDSR`, `deleteDSR`, `approveDSR`, `rejectDSR`, `getExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, `approveExpense`, `rejectExpense`, `getPendingApprovals` (merges both pending endpoints; empty on failure), `getTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `completeTodo`. All mutations `POST` JSON and **throw `Error(<server message>)`** so the UI can toast it; lists return `[]` on failure. `status` and `total` are never sent. |
| `lib/dsr-helpers.ts` | Pure rules: status grouping/labels, `getDSRPermissions`, `canModifyDSR` / `canModifyExpense`, `validateDSRInput` / `validateExpenseInput`, `expenseTotalPreview`, `matchesSearch` (every word, any order), `paginate` (15/page), `hoursBetween`, `hoursToWords`, `formatTimeRange`, `DSR_PENDING_CHANGED_EVENT`. |
| `lib/dsr-options.ts` | The §9.3 option lists verbatim, `taskTypeOptions(kind, department)` (`null` = free text for "Other"), `DSR_FORMAT_LABEL`. |
| `lib/todo-helpers.ts` | `isTodoDone`, `todoDueParts`, `todoAssignedByName`, `isAssignedBy` — tolerant of the To-Do response shape. |
| `components/dsr/DSRForm.tsx` | Indoor/Outdoor form (create + edit). |
| `components/dsr/ExpenseForm.tsx` | Expense form. |
| `components/dsr/AssignDSRForm.tsx` | "Assign DSR Task" → HRMS To-Do. |
| `components/dsr/DSRHistoryTable.tsx` | `DSRHistoryTable` (indoor/outdoor, two-tier header) + `ExpenseHistoryTable` (flat). Actions via a `RowActions<T>` object. |
| `components/dsr/DSRStatusBadge.tsx` | Approved / Rejected (hover = reason) / Pending (hover = "Pending level N approval"). |
| `components/dsr/ApprovalModals.tsx` | One shared `ApproveModal` (optional comments) + `RejectModal` (reason required), pointed at a target `{id, kind: 'dsr'\|'expense', employeeName, date}` — §9.5's "one modal pair" rule. |
| `components/dsr/PendingApprovalsPanel.tsx` | Pending My Approval tab body (§10.5). |
| `components/dsr/TasksPanel.tsx` | To-Do table for "mine" / "assigned" modes + edit modal (§10.6). |
| `components/dsr/useEmployeeOptions.ts` | Employee list for pickers: `{ value: username, label, hrmsEmployeeId, code }` (the list is proxied from HRMS, so `id` is the HRMS employee id and `employee_id` the code). |
| `components/dsr/CreateDSRFromLeadsModal.tsx` | Optional S&M-Hub feature (§10.8). |

### 10.3 Rules every screen follows

**Permissions** — one function, reused by every page, sidebar and navbar (never ad-hoc checks):

```ts
export function getDSRPermissions(codes: string[], isSuperuser: boolean): DSRPermissions {
  const has = (code: string) => isSuperuser || codes.includes(code);
  return {
    canCreateIndoor: has('dsr.indoor_create'),
    canCreateOutdoor: has('dsr.outdoor_create') || has('dsr.indoor_create'), // §2
    canEditIndoor: has('dsr.indoor_edit'),
    canEditOutdoor: has('dsr.outdoor_edit'),
    canDeleteIndoor: has('dsr.indoor_delete'),
    canDeleteOutdoor: has('dsr.outdoor_delete'),
    canAssign: has('dsr.assign_task'),                                      // To-Do create (§9.3)
    canFileDSRForOthers: has('dsr.assign_task') && has('dsr.view_all'),     // DSR create API still checks view_all (§2)
    canViewOthersTodos: has('dsr.assign_task') || has('dsr.view_all'),
    canViewAllDSR: has('dsr.view_all'),
    canApproveDSR: has('dsr.view_all'),
    canViewExpense: has('expense_report.view') || has('expense_report.view_all'),
    canCreateExpense: has('expense_report.create'),
    canEditExpense: has('expense_report.edit'),
    canDeleteExpense: has('expense_report.delete'),
    canViewAllExpense: has('expense_report.view_all'),
    canApproveExpense: has('expense_report.view_all'),
  };
}
```

- Edit / Delete buttons: **own report + status pending + matching `*_edit` / `*_delete`**
  (`canModifyDSR`, `canModifyExpense`). Delete is also limited to pending in the UI.
- Approve/Reject on the normal tabs: `canApproveDSR` / `canApproveExpense` and status
  `pending_approval`. On the Pending tab, anything listed can be actioned (HRMS already filtered it).
- Permissions are read from the login response; a change in HRMS shows after the user logs in again.

**Hours** — the API does **not** compute them (§3.2); always send `hours` computed like this, and
never show a typed Hours box:

```ts
export function hoursBetween(start, end): number | null {   // "HH:MM" or "HH:MM:SS"
  const s = minutesOfDay(start), e = minutesOfDay(end);
  if (s == null || e == null) return null;
  const diff = e >= s ? e - s : e + 24 * 60 - s;              // End < Start = overnight shift
  return Math.round((diff / 60) * 10) / 10;                   // 0.1 h, same as HRMS
}
// hoursToWords: 8.5 → "8 hours 30 minutes", 1 → "1 hour", 0.5 → "30 minutes"
```

No times → don't send `hours` (HRMS records 8.0). Only identical Start/End is invalid. Show a live
line under the time row: *"Duration: 5 hours 30 minutes (overnight)"*; on edit without times show
*"Recorded: X"*.

**Display conventions** (from HRMS's templates):
- Dates **dd/mm/yyyy**; `YYYY-MM-DD` is read as a local date (no timezone shift).
- Employee cell: **full name** (semibold) + **employee code** small grey underneath, or **"Staff"**
  when there's no code. Employee dropdowns read "Name (CODE)" / "Name (Staff)".
- Indoor Task Details: **Department badge** (`bg-blue-50 text-blue-700 border-blue-100`) +
  **Task Type badge** (`bg-slate-100 text-slate-700 border-slate-200`), then title, then description
  with `whitespace-pre-line`.
- Hours cell: `09:00 - 17:30` over `(8 hours 30 minutes)`; without times just `8 hours`.
- Outdoor "Visit Details" cell: Visit Plan (amber), Reason (blue), Appointment (grey) badges above the
  company line and the italic meeting output. "Location / Site" column shows `region` (no such API field).
- Fixed label **`Format: DSR 2025-26`** (hard-coded in HRMS) as a blue pill: right of the History tabs,
  and on the right of the form card header.
- Page headers: "‹ Back to Dashboard" (ghost button) on both pages; History has **"+ Log New DSR"**,
  the form page has **"View DSR History"**.
- Tabs: pill track `inline-flex p-1 rounded-lg bg-slate-100/80 border border-slate-200 gap-1`; active
  `bg-white text-blue-600 shadow-sm border border-slate-200/60`, inactive
  `text-slate-600 hover:text-slate-900 hover:bg-white/50`. History tabs each carry a **count**
  (Pending's is orange when > 0).
- Primary colour blue-600; approve green, reject/delete red; status pills Approved green / Rejected
  red / Pending orange (§9.4).

### 10.4 Create page (`DailyServiceReportFormPage` + forms)

- Full page width (no centred max-width column). Fields laid out in rows with
  `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-{3|4} gap-x-5 gap-y-5`, **keeping §9.3's field order**.
- Card header: 36px blue icon tile, title ("Log Daily Service Report" / "Log Expense Report" /
  "Assign DSR Task" / "Edit …"), subtitle, Format pill on the right. Footer: **Reset Form** (outline,
  left) / **Submit** (primary, right).
- **Employee box always shown** ("Name (Me)"); other employees only with `canFileDSRForOthers`
  (sends `username`), otherwise disabled.
- Indoor rows: [Employee] Date · Department · Task Type → Task Title → Description → Start · End +
  Duration line → collapsible **"Calling Details (Optional)"** (closed by default; opens if editing a
  record that has any, or on a validation error inside it).
- Outdoor rows: [Employee] Date · Visit Plan · Region → Department · Task Type · Company Name →
  Contact Person · Contact Number · Mail ID → Reason · Appointment · Visit Status · Visited Date →
  Meeting Output → Next Action · Mail Status → Remarks · Next Follow-up. Outdoor defaults: Planned /
  Appointment Confirmed / Completed.
- Department change clears Task Type; Task Type is a dropdown from `taskTypeOptions`, free text when
  Department is "Other", disabled until a Department is picked. Indoor requires Department, Task Type,
  Title.
- Expense rows: Submitted By (read-only) · Date · Tour Destination → Description & Location of Work ·
  Company → 7 amounts + read-only Total in a 4-column grid. Total is a preview; HRMS computes it.
- Never send `""` for date/time/hours fields (HRMS can 500); on edit, send `""` for cleared text fields
  so they actually clear.
- **Label alignment gotcha:** our `DatePicker` renders its label inline, which sits a few px lower than
  other labels in the same row. Wrap form rows in `[&_label]:block` — but **not** around checkbox
  lists, where it breaks `flex` label rows.

### 10.5 History page (`DailyServiceReportsPage`)

- Filter bar (per §9.4): search (client-side, every word any order), date, status, **employee picker
  only with `*.view_all`**, **Reset Filters** (refresh icon). The HRMS list API returns **one
  employee at a time**, so the default is "me" (HRMS's web page defaults to all employees for view_all
  users — that can't be reproduced via the API without one call per employee).
- Table per §9.4 (`DSRHistoryTable` / `ExpenseHistoryTable`), 15 rows per page client-side (the API
  isn't paginated). Actions: ✓ ✗ (approvers), ✏️ Edit (our addition — own + pending), 🗑 Delete
  (own + pending) with a confirm. After any action: reload the list **and** the tab counts, and fire
  `window.dispatchEvent(new Event(DSR_PENDING_CHANGED_EVENT))` so the sidebar badge refreshes.
- **Pending My Approval** tab (`PendingApprovalsPanel`, §9.7): `getPendingApprovals()` on page load.
  The tab only appears when something is waiting (non-approvers never see it; once shown it stays for
  that visit so "all caught up" can display). One table for all three types sorted by date (oldest
  first), Type badge (Indoor green / Outdoor blue / Expense violet), "N waiting on you" pill, search
  only, ✓/✗ only (no Delete), actioned rows disappear, empty state green tick + **"You're all
  caught up!"**. DSR `task_detail` can carry a "[Completed … late — was due …]" note — show it.
- Sidebar badge: the same `getPendingApprovals()`, refreshed every 5 minutes and on
  `DSR_PENDING_CHANGED_EVENT`.

### 10.6 Assign DSR Task and My To-Do

- **Assign DSR Task creates To-Do tasks, not DSRs** (§9.3, 2026-09-28): `createTodo({ title,
  description?, employee_ids: [...hrmsEmployeeIds], due_date, due_time })`. Form: **Assign To** =
  checkbox list with a search box (one or more people; hint "N selected … each gets their own task")
  → Task Title → Task Description → **Complete By Date** (required, default today, min today) +
  **Complete By Time** (default 18:00). Needs only `dsr.assign_task`. After submit go to
  `/my-todo?tab=assigned`.
- **My To-Do page** (`TasksPanel`):
  - *My Tasks*: `getTodos({ status })` — Pending / Completed / All + search. Columns Task (title +
    description), Assigned by (or "Self"), Complete by (red + "Overdue by …" from `overdue_by` when
    late; "Completed … late" after), Status (Done green / Overdue red / Pending orange). Actions:
    **Mark done** (confirm: "HRMS will create your DSR … hours counted from when it was assigned") →
    `completeTodo` → toast with the new `dsr_id`; **Edit** (pending only: title, description,
    deadline — clearing the date sends `due_date: ""` to remove it); **Delete** (confirm; deleting a
    done task doesn't delete its DSR).
  - *Tasks I Assigned* (`dsr.assign_task`): pick an employee → `getTodos({ username })`, kept to tasks
    whose `assigned_by` is me when HRMS sends it; Edit / Delete, no Mark done (only the assignee can).
  - No "reopen" — the API doesn't have one.

### 10.7 Things HRMS doesn't do that the UI works around

| Gap | What the S&M Hub does |
|---|---|
| OT Minutes not in the API | No OT field; Hours from Start/End only. |
| Hours not computed by the API | Computed client-side (§10.3) and sent. |
| List API is per-employee | Default "me", employee picker for view_all users. |
| No "Location / Site" field | Outdoor column shows `region`. |
| No get-one endpoint | Edit pages use router state, else re-fetch the list and find by id. |
| No Edit button in HRMS's table | We add one (own + pending) — optional; HRMS note E leaves it to you. |
| No To-Do "reopen" | Not offered. |
| 9am–7pm window is web-form only | Not enforced (the API doesn't). |

### 10.8 Optional: create DSRs from another module's activity (S&M Hub leads)

The S&M Hub adds **"Create DSR from lead activity"** on the Indoor form (create mode, own report,
`marketing.view_lead`). Pattern, reusable for any module that logs work:

1. Backend endpoint in *your* module returning the user's own work logs for a day:
   `GET /api/leads/activities/mine?start=<ISO local midnight>&end=<ISO next midnight>` (client sends
   its local day bounds — no server timezone guess). Only "real work" types; system entries skipped.
2. A confirm box lists **each log as its own row** (one DSR per log): tick box, Start = log time,
   End = +30 min by default (so nothing falls back to HRMS's 8 h), live duration, "Create N DSRs".
   Failed rows stay in the box for retry; the rest go through.
3. Each DSR: Department "Marketing", Task Type from the log type (call/email/contacted → Calling,
   quotation → Quotation, meeting → Meeting), Title "Company — what was logged", Description =
   "Type: title", the log's notes, "Contact: …", and a last line **`Lead log #<id>`**.
4. **Duplicate protection:** on open, load the user's Indoor DSRs for that date and lock any log whose
   id appears as `Lead log #<id>` in a non-rejected DSR (or, for older DSRs, whose exact generated
   title matches) — greyed out, "Already in DSR · <status>". The link lives in HRMS itself, so a
   deleted or rejected DSR frees the log again. Use your own prefix (e.g. `Ticket #<id>`) in another
   module.

### 10.9 Testing the same way

Pure logic has unit tests you can copy: `src/test/dsr-helpers.test.ts` (permissions, statuses,
validation, hours, search, paging), `src/test/dsr-options.test.ts` (option lists),
`src/test/hrms-dsr-api.test.ts` (every client call's URL/body/error handling with a mocked `fetch`),
`src/test/todo-helpers.test.ts`, `src/test/dsr-from-lead-logs.test.ts`. They run under Vitest + jsdom.
