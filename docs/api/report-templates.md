<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Report Templates API

9 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-report-templates"></a>
## `GET /api/report-templates`

**List Templates**

List report templates the current user created or is assigned to. Super admin sees all.

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
    "section_data": {},
    "placeholders": [
      "string"
    ]
  }
]
```

---

<a id="post-api-report-templates"></a>
## `POST /api/report-templates`

**Create Template**

Create a new report template. Requires marketing.create_dashboard or marketing.admin.

**Permission:** `marketing.admin` **or** `marketing.create_dashboard`

**Path parameters:** _none_

**Request body** (`ReportTemplateCreate`):

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "config": {}
}
```

**Response** `201` — [`ReportTemplateResponse`](#reporttemplateresponse)

---

<a id="get-api-report-templates-assignable-users"></a>
## `GET /api/report-templates/assignable-users`

**List Assignable Users**

List employees who can be assigned a report template (same as dashboard assignable users).

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

<a id="get-api-report-templates-template-id"></a>
## `GET /api/report-templates/{template_id}`

**Get Template**

Get one template. If visible, includes section_data (executed SQL results).
Pass optional entity IDs to scope sections: lead_id, lead_ids, domain_id, region_id, employee_id, contact_id, customer_id, organization_id, plant_id (and _ids comma-separated for multi).

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `template_id` | integer | yes |  |

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `date_from` | string | no |  |
| `date_to` | string | no |  |
| `lead_id` | integer | no |  |
| `lead_ids` | string | no | Comma-separated lead IDs |
| `domain_id` | integer | no |  |
| `domain_ids` | string | no |  |
| `region_id` | integer | no |  |
| `region_ids` | string | no |  |
| `employee_id` | integer | no |  |
| `contact_id` | integer | no |  |
| `contact_ids` | string | no |  |
| `customer_id` | integer | no |  |
| `customer_ids` | string | no |  |
| `organization_id` | integer | no |  |
| `organization_ids` | string | no |  |
| `plant_id` | integer | no |  |
| `plant_ids` | string | no |  |

**Response** `200` — [`ReportTemplateResponse`](#reporttemplateresponse)

---

<a id="patch-api-report-templates-template-id"></a>
## `PATCH /api/report-templates/{template_id}`

**Update Template**

Update template. Only if creator or assigned with can_edit. Super admin can edit any.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `template_id` | integer | yes |  |

**Request body** (`ReportTemplateUpdate`):

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "config": {}
}
```

**Response** `200` — [`ReportTemplateResponse`](#reporttemplateresponse)

---

<a id="delete-api-report-templates-template-id"></a>
## `DELETE /api/report-templates/{template_id}`

**Delete Template**

Delete template. Only creator or super admin.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `template_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-report-templates-template-id-assignments"></a>
## `GET /api/report-templates/{template_id}/assignments`

**List Assignments**

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `template_id` | integer | yes |  |

**Response** `200`:

```json
[
  {
    "id": 1,
    "template_id": 1,
    "assignee_employee_id": 1,
    "can_edit": false,
    "created_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-report-templates-template-id-assignments"></a>
## `POST /api/report-templates/{template_id}/assignments`

**Create Assignment**

Assign report template to a user. Same permission as dashboard assign (marketing.assign_dashboard).

**Permission:** _no explicit check — public or token-only_

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `template_id` | integer | yes |  |

**Request body** (`app__routers__report_templates__AssignmentCreate`):

```json
{
  "assignee_employee_id": 1,
  "can_edit": false
}
```

**Response** `201` — [`app__routers__report_templates__AssignmentResponse`](#app-routers-report-templates-assignmentresponse)

---

<a id="delete-api-report-templates-template-id-assignments-assignment-id"></a>
## `DELETE /api/report-templates/{template_id}/assignments/{assignment_id}`

**Delete Assignment**

**Permission:** _no explicit check — public or token-only_

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `template_id` | integer | yes |  |
| `assignment_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="reporttemplateresponse"></a>
### ReportTemplateResponse

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
  "section_data": {},
  "placeholders": [
    "string"
  ]
}
```

<a id="app-routers-report-templates-assignmentresponse"></a>
### app__routers__report_templates__AssignmentResponse

```json
{
  "id": 1,
  "template_id": 1,
  "assignee_employee_id": 1,
  "can_edit": false,
  "created_at": "2026-01-31T09:30:00Z"
}
```
