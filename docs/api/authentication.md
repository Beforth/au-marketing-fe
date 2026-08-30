<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Authentication API

9 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="delete-api-auth-email"></a>
## `DELETE /api/auth/email`

**Disconnect Email**

Remove the current user's connected email.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-api-auth-email-connection"></a>
## `GET /api/auth/email-connection`

**Get Email Connection**

Get current user's email connection status (for "Connect email" in profile).
Returns { connected: bool, email?: str }.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-api-auth-email-authorize-url"></a>
## `GET /api/auth/email/authorize-url`

**Get Email Authorize Url**

Return Google OAuth2 authorization URL. Frontend redirects the user here.
State carries the token so we can identify the user in the callback.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-api-auth-email-callback"></a>
## `GET /api/auth/email/callback`

**Email Callback**

Google redirects here after user authorizes. Exchange code for tokens and store by user.
Then redirect to frontend settings.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `code` | string | yes | Authorization code from Google |
| `state` | string | no | State (token) from authorize step |

**Response** `200`:

```json
"string"
```

---

<a id="post-api-auth-login"></a>
## `POST /api/auth/login`

**Login**

Login with HRMS credentials and get token.
Returns token and user information from HRMS.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Request body** (`LoginRequest`):

```json
{
  "username": "Example name",
  "password": "string"
}
```

**Response** `200` — [`LoginResponse`](#loginresponse)

---

<a id="post-api-auth-logout"></a>
## `POST /api/auth/logout`

**Logout**

Logout and invalidate token.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-api-auth-me"></a>
## `GET /api/auth/me`

**Get Profile**

Get current user profile (same as HRMS user info).
Use ?refresh=1 to reload permissions cache and return fresh profile from HRMS.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `refresh` | boolean | no | If true, clear permissions cache and return fresh profile from HRMS (default: `False`) |

**Response** `200`:

```json
"string"
```

---

<a id="post-api-auth-refresh-permissions"></a>
## `POST /api/auth/refresh-permissions`

**Refresh Permissions**

Invalidate RBAC cache for the current token. Next request will refetch permissions and user info from HRMS.
Call after role/permission changes or when the frontend "profile refresh" is triggered.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-api-auth-scope"></a>
## `GET /api/auth/scope`

**Get Marketing Scope**

Return resolved marketing scope for current user.
Used by frontend to prefill default domain/region on create forms.

**Permission:** _no explicit check — public or token-only_

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="loginresponse"></a>
### LoginResponse

```json
{
  "success": false,
  "token": "string",
  "user": {},
  "employee": {},
  "roles": [
    {}
  ],
  "permissions": [
    {}
  ],
  "error": "string"
}
```
