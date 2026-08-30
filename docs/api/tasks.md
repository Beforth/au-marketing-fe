<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Tasks API

4 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="post-api-tasks"></a>
## `POST /api/tasks`

**Create Manual Task**

Create a manual task for today.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Request body** (`TaskCreateManual`):

```json
{
  "title": "string",
  "description": "Free-text notes"
}
```

**Response** `201` — [`TaskResponse`](#taskresponse)

---

<a id="get-api-tasks-today"></a>
## `GET /api/tasks/today`

**List Today Tasks**

List today's tasks for the current user. Auto-generates follow-up tasks if not already created.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "id": 1,
    "employee_id": 1,
    "title": "string",
    "description": "Free-text notes",
    "due_date": "2026-01-31",
    "source": "string",
    "lead_id": 1,
    "order_id": 1,
    "lead_status_group_id": 1,
    "completed_at": "2026-01-31T09:30:00Z",
    "created_at": "2026-01-31T09:30:00Z",
    "lead_series": "string",
    "lead_name": "Example name"
  }
]
```

---

<a id="get-api-tasks-task-id"></a>
## `GET /api/tasks/{task_id}`

**Get Task**

Get a single task (for popup with description and add enquiry link).

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `task_id` | integer | yes |  |

**Response** `200` — [`TaskResponse`](#taskresponse)

---

<a id="patch-api-tasks-task-id-complete"></a>
## `PATCH /api/tasks/{task_id}/complete`

**Complete Task**

Mark a task as complete (checkbox).

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `task_id` | integer | yes |  |

**Response** `200` — [`TaskCompleteResponse`](#taskcompleteresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="taskresponse"></a>
### TaskResponse

```json
{
  "id": 1,
  "employee_id": 1,
  "title": "string",
  "description": "Free-text notes",
  "due_date": "2026-01-31",
  "source": "string",
  "lead_id": 1,
  "order_id": 1,
  "lead_status_group_id": 1,
  "completed_at": "2026-01-31T09:30:00Z",
  "created_at": "2026-01-31T09:30:00Z",
  "lead_series": "string",
  "lead_name": "Example name"
}
```

<a id="taskcompleteresponse"></a>
### TaskCompleteResponse

```json
{
  "id": 1,
  "completed_at": "2026-01-31T09:30:00Z"
}
```
