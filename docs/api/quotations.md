<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Quotations API

3 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-quotations"></a>
## `GET /api/quotations/`

**List Quotations**

List quotations (activity attachments) by role with optional search, lead filter, and sort.
- Admin: all quotations uploaded by anyone.
- Domain head: quotations on leads in their domain.
- Region head: quotations on leads in their region.
- Employee: only quotations on activities they created (their own uploads).

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `25`) |
| `search` | string | no | Search in quotation number, file name, lead name/series, activity title |
| `lead_id` | integer | no | Filter by lead ID |
| `date_from` | string | no | Filter from date (YYYY-MM-DD), activity date |
| `date_to` | string | no | Filter to date (YYYY-MM-DD), activity date |
| `industry` | string | no | Filter by organization industry (contact's or customer's org) |
| `quote_series_code` | string | no | Filter by the lead's quote numbering series code (product-wise) |
| `region_id` | integer | no | Filter by region — requires marketing.admin (or super admin), ignored otherwise |
| `domain_id` | integer | no | Filter by domain — requires marketing.admin (or super admin), ignored otherwise |
| `sort_by` | string | no | Sort field: quotation_number, file_name, lead_name, inquiry_number, activity_date (default: `quotation_number`) |
| `sort_order` | string | no | Sort order: asc or desc (default: `asc`) |

**Response** `200` — [`PaginatedResponse<QuotationListItem>`](#paginatedresponse-quotationlistitem)

---

<a id="get-api-quotations-filter-options"></a>
## `GET /api/quotations/filter-options`

**Get Quotation Filter Options**

Distinct industry / numbering-series values available for the quotation filters, scoped like list_quotations.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200` — [`QuotationFilterOptions`](#quotationfilteroptions)

---

<a id="get-api-quotations-lead-options"></a>
## `GET /api/quotations/lead-options`

**List Quotation Lead Options**

List leads that have at least one quotation (for filter dropdown). Same scope as list_quotations.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "lead_id": 1,
    "lead_series": "string",
    "lead_name": "Example name"
  }
]
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-quotationlistitem"></a>
### PaginatedResponse<QuotationListItem>

```json
{
  "items": [
    {
      "id": 1,
      "quotation_number": "string",
      "file_name": "Example name",
      "activity_id": 1,
      "inquiry_number": 0,
      "lead_id": 1,
      "lead_series": "string",
      "lead_name": "Example name",
      "activity_title": "string",
      "activity_date": "string",
      "media_exists": true
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="quotationfilteroptions"></a>
### QuotationFilterOptions

```json
{
  "industries": [
    "string"
  ],
  "quote_series_codes": [
    "string"
  ]
}
```
