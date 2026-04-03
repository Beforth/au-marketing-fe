# EmployeesPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/EmployeesPage.tsx`
- **Total Lines:** 600
- **Main Export:** `EmployeesPage` (Functional Component)
- **Primary Purpose:** Management of the Marketing Team. It lists all users from HRMS who have been assigned to specific Domains or Regions and allows admins to grant/revoke access and set roles (Region Head, Domain Head).

## Component State Micro-Mapping (Lines 45-80)
- `assignments`: Raw array of `RegionAssignment` objects from the API.
- `domains`: List of all domains (used to find Domain Heads).
- `assignModalOpen`: Controls the complex multi-step assignment dialog.
- `assignRole`: 'employee' | 'head' (Region) | 'domain_head'.
- `employeeAssignments`: The specific access list for the user currently being edited in the modal.

## Lifecycle & Initialization (Lines 82-100)
- **`useEffect` (Main):** Fetches raw assignments and domains in parallel.
- **`useEffect` (Debounce):** Triggers client-side filtering of the team list.

## Logic Breakdown: Core Functions

### Data Transformation (Lines 105-155)
- **`rows` (useMemo):** This is the most critical logic block.
  - 1. It takes flat assignments and groups them by `employee_id`.
  - 2. It scans the `domains` list to find "Domain Heads" (who aren't in the region assignment table) and merges them into the same list.
  - 3. Results in a clean `AssignedUserRow` showing a person's name and a list of ALL their marketing roles.

### Assignment Logic (Lines 200-260)
- **`handleAssign` (Lines 200-260):** 
  - **Case 1 (Domain Head):** Calls `updateDomain` to link the employee.
  - **Case 2 (Region):** Calls `assignEmployeeToRegion` with a role.
  - It automatically refreshes the "Current assignments" list within the modal after success.

## JSX/Component Tree Micro-Mapping

### Main Table (Lines 325-400)
- **`DataTable` (Lines 340-390):** 
  - Column 1: Name.
  - Column 2: Email.
  - Column 3: Assignments (renders a list of `Badge` components with icons: `Globe` for Domain, `MapPin` for Region).
  - Action: Settings icon opens the management modal.

### Manage Assignment Modal (Lines 405-580)
- **User Selector (Line 415):** `AsyncSelect` to find people from HRMS.
- **Role Selector (Line 450):** Dropdown to choose authority level.
- **Current Access List (Lines 485-550):** A scrollable list of existing assignments with "Remove" buttons. This allows managing a user's entire marketing footprint in one place.

## Key Logic Flows
- **Hybrid Data Source:** Roles are stored in two places: Domain Heads are on the `Domain` object, while Region Employees are in the `Assignment` table. This page abstracts that difference for the user.
- **Permissions:** The "Assign" and "Remove" buttons are strictly guarded by `canManageRegionEmployees`.
- **HRMS Proxy:** The page uses `marketingAPI.getEmployees` which acts as a bridge to the HRMS module to fetch person data.
