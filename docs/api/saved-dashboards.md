<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Saved Dashboards API

11 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-saved-dashboards"></a>
## `GET /api/saved-dashboards`

**List Dashboards**

List dashboards the current user created or is assigned to. Super admin sees all.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "id": 1,
    "name": "Example name",
    "description": "Free-text notes",
    "config": {},
    "domain_id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z",
    "can_edit": false,
    "widget_data": {}
  }
]
```

---

<a id="post-api-saved-dashboards"></a>
## `POST /api/saved-dashboards`

**Create Dashboard**

Create a new saved dashboard. Requires marketing.create_dashboard or marketing.admin in HRMS.

**Permission:** `marketing.admin` **or** `marketing.create_dashboard`

**Path parameters:** _none_

**Request body** (`SavedDashboardCreate`):

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "config": {}
}
```

**Response** `201` — [`SavedDashboardResponse`](#saveddashboardresponse)

---

<a id="get-api-saved-dashboards-assignable-users"></a>
## `GET /api/saved-dashboards/assignable-users`

**List Assignable Users**

List employees who can be assigned a dashboard: domain heads, region heads, and employees
in region assignments (marketing hierarchy). Used by the Assign dashboard modal.

**Permission:** `marketing.admin` **or** `marketing.assign_dashboard`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "id": 1,
    "name": "Example name",
    "role_hint": "string"
  }
]
```

---

<a id="post-api-saved-dashboards-execute-widget"></a>
## `POST /api/saved-dashboards/execute-widget`

**Execute Widget**

Execute a widget's data source and return JSON for charts.
data_source: { "kind": "sql", "value": "SELECT ..." } (SELECT only, max 1000 rows)
or { "kind": "preset", "value": "leads_by_status" } for predefined datasets.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Request body** (`ExecuteWidgetRequest`):

```json
{
  "chart_type": "string",
  "data_source": {},
  "title": "string"
}
```

**Response** `200`:

```json
"string"
```

---

<a id="post-api-saved-dashboards-preview-sql-template"></a>
## `POST /api/saved-dashboards/preview-sql-template`

**Preview Sql Template**

Preview a SQL template safely by compiling current user's scope placeholders on backend.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Request body** (`SQLTemplatePreviewRequest`):

```json
{
  "sql": "string",
  "chart_type": "table",
  "schema": [
    {
      "name": "Example name",
      "columns": [
        "{ … AISchemaColumn }"
      ]
    }
  ],
  "date_from": "string",
  "date_to": "string"
}
```

**Response** `200` — [`SQLTemplatePreviewResponse`](#sqltemplatepreviewresponse)

---

<a id="get-api-saved-dashboards-dashboard-id"></a>
## `GET /api/saved-dashboards/{dashboard_id}`

**Get Dashboard**

Get one dashboard. Only if creator or assigned. Super admin can open any.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `dashboard_id` | integer | yes |  |

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `date_from` | string | no |  |
| `date_to` | string | no |  |

**Response** `200` — [`SavedDashboardResponse`](#saveddashboardresponse)

---

<a id="patch-api-saved-dashboards-dashboard-id"></a>
## `PATCH /api/saved-dashboards/{dashboard_id}`

**Update Dashboard**

Update dashboard. Only if creator or assigned with can_edit. Super admin can edit any.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `dashboard_id` | integer | yes |  |

**Request body** (`SavedDashboardUpdate`):

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "config": {}
}
```

**Response** `200` — [`SavedDashboardResponse`](#saveddashboardresponse)

---

<a id="delete-api-saved-dashboards-dashboard-id"></a>
## `DELETE /api/saved-dashboards/{dashboard_id}`

**Delete Dashboard**

Delete dashboard. Only the creator can delete. Super admin can delete any.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `dashboard_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-saved-dashboards-dashboard-id-assignments"></a>
## `GET /api/saved-dashboards/{dashboard_id}/assignments`

**List Assignments**

List assignments for a dashboard. Only creator or users with assign_dashboard can see. Super admin can see any.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `dashboard_id` | integer | yes |  |

**Response** `200`:

```json
[
  {
    "id": 1,
    "dashboard_id": 1,
    "assignee_employee_id": 1,
    "role": "string",
    "can_edit": false,
    "created_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-saved-dashboards-dashboard-id-assignments"></a>
## `POST /api/saved-dashboards/{dashboard_id}/assignments`

**Create Assignment**

Assign dashboard to a user or role. Requires marketing.assign_dashboard, marketing.admin, or super admin.

**Permission:** _no explicit check — public or token-only_

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `dashboard_id` | integer | yes |  |

**Request body** (`app__routers__saved_dashboards__AssignmentCreate`):

```json
{
  "assignee_employee_id": 1,
  "role": "string",
  "can_edit": false
}
```

**Response** `201` — [`app__routers__saved_dashboards__AssignmentResponse`](#app-routers-saved-dashboards-assignmentresponse)

---

<a id="delete-api-saved-dashboards-dashboard-id-assignments-assignment-id"></a>
## `DELETE /api/saved-dashboards/{dashboard_id}/assignments/{assignment_id}`

**Delete Assignment**

Remove an assignment. Super admin can remove any.

**Permission:** _no explicit check — public or token-only_

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `dashboard_id` | integer | yes |  |
| `assignment_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="saveddashboardresponse"></a>
### SavedDashboardResponse

```json
{
  "id": 1,
  "name": "Example name",
  "description": "Free-text notes",
  "config": {},
  "domain_id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z",
  "can_edit": false,
  "widget_data": {}
}
```

<a id="sqltemplatepreviewresponse"></a>
### SQLTemplatePreviewResponse

```json
{
  "chart_type": "string",
  "compiled_sql": "string",
  "data": [
    {}
  ]
}
```

<a id="app-routers-saved-dashboards-assignmentresponse"></a>
### app__routers__saved_dashboards__AssignmentResponse

```json
{
  "id": 1,
  "dashboard_id": 1,
  "assignee_employee_id": 1,
  "role": "string",
  "can_edit": false,
  "created_at": "2026-01-31T09:30:00Z"
}
```
