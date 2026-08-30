<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Schema API

1 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-schema"></a>
## `GET /api/schema`

**Get Schema**

Return all tables and their columns (from the current DB).
Use this in the frontend to show schema reference / ER context for Custom SQL widgets.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200` — [`SchemaResponse`](#schemaresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="schemaresponse"></a>
### SchemaResponse

```json
{
  "tables": [
    {
      "name": "Example name",
      "columns": [
        "{ … ColumnInfo }"
      ],
      "foreign_keys": []
    }
  ]
}
```
