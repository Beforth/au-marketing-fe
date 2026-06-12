import React from 'react';

interface ChangelogContentProps {
  appVersion: string;
}

export const ChangelogContent: React.FC<ChangelogContentProps> = ({ appVersion }) => {
  return (
    <div className="space-y-10 text-sm text-slate-700 max-h-[70vh] overflow-y-auto pr-3 scrollbar-thin">
      
      {/* ==================== VERSION 1.0.6 (June 12, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg">
            Version {appVersion}
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 12, 2026 (Latest)
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-indigo-100">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">New Pages</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Daily Status Report (DSR):</strong> New page showing pending/completed daily tasks. Quick-access dropdown in the Navbar with pending count badge, grouped lists, and refresh button.</li>
              <li><strong>My Team:</strong> New employee oversight page behind permission control. Added to sidebar nav.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Performance</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>ReportsPage Caching:</strong> Data cache for expected order and OD plan reports per employee filter — eliminates re-fetching on re-mount.</li>
              <li><strong>Scope Cache:</strong> Added caching utility for report scope data.</li>
              <li><strong>Dashboard Persistence:</strong> Last selected dashboard ID saved and restored on reload.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Removed</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Today's Tasks:</strong> Removed from Dashboard. Includes the tasks card, add-task modal, task completion flow, and enquiry form within task modal.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">UI Polish</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Skeleton Loaders:</strong> Replaced plain "Loading..." text with skeleton pulse animations on ReportsPage.</li>
              <li><strong>Design Doc Rewrite:</strong> Design system reference fully rewritten with accurate component patterns.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Code Quality</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>HRMS RBAC:</strong> Added DSR types and API client method.</li>
              <li><strong>Select:</strong> Added support for free-text combobox entry.</li>
              <li><strong>Auth Utils:</strong> New shared auth utility module.</li>
              <li><strong>ChangelogModal:</strong> New in-app changelog display component.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.5 (June 11, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version v1.0.5
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 11, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-indigo-100">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Enquiry Log Type Cleanup</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Type Options Trimmed:</strong> Reduced the activity type dropdown from 20 options to 5: <code>Note</code>, <code>Contacted</code>, <code>Call</code>, <code>Email</code>, <code>Meeting</code>. Removed unused enquiry follow-up statuses (QTN submitted, order loss, etc.).</li>
              <li>Updated both <code>LeadFormPage.tsx</code> (lead edit page) and <code>DashboardPage.tsx</code> (task modal).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Lead Edit Page Layout Reorder</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Lead Details at Top:</strong> Moved the "Lead details" card above the tabs and follow-up bar.</li>
              <li><strong>Side-by-Side Tabs:</strong> Enquiry log / Lead status log pills and the Follow-up bar now sit on the same row, vertically centered with a reduced gap.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Follow-up Pill Simplified</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Stripped to Essentials:</strong> Removed quick-date buttons (Tomorrow 10:00 / Next week), repeat type dropdown (No reminder / Daily / Weekly / Monthly), and scheduled date text.</li>
              <li><strong>Custom DatePicker:</strong> Replaced the native <code>&lt;input type="datetime-local"&gt;</code> with the app's <code>DatePicker</code> component — clicking the calendar icon opens the date-time picker popup.</li>
              <li><strong>Scheduled Date Shown:</strong> Selected date/time displays beside the Save button for easy reference.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">State Field → Indian States Autocomplete</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Changed all address state fields from free-text inputs to a searchable combobox listing all 28 Indian states + 8 union territories.</li>
              <li>Still allows custom text entry for international addresses via the <code>creatable</code> prop on the Select component.</li>
              <li>Updated across LeadFormPage, OrganizationFormPage, CustomerFormPage, and ContactFormPage (10 locations total).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Industry Field → Dropdown</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Changed all organization industry inputs to a dropdown with 3 options: End User, Distributor / Dealer, Consultant.</li>
              <li>Updated across 6 form pages: OrganizationFormPage, LeadFormPage, CustomerFormPage, ContactFormPage, and ODPlanPage.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Domain Coordinator Dashboard 404 Fix</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Fixed <code>_can_view</code> and <code>_can_edit</code> in <code>saved_dashboards.py</code> to apply the domain coordinator role override (<code>domain_head</code> → <code>domain_coordinator</code>) that <code>_list_visible_dashboard_ids</code> already used.</li>
              <li>Domain coordinators were getting 404 when viewing individual dashboards assigned to the <code>domain_coordinator</code> role, even though the list endpoint showed them correctly.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Other Changes</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Attach Files Highlighted:</strong> Made "Attach files" and "Add attachments" buttons more prominent with dashed indigo border pill styling in the lead edit page.</li>
              <li><strong>Favicon:</strong> Switched from <code>/mkt_logo.png</code> to <code>/favicon.ico</code> for proper rendering at all sizes.</li>
              <li><strong>Version Bump:</strong> Updated from v1.0.4 to v1.0.5.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.4 (June 8, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version v1.0.4
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 8, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-slate-200">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Quotation Submitted (4x) Progress Bar</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>New Quotation Target Bar:</strong> Added a second progress bar below the existing target bar on the Domains page. Target = yearly target &times; 4 (stretch goal). Achieved = sum of <code>quote_value</code> for <code>quotation_submitted</code> leads.</li>
              <li><strong>Quarterly Breakdown:</strong> Bar is segmented into four 25% quarter blocks with independent gradient fills and milestone markers, matching the existing target bar pattern.</li>
              <li><strong>Same Scope Rules:</strong> Visible to super_admin, domain_head, region_head, employee, domain_coordinator, and region_coordinator — identical to the existing target bar.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Quote Value Field &amp; Backend</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong><code>quote_value</code> Column:</strong> Added <code>numeric(12,2)</code> column to the <code>ActivityAttachment</code> model. Mandatory when uploading quotation attachments.</li>
              <li><strong>Scope Stats:</strong> <code>get_scope_target_stats</code> now returns <code>quotation_submitted_value</code> — the sum of quote values for leads with status <code>quotation_submitted</code>, scoped by the same visibility rules.</li>
              <li><strong>Frontend Inputs:</strong> Mandatory quote value fields added in LeadFormPage (add-log, quick add, inline attachment, initial quotation create) and DashboardPage (task modal).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Database Scoping by Domain &amp; Region</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Organizations — Domain-Level Scoping:</strong> Organizations are now filtered by domain. Domain heads see only orgs linked to their domain via contacts/customers; region heads see orgs in their region's parent domain; employees see orgs they created or in their domain.</li>
              <li><strong>Customers &amp; Contacts — Strict Isolation:</strong> Domain heads see all customers/contacts in their domain. Region heads see only those in their specific region. Employees see only records they personally created.</li>
              <li><strong>Backend Enforcement:</strong> All organization, plant, customer, and contact endpoints now enforce role-based scope filters at the API level — users cannot access records outside their domain/region even with direct URLs or API calls.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Stability &amp; Bug Fixes</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>OD Plan Page Crash:</strong> Fixed "Maximum update depth exceeded" on SPA navigation — the calendar navigation effect used a stale Zustand closure instead of the fresh store value, causing an infinite loop between URL↔store sync. Now reads state via <code>getState()</code>.</li>
              <li><strong>Head Summary 500 Error:</strong> The <code>/api/dashboard/head-summary</code> endpoint returned a 500 for head roles because the query logic was accidentally placed after a <code>return</code> inside <code>get_quotation_stats</code>. Moved it into the correct endpoint.</li>
              <li><strong>Expected Order — Hot Leads Filter:</strong> Added <code>is_hot</code> query param to <code>GET /api/leads/</code> to filter hot-status leads. The frontend was missing the <code>queryParams.append('is_hot', 'true')</code> call — fixed so the "Create Expected Order" page now correctly shows only hot leads.</li>
              <li><strong>Expected Order — Carry-Forward Logic:</strong> Was using <code>isCurrentMonth</code> so future months wrongly showed gray (carried forward). Changed to <code>isPast</code> — future/current months show yellow (Expected), past months show gray (Carried forward).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">OD Plan — Accordion Redesign</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Calendar → Accordion:</strong> Replaced the calendar matrix with a collapsible accordion daily itinerary list.</li>
              <li><strong>Auto-Save:</strong> Every add/edit/delete immediately persists to the server — no manual save button.</li>
              <li><strong>Multi-Select DatePicker:</strong> Replaced the 31-day accordion with a DatePicker dropdown supporting multi-select. Selected dates persist via URL query param <code>dates</code> across refresh.</li>
              <li><strong>Delete Confirmation:</strong> Delete triggers a confirmation modal ("Keep it" / "Delete") instead of immediate removal.</li>
              <li><strong>Summary Stats Bar:</strong> Shows visit count, travel count, return count, and days with entries at the top.</li>
              <li><strong>Tooltip on Edit/Delete:</strong> Replaced native <code>title</code> attributes with the app's Tooltip component.</li>
              <li><strong>Removed Zustand Calendar Store:</strong> Eliminated entirely to prevent the infinite loop.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Expected Order — Color-Coded Status</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Status Fields:</strong> Added <code>lead_status_label</code>, <code>lead_is_final</code>, <code>lead_is_lost</code> to the expected order report lead items, populated live from <code>Lead.status_option</code>.</li>
              <li><strong>Color-Coded Modal:</strong> View modal now shows colored left borders and status badges per lead — green (Won), red (Lost), yellow (Expected), gray (Carried forward). Summary bar shows counts per status.</li>
              <li><strong>Auto-Select Employee Fix:</strong> Removed the block that auto-selected <code>data.employees[0]</code> — now starts with placeholder.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Reports Page UI Cleanup</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Card-Style Expected Orders:</strong> Replaced the table rows with clickable cards matching the OD plan style, showing month name, lead count, and colored dot summary (won/lost/expected/carried).</li>
              <li><strong>Side-by-Side Grid:</strong> Expected orders and OD plans now sit in a 2-column grid on wider screens.</li>
              <li><strong>Icon Empty States:</strong> Replaced bare text empty messages with Calendar/MapPin icons.</li>
              <li><strong>Month Name Display:</strong> All dates now show "Jul 2026" format instead of "2026 / 7".</li>
              <li><strong>Filter Card Loading Skeleton:</strong> Shows a pulsing skeleton while scope loads — no more empty white card flash.</li>
              <li><strong>Removed Coming-Soon Button:</strong> Removed the "Create report" button that only toasted "coming soon".</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">UI Polish</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>React Key Prop Warning:</strong> Removed <code>key</code> from the <code>commonProps</code> spread object — React requires <code>key</code> directly on JSX elements, not via spread. Added <code>key=&#123;config.id&#125;</code> directly on all 28 dashboard Card widgets.</li>
              <li><strong>Sidebar Cleanup:</strong> Commented out the "Report templates" sidebar link — the feature was never fully implemented.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.3 (June 8, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version v1.0.3
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 8, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-slate-200">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Quotation Revision System</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Smart Numbering:</strong> Fixed revision suffix to start at <code>(rev1)</code> instead of <code>(rev2)</code>. The base quotation remains suffix-less.</li>
              <li><strong>Auto-Detection:</strong> System now automatically detects existing quotations and marks new ones as "Revised" without manual input.</li>
              <li><strong>UI Cleanup:</strong> Hidden the numbering series and revised checkbox in the Enquiry Log when a quotation already exists to simplify the workflow.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Domain Target Visibility Fix</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Target Tracking Fix:</strong> Fixed an issue where leads assigned to a domain but lacking a region were not counted in the "All Domains Target" progress bar.</li>
              <li><strong>Role-Based Scoping:</strong> Domain Heads and Super Admins now correctly see aggregated stats including region-less leads.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Improved Error Messaging</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Descriptive Toasts:</strong> Replaced generic "An error occurred" messages with specific descriptions for common database failures.</li>
              <li><strong>Numeric Overflows:</strong> Clear feedback is now provided when values are too large for currency fields (e.g., potential value exceeding 8 digits).</li>
              <li><strong>Lead Creation Cleanup:</strong> Removed the "Mark as revised" checkbox during lead creation to simplify the flow.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Backend Improvements</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Enhanced Filtering:</strong> Statistics endpoints now use refined scoping logic for higher data accuracy.</li>
              <li><strong>Coordinator Alignment:</strong> Domain Coordinators now have identical target visibility to Domain Heads.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.2 (June 7, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version v1.0.2
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 7, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-slate-200">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">New Dashboard Widgets</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Created Quotation by Month:</strong> New line-chart widget showing quotation creation over time with a toggle for Day/Week/Month grouping.</li>
              <li><strong>Avg Quotation Revisions:</strong> New bar-chart widget showing revision count distribution across quotations.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Domain Coordinator Dashboard</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Separate Dashboard:</strong> Created a dedicated Domain Coordinator Dashboard — same as Domain Head but without "Leads by Kanban Stage" and "Recent Domain Leads Requiring Action" widgets.</li>
              <li><strong>Role Support:</strong> Added <code>domain_coordinator</code> as a valid assignment role. Coordinators automatically see their dashboard.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Bug Fixes</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Kanban chart — invisible zero bars:</strong> Bar, line, and pie charts now filter out value series where all data points are 0. The "Leads by Kanban Stage" widget no longer shows a empty legend circle for <code>total_amount</code> when no data exists.</li>
              <li><strong>Single number-card widgets missing resize/delete/move:</strong> Fixed grouping logic so standalone number-card widgets render with full edit-mode capabilities.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.2 (June 6, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version v1.0.2
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 6, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-indigo-100">
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Dashboard & KPI Card Upgrades</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Sales Rep Dashboard Seeding</strong>: Updated seeding scripts to fully populate data for Sales Reps, splitting single KPI summaries into separate number cards.</li>
              <li><strong>Redesigned KPI Number Cards</strong>: Redesigned to match target-card pattern with linear gradient backgrounds, rounded-xl corners, text-xl bold values, and direct flex icons.</li>
              <li><strong>Top Representatives Leaderboard</strong>: Rewrote leaderboard widget to support rank-specific styles and high-density typography.</li>
              <li><strong>Chart Fills Upgrade</strong>: Upgraded all chart elements from solid fills to premium SVG linear gradients.</li>
              <li><strong>Y-Axis Value Formatting</strong>: Added compact currency formatting (₹ Cr / L / K) to charts.</li>
              <li><strong>Multi-Record Hints</strong>: Added a hint showing "First of N records" when table rows exceed 1.</li>
              <li><strong>Layout and Typography Tweaks</strong>: Changed standard Card titles to uppercase tracking-widest and refined global transition durations to a snappy 200ms window.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC) & Dashboard Configuration</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Saved Dashboard Model Changes</strong>: Added a nullable role column to dashboard assignments along with database constraints.</li>
              <li><strong>Refactored Backend Routing Permissions</strong>: Refactored visibility & permissions checking helpers to accept user dict objects directly.</li>
              <li><strong>Role-Based Assignments</strong>: Enabled dashboard configurations to be assigned programmatically to roles (e.g. super_admin, domain_head, etc.).</li>
              <li><strong>Frontend Integration</strong>: Updated assignment requests to make employee IDs optional and support role assignment.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Deprecated Features & Code Cleanup</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Disabled AI Widget Generation</strong>: Commented out the backend and frontend endpoints and UI states for AI widget generation.</li>
              <li><strong>Restoration Documentation</strong>: Created a detailed restoration checklist (`ai_dashboard_restoration.md`) for potential future use.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ==================== VERSION 1.0.1 (June 4, 2026) ==================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-slate-700 bg-slate-50 border border-slate-200 rounded-lg">
            Version v1.0.1
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            June 4, 2026
          </span>
        </div>

        <div className="space-y-6 pl-4 border-l-2 border-slate-100">
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
