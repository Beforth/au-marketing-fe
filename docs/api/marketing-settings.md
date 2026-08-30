<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Marketing Settings API

2 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-marketing-settings"></a>
## `GET /api/marketing/settings`

**Get Settings**

Get the active marketing visibility settings.
Accessible by any logged-in user.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200` — [`MarketingSettingsPayload-Output`](#marketingsettingspayload-output)

---

<a id="put-api-marketing-settings"></a>
## `PUT /api/marketing/settings`

**Update Settings**

Update the active marketing visibility settings.
Requires 'marketing.admin' permission.

**Permission:** `marketing.admin`

**Path parameters:** _none_

**Request body** (`MarketingSettingsPayload-Input`):

```json
{
  "schema_version": 1,
  "global_rules": {
    "domain_head": {
      "view_other_domains": false,
      "view_other_regions": false
    },
    "region_head": {
      "view_other_regions": false,
      "view_domain_head_name": true,
      "view_domain_target": false
    },
    "employee": {
      "view_other_employee_targets": false,
      "view_region_head_name": true,
      "view_domain_head_name": true,
      "view_region_target": false
    }
  },
  "domain_overrides": {
    "key": "value"
  },
  "past_quarter_access": [
    {
      "quarter": "string",
      "user_ids": [
        0
      ],
      "user_details": [
        "{ … PastQuarterUserDetail }"
      ]
    }
  ]
}
```

**Response** `200` — [`MarketingSettingsPayload-Output`](#marketingsettingspayload-output)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="marketingsettingspayload-output"></a>
### MarketingSettingsPayload-Output

```json
{
  "schema_version": 1,
  "global_rules": {
    "domain_head": {
      "view_other_domains": false,
      "view_other_regions": false
    },
    "region_head": {
      "view_other_regions": false,
      "view_domain_head_name": true,
      "view_domain_target": false
    },
    "employee": {
      "view_other_employee_targets": false,
      "view_region_head_name": true,
      "view_domain_head_name": true,
      "view_region_target": false
    }
  },
  "domain_overrides": {
    "key": "value"
  },
  "past_quarter_access": [
    {
      "quarter": "string",
      "user_ids": [
        0
      ],
      "user_details": [
        "{ … PastQuarterUserDetail }"
      ]
    }
  ]
}
```
