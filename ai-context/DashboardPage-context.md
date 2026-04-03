# DashboardPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/DashboardPage.tsx`
- **Total Lines:** 2,203
- **Main Export:** `DashboardPage` (Functional Component)
- **Primary Purpose:** A dynamic, widget-based dashboard system. Features include: Saved Dashboards, Drag-and-Drop Layouts, AI-powered SQL Widget Generation, Real-time Charting (Recharts), and an integrated Task/Follow-up management system.

## Detailed Imports (Lines 1-52)
- **React Hooks:** `useState`, `useEffect`, `useCallback`, `useId`, `useRef` (Line 1).
- **Navigation:** `useNavigate`, `Link` (Line 2).
- **State Management:** `useAppDispatch`, `useAppSelector` (Line 4).
- **Auth/Permissions:** `selectHasPermission` from `authSlice` (Line 5).
- **Tasks Redux:** `addManualTask`, `completeTaskById`, `fetchTodayTasks`, `selectTasksLoading`, `selectTodayTasks` (Line 6).
- **Internal UI:** `Card`, `Button`, `Modal`, `Input`, `Select`, `DatePicker` (Lines 8, 9, 14, 18, 19, 20).
- **Layout:** `PageLayout` (Line 10).
- **API:** `marketingAPI`, `ApiError`, and ~15 data interfaces (Lines 11, 12, 13).
- **Icons:** ~25 icons from `lucide-react` (Line 15).
- **Charts:** Extensive list from `recharts` (Lines 24-40).
- **Custom Charts:** `TargetAchievedBarChart`, `WonLostPieChart`, etc. (Lines 41-48).

## Shared Helpers (Lines 54-107)
- **`CHART_COLORS`:** Hex array for data visualization.
- **`migrateLayout(saved)` (Lines 63-72):** Normalizes legacy widget configurations to the current `WidgetConfig` type (ensuring `type` and `span` are present).
- **`WIDGET_TYPE_OPTIONS` (Lines 74-94):** 18 definitions for valid dashboard widgets (charts, tables, custom SQL, etc.).
- **`AI_SCOPE_OPTIONS` (Lines 96-101):** Scope levels for LLM-generated SQL queries.

## Helper Component: `CustomSqlWidgetContent` (Lines 110-244)
- **Purpose:** Renders the result of a backend-executed SQL query as a chart or table.
- **Logic:**
  - **Lines 135-144:** Extracts keys/columns from the first row of data.
  - **Lines 152-171 (Number Card):** Identifies the most likely "Label" and "Value" columns from the result set (searching for 'metric', 'total', etc.) and renders a large metric card.
  - **Lines 173-219 (Charts):** Maps SQL columns to a `name`/`value` format for Recharts. 
    - **Line 183:** `chartData` filter: removes zero-values for Pie charts to prevent overlap.
    - **Line 187-217:** Conditional rendering for `PieChart`, `BarChart`, or `AreaChart` (Line).
  - **Lines 223-242 (Table Fallback):** Renders a standard HTML table if no chart type is specified or if it's the fallback.

## Component State Micro-Mapping (Lines 247-380)

### Permissions & Export (Lines 248-254)
- `canViewReport`, `canCreateDashboard`, `canAssignDashboard`: Permission flags.
- `isExporting`: Loading state for the export action.
- `isEditMode`: Boolean for "Customize" mode.

### Data & Scope (Lines 256-271)
- `stats`, `recentLeads`, `reportSummary`: Basic dashboard metrics.
- `leadStatusCounts`: Data for the Status Pie Chart.
- `targetStats`, `scopeTargetStats`: Progress towards monthly goals.
- `reportScope`: Current user's role and visibility.
- `headSummary`: Specialized stats for Domain Heads (Lines 269-271).

### Redux Tasks (Lines 273-276)
- `todayTasks`: List of follow-up reminders.
- `selectedTaskId`: ID of the task being viewed in the modal.

### Inline Enquiry Log (Lines 277-302)
- `enquiryForm`: State for adding a log entry directly from a task.
- `taskModalAttachments`: Multi-file upload state.
- `quickQuotationFile`: State for the one-click "Add Quotation" feature.

### Dashboard Layout (Lines 304-325)
- `layout`: Current array of `WidgetConfig` objects. Initialized from LocalStorage and then synced with API.
- `savedDashboards`: List of all dashboards accessible to the user.
- `selectedDashboardId`: Currently viewed dashboard.
- `dashboardDateFrom/To`: Global filters for dashboard widgets.

