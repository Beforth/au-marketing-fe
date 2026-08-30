<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Series API

7 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-series"></a>
## `GET /api/series/`

**List Series**

List numbering series. Requires: marketing.admin OR create_contact OR create_customer OR create_lead (so forms can show dropdown).

**Permission:** `marketing.admin` **or** `marketing.create_contact` **or** `marketing.create_customer` **or** `marketing.create_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `is_active` | boolean | no |  |
| `entity_type` | string | no | Filter by entity type: contact, customer, lead, enquiry |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<SeriesResponse>`](#paginatedresponse-seriesresponse)

---

<a id="post-api-series"></a>
## `POST /api/series/`

**Create Series**

Create a numbering series. Requires: marketing.admin

**Permission:** `marketing.admin`

**Path parameters:** _none_

**Request body** (`SeriesCreate`):

```json
{
  "name": "Example name",
  "code": "string",
  "pattern": "string",
  "entity_type": "string",
  "next_value": 1,
  "reset_period": "none",
  "is_active": true
}
```

**Response** `201` — [`SeriesResponse`](#seriesresponse)

---

<a id="post-api-series-generate-next"></a>
## `POST /api/series/generate-next`

**Generate Next By Code**

Generate the next value for a series by its code (character field, not FK).
Pass preview=true to only preview the next value without consuming it.
Pass lead_id, contact_id, or customer_id to inject that entity's fields into the pattern
(e.g. {lead.company}, {lead.domain_code}). When creating a lead (no lead_id), pass lead_context
with company (and optional company_slug) so patterns like AP-QUT-{0:4}/{lead.company} work.
Placeholders: {YYYY}, {YY}, {MM}, {DD}, {0:N}, {S:code}, and {lead.xxx}, {contact.xxx}, {customer.xxx}.

**Permission:** `marketing.admin` **or** `marketing.create_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `preview` | boolean | no | When true, return the next value without advancing the counter (no commit). (default: `False`) |

**Request body** (`SeriesGenerateByCodeRequest`):

```json
{
  "series_code": "string",
  "customer_id": 1,
  "contact_id": 1,
  "lead_id": 1,
  "lead_context": {
    "company": "string",
    "company_slug": "string"
  }
}
```

**Response** `200` — [`SeriesGenerateResponse`](#seriesgenerateresponse)

---

<a id="get-api-series-series-id"></a>
## `GET /api/series/{series_id}`

**Get Series**

Get one series. Requires: marketing.admin

**Permission:** `marketing.admin`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `series_id` | integer | yes |  |

**Response** `200` — [`SeriesResponse`](#seriesresponse)

---

<a id="put-api-series-series-id"></a>
## `PUT /api/series/{series_id}`

**Update Series**

Update a series. Requires: marketing.admin

**Permission:** `marketing.admin`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `series_id` | integer | yes |  |

**Request body** (`SeriesUpdate`):

```json
{
  "name": "Example name",
  "code": "string",
  "pattern": "string",
  "entity_type": "string",
  "next_value": 0,
  "reset_period": "string",
  "is_active": false
}
```

**Response** `200` — [`SeriesResponse`](#seriesresponse)

---

<a id="delete-api-series-series-id"></a>
## `DELETE /api/series/{series_id}`

**Delete Series**

Delete a series. Requires: marketing.admin

**Permission:** `marketing.admin`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `series_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="post-api-series-series-id-generate-next"></a>
## `POST /api/series/{series_id}/generate-next`

**Generate Next**

Generate the next value for this series and increment its counter.
Pass preview=true to only preview the next value without consuming it.
Optional body: { "customer_id": 1 } or { "contact_id": 2 } or { "lead_id": 3 } to inject
entity fields into pattern (e.g. {customer.company_name}, {lead.domain_code}).
Placeholders: {YYYY}, {YY}, {MM}, {DD}, {HH}, {mm}, {ss}, {0:N}, {S:code},
and {customer.xxx}, {contact.xxx}, {lead.xxx} when context is provided.

**Permission:** `marketing.admin`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `series_id` | integer | yes |  |

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `preview` | boolean | no | When true, return the next value without advancing the counter (no commit). (default: `False`) |

**Request body:** `application/json` (file upload / form fields — see parameters above)

**Response** `200` — [`SeriesGenerateResponse`](#seriesgenerateresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-seriesresponse"></a>
### PaginatedResponse<SeriesResponse>

```json
{
  "items": [
    {
      "name": "Example name",
      "code": "string",
      "pattern": "string",
      "entity_type": "string",
      "next_value": 1,
      "reset_period": "none",
      "is_active": true,
      "id": 1,
      "last_period_key": "string",
      "last_generated_at": "2026-01-31T09:30:00Z",
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

<a id="seriesresponse"></a>
### SeriesResponse

```json
{
  "name": "Example name",
  "code": "string",
  "pattern": "string",
  "entity_type": "string",
  "next_value": 1,
  "reset_period": "none",
  "is_active": true,
  "id": 1,
  "last_period_key": "string",
  "last_generated_at": "2026-01-31T09:30:00Z",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="seriesgenerateresponse"></a>
### SeriesGenerateResponse

```json
{
  "series_id": 1,
  "series_code": "string",
  "generated_value": "string"
}
```
