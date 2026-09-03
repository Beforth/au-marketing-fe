# Intranet SSO — Integration Guide for Any Module

How to wire a module (web SPA, server-rendered app, mobile, any stack) into the
Aureole Intranet single-sign-on ring so users move between apps without logging
in again.

This guide describes **what to do and what the contracts are** — not how to write
it in any particular language or framework. Where behaviour matters it is spelled
out as a requirement; the implementation is yours.

> **Reference implementation:** S&M Hub (this repo) is a React + Redux SPA. Its
> specific files are listed in §8 as a worked example — your module's structure
> will differ.

Hand this file to whoever (or whatever) implements SSO in the other module, plus
a short note describing that module's existing auth (how it stores its token,
where its login logic lives, where its shell/header is).

---

## 0. The whole job, in order

1. **Verify the HRMS instance** the module talks to — run the checks in §2. Fix
   any HRMS bug found on **every** instance (demo and prod are separate and drift).
2. **Direction A — into the module** (§4): a public `/login-redirect` entry point
   that exchanges the one-time token for a real session, then register the module
   in HRMS admin → Intranet Apps.
3. **Direction B — out of the module** (§5): a switcher in the app shell that
   lists the other apps and redirects to them.
4. **Test** both directions with fresh links (§7).
5. **Deploy**; confirm the module points at an HRMS instance with working SSO.

The two directions are independent — ship either one alone.

---

## 1. The model

Every module authenticates by holding an **HRMS auth token** and sending it as
`Authorization: Token <token>` on every backend/HRMS call. Modules own no
user/password store; HRMS is the identity provider.

| Direction | Trigger | HRMS endpoints | What the module adds |
|---|---|---|---|
| **Into this module** | Portal tile, or another app's switcher, redirects here | `POST /api/rbac/sso/validate/` | A public `/login-redirect` entry point |
| **Out of this module** | User picks another app in this module's shell | `GET /intranet-app/`, then `POST /api/rbac/sso/generate/` | A switcher control in the shell |

One-time SSO tokens: 5-minute TTL, single use, bound to one `user_id` and one app.

---

## 2. HRMS prerequisites — verify first

SSO is not deployed uniformly across HRMS instances. Test the **exact** instance
your module uses before building.

```bash
# 1. validate — must return an auth `token`, not just identity.
#    Get a fresh one-time token first (HRMS admin → Intranet Apps → launch, or
#    another app's switcher), then immediately:
curl -s -X POST https://<HRMS>/api/rbac/sso/validate/ \
  -H 'Content-Type: application/json' \
  -d '{"token":"<fresh one-time token>","user_id":<id>}'
# EXPECT 200: {"valid":true,"token":"<hex DRF token>","user":{...},"employee":{...},
#              "roles":[...],"permissions":[...]}
# "token" missing  -> HRMS bug (below)
# 500 NameError    -> HRMS bug (below)
# {"valid":false}  -> token was already used/expired; get a fresh one

# 2. generate — must exist (401 without auth is the correct answer)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<HRMS>/api/rbac/sso/generate/ -d '{}'
# EXPECT: 401

# 3. app list — must exist (needs a real token with intranet.view)
curl -s https://<HRMS>/intranet-app/ -H 'Authorization: Token <token>'
# EXPECT: [ {"id","name","icon","url","is_active","sort_order",...}, ... ]
```

### Known HRMS-side bugs

Both are in `employees/api_views.py` → `sso_validate_token`:

1. **`NameError: name 'RolePermission' is not defined`** — used to build the
   permission list but not imported. Fix: add `RolePermission` to the
   `from .models import …` line.
2. **No `token` in the response** — the view returns identity only. Fix: create
   the token the same way `api_login` does
   (`Token.objects.get_or_create(user=user)`) and include its key as `"token"`.

~1 line each. Apply to every HRMS instance the module will use.

---

## 3. Endpoint contracts

