# NumberingSeriesPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/NumberingSeriesPage.tsx`
- **Total Lines:** 633
- **Main Export:** `NumberingSeriesPage` (Functional Component)
- **Primary Purpose:** An administrative module for managing dynamic numbering schemes (e.g., `LEAD-2024-001`). It includes a pattern builder with real-time preview and a list view for manual number generation and CRUD.

## Component State Micro-Mapping (Lines 60-110)
- `isForm`, `isEdit`: Derived from route path to toggle between List and Editor modes.
- `list`, `total`, `page`: Standard paginated data for the `DataTable`.
- `generatedValue`: Holds the result of a "Generate Next" API call for UI copy-pasting.
- `formPattern`: The core template string (e.g., `{YYYY}-{0:4}`).
- `formNextValue`: The current sequence counter.
- `formResetPeriod`: When the counter should return to 1 (Day/Month/Year).

## Lifecycle & Initialization (Lines 112-150)
- **`useEffect` (Debounce):** Handles searching name/code with a 300ms delay.
- **`useEffect` (Main):** Triggers `loadList()` or `loadSeriesForEdit()` based on the mode.

## Logic Breakdown: Core Functions

### Pattern Preview (Lines 43-65)
- **`previewPattern` (Lines 43-65):** A pure utility that uses Regex to replace `{YYYY}`, `{MM}`, and `{0:N}` placeholders with current date values and the sample sequence. This powers the "Live Preview" box in the form.

### CRUD Operations (Lines 185-250)
- **`handleSave` (Lines 185-220):** Creates or updates the `Series` object. Includes validation for required pattern fields.
- **`handleGenerateNext` (Lines 235-250):** Calls `marketingAPI.generateNextSeriesNumber` which executes the pattern logic on the server and increments the counter.

## JSX/Component Tree Micro-Mapping

### List View (Lines 340-480)
- **Search & Toggle (Lines 345-375):** Filters by keyword and Active/Inactive status.
- **`DataTable` (Lines 400-480):** 
  - Columns: Name, Code, Used For (Badge), Reset (Text), Pattern (Mono), Next Value (Bold).
  - **Action Block (Lines 440-475):** Includes a Hash button to trigger manual generation.

### Editor Form (Lines 265-335)
- **Pattern Builder (Lines 290-310):** A row of quick-insert buttons for placeholders like `{YYYY}`, `{MM}`, etc.
- **Context Help (Line 285):** Documentation on using cross-entity placeholders (e.g., `{customer.company_name}`).
- **Preview Card (Line 325):** Monospace box showing exactly what the next generated ID will look like.

## Key Logic Flows
- **Sequence Reset:** The `reset_period` logic is handled by the backend, but the frontend allows configuring it to automate counter resets at the start of a Month or Year.
- **Placeholders:** The page distinguishes between Time placeholders (handled locally for preview) and Context placeholders (resolved by the API using actual Lead/Customer data).
- **Manual Override:** The "Hash" icon in the list allows admins to "burn" a number or test the series without creating a real entity.
