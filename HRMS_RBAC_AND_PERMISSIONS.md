# HRMS RBAC & Permission System

This document defines the complete Role-Based Access Control (RBAC) system for the HRMS + Marketing platform. Use this as a reference for building features, assigning permissions, and understanding access control.

---

## 1. RBAC Architecture

### 1.1 Core Models

```
User (Django auth)
  ├── UserRole           ← links User → Role (many-to-many through)
  ├── UserPermission     ← direct User → Permission overrides
  └── is_superuser       ← bypasses all checks (has every permission)

Role
  ├── name               ← display name (e.g. "HR Manager")
  ├── role_type          ← system key (e.g. "hr", "manager")
  ├── level              ← hierarchy level (higher = more authority)
  └── RolePermission     ← links Role → Permission (many-to-many through)

Permission
  ├── code               ← unique string like "employee.view"
  ├── category           ← grouping (employee, leave, marketing, etc.)
  ├── level              ← 1=View, 2=Create, 3=Edit/Delete, 4=Admin
  └── description        ← human-readable explanation

RolePermission          ← which permissions a role has (granted=True/False)
UserPermission          ← direct permission grant to a user (overrides role)
```

### 1.2 Permission Check Chain (`check_user_permission`)

The function `check_user_permission(user, permission_code)` in `employees/permissions.py` follows this order:

```
1. Is user authenticated?          → No  → False
2. Is user.is_superuser?           → Yes → True (bypass everything)
3. Check UserPermission table:
   - Direct permission for this code with granted=True and not expired?
                                     → Yes → True
4. Check UserRole → Role → RolePermission chain:
   - Any active role of the user has this permission via RolePermission?
                                     → Yes → True
5. Otherwise                        → False
```

### 1.3 Permission Level Convention

| Level | Meaning | Examples |
|-------|---------|---------|
| 1 | View / Read | `employee.view`, `leave.view` |
| 2 | Create / Edit | `employee.create`, `leave.apply_on_behalf` |
| 3 | Delete / Approve / Manage | `employee.delete`, `resignation.approve` |
| 4 | Admin / Configure | `settings.manage_company`, `rbac.manage_roles` |

---

## 2. Permission Code Naming Convention

All permission codes follow the pattern: **`category.action`** or **`category.subject_action`**

- **HRMS**: `employee.view`, `leave.create`, `attendance.checkin`, etc.
- **Marketing**: `marketing.view_contact`, `marketing.create_campaign`, etc.
- **Marketing flat codes** use the format `marketing.{action}_{entity}` (e.g. `marketing.view_contact`, `marketing.create_lead`)

---

## 3. Complete Permission Tables

### 3.1 HRMS Permissions

#### Employee Management (`employee.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `employee.view` | View Employees | View employee list and details | 1 |
| `employee.create` | Create Employee | Create new employees | 2 |
| `employee.edit` | Edit Employee | Edit employee information | 2 |
| `employee.delete` | Delete Employee | Delete employees | 3 |
| `employee.import` | Import Employees | Bulk import employees | 2 |
| `employee.export` | Export Employees | Export employee data | 1 |

#### Leave Management (`leave.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `leave.view` | View Leave Applications | View leave applications | 1 |
| `leave.apply_on_behalf` | Apply Leave on Behalf | Apply for leave on behalf of other employees | 2 |
| `leave.create` | Create Leave Applications | Create leave applications | 2 |

#### Attendance Management (`attendance.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `attendance.view` | View Attendance | View attendance records | 1 |
| `attendance.checkin` | Check In/Out | Mark attendance check-in/out | 1 |
| `attendance.mark` | Mark Attendance | Mark attendance for others | 2 |
| `attendance.edit` | Edit Attendance | Edit attendance records | 3 |
| `attendance.manage_comp_off` | Manage Comp-Off | Manage comp-off records | 2 |

#### Recruitment (`recruitment.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `recruitment.view` | View Job Openings | View job openings and applicants | 1 |
| `recruitment.create_job` | Create Job Opening | Create new job openings | 2 |
| `recruitment.edit_job` | Edit Job Opening | Edit job openings | 2 |
| `recruitment.delete_job` | Delete Job Opening | Delete job openings | 3 |
| `recruitment.view_applicants` | View Applicants | View applicant details | 1 |
| `recruitment.create_applicant` | Create Applicant | Add applicant manually | 2 |
| `recruitment.manage_applicants` | Manage Applicants | Update applicant status | 2 |
| `recruitment.induct_applicant` | Induct Applicant | Convert applicant to employee (set as Hired) | 3 |
| `recruitment.send_emails` | Send Emails | Send emails to applicants | 2 |

