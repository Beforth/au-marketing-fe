<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Contacts API

7 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-contacts"></a>
## `GET /api/contacts/`

**Get Contacts**

Get list of contacts. Admin=all, domain head=domain, region head/supervisor=all in region, employee=only their own (created by them).

**Permission:** `marketing.view_contact`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `is_active` | boolean | no |  |
| `is_converted` | boolean | no |  |
| `assigned_to` | integer | no |  |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<ContactResponse>`](#paginatedresponse-contactresponse)

---

<a id="post-api-contacts"></a>
## `POST /api/contacts/`

**Create Contact**

Create a new contact

Requires: marketing.create_contact permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.create_contact

**Permission:** `marketing.create_contact`

**Path parameters:** _none_

**Request body** (`ContactCreate`):

```json
{
  "title": "string",
  "first_name": "Example name",
  "last_name": "Example name",
  "contact_person_name": "Example name",
  "contact_email": "person@example.com",
  "contact_phone": "+91 90000 00000",
  "contact_job_title": "string",
  "domain_id": 1,
  "region_id": 1,
  "organization_id": 1,
  "plant_id": 1,
  "notes": "Free-text notes",
  "source": "string",
  "series_code": "string",
  "series": "string",
  "assigned_to_employee_id": 1
}
```

**Response** `201` — [`ContactResponse`](#contactresponse)

---

<a id="get-api-contacts-search"></a>
## `GET /api/contacts/search`

**Search Contacts**

Search contacts by email, phone, contact person name, or company name.
Used when creating leads: type email/phone and link to existing contact or create new.

**Permission:** `marketing.view_contact`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `q` | string | yes |  |
| `limit` | integer | no | (default: `20`) |

**Response** `200`:

```json
[
  {
    "title": "string",
    "first_name": "Example name",
    "last_name": "Example name",
    "contact_person_name": "Example name",
    "contact_email": "person@example.com",
    "contact_phone": "+91 90000 00000",
    "contact_job_title": "string",
    "domain_id": 1,
    "region_id": 1,
    "organization_id": 1,
    "plant_id": 1,
    "notes": "Free-text notes",
    "source": "string",
    "series_code": "string",
    "series": "string",
    "id": 1,
    "is_active": false,
    "is_converted": false,
    "converted_to_customer_id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "assigned_to_employee_id": 1,
    "assigned_to_username": "Example name",
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
    },
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
    "organization": {
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
    },
    "plant": {
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
  }
]
```

---

<a id="get-api-contacts-contact-id"></a>
## `GET /api/contacts/{contact_id}`

**Get Contact**

Get a specific contact by ID. Access limited to contact's domain/region by role.

**Permission:** `marketing.view_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `contact_id` | integer | yes |  |

**Response** `200` — [`ContactResponse`](#contactresponse)

---

<a id="put-api-contacts-contact-id"></a>
## `PUT /api/contacts/{contact_id}`

**Update Contact**

Update a contact

Requires: marketing.edit_contact permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.edit_contact

**Permission:** `marketing.edit_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `contact_id` | integer | yes |  |

**Request body** (`ContactUpdate`):

```json
{
  "title": "string",
  "first_name": "Example name",
  "last_name": "Example name",
  "contact_person_name": "Example name",
  "contact_email": "person@example.com",
  "contact_phone": "+91 90000 00000",
  "contact_job_title": "string",
  "domain_id": 1,
  "region_id": 1,
  "organization_id": 1,
  "plant_id": 1,
  "assigned_to_employee_id": 1,
  "notes": "Free-text notes",
  "source": "string",
  "is_active": false,
  "series_code": "string"
}
```

**Response** `200` — [`ContactResponse`](#contactresponse)

---

<a id="delete-api-contacts-contact-id"></a>
## `DELETE /api/contacts/{contact_id}`

**Delete Contact**

Delete a contact

Requires: marketing.delete_contact permission

Note: If permission is not available in HRMS, you need to create it first.
Permission code: marketing.delete_contact

**Permission:** `marketing.delete_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `contact_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="post-api-contacts-contact-id-convert-to-customer"></a>
## `POST /api/contacts/{contact_id}/convert-to-customer`

**Convert Contact To Customer**

Convert a contact to a customer

Requires: marketing.create_customer permission

This will create a new customer from the contact and mark the contact as converted.

**Permission:** `marketing.create_customer`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `contact_id` | integer | yes |  |

**Response** `200`:

```json
{}
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-contactresponse"></a>
### PaginatedResponse<ContactResponse>

```json
{
  "items": [
    {
      "title": "string",
      "first_name": "Example name",
      "last_name": "Example name",
      "contact_person_name": "Example name",
      "contact_email": "person@example.com",
      "contact_phone": "+91 90000 00000",
      "contact_job_title": "string",
      "domain_id": 1,
      "region_id": 1,
      "organization_id": 1,
      "plant_id": 1,
      "notes": "Free-text notes",
      "source": "string",
      "series_code": "string",
      "series": "string",
      "id": 1,
      "is_active": false,
      "is_converted": false,
      "converted_to_customer_id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "assigned_to_employee_id": 1,
      "assigned_to_username": "Example name",
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
      },
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
        "domain": "{ … DomainResponse }"
      },
      "organization": {
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
      },
      "plant": {
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
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="contactresponse"></a>
### ContactResponse

```json
{
  "title": "string",
  "first_name": "Example name",
  "last_name": "Example name",
  "contact_person_name": "Example name",
  "contact_email": "person@example.com",
  "contact_phone": "+91 90000 00000",
  "contact_job_title": "string",
  "domain_id": 1,
  "region_id": 1,
  "organization_id": 1,
  "plant_id": 1,
  "notes": "Free-text notes",
  "source": "string",
  "series_code": "string",
  "series": "string",
  "id": 1,
  "is_active": false,
  "is_converted": false,
  "converted_to_customer_id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "assigned_to_employee_id": 1,
  "assigned_to_username": "Example name",
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
  },
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
  "organization": {
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
  },
  "plant": {
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
}
```
