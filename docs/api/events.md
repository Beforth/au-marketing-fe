<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Events API

9 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-events"></a>
## `GET /api/events/`

**Get Events**

**Permission:** `marketing.view_events`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `type` | string | no |  |
| `status` | string | no |  |
| `search` | string | no |  |

**Response** `200` — [`PaginatedResponse<EventResponse>`](#paginatedresponse-eventresponse)

---

<a id="post-api-events"></a>
## `POST /api/events/`

**Create Event**

**Permission:** `marketing.create_events`

**Path parameters:** _none_

**Request body** (`EventCreate`):

```json
{
  "type": "exhibition",
  "name": "Example name",
  "location": "string",
  "start_date": "2026-01-31",
  "end_date": "2026-01-31",
  "budget": 0,
  "selected_employee_ids": [],
  "domain_id": 1
}
```

**Response** `201` — [`EventResponse`](#eventresponse)

---

<a id="get-api-events-event-id"></a>
## `GET /api/events/{event_id}`

**Get Event**

**Permission:** `marketing.view_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |

**Response** `200` — [`EventResponse`](#eventresponse)

---

<a id="put-api-events-event-id"></a>
## `PUT /api/events/{event_id}`

**Update Event**

**Permission:** `marketing.edit_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |

**Request body** (`EventUpdate`):

```json
{
  "name": "Example name",
  "location": "string",
  "start_date": "2026-01-31",
  "end_date": "2026-01-31",
  "budget": 100000,
  "selected_employee_ids": [
    0
  ],
  "domain_id": 1,
  "space_booking_vendor": "string",
  "space_booking_amount": 100000,
  "space_booking_paid_amount": 100000,
  "space_booking_pi_sent": false,
  "space_booking_payment_status": "active",
  "space_booking_installments": [
    {}
  ],
  "stall_vendors": [
    {}
  ],
  "stall_selected_vendor_id": 1,
  "stall_po_created": false,
  "banner_design_source": "string",
  "table_booking_venue": "string",
  "table_booking_count": 20,
  "table_booking_cost_per_table": 100000,
  "travel_days_before": 2,
  "travel_employee_ids": [
    0
  ],
  "hotel_name": "Example name",
  "hotel_employee_ids": [
    0
  ],
  "hotel_cost": 100000,
  "local_travel_entries": [
    {}
  ],
  "gifting_entries": [
    {}
  ]
}
```

**Response** `200` — [`EventResponse`](#eventresponse)

---

<a id="delete-api-events-event-id"></a>
## `DELETE /api/events/{event_id}`

**Delete Event**

**Permission:** `marketing.delete_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="post-api-events-event-id-end"></a>
## `POST /api/events/{event_id}/end`

**End Event**

**Permission:** `marketing.edit_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |

**Response** `200` — [`EventResponse`](#eventresponse)

---

<a id="post-api-events-event-id-files"></a>
## `POST /api/events/{event_id}/files`

**Upload Event File**

**Permission:** `marketing.edit_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |

**Request body** (`Body_upload_event_file_api_events__event_id__files_post`):

```json
{
  "file": "string",
  "file_type": "string",
  "vendor_id": "string",
  "employee_id": "string",
  "entry_index": "string"
}
```

**Response** `201` — [`EventUploadResponse`](#eventuploadresponse)

---

<a id="delete-api-events-event-id-files-file-id"></a>
## `DELETE /api/events/{event_id}/files/{file_id}`

**Delete Event File**

**Permission:** `marketing.edit_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |
| `file_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-events-event-id-files-file-id-download"></a>
## `GET /api/events/{event_id}/files/{file_id}/download`

**Download Event File**

**Permission:** `marketing.view_events`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `event_id` | integer | yes |  |
| `file_id` | integer | yes |  |

**Response** `200`:

```json
"string"
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-eventresponse"></a>
### PaginatedResponse<EventResponse>

```json
{
  "items": [
    {
      "type": "exhibition",
      "name": "Example name",
      "location": "string",
      "start_date": "2026-01-31",
      "end_date": "2026-01-31",
      "budget": 0,
      "selected_employee_ids": [],
      "id": 1,
      "domain_id": 1,
      "status": "active",
      "total_spent": 0,
      "space_booking_vendor": "",
      "space_booking_amount": 0,
      "space_booking_paid_amount": 0,
      "space_booking_pi_sent": false,
      "space_booking_payment_status": "pending",
      "space_booking_installments": [],
      "stall_vendors": [],
      "stall_selected_vendor_id": 1,
      "stall_po_created": false,
      "stall_design_files": [],
      "banner_design_source": "own",
      "banner_design_files": [],
      "table_booking_venue": "",
      "table_booking_count": 0,
      "table_booking_cost_per_table": 0,
      "table_booking_total_cost": 0,
      "travel_days_before": 0,
      "travel_employee_ids": [],
      "travel_tickets": [],
      "hotel_name": "",
      "hotel_employee_ids": [],
      "hotel_cost": 0,
      "local_travel_entries": [],
      "local_travel_proofs": [],
      "gifting_entries": [],
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="eventresponse"></a>
### EventResponse

```json
{
  "type": "exhibition",
  "name": "Example name",
  "location": "string",
  "start_date": "2026-01-31",
  "end_date": "2026-01-31",
  "budget": 0,
  "selected_employee_ids": [],
  "id": 1,
  "domain_id": 1,
  "status": "active",
  "total_spent": 0,
  "space_booking_vendor": "",
  "space_booking_amount": 0,
  "space_booking_paid_amount": 0,
  "space_booking_pi_sent": false,
  "space_booking_payment_status": "pending",
  "space_booking_installments": [],
  "stall_vendors": [],
  "stall_selected_vendor_id": 1,
  "stall_po_created": false,
  "stall_design_files": [],
  "banner_design_source": "own",
  "banner_design_files": [],
  "table_booking_venue": "",
  "table_booking_count": 0,
  "table_booking_cost_per_table": 0,
  "table_booking_total_cost": 0,
  "travel_days_before": 0,
  "travel_employee_ids": [],
  "travel_tickets": [],
  "hotel_name": "",
  "hotel_employee_ids": [],
  "hotel_cost": 0,
  "local_travel_entries": [],
  "local_travel_proofs": [],
  "gifting_entries": [],
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="eventuploadresponse"></a>
### EventUploadResponse

```json
{
  "id": 1,
  "file_name": "Example name",
  "file_url": "https://example.com"
}
```