#### Organization (`org.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `org.view_departments` | View Departments | View department list | 1 |
| `org.manage_departments` | Manage Departments | Create/edit departments | 3 |
| `org.view_designations` | View Designations | View designation list | 1 |
| `org.manage_designations` | Manage Designations | Create/edit designations | 3 |

#### Holiday (`holiday.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `holiday.view` | View Holidays | View holiday calendar | 1 |
| `holiday.manage` | Manage Holidays | Create/edit holidays | 3 |
| `holiday.manage_years` | Manage Holiday Years | Manage holiday years | 3 |
| `holiday.manage_weekly_offs` | Manage Weekly Offs | Configure weekly offs | 3 |

#### Resignation (`resignation.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `resignation.view` | View Resignations | View resignation requests | 1 |
| `resignation.submit` | Submit Resignation | Submit resignation | 1 |
| `resignation.approve` | Approve Resignation | Approve/reject resignations | 3 |
| `resignation.manage_handover` | Manage Handover | Manage handover process | 2 |

#### RBAC / Roles & Permissions (`rbac.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `rbac.view_roles` | View Roles | View role list | 1 |
| `rbac.manage_roles` | Manage Roles | Create/edit roles | 4 |
| `rbac.view_permissions` | View Permissions | View permission list | 1 |
| `rbac.manage_permissions` | Manage Permissions | Create/edit permissions | 4 |
| `rbac.assign_roles` | Assign Roles | Request role assignment (requires approval) | 3 |
| `rbac.assign_permissions` | Assign Permissions | Request permission assignment (requires approval) | 4 |
| `rbac.approve_assignments` | Approve RBAC Assignments | Approve/reject role/permission requests | 4 |
| `rbac.view_domain_tab` | View Domain Tab | See Domain in navigation | 1 |

#### Settings (`settings.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `settings.view` | View Settings | View system settings | 1 |
| `settings.manage_company` | Manage Company Settings | Edit company settings | 4 |
| `settings.manage_email` | Manage Email Settings | Configure email settings | 3 |
| `settings.manage_templates` | Manage Email Templates | Edit email templates | 2 |

#### Onboarding (`onboarding.*`, `onboarding_policy.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `onboarding.view` | View Onboarding Submissions | View list and details of onboarding form submissions | 1 |
| `onboarding.approve` | Approve Onboarding Submissions | Approve or reject onboarding submissions and save data to employee profile | 3 |
| `onboarding.send` | Send Onboarding Form | Send onboarding form link by email to selected employees | 2 |
| `onboarding_policy.view` | View Onboarding Policies | View onboarding policies shown in the public onboarding form | 1 |
| `onboarding_policy.create` | Create Onboarding Policies | Create onboarding policies shown in the public onboarding form | 2 |
| `onboarding_policy.edit` | Edit Onboarding Policies | Edit onboarding policies shown in the public onboarding form | 3 |
| `onboarding_policy.delete` | Delete Onboarding Policies | Delete onboarding policies shown in the public onboarding form | 4 |

#### Forms (`forms.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `forms.view` | View Forms | View form list and form details | 1 |
| `forms.create` | Create Form | Create new forms | 2 |
| `forms.edit` | Edit Form | Edit forms | 2 |
| `forms.delete` | Delete Form | Delete forms | 3 |
| `forms.response_view` | View Form Responses | View form responses | 1 |
| `forms.response_edit` | Edit Form Responses | Edit form responses | 2 |
| `forms.response_delete` | Delete Form Responses | Delete form responses | 3 |

#### Workflow (`workflow.*`)

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `workflow.view` | View Workflows | View workflow list and details | 1 |
| `workflow.create` | Create Workflow | Create new workflows and steps | 2 |
| `workflow.edit` | Edit Workflow | Edit workflows and steps | 2 |
| `workflow.delete` | Delete Workflow | Delete workflows | 3 |
| `workflow.approval_template_builder` | Approval Template Builder | Configure global approval templates and routing structures | 4 |
| `workflow.approval_template_edit` | Edit Approval Template | Edit global approval templates and routing structures | 4 |

### 3.2 Marketing Permissions

All marketing permissions use flat codes in the format `marketing.{action}_{entity}`.

