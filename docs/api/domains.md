<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Domains API

5 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-domains"></a>
## `GET /api/domains/`

**Get Domains**

Get paginated list of domains (default 10 per page).
Requires: marketing.view_domain permission
Search filters by name, code, or description (case-insensitive partial match).

**Permission:** `marketing.view_domain` **or** `view_domain`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `is_active` | boolean | no |  |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<DomainResponse>`](#paginatedresponse-domainresponse)

---

<a id="post-api-domains"></a>
## `POST /api/domains/`

**Create Domain**

Create a new domain

Requires: marketing.create_domain permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.create_domain

**Permission:** `marketing.create_domain`

**Path parameters:** _none_

**Request body** (`DomainCreate`):

```json
{
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
  "coordinator_email": "person@example.com"
}
```

**Response** `201` — [`DomainResponse`](#domainresponse)

---

<a id="get-api-domains-domain-id"></a>
## `GET /api/domains/{domain_id}`

**Get Domain**

Get a specific domain by ID

Requires: marketing.view_domain permission

**Permission:** `marketing.view_domain`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `domain_id` | integer | yes |  |

**Response** `200` — [`DomainResponse`](#domainresponse)

---

<a id="put-api-domains-domain-id"></a>
## `PUT /api/domains/{domain_id}`

**Update Domain**

Update a domain

Requires: marketing.edit_domain permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.edit_domain

**Permission:** `marketing.edit_domain`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `domain_id` | integer | yes |  |

**Request body** (`DomainUpdate`):

```json
{
  "name": "Example name",
  "code": "string",
  "description": "Free-text notes",
  "is_active": false,
  "is_export": false,
  "head_employee_id": 1,
  "head_username": "Example name",
  "head_email": "person@example.com",
  "coordinator_employee_id": 1,
  "coordinator_username": "Example name",
  "coordinator_email": "person@example.com"
}
```

**Response** `200` — [`DomainResponse`](#domainresponse)

---

<a id="delete-api-domains-domain-id"></a>
## `DELETE /api/domains/{domain_id}`

**Delete Domain**

Delete a domain

Requires: marketing.delete_domain permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.delete_domain

Warning: This will cascade delete all regions, contacts, customers, and leads in this domain.

**Permission:** `marketing.delete_domain`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `domain_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-domainresponse"></a>
### PaginatedResponse<DomainResponse>

```json
{
  "items": [
    {
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
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="domainresponse"></a>
### DomainResponse

```json
{
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
```
