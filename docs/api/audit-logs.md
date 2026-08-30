<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Audit Logs API

1 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-audit-logs"></a>
## `GET /api/audit-logs/`

**Get Audit Logs**

**Permission:** `marketing.admin` **or** `marketing.view_reports`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `25`) |
| `entity_type` | string | no |  |
| `employee_id` | integer | no |  |
| `action` | string | no |  |
| `start_date` | string | no |  |
| `end_date` | string | no |  |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<AuditLogResponse>`](#paginatedresponse-auditlogresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-auditlogresponse"></a>
### PaginatedResponse<AuditLogResponse>

```json
{
  "items": [
    {
      "id": 1,
      "employee_id": 1,
      "employee_name": "Example name",
      "action": "string",
      "entity_type": "string",
      "entity_id": 1,
      "details": "string",
      "created_at": "2026-01-31T09:30:00Z"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```
