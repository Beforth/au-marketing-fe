# ReportTemplatesPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/ReportTemplatesPage.tsx`
- **Total Lines:** 798
- **Main Export:** `ReportTemplatesPage` (Functional Component)
- **Primary Purpose:** An administrative tool for creating dynamic, SQL-driven reports. Users can define "Sections" containing SQL queries with placeholders, and the page renders the results as interactive tables with client-side filtering and sorting.

## Component State Micro-Mapping (Lines 45-100)
- `templates`: List of available report definitions.
- `selectedId`: The active template being viewed.
- `templateDetail`: The full config and **pre-executed section data** for the selected template.
- `dateFrom`, `dateTo`: Global filters passed into SQL placeholders.
- `entityFilters`: Record of values for specific placeholders (e.g., `{{lead_id}}`).
- `sectionSearch`, `sectionSort`, `sectionFilter`: Client-side UI state for the rendered tables.

## Lifecycle & Initialization (Lines 102-150)
- **`useEffect` (Initial):** Fetches all templates.
- **`useEffect` (Detail):** Triggers `loadDetail` whenever the `selectedId`, dates, or entity filters change. This calls the backend to execute the SQL.

## Logic Breakdown: Core Functions

### Data Loading (Lines 155-250)
- **`buildReportParams` (Lines 155-175):** Serializes all filter states into a format the API expects (`lead_ids` as comma-separated strings).
- **Placeholder Loading (Lines 200-250):** Dynamically fetches options for filters (Domains, Leads, Contacts) based on which `{{placeholders}}` are present in the SQL.

### Section Management (Lines 310-400)
- **`handleAddOrEditSection` (Lines 310-335):** Updates the JSON `config.sections` array in the template.
- **`handleGenerateSectionWithAI` (Lines 360-390):** Sends a prompt to the AI service to generate a valid SQL query based on the database schema.

### UI Processing (Lines 265-300)
- **`getFilteredAndSortedRows` (Lines 265-300):** A complex utility that performs client-side filtering (search, column-match) and type-aware sorting (numeric vs string) on the raw result sets.

## JSX/Component Tree Micro-Mapping

### Toolbar (Lines 415-450)
- Template Selector, Refresh, "New Template" and "Assign" buttons.

### Filter Card (Lines 455-510)
- **Report Parameters (Line 455):** Dynamically renders `DatePicker` or `Select` components based on the `templateDetail.placeholders` array.

### Report Sections (Lines 535-680)
- **Section Wrapper (Line 560):** Card with Title, Edit/Delete actions.
- **Section Toolbar (Lines 590-630):** Search input and Column-specific filter dropdown.
- **Dynamic Table (Lines 640-680):** Renders headers from object keys. Implements interactive sorting on click.

### Modals (Lines 685-798)
- `CreateTemplateModal`, `AddSectionModal` (including AI Generator UI), and `AssignModal`.

## Key Logic Flows
- **Dynamic Placeholders:** The backend parses the SQL strings for `{{...}}`. The frontend then reads the `placeholders` array in the response to determine which UI filters to show.
- **SQL Execution:** Unlike the Dashboard which executes widgets, this page executes the entire template (multiple sections) in one `getReportTemplate` call.
- **AI Integration:** Uses `generateWidgetWithAI` but specialized for 'table' charts.
