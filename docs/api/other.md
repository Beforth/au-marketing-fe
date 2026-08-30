<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Other API

2 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get"></a>
## `GET /`

**Root**

Root endpoint

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-health"></a>
## `GET /health`

**Health Check**

Health check endpoint

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---
