<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Exhibitions API

1 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-exhibitions-active"></a>
## `GET /api/exhibitions/active`

**Get Active Exhibitions**

All currently-active exhibitions (type=exhibition, status=active), across every
domain - unscoped, not filtered to the caller's own domain/region.

**Permission:** `marketing.view_events`

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "id": 1,
    "name": "Example name",
    "location": "string",
    "start_date": "2026-01-31",
    "end_date": "2026-01-31",
    "domain_id": 1
  }
]
```

---
