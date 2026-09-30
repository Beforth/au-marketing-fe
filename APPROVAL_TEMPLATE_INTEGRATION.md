# Approval Template Integration Guide

How another module (or an external app) plugs into the shared approval-template
engine: who approves what, at which level, and how to read that over the API.

Written from the code in `employees/models.py`, `employees/views.py`,
`employees/api_views.py`, `employees/api_urls.py`. `docs/DSR_MODULE_INTEGRATION.md`
§7 has the DSR/Expense worked examples; this doc is the standalone reference.

---

## 1. Concepts

| Model | Purpose |
|---|---|
| `ApprovalTemplate` | A named, reusable chain. Has a `category` and optional `levels_needed`. |
| `ApprovalTemplateStep` | One row per level: `(template, level, approver=Employee)`. |
| `LeaveApprovalRoute` | Maps a template to a **target** (one `employee`, a `department`, or a requester `role`) for one `workflow_type`. |

`ApprovalTemplate.category` and `LeaveApprovalRoute.workflow_type` are two
separate strings kept in sync **by convention only** (no FK):

| Template `category` | Route `workflow_type` |
|---|---|
| `leave` | `leave` |
| `attendance` | `attendance` |
| `marketing` | `marketing` |
| `expense` | `expenses` *(note the `s`)* |
| `daily_report` | `daily_report` |
| `service_work_order` | `service_work_order` |

The mapping lives in the `category_to_workflow` dicts in `employees/views.py`
(`leave_route_list` and `approval_template_assign`).

---

## 2. Resolving the approver (Python)

```python
from employees.models import LeaveApprovalRoute

approver = LeaveApprovalRoute.get_approver_for_level(employee, level, workflow_type)
# -> Employee, or None when there is no approver at that level (chain finished)
```

Resolution order:

1. Route for that exact `employee`.
2. Else route for the employee's `department`.
3. Else route for the employee's primary `Role`.
4. If a route is found: return the step at `level`; return `None` if
   `template.levels_needed` is set and `level` exceeds it, or the step doesn't exist.
   A found route never falls through to the defaults.
5. If **no** route exists — system default: regular employee → level 1 = a
   department `manager`, level 2 = an `hr` user; manager-role employee →
   level 1 = `ceo` (else first superuser). Otherwise `None`.

Typical approve flow in a module:

```python
next_level = obj.current_level + 1
nxt = LeaveApprovalRoute.get_approver_for_level(obj.employee, next_level, 'your_workflow_type')
if nxt:
    obj.current_level = next_level
    obj.current_approver = nxt      # notify them
else:
    obj.status = 'approved'
```

The model owning the request should hold `status`, `current_level`,
`current_approver`, `approved_by/at`, `rejection_reason`, plus a history table
(see `DailyServiceReport` / `DailyServiceReportHistory` as the reference shape).

---

## 3. HTTP API

Base: `/api/rbac/` (`core/urls.py` → `employees/api_urls.py`).

**Auth:** DRF token.

```
Authorization: Token <api_token>
```

Get one via `POST /api/rbac/login/` with `{"username": "...", "password": "..."}`.

### `GET /api/rbac/approval-templates/`

Returns the resolved approval chain for every workflow type for one user.

| Query param | Meaning |
|---|---|
| `username` | Whose chains to resolve. Omit to use the token's own user. |

```bash
curl "http://<host>/api/rbac/approval-templates/?username=jane" \
  -H "Authorization: Token <token>"
```

Response (`200`):

```json
{
  "success": true,
  "employee": {
    "id": 12, "username": "jane", "first_name": "Jane", "last_name": "Doe",
    "email": "jane@x.com", "employee_id": "EMP012",
    "department": "Service", "designation": "Engineer"
  },
  "approval_templates": {
    "leave":        { "is_custom_template": true,  "template": { ... } },
    "attendance":   { "is_custom_template": false, "template": { ... } },
    "marketing":    { ... },
    "expenses":     { ... },
    "daily_report": { ... }
  }
}
```

