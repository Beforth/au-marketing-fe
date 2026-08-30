<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Customers API

6 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-customers"></a>
## `GET /api/customers/`

**Get Customers**

Get paginated list of customers. Admin=all, domain head=domain, region head/supervisor=all in region, employee=only their own (created by them).

**Permission:** `marketing.view_customer`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `domain_id` | integer | no |  |
| `region_id` | integer | no |  |
| `is_active` | boolean | no |  |

**Response** `200` — [`PaginatedResponse<CustomerResponse>`](#paginatedresponse-customerresponse)

---

<a id="post-api-customers"></a>
## `POST /api/customers/`

**Create Customer**

Create a new customer.

Requires: marketing.create_customer permission

**Permission:** `marketing.create_customer`

**Path parameters:** _none_

**Request body** (`CustomerCreate`):

```json
{
  "company_name": "Example name",
  "tax_id": "string",
  "domain_id": 1,
  "region_id": 1,
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "notes": "Free-text notes",
  "series_code": "string",
  "series": "string",
  "converted_from_contact_id": 1,
  "organization_id": 1,
  "plant_id": 1,
  "primary_contact_contact_id": 1,
  "account_manager_employee_id": 1,
  "customer_since": "string",
  "is_active": true,
  "plants": [
    {
      "plant_name": "Example name",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string"
    }
  ]
}
```

**Response** `201` — [`CustomerResponse`](#customerresponse)

---

<a id="get-api-customers-search"></a>
## `GET /api/customers/search`

**Search Customers**

Search customers by primary contact email, phone, or company name.
Used when creating leads: type email/phone and link to existing customer.

**Permission:** `marketing.view_customer`

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
    "company_name": "Example name",
    "tax_id": "string",
    "domain_id": 1,
    "region_id": 1,
    "address_line1": "string",
    "address_line2": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string",
    "notes": "Free-text notes",
    "series_code": "string",
    "series": "string",
    "id": 1,
    "is_active": false,
    "customer_since": "string",
    "converted_from_contact_id": 1,
    "organization_id": 1,
    "plant_id": 1,
    "primary_contact_contact_id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "account_manager_employee_id": 1,
    "account_manager_username": "Example name",
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
    ],
    "primary_contact_contact": {
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
  }
]
```

---

<a id="get-api-customers-customer-id"></a>
## `GET /api/customers/{customer_id}`

**Get Customer**

Get a customer by ID. Access limited to customer's domain/region by role.

**Permission:** `marketing.view_customer`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `customer_id` | integer | yes |  |

**Response** `200` — [`CustomerResponse`](#customerresponse)

---

<a id="put-api-customers-customer-id"></a>
## `PUT /api/customers/{customer_id}`

**Update Customer**

Update a customer.

Requires: marketing.edit_customer permission

**Permission:** `marketing.edit_customer`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `customer_id` | integer | yes |  |

**Request body** (`CustomerUpdate`):

```json
{
  "company_name": "Example name",
  "tax_id": "string",
  "domain_id": 1,
  "region_id": 1,
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "account_manager_employee_id": 1,
  "notes": "Free-text notes",
  "is_active": false,
  "organization_id": 1,
  "plant_id": 1,
  "primary_contact_contact_id": 1,
  "plants": [
    {
      "plant_name": "Example name",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string"
    }
  ],
  "series_code": "string"
}
```

**Response** `200` — [`CustomerResponse`](#customerresponse)

---

<a id="delete-api-customers-customer-id"></a>
## `DELETE /api/customers/{customer_id}`

**Delete Customer**

Delete a customer.

Requires: marketing.delete_customer permission

**Permission:** `marketing.delete_customer`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `customer_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-customerresponse"></a>
### PaginatedResponse<CustomerResponse>

```json
{
  "items": [
    {
      "company_name": "Example name",
      "tax_id": "string",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "notes": "Free-text notes",
      "series_code": "string",
      "series": "string",
      "id": 1,
      "is_active": false,
      "customer_since": "string",
      "converted_from_contact_id": 1,
      "organization_id": 1,
      "plant_id": 1,
      "primary_contact_contact_id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "account_manager_employee_id": 1,
      "account_manager_username": "Example name",
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
      "plants": [
        "{ … PlantResponse }"
      ],
      "primary_contact_contact": {
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
        "domain": "{ … DomainResponse }",
        "region": "{ … RegionResponse }",
        "organization": "{ … OrganizationResponse }",
        "plant": "{ … PlantResponse }"
      }
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="customerresponse"></a>
### CustomerResponse

```json
{
  "company_name": "Example name",
  "tax_id": "string",
  "domain_id": 1,
  "region_id": 1,
  "address_line1": "string",
  "address_line2": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "notes": "Free-text notes",
  "series_code": "string",
  "series": "string",
  "id": 1,
  "is_active": false,
  "customer_since": "string",
  "converted_from_contact_id": 1,
  "organization_id": 1,
  "plant_id": 1,
  "primary_contact_contact_id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "account_manager_employee_id": 1,
  "account_manager_username": "Example name",
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
  ],
  "primary_contact_contact": {
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
}
```
