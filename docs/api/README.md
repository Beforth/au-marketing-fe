<!-- GENERATED FILE — do not edit by hand. Regenerate with `python3 docs/api/generate_api_docs.py`. -->

# Marketing API reference

Auto-generated from the live OpenAPI schema (API version **1.2.10**) — **206 endpoints** across **29 resource groups**.

## What this is

A flat, example-first reference to every HTTP endpoint the Marketing API (FastAPI, default `:8003`) exposes. Written so a person *or* an AI assistant can pick an endpoint, see exactly what to send, and see exactly what comes back. The interactive Swagger UI at `http://localhost:8003/docs` is the same data in a different form.

## Conventions

- **Base URL** — `${VITE_API_BASE_URL}` from the frontend `.env` (dev default `http://localhost:8003`). Paths below already include the `/api` prefix.
- **Auth** — obtain a JWT by logging in against **HRMS** (not this API), then send it on every call as `Authorization: Bearer <JWT>`. This API re-checks the permission for the route against HRMS on each request (short server-side cache).
- **Permission** — the `marketing.*` RBAC code(s) the endpoint requires, recovered from the router source. `or` means any one suffices; `and` means all are needed; _no explicit check_ means the route has no `require_permission` (public, or only needs a valid token).
- **Examples** — request/response bodies are **synthetic**, generated from the schema types (enums show their first allowed value, ids show `1`, money shows `100000`, nesting is capped at 4 levels). They show *shape*, not real data.
- **Freshness** — this snapshot is API **v1.2.10**. Anything shipped after that deploy (new fields, new endpoints) shows up only once someone refreshes `openapi.json` and regenerates.
- **IDs** — `created_by_employee_id` columns actually hold the Django auth *user* id, not the HRMS employee id (a known historical quirk — see `CLAUDE.md`).

## How to regenerate

```bash
curl -s http://localhost:8003/openapi.json -o docs/api/openapi.json
python3 docs/api/generate_api_docs.py
```
Everything in `docs/api/` except `generate_api_docs.py` and `openapi.json` is generated. Edit the script, not the output.

## Resource groups

| Group | Endpoints | File |
|---|---|---|
| Audit Logs | 1 | [audit-logs.md](./audit-logs.md) |
| Authentication | 9 | [authentication.md](./authentication.md) |
| Campaigns | 5 | [campaigns.md](./campaigns.md) |
| Contacts | 7 | [contacts.md](./contacts.md) |
| Customers | 6 | [customers.md](./customers.md) |
| Dashboard | 10 | [dashboard.md](./dashboard.md) |
| Domains | 5 | [domains.md](./domains.md) |
| Employees | 7 | [employees.md](./employees.md) |
| Events | 9 | [events.md](./events.md) |
| Exhibitions | 1 | [exhibitions.md](./exhibitions.md) |
| Leads | 33 | [leads.md](./leads.md) |
| Marketing Settings | 2 | [marketing-settings.md](./marketing-settings.md) |
| Notifications | 8 | [notifications.md](./notifications.md) |
| Orders | 22 | [orders.md](./orders.md) |
| Organizations | 9 | [organizations.md](./organizations.md) |
| Other | 2 | [other.md](./other.md) |
| Plants | 1 | [plants.md](./plants.md) |
| Presence | 2 | [presence.md](./presence.md) |
| Quotations | 3 | [quotations.md](./quotations.md) |
| Regions | 12 | [regions.md](./regions.md) |
| Report Templates | 9 | [report-templates.md](./report-templates.md) |
| Reports | 7 | [reports.md](./reports.md) |
| Saved Dashboards | 11 | [saved-dashboards.md](./saved-dashboards.md) |
| Schema | 1 | [schema.md](./schema.md) |
| Series | 7 | [series.md](./series.md) |
| Tasks | 4 | [tasks.md](./tasks.md) |
| Tickets | 3 | [tickets.md](./tickets.md) |
| Visiting Card Contacts | 6 | [visiting-card-contacts.md](./visiting-card-contacts.md) |
| Whats New | 4 | [whats-new.md](./whats-new.md) |

## Every endpoint

### Audit Logs

