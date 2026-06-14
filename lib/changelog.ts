export interface ChangelogEntry {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "v1.0.8",
    date: "2026-06-14",
    sections: [
      {
        title: "Bug Fixes",
        items: [
          "Double-Submit Guard: Added useRef submission lock to Organization, Contact, Customer, and Lead form pages — prevents duplicate records from rapid double-clicks",
          "Superuser Contact Delete: selectHasPermission now returns true for superusers — fixes 403 on contact deletion for admin accounts",
          "DSR Crash Fix: Null guard on cached DSR tasks, Expected Orders, and OD Plan reports — fixes crash when switching date presets on My Team page",
          "Employee Data Cache: Cache key now includes date range — fixes stale per-employee data when switching date presets",
          "Loading Flash Fix: Employee breakdown no longer shows ₹0 briefly on initial load",
        ],
      },
      {
        title: "Features",
        items: [
          "Submission Deadline Enforcement: Expected Order and OD Plan pages now show an amber/red countdown banner when past the monthly deadline (2 days before month-end, 8:30 PM)",
          "Scope Filter Pills: My Team page now has All / Domain / Region scope pills with aggregate KPI cards — shows combined Expected Orders, OD Plans, Performance Summary, and employee breakdown table per scope",
          "Performance Summary in Aggregate View: Merges per-employee report summaries into a single aggregate Performance Summary card when a scope pill is active",
          "Team Breakdown Table: New table in aggregate mode showing Employee, Target, Achieved, %, Won, Lost for each team member",
          "\"This Quarter\" / \"This Year\" Date Filters: Added quarterly and yearly date range presets across the dashboard",
          "\"My Data\" Dropdown Option: Top option in My Team employee selector shows the logged-in user's own performance stats",
          "Dynamic Target Label: KPI target label changes based on selected date range",
          "Sync Button: New Sync button next to scope pills clears scope cache and refreshes employee list",
        ],
      },
    ],
  },
  {
    version: "v1.0.7",
    date: "2026-06-13",
    sections: [
      {
        title: "Marketing Employees Cache",
        items: [
          "New marketing_employees table caches employee metadata locally — reduces HRMS API calls for employee lookups",
          "Admin Sync button in Settings > Integrations syncs marketing-relevant employees with role resolution",
          "Sync results table shows employee name, role badge (domain_head, region_head, etc.), and domain/region",
        ],
      },
      {
        title: "Role Resolution",
        items: [
          "Sync endpoint resolves roles: domain_head, domain_coordinator, region_head, region_coordinator, employee",
          "Auto-populates MarketingEmployee on region assignment and domain head/coordinator set",
        ],
      },
      {
        title: "Bug Fixes",
        items: [
          "My Team page now shows correct employee names instead of 'Employee {id}' for domain/region heads",
        ],
      },
    ],
  },
  {
    version: "v1.0.6",
    date: "2026-06-12",
    sections: [
      {
        title: "New Pages",
        items: [
          "Daily Status Report (DSR) page — view pending/completed DSR tasks with Navbar dropdown quick-access",
          "My Team page — employee oversight with permission-based access (marketing.view_myteam)",
        ],
      },
      {
        title: "Performance",
        items: [
          "ReportsPage: in-memory data caching for expected orders and OD plans — no re-fetch on re-mount",
          "ReportsPage: scope caching via api-cache.ts with TTL-based expiry",
        ],
      },
      {
        title: "Removed",
        items: [
          "Today's Tasks feature — removed tasksSlice, store, and all DashboardPage UI (tasks card, add-task modal, task completion flow, associated enquiry form)",
        ],
      },
      {
        title: "UI Polish",
        items: [
          "ReportsPage: replaced plain 'Loading...' text with skeleton pulse placeholders",
          "Design system reference (design.md) rewritten from scratch with accurate component patterns",
        ],
      },
      {
        title: "Code Quality",
        items: [
          "HRMS RBAC client: added DSR types and getDSR() method",
          "Added username field to ReportableEmployee interface",
          "Auth utility module (lib/auth-utils.ts)",
          "Select component enhanced with creatable prop for free-text combobox support",
        ],
      },
    ],
  },
  {
    version: "v1.0.5",
    date: "2026-06-11",
    sections: [
      {
        title: "Performance",
        items: [
          "Eliminated N+1 queries in target calculation — 200+ SQL queries reduced to 5",
          "Merged 4 head-summary GROUP BY queries into 1 using case expressions",
          "Removed redundant API calls from dashboard Phase 1A loading",
        ],
      },
      {
        title: "Features",
        items: [
          "Dashboard selection persisted across sessions",
          "Today's tasks now visible for all roles",
        ],
      },
      {
        title: "Bug Fixes",
        items: [
          "Fixed employee-ID mismatch in dashboards and report templates",
          "Removed unused series_id from lead schema",
        ],
      },
      {
        title: "Code Quality",
        items: [
          "Pydantic v2 migration (.dict() → .model_dump())",
          "ARIA roles and keyboard navigation in Select component",
          "Composite indexes + cascade deletes on domain_id FKs",
          "RBAC cache TTL reduced from 600s to 60s",
        ],
      },
    ],
  },
];
