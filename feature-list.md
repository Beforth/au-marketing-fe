# Feature List — AP | S&M Module

> Complete inventory of features in the Sales & Marketing module, organized from smallest utility features to larger integrated systems.

---

## 1. Infrastructure & Utilities

### 1.1 Frontend Foundation

| Feature | Description | Location |
|---------|-------------|----------|
| **Vite Build System** | Fast HMR development server with TypeScript compilation | `vite.config.ts` |
| **React 18 + TypeScript** | Type-safe React with strict mode | `tsconfig.json` |
| **Tailwind CSS** | Utility-first CSS framework with custom config | `tailwind.config.*` |
| **Redux Toolkit Store** | Centralized state management with slices | `store/` |
| **React Router v6** | Client-side routing with nested layouts, params, guards | `App.tsx` |
| **Lucide React Icons** | Consistent iconography across the entire app | `package.json` |
| **Recharts** | Charting library for dashboard widgets | `package.json` |
| **Custom Hooks** | Shared logic hooks (useApp, useAppSelector, useAppDispatch) | `store/hooks.ts` |

### 1.2 Backend Foundation

| Feature | Description | Location |
|---------|-------------|----------|
| **FastAPI Framework** | Async Python web framework with auto-generated OpenAPI docs | `au-marketing-api/app/main.py` |
| **SQLAlchemy ORM** | Database abstraction with 40+ models | `au-marketing-api/app/models.py` |
| **Alembic Migrations** | Database schema versioning and migration management | `au-marketing-api/migrations/` |
| **Pydantic v2 Schemas** | Request/response validation with model_dump() | `au-marketing-api/app/schemas.py` |
| **Dependency Injection** | FastAPI Depends for auth, permissions, DB sessions | `au-marketing-api/app/dependencies.py` |
| **Global Exception Handler** | Maps SQLAlchemy/Postgres errors to user-friendly messages | `au-marketing-api/app/main.py` |
| **CORS Middleware** | Cross-origin request support for frontend-backend communication | `au-marketing-api/app/main.py` |
| **Version Management** | Dynamic version reading from CHANGELOG.md | `au-marketing-api/app/version.py` |

### 1.3 Shared Libraries

| Feature | Description | Location |
|---------|-------------|----------|
| **API Client** | Axios-based HTTP client with interceptors, token refresh | `lib/api.ts` |
| **Marketing API Methods** | Typed methods for all backend endpoints (2500+ lines) | `lib/marketing-api.ts` |
| **API Cache** | TTL-based in-memory cache for report scope data | `lib/api-cache.ts` |
| **Auth Utilities** | Shared auth helpers (token storage, permission checks) | `lib/auth-utils.ts` |
| **Marketing Scope** | Client-side scope caching (domain/region assignment) | `lib/marketing-scope.ts` |
| **HRMS RBAC Client** | Typed HRMS API client for RBAC, DSR, employee queries | `lib/hrms-rbac.ts` |
| **Name/Phone Parser** | Utility to parse/serialize name prefixes and phone with country codes | `lib/name-phone-utils.ts` |
| **Country Codes** | Phone country code definitions with search | `lib/country-codes.ts` |
| **Firebase Push** | Firebase Cloud Messaging integration for web push | `lib/firebase-push.ts` |
| **Notification Permission** | Browser notification permission request utility | `lib/notification-permission.ts` |
| **Date/Deadline Utils** | Deadline calculation and countdown helpers | `lib/deadline-utils.ts` |
| **General Utilities** | Shared helpers (formatting, date, etc.) | `lib/utils.ts` |
| **Constants** | Indian states, industry options, permission lists, navbar config | `constants.tsx` |
| **Design Tokens** | Color palette, font config, design system reference | `design.md` |

### 1.4 Audit System

| Feature | Description | Location |
|---------|-------------|----------|
| **Audit Utility** | Isolated DB session helper for thread-safe audit logging | `au-marketing-api/app/audit_utils.py` |
| **Audit Log Model** | Database table storing entity_id, action, actor, timestamp, details | `au-marketing-api/app/models.py` (AuditLog) |
| **Audit Logs API** | Paginated, filterable (entity_type, employee, action, date, search) endpoint | `au-marketing-api/app/routers/audit_logs.py` |
| **System-Wide Audit Hooks** | CRUD audit triggers in leads, contacts, customers, orders, domains, regions, events, orgs, plants, series, tasks, settings | Multiple routers |
| **Settings Audit** | Every settings change logged with before/after config, IP, user agent | `au-marketing-api/app/routers/settings.py` |

---

## 2. UI Component Library

### 2.1 Atomic Components

| Component | Features | Location |
|-----------|----------|----------|
| **Button** | 6 variants (primary/secondary/outline/ghost/danger/link), loading spinner, leftIcon, size (sm/md/lg/xs) | `components/ui/Button.tsx` |
| **Input** | Size variants (sm/md), placeholder, label, error state, focus ring | `components/ui/Input.tsx` |
| **Select** | Custom dropdown with chevron, creatable prop for free-text combobox, searchable | `components/ui/Select.tsx` |
| **AsyncSelect** | Async searchable select for entities (contacts, orgs, employees); debounced search | `components/ui/AsyncSelect.tsx` |
| **Badge** | Dynamic color variants (slate/red/orange/amber/emerald/blue/violet/pink) | `UI/Badge.tsx` |
| **Switch** | Toggle switch for boolean settings | `components/ui/Switch.tsx` |
| **SegmentToggle** | Segmented control (tab-like toggle between options) | `components/ui/SegmentToggle.tsx` |
| **Tooltip** | Custom tooltip wrapping Radix UI with multi-line support | `UI/Tooltip.tsx` |
| **DeleteButton** | Trash icon button with confirmation tooltip | `UI/DeleteButton.tsx` |

