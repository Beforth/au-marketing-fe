# 📋 Changelog — AP | S&M Module

All notable changes to the **au-marketing-fe** project are documented here.  
Format: `[Date] — Category: Description`

---

## [2026-06-10] — Release: Enquiry Log Type Cleanup, Layout Reorder, Favicon & Changelog (v1.0.5)

### 🖥️ Frontend
- **Enquiry Log Type Dropdown Trimmed**: Reduced the activity type options in the lead edit page and dashboard task modal from 20 to 5: `Note`, `Contacted`, `Call`, `Email`, `Meeting`. Removed unused follow-up status options (QTN submitted, order loss, etc.).
- **Lead Edit Page Layout Reorder**: Moved "Lead details" card to the top. Tab pills (Enquiry log / Lead status logs) and Follow-up bar are now side-by-side on the same row, vertically centered with reduced gap.
- **Follow-up Pill Simplified**: Stripped the follow-up bar down to just a label, date-time picker, and save button. Removed quick-date buttons, repeat type dropdown, and scheduled text. Replaced native `<input type="datetime-local">` with the app's custom `DatePicker` component (with calendar popup and time selection).
- **Favicon Updated**: Changed favicon from `/mkt_logo.png` to `/favicon.ico` for proper cross-size rendering.
- **Version Bump**: Updated app version from v1.0.4 to v1.0.5.
- **Changelog Added**: This changelog entry.

### 📁 Files Changed
| File | Change |
|------|--------|
| `pages/LeadFormPage.tsx` | Trimmed activity type options, reordered layout, simplified follow-up bar, replaced native datetime input with DatePicker |
| `pages/DashboardPage.tsx` | Trimmed activity type options in task modal |
| `index.html` | Switched favicon to `/favicon.ico` |
| `package.json` | Version 1.0.4 → 1.0.5 |
| `components/ui/Sidebar.tsx` | Version v1.0.4 → v1.0.5 |
| `CHANGELOG.md` | Added v1.0.5 entry |
| `components/ui/ChangelogContent.tsx` | Added v1.0.5 entry |

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
  Active sort column highlights its chevron icon in `indigo-600`; inactive columns show neutral `slate-300` chevrons.

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