### `POST {HRMS}/api/rbac/sso/validate/` — no auth

```jsonc
// request
{ "token": "<one-time token from the URL>", "user_id": 42 }

// 200
{
  "valid": true,
  "token": "<DRF auth token — the module stores THIS and uses it like a password-login token>",
  "user":        { "id": 42, "username": "...", "email": "...", "first_name": "...", "last_name": "..." },
  "employee":    { "id": 100, "emp_id": "EMP001", "first_name": "...", "last_name": "..." },
  "roles":       [ { "role__id": 5, "role__name": "...", "role__role_type": "...", "is_primary": true } ],
  "permissions": [ "marketing.admin", "employee.view", "..." ]
}

// 400
{ "valid": false, "detail": "Token expired or already used." }
```

`roles` here uses `role__id` / `role__name` keys — a different shape from the
`/login/` endpoint. If the module needs canonical roles, call
`GET {HRMS}/api/rbac/user/info/` with the returned token instead.

### `GET {HRMS}/intranet-app/` — requires `intranet.view`

At the HRMS **root**, not under `/api/rbac/`.

```jsonc
[ { "id": 1, "name": "T-HRMS", "icon": "/media/intranet_apps/x.png",
    "url": "https://hrms...", "description": "...", "is_active": true,
    "sort_order": 1, "created_at": "...", "updated_at": "..." } ]
```

`icon` is a path relative to the HRMS origin — resolve it against that origin.
Use only `is_active` rows; order by `sort_order`.

### `POST {HRMS}/api/rbac/sso/generate/` — requires `intranet.view`

```jsonc
// request — Authorization: Token <this module's token>
{ "app_id": 1 }

// 201
{ "token": "<one-time token>",
  "redirect_url": "https://<target-app>/login-redirect?sso_token=<...>&user_id=<id>",
  "expires_at": "2026-09-03T15:48:17" }
```

The module sends the browser to `redirect_url` verbatim — it builds no URL itself.
Errors: 400 missing `app_id` · 403 no `intranet.view` · 404 app not found/inactive.

---

## 4. Direction A — into this module (`/login-redirect`)

### A1. A `validateSSO(ssoToken, userId)` operation

Calls `POST {HRMS}/api/rbac/sso/validate/` with `{ token, user_id }`. Returns the
parsed body. On non-200 or `valid !== true`, return a failure with the `detail`
string.

### A2. An `ssoLogin` operation that mirrors the module's password login

The module already has a login path that: stores the token, loads the user's
permission list, loads any post-login data (scope, profile, …), and populates its
auth state/session. `ssoLogin` must do the **same steps**, differing only in how
it obtains the token:

