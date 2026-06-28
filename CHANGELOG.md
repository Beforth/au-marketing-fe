# 📋 Changelog — AP | S&M Module

All notable changes to the **au-marketing-fe** project are documented here.  
Format: `[Date] — Category: Description`

---

## [2026-06-28] — Typography Cleanup & Design System Overhaul (v1.1.1)

### 🖥️ Frontend

#### Typography Overhaul
- **Font**: Added Inter (weights 400–700) as secondary font family alongside Outfit.
- **Removed `font-black` (900)** across the entire app — replaced with `font-semibold` (labels, table headers, breadcrumbs, badges, nav) or `font-bold` (titles, section headers, KPI values).
- **Removed `uppercase`** from all labels, badges, breadcrumbs, buttons, card titles, and nav items — text is now sentence-case everywhere.
- **Removed custom pixel sizes** (`text-[9px]`, `text-[10px]`, `text-[11px]`) — all text uses standard Tailwind scale (`text-xs`, `text-sm`, `text-base`).
- **Removed `tracking-widest`** — only `tracking-tight` (page title) and `tracking-wider` (table headers) remain.

#### Component Updates
- **Card**: Title → `text-base font-semibold text-slate-900`, Description → `text-sm text-slate-500 font-medium`.
- **Form labels** (Select, DatePicker, Input, Label): `text-sm font-medium text-slate-500` (was `text-[11px] font-black uppercase tracking-widest`).
- **Table headers**: `text-xs font-semibold text-slate-500 uppercase tracking-wider` (was `text-[11px] font-black uppercase tracking-widest`).
- **Breadcrumbs**: `text-xs font-semibold text-slate-500` (was `font-black uppercase tracking-widest`).
- **Page title**: `text-4xl font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap` (was `text-2xl font-semibold`).
- **Page description**: `text-sm text-slate-500 font-medium` with `gap-1` spacing from title.
- **KPI card labels**: `text-xs font-semibold text-slate-500` (no uppercase/tracking).
- **DatePicker**: Cleaned up button typography, primary color changed from CSS vars to `blue-600`.
- **Badges**: Stripped custom typography — use variant-based color only.

#### Layout
- **DashboardLayout**: Replaced dynamic CSS variable padding with static `pt-[1.5625rem] pb-[0.625rem]`, added subtle grid background pattern.
- **Removed ThemeProvider**: Stripped `ThemeContext.tsx` and all density CSS variables (`--ui-padding`, `--ui-gap`, `--ui-radius`).

#### Page Descriptions
- **EventsListPage**: Added `description="Manage marketing events and roadshows."`.
- **EventDetailPage**: Added `description="Event details and attendee management."`.

#### Documentation
- **design.md**: Full rewrite to reflect all typography, component, and layout changes.

### 📁 Files Changed
| File | Change |
|------|--------|
| `App.tsx` | Removed ThemeProvider wrapper |
| `context/ThemeContext.tsx` | Deleted entire file |
| `index.html` | Added Inter font |
| `components/layout/DashboardLayout.tsx` | Static padding, grid background |
| `components/layout/PageLayout.tsx` | Title/description typography, gap fix |
| `UI/Badge.tsx` | Stripped font-black/uppercase |
| `UI/Breadcrumb.tsx` | font-black → font-semibold, removed uppercase/tracking |
| `UI/Card.tsx`, `components/ui/Card.tsx` | Title: text-base font-semibold, description: text-sm font-medium |
| `UI/DatePicker.tsx`, `components/ui/DatePicker.tsx` | Button typography cleanup, css vars → blue-600 |
| `UI/Input.tsx`, `components/ui/Input.tsx` | Label typography, focus colors |
| `UI/Label.tsx`, `components/ui/Label.tsx` | text-sm font-medium |
| `UI/Modal.tsx`, `components/ui/ConfirmModal.tsx` | Title font-bold, removed uppercase |
| `UI/Select.tsx` | Label typography, focus ring colors |
| `UI/Table.tsx` | Header font-semibold, removed tracking-widest |
| `components/ProtectedRoute.tsx` | Cleaned up leftover typography |
| `components/VersionsModal.tsx`, `components/ui/VersionsSettings.tsx` | font-black → font-semibold/bold, removed uppercase |
| `components/ui/AsyncSelect.tsx` | font-black → font-semibold |
| `components/ui/ChartsSection.tsx` | font-black → font-bold, removed uppercase |
| `components/ui/Navbar.tsx` | Button labels: text-sm font-semibold, removed uppercase/tracking |
| `components/ui/SearchInput.tsx` | Input text-[13px], focus colors |
| `components/ui/calendar.tsx` | font-black → font-semibold |
| `pages/DashboardPage.tsx` | KPI card gradient labels, chart cleanups |
| `pages/DomainsPage.tsx` | Removed uppercase/tracking-widest |
| `pages/EventDetailPage.tsx` | Added description |
| `pages/EventsListPage.tsx` | Added description |
| `pages/FinancialsPage.tsx` | Label/header typography cleanup |
| `pages/InventoryPage.tsx` | Label/header typography cleanup |
| `pages/LeadFormPage.tsx` | Label/header typography cleanup |
| `pages/LeadsPage.tsx` | Label/header typography cleanup |
| `pages/LoginPage.tsx` | Label/header typography cleanup |
| `pages/NumberingSeriesPage.tsx` | Label/header typography cleanup |
| `pages/QuotationsPage.tsx` | Label/header typography cleanup |
| `pages/RolesPage.tsx` | Label/header typography cleanup |
| `pages/SettingsPage.tsx` | Label/header typography cleanup |
| `pages/SupportPage.tsx` | Label/header typography cleanup |
| `design.md` | Full rewrite |