### 2.2 Composite Components

| Component | Features | Location |
|-----------|----------|----------|
| **Card** | Container with title, description, content; shadow/hover effects | `components/ui/Card.tsx` |
| **Breadcrumb** | Navigation breadcrumbs with chevron separators | `UI/Breadcrumb.tsx` |
| **Modal** | Overlay dialog with backdrop, close button, title, content, footer | `UI/Modal.tsx` |
| **ConfirmModal** | Confirmation dialog with cancel/confirm actions | `components/ui/ConfirmModal.tsx` |
| **Pagination** | Page navigation with page numbers, prev/next, page size selector | `components/ui/Pagination.tsx` |
| **Toast** | Notification toast with success/error/info variants, auto-dismiss | `components/ui/Toast.tsx` |
| **SearchInput** | Debounced search input with clear button | `components/ui/SearchInput.tsx` |
| **SearchSuggestion** | Dropdown suggestion list for search inputs | `components/ui/SearchSuggestion.tsx` |
| **DataTable** | Sortable columns, paginated, custom cell renderers, loading/empty states | `components/ui/DataTable.tsx` |
| **FilterPopover** | Floating filter panel with dropdown fields, apply/clear actions | `components/ui/FilterPopover.tsx` |
| **DatePicker** | Custom calendar date picker with year/month navigation, Today quick-select, time selection | `components/ui/DatePicker.tsx` |
| **Calendar** | Date-picking calendar widget (shadcn/ui pattern) | `components/ui/calendar.tsx` |
| **Popover** | Floating popover panel (Radix-based) | `UI/Popover.tsx` |
| **Command** | Command palette / combobox for keyboard-driven selection | `UI/Command.tsx` |
| **Dialog** | Dialog overlay with Radix primitives | `UI/Dialog.tsx` |
| **ErrorBoundary** | React error boundary with fallback UI | `components/ErrorBoundary.tsx` |
| **PdfPreviewModal** | In-app PDF preview without downloading | `components/ui/PdfPreviewModal.tsx` |
| **ChartsSection** | Chart rendering engine: Bar, Pie, Area, Line, TargetAchieved, WonLost, LeadStatus, InquiriesQuotations, RegionBreakdown | `components/ui/ChartsSection.tsx` |

### 2.3 Layout Components

| Component | Features | Location |
|-----------|----------|----------|
| **DashboardLayout** | Main app layout: 240px sidebar + 64px sticky navbar + content grid background | `components/layout/DashboardLayout.tsx` |
| **PageLayout** | Standard page wrapper: breadcrumbs + title + description + filter card + KPI row + content | `components/layout/PageLayout.tsx` |
| **DatabaseLayout** | Nested layout wrapper for CRM database pages (contacts, customers, etc.) | `components/layout/DatabaseLayout.tsx` |
| **Sidebar** | Navigation sidebar with icons, labels, permission-gated links, version tag | `components/ui/Sidebar.tsx` |
| **Navbar** | Top bar with quick-create, global search, notification center, user menu | `components/ui/Navbar.tsx` |
| **ProtectedRoute** | Route guard checking authentication and permissions, redirects to login | `components/ProtectedRoute.tsx` |

---

## 3. Authentication & Access Control

### 3.1 Authentication

| Feature | Description | Location |
|---------|-------------|----------|
| **Login Page** | Split-screen design with Lottie animation, username/password form | `pages/LoginPage.tsx` |
| **HRMS API Login** | Authenticate via HRMS RBAC API with token response | `au-marketing-api/app/routers/auth.py` |
| **Token Management** | JWT token storage, refresh, auto-redirect on expiry | `lib/auth-utils.ts`, `store/slices/authSlice.ts` |
| **Session Persistence** | Token validity guard — prevents auth flash on page reload | `store/slices/authSlice.ts` |
| **Logout** | Token invalidation and redirect to login | `au-marketing-api/app/routers/auth.py` |

### 3.2 Role-Based Access Control (RBAC)

| Feature | Description | Location |
|---------|-------------|----------|
| **Flat Permission Codes** | 40+ marketing permissions (view/create/edit/delete per entity) | HRMS RBAC system |
| **Role Hierarchy** | Super Admin → Administrator → Manager → Domain Head → Region Head → Employee | `HRMS_RBAC_AND_PERMISSIONS.md` |
| **Permission Dependencies** | Backend `require_permission()` dependency checks every endpoint | `au-marketing-api/app/dependencies.py` |
| **Frontend Permission Gates** | `selectHasPermission()` selector guarding UI elements | `store/slices/authSlice.ts` |
| **Permission Levels** | Level 1 (view) → Level 4 (admin) for consistent access escalation | `HRMS_RBAC_AND_PERMISSIONS.md` |
| **Roles Page** | View marketing roles from HRMS, color-coded by level | `pages/RolesPage.tsx` |

### 3.3 Data Scoping / Visibility Rules

