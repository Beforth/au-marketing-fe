# DomainsPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/DomainsPage.tsx`
- **Total Lines:** 1,618
- **Main Export:** `DomainsPage` (Functional Component)
- **Primary Purpose:** Management of Marketing Territories (Domains and Regions). It features a "List" view for standard CRUD and an "Extreme" "Review" view that visualizes the organizational hierarchy (Domain Head -> Region Head -> Employee) and allows for monthly target setting and team assignments.

## Detailed Imports (Lines 6-27)
- **React Core:** `useState`, `useEffect`, `useRef` (Line 6).
- **Routing:** `useNavigate` (Line 7).
- **Internal UI:** `Card`, `Badge`, `Button`, `Input`, `Select`, `AsyncSelect`, `FilterPopover`, `Modal`, `Pagination`, `ConfirmModal`, `SegmentToggle` (Lines 8-15, 20-22, 26).
- **Icons:** ~20 icons from `lucide-react` (Line 16, 24).
- **State/Hooks:** `useApp` (Toast), `useAppSelector`, `selectHasPermission` (Lines 17-19).
- **API Service:** `marketingAPI` and ~10 data interfaces (Line 23).
- **Styling:** `cn` (Line 25).

## Constants & Helpers (Lines 29-53)
- **`ViewMode`:** `'list' | 'review'`.
- **`TargetHierarchyModal`:** Union type for setting targets at 3 levels (employee, region, domain).
- **`MONTHS`:** Array of 3-letter month names (Jan-Dec).
- **`formatTargetAmount(amount)` (Lines 48-53):** 
  - Converts numbers to Indian numbering system strings (e.g., 1 Crore = 100 Lakhs).
  - Logic: `amount >= 1,00,00,000` -> `₹X.XX Cr`, `amount >= 1,00,000` -> `₹X.XX L`.

## Component State Micro-Mapping (Lines 56-115)

### Permissions (Lines 57-66)
- ~10 permission flags (e.g., `canView`, `canCreate`, `canAssignEmployeeRegion`) derived from Redux.

### Navigation & List View (Lines 68-84)
- `viewMode`: Defaults to `'review'`.
- `domains`, `regions`: Data arrays for the List view.
- `page`, `pageSize`, `total`, `totalPages`: Pagination state.
- `expandedDomains`: `Set<number>` of domain IDs that have their region sub-table open.

### Review View (Hierarchy) (Lines 87-93)
- `reviewDomains`, `reviewRegions`: Arrays for the tree view.
- `reviewAssignments`: All active `AssignmentWithEmployee` records (linking employees to regions).
- `viewingTeamRegion`: The region whose team is currently being managed in a modal.

### Management Modals (Lines 94-110)
- `setDomainHeadDomain` / `setRegionHeadRegion`: The entity whose head is being updated.
- `addEmployeeRegion`, `addEmployeeSelected`, `addEmployeeRole`: State for the "Add Employee to Region" flow.
- `removeAssignmentId`: ID for the deletion confirmation.

### Monthly Targets (Lines 112-115)
- `targetYear`, `targetMonth`: Period selectors for target setting.
- `targetSummary`: Hierarchical data object from `getDomainTargetSummary`.
- `targetHierarchyModal`: Configuration for the "Set Target" dialog.

## Lifecycle & Initialization (Lines 118-185)
- **`useEffect` (Debounce):** 300ms delay for the List view search term.
- **`useEffect` (List Load):** Triggers `loadData()` whenever pagination or filters change.
- **`useEffect` (Review Load):** Triggers `loadReviewData()` whenever `viewMode` switches to `'review'`.
- **`useEffect` (Target Load):** Triggers `loadDomainTargetSummary()` whenever the selected month/year changes.

## Logic Breakdown: Core Functions

### Data Loading (Lines 135-185)
- **`loadReviewData` (Lines 135-151):** 
  - Uses `Promise.all` to fetch Domains, Regions, and Assignments.
  - Ensures the tree view has all necessary links to visualize heads and teams.