Each `template`:

```json
{
  "template_id": 3,
  "name": "Senior Flow",
  "description": "…",
  "category": "leave",
  "levels_needed": 2,
  "steps": [
    { "level": 1,
      "approver": { "id": 7, "username": "mgr", "full_name": "A B",
                    "email": "a@x.com", "employee_id": "EMP007" } }
  ]
}
```

- `is_custom_template: false` → no route matched; `template` is the
  **system default** (`template_id: null`, `name: "System Default Flow"`,
  `category` = the workflow type, `levels_needed` = number of default steps).
- If `levels_needed` is set, only that many steps are returned.

Errors: `404` `{"success": false, "error": "..."}` when the username or its
employee profile doesn't exist; `401` without a valid token.

**Not available over the API:** creating/editing templates or routes, and
listing all templates. That is done in the UI (§4). The endpoint's workflow
list is hardcoded in `api_user_approval_template`
(`['leave','attendance','marketing','expenses','daily_report','service_work_order']`) — a new
workflow type won't appear until added there.

---

## 4. Admin UI

| Page | URL name | Path |
|---|---|---|
| Approval Template Builder | `approval_template_list` / `_new` / `_edit` / `_delete` | `/approval-templates/…` |
| Assign a template to employees | `approval_template_assign` / `approval_template_unassign` | `/approval-templates/<id>/assign/` |
| Template Mapping (bulk, by employee / department / role) | `leave_route_list` | `/leave/routes/` |
| Active Mappings (read-only) | `active_mappings_list` | `/leave/active-mappings/` |

Gated by `workflow.approval_template_builder` and
`workflow.approval_template_edit` (level 4).

Constraint: a target cannot be assigned two templates of the same category at
once.

---

## 5. Onboarding a new module — checklist

1. Pick a `category` (template) and a `workflow_type` (route) string.
2. Add the category to `ApprovalTemplate.CATEGORY_CHOICES` and the
   `<option>` in `templates/employees/approval_template_form.html`.
3. Add the workflow type to `LeaveApprovalRoute.workflow_type` choices.
4. Add `category → workflow_type` to **both** `category_to_workflow` dicts in
   `employees/views.py`. Skipping this silently stores the route as `leave`.
5. Add the workflow type to `workflow_types` in `api_user_approval_template`
   (`employees/api_views.py`) so external callers see it.
6. `makemigrations` + `migrate`.
7. In your module's approve/reject views, call
   `LeaveApprovalRoute.get_approver_for_level(...)` as in §2, write history
   rows, and notify via `employees/email_utils.py`.
8. Add a test in `employees/tests.py` and an entry in `docs/CHANGES.md`.

---

## 6. `service_work_order` (done)

Fully wired as of 2026-09-30 (migrations `0085`, `0086`): template category,
route workflow type, both `category_to_workflow` dicts, the `leave_route_list`
`workflow_types` list, and the API's workflow list. A Service Work Order
module resolves its approver with
`LeaveApprovalRoute.get_approver_for_level(employee, level, 'service_work_order')`
and reads the chain from `GET /api/rbac/approval-templates/` under
`approval_templates.service_work_order`.

**Data caveat:** routes created *before* this fix from a Service Work Order
template were saved as `leave`. On any existing database, find them and correct
or recreate them:

```python
LeaveApprovalRoute.objects.filter(template__category='service_work_order', workflow_type='leave')
```

---

## 7. Gotchas

- `category` and `workflow_type` can drift; `expense` vs `expenses` is the
  existing example.
- The default-approver fallback (§2 step 5) matches on `Role.role_type`
  strings (`manager`, `hr`, `ceo`) — renaming roles changes who gets routed.
- Module-level fallbacks (e.g. `performance_manager`, a `*.view_all`
  holder) are written per model, not by the engine.