| Feature | Description | Location |
|---------|-------------|----------|
| **User Scope Resolution** | `get_user_scope()` determines domain/region assignment and role type | `au-marketing-api/app/scope.py` |
| **Super Admin** | Full access to all records across all domains | `au-marketing-api/app/scope.py` |
| **Domain Head Scope** | Access to entire assigned domain(s), including region-less records | Backend routers |
| **Domain Coordinator Scope** | Same as Domain Head with configurable visibility | Backend routers |
| **Region Head Scope** | Access to assigned regions + unassigned leads in domain | Backend routers |
| **Employee Scope** | Strictly own created/assigned records | Backend routers |
| **Configurable Visibility** | Global presets override default scope rules per role | `au-marketing-api/app/settings_utils.py` |

---

## 4. Domain & Region Management

### 4.1 Domains

| Feature | Description | Location |
|---------|-------------|----------|
| **Domain CRUD** | Create/edit/delete market domains with name, code, description | `pages/DomainFormPage.tsx`, `DomainsPage.tsx` |
| **Domain List** | Paginated, searchable domain list with hierarchy tree view | `pages/DomainsPage.tsx` |
| **Domain Hierarchy** | Tree view: Domain → Regions → Employee assignments | `pages/DomainsPage.tsx` |
| **Target Setting** | Set monthly/quarterly/yearly sales targets per domain | `au-marketing-api/app/routers/domains.py` |
| **Target Progress Bar** | Visual progress bar with quarterly segmentation, milestone markers | `pages/DomainsPage.tsx` |
| **Quotation Target Bar** | 4x stretch goal progress bar alongside base target | `pages/DomainsPage.tsx` |
| **Domain Head Assignment** | Assign domain head employee | `au-marketing-api/app/routers/domains.py` |
| **Domain Coordinator Assignment** | Assign domain coordinator employee | `au-marketing-api/app/routers/domains.py` |
| **Visibility Settings Card** | Preview As mode, live override presets for domain visibility | `pages/DomainsPage.tsx` |

### 4.2 Regions

| Feature | Description | Location |
|---------|-------------|----------|
| **Region CRUD** | Create/edit/delete regions with name, code, domain FK | `pages/RegionFormPage.tsx` |
| **Region List** | Paginated, filterable by domain, scope-filtered | `au-marketing-api/app/routers/regions.py` |
| **Region Search** | ILIKE search on region name | `au-marketing-api/app/routers/regions.py` |
| **Employee-Region Assignment** | Assign employees to regions with role (head/employee/coordinator) | `au-marketing-api/app/routers/regions.py` |
| **Region Target** | Set monthly targets per region | `au-marketing-api/app/routers/regions.py` |
| **Employee Worktank** | View employees with worktank data per region | `au-marketing-api/app/routers/regions.py` |

---

## 5. Core CRM Modules

### 5.1 Organizations & Plants

| Feature | Description | Location |
|---------|-------------|----------|
| **Organization CRUD** | Create/edit/delete organizations with name, code, industry, size, website | `pages/OrganizationFormPage.tsx` |
| **Organization List** | Paginated, searchable directory with scope filtering | `pages/OrganizationsPage.tsx` |
| **Organization Creation with Plants** | Create org + inline plants in single request | `au-marketing-api/app/routers/organizations.py` |
| **Plant CRUD** | Create/edit/delete plants with address, domain/region, location details | `au-marketing-api/app/routers/organizations.py` |
| **Plant List** | Filtered by organization, contact, or customer | `au-marketing-api/app/routers/plants.py` |
| **Plant Domain/Region** | Plants carry domain_id and region_id for auto-filling contact/customer | `au-marketing-api/app/models.py` (Plant) |
| **Tabs UI** | Organization tab and Plants tab in organization form | `pages/OrganizationFormPage.tsx` |

### 5.2 Contacts

| Feature | Description | Location |
|---------|-------------|----------|
| **Contact CRUD** | Create/edit/delete contact records | `pages/ContactFormPage.tsx` |
| **Contact List** | Paginated, searchable, scope-filtered contacts directory | `pages/ContactsPage.tsx` |
| **Contact Search** | Search by name, email, phone, company, notes, series code | `au-marketing-api/app/routers/contacts.py` |
| **Contact-to-Customer Conversion** | Convert contact to customer with is_converted flag | `au-marketing-api/app/routers/contacts.py` |
| **Plant Selection** | Pick/link a plant from linked organization | `pages/ContactFormPage.tsx` |
| **Domain/Region Auto-Derivation** | Contact's domain/region auto-filled from selected plant | `au-marketing-api/app/routers/contacts.py` |
| **Inline Organization + Plant Creation** | Create new org + plant on-the-fly during contact creation | `pages/ContactFormPage.tsx` |
| **Name Prefix** | Salutation selector (Mr., Mrs., Dr., etc.) | `pages/ContactFormPage.tsx` |
| **Phone with Country Code** | Country code selector + local number input | `pages/ContactFormPage.tsx` |

### 5.3 Customers

| Feature | Description | Location |
|---------|-------------|----------|
| **Customer CRUD** | Create/edit/delete customer records | `pages/CustomerFormPage.tsx` |
| **Customer List** | Paginated, searchable, scope-filtered customer directory | `pages/CustomersPage.tsx` |
| **Customer Search** | Search by company name, email, phone | `au-marketing-api/app/routers/customers.py` |
| **Domain/Region Assignment** | Customers assigned to domain and region | `au-marketing-api/app/models.py` (Customer) |
| **Primary Contact Link** | Link a contact as the primary contact for a customer | `pages/CustomerFormPage.tsx` |
| **Plant Selection** | Pick/link a plant for geographic location | `pages/CustomerFormPage.tsx` |
| **Inline Organization + Plant Creation** | Create new org + plant during customer creation | `pages/CustomerFormPage.tsx` |

