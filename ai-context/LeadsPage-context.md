# LeadsPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/LeadsPage.tsx`
- **Total Lines:** 2,719
- **Main Export:** `LeadsPage` (Functional Component)
- **Primary Purpose:** A sophisticated lead management dashboard featuring a Kanban board with drag-and-drop workflow, a detailed table view with advanced filtering, and administrative tools for configuring lead statuses, groups, and types.

## Detailed Imports (Lines 5-30)
- **React Core:** `useState`, `useEffect`, `useMemo`, `useRef` (Line 5).
- **Routing:** `useNavigate`, `useSearchParams` (Line 6).
- **Internal UI:** `Card`, `Badge`, `Button`, `Input`, `SearchInput`, `Select`, `DatePicker`, `FilterPopover`, `DataTable`, `SegmentToggle`, `Tooltip`, `Pagination`, `Modal`, `ConfirmModal` (Lines 7-18, 20-22).
- **Icons:** ~20 icons from `lucide-react` (Line 17).
- **State/Hooks:** `useApp` (Toast/Search), `useAppSelector`, `selectHasPermission` (Lines 18, 20, 21).
- **API Service:** `marketingAPI` and ~15 Types/Utils (Line 24).
- **Constants/Utils:** `NAME_PREFIXES`, `COUNTRY_CODES`, `DEFAULT_COUNTRY_CODE`, `serializeNameWithPrefix`, `serializePhoneWithCountryCode` (Lines 25, 26).

## Constants & Helpers (Lines 34-62)
- **`STATUS_COLORS` (Lines 34-44):** Mapping of status keys (new, won, lost) to Tailwind CSS classes.
- **`getInitials(name)` (Lines 49-54):** Converts "John Doe" to "JD".
- **`getContrastColor(hex)` (Lines 57-62):** Returns '#fff' or '#111' based on hex background luminance.

## Component State Micro-Mapping (Lines 64-165)

### View & Navigation (Lines 64-80)
- `viewMode`: 'kanban' | 'table'. Synced with URL `view` param.
- `page`, `pageSize`, `totalPages`, `total`: Pagination state.

### Data Collections (Lines 81-88)
- `leadStatuses`: Full list of workflow status options.
- `leads`: The current list of lead objects for the view.
- `isLoading`: Global loading state.
- `leadStatusGroups`: Categorization for statuses (Columns in Kanban).
- `leadTypes`: "Lead for" categories (Service, Product, etc.).

### Filter & Search (Lines 89-105, 155-165)
- `searchTerm` / `debouncedSearchTerm`: For free-text lead search.
- `selectedStatus`: Filter for Table view.
- `dateFromInput` / `dateToInput`: Input fields for date range.
- `appliedDateFrom` / `appliedDateTo`: Filter values applied to the API.
- `selectedAssignedToIds`: Multi-select for employee filtering.
- `createdByMeOnly`: Toggle for "My Leads".
- `includeWonLost`: Toggle to show/hide final statuses.
- `reportScope`: Role-based visibility info (Self vs Admin).

### Kanban Drag & Drop State (Lines 111-125)
- `draggedLeadId`: ID of the lead currently being dragged.
- `dragOverStatusId`: ID of the column target.
- `updatingLeadId`: ID of the lead currently being saved (shows pulse animation).

### Status Change Flow (Lines 126-145)
- `statusChangePending`: Object containing `leadId`, `currentStatusId`, and `newStatusId`. Triggers the mandatory log modal.
- `statusChangeForm`: Title/Description for the status change log.
- `statusChangeAttachments`: Array of files/kinds to upload during move.
- `showWonClosedValueModal`: Specific flow for Won status (requires Value + PO).

### Admin Management Modals (Lines 147-154, 166-172)
- `showStatusModal`, `editingStatus`, `statusForm`: For status CRUD.
- `editingGroup`, `addingGroup`, `groupForm`: For group CRUD.
- `showLeadTypeModal`, `editingLeadType`, `leadTypeForm`: For lead type CRUD.

## Lifecycle & Initialization (Lines 173-205)
- **`useEffect` (Debounce):** Updates `debouncedSearchTerm` after 300ms.
- **`useEffect` (Init):** Fetches statuses, groups, types, scope, and series list on mount.
- **`useEffect` (Data Sync):** Re-runs `loadLeads()` whenever filters, sorting, or view mode change.

## Logic Breakdown: Core Functions

### Data Loading: `loadLeads` (Lines 207-233)
- Sets `isLoading` to true.
- Constructs API request with: `page`, `pageSize`, `status_id`, `search`, `date_from/to`, `assigned_to`, `created_by_me`, `include_won_lost`, and sorting.
- If `viewMode === 'kanban'`, it sets `no_limit: true` and `page: 1` to get all cards for the board.

