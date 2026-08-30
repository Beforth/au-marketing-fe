<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Regions API

12 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-regions"></a>
## `GET /api/regions/`

**Get Regions**

Get paginated list of regions (default 10 per page).
Requires: marketing.view_region permission

**Permission:** `marketing.view_region`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `domain_id` | integer | no |  |
| `is_active` | boolean | no |  |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<RegionResponse>`](#paginatedresponse-regionresponse)

---

<a id="post-api-regions"></a>
## `POST /api/regions/`

**Create Region**

Create a new region in a domain

Requires: marketing.create_region permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.create_region

**Permission:** `marketing.create_region`

**Path parameters:** _none_

**Request body** (`RegionCreate`):

```json
{
  "domain_id": 1,
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "sort_order": 0,
  "head_employee_id": 1,
  "head_username": "Example name",
  "coordinator_employee_id": 1,
  "coordinator_username": "Example name",
  "coordinator_email": "person@example.com",
  "is_active": true
}
```

**Response** `201` — [`RegionResponse`](#regionresponse)

---

<a id="post-api-regions-assign-employee"></a>
## `POST /api/regions/assign-employee`

**Assign Employee To Region**

Assign employee to a region.
Allowed if user has marketing.assign_employee_region OR is region head for this region.

**Permission:** `marketing.assign_employee_region` **or** `marketing.view_domain` **or** `marketing.view_region`

**Path parameters:** _none_

**Request body** (`EmployeeRegionAssignmentCreate`):

```json
{
  "employee_id": 1,
  "region_id": 1,
  "role": "string",
  "is_active": true,
  "sort_order": 0,
  "employee_name": "Example name",
  "employee_email": "person@example.com"
}
```

**Response** `201` — [`EmployeeRegionAssignmentResponse`](#employeeregionassignmentresponse)

---

<a id="get-api-regions-assignments"></a>
## `GET /api/regions/assignments/`

**Get All Assignments**

Get all active region assignments (marketing team members).
Scoped by role: super sees all; domain head sees their domain's regions; region head / employee see only their region(s).

**Permission:** `marketing.view_domain` **or** `marketing.view_region`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "employee_id": 1,
    "region_id": 1,
    "role": "string",
    "is_active": true,
    "sort_order": 0,
    "id": 1,
    "created_at": "2026-01-31T09:30:00Z",
    "region": {
      "domain_id": 1,
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "sort_order": 0,
      "head_employee_id": 1,
      "head_username": "Example name",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "is_active": true,
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      }
    },
    "employee_name": "Example name",
    "employee_email": "person@example.com"
  }
]
```

---

<a id="post-api-regions-assignments-reorder"></a>
## `POST /api/regions/assignments/reorder`

**Reorder Assignments**

Set the display order for a region's employees.
Allowed if user has marketing.assign_employee_region OR is region head for this region.

**Permission:** `marketing.assign_employee_region` **or** `marketing.view_domain` **or** `marketing.view_region`

**Path parameters:** _none_

**Request body** (`AssignmentReorderRequest`):

```json
{
  "region_id": 1,
  "ordered_ids": [
    0
  ]
}
```

**Response** `200`:

```json
{}
```

---

<a id="put-api-regions-assignments-assignment-id"></a>
## `PUT /api/regions/assignments/{assignment_id}`

**Update Employee Assignment**

Update employee region assignment.
Allowed if user has marketing.assign_employee_region OR is region head for this assignment's region.

**Permission:** `marketing.assign_employee_region` **or** `marketing.view_domain` **or** `marketing.view_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `assignment_id` | integer | yes |  |

**Request body** (`EmployeeRegionAssignmentUpdate`):

```json
{
  "role": "string",
  "is_active": false
}
```

**Response** `200` — [`EmployeeRegionAssignmentResponse`](#employeeregionassignmentresponse)

---

<a id="delete-api-regions-assignments-assignment-id"></a>
## `DELETE /api/regions/assignments/{assignment_id}`

**Remove Employee Assignment**

Remove employee from region (deactivate assignment).
Allowed if user has marketing.assign_employee_region OR is region head for this assignment's region.

**Permission:** `marketing.assign_employee_region` **or** `marketing.view_domain` **or** `marketing.view_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `assignment_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-regions-assignments-employee-id"></a>
## `GET /api/regions/assignments/{employee_id}`

**Get Employee Assignments**

Get all region assignments for an employee. Scoped: only assignments in the caller's region(s) are returned.

**Permission:** `marketing.view_domain` **or** `marketing.view_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `employee_id` | integer | yes |  |