### 5.4 Leads

| Feature | Description | Location |
|---------|-------------|----------|
| **Lead CRUD** | Create/edit/delete sales opportunities | `pages/LeadFormPage.tsx` |
| **Lead List** | Paginated, filterable by status/assigned_to/date/is_hot | `au-marketing-api/app/routers/leads.py` |
| **Lead Search** | Search leads by name, company, email, phone, notes | `au-marketing-api/app/routers/leads.py` |
| **Kanban Board** | Drag-and-drop pipeline view by status column | `pages/LeadsPage.tsx` |
| **Table View** | Traditional table view with sort/filter columns | `pages/LeadsPage.tsx` |
| **Cascading Dropdowns** | Domain → Region → Customer → Plant auto-filtering | `pages/LeadFormPage.tsx` |
| **Lead Types** | Categorization (Standard, Urgent, etc.) | `au-marketing-api/app/models.py` (LeadTypeOption) |
| **Lead Sources** | Attribution (Exhibition, Cold Call, Website, etc.) | `au-marketing-api/app/models.py` (LeadThroughOption) |
| **Status Pipeline** | Configurable status groups and options with hex colors | `au-marketing-api/app/routers/leads.py` |
| **Hot Lead Flag** | Priority marking for high-potential leads | `pages/LeadsPage.tsx` |
| **Follow-up Date** | Schedule follow-up with date/time picker | `pages/LeadFormPage.tsx` |
| **Quote Value** | Monetary value from attached quotations | `au-marketing-api/app/schemas.py` (LeadResponse.quote_value) |
| **Won/Lost Flow** | Final statuses with closed value entry | `pages/LeadFormPage.tsx` |
| **Inline Contact/Customer/Org/Plant Creation** | Create all linked entities on-the-fly during lead creation | `pages/LeadFormPage.tsx` |
| **Enquiry/Activity Log** | Per-lead activity timeline (notes, calls, emails, meetings) | `pages/LeadFormPage.tsx` |
| **Quotation Attachments** | Upload quotation files with quote value per attachment | `pages/LeadFormPage.tsx` |
| **Multiple Quotations** | Draft + list pattern for adding multiple quotations | `pages/LeadFormPage.tsx` |
| **Quotation Revision** | Revise quotations with (rev1, rev2) suffix numbering | `au-marketing-api/app/routers/leads.py` |

### 5.5 Orders

| Feature | Description | Location |
|---------|-------------|----------|
| **Order CRUD** | Create/edit/delete orders from won leads | `pages/OrderFormPage.tsx` |
| **Order List** | Kanban (default) and Table views for order pipeline | `pages/OrdersPage.tsx` |
| **Order Conversion** | Convert won lead to order | `au-marketing-api/app/routers/leads.py` |
| **Order Status Pipeline** | Configurable status groups and options | `au-marketing-api/app/routers/orders.py` |
| **PO Number** | Purchase order number tracking | `au-marketing-api/app/models.py` (Order) |
| **Order Activity Log** | Per-order activity timeline (notes, calls, emails, meetings) | `pages/OrderFormPage.tsx` |
| **Order Attachments** | File uploads per order activity | `au-marketing-api/app/routers/orders.py` |
| **Won/Lost Tabs** | Separate tab views for won and lost orders | `pages/OrdersPage.tsx` |

### 5.6 Quotations

| Feature | Description | Location |
|---------|-------------|----------|
| **Quotations List** | Paginated, scoped, sorted quotations view | `pages/QuotationsPage.tsx` |
| **Quotation Search** | Filter by lead, date range, sort options | `au-marketing-api/app/routers/quotations.py` |
| **Enquiry Quotations** | Quotations from enquiry attachments with lead/date filtering | `pages/EnquiryQuotationsPage.tsx` |

---

## 6. Sales Planning & Reports

### 6.1 Expected Order Reports

| Feature | Description | Location |
|---------|-------------|----------|
| **Monthly Expected Order Report** | Select hot leads as next-month expected orders | `pages/ExpectedOrderNewPage.tsx` |
| **Report List** | View submitted expected order reports with details | `au-marketing-api/app/routers/reports.py` |
| **Lead Selection** | Pick from hot leads with potential values | `pages/ExpectedOrderNewPage.tsx` |
| **CRUD Operations** | Create, view, delete expected order reports | `au-marketing-api/app/routers/reports.py` |

### 6.2 Outdoor/Duty Plan (OD Plan)

| Feature | Description | Location |
|---------|-------------|----------|
| **Monthly OD Plan** | Calendar-based monthly outdoor plan | `pages/ODPlanPage.tsx` |
| **Entry Types** | Visit, Travel, Return Home entries | `au-marketing-api/app/models.py` (ODPlanEntry) |
| **Inline Contact/Plant Creation** | Create contacts and plants during OD planning | `pages/ODPlanPage.tsx` |
| **CRUD Operations** | Create, view, edit, delete OD plans | `au-marketing-api/app/routers/reports.py` |
| **Date Navigation** | Month selector with prev/next | `pages/ODPlanPage.tsx` |

### 6.3 Daily Sales Report (DSR)