| Code | Name | Description | Level |
|------|------|-------------|-------|
| `marketing.view_contact` | View Contact | View contacts in marketing | 1 |
| `marketing.create_contact` | Create Contact | Create contacts | 2 |
| `marketing.edit_contact` | Edit Contact | Edit contacts | 2 |
| `marketing.delete_contact` | Delete Contact | Delete contacts | 3 |
| `marketing.view_customer` | View Customer | View customers in marketing | 1 |
| `marketing.create_customer` | Create Customer | Create customers | 2 |
| `marketing.edit_customer` | Edit Customer | Edit customers | 2 |
| `marketing.delete_customer` | Delete Customer | Delete customers | 3 |
| `marketing.view_lead` | View Lead | View leads | 1 |
| `marketing.create_lead` | Create Lead | Create leads | 2 |
| `marketing.edit_lead` | Edit Lead | Edit leads | 2 |
| `marketing.delete_lead` | Delete Lead | Delete leads | 3 |
| `marketing.view_domain` | View Domain | View domains | 1 |
| `marketing.create_domain` | Create Domain | Create domains | 2 |
| `marketing.edit_domain` | Edit Domain | Edit domains | 2 |
| `marketing.delete_domain` | Delete Domain | Delete domains | 3 |
| `marketing.view_region` | View Region | View regions | 1 |
| `marketing.create_region` | Create Region | Create regions | 2 |
| `marketing.edit_region` | Edit Region | Edit regions | 2 |
| `marketing.delete_region` | Delete Region | Delete regions | 3 |
| `marketing.assign_employee_region` | Assign Employee to Region | Assign users to regions | 2 |
| `marketing.assign_dashboard` | Assign Dashboard | Assign marketing dashboards | 2 |
| `marketing.view_plant` | View Plant | View plants/locations | 1 |
| `marketing.create_plant` | Create Plant | Create plants | 2 |
| `marketing.edit_plant` | Edit Plant | Edit plants | 2 |
| `marketing.delete_plant` | Delete Plant | Delete plants | 3 |
| `marketing.view_organization` | View Organization | View organizations in marketing | 1 |
| `marketing.create_organization` | Create Organization | Create organizations | 2 |
| `marketing.edit_organization` | Edit Organization | Edit organizations | 2 |
| `marketing.delete_organization` | Delete Organization | Delete organizations | 3 |
| `marketing.view_campaign` | View Campaign | View campaigns | 1 |
| `marketing.create_campaign` | Create Campaign | Create campaigns | 2 |
| `marketing.edit_campaign` | Edit Campaign | Edit campaigns | 2 |
| `marketing.delete_campaign` | Delete Campaign | Delete campaigns | 3 |
| `marketing.view_events` | View Events | View events | 1 |
| `marketing.create_events` | Create Events | Create events | 2 |
| `marketing.edit_events` | Edit Events | Edit events | 2 |
| `marketing.delete_events` | Delete Events | Delete events | 3 |
| `marketing.view_report` | View Report | View reports; employees see own, region/domain head and admin see underlings | 1 |
| `marketing.create_report` | Create Report | Create own report submissions (e.g. outdoor plan, expected orders plan) | 2 |
| `marketing.view_myteam` | View My Team | View my team in marketing | 1 |
| `marketing.create_myteam` | Create My Team | Create my team | 2 |
| `marketing.edit_myteam` | Edit My Team | Edit my team | 2 |
| `marketing.delete_myteam` | Delete My Team | Delete my team | 3 |
| `marketing.admin` | Marketing Admin | Full marketing module access | 4 |

---

## 4. Default Roles & Assigned Permissions

### 4.1 Super Admin
- **role_type**: `admin`
- **level**: 4
- **Description**: System Administrator with full access to all features
- **Permissions**: ALL active permissions (HRMS + Marketing) — automatically syncs any new permission

### 4.2 Administrator
- **role_type**: `admin`
- **level**: 4
- **Permissions**: ALL active permissions (HRMS + Marketing)

### 4.3 HR Manager
- **role_type**: `hr`
- **level**: 3
- **Permissions**:
  - `employee.view`, `employee.create`, `employee.edit`, `employee.import`, `employee.export`
  - `leave.view`, `leave.apply_on_behalf`, `leave.create`
  - `attendance.view`, `attendance.mark`, `attendance.edit`
  - `recruitment.view`, `recruitment.create_job`, `recruitment.edit_job`, `recruitment.view_applicants`, `recruitment.create_applicant`, `recruitment.manage_applicants`, `recruitment.induct_applicant`, `recruitment.send_emails`
  - `resignation.view`, `resignation.approve`, `resignation.manage_handover`
  - `holiday.view`, `holiday.manage`
  - `onboarding.view`, `onboarding.approve`, `onboarding.send`
  - `onboarding_policy.view`, `onboarding_policy.create`, `onboarding_policy.edit`, `onboarding_policy.delete`
  - `rbac.approve_assignments`