- `GET /api/audit-logs/` — Get Audit Logs  ·  [details](./audit-logs.md#get-api-audit-logs)

### Authentication

- `DELETE /api/auth/email` — Disconnect Email  ·  [details](./authentication.md#delete-api-auth-email)
- `GET /api/auth/email-connection` — Get Email Connection  ·  [details](./authentication.md#get-api-auth-email-connection)
- `GET /api/auth/email/authorize-url` — Get Email Authorize Url  ·  [details](./authentication.md#get-api-auth-email-authorize-url)
- `GET /api/auth/email/callback` — Email Callback  ·  [details](./authentication.md#get-api-auth-email-callback)
- `POST /api/auth/login` — Login  ·  [details](./authentication.md#post-api-auth-login)
- `POST /api/auth/logout` — Logout  ·  [details](./authentication.md#post-api-auth-logout)
- `GET /api/auth/me` — Get Profile  ·  [details](./authentication.md#get-api-auth-me)
- `POST /api/auth/refresh-permissions` — Refresh Permissions  ·  [details](./authentication.md#post-api-auth-refresh-permissions)
- `GET /api/auth/scope` — Get Marketing Scope  ·  [details](./authentication.md#get-api-auth-scope)

### Campaigns

- `GET /api/campaigns/` — Get Campaigns  ·  [details](./campaigns.md#get-api-campaigns)
- `POST /api/campaigns/` — Create Campaign  ·  [details](./campaigns.md#post-api-campaigns)
- `GET /api/campaigns/{campaign_id}` — Get Campaign  ·  [details](./campaigns.md#get-api-campaigns-campaign-id)
- `PUT /api/campaigns/{campaign_id}` — Update Campaign  ·  [details](./campaigns.md#put-api-campaigns-campaign-id)
- `DELETE /api/campaigns/{campaign_id}` — Delete Campaign  ·  [details](./campaigns.md#delete-api-campaigns-campaign-id)

### Contacts

- `GET /api/contacts/` — Get Contacts  ·  [details](./contacts.md#get-api-contacts)
- `POST /api/contacts/` — Create Contact  ·  [details](./contacts.md#post-api-contacts)
- `GET /api/contacts/search` — Search Contacts  ·  [details](./contacts.md#get-api-contacts-search)
- `GET /api/contacts/{contact_id}` — Get Contact  ·  [details](./contacts.md#get-api-contacts-contact-id)
- `PUT /api/contacts/{contact_id}` — Update Contact  ·  [details](./contacts.md#put-api-contacts-contact-id)
- `DELETE /api/contacts/{contact_id}` — Delete Contact  ·  [details](./contacts.md#delete-api-contacts-contact-id)
- `POST /api/contacts/{contact_id}/convert-to-customer` — Convert Contact To Customer  ·  [details](./contacts.md#post-api-contacts-contact-id-convert-to-customer)

### Customers

- `GET /api/customers/` — Get Customers  ·  [details](./customers.md#get-api-customers)
- `POST /api/customers/` — Create Customer  ·  [details](./customers.md#post-api-customers)
- `GET /api/customers/search` — Search Customers  ·  [details](./customers.md#get-api-customers-search)
- `GET /api/customers/{customer_id}` — Get Customer  ·  [details](./customers.md#get-api-customers-customer-id)
- `PUT /api/customers/{customer_id}` — Update Customer  ·  [details](./customers.md#put-api-customers-customer-id)
- `DELETE /api/customers/{customer_id}` — Delete Customer  ·  [details](./customers.md#delete-api-customers-customer-id)

### Dashboard

- `GET /api/dashboard/domain-target-summary` — Get Domain Target Summary  ·  [details](./dashboard.md#get-api-dashboard-domain-target-summary)
- `GET /api/dashboard/head-summary` — Get Head Dashboard Summary  ·  [details](./dashboard.md#get-api-dashboard-head-summary)
- `GET /api/dashboard/performer-of-month` — Get Performer Of Month  ·  [details](./dashboard.md#get-api-dashboard-performer-of-month)
- `GET /api/dashboard/quotation-stats` — Get Quotation Stats  ·  [details](./dashboard.md#get-api-dashboard-quotation-stats)
- `GET /api/dashboard/role-summary` — Get Role Dashboard Summary  ·  [details](./dashboard.md#get-api-dashboard-role-summary)
- `GET /api/dashboard/scope-target-stats` — Get Scope Target Stats  ·  [details](./dashboard.md#get-api-dashboard-scope-target-stats)
- `PUT /api/dashboard/target` — Set Employee Target  ·  [details](./dashboard.md#put-api-dashboard-target)
- `GET /api/dashboard/target-stats` — Get Target Stats  ·  [details](./dashboard.md#get-api-dashboard-target-stats)
- `PUT /api/dashboard/target/domain` — Set Domain Target  ·  [details](./dashboard.md#put-api-dashboard-target-domain)
- `PUT /api/dashboard/target/region` — Set Region Target  ·  [details](./dashboard.md#put-api-dashboard-target-region)

### Domains

- `GET /api/domains/` — Get Domains  ·  [details](./domains.md#get-api-domains)
- `POST /api/domains/` — Create Domain  ·  [details](./domains.md#post-api-domains)
- `GET /api/domains/{domain_id}` — Get Domain  ·  [details](./domains.md#get-api-domains-domain-id)
- `PUT /api/domains/{domain_id}` — Update Domain  ·  [details](./domains.md#put-api-domains-domain-id)
- `DELETE /api/domains/{domain_id}` — Delete Domain  ·  [details](./domains.md#delete-api-domains-domain-id)

### Employees

- `GET /api/employees/` — Get Employees  ·  [details](./employees.md#get-api-employees)
- `GET /api/employees/departments/` — Get Departments  ·  [details](./employees.md#get-api-employees-departments)
- `GET /api/employees/designations/` — Get Designations  ·  [details](./employees.md#get-api-employees-designations)
- `GET /api/employees/local/` — Get Local Employees  ·  [details](./employees.md#get-api-employees-local)
- `GET /api/employees/local/{employee_id}` — Get Local Employee  ·  [details](./employees.md#get-api-employees-local-employee-id)
- `PUT /api/employees/local/{employee_id}` — Update Local Employee  ·  [details](./employees.md#put-api-employees-local-employee-id)
- `POST /api/employees/sync` — Sync Employees From Hrms  ·  [details](./employees.md#post-api-employees-sync)

### Events

- `GET /api/events/` — Get Events  ·  [details](./events.md#get-api-events)
- `POST /api/events/` — Create Event  ·  [details](./events.md#post-api-events)
- `GET /api/events/{event_id}` — Get Event  ·  [details](./events.md#get-api-events-event-id)
- `PUT /api/events/{event_id}` — Update Event  ·  [details](./events.md#put-api-events-event-id)
- `DELETE /api/events/{event_id}` — Delete Event  ·  [details](./events.md#delete-api-events-event-id)
- `POST /api/events/{event_id}/end` — End Event  ·  [details](./events.md#post-api-events-event-id-end)
- `POST /api/events/{event_id}/files` — Upload Event File  ·  [details](./events.md#post-api-events-event-id-files)
- `DELETE /api/events/{event_id}/files/{file_id}` — Delete Event File  ·  [details](./events.md#delete-api-events-event-id-files-file-id)
- `GET /api/events/{event_id}/files/{file_id}/download` — Download Event File  ·  [details](./events.md#get-api-events-event-id-files-file-id-download)

### Exhibitions

- `GET /api/exhibitions/active` — Get Active Exhibitions  ·  [details](./exhibitions.md#get-api-exhibitions-active)

### Leads

- `GET /api/leads/` — Get Leads  ·  [details](./leads.md#get-api-leads)
- `POST /api/leads/` — Create Lead  ·  [details](./leads.md#post-api-leads)
- `GET /api/leads/status-groups/` — List Lead Status Groups  ·  [details](./leads.md#get-api-leads-status-groups)
- `POST /api/leads/status-groups/` — Create Lead Status Group  ·  [details](./leads.md#post-api-leads-status-groups)
- `GET /api/leads/status-groups/{group_id}` — Get Lead Status Group  ·  [details](./leads.md#get-api-leads-status-groups-group-id)
- `PUT /api/leads/status-groups/{group_id}` — Update Lead Status Group  ·  [details](./leads.md#put-api-leads-status-groups-group-id)
- `DELETE /api/leads/status-groups/{group_id}` — Delete Lead Status Group  ·  [details](./leads.md#delete-api-leads-status-groups-group-id)
- `GET /api/leads/statuses/` — List Lead Statuses  ·  [details](./leads.md#get-api-leads-statuses)
- `POST /api/leads/statuses/` — Create Lead Status  ·  [details](./leads.md#post-api-leads-statuses)
- `GET /api/leads/statuses/{status_id}` — Get Lead Status  ·  [details](./leads.md#get-api-leads-statuses-status-id)
- `PUT /api/leads/statuses/{status_id}` — Update Lead Status  ·  [details](./leads.md#put-api-leads-statuses-status-id)
- `DELETE /api/leads/statuses/{status_id}` — Delete Lead Status  ·  [details](./leads.md#delete-api-leads-statuses-status-id)
- `GET /api/leads/through/` — List Lead Through Options  ·  [details](./leads.md#get-api-leads-through)
- `GET /api/leads/types/` — List Lead Types  ·  [details](./leads.md#get-api-leads-types)
- `POST /api/leads/types/` — Create Lead Type  ·  [details](./leads.md#post-api-leads-types)
- `GET /api/leads/types/{type_id}` — Get Lead Type  ·  [details](./leads.md#get-api-leads-types-type-id)
- `PUT /api/leads/types/{type_id}` — Update Lead Type  ·  [details](./leads.md#put-api-leads-types-type-id)
- `DELETE /api/leads/types/{type_id}` — Delete Lead Type  ·  [details](./leads.md#delete-api-leads-types-type-id)
- `GET /api/leads/{lead_id}` — Get Lead  ·  [details](./leads.md#get-api-leads-lead-id)
- `PUT /api/leads/{lead_id}` — Update Lead  ·  [details](./leads.md#put-api-leads-lead-id)
- `DELETE /api/leads/{lead_id}` — Delete Lead  ·  [details](./leads.md#delete-api-leads-lead-id)
- `GET /api/leads/{lead_id}/activities/` — List Lead Activities  ·  [details](./leads.md#get-api-leads-lead-id-activities)
- `POST /api/leads/{lead_id}/activities/` — Create Lead Activity  ·  [details](./leads.md#post-api-leads-lead-id-activities)
- `PUT /api/leads/{lead_id}/activities/{activity_id}` — Update Lead Activity  ·  [details](./leads.md#put-api-leads-lead-id-activities-activity-id)
- `DELETE /api/leads/{lead_id}/activities/{activity_id}` — Delete Lead Activity  ·  [details](./leads.md#delete-api-leads-lead-id-activities-activity-id)
- `POST /api/leads/{lead_id}/activities/{activity_id}/attachments` — Upload Activity Attachments  ·  [details](./leads.md#post-api-leads-lead-id-activities-activity-id-attachments)
- `PUT /api/leads/{lead_id}/activities/{activity_id}/attachments/{attachment_id}` — Update Activity Attachment Value  ·  [details](./leads.md#put-api-leads-lead-id-activities-activity-id-attachments-attachment-id)
- `DELETE /api/leads/{lead_id}/activities/{activity_id}/attachments/{attachment_id}` — Delete Activity Attachment  ·  [details](./leads.md#delete-api-leads-lead-id-activities-activity-id-attachments-attachment-id)
- `GET /api/leads/{lead_id}/activities/{activity_id}/attachments/{attachment_id}/download` — Download Activity Attachment  ·  [details](./leads.md#get-api-leads-lead-id-activities-activity-id-attachments-attachment-id-download)
- `POST /api/leads/{lead_id}/activities/{activity_id}/attachments/{attachment_id}/replace` — Replace Activity Attachment  ·  [details](./leads.md#post-api-leads-lead-id-activities-activity-id-attachments-attachment-id-replace)
- `POST /api/leads/{lead_id}/activities/{activity_id}/quotations` — Create Quotation Placeholders  ·  [details](./leads.md#post-api-leads-lead-id-activities-activity-id-quotations)
- `PATCH /api/leads/{lead_id}/follow-up` — Schedule Lead Follow Up  ·  [details](./leads.md#patch-api-leads-lead-id-follow-up)
- `PATCH /api/leads/{lead_id}/series` — Update Lead Series  ·  [details](./leads.md#patch-api-leads-lead-id-series)

### Marketing Settings

- `GET /api/marketing/settings` — Get Settings  ·  [details](./marketing-settings.md#get-api-marketing-settings)
- `PUT /api/marketing/settings` — Update Settings  ·  [details](./marketing-settings.md#put-api-marketing-settings)

### Notifications

- `GET /api/notifications/` — List Notifications  ·  [details](./notifications.md#get-api-notifications)
- `POST /api/notifications/devices/register` — Register Notification Device  ·  [details](./notifications.md#post-api-notifications-devices-register)
- `POST /api/notifications/devices/unregister` — Unregister Notification Device  ·  [details](./notifications.md#post-api-notifications-devices-unregister)
- `GET /api/notifications/preferences` — Get Preferences  ·  [details](./notifications.md#get-api-notifications-preferences)
- `PUT /api/notifications/preferences` — Update Preferences  ·  [details](./notifications.md#put-api-notifications-preferences)
- `PATCH /api/notifications/read-all` — Mark All Read  ·  [details](./notifications.md#patch-api-notifications-read-all)
- `GET /api/notifications/unread-count` — Unread Count  ·  [details](./notifications.md#get-api-notifications-unread-count)
- `PATCH /api/notifications/{notification_id}/read` — Mark Read  ·  [details](./notifications.md#patch-api-notifications-notification-id-read)

### Orders

- `GET /api/orders/` — Get Orders  ·  [details](./orders.md#get-api-orders)
- `POST /api/orders/` — Create Order  ·  [details](./orders.md#post-api-orders)
- `GET /api/orders/status-groups/` — List Order Status Groups  ·  [details](./orders.md#get-api-orders-status-groups)
- `POST /api/orders/status-groups/` — Create Order Status Group  ·  [details](./orders.md#post-api-orders-status-groups)
- `GET /api/orders/status-groups/{group_id}` — Get Order Status Group  ·  [details](./orders.md#get-api-orders-status-groups-group-id)
- `PUT /api/orders/status-groups/{group_id}` — Update Order Status Group  ·  [details](./orders.md#put-api-orders-status-groups-group-id)
- `DELETE /api/orders/status-groups/{group_id}` — Delete Order Status Group  ·  [details](./orders.md#delete-api-orders-status-groups-group-id)
- `GET /api/orders/statuses/` — List Order Statuses  ·  [details](./orders.md#get-api-orders-statuses)
- `POST /api/orders/statuses/` — Create Order Status  ·  [details](./orders.md#post-api-orders-statuses)
- `GET /api/orders/statuses/{status_id}` — Get Order Status  ·  [details](./orders.md#get-api-orders-statuses-status-id)
- `PUT /api/orders/statuses/{status_id}` — Update Order Status  ·  [details](./orders.md#put-api-orders-statuses-status-id)
- `DELETE /api/orders/statuses/{status_id}` — Delete Order Status  ·  [details](./orders.md#delete-api-orders-statuses-status-id)
- `GET /api/orders/{order_id}` — Get Order  ·  [details](./orders.md#get-api-orders-order-id)
- `PUT /api/orders/{order_id}` — Update Order  ·  [details](./orders.md#put-api-orders-order-id)
- `DELETE /api/orders/{order_id}` — Delete Order  ·  [details](./orders.md#delete-api-orders-order-id)
- `GET /api/orders/{order_id}/activities/` — List Order Activities  ·  [details](./orders.md#get-api-orders-order-id-activities)
- `POST /api/orders/{order_id}/activities/` — Create Order Activity  ·  [details](./orders.md#post-api-orders-order-id-activities)
- `PUT /api/orders/{order_id}/activities/{activity_id}` — Update Order Activity  ·  [details](./orders.md#put-api-orders-order-id-activities-activity-id)
- `DELETE /api/orders/{order_id}/activities/{activity_id}` — Delete Order Activity  ·  [details](./orders.md#delete-api-orders-order-id-activities-activity-id)
- `POST /api/orders/{order_id}/activities/{activity_id}/attachments` — Add Order Activity Attachments  ·  [details](./orders.md#post-api-orders-order-id-activities-activity-id-attachments)
- `DELETE /api/orders/{order_id}/activities/{activity_id}/attachments/{attachment_id}` — Delete Order Activity Attachment  ·  [details](./orders.md#delete-api-orders-order-id-activities-activity-id-attachments-attachment-id)
- `GET /api/orders/{order_id}/activities/{activity_id}/attachments/{attachment_id}/download` — Download Order Activity Attachment  ·  [details](./orders.md#get-api-orders-order-id-activities-activity-id-attachments-attachment-id-download)

### Organizations

- `GET /api/organizations/` — List Organizations  ·  [details](./organizations.md#get-api-organizations)
- `POST /api/organizations/` — Create Organization  ·  [details](./organizations.md#post-api-organizations)
- `GET /api/organizations/{organization_id}` — Get Organization  ·  [details](./organizations.md#get-api-organizations-organization-id)
- `PATCH /api/organizations/{organization_id}` — Update Organization  ·  [details](./organizations.md#patch-api-organizations-organization-id)
- `DELETE /api/organizations/{organization_id}` — Delete Organization  ·  [details](./organizations.md#delete-api-organizations-organization-id)
- `GET /api/organizations/{organization_id}/plants` — List Organization Plants  ·  [details](./organizations.md#get-api-organizations-organization-id-plants)
- `POST /api/organizations/{organization_id}/plants` — Create Organization Plant  ·  [details](./organizations.md#post-api-organizations-organization-id-plants)
- `PATCH /api/organizations/{organization_id}/plants/{plant_id}` — Update Organization Plant  ·  [details](./organizations.md#patch-api-organizations-organization-id-plants-plant-id)
- `DELETE /api/organizations/{organization_id}/plants/{plant_id}` — Delete Organization Plant  ·  [details](./organizations.md#delete-api-organizations-organization-id-plants-plant-id)

### Other

- `GET /` — Root  ·  [details](./other.md#get)
- `GET /health` — Health Check  ·  [details](./other.md#get-health)

### Plants

- `GET /api/plants/` — List Plants  ·  [details](./plants.md#get-api-plants)

### Presence

- `GET /api/presence/active` — Get Presence Active  ·  [details](./presence.md#get-api-presence-active)
- `POST /api/presence/ping` — Ping Presence  ·  [details](./presence.md#post-api-presence-ping)

### Quotations

- `GET /api/quotations/` — List Quotations  ·  [details](./quotations.md#get-api-quotations)
- `GET /api/quotations/filter-options` — Get Quotation Filter Options  ·  [details](./quotations.md#get-api-quotations-filter-options)
- `GET /api/quotations/lead-options` — List Quotation Lead Options  ·  [details](./quotations.md#get-api-quotations-lead-options)

### Regions

- `GET /api/regions/` — Get Regions  ·  [details](./regions.md#get-api-regions)
- `POST /api/regions/` — Create Region  ·  [details](./regions.md#post-api-regions)
- `POST /api/regions/assign-employee` — Assign Employee To Region  ·  [details](./regions.md#post-api-regions-assign-employee)
- `GET /api/regions/assignments/` — Get All Assignments  ·  [details](./regions.md#get-api-regions-assignments)
- `POST /api/regions/assignments/reorder` — Reorder Assignments  ·  [details](./regions.md#post-api-regions-assignments-reorder)
- `PUT /api/regions/assignments/{assignment_id}` — Update Employee Assignment  ·  [details](./regions.md#put-api-regions-assignments-assignment-id)
- `DELETE /api/regions/assignments/{assignment_id}` — Remove Employee Assignment  ·  [details](./regions.md#delete-api-regions-assignments-assignment-id)
- `GET /api/regions/assignments/{employee_id}` — Get Employee Assignments  ·  [details](./regions.md#get-api-regions-assignments-employee-id)
- `POST /api/regions/reorder` — Reorder Regions  ·  [details](./regions.md#post-api-regions-reorder)
- `GET /api/regions/{region_id}` — Get Region  ·  [details](./regions.md#get-api-regions-region-id)
- `PUT /api/regions/{region_id}` — Update Region  ·  [details](./regions.md#put-api-regions-region-id)
- `DELETE /api/regions/{region_id}` — Delete Region  ·  [details](./regions.md#delete-api-regions-region-id)

### Report Templates

- `GET /api/report-templates` — List Templates  ·  [details](./report-templates.md#get-api-report-templates)
- `POST /api/report-templates` — Create Template  ·  [details](./report-templates.md#post-api-report-templates)
- `GET /api/report-templates/assignable-users` — List Assignable Users  ·  [details](./report-templates.md#get-api-report-templates-assignable-users)
- `GET /api/report-templates/{template_id}` — Get Template  ·  [details](./report-templates.md#get-api-report-templates-template-id)
- `PATCH /api/report-templates/{template_id}` — Update Template  ·  [details](./report-templates.md#patch-api-report-templates-template-id)
- `DELETE /api/report-templates/{template_id}` — Delete Template  ·  [details](./report-templates.md#delete-api-report-templates-template-id)
- `GET /api/report-templates/{template_id}/assignments` — List Assignments  ·  [details](./report-templates.md#get-api-report-templates-template-id-assignments)
- `POST /api/report-templates/{template_id}/assignments` — Create Assignment  ·  [details](./report-templates.md#post-api-report-templates-template-id-assignments)
- `DELETE /api/report-templates/{template_id}/assignments/{assignment_id}` — Delete Assignment  ·  [details](./report-templates.md#delete-api-report-templates-template-id-assignments-assignment-id)

### Reports

- `GET /api/reports/expected-orders` — List Expected Order Reports  ·  [details](./reports.md#get-api-reports-expected-orders)
- `POST /api/reports/expected-orders` — Create Expected Order Report  ·  [details](./reports.md#post-api-reports-expected-orders)
- `GET /api/reports/od-plans` — List Od Plan Reports  ·  [details](./reports.md#get-api-reports-od-plans)
- `GET /api/reports/od-plans/{year}/{month}` — Get Od Plan Report  ·  [details](./reports.md#get-api-reports-od-plans-year-month)
- `PUT /api/reports/od-plans/{year}/{month}` — Save Od Plan Report  ·  [details](./reports.md#put-api-reports-od-plans-year-month)
- `GET /api/reports/scope` — Get Reports Scope  ·  [details](./reports.md#get-api-reports-scope)
- `GET /api/reports/summary` — Get Reports Summary  ·  [details](./reports.md#get-api-reports-summary)

### Saved Dashboards

- `GET /api/saved-dashboards` — List Dashboards  ·  [details](./saved-dashboards.md#get-api-saved-dashboards)
- `POST /api/saved-dashboards` — Create Dashboard  ·  [details](./saved-dashboards.md#post-api-saved-dashboards)
- `GET /api/saved-dashboards/assignable-users` — List Assignable Users  ·  [details](./saved-dashboards.md#get-api-saved-dashboards-assignable-users)
- `POST /api/saved-dashboards/execute-widget` — Execute Widget  ·  [details](./saved-dashboards.md#post-api-saved-dashboards-execute-widget)
- `POST /api/saved-dashboards/preview-sql-template` — Preview Sql Template  ·  [details](./saved-dashboards.md#post-api-saved-dashboards-preview-sql-template)
- `GET /api/saved-dashboards/{dashboard_id}` — Get Dashboard  ·  [details](./saved-dashboards.md#get-api-saved-dashboards-dashboard-id)
- `PATCH /api/saved-dashboards/{dashboard_id}` — Update Dashboard  ·  [details](./saved-dashboards.md#patch-api-saved-dashboards-dashboard-id)
- `DELETE /api/saved-dashboards/{dashboard_id}` — Delete Dashboard  ·  [details](./saved-dashboards.md#delete-api-saved-dashboards-dashboard-id)
- `GET /api/saved-dashboards/{dashboard_id}/assignments` — List Assignments  ·  [details](./saved-dashboards.md#get-api-saved-dashboards-dashboard-id-assignments)
- `POST /api/saved-dashboards/{dashboard_id}/assignments` — Create Assignment  ·  [details](./saved-dashboards.md#post-api-saved-dashboards-dashboard-id-assignments)
- `DELETE /api/saved-dashboards/{dashboard_id}/assignments/{assignment_id}` — Delete Assignment  ·  [details](./saved-dashboards.md#delete-api-saved-dashboards-dashboard-id-assignments-assignment-id)

### Schema

- `GET /api/schema` — Get Schema  ·  [details](./schema.md#get-api-schema)

### Series

- `GET /api/series/` — List Series  ·  [details](./series.md#get-api-series)
- `POST /api/series/` — Create Series  ·  [details](./series.md#post-api-series)
- `POST /api/series/generate-next` — Generate Next By Code  ·  [details](./series.md#post-api-series-generate-next)
- `GET /api/series/{series_id}` — Get Series  ·  [details](./series.md#get-api-series-series-id)
- `PUT /api/series/{series_id}` — Update Series  ·  [details](./series.md#put-api-series-series-id)
- `DELETE /api/series/{series_id}` — Delete Series  ·  [details](./series.md#delete-api-series-series-id)
- `POST /api/series/{series_id}/generate-next` — Generate Next  ·  [details](./series.md#post-api-series-series-id-generate-next)

### Tasks

- `POST /api/tasks` — Create Manual Task  ·  [details](./tasks.md#post-api-tasks)
- `GET /api/tasks/today` — List Today Tasks  ·  [details](./tasks.md#get-api-tasks-today)
- `GET /api/tasks/{task_id}` — Get Task  ·  [details](./tasks.md#get-api-tasks-task-id)
- `PATCH /api/tasks/{task_id}/complete` — Complete Task  ·  [details](./tasks.md#patch-api-tasks-task-id-complete)

### Tickets

- `GET /api/tickets/` — Tickets List  ·  [details](./tickets.md#get-api-tickets)
- `POST /api/tickets/` — Create Support Ticket  ·  [details](./tickets.md#post-api-tickets)
- `POST /api/tickets/feedback` — Send Support Feedback  ·  [details](./tickets.md#post-api-tickets-feedback)

### Visiting Card Contacts

- `GET /api/visiting-card-contacts/` — Get Visiting Card Contacts  ·  [details](./visiting-card-contacts.md#get-api-visiting-card-contacts)
- `POST /api/visiting-card-contacts/` — Create Visiting Card Contact  ·  [details](./visiting-card-contacts.md#post-api-visiting-card-contacts)
- `GET /api/visiting-card-contacts/{visiting_card_contact_id}` — Get Visiting Card Contact  ·  [details](./visiting-card-contacts.md#get-api-visiting-card-contacts-visiting-card-contact-id)
- `PUT /api/visiting-card-contacts/{visiting_card_contact_id}` — Update Visiting Card Contact  ·  [details](./visiting-card-contacts.md#put-api-visiting-card-contacts-visiting-card-contact-id)
- `DELETE /api/visiting-card-contacts/{visiting_card_contact_id}` — Delete Visiting Card Contact  ·  [details](./visiting-card-contacts.md#delete-api-visiting-card-contacts-visiting-card-contact-id)
- `POST /api/visiting-card-contacts/{visiting_card_contact_id}/convert-to-contact` — Convert Visiting Card Contact To Contact  ·  [details](./visiting-card-contacts.md#post-api-visiting-card-contacts-visiting-card-contact-id-convert-to-contact)

### Whats New

- `GET /api/whats-new/` — List Changelogs  ·  [details](./whats-new.md#get-api-whats-new)
- `POST /api/whats-new/` — Create Changelog  ·  [details](./whats-new.md#post-api-whats-new)
- `PUT /api/whats-new/{changelog_id}` — Update Changelog  ·  [details](./whats-new.md#put-api-whats-new-changelog-id)
- `DELETE /api/whats-new/{changelog_id}` — Delete Changelog  ·  [details](./whats-new.md#delete-api-whats-new-changelog-id)