| Feature | Description | Location |
|---------|-------------|----------|
| **DSR Page** | Dedicated daily sales report page | `pages/DSRPage.tsx` |
| **Task Sources** | HRMS tasks + own leads/orders | `pages/DSRPage.tsx` |
| **Date Presets** | Today, This Week, This Month filters | `pages/DSRPage.tsx` |
| **Pending/Completed Groups** | Separate sections for pending vs completed tasks | `pages/DSRPage.tsx` |
| **Navbar Quick Access** | DSR dropdown with pending count badge | `components/ui/Navbar.tsx` |

### 6.4 My Team

| Feature | Description | Location |
|---------|-------------|----------|
| **Team Overview** | Aggregated team performance view | `pages/MyTeamPage.tsx` |
| **Scope Pills** | All / Domain / Region scope toggles | `pages/MyTeamPage.tsx` |
| **Aggregate KPI Cards** | Combined team metrics per scope | `pages/MyTeamPage.tsx` |
| **Performance Summary** | Merged per-employee report summary | `pages/MyTeamPage.tsx` |
| **Team Breakdown Table** | Employee, Target, Achieved, %, Won, Lost | `pages/MyTeamPage.tsx` |
| **Date Filters** | This Quarter, This Year presets | `pages/MyTeamPage.tsx` |
| **Employee Selector** | "My Data" option + per-employee dropdown | `pages/MyTeamPage.tsx` |
| **Dynamic Labels** | Target label adapts to selected date range | `pages/MyTeamPage.tsx` |
| **Sync Button** | Clear scope cache and refresh | `pages/MyTeamPage.tsx` |

### 6.5 Standard Reports

| Feature | Description | Location |
|---------|-------------|----------|
| **Report Summary** | Inquiries, quotations, leads-by-status metrics | `au-marketing-api/app/routers/reports.py` |
| **Report Scope** | Employee list with domains/regions for report access | `au-marketing-api/app/routers/reports.py` |
| **Inquiries by Type** | Activity type breakdown analysis | `au-marketing-api/app/routers/reports.py` |
| **Employee Leaderboard** | Performance ranking across employees | `au-marketing-api/app/routers/reports.py` |

### 6.6 Custom Report Templates

| Feature | Description | Location |
|---------|-------------|----------|
| **SQL-Based Templates** | Create report templates with SQL queries | `au-marketing-api/app/routers/report_templates.py` |
| **Named Sections** | Each section runs its own SQL query | `au-marketing-api/app/routers/report_templates.py` |
| **Entity Placeholders** | Dynamic scope injection (lead_id, domain_id, etc.) | `au-marketing-api/app/routers/report_templates.py` |
| **Template Assignments** | Assign templates to specific employees | `au-marketing-api/app/routers/report_templates.py` |
| **AI Scope Detection** | Auto-detect scope for template execution | `au-marketing-api/app/routers/report_templates.py` |

---

## 7. Events Module

### 7.1 Event Management

| Feature | Description | Location |
|---------|-------------|----------|
| **Event CRUD** | Create/edit/delete exhibition and roadshow events | `pages/EventFormPage.tsx` |
| **Event List** | Paginated, type-filtered, searchable event list | `pages/EventsListPage.tsx` |
| **Event Types** | Exhibition / Roadshow type toggle | `pages/EventFormPage.tsx` |
| **Domain Assignment** | Events scoped to a domain | `pages/EventFormPage.tsx` |
| **Multi-Tab Detail** | Overview, Space Booking, Stall Design, Banner, Table Booking, Travel, Hotel, Local Travel, Gifting, Analysis | `pages/EventDetailPage.tsx` |

### 7.2 Space Booking & Payments

| Feature | Description | Location |
|---------|-------------|----------|
| **Space Booking** | Booth/space booking with total amount | `pages/EventDetailPage.tsx` |
| **Payment Entries** | Date, amount, paid checkbox, delete per entry | `pages/EventDetailPage.tsx` |
| **Payment Summary** | Total, Paid, Remaining summary bar | `pages/EventDetailPage.tsx` |
| **Payment Status Badge** | Auto-computed from entries (Paid/Partial/Pending) | `pages/EventDetailPage.tsx` |
| **PI Sent Checkbox** | Proforma Invoice sent tracking | `pages/EventDetailPage.tsx` |

### 7.3 Table Booking (Roadshow)

| Feature | Description | Location |
|---------|-------------|----------|
| **Table Booking** | Count × cost per table = total cost | `pages/EventDetailPage.tsx` |
| **Auto-Recalculate** | Total auto-updates on count or cost change | `au-marketing-api/app/routers/events.py` |

### 7.4 Event Files

| Feature | Description | Location |
|---------|-------------|----------|
| **Categorized Uploads** | Stall Design, Banner Design, Travel Tickets, Local Travel Proofs | `au-marketing-api/app/models.py` (EventFile) |
| **File Selection** | Mark a file as "selected" per category | `au-marketing-api/app/routers/events.py` |
| **File Download** | Secure download per file | `au-marketing-api/app/routers/events.py` |
| **File Delete** | Remove uploaded files | `au-marketing-api/app/routers/events.py` |

### 7.5 Visitors & Allocation

| Feature | Description | Location |
|---------|-------------|----------|
| **Visitors Tab** | Visitor management with inline form editing | `pages/EventDetailPage.tsx` |
| **Contact Search** | Async search to auto-fill visitor details from CRM contacts | `pages/EventDetailPage.tsx` |
| **Employee Allocation** | Assign visitors to employees | `pages/EventDetailPage.tsx` |
| **Check-in Tracking** | Mark visitors as checked-in | `pages/EventDetailPage.tsx` |
| **Status Badges** | Visitor status indicators | `pages/EventDetailPage.tsx` |
| **Visitor-to-Contact Linking** | Auto-link visitors to CRM contacts on allocation | `au-marketing-api/app/routers/events.py` |
| **Allocation Notifications** | In-app + Web Push notification to assigned employee | `au-marketing-api/app/routers/events.py` |

