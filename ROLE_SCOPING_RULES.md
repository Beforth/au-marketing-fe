# Marketing CRM - Role Scoping & Visibility Matrix

This document serves as the single source of truth for all hardcoded role-based visibility and access rules across the frontend and backend systems.

---

## 👥 Overview of System Roles

The system determines a user's access boundaries using the primary role mapped from the HRMS scope API:

1. **`super_admin` (Superuser / Staff)**: Full database access; bypasses all scope filters.
2. **`domain_head`**: Scoped to one or more entire markets (e.g., Domestic, Export).
3. **`domain_coordinator`**: Assigned to a domain as its coordinator; resolves to `domain_head` scope with `is_domain_coordinator = true` — domain-wide visibility but view-only actions.
4. **`region_head`**: Scoped to specific geographical regions (e.g., North America, Europe).
5. **`supervisor` / `region_coordinator`**: Mid-level access with region-wide visibility but restricted actions.
6. **`employee` (Salesperson)**: Strictly isolated to their own records or assigned workspace.

> [!IMPORTANT]
> **`marketing.admin` HRMS permission = super-admin *visibility***. A user holding the `marketing.admin` permission (e.g. a CEO) is resolved to `super_admin` scope in `app/scope.py` (`is_super_admin()`), so they see all domains/targets/leads and every employee in the Leads "Assigned:" filter — exactly like a superuser. This grants **data visibility only**: per-route action permissions (`marketing.create_lead`, `marketing.edit_lead`, `marketing.delete_lead`, etc.) are still enforced individually against HRMS, and the superuser/staff bypass inside `require_permission()` does NOT apply to `marketing.admin`. Grants/revokes take effect after the RBAC cache TTL (`RBAC_CACHE_TTL_SECONDS`, default 60s) or a profile/refresh-permissions call.
>
> The Leads "Assigned:" filter (backed by `GET /reports/scope`) also unions in every employee who is the assignee on at least one lead the user can see per their role scope, so real assignees are always filterable even without an active region assignment.

---

## 🌐 1. Domain & Region Visibility Matrix

