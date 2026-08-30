<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Whats New API

4 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-whats-new"></a>
## `GET /api/whats-new/`

**List Changelogs**

Get all changelog versions from the database, ordered by ID descending.
Accessible to any authenticated user.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
[
  {
    "id": 1,
    "version": "string",
    "release_date": "string",
    "sections": [
      {
        "title": "string",
        "items": []
      }
    ],
    "created_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-whats-new"></a>
## `POST /api/whats-new/`

**Create Changelog**

Create a new changelog version. Admin only.

**Permission:** `marketing.admin`

**Path parameters:** _none_

**Request body** (`ChangelogVersionCreate`):

```json
{
  "version": "string",
  "release_date": "string",
  "sections": [
    {
      "title": "string",
      "items": [
        "string"
      ]
    }
  ]
}
```

**Response** `200` — [`ChangelogVersionResponse`](#changelogversionresponse)

---

<a id="put-api-whats-new-changelog-id"></a>
## `PUT /api/whats-new/{changelog_id}`

**Update Changelog**

Update an existing changelog version. Admin only.

**Permission:** `marketing.admin`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `changelog_id` | integer | yes |  |

**Request body** (`ChangelogVersionCreate`):

```json
{
  "version": "string",
  "release_date": "string",
  "sections": [
    {
      "title": "string",
      "items": [
        "string"
      ]
    }
  ]
}
```

**Response** `200` — [`ChangelogVersionResponse`](#changelogversionresponse)

---

<a id="delete-api-whats-new-changelog-id"></a>
## `DELETE /api/whats-new/{changelog_id}`

**Delete Changelog**

Delete a changelog version. Admin only.

**Permission:** `marketing.admin`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `changelog_id` | integer | yes |  |

**Response** `204` — _no body._

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="changelogversionresponse"></a>
### ChangelogVersionResponse

```json
{
  "id": 1,
  "version": "string",
  "release_date": "string",
  "sections": [
    {
      "title": "string",
      "items": [
        "string"
      ]
    }
  ],
  "created_at": "2026-01-31T09:30:00Z"
}
```