---

## 8. Dashboard System

### 8.1 Ready-Made Dashboard Widgets

| Widget | Type | Description | Location |
|--------|------|-------------|----------|
| **Monthly Target** | target-card | Target vs achieved KPI card | `pages/DashboardPage.tsx` |
| **Regional Head Summary** | head-summary | Domain/region head aggregated stats | `pages/DashboardPage.tsx` |
| **Performer of the Month** | performer-of-month | Top employee highlight card | `pages/DashboardPage.tsx` |
| **Recent Leads** | activity-table | Table of latest leads | `pages/DashboardPage.tsx` |
| **Quick Links** | global-reach | Navigation shortcut buttons | `pages/DashboardPage.tsx` |
| **Recent Audit Logs** | audit-logs | Timeline of recent audit entries | `pages/DashboardPage.tsx` |
| **What's New** | changelog | Latest release notes | `pages/DashboardPage.tsx` |

### 8.2 Ready-Made Charts

| Chart | Type | Description |
|-------|------|-------------|
| **Leads by Region** | bar chart | Leads grouped by region visualization |
| **Quotations Submitted** | bar chart | Quotation submission statistics |
| **Target vs Achieved** | bar chart | Target vs actual comparison |
| **Won vs Lost** | pie chart | Win/loss ratio |
| **Leads by Status** | pie chart | Pipeline stage distribution |
| **Inquiries & Quotations** | bar chart | Activity comparison |
| **Revenue Overview** | area chart | Revenue trend over time |
| **Activity & Goal** | goal chart | Goal completion tracking |

### 8.3 Custom Dashboard Builder

| Feature | Description | Location |
|---------|-------------|----------|
| **Saved Dashboards** | User-created dashboards with custom widget layout | `au-marketing-api/app/routers/saved_dashboards.py` |
| **Resizable Grid** | Drag-resize widgets in a CSS grid layout | `pages/DashboardPage.tsx` |
| **Widget Types** | Bar Chart, Pie Chart, Area Chart, Table, Stat Card, HTML/JS, SQL Query | `pages/DashboardPage.tsx` |
| **Custom SQL Widgets** | SQL queries returning JSON for chart rendering | `au-marketing-api/app/routers/saved_dashboards.py` |
| **Dashboard Assignments** | Assign dashboards to employees or roles | `au-marketing-api/app/routers/saved_dashboards.py` |
| **Dashboard Persistence** | Last selected dashboard saved to localStorage | `pages/DashboardPage.tsx` |
| **Widget Edit Modal** | Edit widget title, type, SQL query, time grouping | `pages/DashboardPage.tsx` |
| **KPI Number Cards** | Gradient-styled stat cards with icons | `components/ui/ChartsSection.tsx` |
| **SVG Chart Gradients** | Premium linear gradient fills for all chart types | `components/ui/ChartsSection.tsx` |

### 8.4 Dashboard KPIs

| KPI | Description |
|-----|-------------|
| Monthly Target | Current month target amount |
| Achieved this Month | Closed value from won leads |
| Won Leads Count | Number of won leads this month |
| Lost Leads Count | Number of lost leads this month |
| Fiscal Year Progress | YTD progress against annual target |
| Conversion Rate | Lead-to-order conversion percentage |
| Hot Leads | High-priority lead count |
| Team Performance | Aggregated team metrics |

---

## 9. Campaigns

| Feature | Description | Location |
|---------|-------------|----------|
| **Campaign CRUD** | Create/edit/delete marketing campaigns | `au-marketing-api/app/routers/campaigns.py` |
| **Status Tracking** | Campaign status enum (Planning, Active, Completed, Cancelled) | `au-marketing-api/app/models.py` |
| **Domain Budget** | Per-domain budget tracking | `au-marketing-api/app/models.py` |
| **Lead Linking** | Link leads to campaigns for attribution | `au-marketing-api/app/models.py` (CampaignLead) |

---

## 10. Notifications System

| Feature | Description | Location |
|---------|-------------|----------|
| **In-App Notifications** | Notification center with read/unread state | `au-marketing-api/app/routers/notifications.py` |
| **Unread Count** | Badge counter in navbar | `au-marketing-api/app/routers/notifications.py` |
| **Mark Read** | Single and bulk mark-as-read | `au-marketing-api/app/routers/notifications.py` |
| **Web Push Notifications** | Firebase Cloud Messaging integration | `lib/firebase-push.ts` |
| **Device Registration** | Register/unregister browser devices | `au-marketing-api/app/routers/notifications.py` |
| **Notification Preferences** | Per-user notification type toggles | `au-marketing-api/app/routers/notifications.py` |
| **Trigger Sources** | Follow-up reminders, event allocation, status changes | Multiple routers |

---

## 11. Numbering Series