### 🎪 Events Module — Visitors & Domain Scoping
- **Visitors Tab**: Added to both Exhibition and Roadshow event detail pages with inline form editing, Async Contact Search (auto-fills name/email/phone/company/job), Employee Allocation selector, Checked-in tracking, and status badges.
- **Domain Selection**: Added Domain dropdown to Event form (defaults to user's primary domain, read-only when editing).
- **Permission Migration**: Renamed all permission checks from `exhibition.*` → `events.*` across frontend (sidebar, pages, constants) and backend.

### 🔐 CRM Access Scoping & Allocation Sync
- **Contact Visibility**: Updated query logic so employees see contacts they created OR are explicitly assigned/allocated to.
- **Visitor-to-Contact Linking**: Update route auto-links visitors to CRM contacts, synchronizes allocation, and triggers in-app + Web Push notification to the assigned employee.
- **Unallocation Handling**: Clears DB assignment fields instantly when visitor is unallocated.
- **Scoping Rules**: Updated `ROLE_SCOPING_RULES.md` with new contact visibility rules.

### 💳 Space Booking & Table Booking
- **Space Booking Overhaul**: Renamed "Amount Paid (₹)" → "Total Amount (₹)". Replaced installments section with Payment Entries (date, amount, paid checkbox, delete). Added summary bar (Total, Paid, Remaining). Auto-calculated payment status badge. PI Sent checkbox disabled with "Work in progress" note.
- **Backend**: Added `space_booking_paid_amount` column. Payment status auto-computed from entries.
- **Table Booking Total Cost Fix**: Backend now recalculates `table_booking_total_cost = count × cost_per_table` on update.

### 🔧 Backend Improvements
- **Database Migrations**: Fixed startup migrations to run in isolated transaction blocks (one failure no longer aborts others). Added `space_booking_paid_amount` migration.
- **Error Handler**: Cleaned up global exception to parse column-missing errors into short messages instead of raw SQL.
- **Models**: Added `domain_id` (FK) and `visitors` (JSONB) columns to events table.

### 🖥️ Frontend Polish
- **PdfPreviewModal**: Extracted into shared `components/ui/PdfPreviewModal.tsx`. Added preview buttons to `EnquiryQuotationsPage` and `LeadFormPage` with `getLeadActivityAttachmentUrl()` API method.
- **Download Buttons**: Added to all event file rows (stall design, banner design, travel tickets, local travel proofs).
- **DatePicker**: Reduced calendar popup from 340px → 280px, tighter padding and smaller typography.
- **Domain dropdown**: Pre-fetches all active domains on mount for instant open (no API call on every click).
- **Form layout**: Event Type toggle moved above Domain dropdown; Name + Location in 2-col grid.

### 📄 Documentation
- **HRMS RBAC Docs**: Consolidated API endpoint references into `HRMS_RBAC_AND_PERMISSIONS.md`. Deleted stale `HRMS_RBAC_API_DOC.md` and `HRMS_RBAC_API_SUMMARY.md`.
- **Scoping Rules**: Updated `ROLE_SCOPING_RULES.md` with new visibility and allocation rules.

### 🧹 Chores
- Version bumped to 1.1.0 (FE `package.json`, BE `main.py`)

---

## [2026-06-19] — Action Icon Consistency, Visual Upload Progress Bars, Kanban Card Quote Values & Seed Script (v1.0.10)

### 🖥️ Frontend

#### Features
- **Visual File Upload Progress Bars**: Implemented clean, non-distracting 4px horizontal progress bars in the modal footers and form actions for a high-fidelity visual indication of uploading files (initial quotation uploads, logs, attachments, status changes, and Won PO files).
- **Live Upload Percentages**: Upload buttons now render dynamic percentages (e.g. `Uploading (45%)...`) based on standard progress events.
- **Kanban Card Quote Values**: Upgraded the Kanban board to dynamically fetch and prioritize a lead's quotation-derived `quote_value` (stamped with a blue `Quote` badge), falling back to the Estimated potential value with an `Est` badge when no quotations exist.

#### Improvements
- **Unified Action Icon Design (All Table Pages)**: Standardised all table action icon buttons across every page to match the Organizations page reference design — `variant="ghost"` + `size="xs"`, `w-8 h-8 p-0`, `hover:bg-transparent`, `transition-colors`, and every icon wrapped in `<Tooltip>`. Replaced raw HTML `title=` attributes on `OrdersPage` icon buttons with proper `<Tooltip>` wrappers.
- **Streamlined Date Presets & Skeleton Loaders (Leads Page)**: Refactored the bulky inline date pickers into a clean dropdown preset selector ("Today", "Yesterday", "This Month", etc.), revealing custom date fields only when selected. Initialized the reports scope state synchronously from the cached marketing scope to prevent initial load blinks and render fast CSS skeletons.
- **Client-Side Kanban Search Fallback**: Implemented robust client-side search filtering on the Kanban board to bypass backend limitations with joined customer/contact fields, allowing immediate searching by name, email, company, and notes.
- **Context-Aware Empty Search States**: Redesigned the Kanban board empty state to show a friendly "No results for..." message with a clear button when searching, instead of the default database empty state.
- **Unified Page Descriptions**: Added a description prop to the Contacts page layout so that it matches the other database pages (Organizations, Customers) and looks unified.
- **Premium Settings Audit Logs Table**: Refactored the Settings page Audit Logs table to utilize the core `<DataTable>` and `<Pagination>` components, matching the premium table styling of the Organizations and Customers pages. Defined standard column renderers for formatted timestamps, user initial avatars, action status pills, and inline entity badges with word-wrapping details.
- **Server-Side Audit Logs Search**: Implemented a debounced search handler in `SettingsPage` that triggers server-side queries to filter logs by user, action, entity type, or description details.

### ⚙️ Backend (API)

#### Features
- **Computed Lead Quote Value**: Updated the backend Pydantic schemas and endpoints (`get_leads`, `get_lead`, and `update_lead`) to query the total sum of `ActivityAttachment.quote_value` for each lead and populate the new `quote_value` field dynamically.
- **Detailed DB Constraint Errors**: Enhanced the global exception handler to extract and append specific PostgreSQL constraint `DETAIL` blocks to client-facing error messages for unique and foreign key violations.
- **Contacts API Search Support**: Added the missing `search` parameter and query logic to `GET /api/contacts/` on the backend so that the Contacts table search bar filters results by name, email, phone, company, notes, and series code.
- **Audit Logs API Search Support**: Added the missing `search` parameter and query logic to `GET /api/audit-logs/` on the backend so that the audit logs table search bar filters results by details, employee name, action, or entity type.

### 📁 Files Changed
| File | Change |
|------|--------|
| `lib/api.ts` | Added `postFormDataWithProgress` using `XMLHttpRequest` |
| `lib/marketing-api.ts` | Added `onProgress` callback to `uploadLeadActivityAttachments`, `quote_value` to `Lead` type, and `search` to `getAuditLogs` |
| `pages/LeadFormPage.tsx` | Integrated progress bars for initial quotes, logs, and attachments |
| `pages/LeadsPage.tsx` | Added progress bars to Kanban changes & Won PO modals; updated Kanban card value rendering |
| `pages/OrdersPage.tsx` | Replaced `title=` attr on Eye/Trash2 action icons with `<Tooltip>` wrappers; normalised `gap-1` |
| `pages/ContactsPage.tsx` | Added descriptive subtitle/description parameter to PageLayout |
| `pages/SettingsPage.tsx` | Refactored Audit Logs tab to use DataTable, Pagination, and SearchInput with debounce search |
| `au-marketing-api/app/config.py` | Bumped API version to `1.0.10` |
| `au-marketing-api/app/main.py` | Parsed PostgreSQL constraint detail blocks for clearer client errors |
| `au-marketing-api/app/schemas.py` | Added `quote_value` to `LeadResponse` schema |
| `au-marketing-api/app/routers/leads.py` | Query and populate `quote_value` in lead responses |
| `au-marketing-api/app/routers/contacts.py` | Implemented query-based contact search filtering |
| `au-marketing-api/app/routers/audit_logs.py` | Implemented query-based audit logs search filtering |
| `au-marketing-api/.server-operator/seed_dashboards.serop` | Added dashboard seed command script |

---

## [2026-06-15] — Dynamic Version Changelog System, Unified Loaders & Auth Session Fix (v1.0.9)

### 🖥️ Frontend

#### Features
- **Dynamic Versions Modal**: Replaced the static hardcoded modal with a dynamic overlay that fetches releases from the database. Shows the latest version by default with an inline button to expand historical releases.
- **Markdown Text Parsing**: Compiles standard inline markdown syntax like `**bold text**` and `` `code blocks` `` into high-fidelity React DOM strong/code tags.
- **Admin CRUD Interface**: Added a "Versions" tab under Settings (restricted to admins) to manage releases: adding, editing, and deleting versions, sections, and bullet points directly from the UI.
- **Audit Logs Tab in Settings**: Added a new "Audit Logs" tab displaying a timeline of all user actions across the app. Redesigned with custom table-row skeletons (`animate-pulse`), a Lucide-history empty state, font-black uppercase headers, and active click scaling.
- **Versions Modal Shimmer**: Replaced the versions modal spinning loader with a premium, brand-colored shimmer sweep animation (`#eff6ff` and `#dbeafe`).
- **My Team Localized Shimmer Loader**: Replaced page-wide loaders and card spinners with localized, inline brand shimmers on target metrics, summary items, list blocks, and dropdown selectors to keep the layout visible during loading.
- **Dashboard Widget Improvements**: Restructured the Add Widget dropdown to group and separate Ready-Made widgets from custom Builders. Exposed the new **Recent Audit Logs (Timeline)** and **What's New (Release Notes)** directly as dashboard widgets with custom skeleton loaders.
- **Component Cleanup**: Deleted all deprecated static duplicates (`ChangelogContent.tsx`, `ChangelogModal.tsx`, `changelog.ts`).

#### Improvements
- **Unified Spinner Design**: Replaced all inconsistent loading indicators (Lucide `Loader2`, `RefreshCw` spinners, `border-t-transparent` CSS) with a single blue arc spinner (`border-b-2 border-blue-600`) across all 15 pages and `Button.tsx`.
- **Button Loader**: `Button.tsx` spinner now uses `border-current` to auto-inherit button text color (white for primary/danger, slate for outline/ghost).
- **Domains Page — No Loader**: Removed all loading spinners and skeleton from the Domains page entirely — renders instantly.

#### Bug Fixes
- **Auth Session Reload Flash**: Fixed a race condition in `authSlice.ts` where refreshing with an expired token would briefly flash the dashboard, fire multiple API calls, and show error toasts before redirecting to login.
- **Invalid Tailwind Class**: Fixed `h-4.5 w-4.5` (non-existent class) on the Gmail connection spinner in `SettingsPage.tsx` → `h-4 w-4`.

### ⚙️ Backend (API)

#### Features
- **Whats New Router**: Implemented endpoints `POST /`, `PUT /{id}`, and `DELETE /{id}` to enable versions CRUD operations. Guarded endpoints to admin role check.
- **Model Unique Constraint**: Removed `unique=True` from `version` column and added a composite `UniqueConstraint` on `(version, release_date)` to support identical version codes released on different dates.
- **Audit Logs API Router**: Created the `AuditLog` model, Pydantic schemas, and endpoints `GET /api/audit-logs/` with pagination and filters (entity type, actor, action, date range). Guarded behind permissions.
- **Isolated Thread-Safe Logging Utility**: Implemented `log_action` helper working with isolated database connections (`SessionLocal`) to log events without affecting primary transactions.
- **System-Wide Logging Triggers**: Integrated audit triggers in settings, leads, orders, campaigns, customers, and contacts write operations (CRUD and conversions).

### 📁 Files Changed
| File | Change |
|------|--------|
| `components/VersionsModal.tsx` | New — dynamic scrollable modal, parses markdown, paginates history, shimmer sweep loading |
| `components/ui/VersionsSettings.tsx` | New — admin versions management panel |
| `components/ui/Button.tsx` | Unified `border-current` arc spinner |
| `au-marketing-api/app/routers/whats_new.py` | Added CRUD REST API endpoints (POST, PUT, DELETE) |
| `au-marketing-api/app/schemas.py` | Added Pydantic body validation schemas |
| `au-marketing-api/app/models.py` | Updated constraints, added `AuditLog` model |
| `au-marketing-api/app/audit_utils.py` | New — isolated db helper for log_action event tracking |
| `au-marketing-api/app/routers/audit_logs.py` | New — audit log paginated filtering endpoints |
| `au-marketing-api/app/routers/customers.py` | Hooked CRUD trigger audits |
| `au-marketing-api/app/routers/contacts.py` | Hooked CRUD + conversion trigger audits |
| `lib/marketing-api.ts` | Added REST CRUD methods and return interfaces for changelog and audit logs |
| `pages/SettingsPage.tsx` | Versions management tab, Audit Logs tab, replaced `Loader2` spinner, fixed `h-4.5` |
| `pages/DashboardPage.tsx` | Bumped version, widget dropdown, Audit Logs & What's New widgets, replaced 6× spinners |
| `pages/DomainsPage.tsx` | Removed all loading states — renders instantly |
| `pages/MyTeamPage.tsx` | Replaced page-wide loaders with localized brand shimmers |
| `pages/SchemaPage.tsx`, `ReportsPage.tsx` | Replaced `Loader2` / `border-t-transparent` spinners |
| `pages/EnquiryQuotationsPage.tsx`, `RolesPage.tsx`, `ODPlanPage.tsx`, `ReportTemplatesPage.tsx` | Replaced spinners |
| `pages/CustomersPage.tsx`, `OrganizationsPage.tsx`, `ExpectedOrderNewPage.tsx`, `DSRPage.tsx` | Replaced spinners |
| `store/slices/authSlice.ts` | Token validity guard after scope fetch — prevents auth flash on reload |
| `components/ui/Sidebar.tsx` | Bumped version tag |
| `.server-operator/populate_changelog.serop` | New — server operator instruction script |

---


## [2026-06-14] — My Team Pills, Performance Summary, Date Filters, Sync Button (v1.0.8)

### 🖥️ Frontend

#### Bug Fixes
- **Double-Submit Guard**: Added `useRef` submission lock to Organization, Contact, Customer, and Lead form pages — prevents duplicate records from rapid double-clicks.
- **Superuser Contact Delete**: `selectHasPermission` now returns `true` for superusers — fixes 403 on contact deletion for admin accounts.
- **DSR Crash Fix**: Null guard on cached DSR tasks, Expected Orders, and OD Plan reports — fixes crash when switching date presets on My Team page.
- **Employee Data Cache**: Cache key now includes date range — fixes stale per-employee data when switching date presets.
- **Loading Flash Fix**: Employee breakdown no longer shows ₹0 briefly on initial load.

#### Features
- **Submission Deadline Enforcement**: Expected Order and OD Plan pages now show an amber/red countdown banner when past the monthly deadline (2 days before month-end, 8:30 PM). Submit buttons are disabled and handlers blocked when overdue.
- **Scope Filter Pills**: My Team page now has All / Domain / Region scope pills with aggregate KPI cards — shows combined Expected Orders, OD Plans, Performance Summary, and employee breakdown table per scope.
- **Performance Summary in Aggregate View**: Merges per-employee report summaries into a single aggregate Performance Summary card when a scope pill is active.
- **Team Breakdown Table**: New table in aggregate mode showing Employee, Target, Achieved, %, Won, Lost for each team member.
- **"This Quarter" / "This Year" Date Filters**: Added quarterly and yearly date range presets across the dashboard.
- **"My Data" Dropdown Option**: Top option in My Team employee selector shows the logged-in user's own performance stats.
- **Dynamic Target Label**: KPI target label changes based on selected date range (Today's Target / Weekly Target / Monthly Target / Quarterly Target / Yearly Target).
- **Sync Button**: New Sync button next to scope pills clears scope cache and refreshes employee list.

## [2026-06-13] — Marketing Employee Cache, HRMS Sync, Role Fixes (v1.0.7)

### 🖥️ Frontend

#### Features
- **HRMS Sync Button**: Added "Sync Employees" button in Settings > Integrations (admin only) — syncs marketing-relevant employees into the local cache; shows collapsible results table with employee name, role badge, and domain/region.
- **Local Employees API Methods**: Added `getLocalEmployees`, `getLocalEmployee`, `updateLocalEmployee`, `syncEmployeesFromHRMS` to the marketing API client.
- **Region Head Dashboard — Unified 4-Card KPI Row**: Replaced grouped number-cards with standalone inline KPI widgets. Top 4 cards (Team Size, Team Achieved, Conversion Rate, Top Performer) are now `span: 1`, render without the `<Card>` wrapper for independent dragging/resizing, and include hover-revealed edit-mode toolbar (drag, resize, edit, delete). Gradient vibrancy boosted. Performer card layout swapped to show employee name as the big value.

#### Performance
- **Marketing Employee Cache**: New `marketing_employees` table caches employee metadata locally, reducing HRMS API calls for employee lookups.

### ⚙️ Backend (API)

#### Features
- **MarketingEmployee Model**: New `marketing_employees` table caching employee metadata (name, email, department, designation, role, domain/region scope) with auto-population on region assignment and domain head/coordinator set.
- **HRMS Sync Endpoint**: `POST /api/employees/sync` — admin-only endpoint; fetches only employees referenced in marketing tables, resolves their role (`domain_head`, `domain_coordinator`, `region_head`, `region_coordinator`, `employee`), and upserts into the local cache.
- **Local Employee CRUD**: `GET /api/employees/local/`, `GET /api/employees/local/{id}`, `PUT /api/employees/local/{id}` for querying and managing cached records.

#### Bug Fixes
- **Employee Names in My Team Page**: `GET /api/reports/scope` now falls back to `MarketingEmployee` first_name + last_name before resorting to the generic "Employee {id}" fallback, fixing incorrect name display for domain/region heads.

### 📁 Files Changed
| File | Change |
|------|--------|
| `au-marketing-api/app/models.py` | Added `MarketingEmployee` model |
| `au-marketing-api/app/schemas.py` | Added `MarketingEmployeeResponse`, `MarketingEmployeeUpdate`, `MarketingEmployeeSyncResponse` |
| `au-marketing-api/app/routers/employees.py` | Added local employee CRUD, sync endpoint, `_get_marketing_employee_ids`, `_resolve_employee_marketing_info` |
| `au-marketing-api/app/routers/regions.py` | Auto-populate MarketingEmployee on region assignment |
| `au-marketing-api/app/routers/domains.py` | Auto-populate MarketingEmployee on domain head/coordinator set |
| `au-marketing-api/app/routers/reports.py` | Fallback to MarketingEmployee for scope name resolution |
| `migrations/versions/2a3b4c5d6e7f_add_marketing_employees_table.py` | New migration for `marketing_employees` table |
| `migrations/env.py` | Import MarketingEmployee for autogenerate |
| `lib/marketing-api.ts` | Added `MarketingEmployee` interface, local employee + sync API methods |
| `pages/SettingsPage.tsx` | Added HRMS sync button with collapsible results table |
| `pages/DashboardPage.tsx` | Unified 4-card KPI row, standalone number-cards, hover toolbar, performer card relayout, dynamic conversion rate detail |

---

## [2026-06-12] — DSR & My Team Pages, Reports Caching, Remove Today's Tasks (v1.0.6)

### 🖥️ Frontend

#### New Pages
- **Daily Status Report (DSR) Page**: Added a dedicated DSR page (`/dsr`) displaying pending and completed daily tasks. Includes a Navbar dropdown quick-access button with pending count badge, grouped pending/completed sections, refresh capability, and "View All DSR" link.
- **My Team Page**: Added a new page (`/my-team`) for employee oversight, controlled by the `marketing.view_myteam` permission. Added `UserCheck` nav icon and route registration.
- **Sidebar Link**: "My Team" added to the sidebar navigation behind the `marketing.view_myteam` permission check.

#### Performance
- **ReportsPage Data Caching**: Added in-memory `Map` cache for expected order reports and OD plan reports per employee filter — prevents re-fetching on component re-mount.
- **ReportsPage Scope Caching**: Added `api-cache.ts` utility with TTL-based expiry for caching `getReportsScope()` response.
- **Dashboard Persistence**: Last selected dashboard ID is now persisted to `localStorage` and restored on page load.

#### Removed
- **Today's Tasks Feature Removed**: Stripped the `tasksSlice` (Redux store, actions, reducers), the `fetchTodayTasks` and `completeTaskById` thunks, and all Today's Tasks UI from the DashboardPage — including the tasks card with auto/follow-up task list, add-task modal with manual task creation, task completion/enquiry workflow, and associated lead status/numbering series loading logic.

#### UI Polish
- **ReportsPage Skeletons**: Replaced plain "Loading..." text with skeleton pulse placeholders for both expected order and OD plan loading states.
- **design.md Rewrite**: Complete rewrite of the design system reference document with accurate component patterns extracted from live code.

#### Code Quality
- **HRMS RBAC Client**: Added TypeScript interfaces (`DSRTask`, `DSRResponse`) and `getDSR()` method for fetching daily status reports from the HRMS API.
- **ChangelogModal**: New in-app changelog display component and `lib/changelog.ts` data module.
- **Auth Utils**: New shared `lib/auth-utils.ts` module.
- **Select Component**: Enhanced with `creatable` prop supporting free-text combobox entry.
- **ReportableEmployee**: Added `username` field to the interface.

### 📁 Files Changed
| File | Change |
|------|--------|
| `pages/DSRPage.tsx` | New — DSR page with pending/completed task lists |
| `store/slices/dsrSlice.ts` | New — DSR Redux slice with tasks state, stale flag |
| `pages/MyTeamPage.tsx` | New — My Team page |
| `components/ChangelogModal.tsx` | New — in-app changelog display modal |
| `lib/changelog.ts` | New — changelog data module |
| `lib/api-cache.ts` | New — TTL-based cache utility |
| `lib/auth-utils.ts` | New — shared auth utilities |
| `components/ui/Navbar.tsx` | Added DSR dropdown with badge, pending/completed groups, refresh |
| `components/ui/Sidebar.tsx` | Added My Team link; version v1.0.5 → v1.0.6 |
| `constants.tsx` | Added My Team sidebar nav entry |
| `App.tsx` | Added DSR and My Team route registrations |
| `pages/DashboardPage.tsx` | Removed Today's Tasks feature (tasks card, add-task modal, task enquiry flow); added persisted dashboard ID; shows v1.0.6 |
| `lib/hrms-rbac.ts` | Added DSR types and `getDSR()` method |
| `lib/marketing-api.ts` | Added `username` to `ReportableEmployee` |
| `store/index.ts` | Registered `dsrReducer` |
| `pages/ReportsPage.tsx` | Added scope/data caching, skeleton loaders |
| `design.md` | Complete rewrite |
| `components/ui/Select.tsx` | Added `creatable` prop |
| `package.json` | Version 1.0.5 → 1.0.6 |

---

## [2026-06-11] — Release: State/Industry Dropdowns, Domain Coordinator Dashboard 404 Fix (v1.0.5)

### 🖥️ Frontend
- **Enquiry Log Type Dropdown Trimmed**: Reduced the activity type options in the lead edit page and dashboard task modal from 20 to 5: `Note`, `Contacted`, `Call`, `Email`, `Meeting`. Removed unused follow-up status options (QTN submitted, order loss, etc.).
- **Lead Edit Page Layout Reorder**: Moved "Lead details" card to the top. Tab pills (Enquiry log / Lead status logs) and Follow-up bar are now side-by-side on the same row, vertically centered with reduced gap.
- **Follow-up Pill Simplified**: Stripped the follow-up bar down to just a label, date-time picker, and save button. Removed quick-date buttons, repeat type dropdown, and scheduled text. Replaced native `<input type="datetime-local">` with the app's custom `DatePicker` component (with calendar popup and time selection).
- **Attach Files Highlighted**: Made "Attach files" and "Add attachments" buttons more prominent with dashed blue border pill styling in the lead edit page.
- **Favicon Updated**: Changed favicon from `/mkt_logo.png` to `/favicon.ico` for proper cross-size rendering.
- **State Field → Indian States Autocomplete**: Changed all address state fields across LeadFormPage, OrganizationFormPage, CustomerFormPage, and ContactFormPage from free-text inputs to a searchable combobox listing all 28 Indian states + 8 union territories, while allowing custom text entry for international addresses.
- **Industry Field → Dropdown**: Changed all organization industry fields across 6 form pages from free-text inputs to a dropdown with 3 options: End User, Distributor / Dealer, Consultant.
- **Version Bump**: Updated app version from v1.0.4 to v1.0.5.
- **Changelog Added**: This changelog entry.

### 🔧 Backend
- **Domain Coordinator Dashboard 404 Fix**: Fixed `_can_view` and `_can_edit` in `saved_dashboards.py` to apply the domain coordinator role override (`domain_head` → `domain_coordinator`) that `_list_visible_dashboard_ids` already used, so domain coordinators can view dashboards assigned to the `domain_coordinator` role (they were getting 404 on individual dashboard GET).

### 📁 Files Changed
| File | Change |
|------|--------|
| `pages/LeadFormPage.tsx` | Trimmed activity type options, reordered layout, simplified follow-up bar, replaced native datetime input with DatePicker; state field → Indian states combobox; industry field → dropdown |
| `pages/DashboardPage.tsx` | Trimmed activity type options in task modal |
| `pages/OrganizationFormPage.tsx` | State field → Indian states combobox; industry field → dropdown |
| `pages/CustomerFormPage.tsx` | State field → Indian states combobox; industry field → dropdown |
| `pages/ContactFormPage.tsx` | State field → Indian states combobox; industry field → dropdown |
| `pages/ODPlanPage.tsx` | Industry field → dropdown |
| `components/ui/Select.tsx` | Added `creatable` prop for free-text combobox support |
| `constants.tsx` | Added `INDIAN_STATES` and `INDUSTRY_OPTIONS` constants |
| `index.html` | Switched favicon to `/favicon.ico` |
| `package.json` | Version 1.0.4 → 1.0.5 |
| `components/ui/Sidebar.tsx` | Version v1.0.4 → v1.0.5 |
| `CHANGELOG.md` | Added v1.0.5 entry |
| `components/ui/ChangelogContent.tsx` | Added v1.0.5 entry |
| `au-marketing-api/app/routers/saved_dashboards.py` | Fixed domain coordinator dashboard 404 in `_can_view` and `_can_edit` |

---

## [2026-06-09] — Release: Quotation Submitted Progress Bar & Quote Value Field (v1.0.4)

### 📊 Dashboard & Target Tracking
- **Quotation Submitted (4x) Progress Bar**: Added a new "Quotation Target" progress bar below the existing target bar on the Domains page. Target = yearly target × 4 (stretch goal). Achieved = sum of `quote_value` for `quotation_submitted` leads. Includes quarterly breakdown with gradient fills and quarter milestone markers.
- **Role-Based Visibility**: The quotation bar respects the same scope rules as the target bar — visible to super_admin, domain_head, region_head, employee, domain_coordinator, and region_coordinator.

### 🗃️ Database & Backend
- **`quote_value` Column**: Added `quote_value numeric(12,2)` to `ActivityAttachment` model to store the monetary value of each quotation attachment.
- **Alembic Migration**: Generated and applied migration for the new column.
- **Scope Stats Enhancement**: Added `quotation_submitted_value` to `ScopeTargetStatsResponse`, queried by joining ActivityAttachment → Activity → Lead with `quotation_submitted` status filter.
- **Upload Validation**: `quote_value` is now mandatory when uploading quotation attachments.

### 🖥️ Frontend
- **Quote Value Inputs**: Added mandatory quote value fields in LeadFormPage (add-log, quick add, inline attachment, initial quotation create) and DashboardPage (task modal).
- **Quotation Bar UI**: New card in DomainsPage with 4× yearly target, quarterly segments, gradient bar, and quarter position markers.
- **TypeScript Interfaces**: Updated `LeadActivityAttachment` and `ScopeTargetStats` with `quote_value` / `quotation_submitted_value` fields.

### 📁 Files Changed
| File | Change |
|------|--------|
| `au-marketing-api/app/models.py` | Added `quote_value` column to `ActivityAttachment` |
| `au-marketing-api/app/schemas.py` | Added `quote_value` to `ActivityAttachmentResponse` |
| `au-marketing-api/app/routers/leads.py` | `quote_values` param, validation, storage in upload endpoint |
| `au-marketing-api/app/routers/dashboard.py` | `quotation_submitted_value` query in scope stats |
| `pages/DomainsPage.tsx` | New quotation progress bar, combined quote value in scopeStats |
| `pages/LeadFormPage.tsx` | Quote value UI inputs and upload calls |
| `pages/DashboardPage.tsx` | Quote value UI inputs and upload calls |
| `lib/marketing-api.ts` | Updated types and upload method |
| `au-marketing-api/migrations/` | Alembic migration for `quote_value` column |

---

## [2026-06-08] — Release: Domain Target Visibility Fix & Descriptive Error Messaging (v1.0.3)

### 📊 Dashboard & Target Tracking
- **Quotation Revision System**: 
    - **Smart Numbering**: Fixed revision suffix to start at `(rev1)` instead of `(rev2)`. The base quotation remains suffix-less.
    - **Auto-Detection**: System now automatically detects existing quotations and marks new ones as "Revised" without manual input.
    - **UI Cleanup**: Hidden the numbering series and revised checkbox in the Enquiry Log when a quotation already exists to simplify the workflow.
- **Domain Target Visibility Fix**: Fixed an issue where the "All Domains Target" progress bar on the Dashboard and Domains page was not correctly counting leads that were assigned to a domain but lacked a specific region assignment.
- **Role-Based Lead Scoping**: Refined lead visibility logic for Domain Heads and Super Admins to ensure all leads within their respective domains (including those with `region_id = null`) are aggregated into target statistics.

### 🛡️ Error Handling & UI Feedback
- **Descriptive Error Messaging**: Improved backend error handling for common technical failures (e.g., numeric field overflows, unique constraint violations).
- **Numeric Overflow Clarity**: When a value is too large for the potential or closed value fields (exceeding 8 digits before the decimal), the system now provides a specific descriptive error instead of a generic "An error occurred" toast.
- **Lead Creation Cleanup**: Removed the "Mark as revised" checkbox during lead creation, as the first quotation is always the base quotation.

### 🔧 Backend
- **Enhanced `get_scope_target_stats`**: Updated the dashboard statistics endpoint to use `get_user_scope` for more accurate and comprehensive lead filtering.
- **Global Exception Handler**: Updated the main app exception handler to map low-level database errors (SQLAlchemy/Postgres) into user-friendly messages for the frontend.
- **Coordinator Logic Consistency**: Ensured Domain Coordinators are treated identically to Domain Heads when identifying visible domains for target calculations.

### 📁 Files Changed
| File | Change |
|------|--------|
| `au-marketing-api/app/main.py` | Added descriptive mapping for common database errors in global exception handler |
| `au-marketing-api/app/routers/dashboard.py` | Updated target stats to include region-less leads for domain heads; included coordinators in hierarchical targets |
| `au-marketing-api/app/routers/leads.py` | Added specific SQLAlchemy DataError handling for lead creation |

---

## [2026-06-07] — Release: Quotation Trend Widget, Domain Coordinator Dashboard & Kanban Chart Fix (v1.0.2)

### 📊 New Dashboard Widgets
- **Created Quotation by Month**: Added a new line-chart widget showing quotation creation over time. Supports toggling between Day/Week/Month grouping via a dropdown in the widget edit modal, powered by a `{{time_group}}` SQL placeholder.
- **Avg Quotation Revisions**: Added a bar-chart widget showing revision count distribution across quotations (replaced initial number-card).

### 🧑‍💼 Domain Coordinator Dashboard
- Created a dedicated **Domain Coordinator Dashboard** — identical to the Domain Head Dashboard but without the "Leads by Kanban Stage" and "Recent Domain Leads Requiring Action" widgets.
- Added `domain_coordinator` as a valid assignment role in the backend.
- Coordinators now automatically see the coordinator dashboard in place of the domain head dashboard.

### 🐛 Bug Fixes
- **Kanban bar chart — invisible zero-value series**: Fixed bar, line, and pie charts to filter out value series where all data points are 0. Previously, the "Leads by Kanban Stage" widget showed a purple legend circle for `total_amount` with no visible bars when all `potential_value` values were zero.
- **Single number-card widgets missing resize/delete/move**: Fixed `getGroupedLayout()` to not wrap single `number-card` widgets into a group — they now render as standalone `custom_sql` widgets with full edit-mode capabilities.

### 🔧 Backend
- Added `time_group` to template SQL keys; per-widget `time_group` config is merged into the SQL compilation context so `DATE_TRUNC('{{time_group}}', ...)` works at runtime.
- `ReportScopeResponse` now returns `is_domain_coordinator` flag.
- Dashboard visibility logic checks coordinator status to show the correct dashboard.

### 📁 Files Changed
| File | Change |
|------|--------|
| `pages/DashboardPage.tsx` | Added time-group toggle in widget edit modal, coordinator role detection, zero-series filter for charts, single number-card grouping fix |
| `lib/marketing-api.ts` | Added `is_domain_coordinator` to `ReportScopeResponse` |
| `app/routers/saved_dashboards.py` | Valid roles extended; `time_group` template support; coordinator dashboard visibility |
| `app/routers/reports.py` | `is_domain_coordinator` in response model and endpoint |
| `scripts/seed_demo_data.py` | Quotation trend + avg revision widgets; domain coordinator layout + dashboard entry |

---

## [2026-06-06] — Release: Sales Rep Dashboard Seeding, Gradient KPI Cards, SVG Chart Gradients & Role-Based Dashboard Assignments (v1.0.2)

### 📊 Dashboard & KPI Card Upgrades
- **Sales Rep Dashboard Seeding**: Updated seeding scripts to fully populate data for Sales Reps, splitting single KPI summaries into separate number cards.
- **Redesigned KPI Number Cards**: Redesigned to match the target-card mini-card pattern. Replaced the old vertical border-l-4 and icon wrappers with a clean linear gradient background (`from-{color}-50/40 to-{color}-100/10`), rounded-xl corners, direct flex icons at size `18`, `text-[9px]` uppercase labels, and bold `text-xl font-black text-{color}-800` values.
- **Top Representatives Leaderboard**: Rewrote the top performing sales representatives leaderboard widget to support rank-specific styles and high-density typography.
- **Chart Fills Upgrade**: Upgraded all chart elements (`TargetAchievedBarChart`, `WonLostPieChart`, `LeadStatusPieChart`, etc.) from solid fills to premium SVG linear gradients (added `<defs>` with 10+ custom gradients).
- **Y-Axis Value Formatting**: Added `formatYAxisValue` helper for compact currency formatting (₹ Cr / L / K).
- **Multi-Record Hints**: Added a visual feedback hint showing "First of N records" when table rows exceed 1.
- **Layout and Typography Tweaks**: Changed standard Card titles to `text-[11px] font-black uppercase tracking-widest` and refined global transition durations to focus specifically on `box-shadow`, `border-color`, and `background-color` over a snappy 200ms window.

### 🛡️ Role-Based Access Control (RBAC) & Dashboard Configuration
- **Saved Dashboard Model Changes**: Added a nullable `role` column to the dashboard assignments schema (`SavedDashboardAssignment`) along with a database constraint to ensure assignments target either a specific `assignee_employee_id` or a generic role.
- **Refactored Backend Routing Permissions**: Refactored visibility & permissions checking helpers (`_can_edit`, `_can_view`, `_list_visible_dashboard_ids`) to accept user dict objects directly instead of querying via raw `user_id`.
- **Role-Based Assignments**: Enabled dashboard configurations to be assigned programmatically to roles (e.g., `super_admin`, `domain_head`, `region_head`, `supervisor`, `employee`) instead of just individual users.
- **Frontend Integration**: Updated `assignSavedDashboard` calls and response interfaces to make employee IDs optional/nullable and support role assignment.

### 🧹 Deprecated Features & Code Cleanup
- **Disabled AI Widget Generation**: Commented out the backend `/ai-generate-widget` routing endpoints, frontend helper methods, and report-generation UI states across `DashboardPage` and `ReportTemplatesPage`.
- **Restoration Documentation**: Created a detailed `ai_dashboard_restoration.md` checklist detailing the exact code blocks and files required to restore natural language generation in the future.

### 📁 Files Changed
| File | Change |
|------|--------|
| `pages/DashboardPage.tsx` | Upgraded KPI grid, custom colors/gradients, row hints, leaderboard refactor |
| `components/ui/Card.tsx` | Title typography & transition refinements |
| `components/ui/ChartsSection.tsx` | SVG linear gradient defs, axis formatting, layout margins |
| `pages/ReportTemplatesPage.tsx` | Commented out AI widget generation modal & handlers |
| `lib/marketing-api.ts` | Updated dashboard assignment parameters, commented out AI helper |
| `app/models.py` | Added role column, nullable assignment constraints to SavedDashboardAssignment |
| `app/routers/saved_dashboards.py` | Refactored permission checks, added role-based visibility, disabled AI routes |
| `design.md` | Documented gradient patterns, typography rules, toolbar layouts, and top rep designs |
| `ai_dashboard_restoration.md` | Created restoration checklist for disabled AI components |

---

## [2026-06-04] — Release: Visibility Settings, Region Coordinator Support, Sorting Stability & Custom Tooltips (v1.0.1)

### Dynamic Visibility & Data Isolation

- Added Visibility Settings control card on the Domains page with live override presets.
- Introduced "Preview As" mode to inspect the domains tree from different roles' perspectives.
- Created database tables for visibility rules and audit logging with thread-safe caching.
- Enforced strict scoping rules to isolate regular users to their assigned domains and regions.

### Region Coordinator Support

- Added coordinator fields to the Region database model and API schemas.
- Integrated Coordinator select dropdown in the Region Form.
- Fixed dropdown display issue where reopened selects would show as blank.
- Displayed region coordinator name and actions in the Domains Review Tree.

### Tree View Sorting & UX Polish

- Added stable database sorting for regions and domains to prevent position shifting on update.
- Replaced text action buttons with elegant Crown (Head) and UserCheck (Coordinator) icon buttons.

### Premium Tooltips Integration

- Upgraded custom Tooltip component to support multi-line content.
- Replaced native browser tooltips with custom snappy tooltips across Lead Form, Outdoor Plan, Employees, Roles, Order Form, and Leads Dashboard.

### Target Tracking & Progress Bar

- Added dynamic target progress bar on the Domains page with color-shifting brackets.
- Implemented role-based name visibility rules on the Domains tree nodes.
- Locked the target tracker strictly to the Indian Fiscal Year (April-March), removing month/period selectors.
- Implemented parallel backend queries in `loadScopeStats` to load stats for Q1, Q2, Q3, and Q4 independently.
- Segmented the progress bar visually into four 25% blocks representing each quarter with independent, non-spillover fills.
- Added reactive milestone status badges (`Completed`, `Active`, `Missed`, `Pending`) based on the current calendar month.
- Completely removed the interactive progress simulator controls, keeping the target tracker strictly driven by live database statistics.

---

## [2026-03-20] — Release: Settings Overhaul, Support Page & Branding

### ⚙️ Settings Page — Profile Section Refactor
- **Horizontal Tab Navigation**  
  Replaced the vertical sidebar layout with a horizontal tab bar (`Profile` | `Audit Logs`). The content area now expands to full width with an animated underline indicator using `framer-motion` `layoutId`.

- **Removed Notifications Tab**  
  The Notifications tab and all related state (`notifPrefs`, `notifPrefsLoading`, `notifPrefsSaving`) have been removed from the Settings page in response to user feedback.

- **Profile section — High-density flat list layout**  
  Refactored the Profile card from a nested, padded layout to a compact 2-column grid using the design guidelines:
  - Labels: `font-black uppercase tracking-widest text-[11px]`
  - Status: `font-black uppercase tracking-widest text-[9px]` with emerald dot
  - Integrations: icon + title (`font-black uppercase tracking-tight`) + full-width `border-t` dividers using negative margins (`-mx-4 md:-mx-6 lg:-mx-8`) to bleed through card padding

- **Removed "System Active" footer**  
  The `CardFooter` with the green "System Active" badge has been removed. Reset and Save Changes buttons are now inline within the profile content area.

- **User-friendly language**  
  Replaced all technical jargon:
  - `Verified Actor` → `Active`
  - `Identity Handshake` → `Integrations`
  - `Apply Protocol` → `Save Changes`
  - `Active Connection` → `Authenticated`

- **Card restored to design-guideline spec**  
  Reverted the card back to `rounded-2xl shadow-sm border-slate-200 overflow-hidden` per `DESIGN_GUIDELINES.md`. Earlier attempts to flatten the card borders were incorrect.

---

### 🆘 Support Page — Full Rewrite
- **Replaced dummy placeholder content** with real, workflow-specific help content sourced from the official marketing guide at `https://docy-lake.vercel.app/marketing-guide`.

- **Module FAQ Accordion**  
  7 collapsible module sections with real step-by-step answers:
  - Leads (5 articles), Quotations (2), Orders (2), Database (3), Reports (3), Domains & Regions (2), Settings (2)

- **Framer Motion accordion animation**  
  Each FAQ section uses `AnimatePresence` + `motion.div` with `height: 0 → auto` and `opacity` for smooth expand/collapse. The chevron icon rotates 180° on open using `motion.div animate={{ rotate }}`.

- **Quick Launch cards**  
  3 cards linking directly to Full User Guide, Getting Started, and Schema Reference sections of the live docs.

- **Live search**  
  `SearchInput` component filters across all FAQ questions and answers in real time.

- **Correct imports**  
  Page now uses `../components/ui/Card`, `../components/ui/Button`, `../components/ui/SearchInput` — matching the import path used by all other pages in the project.

- **Permission note footer**  
  Informational banner: *"If a menu item or action is missing, contact your administrator."*

---

### 🏷️ Sidebar — Branding Update
- **App title changed** from `BeForth` → `S&M Hub`
- **Logo updated** from remote `https://www.beforth.in/images/befu.png` → local `aureole-logo.png` (served from project root)
- **"Powered by BeForth"** credit preserved unchanged below the logo

---

### 📁 Files Changed
| File | Change |
|------|--------|
| `pages/SettingsPage.tsx` | Profile section refactor, tab layout, text cleanup, divider fix |
| `pages/SupportPage.tsx` | Full rewrite with real FAQ content, Framer Motion accordion |
| `components/ui/Sidebar.tsx` | Logo → aureole-logo.png, title → S&M Hub |
| `aureole-logo.png` | Added to project root |
| `UI_COMPONENTS_LIBRARY.md` | Added SupportPage FAQ Accordion pattern |

---

## [2026-03-19] — Release: UI Polish & Database Layout Overhaul

### 🏗️ Layout & Navigation
- **Database Module — Consolidated Command Bar**  
  Removed the standalone "Database" header card and merged section navigation (Organizations / Customers / Contacts), search capsule, and filter controls into a single compact horizontal bar at the top of each page. This recovers ~200px of vertical space and provides a unified, context-aware workspace across all database sub-pages.
  
- **Breadcrumbs elevated to primary hierarchy**  
  Breadcrumb trails (`Home > Database > Contacts`) are now rendered at the very top of each page, before the page title, providing clear navigational context without cluttering the action area.

- **`DatabaseLayout.tsx` simplified**  
  The shared database layout no longer renders its own header card. Each page (`OrganizationsPage`, `CustomersPage`, `ContactsPage`) now owns its own navigation bar, allowing per-page customisation.

---

### 📋 DataTable — Intelligent Loading UX
- **Eliminated full-table flicker on sort / filter**  
  Previously, every sort or filter action would clear the table and show a large spinner. The `DataTable` component now differentiates between **initial load** (full centre spinner) and **subsequent fetches** (subtle glass overlay on existing rows). This creates a smooth, app-like experience.

- **Glassmorphism loading overlay**  
  During a refetch, a `bg-white/40 backdrop-blur-[1px]` overlay is applied over existing rows with a small spinner, preserving visual context while data loads.

---

### 🔍 Search & Filter
- **`SearchInput` integrated into Command Bars**  
  The capsule search input is now embedded directly in the database module's command bar, removing the need for a separate search row below the title.

- **Filter popover preserved**  
  The `FilterPopover` (Domain / Region filters) continues to function on the Contacts page, now attached to the Filter button within the consolidated bar.

- **Active filter indicator badge**  
  A small `Active Filter` badge is shown alongside the Filter button when domain or region filters are applied, giving the user immediate visual feedback.

---

### 🔃 Column Sorting
- **Leads table — sorting restored**  
  Column header click-to-sort is fully implemented with server-side `order_by` / `order_dir` parameters passed to the `getLeads` API call.

- **Numbering Series table — sorting added**  
  Column sorting has been wired up for the Numbering Series page with `sortConfig` state and `onSort` handler, passing parameters to the `getSeries` API call.

- **Sort indicators**  
  Active sort column highlights its chevron icon in `blue-600`; inactive columns show neutral `slate-300` chevrons.

---

### 🔔 Toast Notifications
- **Generate Next hash icon — toast fixed**  
  Clicking the hash icon in the Numbering Series table now reliably shows a toast notification. Click handler was moved to a wrapper `<div>` to bypass `Tooltip` overlay event conflicts.

- **Toast system centralised**  
  Removed redundant `<Toast />` rendering from `DashboardLayout`. All notifications are now handled by the global `AppMain` provider for consistent, app-wide delivery.

---

### 🎨 Design System Updates
- **`UI_COMPONENTS_LIBRARY.md` updated**  
  Added the `DataTable` component with the new intelligent loading pattern as the canonical reference. Documented `PageLayout` wrapper and the `ConsolidatedCommandBar` layout pattern for use by AI assistants replicating this system.

- **Typography — Outfit font**  
  `font-black uppercase tracking-widest text-[11px]` confirmed as the standard for all structural labels, headers, and navigation tabs.

---

### 🐛 Bug Fixes
- Fixed duplicate import `Building2` in `ContactsPage.tsx` after layout restructuring.
- Fixed missing `useApp`, `useAppSelector`, `selectHasPermission` imports in `ContactsPage.tsx`, `CustomersPage.tsx`, and `OrganizationsPage.tsx` after import consolidation.
- Fixed variable name mismatch in `LeadsPage.tsx` `useEffect` dependency array: `include_won_lost` → `includeWonLost` (resolves lint error and ensures correct data refresh).

---

### 📁 Files Changed
| File | Change |
|------|--------|
| `components/ui/DataTable.tsx` | Intelligent loading overlay |
| `components/layout/DatabaseLayout.tsx` | Removed header card |
| `pages/ContactsPage.tsx` | Consolidated command bar + nav tabs |
| `pages/OrganizationsPage.tsx` | Consolidated command bar + nav tabs |
| `pages/CustomersPage.tsx` | Consolidated command bar + nav tabs |
| `pages/LeadsPage.tsx` | Column sorting, dependency array fix |
| `pages/NumberingSeriesPage.tsx` | Column sorting, toast fix |
| `lib/marketing-api.ts` | `getLeads` + `getSeries` sorting params |
| `UI_COMPONENTS_LIBRARY.md` | DataTable, PageLayout, CommandBar docs |

---

_Built with ❤️ — AP | S&M Module_
