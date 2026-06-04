import React from 'react';

interface ChangelogContentProps {
  appVersion: string;
}

export const ChangelogContent: React.FC<ChangelogContentProps> = ({ appVersion }) => {
  return (
    <div className="space-y-10 text-sm text-slate-700 max-h-[70vh] overflow-y-auto pr-3 scrollbar-thin">
      
      {/* ==================== VERSION 1.0.1 (June 4, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg">
            Version {appVersion}
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 4, 2026 (Latest)
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-indigo-100">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Dynamic Visibility & Data Isolation</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Added Visibility Settings control card on the Domains page with live override presets.</li>
              <li>Introduced "Preview As" mode to inspect the domains tree from different roles' perspectives.</li>
              <li>Created database tables for visibility rules and audit logging with thread-safe caching.</li>
              <li>Enforced strict scoping rules to isolate regular users to their assigned domains and regions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Region Coordinator Support</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Added coordinator fields to the Region database model and API schemas.</li>
              <li>Integrated Coordinator select dropdown in the Region Form.</li>
              <li>Fixed dropdown display issue where reopened selects would show as blank.</li>
              <li>Displayed region coordinator name and actions in the Domains Review Tree.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Tree View Sorting & UX Polish</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Added stable database sorting for regions and domains to prevent position shifting on update.</li>
              <li>Replaced text action buttons with elegant Crown (Head) and UserCheck (Coordinator) icon buttons.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Premium Tooltips Integration</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Upgraded custom Tooltip component to support multi-line content.</li>
              <li>Replaced native browser tooltips with custom snappy tooltips across Lead Form, Outdoor Plan, Employees, Roles, Order Form, and Leads Dashboard.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Target Tracking & Progress Bar</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Added dynamic target progress bar on the Domains page with color-shifting brackets.</li>
              <li>Implemented role-based name visibility rules on the Domains tree nodes.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.0 (March 20, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version 1.0.0
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            March 20, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-slate-100">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Settings Page Refactor</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Replaced vertical sidebar navigation with horizontal tab bar (`Profile` | `Audit Logs`) and underline indicator.</li>
              <li>Removed Notifications tab and all related state properties from the Settings page.</li>
              <li>Refactored Profile section card into a high-density 2-column grid.</li>
              <li>Removed "System Active" green badge footer, moving action buttons inline inside the content layout.</li>
              <li>Simplified user terminology (e.g. `Verified Actor` → `Active`, `Apply Protocol` → `Save Changes`).</li>
              <li>Restored Profile card borders to design guideline specification (`rounded-2xl shadow-sm border-slate-200`).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Support Page Rewrite</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Replaced dummy content with real, workflow-specific help documentation from the official marketing guide.</li>
              <li>Created a collapsible FAQ Accordion structure covering 7 key module areas.</li>
              <li>Added smooth expand/collapse animations using Framer Motion (`AnimatePresence`).</li>
              <li>Added quick-launch cards to external full guide, getting started, and schema references.</li>
              <li>Implemented real-time live search across all FAQ articles.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Sidebar Branding</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Renamed App Title from `BeForth` to `S&M Hub`.</li>
              <li>Updated logo from remote url to local `aureole-logo.png` served from project root.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.0 (March 19, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version 1.0.0
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            March 19, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-slate-100">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Layout & Navigation</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Merged section tabs, search capsules, and filter popovers of the database module into a single compact horizontal Command Bar, recovering ~200px of vertical space.</li>
              <li>Elevated page Breadcrumbs to primary hierarchy rendered above the page title.</li>
              <li>Simplified shared Database Layout by delegating navigation header state to child views.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">DataTable Loading UX</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Eliminated full-table flicker on column sorts or filter updates by distinguishing initial fetches from subsequent re-fetches.</li>
              <li>Implemented a glassmorphic blur overlay with inline loading spinner for background refetches.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Search & Filter</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Integrated search inputs directly inside the consolidated command bars.</li>
              <li>Wired up the active filter count indicator badge next to the filter toggle button.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Column Sorting</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Implemented column header click-to-sort parameters on the Leads table.</li>
              <li>Added column sorting to the Numbering Series table.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Toast Notifications</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Fixed event conflicts between numbering series tooltip overlays and hash icon click events.</li>
              <li>Centralised toast state under the global App main provider layer.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Design System Updates</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Added guidelines for custom loading overlays and horizontal layout bars in `UI_COMPONENTS_LIBRARY.md`.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Bug Fixes</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Fixed duplicate imports and missing variables across Contacts, Customers, Organizations, and Leads pages.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
