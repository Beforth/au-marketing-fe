<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Dashboard API

10 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-dashboard-domain-target-summary"></a>
## `GET /api/dashboard/domain-target-summary`

**Get Domain Target Summary**

Hierarchy of domains → regions → employees with target amounts for the given year/month.
Enforces dynamic visibility rules:
  - Domain Head: views their domains and regions (optionally others).
  - Region Head: views their region, region employee targets, and can redact domain target details.
  - Employee: views only their own targets, redacting other employees and region/domain totals.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `year` | integer | yes |  |
| `month` | integer | no |  |
| `quarter` | integer | no |  |

**Response** `200` — [`DomainTargetSummaryResponse`](#domaintargetsummaryresponse)

---

<a id="get-api-dashboard-head-summary"></a>
## `GET /api/dashboard/head-summary`

**Get Head Dashboard Summary**

Head dashboard summary for domain_head and super_admin: region-wise split, hot cases, total leads,
conversion ratio, won vs lost. Returns empty/zero data for region_head and self.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `date_from` | string | no | YYYY-MM-DD |
| `date_to` | string | no | YYYY-MM-DD |

**Response** `200` — [`HeadDashboardSummaryResponse`](#headdashboardsummaryresponse)

---

<a id="get-api-dashboard-performer-of-month"></a>
## `GET /api/dashboard/performer-of-month`

**Get Performer Of Month**

Top 5 performers for the current month, scoped to the caller's role:
super admin = all domains/regions; domain head/coordinator = their domains;
region head/supervisor/employee = their regions.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200` — [`PerformerOfMonthResponse`](#performerofmonthresponse)

---

<a id="get-api-dashboard-quotation-stats"></a>
## `GET /api/dashboard/quotation-stats`

**Get Quotation Stats**

Region-wise quotation submission counts for domain_head and super_admin only.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `period` | string | no | (default: `monthly`) |

**Response** `200` — [`QuotationStatsResponse`](#quotationstatsresponse)

---

<a id="get-api-dashboard-role-summary"></a>
## `GET /api/dashboard/role-summary`

**Get Role Dashboard Summary**

Single data source for the 4 hardcoded role dashboards (Employee / Region Head / Domain Head /
Super Admin). Leads/Orders/Contacts/Customers figures are creator-chain scoped — identical rule
to what the viewer can open on those pages.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `date_from` | string | no | YYYY-MM-DD |
| `date_to` | string | no | YYYY-MM-DD |

**Response** `200` — [`RoleDashboardSummaryResponse`](#roledashboardsummaryresponse)

---

<a id="get-api-dashboard-scope-target-stats"></a>
## `GET /api/dashboard/scope-target-stats`

**Get Scope Target Stats**

Scope-wide target vs achieved for dashboard. For employee = own stats; for region/domain/super_admin = aggregated team stats.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `date_from` | string | no | YYYY-MM-DD |
| `date_to` | string | no | YYYY-MM-DD |
| `domain_id` | integer | no | Filter to a specific domain |
| `region_id` | integer | no | Filter to a specific region |

**Response** `200` — [`ScopeTargetStatsResponse`](#scopetargetstatsresponse)

---

<a id="put-api-dashboard-target"></a>
## `PUT /api/dashboard/target`

**Set Employee Target**

Set monthly target for an employee (admin/domain head/region head in scope).
Used from domain tree view or team settings. Default 0 if never set.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `employee_id` | integer | yes | Employee to set target for |
| `year` | integer | yes |  |
| `month` | integer | yes |  |

**Request body** (`SetTargetRequest`):

```json
{
  "target_amount": 100000
}
```

**Response** `200`:

```json
"string"
```

---

<a id="get-api-dashboard-target-stats"></a>
## `GET /api/dashboard/target-stats`

**Get Target Stats**

Monthly target vs achieved for dashboard. For current user (or selected employee if admin/head).
Achieved = sum of closed_value from won leads closed this month (assigned to or created by the employee).

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `employee_id` | integer | no | For admin/head: view specific employee's stats (must be in scope) |
| `date_from` | string | no | YYYY-MM-DD |
| `date_to` | string | no | YYYY-MM-DD |

**Response** `200` — [`TargetStatsResponse`](#targetstatsresponse)

---

<a id="put-api-dashboard-target-domain"></a>
## `PUT /api/dashboard/target/domain`

**Set Domain Target**

Set optional monthly goal for a domain. Shown on domain target summary alongside team sum.
Pass target_amount 0 to clear the explicit goal.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `domain_id` | integer | yes | Domain to set goal for |
| `year` | integer | yes |  |
| `month` | integer | yes |  |

**Request body** (`SetTargetRequest`):

```json
{
  "target_amount": 100000
}
```

**Response** `200`:

```json
"string"
```

---

<a id="put-api-dashboard-target-region"></a>
## `PUT /api/dashboard/target/region`

**Set Region Target**

Set optional monthly goal for a region. Shown on domain target summary alongside team sum.
Pass target_amount 0 to clear the explicit goal.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `region_id` | integer | yes | Region to set goal for |
| `year` | integer | yes |  |
| `month` | integer | yes |  |

**Request body** (`SetTargetRequest`):

```json
{
  "target_amount": 100000
}
```

**Response** `200`:

```json
"string"
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="domaintargetsummaryresponse"></a>
### DomainTargetSummaryResponse

```json
{
  "year": 0,
  "month": 0,
  "total_target": 100000,
  "domains": [
    {
      "domain_id": 1,
      "domain_name": "Example name",
      "domain_code": "string",
      "total_target": 100000,
      "assigned_target": 100000,
      "regions": [
        "{ … RegionTargetSummaryItem }"
      ]
    }
  ]
}
```

<a id="headdashboardsummaryresponse"></a>
### HeadDashboardSummaryResponse

```json
{
  "role": "string",
  "region_breakdown": [
    {
      "region_id": 1,
      "region_name": "Example name",
      "domain_name": "Example name",
      "total_leads": 0,
      "won_count": 20,
      "lost_count": 20,
      "hot_cases_count": 20,
      "conversion_ratio_pct": 0
    }
  ],
  "hot_cases_count": 20,
  "total_leads": 0,
  "conversion_ratio_pct": 0,
  "won_count": 20,
  "lost_count": 20,
  "year": 0,
  "month": 0
}
```

<a id="performerofmonthresponse"></a>
### PerformerOfMonthResponse

```json
{
  "year": 0,
  "month": 0,
  "performers": [
    {
      "employee_id": 1,
      "employee_name": "Example name",
      "domain_name": "Example name",
      "region_name": "Example name",
      "monthly_target": 100000,
      "achieved_value": 100000,
      "achievement_pct": 0,
      "won_count": 20
    }
  ],
  "highest_absolute_achiever": {
    "employee_id": 1,
    "employee_name": "Example name",
    "domain_name": "Example name",
    "region_name": "Example name",
    "monthly_target": 100000,
    "achieved_value": 100000,
    "achievement_pct": 0,
    "won_count": 20
  }
}
```

<a id="quotationstatsresponse"></a>
### QuotationStatsResponse

```json
{
  "labels": [
    "string"
  ],
  "regions": [
    {
      "region_name": "Example name",
      "data": [
        0
      ]
    }
  ]
}
```

<a id="roledashboardsummaryresponse"></a>
### RoleDashboardSummaryResponse

```json
{
  "dashboard_role": "string",
  "scope_label": "string",
  "year": 0,
  "month": 0,
  "total_leads": 0,
  "open_leads": 0,
  "won_count_month": 20,
  "lost_count_month": 20,
  "conversion_ratio_pct": 0,
  "by_status": [
    {
      "status_id": 1,
      "status": "active",
      "count": 20,
      "color": "string",
      "is_final": false,
      "is_lost": false
    }
  ],
  "recent_leads": [
    {
      "id": 1,
      "series": "string",
      "company": "string",
      "status": "active",
      "status_color": "active",
      "potential_value": 100000,
      "created_at": "2026-01-31T09:30:00Z"
    }
  ],
  "monthly_trend": [
    {
      "month": "string",
      "label": "string",
      "lead_count": 20,
      "won_value": 100000,
      "order_revenue": 0,
      "target_value": 0.0
    }
  ],
  "total_orders": 0,
  "total_revenue_month": 0,
  "contacts_count": 20,
  "customers_count": 20,
  "monthly_target": 100000,
  "achieved_this_month": 0,
  "employee_count": 20,
  "avg_open_lead_age_days": 0,
  "revenue_pipeline": {
    "achieved": 0,
    "committed": 0,
    "pipeline": 0
  },
  "hot_leads_count": 20,
  "follow_ups_due": [
    {
      "id": 1,
      "series": "string",
      "company": "string",
      "next_follow_up_at": "2026-01-31T09:30:00Z",
      "due_label": "string"
    }
  ],
  "lead_source_breakdown": [
    {
      "source": "string",
      "count": 20
    }
  ],
  "high_value_leads": [
    {
      "id": 1,
      "series": "string",
      "company": "string",
      "value": 100000,
      "value_source": "string",
      "status": "active"
    }
  ]
}
```

<a id="scopetargetstatsresponse"></a>
### ScopeTargetStatsResponse

```json
{
  "role": "string",
  "scope_label": "string",
  "monthly_target": 100000,
  "achieved_this_month": 0,
  "won_leads_count_this_month": 20,
  "lost_leads_count_this_month": 20,
  "quotation_submitted_value": 0,
  "year": 0,
  "month": 0,
  "employee_count": 20
}
```

<a id="targetstatsresponse"></a>
### TargetStatsResponse

```json
{
  "monthly_target": 100000,
  "achieved_this_month": 0,
  "won_leads_count_this_month": 20,
  "lost_leads_count_this_month": 20,
  "year": 0,
  "month": 0
}
```