Determines what elements are visible on the **Domains & Targets** dashboard as defined by the [DomainsPage.tsx](file:///Users/ady/Documents/au-marketing-fe/pages/DomainsPage.tsx) schema.

> [!NOTE]
> Visibility toggles marked as **Configurable** can be modified dynamically by an Administrator using Global Settings Presets (*Strict Isolation*, *Balanced*, *Open Team*, *Coordinator-Led*).

| Role | What They Can See | What is Hidden | Actions & Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | • All domains & region nodes.<br>• All targets & actuals.<br>• All assignee names. | • *None.* | • Create, edit, delete domains & regions.<br>• Assign Domain & Region Heads.<br>• Create region assignments.<br>• Set all targets. |
| **Domain Head** | • Assigned domain & its regions.<br>• Domain-level targets.<br>• Region-level targets. | • Other domains *(Configurable)*.<br>• Regions outside their domain *(Configurable)*. | • View-only. |
| **Domain Coordinator** | • Regions under their domain.<br>• Region-level targets *(Configurable)*.<br>• Employee targets *(Configurable)*. | • Other domains.<br>• Structural editing options. | • View-only. |
| **Region Head** | • Assigned region(s).<br>• Team members & targets in region.<br>• Domain Head's name. | • Sibling regions *(Configurable)*.<br>• Domain-level total target *(Configurable)*. | • View-only. |
| **Region Coordinator** | • Sibling regions.<br>• Domain Head's name.<br>• Employee targets in region. | • Domain-level target.<br>• Sibling region targets. | • View-only. |
| **Employee** | • Assigned region.<br>• Region Head and Domain Head names.<br>• Own sales target. | • Teammates' targets *(Configurable)*.<br>• Region total target *(Configurable)*. | • View-only. |

---

## 📈 2. Leads & Orders Scoping Rules

> [!IMPORTANT]
> **Leads and Orders both use creator-chain scoping.** A record's visibility is driven entirely by
> *who created it* and that creator's position in the reporting chain, not by the record's own
> domain/region (which is still recorded for reference/reporting, but no longer drives who can see
> it). This was a deliberate reversal from the old territory-shared model, where any lead/order
> automatically became visible to everyone in its domain/region. Implemented in
> [app/scope.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/scope.py)
> (`get_chain_visible_creator_ids`, shared by `apply_scope_to_lead_query`/`can_access_lead` and
> `apply_scope_to_order_query`/`can_access_order`).
>
> For an Order specifically, "creator" means **whoever converted the lead into an order**
> (`Order.created_by_employee_id`, set to the converting user at creation time) — not necessarily
> the original lead's creator. If a manager converts an employee's won lead on the employee's
> behalf, the resulting order's chain-visible set is the manager's, not the employee's — the
> employee only keeps visibility if they're also the order's assignee.

### 📈a. Leads — Creator-Chain Scoping

The reporting chain (top → bottom): **Domain Head → Domain Coordinator → Region Head → Region Coordinator / Supervisor → Employee.**

**Rule: a lead is visible to whoever created it, plus everyone *above* the creator in this chain — never to peers, never to anyone below the creator, and never just because the lead shares someone's domain/region.** The assignee (`assigned_to_employee_id`) can always see it too, regardless of chain position — same as before. Super Admin (and `marketing.admin`) always sees everything.

| Lead created by | Who can see it |
| :--- | :--- |
| **Domain Head** | Only themselves |
| **Domain Coordinator** | Themselves + Domain Head |
| **Region Head** | Themselves + Domain Coordinator + Domain Head |
| **Region Coordinator / Supervisor** | Themselves + Region Head + Domain Coordinator + Domain Head |
| **Employee** | Themselves + Region Coordinator/Supervisor + Region Head + Domain Coordinator + Domain Head |

Flipped the other way — from each **viewer's** point of view, whose leads they can see (their own, plus everyone *below* them in the chain, since those leads bubble upward to them):

| Viewer | Whose leads they see |
| :--- | :--- |
| **Super Admin** | Everyone's |
| **Domain Head** | Their own + everyone below them in their domain (Domain Coordinator, Region Head, Region Coordinator/Supervisor, Employee) — i.e. all leads in their domain |
| **Domain Coordinator** | Their own + everyone below them (Region Head, Region Coordinator/Supervisor, Employee) — **not** the Domain Head's own leads |
| **Region Head** | Their own + everyone below them (Region Coordinator/Supervisor, Employee) — **not** Domain Coordinator's or Domain Head's own leads |
| **Region Coordinator / Supervisor** | Their own + Employees below them — **not** Region Head's, Domain Coordinator's, or Domain Head's own leads |
| **Employee** | Only their own leads — **not even other employees'**, no matter the region/team |

`supervisor` is treated as the same tier as `region_coordinator` for this purpose (both mid-level/restricted-action roles).

* *Creation Restriction*: Employees can only select their assigned domain/region when creating a lead (unchanged).

#### On-behalf-of creation — a separate, narrower rule (bypasses the chain above)

Domain/Region Coordinators can create a lead with `created_by_employee_id` set to someone else — scoped to **their domain**, not their region (`leads.py` `create_lead`). A **Region Coordinator can name anyone in their domain**, not just their own region (the old "current region" restriction was removed 2026-08-14) — but still can't reach into a different domain. A **Domain Coordinator** could already name anyone across their whole domain; unchanged. The actual submitter is recorded separately on `Lead.on_behalf_of_by_employee_id` (added specifically for this rule — the coordinator's own employee ID; `null` for normal leads).