| Feature | Description | Location |
|---------|-------------|----------|
| **Series CRUD** | Create/edit/delete numbering series | `pages/NumberingSeriesPage.tsx` |
| **Pattern Builder** | Placeholder-based patterns: {YYYY}, {MM}, {DD}, {0:N}, {S:code} | `au-marketing-api/app/routers/series.py` |
| **Entity Placeholders** | {contact.domain_code}, {customer.company_name}, etc. | `au-marketing-api/app/routers/series.py` |
| **Sub-Series References** | Reference another series with {S:code} | `au-marketing-api/app/routers/series.py` |
| **Preview** | Real-time generated number preview | `pages/NumberingSeriesPage.tsx` |
| **Next Value Generation** | Auto-increment with reset logic | `au-marketing-api/app/routers/series.py` |

---

## 12. Settings & Administration

### 12.1 Marketing Settings

| Feature | Description | Location |
|---------|-------------|----------|
| **Visibility Presets** | Strict Isolation, Balanced, Open Team, Coordinator-Led | `au-marketing-api/app/routers/settings.py` |
| **Per-Role Overrides** | view_other_domains, view_other_regions per role/domain | `au-marketing-api/app/settings_utils.py` |
| **Settings Versioning** | Version header for cache busting | `au-marketing-api/app/routers/settings.py` |

### 12.2 What's New / Changelog

| Feature | Description | Location |
|---------|-------------|----------|
| **Version CRUD** | Admin create/edit/delete changelog versions | `au-marketing-api/app/routers/whats_new.py` |
| **Sections** | Group updates (Features, Bug Fixes, Improvements) | `au-marketing-api/app/routers/whats_new.py` |
| **Dashboard Widget** | Latest version displayed on dashboard | `pages/DashboardPage.tsx` |
| **Versions Modal** | Full changelog history with markdown rendering | `components/VersionsModal.tsx` |
| **Admin Panel** | Versions management tab in Settings | `components/ui/VersionsSettings.tsx` |

### 12.3 Employee Sync

| Feature | Description | Location |
|---------|-------------|----------|
| **Marketing Employee Cache** | Local caching of HRMS employee metadata | `au-marketing-api/app/models.py` (MarketingEmployee) |
| **HRMS Sync** | One-click sync of marketing-relevant employees | `au-marketing-api/app/routers/employees.py` |
| **Sync Results Table** | Collapsible results with name, role badge, domain/region | `pages/SettingsPage.tsx` |
| **Local Employee CRUD** | View and update cached employee records | `au-marketing-api/app/routers/employees.py` |
| **Auto-Population** | Auto-populate on region assignment and domain head/coordinator set | Multiple routers |

### 12.4 User Profile

| Feature | Description | Location |
|---------|-------------|----------|
| **Profile View** | Username, email, roles display | `pages/SettingsPage.tsx` |
| **Permission Refresh** | One-click permission refresh from HRMS | `pages/SettingsPage.tsx` |
| **Email Connection** | Connect/disconnect Gmail | `pages/SettingsPage.tsx` |

### 12.5 Database Schema Browser

| Feature | Description | Location |
|---------|-------------|----------|
| **Schema Page** | Browse all database tables, columns, foreign keys | `pages/SchemaPage.tsx` |
| **ER Diagram View** | Visual entity-relationship diagram | `pages/SchemaPage.tsx` |

---

## 13. Integrations

### 13.1 HRMS Integration

| Feature | Description | Location |
|---------|-------------|----------|
| **Authentication** | Login via HRMS RBAC API | `au-marketing-api/app/routers/auth.py` |
| **Permission Check** | Single and bulk permission verification | `au-marketing-api/app/dependencies.py` |
| **Employee Fetch** | Get employee list, departments, designations | `au-marketing-api/app/routers/employees.py` |
| **Role Resolution** | Resolve user role from HRMS data | `au-marketing-api/app/rbac.py` |
| **Pending Approval** | Support for pending role/permission workflow | `au-marketing-api/app/rbac.py` |

### 13.2 Email Integration (Gmail)

| Feature | Description | Location |
|---------|-------------|----------|
| **Gmail OAuth** | OAuth 2.0 connection flow | `au-marketing-api/app/routers/auth.py` |
| **Send Email** | Send emails via connected Gmail | `au-marketing-api/app/routers/auth.py` |
| **Connection Status** | Check if Gmail is connected | `au-marketing-api/app/routers/auth.py` |
| **Test Email** | Verify connection with test send | `au-marketing-api/app/routers/auth.py` |

### 13.3 Storage Integration

| Feature | Description | Location |
|---------|-------------|----------|
| **AWS S3** | Cloud file storage for uploads | `au-marketing-api/app/storage.py` |
| **Local Storage** | Filesystem fallback for development | `au-marketing-api/app/storage.py` |
| **Secure Downloads** | Authenticated file download URLs | Multiple routers |

---

## 14. Database & Schema

### 14.1 Core CRM Tables (40+ Models)

