<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Orders API

22 endpoint(s). Base URL: `${VITE_API_BASE_URL}` (dev: `http://localhost:8003`).

Every request needs `Authorization: Bearer <JWT>` (the token from HRMS login) unless noted otherwise. Response shapes are in [Models](#models) at the bottom. See [README.md](./README.md) for conventions.

---

<a id="get-api-orders"></a>
## `GET /api/orders/`

**Get Orders**

List orders (same permission as leads).

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `page` | integer | no | (default: `1`) |
| `page_size` | integer | no | (default: `10`) |
| `status_id` | integer | no |  |
| `assigned_to` | integer | no |  |
| `lead_id` | integer | no |  |

**Response** `200` — [`PaginatedResponse<OrderResponse>`](#paginatedresponse-orderresponse)

---

<a id="post-api-orders"></a>
## `POST /api/orders/`

**Create Order**

Create an order (typically from a won lead). Lead must exist and be accessible.

**Permission:** `marketing.create_lead`

**Path parameters:** _none_

**Request body** (`OrderCreate`):

```json
{
  "lead_id": 1,
  "status_id": 1,
  "domain_id": 1,
  "region_id": 1,
  "order_value": 100000,
  "expected_delivery_at": "2026-01-31T09:30:00Z",
  "notes": "Free-text notes",
  "series_code": "string",
  "series": "string",
  "assigned_to_employee_id": 1
}
```

**Response** `201` — [`OrderResponse`](#orderresponse)

---

<a id="get-api-orders-status-groups"></a>
## `GET /api/orders/status-groups/`

**List Order Status Groups**

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `is_active` | boolean | no |  |

**Response** `200`:

```json
[
  {
    "code": "string",
    "label": "string",
    "expected_duration_days": 2,
    "display_order": 0,
    "is_active": true,
    "hex_color": "string",
    "id": 1,
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-orders-status-groups"></a>
## `POST /api/orders/status-groups/`

**Create Order Status Group**

**Permission:** `marketing.create_lead`

**Path parameters:** _none_

**Request body** (`OrderStatusGroupCreate`):

```json
{
  "code": "string",
  "label": "string",
  "expected_duration_days": 2,
  "display_order": 0,
  "is_active": true,
  "hex_color": "string"
}
```

**Response** `201` — [`OrderStatusGroupResponse`](#orderstatusgroupresponse)

---

<a id="get-api-orders-status-groups-group-id"></a>
## `GET /api/orders/status-groups/{group_id}`

**Get Order Status Group**

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `group_id` | integer | yes |  |

**Response** `200` — [`OrderStatusGroupResponse`](#orderstatusgroupresponse)

---

<a id="put-api-orders-status-groups-group-id"></a>
## `PUT /api/orders/status-groups/{group_id}`

**Update Order Status Group**

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `group_id` | integer | yes |  |

**Request body** (`OrderStatusGroupUpdate`):

```json
{
  "code": "string",
  "label": "string",
  "expected_duration_days": 2,
  "display_order": 0,
  "is_active": false,
  "hex_color": "string"
}
```

**Response** `200` — [`OrderStatusGroupResponse`](#orderstatusgroupresponse)

---

<a id="delete-api-orders-status-groups-group-id"></a>
## `DELETE /api/orders/status-groups/{group_id}`

**Delete Order Status Group**

**Permission:** `marketing.delete_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `group_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-orders-statuses"></a>
## `GET /api/orders/statuses/`

**List Order Statuses**

**Permission:** `marketing.view_lead`

**Path parameters:** _none_

**Query parameters:**

| name | type | required | description |
|---|---|---|---|
| `is_active` | boolean | no |  |

**Response** `200`:

```json
[
  {
    "code": "string",
    "label": "string",
    "group_id": 1,
    "display_order": 0,
    "is_active": true,
    "is_final": false,
    "attachment_required_on_kanban_change": false,
    "hex_color": "string",
    "id": 1,
    "group": {
      "code": "string",
      "label": "string",
      "expected_duration_days": 2,
      "display_order": 0,
      "is_active": true,
      "hex_color": "string",
      "id": 1,
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="post-api-orders-statuses"></a>
## `POST /api/orders/statuses/`

**Create Order Status**

**Permission:** `marketing.create_lead`

**Path parameters:** _none_

**Request body** (`OrderStatusOptionCreate`):

```json
{
  "code": "string",
  "label": "string",
  "group_id": 1,
  "display_order": 0,
  "is_active": true,
  "is_final": false,
  "attachment_required_on_kanban_change": false,
  "hex_color": "string"
}
```

**Response** `201` — [`OrderStatusOptionResponse`](#orderstatusoptionresponse)

---

<a id="get-api-orders-statuses-status-id"></a>
## `GET /api/orders/statuses/{status_id}`

**Get Order Status**

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `status_id` | integer | yes |  |

**Response** `200` — [`OrderStatusOptionResponse`](#orderstatusoptionresponse)

---

<a id="put-api-orders-statuses-status-id"></a>
## `PUT /api/orders/statuses/{status_id}`

**Update Order Status**

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `status_id` | integer | yes |  |

**Request body** (`OrderStatusOptionUpdate`):

```json
{
  "code": "string",
  "label": "string",
  "group_id": 1,
  "display_order": 0,
  "is_active": false,
  "is_final": false,
  "attachment_required_on_kanban_change": false,
  "hex_color": "string"
}
```

**Response** `200` — [`OrderStatusOptionResponse`](#orderstatusoptionresponse)

---

<a id="delete-api-orders-statuses-status-id"></a>
## `DELETE /api/orders/statuses/{status_id}`

**Delete Order Status**

**Permission:** `marketing.delete_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `status_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-orders-order-id"></a>
## `GET /api/orders/{order_id}`

**Get Order**

Get one order by ID.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |

**Response** `200` — [`OrderResponse`](#orderresponse)

---

<a id="put-api-orders-order-id"></a>
## `PUT /api/orders/{order_id}`

**Update Order**

Update an order.

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |

**Request body** (`OrderUpdate`):

```json
{
  "status_id": 1,
  "region_id": 1,
  "order_value": 100000,
  "expected_delivery_at": "2026-01-31T09:30:00Z",
  "notes": "Free-text notes",
  "assigned_to_employee_id": 1,
  "status_change_reason": "active"
}
```

**Response** `200` — [`OrderResponse`](#orderresponse)

---

<a id="delete-api-orders-order-id"></a>
## `DELETE /api/orders/{order_id}`

**Delete Order**

Delete an order (fails if it has activities).

**Permission:** `marketing.delete_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-orders-order-id-activities"></a>
## `GET /api/orders/{order_id}/activities/`

**List Order Activities**

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |

**Response** `200`:

```json
[
  {
    "activity_type": "string",
    "title": "string",
    "description": "Free-text notes",
    "activity_date": "string",
    "contact_person_title": "string",
    "contact_person_name": "Example name",
    "contact_person_email": "person@example.com",
    "contact_person_phone": "+91 90000 00000",
    "from_status_id": 1,
    "to_status_id": 1,
    "id": 1,
    "order_id": 1,
    "inquiry_number": 0,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_by_name": "Example name",
    "created_by_email": "person@example.com",
    "created_at": "2026-01-31T09:30:00Z",
    "from_status_name": "Example name",
    "to_status_name": "Example name",
    "attachments": []
  }
]
```

---

<a id="post-api-orders-order-id-activities"></a>
## `POST /api/orders/{order_id}/activities/`

**Create Order Activity**

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |

**Request body** (`OrderActivityCreate`):

```json
{
  "activity_type": "string",
  "title": "string",
  "description": "Free-text notes",
  "activity_date": "string",
  "contact_person_title": "string",
  "contact_person_name": "Example name",
  "contact_person_email": "person@example.com",
  "contact_person_phone": "+91 90000 00000",
  "from_status_id": 1,
  "to_status_id": 1,
  "order_id": 1
}
```

**Response** `201` — [`OrderActivityResponse`](#orderactivityresponse)

---

<a id="put-api-orders-order-id-activities-activity-id"></a>
## `PUT /api/orders/{order_id}/activities/{activity_id}`

**Update Order Activity**

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |
| `activity_id` | integer | yes |  |

**Request body** (`OrderActivityUpdate`):

```json
{
  "activity_type": "string",
  "title": "string",
  "description": "Free-text notes",
  "activity_date": "string",
  "contact_person_name": "Example name",
  "contact_person_email": "person@example.com",
  "contact_person_phone": "+91 90000 00000",
  "from_status_id": 1,
  "to_status_id": 1
}
```

**Response** `200` — [`OrderActivityResponse`](#orderactivityresponse)

---

<a id="delete-api-orders-order-id-activities-activity-id"></a>
## `DELETE /api/orders/{order_id}/activities/{activity_id}`

**Delete Order Activity**

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |
| `activity_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="post-api-orders-order-id-activities-activity-id-attachments"></a>
## `POST /api/orders/{order_id}/activities/{activity_id}/attachments`

**Add Order Activity Attachments**

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |
| `activity_id` | integer | yes |  |

**Request body** (`Body_add_order_activity_attachments_api_orders__order_id__activities__activity_id__attachments_post`):

```json
{
  "files": [
    "string"
  ]
}
```

**Response** `201`:

```json
[
  {
    "id": 1,
    "order_activity_id": 1,
    "file_name": "Example name",
    "file_path": "string",
    "is_quotation": false,
    "quotation_number": "string",
    "title": "string",
    "file_size": 20,
    "content_type": "string",
    "created_at": "2026-01-31T09:30:00Z"
  }
]
```

---

<a id="delete-api-orders-order-id-activities-activity-id-attachments-attachment-id"></a>
## `DELETE /api/orders/{order_id}/activities/{activity_id}/attachments/{attachment_id}`

**Delete Order Activity Attachment**

Delete an order activity attachment. Only the activity creator can delete.

**Permission:** `marketing.edit_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |
| `activity_id` | integer | yes |  |
| `attachment_id` | integer | yes |  |

**Response** `204` — _no body._

---

<a id="get-api-orders-order-id-activities-activity-id-attachments-attachment-id-download"></a>
## `GET /api/orders/{order_id}/activities/{activity_id}/attachments/{attachment_id}/download`

**Download Order Activity Attachment**

Download an order activity attachment file.

**Permission:** `marketing.view_lead`

**Path parameters:**

| name | type | required | description |
|---|---|---|---|
| `order_id` | integer | yes |  |
| `activity_id` | integer | yes |  |
| `attachment_id` | integer | yes |  |

**Response** `200`:

```json
"string"
```

---

## Models

Example response bodies (synthetic — shapes, not real data; nesting capped at 4 levels).

<a id="paginatedresponse-orderresponse"></a>
### PaginatedResponse<OrderResponse>

```json
{
  "items": [
    {
      "lead_id": 1,
      "status_id": 1,
      "domain_id": 1,
      "region_id": 1,
      "order_value": "string",
      "expected_delivery_at": "2026-01-31T09:30:00Z",
      "notes": "Free-text notes",
      "series_code": "string",
      "series": "string",
      "assigned_to_employee_id": 1,
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "assigned_to_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "region": {
        "domain_id": 1,
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "sort_order": 0,
        "head_employee_id": 1,
        "head_username": "Example name",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }"
      },
      "status_option": {
        "code": "string",
        "label": "string",
        "group_id": 1,
        "display_order": 0,
        "is_active": true,
        "is_final": false,
        "attachment_required_on_kanban_change": false,
        "hex_color": "string",
        "id": 1,
        "group": "{ … OrderStatusGroupResponse }",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "status": "active",
      "lead": {
        "contact_id": 1,
        "customer_id": 1,
        "plant_id": 1,
        "domain_id": 1,
        "region_id": 1,
        "status_id": 1,
        "lead_type_id": 1,
        "lead_through_id": 1,
        "through_contact_id": 1,
        "referred_by_customer_id": 1,
        "potential_value": "string",
        "closed_value": "string",
        "closed_at": "2026-01-31T09:30:00Z",
        "notes": "Free-text notes",
        "expected_closing_date": "string",
        "series_code": "string",
        "series": "string",
        "quote_series_code": "string",
        "quote_number": "string",
        "next_follow_up_at": "2026-01-31T09:30:00Z",
        "follow_up_reminder_type": "string",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "on_behalf_of_by_employee_id": 1,
        "on_behalf_of_by_username": "Example name",
        "assigned_to_employee_id": 1,
        "assigned_to_username": "Example name",
        "referred_by_employee_id": 1,
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }",
        "region": "{ … RegionResponse }",
        "contact": "{ … ContactResponse }",
        "customer": "{ … CustomerResponse }",
        "plant": "{ … PlantResponse }",
        "status_option": "{ … LeadStatusOptionResponse }",
        "status": "active",
        "lead_type_option": "{ … LeadTypeOptionResponse }",
        "lead_through_option": "{ … LeadThroughOptionResponse }",
        "through_contact": "{ … ContactResponse }",
        "referred_by_customer": "{ … CustomerResponse }",
        "last_activity_date": "string",
        "lost_reason": "string",
        "quote_value": 100000,
        "quotation_count": 20,
        "auto_follow_up_at": "2026-01-31T09:30:00Z"
      },
      "last_activity_date": "string"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 1,
  "total_pages": 1
}
```

<a id="orderresponse"></a>
### OrderResponse

```json
{
  "lead_id": 1,
  "status_id": 1,
  "domain_id": 1,
  "region_id": 1,
  "order_value": "string",
  "expected_delivery_at": "2026-01-31T09:30:00Z",
  "notes": "Free-text notes",
  "series_code": "string",
  "series": "string",
  "assigned_to_employee_id": 1,
  "id": 1,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "assigned_to_username": "Example name",
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z",
  "domain": {
    "name": "Example name",
    "code": "string",
    "description": "Free-text notes",
    "is_active": true,
    "is_export": false,
    "head_employee_id": 1,
    "head_username": "Example name",
    "head_email": "person@example.com",
    "coordinator_employee_id": 1,
    "coordinator_username": "Example name",
    "coordinator_email": "person@example.com",
    "id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  },
  "region": {
    "domain_id": 1,
    "name": "Example name",
    "code": "string",
    "description": "Free-text notes",
    "sort_order": 0,
    "head_employee_id": 1,
    "head_username": "Example name",
    "coordinator_employee_id": 1,
    "coordinator_username": "Example name",
    "coordinator_email": "person@example.com",
    "is_active": true,
    "id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z",
    "domain": {
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "is_active": true,
      "is_export": false,
      "head_employee_id": 1,
      "head_username": "Example name",
      "head_email": "person@example.com",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    }
  },
  "status_option": {
    "code": "string",
    "label": "string",
    "group_id": 1,
    "display_order": 0,
    "is_active": true,
    "is_final": false,
    "attachment_required_on_kanban_change": false,
    "hex_color": "string",
    "id": 1,
    "group": {
      "code": "string",
      "label": "string",
      "expected_duration_days": 2,
      "display_order": 0,
      "is_active": true,
      "hex_color": "string",
      "id": 1,
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  },
  "status": "active",
  "lead": {
    "contact_id": 1,
    "customer_id": 1,
    "plant_id": 1,
    "domain_id": 1,
    "region_id": 1,
    "status_id": 1,
    "lead_type_id": 1,
    "lead_through_id": 1,
    "through_contact_id": 1,
    "referred_by_customer_id": 1,
    "potential_value": "string",
    "closed_value": "string",
    "closed_at": "2026-01-31T09:30:00Z",
    "notes": "Free-text notes",
    "expected_closing_date": "string",
    "series_code": "string",
    "series": "string",
    "quote_series_code": "string",
    "quote_number": "string",
    "next_follow_up_at": "2026-01-31T09:30:00Z",
    "follow_up_reminder_type": "string",
    "id": 1,
    "created_by_employee_id": 1,
    "created_by_username": "Example name",
    "on_behalf_of_by_employee_id": 1,
    "on_behalf_of_by_username": "Example name",
    "assigned_to_employee_id": 1,
    "assigned_to_username": "Example name",
    "referred_by_employee_id": 1,
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z",
    "domain": {
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "is_active": true,
      "is_export": false,
      "head_employee_id": 1,
      "head_username": "Example name",
      "head_email": "person@example.com",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "region": {
      "domain_id": 1,
      "name": "Example name",
      "code": "string",
      "description": "Free-text notes",
      "sort_order": 0,
      "head_employee_id": 1,
      "head_username": "Example name",
      "coordinator_employee_id": 1,
      "coordinator_username": "Example name",
      "coordinator_email": "person@example.com",
      "is_active": true,
      "id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      }
    },
    "contact": {
      "title": "string",
      "first_name": "Example name",
      "last_name": "Example name",
      "contact_person_name": "Example name",
      "contact_email": "person@example.com",
      "contact_phone": "+91 90000 00000",
      "contact_job_title": "string",
      "domain_id": 1,
      "region_id": 1,
      "organization_id": 1,
      "plant_id": 1,
      "notes": "Free-text notes",
      "source": "string",
      "series_code": "string",
      "series": "string",
      "id": 1,
      "is_active": false,
      "is_converted": false,
      "converted_to_customer_id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "assigned_to_employee_id": 1,
      "assigned_to_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "region": {
        "domain_id": 1,
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "sort_order": 0,
        "head_employee_id": 1,
        "head_username": "Example name",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }"
      },
      "organization": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "website": "https://example.com",
        "industry": "string",
        "organization_size": "string",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "plant": {
        "plant_name": "Example name",
        "plant_code": "string",
        "domain_id": 1,
        "region_id": 1,
        "address_line1": "string",
        "address_line2": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postal_code": "string",
        "notes": "Free-text notes",
        "id": 1,
        "organization_id": 1,
        "contact_id": 1,
        "customer_id": 1,
        "is_active": false,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      }
    },
    "customer": {
      "company_name": "Example name",
      "tax_id": "string",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "notes": "Free-text notes",
      "series_code": "string",
      "series": "string",
      "id": 1,
      "is_active": false,
      "customer_since": "string",
      "converted_from_contact_id": 1,
      "organization_id": 1,
      "plant_id": 1,
      "primary_contact_contact_id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "account_manager_employee_id": 1,
      "account_manager_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "region": {
        "domain_id": 1,
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "sort_order": 0,
        "head_employee_id": 1,
        "head_username": "Example name",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }"
      },
      "organization": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "website": "https://example.com",
        "industry": "string",
        "organization_size": "string",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "plants": [
        "{ … PlantResponse }"
      ],
      "primary_contact_contact": {
        "title": "string",
        "first_name": "Example name",
        "last_name": "Example name",
        "contact_person_name": "Example name",
        "contact_email": "person@example.com",
        "contact_phone": "+91 90000 00000",
        "contact_job_title": "string",
        "domain_id": 1,
        "region_id": 1,
        "organization_id": 1,
        "plant_id": 1,
        "notes": "Free-text notes",
        "source": "string",
        "series_code": "string",
        "series": "string",
        "id": 1,
        "is_active": false,
        "is_converted": false,
        "converted_to_customer_id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "assigned_to_employee_id": 1,
        "assigned_to_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }",
        "region": "{ … RegionResponse }",
        "organization": "{ … OrganizationResponse }",
        "plant": "{ … PlantResponse }"
      }
    },
    "plant": {
      "plant_name": "Example name",
      "plant_code": "string",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "notes": "Free-text notes",
      "id": 1,
      "organization_id": 1,
      "contact_id": 1,
      "customer_id": 1,
      "is_active": false,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "status_option": {
      "code": "string",
      "label": "string",
      "group_id": 1,
      "stage": "string",
      "display_order": 0,
      "is_active": true,
      "is_final": false,
      "is_lost": false,
      "is_hot": false,
      "hex_color": "string",
      "set_when_quotation_added": false,
      "set_when_quote_number_generated": false,
      "attachment_required_on_kanban_change": false,
      "id": 1,
      "group": {
        "code": "string",
        "label": "string",
        "expected_duration_days": 2,
        "follow_up_interval_days": 2,
        "display_order": 0,
        "is_active": true,
        "hex_color": "string",
        "id": 1,
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "status": "active",
    "lead_type_option": {
      "code": "string",
      "label": "string",
      "display_order": 0,
      "is_active": true,
      "id": 1,
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "lead_through_option": {
      "code": "string",
      "label": "string",
      "display_order": 0,
      "is_active": true,
      "id": 1,
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z"
    },
    "through_contact": {
      "title": "string",
      "first_name": "Example name",
      "last_name": "Example name",
      "contact_person_name": "Example name",
      "contact_email": "person@example.com",
      "contact_phone": "+91 90000 00000",
      "contact_job_title": "string",
      "domain_id": 1,
      "region_id": 1,
      "organization_id": 1,
      "plant_id": 1,
      "notes": "Free-text notes",
      "source": "string",
      "series_code": "string",
      "series": "string",
      "id": 1,
      "is_active": false,
      "is_converted": false,
      "converted_to_customer_id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "assigned_to_employee_id": 1,
      "assigned_to_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "region": {
        "domain_id": 1,
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "sort_order": 0,
        "head_employee_id": 1,
        "head_username": "Example name",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }"
      },
      "organization": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "website": "https://example.com",
        "industry": "string",
        "organization_size": "string",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "plant": {
        "plant_name": "Example name",
        "plant_code": "string",
        "domain_id": 1,
        "region_id": 1,
        "address_line1": "string",
        "address_line2": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postal_code": "string",
        "notes": "Free-text notes",
        "id": 1,
        "organization_id": 1,
        "contact_id": 1,
        "customer_id": 1,
        "is_active": false,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      }
    },
    "referred_by_customer": {
      "company_name": "Example name",
      "tax_id": "string",
      "domain_id": 1,
      "region_id": 1,
      "address_line1": "string",
      "address_line2": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "notes": "Free-text notes",
      "series_code": "string",
      "series": "string",
      "id": 1,
      "is_active": false,
      "customer_since": "string",
      "converted_from_contact_id": 1,
      "organization_id": 1,
      "plant_id": 1,
      "primary_contact_contact_id": 1,
      "created_by_employee_id": 1,
      "created_by_username": "Example name",
      "account_manager_employee_id": 1,
      "account_manager_username": "Example name",
      "created_at": "2026-01-31T09:30:00Z",
      "updated_at": "2026-01-31T09:30:00Z",
      "domain": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "is_active": true,
        "is_export": false,
        "head_employee_id": 1,
        "head_username": "Example name",
        "head_email": "person@example.com",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "region": {
        "domain_id": 1,
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "sort_order": 0,
        "head_employee_id": 1,
        "head_username": "Example name",
        "coordinator_employee_id": 1,
        "coordinator_username": "Example name",
        "coordinator_email": "person@example.com",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }"
      },
      "organization": {
        "name": "Example name",
        "code": "string",
        "description": "Free-text notes",
        "website": "https://example.com",
        "industry": "string",
        "organization_size": "string",
        "is_active": true,
        "id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z"
      },
      "plants": [
        "{ … PlantResponse }"
      ],
      "primary_contact_contact": {
        "title": "string",
        "first_name": "Example name",
        "last_name": "Example name",
        "contact_person_name": "Example name",
        "contact_email": "person@example.com",
        "contact_phone": "+91 90000 00000",
        "contact_job_title": "string",
        "domain_id": 1,
        "region_id": 1,
        "organization_id": 1,
        "plant_id": 1,
        "notes": "Free-text notes",
        "source": "string",
        "series_code": "string",
        "series": "string",
        "id": 1,
        "is_active": false,
        "is_converted": false,
        "converted_to_customer_id": 1,
        "created_by_employee_id": 1,
        "created_by_username": "Example name",
        "assigned_to_employee_id": 1,
        "assigned_to_username": "Example name",
        "created_at": "2026-01-31T09:30:00Z",
        "updated_at": "2026-01-31T09:30:00Z",
        "domain": "{ … DomainResponse }",
        "region": "{ … RegionResponse }",
        "organization": "{ … OrganizationResponse }",
        "plant": "{ … PlantResponse }"
      }
    },
    "last_activity_date": "string",
    "lost_reason": "string",
    "quote_value": 100000,
    "quotation_count": 20,
    "auto_follow_up_at": "2026-01-31T09:30:00Z"
  },
  "last_activity_date": "string"
}
```

<a id="orderstatusgroupresponse"></a>
### OrderStatusGroupResponse

```json
{
  "code": "string",
  "label": "string",
  "expected_duration_days": 2,
  "display_order": 0,
  "is_active": true,
  "hex_color": "string",
  "id": 1,
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="orderstatusoptionresponse"></a>
### OrderStatusOptionResponse

```json
{
  "code": "string",
  "label": "string",
  "group_id": 1,
  "display_order": 0,
  "is_active": true,
  "is_final": false,
  "attachment_required_on_kanban_change": false,
  "hex_color": "string",
  "id": 1,
  "group": {
    "code": "string",
    "label": "string",
    "expected_duration_days": 2,
    "display_order": 0,
    "is_active": true,
    "hex_color": "string",
    "id": 1,
    "created_at": "2026-01-31T09:30:00Z",
    "updated_at": "2026-01-31T09:30:00Z"
  },
  "created_at": "2026-01-31T09:30:00Z",
  "updated_at": "2026-01-31T09:30:00Z"
}
```

<a id="orderactivityresponse"></a>
### OrderActivityResponse

```json
{
  "activity_type": "string",
  "title": "string",
  "description": "Free-text notes",
  "activity_date": "string",
  "contact_person_title": "string",
  "contact_person_name": "Example name",
  "contact_person_email": "person@example.com",
  "contact_person_phone": "+91 90000 00000",
  "from_status_id": 1,
  "to_status_id": 1,
  "id": 1,
  "order_id": 1,
  "inquiry_number": 0,
  "created_by_employee_id": 1,
  "created_by_username": "Example name",
  "created_by_name": "Example name",
  "created_by_email": "person@example.com",
  "created_at": "2026-01-31T09:30:00Z",
  "from_status_name": "Example name",
  "to_status_name": "Example name",
  "attachments": []
}
```
