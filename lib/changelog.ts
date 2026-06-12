export interface ChangelogEntry {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
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