### 4.4 Manager
- **role_type**: `manager`
- **level**: 2
- **Permissions**:
  - `employee.view`
  - `leave.view`
  - `attendance.view`, `attendance.mark`
  - `resignation.view`
  - `recruitment.view`, `recruitment.view_applicants`

### 4.5 Employee
- **role_type**: `employee`
- **level**: 1
- **Permissions**:
  - `leave.view`
  - `attendance.view`, `attendance.checkin`
  - `resignation.view`, `resignation.submit`

### 4.6 Marketing Manager
- **role_type**: `marketing_manager`
- **level**: 3
- **Permissions**: ALL marketing flat codes (view/create/edit/delete for: contact, customer, lead, domain, region, plant, organization, campaign, events, report, myteam + assign_employee_region, assign_dashboard, marketing.admin)

### 4.7 Marketing Permission to Superusers

Every active superuser is automatically assigned ALL marketing permissions directly via `UserPermission`. This is done by:
- `create_all_permissions --assign-superusers`
- `assign_marketing_permissions_to_superusers`

---

## 5. Using Permissions in Code

### 5.1 View Decorators

```python
# Require superuser
@admin_required

# Require specific permission (redirects to dashboard on failure)
@has_permission('marketing.view_events')

# Require specific permission (raises PermissionDenied)
@has_permission('marketing.view_events', raise_exception=True)

# Require any of multiple permissions
@has_any_permission(['marketing.view_events', 'marketing.admin'])

# Require a specific role
@role_required('marketing_manager')
```

### 5.2 Permission Check in Views/Code

```python
from employees.permissions import check_user_permission, get_user_permissions

# Check single permission
if check_user_permission(request.user, 'marketing.view_events'):
    # show events

# Get all user permissions
perms = get_user_permissions(request.user)
```

### 5.3 Permission Check in Templates

```django
{% load employee_filters %}

{% if user|has_perm:'marketing.view_events' %}
    <a href="{% url 'events_list' %}">Events</a>
{% endif %}
```

### 5.4 Class-Based Views

```python
from employees.permissions import PermissionRequiredMixin

class EventsListView(PermissionRequiredMixin, View):
    permission_required = 'marketing.view_events'
    # or
    permission_required = ['marketing.view_events', 'marketing.admin']
    require_any = True  # if True, user needs any (not all)
```

---

## 6. Permission Assignment & Approval Workflow

### 6.1 Direct Assignment (Instant)

- **Superusers**: Automatically have all permissions
- **Role-based**: Assigning a role to a user instantly grants all role's permissions
- **Seed commands**: `create_all_permissions` and `assign_marketing_permissions_to_superusers`

### 6.2 Pending Approval Workflow

For non-admin assignments, the system uses a request-approve flow:

1. **Requester** (has `rbac.assign_roles` or `rbac.assign_permissions`):
   - Creates a `PendingRBACBatch` → contains `PendingRBACRequest` items
   - Requests are pending until approved

2. **Approver** (has `rbac.approve_assignments`):
   - Views pending requests at `/rbac/pending-requests/`
   - **Approves**: applies the role/permission to the user
   - **Rejects**: discards the request

3. **Assignment takes effect only after approval**

---

## 7. Seed & Management Commands

| Command | Purpose |
|---------|---------|
| `python manage.py create_all_permissions` | Create all HRMS + Marketing permissions and default roles |
| `python manage.py create_all_permissions --no-marketing` | Create only HRMS permissions/roles |
| `python manage.py create_all_permissions --assign-superusers` | Create all perms + assign marketing to superusers |
| `python manage.py assign_marketing_permissions_to_superusers` | Assign all marketing perms to all superusers |
| `python manage.py remove_unused_permissions` | Remove old/unused marketing permissions from DB |
| `python manage.py remove_unused_permissions --dry-run` | Preview what would be removed (no actual delete) |
| `python manage.py assign_permission_to_user <username> <permission_code>` | Assign a specific permission to a user |
| `python manage.py check_user_permissions <username>` | Check what permissions a user has |

All creation commands are **idempotent** — safe to run multiple times.

---

## 8. Removed / Old Permissions

The following old long-form marketing permission codes have been removed and should NOT be used:

