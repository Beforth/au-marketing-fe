<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Employees API

7 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-employees"></a>
## `GET /api/employees/`

**Get Employees**

Get paginated list of employees from HRMS (10 per page by default).
Filters: search, department_id, designation_id, status (all|active|inactive).

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `search` | string | no |  |
| `department_id` | integer | no |  |
| `designation_id` | integer | no |  |
| `status` | string | no |  |

**Response** `200`:

```json
"string"
```

---

<a id="get-api-employees-departments"></a>
## `GET /api/employees/departments/`

**Get Departments**

Get list of departments from HRMS for filter dropdowns.

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {}
]
```

---

<a id="get-api-employees-designations"></a>
## `GET /api/employees/designations/`

**Get Designations**

Get list of designations from HRMS for filter dropdowns.

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {}
]
```

---

<a id="get-api-employees-local"></a>
## `GET /api/employees/local/`

**Get Local Employees**

List local marketing employees with filters and pagination.

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `20`) |
| `search` | string | no |  |
| `role` | string | no |  |
| `domain_id` | integer | no |  |
| `region_id` | integer | no |  |
| `is_active` | boolean | no |  |
| `synced_from_hrms` | boolean | no |  |

**Response** `200` — [`PaginatedResponse<MarketingEmployeeResponse>`](#paginatedresponse-marketingemployeeresponse)

---

<a id="get-api-employees-local-employee-id"></a>
## `GET /api/employees/local/{employee_id}`

**Get Local Employee**

Get a single local marketing employee by ID.

**Permission:** `marketing.view_domain`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `employee_id` | integer | yes |  |

**Response** `200` — [`MarketingEmployeeResponse`](#marketingemployeeresponse)

---

<a id="put-api-employees-local-employee-id"></a>
## `PUT /api/employees/local/{employee_id}`

**Update Local Employee**

Update a local marketing employee record.

**Permission:** `marketing.edit_region`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `employee_id` | integer | yes |  |

**Request body** (`MarketingEmployeeUpdate`):

```json
{
  "first_name": "Example name",
  "last_name": "Example name",
  "email": "person@example.com",
  "employee_code": "string",
  "department": "string",
  "designation": "string",
  "phone": "+91 90000 00000",
  "is_active": false,
  "role": "string",
  "domain_id": 1,
  "domain_name": "Example name",
  "region_id": 1,
  "region_name": "Example name",
  "synced_from_hrms": false
}
```

**Response** `200` — [`MarketingEmployeeResponse`](#marketingemployeeresponse)

---

<a id="post-api-employees-sync"></a>
## `POST /api/employees/sync`

**Sync Employees From Hrms**

Sync marketing-relevant employees from HRMS into local marketing_employees table. Admin only.

**Permission:** `marketing.admin`

**Path parameters:** _none_

**Response** `200` — [`MarketingEmployeeSyncResponse`](#marketingemployeesyncresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-marketingemployeeresponse"></a>
### PaginatedResponse<MarketingEmployeeResponse>

```json
{
  "items": [
    {
      "id": 1,
      "hrms_employee_id": 1,
      "hrms_user_id": 1,
      "username": "Example name",
      "first_name": "",
      "last_name": "",
      "email": "person@example.com",
      "employee_code": "string",
      "department": "string",
      "designation": "string",
      "phone": "+91 90000 00000",
      "is_active": true,
      "role": "string",
      "domain_id": 1,
      "domain_name": "Example name",
      "region_id": 1,
      "region_name": "Example name",
      "synced_from_hrms": false,
      "last_synced_at": "2026-01-31T09:30:00Z",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="marketingemployeeresponse"></a>
### MarketingEmployeeResponse

```json
{
  "id": 1,
  "hrms_employee_id": 1,
  "hrms_user_id": 1,
  "username": "Example name",
  "first_name": "",
  "last_name": "",
  "email": "person@example.com",
  "employee_code": "string",
  "department": "string",
  "designation": "string",
  "phone": "+91 90000 00000",
  "is_active": true,
  "role": "string",
  "domain_id": 1,
  "domain_name": "Example name",
  "region_id": 1,
  "region_name": "Example name",
  "synced_from_hrms": false,
  "last_synced_at": "2026-01-31T09:30:00Z",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="marketingemployeesyncresponse"></a>
### MarketingEmployeeSyncResponse

```json
{
  "total_hrms_employees": 0,
  "synced": 0,
  "created": 0,
  "updated": 0,
  "skipped": 0,
  "errors": [],
  "employees": []
}
```
