# 📋 Changelog — AP | S&M Module

All notable changes to the **au-marketing-fe** project are documented here.  
Format: `[Date] — Category: Description`

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
