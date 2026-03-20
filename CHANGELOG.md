# 📋 Changelog — AP | S&M Module

All notable changes to the **au-marketing-fe** project are documented here.  
Format: `[Date] — Category: Description`

---

## [2026-03-20] — Release: UI Polish & Database Layout Overhaul

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
