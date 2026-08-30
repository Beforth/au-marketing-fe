<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Campaigns API

5 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-campaigns"></a>
## `GET /api/campaigns/`

**Get Campaigns**

Get paginated list of campaigns (default 10 per page).
Requires: marketing.view_campaign permission

**Permission:** `marketing.view_campaign`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `status` | string | no |  |

**Response** `200` — [`PaginatedResponse<CampaignResponse>`](#paginatedresponse-campaignresponse)

---

<a id="post-api-campaigns"></a>
## `POST /api/campaigns/`

**Create Campaign**

Create a new campaign

Requires: marketing.create_campaign permission

**Permission:** `marketing.create_campaign`

**Path parameters:** _none_

**Request body** (`CampaignCreate`):

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "status": "draft",
  "start_date": "2026-01-31",
  "end_date": "2026-01-31",
  "budget": 100000,
  "domain_id": 1,
  "manager_employee_id": 1
}
```

**Response** `201` — [`CampaignResponse`](#campaignresponse)

---

<a id="get-api-campaigns-campaign-id"></a>
## `GET /api/campaigns/{campaign_id}`

**Get Campaign**

Get single campaign by ID

Requires: marketing.view_campaign permission

**Permission:** `marketing.view_campaign`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `campaign_id` | integer | yes |  |

**Response** `200` — [`CampaignResponse`](#campaignresponse)

---

<a id="put-api-campaigns-campaign-id"></a>
## `PUT /api/campaigns/{campaign_id}`

**Update Campaign**

Update a campaign

Requires: marketing.edit_campaign permission

**Permission:** `marketing.edit_campaign`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `campaign_id` | integer | yes |  |

**Request body** (`CampaignUpdate`):

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "status": "draft",
  "start_date": "2026-01-31",
  "end_date": "2026-01-31",
  "budget": 100000,
  "actual_cost": 100000,
  "domain_id": 1,
  "manager_employee_id": 1
}
```

**Response** `200` — [`CampaignResponse`](#campaignresponse)

---

<a id="delete-api-campaigns-campaign-id"></a>
## `DELETE /api/campaigns/{campaign_id}`

**Delete Campaign**

Delete a campaign

Requires: marketing.delete_campaign permission

**Permission:** `marketing.delete_campaign`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `campaign_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-campaignresponse"></a>
### PaginatedResponse<CampaignResponse>

```json
{
  "items": [
    {
      "name": "Example name",
      "description": "Free-text notes",
      "status": "draft",
      "start_date": "2026-01-31",
      "end_date": "2026-01-31",
      "budget": "string",
      "domain_id": 1,
      "id": 1,
      "actual_cost": "string",
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "manager_employee_id": 1,
      "manager_username": "Example name",
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
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="campaignresponse"></a>
### CampaignResponse

```json
{
  "name": "Example name",
  "description": "Free-text notes",
  "status": "draft",
  "start_date": "2026-01-31",
  "end_date": "2026-01-31",
  "budget": "string",
  "domain_id": 1,
  "id": 1,
  "actual_cost": "string",
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "manager_employee_id": 1,
  "manager_username": "Example name",
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
}
```
