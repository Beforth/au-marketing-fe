<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Reports API

7 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-reports-expected-orders"></a>
## `GET /api/reports/expected-orders`

**List Expected Order Reports**

List expected order reports (own or team by scope). Optional employee_id filters to that person.

**Permission:** `marketing.view_report`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `year` | integer | no |  |
| `month` | integer | no |  |
| `employee_id` | integer | no | Filter by employee; must be in your scope |

**Response** `200`:

```json
[
  {
    "id": 1,
    "employee_id": 1,
    "year": 0,
    "month": 0,
    "created_at": "2026-01-31T09:30:00Z",
    "leads": [
      {
        "lead_id": 1,
        "lead_series": "string",
        "lead_name": "Example name",
        "company": "string",
        "lead_status_label": "active",
        "lead_is_final": false,
        "lead_is_lost": false
      }
    ]
  }
]
```

---

<a id="post-api-reports-expected-orders"></a>
## `POST /api/reports/expected-orders`

**Create Expected Order Report**

Create an expected order report for next month with selected leads as potential clients.

**Permission:** `marketing.create_report`

**Path parameters:** _none_

**Request body** (`ExpectedOrderCreate`):

```json
{
  "year": 0,
  "month": 0,
  "lead_ids": [
    0
  ]
}
```

**Response** `201` — [`ExpectedOrderReportItem`](#expectedorderreportitem)

---

<a id="get-api-reports-od-plans"></a>
## `GET /api/reports/od-plans`

**List Od Plan Reports**

List OD plan reports (own or team by scope). Optional employee_id filters to that person.

**Permission:** `marketing.view_report`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `year` | integer | no |  |
| `month` | integer | no |  |
| `employee_id` | integer | no | Filter by employee; must be in your scope |

**Response** `200`:

```json
[
  {
    "id": 1,
    "employee_id": 1,
    "year": 0,
    "month": 0,
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z",
    "entries": [
      {
        "id": 1,
        "plan_date": "string",
        "entry_type": "string",
        "where_place": "string",
        "travel_time": "string",
        "travel_type": "string",
        "contact_id": 1,
        "contact_name": "Example name",
        "contact_email": "person@example.com",
        "notes": "Free-text notes"
      }
    ]
  }
]
```

---

<a id="get-api-reports-od-plans-year-month"></a>
## `GET /api/reports/od-plans/{year}/{month}`

**Get Od Plan Report**

Get one OD plan for a given year-month (current user's).

**Permission:** _no explicit check — public or token-only_

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `year` | integer | yes |  |
| `month` | integer | yes |  |

**Response** `200` — [`ODPlanReportItem`](#odplanreportitem)

---

<a id="put-api-reports-od-plans-year-month"></a>
## `PUT /api/reports/od-plans/{year}/{month}`

**Save Od Plan Report**

Create or update OD plan for the given year-month. Replaces all entries for that month.

**Permission:** _no explicit check — public or token-only_

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `year` | integer | yes |  |
| `month` | integer | yes |  |

**Request body** (`ODPlanSaveBody`):

```json
{
  "entries": [
    {
      "plan_date": "string",
      "entry_type": "string",
      "where_place": "string",
      "travel_time": "string",
      "travel_type": "string",
      "contact_id": 1,
      "notes": "Free-text notes"
    }
  ]
}
```

**Response** `200` — [`ODPlanReportItem`](#odplanreportitem)

---

<a id="get-api-reports-scope"></a>
## `GET /api/reports/scope`

**Get Reports Scope**

Returns which employees the current user can run reports for (role: self | region_head | domain_head | super_admin).
Allowed for either marketing.view_report (Reports page) or marketing.view_lead (Leads page uses it for date range / won-lost scope).

**Permission:** `marketing.view_lead` **or** `marketing.view_report`

**Path parameters:** _none_

**Response** `200` — [`ReportScopeResponse`](#reportscoperesponse)

---

<a id="get-api-reports-summary"></a>
## `GET /api/reports/summary`

**Get Reports Summary**

Report summary for the current user (or selected team member if region/domain head).
Optional date range filters activities and leads by created_at/activity_date.

**Permission:** `marketing.view_report`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `date_from` | string | no | ISO date or datetime |
| `date_to` | string | no | ISO date or datetime |
| `employee_id` | integer | no | Specific employee; must be in scope |

**Response** `200` — [`ReportSummaryResponse`](#reportsummaryresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="expectedorderreportitem"></a>
### ExpectedOrderReportItem

```json
{
  "id": 1,
  "employee_id": 1,
  "year": 0,
  "month": 0,
  "created_at": "2026-01-31T09:30:00Z",
  "leads": [
    {
      "lead_id": 1,
      "lead_series": "string",
      "lead_name": "Example name",
      "company": "string",
      "lead_status_label": "active",
      "lead_is_final": false,
      "lead_is_lost": false
    }
  ]
}
```

<a id="odplanreportitem"></a>
### ODPlanReportItem

```json
{
  "id": 1,
  "employee_id": 1,
  "year": 0,
  "month": 0,
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z",
  "entries": [
    {
      "id": 1,
      "plan_date": "string",
      "entry_type": "string",
      "where_place": "string",
      "travel_time": "string",
      "travel_type": "string",
      "contact_id": 1,
      "contact_name": "Example name",
      "contact_email": "person@example.com",
      "notes": "Free-text notes"
    }
  ]
}
```

<a id="reportscoperesponse"></a>
### ReportScopeResponse

```json
{
  "can_select_employee": false,
  "employees": [
    {
      "id": 1,
      "name": "Example name",
      "domain_id": 1,
      "domain_name": "Example name",
      "region_id": 1,
      "region_name": "Example name"
    }
  ],
  "role": "string",
  "is_domain_coordinator": false,
  "domains": [],
  "regions": []
}
```

<a id="reportsummaryresponse"></a>
### ReportSummaryResponse

```json
{
  "date_from": "string",
  "date_to": "string",
  "employee_id": 1,
  "employee_name": "Example name",
  "inquiries_count": 20,
  "inquiries_by_type": [
    {
      "activity_type": "string",
      "count": 20
    }
  ],
  "quotations_sent_count": 20,
  "leads_total": 0,
  "leads_by_status": [
    {
      "status_id": 1,
      "status_code": "active",
      "status_label": "active",
      "count": 20
    }
  ],
  "leads_created_count": 20,
  "total_contacts": 0,
  "total_customers": 0
}
```