**Response** `200`:

```json
[
  {
    "employee_id": 1,
    "region_id": 1,
    "role": "string",
    "is_active": true,
    "sort_order": 0,
    "id": 1,
    "created_at": "2026-01-31T09:30:00Z",
    "region": {
      "domain_id": 1,
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "sort_order": 0,
      "head_employee_id": 1,
      "head_username": "Example name",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "is_active": true,
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      }
    }
  }
]
```

---

<a id="post-api-regions-reorder"></a>
## `POST /api/regions/reorder`

**Reorder Regions**

Set the display order for a domain's regions.
Requires: marketing.edit_region

**Permission:** `marketing.edit_region`

**Path parameters:** _none_

**Request body** (`RegionReorderRequest`):

```json
{
  "domain_id": 1,
  "ordered_ids": [
    0
  ]
}
```

**Response** `200`:

```json
{}
```

---

<a id="get-api-regions-region-id"></a>
## `GET /api/regions/{region_id}`

**Get Region**

Get a specific region by ID

Requires: marketing.view_region permission

**Permission:** `marketing.view_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `region_id` | integer | yes |  |

**Response** `200` — [`RegionResponse`](#regionresponse)

---

<a id="put-api-regions-region-id"></a>
## `PUT /api/regions/{region_id}`

**Update Region**

Update a region

Requires: marketing.edit_region permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.edit_region

**Permission:** `marketing.edit_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `region_id` | integer | yes |  |

**Request body** (`RegionUpdate`):

```json
{
  "domain_id": 1,
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "head_employee_id": 1,
  "head_username": "Example name",
  "coordinator_employee_id": 1,
  "coordinator_username": "Example name",
  "coordinator_email": "person@example.com",
  "is_active": false
}
```

**Response** `200` — [`RegionResponse`](#regionresponse)

---

<a id="delete-api-regions-region-id"></a>
## `DELETE /api/regions/{region_id}`

**Delete Region**

Delete a region

Requires: marketing.delete_region permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.delete_region

Warning: Contacts, customers, leads, and orders that reference this region will have
their region_id set to NULL. Employee assignments for the region are permanently deleted.

**Permission:** `marketing.delete_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `region_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-regionresponse"></a>
### PaginatedResponse<RegionResponse>

```json
{
  "items": [
    {
      "domain_id": 1,
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "sort_order": 0,
      "head_employee_id": 1,
      "head_username": "Example name",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "is_active": true,
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      }
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="regionresponse"></a>
### RegionResponse

```json
{
  "domain_id": 1,
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "sort_order": 0,
  "head_employee_id": 1,
  "head_username": "Example name",
  "coordinator_employee_id": 1,
  "coordinator_username": "Example name",
  "coordinator_email": "person@example.com",
  "is_active": true,
  "id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z",
  "domain": {
    "name": "Example name",
    "code": "string",
    "description": "Free-text notes",
    "is_active": true,
    "is_export": false,
    "head_employee_id": 1,
    "head_username": "Example name",
    "head_email": "person@example.com",
    "coordinator_employee_id": 1,
    "coordinator_username": "Example name",
    "coordinator_email": "person@example.com",
    "id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  }
}
```

<a id="employeeregionassignmentresponse"></a>
### EmployeeRegionAssignmentResponse

```json
{
  "employee_id": 1,
  "region_id": 1,
  "role": "string",
  "is_active": true,
  "sort_order": 0,
  "id": 1,
  "created_at": "2026-01-31T09:30:00Z",
  "region": {
    "domain_id": 1,
    "name": "Example name",
    "code": "string",
    "description": "Free-text notes",
    "sort_order": 0,
    "head_employee_id": 1,
    "head_username": "Example name",
    "coordinator_employee_id": 1,
    "coordinator_username": "Example name",
    "coordinator_email": "person@example.com",
    "is_active": true,
    "id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z",
    "domain": {
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "is_active": true,
      "is_export": false,
      "head_employee_id": 1,
      "head_username": "Example name",
      "head_email": "person@example.com",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    }
  }
}
```