### Board Construction: `leadsByStatus` & `statusGroupsForBoard` (Lines 237-270)
- **`leadsByStatus`:** Uses `useMemo` to group the `leads` array into an object where keys are status codes.
- **`statusGroupsForBoard`:** Filters and organizes statuses into their respective `leadStatusGroups`. Adds a virtual "Won / Lost" group at the end if `includeWonLost` is enabled.

### Drag-and-Drop Workflow (Lines 559-705)
- **`handleLeadDragStart` (Lines 559-567):** Serializes lead metadata. Prevents dragging Won/Lost leads.
- **`handleColumnDrop` (Lines 590-622):** 
  - Validates source vs destination.
  - If target is Won: Opens `WonClosedValueModal`.
  - Else: Opens `StatusChangeModal` (Mandatory Log).
- **`handleStatusChangeModalSubmit` (Lines 624-685):**
  - Validates `title` and `description`.
  - If `attachment_required_on_kanban_change` is true on the target status, it validates that at least one file is attached.
  - **API Flow:** 1. `createLeadActivity` (Status Change log). 2. `uploadLeadActivityAttachments`. 3. `updateLead` (status_id).

### Won/Lost Finalization (Lines 777-846)
- **`handleWonClosedValueSubmit` (Lines 777-821):**
  - Requires valid `closed_value` and `wonPoFile`.
  - Performs `createLeadActivity` -> `uploadLeadActivityAttachments` -> `updateLead`.
  - Redirects to `/orders/new?lead_id=...`.
- **`handleMarkAsLostConfirm` (Lines 833-856):**
  - Requires `status_change_reason` (min 100 chars), `lost_to_competitor`, and `lost_at_price`.
  - Calls `updateLead` with specialized lost fields.

## JSX/Component Tree Micro-Mapping

### Header & Actions (Lines 1068-1110)
- Breadcrumbs.
- **Buttons:** "Manage statuses", "Manage lead types", "Number series", "New Lead".

### Search & Filters (Lines 1113-1279)
- `SegmentToggle` for Kanban/Table view.
- `SearchInput` (Debounced).
- "Show Won & Lost" checkbox.
- **Employee Filter (Lines 1165-1193):** Visual avatar list with a `FilterPopover` trigger for multi-selection.
- **Date Range (Lines 1195-1223):** Only visible for `isHeadOrAdmin`. `DatePicker` inputs for From/To.

### Kanban Board (Lines 1298-1647)
- **Group Wrapper (Lines 1317-1351):** Collapsible vertical container with `groupLabel` and total lead count.
- **Status Columns (Lines 1501-1638):**
  - Horizontal list of columns.
  - **Drop Zone (Lines 1515-1521):** Highlights with `border-indigo-500` on drag over.
  - **Status Header (Lines 1523-1540):** Label + Count + Inline "Plus" button to add a lead to that specific status.
  - **Lead Cards (Lines 1563-1630):**
    - Show Series (Lead #), Name, Company, Email, Potential Value.
    - **Follow-up Indicator (Line 1567):** Highlights in `bg-amber-50` if `isDueForFollowUp` is true.
    - **Actions:** Quick "Won" and "Lost" buttons.

### Table View (Lines 1650-1689)
- `DataTable` using `leadColumns` definition.
- `getRowClassName` highlights overdue rows.
- `Pagination` controls at the bottom.

### Admin Modals (Lines 1705-2719)
- **`ManageStatusModal` (Lines 2147-2469):** 
  - Two-part editor.
  - **Part 1:** Status Groups table (CRUD).
  - **Part 2:** Statuses table (CRUD). Includes complex flags: `set_when_quotation_added`, `is_hot`, `attachment_required`.
- **`StatusChangeModal` (Lines 1759-1887):** Triggered by drag-drop. Mandatory title/notes and file upload.
- **`WonClosedValueModal` (Lines 1890-1934):** Mandatory PO file upload and currency input.
- **`NumberSeriesModal` (Lines 2104-2144):** Configures local storage for the default series used in `LeadsPage`.

## Key Conditional Logic
- **Line 1195:** `isHeadOrAdmin && viewMode === 'kanban'` -> Show Date Filters.
- **Line 1320:** `isCollapsed` -> Renders a thin vertical bar instead of a full group.
- **Line 1774:** `requiresQuoteNumber && !statusChangeLead?.series` -> Shows a warning and a Series selector to generate a number before status change.
- **Line 1567:** `isDueForFollowUp(lead)` -> Dynamic background color for cards.
- **Line 2174:** `canEdit && addingGroup` -> Shows the inline creation row in the group table.
- **Line 2275:** `canEdit && statusForm.group_id === groupId && !editingStatus` -> Shows the inline creation row in the status table under the correct group.
