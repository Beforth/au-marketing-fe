<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Tickets API

3 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-tickets"></a>
## `GET /api/tickets/`

**Tickets List**

Return current user's recent tickets.

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `limit` | integer | no | (default: `20`) |

**Response** `200`:

```json
"string"
```

---

<a id="post-api-tickets"></a>
## `POST /api/tickets/`

**Create Support Ticket**

Create a support ticket via PQ Platform and save to local DB.

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Request body** (`CreateTicketRequest`):

```json
{
  "title": "string",
  "description": "Free-text notes",
  "ticket_type": "bug"
}
```

**Response** `200`:

```json
"string"
```

---

<a id="post-api-tickets-feedback"></a>
## `POST /api/tickets/feedback`

**Send Support Feedback**

Send rating feedback via PQ Platform and save locally.

**Permission:** `marketing.view_domain`

**Path parameters:** _none_

**Request body** (`SendFeedbackRequest`):

```json
{
  "rating": 0,
  "comment": "Free-text notes"
}
```

**Response** `200`:

```json
"string"
```

---