- **`loadData` (Lines 178-197):** Paginated fetch for the List view.

### Hierarchy Management (Lines 234-338)
- **`handleSetDomainHead` (Lines 234-263):** 
  - If `employeeId` is empty, clears the head via `updateDomain`.
  - Else, fetches the employee details and updates the domain with their ID and Name.
- **`handleAddRegionEmployee` (Lines 298-323):** 
  - Calls `assignEmployeeToRegion` with employee details and role.
  - Role can be `'head'` or `'employee'`.
- **`handleChangeAssignmentRole` (Lines 326-338):** Toggles an existing assignment between 'head' and 'employee' via `updateEmployeeAssignment`.

### Target Logic (Lines 340-414)
- **`handleSaveHierarchyTarget` (Lines 340-369):** 
  - Parses `setTargetAmount`.
  - Dispatches to `setEmployeeTarget`, `setRegionTarget`, or `setDomainTarget` based on the modal's `kind`.
  - Amount `0` acts as a "Clear" for regions/domains (falling back to team roll-up).
- **Target Memos (Lines 371-414):** Helper functions to extract specific targets from the nested `targetSummary` object by searching through the hierarchy.

## JSX/Component Tree Micro-Mapping

### Period & Summary Header (Lines 441-477)
- **Month/Year Selectors:** Dropdowns to change the target period.
- **Total Target Card (Line 466):** Displays the grand total for the entire company for that month (e.g., "₹5.50 Cr").

### Review View (The Tree) (Lines 479-718)
- **Domain Node (Lines 503-568):** 
  - Features `Globe` icon.
  - Displays Head name and Domain Goal (or Team Target if no goal set).
  - **Actions:** "Set Goal" (Target icon) and "Set Head" (Button).
- **Region Node (Lines 572-645):** 
  - Nested via `border-l-2` branch.
  - Displays Head name and Region Goal.
  - **Actions:** "Set Goal", "Set Head", and "Add Employee".
- **Employee Node (Lines 649-712):** 
  - Shows `User` icon, name, and role badge.
  - Displays individual Monthly Target.
  - **Actions:** "Set Target", "Change Role" (Select), and "Remove" (Trash).

### List View (The Table) (Lines 721-1153)
- **Table Row (Lines 833-1153):** 
  - **Expansion Toggle (Line 837):** Chevron button to show/hide region sub-table.
  - **Actions:** "Set Head", "Add Region", "Edit", "Delete".
- **Region Sub-table (Lines 945-1150):** 
  - A nested table inside an expanded row.
  - Columns: Name, Code, Status, Head, Target, Actions.
  - **Manage Team (Line 1104):** Opens the `ManageRegionTeam` modal.

### Modals (Lines 1156-1615)
- **`TargetHierarchyModal` (Lines 1156-1199):** Input for ₹ amount.
- **`SetDomainHead` / `SetRegionHead` (Lines 1227-1284):** Uses `AsyncSelect` with employee search.
- **`ManageRegionTeam` (Lines 1355-1444):** 
  - List of employees in the region.
  - **Inline actions:** Set Target, Toggle Role (Head/Employee), Remove from Region.

## Key Logic Flows
- **Target Roll-up:** If a Region Goal is set (Assigned), that value is used for the domain total. If not, the sum of all employee targets in that region (Rolled-up) is used.
- **Expansion Loading:** Regions for a specific domain are only fetched via `loadRegionsForDomain` when that domain's row is expanded in the List view.
- **Head Synchronization:** Setting an employee as "Region Head" via the `AddRegionEmployee` modal is equivalent to using the `SetRegionHead` modal; both update the same database state.
- **Delhi/Mumbai Example:** If Mumbai Region has 3 employees with 10L targets each, the "Rolled-up" target is 30L. If the manager sets an "Assigned" goal of 35L, the dashboard will track against 35L.
