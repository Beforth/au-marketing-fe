import React from 'react';

interface ChangelogContentProps {
  appVersion: string;
}

export const ChangelogContent: React.FC<ChangelogContentProps> = ({ appVersion }) => {
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release</p>
        <p className="text-lg font-semibold text-slate-900">{appVersion}</p>
        <p className="text-xs text-slate-500">June 3, 2026</p>
      </div>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Region Coordinator & Sorting Stability (v1.0.1)</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Added <strong>Region Coordinator</strong> support to allow assigning and displaying region coordinators in the hierarchy tree.</li>
          <li>Integrated <strong>AsyncSelect</strong> in the Region Form Page to support selecting a Region Head and Region Coordinator.</li>
          <li>Fixed the <strong>AsyncSelect selection resolving</strong> issue in the Domain & Region modals by introducing initial options lookup.</li>
          <li>Implemented <strong>stable tree sorting</strong> on backend queries to prevent regions and domains from shifting position when updated.</li>
          <li>Upgraded actions to use elegant <strong>Crown</strong> (Head) and <strong>UserCheck</strong> (Coordinator) icon buttons.</li>
        </ul>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Saved Dashboard Management</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Added frontend dashboard assignment flow for selected saved dashboards.</li>
          <li>Introduced <strong>Assign dashboard</strong> modal with assign/remove actions.</li>
          <li>Supports assigning by employee ID and setting <strong>can edit</strong> access.</li>
          <li>Added assignment list view with remove action from the same modal.</li>
          <li>Added strict frontend visibility checks:
            <span className="block text-xs text-slate-500 mt-1">`marketing.create_dashboard` or `marketing.admin` for Save as new.</span>
            <span className="block text-xs text-slate-500">`marketing.assign_dashboard` or `marketing.admin` for Assign.</span>
          </li>
          <li>Blocked customization actions for users without edit rights on selected saved dashboard.</li>
        </ul>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Dashboard Task Modal UX Improvements</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Redesigned task modal into two clear paths:
            <span className="block text-xs text-slate-500 mt-1">Quick Add Quotation</span>
            <span className="block text-xs text-slate-500">Detailed Add Log</span>
          </li>
          <li>Quick add now supports file-only flow with auto enquiry title <strong>Added quotation</strong>.</li>
          <li>Added quotation series selection and revised quotation toggle in quick flow.</li>
          <li>Updated detailed log behavior:
            <span className="block text-xs text-slate-500 mt-1">If type is `QTN Submitted`, title is auto-set.</span>
            <span className="block text-xs text-slate-500">Validates quotation file before submit when needed.</span>
          </li>
          <li>Reworked attachment rows to improve readability and reduce accidental entry errors.</li>
        </ul>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Lead Details Enquiry Form Improvements</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Upgraded quick quotation card with clearer layout and guided input sequence.</li>
          <li>Quick quotation now logs activity as <strong>`qtn_submitted`</strong> (previously used generic note type).</li>
          <li>Added quotation series + revised toggle for both quick add and detailed attachment uploads.</li>
          <li>Detailed log now auto-uses title <strong>Added quotation</strong> for `QTN Submitted` type.</li>
          <li>Added validation for `QTN Submitted` to prevent submit without quotation file.</li>
          <li>Improved attachment section labels and structure for better usability.</li>
        </ul>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Permissions & Documentation</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Updated required permissions documentation to include:
            <span className="block text-xs text-slate-500 mt-1">`marketing.create_dashboard`</span>
            <span className="block text-xs text-slate-500">`marketing.assign_dashboard`</span>
          </li>
          <li>Aligned frontend behavior with backend dashboard permission model.</li>
        </ul>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Build & Stability</h4>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Resolved intermediate TypeScript/JSX issues introduced during UI refactor.</li>
          <li>Verified production build after each change set.</li>
        </ul>
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-4">
        <h4 className="text-base font-semibold text-slate-900">Domain Target Assignment & Hierarchical Sums</h4>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">Backend (`marketing-api`)</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Added <strong>GET `/api/dashboard/domain-target-summary`</strong>
              <span className="block text-xs text-slate-500 mt-1">Query params: `year`, `month`.</span>
              <span className="block text-xs text-slate-500">Returns hierarchy: domains → regions → employees with target amounts.</span>
              <span className="block text-xs text-slate-500">Includes `total_target`, per-domain/per-region `total_target`, and per-employee `target_amount`.</span>
              <span className="block text-xs text-slate-500">Scope: super_admin (all), domain_head (own domain), region_head (own region).</span>
              <span className="block text-xs text-slate-500">Uses existing `EmployeeMonthlyTarget`; defaults to 8 Lacs when not set.</span>
            </li>
            <li>
              Added response models:
              <span className="block text-xs text-slate-500 mt-1">`DomainTargetSummaryResponse`, `DomainTargetSummaryItem`, `RegionTargetSummaryItem`, `EmployeeTargetItem`.</span>
            </li>
            <li>
              Added helper:
              <span className="block text-xs text-slate-500 mt-1">`_get_scope_domain_region_ids()` to resolve visible domain/region IDs for the current user.</span>
            </li>
            <li>
              Unchanged:
              <span className="block text-xs text-slate-500 mt-1"><strong>PUT `/api/dashboard/target`</strong> remains the write endpoint for employee monthly targets.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">Frontend (`marketing-fe`)</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              API client (`lib/marketing-api.ts`)
              <span className="block text-xs text-slate-500 mt-1">Added types: `DomainTargetSummaryResponse`, `DomainTargetSummaryItem`, `RegionTargetSummaryItem`, `EmployeeTargetItem`.</span>
              <span className="block text-xs text-slate-500">Added method: `getDomainTargetSummary(year, month)`.</span>
            </li>
            <li>
              Domains page review view (`pages/DomainsPage.tsx`)
              <span className="block text-xs text-slate-500 mt-1">Added month/year period selector (defaults to current month/year).</span>
              <span className="block text-xs text-slate-500">Shows top-level total target from `targetSummary.total_target`.</span>
              <span className="block text-xs text-slate-500">Domain rows show domain head + domain target (sum of domain regions).</span>
              <span className="block text-xs text-slate-500">Region rows show region head + region target (sum of region employees).</span>
              <span className="block text-xs text-slate-500">Employee rows show target + Set target action.</span>
              <span className="block text-xs text-slate-500">Set target modal saves via `setEmployeeTarget(...)` and refetches summary to refresh region/domain/total sums.</span>
            </li>
            <li>
              Added helpers:
              <span className="block text-xs text-slate-500 mt-1">`getEmployeeTarget()`, `getRegionTotal()`, `getDomainTotal()`, `formatTargetAmount()`, `getCurrentYearMonth()`, and `MONTHS`.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">Summary</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Feature enables employee-level target assignment with region/domain/overall total rollups.</li>
            <li>Backend adds read-only hierarchical summary endpoint.</li>
            <li>Write/update flow remains on existing target endpoint.</li>
            <li>Frontend Domains Review now supports period-based target planning and updates.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
