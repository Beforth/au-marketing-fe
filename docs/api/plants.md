<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Plants API

1 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-plants"></a>
## `GET /api/plants/`

**List Plants**

List plants (locations) by contact_id or customer_id.
Used when linking a contact to a customer (contact's locations).

**Permission:** `marketing.view_contact`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `contact_id` | integer | no |  |
| `customer_id` | integer | no |  |

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
