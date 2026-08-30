<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Visiting Card Contacts API

6 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-visiting-card-contacts"></a>
## `GET /api/visiting-card-contacts/`

**Get Visiting Card Contacts**

List visiting card contacts. Unscoped - every user with view permission sees all records.

**Permission:** `marketing.view_visiting_card_contact`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `is_converted` | boolean | no |  |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<VisitingCardContactResponse>`](#paginatedresponse-visitingcardcontactresponse)

---

<a id="post-api-visiting-card-contacts"></a>
## `POST /api/visiting-card-contacts/`

**Create Visiting Card Contact**

Create a visiting card contact. This is the endpoint the external system calls
to push newly scanned/captured cards in.

**Permission:** `marketing.create_visiting_card_contact`

**Path parameters:** _none_

**Request body** (`VisitingCardContactCreate`):

```json
{
  "name": "Example name",
  "company_name": "Example name",
  "designation": "string",
  "phone_numbers": [
    "+91 90000 00000"
  ],
  "emails": [
    "person@example.com"
  ],
  "website": "https://example.com",
  "social_media": [
    "string"
  ],
  "address": "string",
  "notes": "Free-text notes",
  "source": "string"
}
```

**Response** `201` — [`VisitingCardContactResponse`](#visitingcardcontactresponse)

---

<a id="get-api-visiting-card-contacts-visiting-card-contact-id"></a>
## `GET /api/visiting-card-contacts/{visiting_card_contact_id}`

**Get Visiting Card Contact**

**Permission:** `marketing.view_visiting_card_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `visiting_card_contact_id` | integer | yes |  |

**Response** `200` — [`VisitingCardContactResponse`](#visitingcardcontactresponse)

---

<a id="put-api-visiting-card-contacts-visiting-card-contact-id"></a>
## `PUT /api/visiting-card-contacts/{visiting_card_contact_id}`

**Update Visiting Card Contact**

**Permission:** `marketing.edit_visiting_card_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `visiting_card_contact_id` | integer | yes |  |

**Request body** (`VisitingCardContactUpdate`):

```json
{
  "name": "Example name",
  "company_name": "Example name",
  "designation": "string",
  "phone_numbers": [
    "+91 90000 00000"
  ],
  "emails": [
    "person@example.com"
  ],
  "website": "https://example.com",
  "social_media": [
    "string"
  ],
  "address": "string",
  "notes": "Free-text notes",
  "source": "string"
}
```

**Response** `200` — [`VisitingCardContactResponse`](#visitingcardcontactresponse)

---

<a id="delete-api-visiting-card-contacts-visiting-card-contact-id"></a>
## `DELETE /api/visiting-card-contacts/{visiting_card_contact_id}`

**Delete Visiting Card Contact**

**Permission:** `marketing.delete_visiting_card_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `visiting_card_contact_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="post-api-visiting-card-contacts-visiting-card-contact-id-convert-to-contact"></a>
## `POST /api/visiting-card-contacts/{visiting_card_contact_id}/convert-to-contact`

**Convert Visiting Card Contact To Contact**

Promote a visiting card contact into a real, scoped Contact.
Domain/region/organization/plant have no source on the visiting card, so the
caller supplies them here (matches how Contact scoping normally works).

**Permission:** `marketing.create_contact`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `visiting_card_contact_id` | integer | yes |  |

**Request body** (`ConvertToContactRequest`):

```json
{
  "domain_id": 1,
  "region_id": 1,
  "organization_id": 1,
  "plant_id": 1
}
```

**Response** `200`:

```json
{}
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-visitingcardcontactresponse"></a>
### PaginatedResponse<VisitingCardContactResponse>

```json
{
  "items": [
    {
      "name": "Example name",
      "company_name": "Example name",
      "designation": "string",
      "phone_numbers": [
        "+91 90000 00000"
      ],
      "emails": [
        "person@example.com"
      ],
      "website": "https://example.com",
      "social_media": [
        "string"
      ],
      "address": "string",
      "notes": "Free-text notes",
      "source": "string",
      "id": 1,
      "is_converted": false,
      "converted_to_contact_id": 1,
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

<a id="visitingcardcontactresponse"></a>
### VisitingCardContactResponse

```json
{
  "name": "Example name",
  "company_name": "Example name",
  "designation": "string",
  "phone_numbers": [
    "+91 90000 00000"
  ],
  "emails": [
    "person@example.com"
  ],
  "website": "https://example.com",
  "social_media": [
    "string"
  ],
  "address": "string",
  "notes": "Free-text notes",
  "source": "string",
  "id": 1,
  "is_converted": false,
  "converted_to_contact_id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```
