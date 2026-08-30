<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Presence API

2 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-presence-active"></a>
## `GET /api/presence/active`

**Get Presence Active**

List users active in the last N seconds. REST fallback for clients that can't hold a WebSocket open.

**Permission:** `presence.view_users`

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="post-api-presence-ping"></a>
## `POST /api/presence/ping`

**Ping Presence**

Frontend heartbeat: marks the caller as active on the given page.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Request body** (`PresencePing`):

```json
{
  "page": "",
  "label": "string"
}
```

**Response** `200`:

```json
"string"
```

---
