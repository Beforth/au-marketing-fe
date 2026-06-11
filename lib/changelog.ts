export interface ChangelogEntry {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
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