### AI & SQL Editor (Lines 342-377)
- `aiPrompt`, `aiScopeMode`: Inputs for the generator.
- `sqlPreviewData`, `sqlPreviewError`, `sqlPreviewCompiledSql`: Results from the SQL playground.
- `editingWidgetId`: ID of the widget being modified in the modal.

## Lifecycle & Logic Breakdown

### Data Fetching: `loadDashboard` (Lines 383-467)
- Uses `Promise.all` to fetch 8 parallel data points (Leads, Contacts, Customers, Reports, Statuses, Targets, Scope).
- **Line 432:** Aggregates totals into the `stats` array.
- **Line 448-460:** Dynamically calculates `leadStatusCounts` by mapping recent leads to their status labels.

### Dashboard Loading (Lines 530-551)
- Fetches a specific dashboard's config by ID.
- **Line 536:** Merges `date_from/to` into the request.
- **Line 538:** Calls `migrateLayout` on the API response to ensure compatibility.
- **Line 542:** Sets `sqlWidgetData`, which contains the pre-calculated results for all SQL widgets in that dashboard.

### Widget CRUD (Lines 590-733)
- **`toggleResize` (Lines 590-599):** Cycles `span` through 1 -> 2 -> 3 -> 1.
- **`runSqlPreview` (Lines 647-681):** 
  - Fetches the DB `getSchema` first.
  - Calls `previewSqlTemplate` with the schema and SQL text.
  - Updates `sqlPreviewCompiledSql` (showing how variables like `{{employee_id}}` were resolved).
- **`handleGenerateWidgetWithAI` (Lines 683-713):**
  - Sends the prompt + schema to `generateWidgetWithAI`.
  - Auto-sets the resulting SQL and Chart Type and triggers a preview.

### Widget Rendering: `renderWidget` (Lines 735-1153)
- **Mapping Logic:**
  - **`leads-by-region` (Lines 762-777):** Renders `RegionBreakdownBarChart` using `headSummary` data.
  - **`target-card` (Lines 778-825):** Detailed card with a progress bar (`achieved / target`).
  - **`head-summary` (Lines 826-880):** Table showing Region-wise Won/Lost/Hot/Conversion stats.
  - **`custom_sql` (Lines 1140-1149):** Passes data from `sqlWidgetData[config.id]` to `CustomSqlWidgetContent`.

### Task Completion Logic (Lines 1568-1952)
- **Lines 1705-1748 (Quick Qtn):** One-click file upload. Calls `createLeadActivity` -> `uploadLeadActivityAttachments` -> `completeTaskById`.
- **Lines 1855-1952 (Detailed Log):** Full form including Status Change and multi-file attachments.

## JSX/Component Tree Micro-Mapping

### Command Toolbar (Lines 1424-1481)
- **Dashboard Search (Line 1427):** Combobox for switching between saved dashboards.
- **Date Filters (Line 1443):** DatePickers for `dateFrom/To`.
- **Primary Actions (Line 1466):** "New Dashboard" and "Assign".

### Dashboard Grid (Lines 1503-1566)
- **Empty State (Lines 1526-1540):** Aesthetic "Your Workspace is Empty" CTA.
- **Grid (Line 1542):** 4-column responsive grid using `renderWidget`.

### Task Sidebar (Lines 1568-1662)
- **Desktop (Lines 1604-1662):** Sticky right column.
- **Item (Lines 1618-1647):** Checkbox + Title + Description. Clicking opens the Modal.

### Add Widget Modal (Lines 2084-2199)
- **AI Section (Lines 2088-2121):** Prompt textarea + Scope selector + "Generate" button.
- **SQL Editor (Lines 2146-2172):** Textarea + Help text + Schema link.
- **Preview Section (Lines 2179-2200):** Real-time playground for testing queries.

## API Data Flow Mapping
- **AI Generator:** `aiPrompt` -> `generateWidgetWithAI` API -> `sql` code -> `previewSqlTemplate` -> `sqlPreviewData`.
- **Saved Dashboard:** `selectedDashboardId` -> `getSavedDashboard` API -> `config.layout` -> `layout` state.
- **SQL Data:** Dashboard API response includes `widget_data` (keyed by widget ID), which is stored in `sqlWidgetData` state and passed to children.

## Key Conditional Logic
- **Line 1175:** Layout changes trigger an automatic debounced (600ms) save to the backend.
- **Line 1568:** Task list is hidden if the user is in a `domain_head` or `super_admin` role.
- **Line 1774:** `taskModalAttachments.some(e => e.kind === 'quotation')` -> Renders the "Series" and "Revision" fields.
- **Line 2146:** `addWidgetType === 'custom_sql'` -> Renders the SQL-specific help documentation and playground.