| Table | Records |
|-------|---------|
| **Domain** | Market isolation (Domestic, Export, etc.) |
| **Region** | Geographic sub-divisions |
| **Organization** | Parent companies |
| **Plant** | Specific locations |
| **Contact** | Person records |
| **Customer** | Verified business accounts |
| **Lead** | Sales opportunities |
| **LeadStatusGroup / LeadStatusOption** | Pipeline configuration |
| **LeadTypeOption / LeadThroughOption** | Lead categorization |
| **Order** | Closed/won business |
| **OrderStatusGroup / OrderStatusOption** | Order pipeline |
| **Activity** | Enquiry log entries |
| **ActivityAttachment** | File uploads with quote values |
| **Campaign / CampaignLead** | Marketing campaigns |
| **EmployeeRegionAssignment** | Employee-region linking |
| **MarketingEmployee** | HRMS employee cache |
| **EmployeeMonthlyTarget / RegionMonthlyTarget / DomainMonthlyTarget** | Target tracking |
| **ExpectedOrderReport / ExpectedOrderReportLead** | Expected order reports |
| **ODPlanReport / ODPlanEntry** | Outdoor plans |
| **ExhibitionEvent / EventFile** | Event management |
| **StallVendor / Installment** | Event vendor & payments |
| **Notification / NotificationDevice / UserNotificationPreference** | Notifications |
| **AuditLog** | Audit trail |
| **Series** | Numbering series |
| **ReportTemplate / ReportTemplateAssignment** | Custom reports |
| **SavedDashboard / SavedDashboardAssignment** | Dashboard system |
| **MarketingSettings / MarketingSettingsAuditLog** | Settings |
| **ChangelogVersion** | Release notes |
| **UserEmailConnection** | Gmail OAuth |
| **EmployeeTask** | Manual/auto tasks |
| **Employee** | Marketing employee data |

---

## 15. Frontend Page Inventory

| Route | Page | Type |
|-------|------|------|
| `/login` | LoginPage | Auth |
| `/dashboard` | DashboardPage | Home |
| `/contacts` | ContactsPage | CRM |
| `/contacts/new` | ContactFormPage | CRM |
| `/contacts/:id/edit` | ContactFormPage | CRM |
| `/customers` | CustomersPage | CRM |
| `/customers/new` | CustomerFormPage | CRM |
| `/customers/:id/edit` | CustomerFormPage | CRM |
| `/leads` | LeadsPage | CRM |
| `/leads/new` | LeadFormPage | CRM |
| `/leads/:id/edit` | LeadFormPage | CRM |
| `/orders` | OrdersPage | CRM |
| `/orders/new` | OrderFormPage | CRM |
| `/orders/:id/edit` | OrderFormPage | CRM |
| `/quotations` | QuotationsPage | CRM |
| `/enquiry-quotations` | EnquiryQuotationsPage | CRM |
| `/organizations` | OrganizationsPage | Org |
| `/organizations/new` | OrganizationFormPage | Org |
| `/organizations/:id/edit` | OrganizationFormPage | Org |
| `/domains` | DomainsPage | Admin |
| `/domains/new` | DomainFormPage | Admin |
| `/domains/:id/edit` | DomainFormPage | Admin |
| `/domains/:domainId/regions/new` | RegionFormPage | Admin |
| `/domains/:domainId/regions/:regionId/edit` | RegionFormPage | Admin |
| `/events` | EventsListPage | Events |
| `/events/new` | EventFormPage | Events |
| `/events/:id` | EventDetailPage | Events |
| `/events/:id/edit` | EventFormPage | Events |
| `/reports` | ReportsPage | Reports |
| `/report-templates` | ReportTemplatesPage | Reports |
| `/expected-orders/new` | ExpectedOrderNewPage | Reports |
| `/od-plan` | ODPlanPage | Reports |
| `/my-team` | MyTeamPage | Reports |
| `/dsr` | DSRPage | Reports |
| `/settings` | SettingsPage | Admin |
| `/roles` | RolesPage | Admin |
| `/series` | NumberingSeriesPage | Admin |
| `/schema` | SchemaPage | Admin |
| `/support` | SupportPage | Admin |
| `/employees` | EmployeesPage | Admin |
| `/inventory` | InventoryPage | Misc |
| `/financials` | FinancialsPage | Misc |

---

## 16. Backend Endpoint Inventory

| Router | Endpoints | Entity |
|--------|-----------|--------|
| **auth.py** | 8 | Login, logout, profile, Gmail OAuth, test email |
| **leads.py** | 24 | Lead CRUD, search, status groups/options, types, sources, activities, attachments, convert |
| **contacts.py** | 7 | Contact CRUD, search, convert-to-customer |
| **customers.py** | 6 | Customer CRUD, search |
| **orders.py** | 16 | Order CRUD, status groups/options, activities, attachments |
| **domains.py** | 9 | Domain CRUD, hierarchy, target summary, target set |
| **regions.py** | 11 | Region CRUD, assignments, targets, worktank |
| **organizations.py** | 5 | Organization CRUD |
| **plants.py** | 1 | Plant list |
| **dashboard.py** | 5 | Target stats, head summary, performer, fiscal year progress, scope stats |
| **reports.py** | 12 | Scope, summary, expected orders CRUD, OD plans CRUD, inquiries, leaderboard |
| **campaigns.py** | 5 | Campaign CRUD |
| **events.py** | 10 | Event CRUD, file upload/download/delete/select, end event |
| **quotations.py** | 1 | Quotations list |
| **notifications.py** | 8 | List, unread count, mark read, device register, preferences |
| **tasks.py** | 5 | Task list, create, complete, update, delete |
| **series.py** | 8 | Series CRUD, generate number |
| **employees.py** | 7 | HRMS employee list, departments, designations, local CRUD, sync |
| **settings.py** | 2 | Get/update marketing settings |
| **saved_dashboards.py** | 9 | Dashboard CRUD, assignments, execute |
| **report_templates.py** | 9 | Template CRUD, assignments, assignable users |
| **audit_logs.py** | 1 | Audit logs list |
| **schema.py** | 1 | Database schema |
| **whats_new.py** | 4 | Changelog versions CRUD |

---

*Generated from codebase audit — July 2026*