`marketing.campaign.view`, `marketing.campaign.create`, `marketing.campaign.edit`, `marketing.campaign.delete`, `marketing.campaign.launch`, `marketing.campaign.pause`, `marketing.campaign.analytics`,
`marketing.lead.view`, `marketing.lead.create`, `marketing.lead.edit`, `marketing.lead.delete`, `marketing.lead.assign`, `marketing.lead.convert`, `marketing.lead.import`, `marketing.lead.export`,
`marketing.customer.view`, `marketing.customer.create`, `marketing.customer.edit`, `marketing.customer.delete`, `marketing.customer.import`,
`marketing.series.view`, `marketing.series.create`, `marketing.series.edit`, `marketing.series.delete`, `marketing.series.generate`,
`marketing.reports.view`, `marketing.reports.export`,
`marketing.settings.view`, `marketing.settings.edit`,
`marketing.visit.view`, `marketing.visit.create`, `marketing.visit.edit`, `marketing.visit.delete`,
`marketing.email.view`, `marketing.email.create`, `marketing.email.send`, `marketing.email.schedule`, `marketing.email.templates`, `marketing.email.analytics`,
`marketing.social.view`, `marketing.social.create`, `marketing.social.schedule`, `marketing.social.publish`, `marketing.social.analytics`,
`marketing.content.view`, `marketing.content.create`, `marketing.content.edit`, `marketing.content.delete`, `marketing.content.approve`,
`marketing.analytics.view`, `marketing.analytics.reports`, `marketing.analytics.export`, `marketing.analytics.dashboard`,
`marketing.budget.view`, `marketing.budget.manage`, `marketing.budget.approve`, `marketing.budget.roi`,
`marketing.segment.view`, `marketing.segment.create`, `marketing.segment.edit`, `marketing.segment.delete`,
`marketing.automation.view`, `marketing.automation.create`, `marketing.automation.edit`, `marketing.automation.activate`,
`marketing.view_exhibition`, `marketing.create_exhibition`, `marketing.edit_exhibition`, `marketing.delete_exhibition`

Run `python manage.py remove_unused_permissions` to clean these from the database.

---

## 9. HRMS RBAC API — Endpoint Quick Reference

**Base URL**: `https://hrms.aureolegroup.com/api/rbac/`

**Auth Header**: `Authorization: Token your-token-here` *(NOT Bearer)*

> ⚠️ **URL gotcha**: Use `/api/rbac/user/info/` (with slash) — NOT `/api/rbac/user-info/` (with hyphen)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/rbac/login/` | POST | No | Login, get token + permissions |
| `/api/rbac/logout/` | POST | Yes | Invalidate token |
| `/api/rbac/user/info/` | GET | Yes | Full user info, roles, permissions |
| `/api/rbac/user/permissions/` | GET | Yes | All permissions grouped by category |
| `/api/rbac/user/roles/` | GET | Yes | User roles with their permissions |
| `/api/rbac/check-permission/` | POST | Yes | Check single permission |
| `/api/rbac/check-permissions/` | POST | Yes | Check multiple permissions at once |
| `/api/rbac/permissions/` | GET | No | List all permission codes (public) |
| `/api/rbac/roles/` | GET | No | List all roles (public) |

### Login Request/Response

```json
// POST /api/rbac/login/
{ "username": "john.doe", "password": "password123" }

// Response
{
  "success": true,
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": { "id": 1, "username": "john.doe", "is_superuser": false },
  "employee": { "id": 1, "first_name": "John", "last_name": "Doe" },
  "permissions": [{ "id": 1, "name": "View Events", "code": "marketing.view_events", "level": 1 }],
  "permission_count": 25
}
```

### Check Permission

```json
// POST /api/rbac/check-permission/
{ "permission": "marketing.view_events" }

// POST /api/rbac/check-permissions/
{ "permissions": ["marketing.view_events", "marketing.create_events"] }

// Response
{ "success": true, "has_permission": true }
{ "success": true, "permissions": { "marketing.view_events": true, "marketing.create_events": false } }
```

### Error Response Format

```json
{ "success": false, "error": "Error message describing what went wrong" }
```

### Frontend Usage (current)
- ✅ `/api/rbac/login/` — Login
- ✅ `/api/rbac/user/info/` — Get user info on load
- ✅ `/api/rbac/check-permission/` — Check single permission
- ✅ `/api/rbac/check-permissions/` — Check multiple permissions
- ✅ `/api/rbac/logout/` — Logout