1. `r = validateSSO(ssoToken, userId)`.
2. If `!r.valid` → fail with `r.detail`.
3. If `!r.token` → fail with a clear message ("SSO succeeded but HRMS returned no
   auth token — sign in with your password"). This is the §2 bug.
4. Adopt `r.token` as the session token (same place password login puts it).
5. Optionally fetch canonical identity via `GET {HRMS}/api/rbac/user/info/`;
   fall back to `r.user` / `r.employee`.
6. Fetch the permission list the same way password login does; fall back to
   `r.permissions`.
7. Run the same post-login side effects as password login.
8. Mark the session authenticated.

### A3. The `/login-redirect` entry point

A route/page/handler at path **`/login-redirect`** that:

1. Reads `sso_token` and `user_id` from the query string.
2. **Immediately** removes them from the address bar / current URL (history
   replace) — before any `await` — so the one-time token doesn't linger in
   history, ref:erer, or logs.
3. If either is missing or `user_id` isn't a number → show an error state
   ("This sign-in link is missing information — open the app from the portal
   again"), stop.
4. Otherwise call `ssoLogin(ssoToken, userId)`.
   - Success → send the user to the app's landing page (replace, not push).
   - Failure → show the error message + a way to reach the normal sign-in page.
5. While working, show a brief "Signing you in…" state.
6. Guard against running twice (e.g. a ref/flag) — a double-invoke would spend the
   token on the first call and fail the second.

### A4. Route must be PUBLIC

`/login-redirect` must be reachable **without an existing session** — outside
whatever guard/redirect protects the rest of the app. An arriving SSO user has no
session yet; if the route is guarded they're bounced to the login screen before
the handshake can run.

### A5. Register the module in HRMS

HRMS admin → Intranet Apps → this module's row → `url` = the module's **origin**
(e.g. `https://demo-inventory.encryptedbar.com`). HRMS appends
`/login-redirect?sso_token=…&user_id=…` when it builds `redirect_url`.

---

## 5. Direction B — out of this module (the switcher)

### B1. Two client operations

**`listIntranetApps()`**
- Needs the current session token; if there's none, return empty.
- `GET {HRMS origin}/intranet-app/` with `Authorization: Token <token>`.
  Derive `{HRMS origin}` from the configured HRMS base URL (scheme + host only).
- Any non-200 (notably 403 = no `intranet.view`) → return empty. Never throw.
- From the array: keep `is_active`, resolve each `icon` against the HRMS origin,
  sort by `sort_order` then name.

**`generateSSOToken(appId)`**
- `POST {HRMS}/api/rbac/sso/generate/` with `{ app_id }` and
  `Authorization: Token <token>`.
- 201 → return `{ redirect_url }`.
- Error → throw a human-readable message: 403 → "You don't have permission to
  switch apps", 401 → "Your session expired — sign in again", 404 → "That app is
  not available", else the body's `detail`.

**`isCurrentApp(url)`** — true when `url`'s host equals the current page's host.

No hardcoded app IDs anywhere — the list is always live from HRMS.

### B2. The switcher control — behaviour spec

**The trigger is the app's own name in the shell header, with a small dropdown
chevron next to it. There is no separate icon button.**

- On load, call `listIntranetApps()` once. Compute
  `others = apps.filter(a => !isCurrentApp(a.url))`.
- **If `others` is empty** (logged out, no `intranet.view`, or the fetch failed):
  render the app name as **plain, non-interactive text** — no chevron, no
  affordance — visually identical to how the name looked before SSO existed.
- **If `others` is non-empty**: the name + chevron is a button; activating it
  toggles a dropdown/popover. The chevron indicates open/closed state.
- The logo/mark stays a **separate** control that links to the app's home — it is
  not part of the trigger. Never merge logo and name into one button.
- The name must **not** be truncated or width-capped. Let it take its natural
  width. (Truncation clipped "S&M Hub" to "S&M …" in the reference build.)
- Dropdown contents: a small heading ("Switch app"), then one row per app in
  `others` — each row shows the app's icon (or a letter avatar from its first
  character if it has none) and its name.
- Activating a row: disable the rows, show a busy indicator on that row, call
  `generateSSOToken(app.id)`, then set the browser location to `redirect_url`.
  On error: show the message inline in the dropdown and re-enable — do **not**
  navigate away or close the dropdown.
- Dismiss the dropdown on outside click / Escape.

### B3. Place it in the shell header

Next to the logo, replacing the plain app-name text that's there now. The logo
remains its own home link; the switcher owns the name.

---

## 6. Per-module adaptation — what to find in your module

| Concept | What you need to locate / provide |
|---|---|
| HRMS base URL | The configured HRMS API base (and how to get its bare origin for `/intranet-app/`) |
| Session token | Where the token is stored after password login, and how to read/set it |
| Password-login logic | The function/flow §A2 must mirror (token store + permission load + post-login side effects) |
| Auth state | How "the user is now logged in" is represented, so `ssoLogin` can set it |
| Route guard | The mechanism that redirects unauthenticated users, so `/login-redirect` can sit outside it |
| Permission list call | How the app loads the current user's permission codes |
| Media URL resolution | How a HRMS-relative `/media/...` path becomes absolute (needed for app icons) |
| App shell header | Where the logo + app name render |

---

## 7. Test checklist

**Direction A:**
- [ ] `/login-redirect` with no params → "missing information" state, no crash.
- [ ] `/login-redirect?sso_token=bad&user_id=1` → validate rejects → error state + route to normal sign-in.
- [ ] In both cases the query params are gone from the URL immediately.
- [ ] Fresh portal link → lands authenticated on the app home; session behaves exactly like a password login.
- [ ] Reload after SSO login → still authenticated (session persists like normal).
- [ ] Opening `/login-redirect` twice with the same link → second attempt fails gracefully (token already spent), first succeeds.

**Direction B:**
- [ ] Switcher shows the app name as plain text when logged out.
- [ ] Same for a user without `intranet.view`.
- [ ] Logged in with `intranet.view` → name gets a chevron; dropdown lists the *other* apps, not this one.
- [ ] Pick an app → browser redirects; the target app logs the user in with no password prompt.
- [ ] `generate/` 403 / 401 / 404 → message shown inline in the dropdown, no navigation.

**Gotchas:**
- One-time tokens are consumed on the first `validate/` call — every test needs a fresh link.
- Demo and prod HRMS are separate deployments; verify each before enabling SSO there.
- `roles` from `validate/` ≠ `roles` from `login/`. Use `user/info/` for canonical roles.
- `/intranet-app/` is at the HRMS root; `sso/*` is under `/api/rbac/`.
- The `redirect_url` from `generate/` is used verbatim — the module never assembles it.

---

## 8. Reference implementation — S&M Hub (React + Redux SPA)

One worked example. Another module's files and stack will differ; the contracts
in §2–§5 are what carries over.

| File | Role |
|---|---|
| `pages/SSORedirectPage.tsx` | The `/login-redirect` entry point (§A3): run-once guard, strip URL, call the SSO login, spinner → home on success, error card otherwise. |
| `App.tsx` | Registers `/login-redirect` as a public route, beside `/login`, outside the route guard. |
| `lib/hrms-rbac.ts` | `validateSSO(ssoToken, userId)` on the HRMS client. |
| `store/slices/authSlice.ts` | `loginWithSSO` async action — validates, then loads identity + permissions + scope with the returned token and writes the same session state the password `login` action does. |
| `lib/intranet-sso.ts` | `listIntranetApps()`, `isCurrentApp(url)`, `generateSSOToken(appId)`. |
| `components/ui/AppSwitcher.tsx` | The switcher (§B2): takes the current app name, name+chevron trigger, live app list, plain-text fallback. |
| `components/ui/Sidebar.tsx` | Logo is its own home link; the switcher sits beside it and owns the name. |

No backend changes in this repo — the browser calls HRMS directly, same as the
password login already does.

### Status (verified 2026-09-03)

- **`demo-hrms.encryptedbar.com`** — SSO working end to end: `validate/` returns
  the `token`, `generate/` returns a `redirect_url` to
  `demo-marketing.encryptedbar.com/login-redirect`, `intranet-app/` lists apps.
- **`hrms.encryptedbar.com` (prod)** — `validate/` still 500s with a real token
  (`NameError: name 'RolePermission' is not defined`). The §2 fix is on demo but
  not prod; apply it before enabling SSO on `marketing.aureolegroup.com`.
- Frontend built and type-checked; not yet deployed to `demo-marketing.encryptedbar.com`
  (its live build predates `/login-redirect`).

| Env | Module URL | HRMS URL | SSO |
|---|---|---|---|
| demo | `demo-marketing.encryptedbar.com` | `demo-hrms.encryptedbar.com` | HRMS ready; module needs deploy |
| prod | `marketing.aureolegroup.com` | `hrms.encryptedbar.com` | HRMS `validate/` still crashing |

Portal that triggers everything: `au-intranet-fe.vercel.app`.
