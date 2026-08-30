<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Organizations API

9 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-organizations"></a>
## `GET /api/organizations/`

**List Organizations**

List organizations with optional search and filters. Scoped by domain.

**Permission:** `marketing.view_organization`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `search` | string | no |  |
| `is_active` | boolean | no |  |

**Response** `200` — [`PaginatedResponse<OrganizationResponse>`](#paginatedresponse-organizationresponse)

---

<a id="post-api-organizations"></a>
## `POST /api/organizations/`

**Create Organization**

Create a new organization. Optionally create multiple plants in the same request.

**Permission:** `marketing.create_organization`

**Path parameters:** _none_

**Request body** (`OrganizationCreate`):

```json
{
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "website": "https://example.com",
  "industry": "string",
  "organization_size": "string",
  "is_active": true,
  "plants": [
    {
      "plant_name": "Example name",
      "plant_code": "string",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "notes": "Free-text notes"
    }
  ]
}
```

**Response** `201` — [`OrganizationResponse`](#organizationresponse)

---

<a id="get-api-organizations-organization-id"></a>
## `GET /api/organizations/{organization_id}`

**Get Organization**

Get one organization by ID. Access limited to user's domain scope.

**Permission:** `marketing.view_organization`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |

**Response** `200` — [`OrganizationResponse`](#organizationresponse)

---

<a id="patch-api-organizations-organization-id"></a>
## `PATCH /api/organizations/{organization_id}`

**Update Organization**

Update an organization. Access limited to user's domain scope.

**Permission:** `marketing.edit_organization`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |

**Request body** (`OrganizationUpdate`):

```json
{
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "website": "https://example.com",
  "industry": "string",
  "organization_size": "string",
  "is_active": false
}
```

**Response** `200` — [`OrganizationResponse`](#organizationresponse)

---

<a id="delete-api-organizations-organization-id"></a>
## `DELETE /api/organizations/{organization_id}`

**Delete Organization**

Delete an organization (and its plants). Access limited to user's domain scope.

**Permission:** `marketing.delete_organization`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-organizations-organization-id-plants"></a>
## `GET /api/organizations/{organization_id}/plants`

**List Organization Plants**

List plants belonging to this organization. Org access scoped by domain.

**Permission:** `marketing.view_organization`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |

**Response** `200`:

```json
[
  {
    "plant_name": "Example name",
    "plant_code": "string",
    "domain_id": 1,
    "region_id": 1,
    "address_line1": "string",
    "address_line2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string",
    "notes": "Free-text notes",
    "id": 1,
    "organization_id": 1,
    "contact_id": 1,
    "customer_id": 1,
    "is_active": false,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-organizations-organization-id-plants"></a>
## `POST /api/organizations/{organization_id}/plants`

**Create Organization Plant**

Add a plant to an organization (address, pin code, city, country, plant name).

**Permission:** `marketing.create_plant`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |

**Request body** (`PlantCreate`):

```json
{
  "plant_name": "Example name",
  "plant_code": "string",
  "domain_id": 1,
  "region_id": 1,
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "notes": "Free-text notes",
  "organization_id": 1,
  "contact_id": 1,
  "customer_id": 1
}
```

**Response** `201` — [`PlantResponse`](#plantresponse)

---

<a id="patch-api-organizations-organization-id-plants-plant-id"></a>
## `PATCH /api/organizations/{organization_id}/plants/{plant_id}`

**Update Organization Plant**

Update a plant under an organization. Org access scoped by domain.

**Permission:** `marketing.edit_plant`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |
| `plant_id` | integer | yes |  |

**Request body** (`PlantUpdate`):

```json
{
  "plant_name": "Example name",
  "plant_code": "string",
  "domain_id": 1,
  "region_id": 1,
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "notes": "Free-text notes",
  "is_active": false
}
```

**Response** `200` — [`PlantResponse`](#plantresponse)

---

<a id="delete-api-organizations-organization-id-plants-plant-id"></a>
## `DELETE /api/organizations/{organization_id}/plants/{plant_id}`

**Delete Organization Plant**

Remove a plant from an organization. Org access scoped by domain.

**Permission:** `marketing.delete_plant`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `organization_id` | integer | yes |  |
| `plant_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-organizationresponse"></a>
### PaginatedResponse<OrganizationResponse>

```json
{
  "items": [
    {
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "website": "https://example.com",
      "industry": "string",
      "organization_size": "string",
      "is_active": true,
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
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

<a id="organizationresponse"></a>
### OrganizationResponse

```json
{
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "website": "https://example.com",
  "industry": "string",
  "organization_size": "string",
  "is_active": true,
  "id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="plantresponse"></a>
### PlantResponse

```json
{
  "plant_name": "Example name",
  "plant_code": "string",
  "domain_id": 1,
  "region_id": 1,
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "notes": "Free-text notes",
  "id": 1,
  "organization_id": 1,
  "contact_id": 1,
  "customer_id": 1,
  "is_active": false,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```
