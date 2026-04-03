# ODPlanPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/ODPlanPage.tsx`
- **Total Lines:** 801
- **Main Export:** `ODPlanPage` (Functional Component)
- **Primary Purpose:** A calendar-based interface for planning "Outdoor" activities (Visits, Travel, Return Home). It allows users to plot their schedule for a specific month and link visits to specific Contacts.

## Component State Micro-Mapping (Lines 60-120)
- `year`, `month`: Derived from URL search params or defaults to next month.
- `report`: The current `ODPlanReportItem` containing metadata (status, user).
- `entries`: Array of local `ODPlanEntryItem` objects (unsaved changes).
- `entryForm`: state for the "Add/Edit Entry" modal.
- `contactSearch`, `contactSearchResults`: For linking a visit to a Person.
- `createContactForm`: Inline contact creation logic (similar to Lead Form).

## Lifecycle & Initialization (Lines 122-160)
- **`useEffect` (Report Load):** Fetches the report for the active year/month.
- **`useEffect` (Navigation Sync):** Synchronizes the internal `useCalendar` store with the URL parameters.

## Logic Breakdown: Core Functions

### Entry Management (Lines 240-300)
- **`openAddEntry` (Lines 240-255):** Initializes the form for a specific date.
- **`saveEntryToLocal` (Lines 275-295):** Does NOT call the API. It updates the `entries` array in local state, allowing the user to "draft" a month's plan before saving.
- **`removeEntry` (Line 297):** Deletes from local state.

### Persistence (Lines 302-325)
- **`handleSaveReport` (Lines 302-325):** Maps local entries to `ODPlanEntryCreate` objects and calls `saveODPlanReport`. This updates the entire month's data at once.

### Contact Management (Lines 327-360)
- **`handleCreateContact` (Lines 327-360):** Full creation flow for a contact including Org/Plant linking, used when a user wants to visit someone not yet in the database.

## JSX/Component Tree Micro-Mapping

### Header & Actions (Lines 400-430)
- **Save Button (Line 410):** Only visible if `entries.length > 0`.
- **Calendar Navigation (Line 445):** Uses `CalendarProvider` and `CalendarDatePicker`.

### Calendar Body (Lines 450-475)
- **`CalendarBody` (Line 455):** Renders the grid.
- **`CalendarItem` (Line 465):** Custom renderer for the entry blocks. Colors are dynamic: indigo for Visits, amber for Travel.

### Modals (Lines 480-800)
- **Entry Modal (Lines 485-565):** Date, Type (Visit/Travel/Return), Location, and Contact search.
- **Contact Modal (Lines 570-750):** Detailed form for creating a person and optionally a new organization.

## Key Logic Flows
- **Drafting Pattern:** Unlike most pages, this uses a "Draft and Save All" pattern. Changes to individual days are local until `handleSaveReport` is clicked.
- **Negative IDs:** Temporary local entries use `-(Date.now())` as an ID to distinguish them from database-persisted records.
- **URL-Driven State:** The page entirely relies on `?year=X&month=Y`. Navigation in the calendar triggers a `navigate()` call which then triggers the `loadReport` effect.
