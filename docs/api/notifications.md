<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Notifications API

8 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-notifications"></a>
## `GET /api/notifications/`

**List Notifications**

List notifications for the current user, newest first.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `unread_only` | boolean | no | (default: `False`) |
| `limit` | integer | no | (default: `50`) |

**Response** `200`:

```json
[
  {
    "id": 1,
    "user_employee_id": 1,
    "title": "string",
    "message": "string",
    "link": "https://example.com",
    "notification_type": "string",
    "lead_id": 1,
    "read_at": "2026-01-31T09:30:00Z",
    "created_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-notifications-devices-register"></a>
## `POST /api/notifications/devices/register`

**Register Notification Device**

Register/refresh an FCM device token for current user (web push).

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Request body** (`NotificationDeviceRegister`):

```json
{
  "token": "string",
  "platform": "web",
  "user_agent": "string"
}
```

**Response** `200` — [`NotificationDeviceResponse`](#notificationdeviceresponse)

---

<a id="post-api-notifications-devices-unregister"></a>
## `POST /api/notifications/devices/unregister`

**Unregister Notification Device**

Unregister current user's FCM token.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Request body** (`NotificationDeviceRegister`):

```json
{
  "token": "string",
  "platform": "web",
  "user_agent": "string"
}
```

**Response** `200`:

```json
"string"
```

---

<a id="get-api-notifications-preferences"></a>
## `GET /api/notifications/preferences`

**Get Preferences**

Get current user's notification preferences (times per day, preferred times).

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200` — [`UserNotificationPreferenceResponse`](#usernotificationpreferenceresponse)

---

<a id="put-api-notifications-preferences"></a>
## `PUT /api/notifications/preferences`

**Update Preferences**

Update how many times per day to get follow-up notifications and at what times.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Request body** (`UserNotificationPreferenceUpdate`):

```json
{
  "times_per_day": 0,
  "preferred_times": "string"
}
```

**Response** `200` — [`UserNotificationPreferenceResponse`](#usernotificationpreferenceresponse)

---

<a id="patch-api-notifications-read-all"></a>
## `PATCH /api/notifications/read-all`

**Mark All Read**

Mark all notifications for the current user as read.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="get-api-notifications-unread-count"></a>
## `GET /api/notifications/unread-count`

**Unread Count**

Return count of unread notifications.

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Response** `200`:

```json
"string"
```

---

<a id="patch-api-notifications-notification-id-read"></a>
## `PATCH /api/notifications/{notification_id}/read`

**Mark Read**

Mark a notification as read.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `notification_id` | integer | yes |  |

**Response** `200` — [`NotificationResponse`](#notificationresponse)

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="notificationdeviceresponse"></a>
### NotificationDeviceResponse

```json
{
  "id": 1,
  "user_employee_id": 1,
  "platform": "string",
  "last_seen_at": "2026-01-31T09:30:00Z",
  "created_at": "2026-01-31T09:30:00Z"
}
```

<a id="usernotificationpreferenceresponse"></a>
### UserNotificationPreferenceResponse

```json
{
  "user_employee_id": 1,
  "times_per_day": 3,
  "preferred_times": "string",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="notificationresponse"></a>
### NotificationResponse

```json
{
  "id": 1,
  "user_employee_id": 1,
  "title": "string",
  "message": "string",
  "link": "https://example.com",
  "notification_type": "string",
  "lead_id": 1,
  "read_at": "2026-01-31T09:30:00Z",
  "created_at": "2026-01-31T09:30:00Z"
}
```