**When a lead is created on behalf of someone, it does *not* follow the normal creator-chain table above.** Instead it's visible only to:
1. The **actual submitter** (the coordinator who filed it) — `on_behalf_of_by_employee_id`.
2. The **named creator** (who it's for) — `created_by_employee_id`.
3. The **Head of the lead's own domain** (`Domain.head_employee_id` for `Lead.domain_id`) — regardless of whether that domain head is even in the submitter's or named person's chain.

Nobody else — not the domain coordinator's peers, not the region head, not anyone else who would normally see a chain-based lead — can see it. This is deliberately narrower than the standard chain: e.g. a Region Coordinator filing on behalf of an Employee skips the Region Head and Domain Coordinator entirely, jumping straight to the Domain Head. The assignee override (`assigned_to_employee_id`) still applies on top of this, same as always.

Implemented in `can_access_lead` / `apply_scope_to_lead_query` ([app/scope.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/scope.py)) — this on-behalf-of branch is Lead-specific and does not affect Orders/Contacts/Customers.

> [!NOTE]
> `on_behalf_of_by_employee_id`/`on_behalf_of_by_username` are new columns on `Lead` — requires an `alembic revision --autogenerate` + `alembic upgrade head` on the server before this takes effect (per the migration workflow in `CLAUDE.md`).

### 📈b. Orders — Creator-Chain Scoping (same model as Leads)

Rules applied at the API query level in [orders.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/orders.py): identical rule to Leads (§2a) — an order is visible to whoever created it (i.e. whoever clicked "convert to order"), plus everyone above that creator in the **Domain Head → Domain Coordinator → Region Head → Region Coordinator/Supervisor → Employee** chain, plus the assignee. Never to peers, never to anyone below the creator, and not based on the order's own domain/region.

| Order created by | Who can see it |
| :--- | :--- |
| **Domain Head** | Only themselves |
| **Domain Coordinator** | Themselves + Domain Head |
| **Region Head** | Themselves + Domain Coordinator + Domain Head |
| **Region Coordinator / Supervisor** | Themselves + Region Head + Domain Coordinator + Domain Head |
| **Employee** | Themselves + Region Coordinator/Supervisor + Region Head + Domain Coordinator + Domain Head |

* Creating an order requires access to the underlying **Lead** (checked via `can_access_lead` against the lead's own creator-chain, not the order's) — see `create_order` in `orders.py`.
* **Super Admin**: Full read/write access to all orders.

### ✍️ Lead Assignment ("Assigned To" field)
Who can use the **"Assigned To"** dropdown on the lead create/edit form ([LeadFormPage.tsx](file:///Users/ady/Documents/au-marketing-fe/pages/LeadFormPage.tsx), `canUseAssignTo`):

| Role | Can use "Assigned To" | Assignee scope |
| :--- | :--: | :--- |
| **Super Admin** | ✅ | Anyone |
| **Domain Head** | ✅ | Employees in their domain(s) only (incl. region heads & coordinators in scope) |
| **Domain Coordinator** | ✅ | Employees in their domain(s) only (incl. region heads & coordinators in scope) |
| **Region Head** | ✅ | Employees in their region(s) only (incl. region heads & coordinators in scope) |
| **Region Coordinator** | ❌ hidden | — |
| **Supervisor** | ❌ hidden | — |
| **Employee** | ❌ hidden | — |

* The dropdown is **scoped** to `GET /reports/scope` → `employees` (the user's own region/domain team), not the full HRMS directory — so a Region/Domain Head can't pick (or even see) people outside their territory. A transient global-HRMS search is used only if the scope hasn't loaded yet.
* The backend independently enforces the same rule on create (`leads.py` `create_lead`) and update (`leads.py` `update_lead`): `assigned_to_employee_id` must be inside `_get_reportable_employee_ids_and_role(db, user)` (region scope for region head/coordinator, domain scope for domain head/coordinator, everyone for super admin), otherwise the request is rejected with *"You can only assign leads to employees in your current region or domain."* Assignment is the only lead field gated this way; other lead edits are governed by the standard lead-access rules above.

---

## 🗄️ 3. Database Scoping Rules (Organizations, Customers, Contacts)

Scoping rules applied in [contacts.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/contacts.py) and [customers.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/customers.py) to manage CRM directory data.

### 📞 Contacts & Customers — Creator-Chain Scoping (same model as Leads/Orders)

> [!IMPORTANT]
> Contacts and Customers now use the same creator-chain visibility as Leads and Orders (§2), not
> territory-based isolation. A record is visible to whoever created it, plus everyone above that
> creator in the **Domain Head → Domain Coordinator → Region Head → Region Coordinator/Supervisor →
> Employee** chain, plus the assignee — never to peers, never to anyone below the creator, and not
> based on the record's own domain/region. Implemented via the same
> `get_chain_visible_creator_ids` in [app/scope.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/scope.py)
> (`apply_scope_to_contact_customer_query`, `can_access_contact_customer`).
>
> The "assignee" field differs by model: **Contact** uses `assigned_to_employee_id`; **Customer**
> has no such field and uses `account_manager_employee_id` instead — whoever is set as account
> manager can always see that customer, regardless of chain position.

| Record created by | Who can see it |
| :--- | :--- |
| **Domain Head** | Only themselves |
| **Domain Coordinator** | Themselves + Domain Head |
| **Region Head** | Themselves + Domain Coordinator + Domain Head |
| **Region Coordinator / Supervisor** | Themselves + Region Head + Domain Coordinator + Domain Head |
| **Employee** | Themselves + Region Coordinator/Supervisor + Region Head + Domain Coordinator + Domain Head |

* Employees are strictly isolated by this rule already — two employees never see each other's contacts/customers, same as before.
* **Contact-to-Customer promotion**: the new Customer record's `created_by_employee_id` is set independently at promotion time — it does not inherit the original contact's creator, same wrinkle as lead→order conversion (§2b).

### 🏢 Organizations & Plants (unchanged — still territory-based)
> [!IMPORTANT]
> **Not part of this reversal.** Organizations/Plants are scoped by their own domain-derived query
> (`apply_scope_to_organization_query`) — everyone whose domain/region contains *any* linked
> contact/customer can see the organization, regardless of who created that contact/customer. This
> can now be **wider** than what you can see on the Contacts/Customers pages: you might see an
> organization card without being able to open the specific contact/customer that links it to your
> domain. Flag if this should be reversed too.

* **Super Admin**: Full access to all organizations and plants.
* **Domain Head / Domain Coordinator**: Sees organizations/plants that are either linked to a contact/customer in their domain or were created by a user in their domain.
* **Region Head / Region Coordinator**: Sees organizations/plants linked to contacts/customers within their specific region(s).
* **Employee**: Sees organizations/plants they personally created or those linked to their own contacts/customers.

### 🔄 Contact-to-Customer Promotion
* Promote contact requires `marketing.create_customer` permission.
* On conversion, the contact is marked as `is_converted = True` and links to the new `Customer` record.
* **Hardcoded Constraint**: Converted contacts **cannot be deleted**.

---

## 🎪 4. Exhibition & Roadshow Events Scoping Rules

Rules governing who can see and modify Exhibition/Roadshow events and visitors:

### 📅 Events Access boundaries:
* **Super Admin**: Full access to view, create, edit, and delete all events.
* **Domain Head / Domain Coordinator**: Full access to events scoped to their assigned domain(s).
* **Region Head / Region Coordinator**: Full access to events scoped to regions under their domain(s) or assigned region scope.
* **Employee**: Can view events they are explicitly selected for (i.e. listed in `selected_employee_ids`, `travel_employee_ids`, or `hotel_employee_ids`).

### 👥 Visitor Allocation & Sharing Rules:
* **Unique Links**: When linking a visitor to an existing contact, the contact's pre-existing assignment is preserved and displayed in the UI (*"Allocated to: [Employee Name]"*).
* **Direct Assigned Scoping**: Allocating a visitor to an employee sets the `assigned_to_employee_id` and `assigned_to_username` on the CRM Contact. The assigned employee immediately gains visibility to view and access that contact under their employee directory scope.
* **Unallocation cleanup**: If a visitor allocation is removed (reset to "Not allocated"), the CRM Contact's assignment fields are cleared, revoking the employee's visibility.
* **Assignment Notifications**: Allocating or re-allocating a visitor to an employee triggers a real-time push and in-app notification to the assignee.

---

## 📊 5. Dashboard Scoping Rules (Widgets)

Rules governing what each role sees on the Home/Dashboard page ([DashboardPage.tsx](file:///Users/ady/Documents/au-marketing-fe/pages/DashboardPage.tsx)) and how the data inside each widget is scoped. Two independent layers apply to every widget:

1. **Widget visibility** — which widgets a role may add (Add Widget catalog) and have rendered in their layout. Widgets a user is not privileged to see are **removed entirely** from their view (they do not appear in the rendered layout or the Add Widget picker).
2. **Data scoping** — the numbers inside each widget are filtered server-side to the user's scope (same `get_user_scope` used everywhere else).

### Widget visibility by role

| Widget | Super Admin | Domain Head / Coordinator | Region Head / Coordinator / Supervisor | Employee |
| :--- | :--: | :--: | :--: | :--: |
| Head Summary | ✅ | ✅ | ❌ hidden | ❌ hidden |
| Leads by Region | ✅ | ✅ | ❌ hidden | ❌ hidden |
| Quotations Submitted | ✅ | ✅ | ❌ hidden | ❌ hidden |
| Audit Logs | ✅ (admin only) | ❌ hidden | ❌ hidden | ❌ hidden |
| All other ready-made widgets & charts | ✅ | ✅ | ✅ | ✅ |
| Custom builders (SQL / Code) | ✅ | ✅ | ✅ | ✅ |

- **Head-only widgets** (`head-summary`, `leads-by-region`, `quotation-submitted-chart`) render only when the dashboard role is `domain_head`/`super_admin` or `is_domain_coordinator === true` (frontend `isHeadRole`).
- **Audit Logs** renders only for users holding `marketing.admin` or `marketing.view_reports` — mirroring the backend gate in `audit_logs.py` (the widget would otherwise 403 into an empty state).
- **Dashboard role resolution**: `supervisor` and `region_coordinator` are presented as `region_head` (regional view, no head widgets); `domain_coordinator` is presented as `domain_head` with `is_domain_coordinator = true` (domain-wide view including head widgets).

### Data scoping per widget
- **Stat cards (Leads / Contacts / Customers)** — server-scoped via `getLeads`/`getContacts`/`getCustomers`; the card subtitle reflects scope ("In my scope" / "Region scope" / "Domain scope" / "All") instead of the misleading "Total in system".
- **Monthly Target Progress / Target vs Achieved / Won vs Lost** — `getScopeTargetStats`, role-scoped with `scope_label` ("My" / "Region" / "Domain" / "All"). Employee sees their own target (`employee_count = 1`); heads see their team's aggregated target.
- **Recent Leads + status / revenue / goal / inquiries-quotations charts** — computed from role-scoped leads and the scoped reports summary.
- **Performer of the Month** — top 5 ranking **scoped to the caller's team**: super admin = all domains/regions; domain head/coordinator = their domains; region head/supervisor/employee = their regions. No org-wide leaderboard leaks.
- **Custom SQL builders** — SQL is compiled server-side with scope placeholders (`{{employee_id}}`, `{{domain_id}}`, `{{region_id}}`, `{{role}}`) filled from the viewer's scope, so hand-written queries only return rows inside the viewer's scope.

---

## 🛠️ Code References

* **Backend Scoping Logic**: [app/scope.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/scope.py)
* **Backend Routers**:
  * Leads: [app/routers/leads.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/leads.py)
  * Contacts: [app/routers/contacts.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/contacts.py)
  * Customers: [app/routers/customers.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/customers.py)
  * Organizations: [app/routers/organizations.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/organizations.py)
  * Events: [app/routers/events.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/events.py)
* **Frontend Rules Config**: [pages/DomainsPage.tsx](file:///Users/ady/Documents/au-marketing-fe/pages/DomainsPage.tsx)
* **Dashboard Widgets**: [pages/DashboardPage.tsx](file:///Users/ady/Documents/au-marketing-fe/pages/DashboardPage.tsx) / [app/routers/dashboard.py](file:///Users/ady/Documents/au-marketing-fe/au-marketing-api/app/routers/dashboard.py)
