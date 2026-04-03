# OrganizationFormPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/OrganizationFormPage.tsx`
- **Total Lines:** 576
- **Main Export:** `OrganizationFormPage` (Functional Component)
- **Primary Purpose:** CRUD interface for Organizations (Companies). It features a tabbed layout to separate basic company metadata from the management of physical Plants (locations).

## Component State Micro-Mapping (Lines 45-90)
- `activeTab`: 'organization' | 'plants'. Synced with URL search params.
- `formData`: The basic company object (Name, Industry, Website).
- `pendingPlants`: An array used **only during creation** to allow adding multiple locations before the Org ID exists.
- `plants`: Derived from Redux store (`organizationPlantsSlice`) when editing.
- `editingPlantId`: ID of the location currently being edited inline in the table.

## Lifecycle & Initialization (Lines 92-120)
- **`useEffect` (Main):** Loads the organization data and dispatches its plants to the Redux store for global availability.

## Logic Breakdown: Core Functions

### Submission (Lines 145-175)
- **`handleSubmit` (Lines 145-175):** 
  - **Create Mode:** Sends the `formData` PLUS the `pendingPlants` array in a single `createOrganization` call.
  - **Edit Mode:** Updates only the organization metadata. Plants are handled independently via their own API calls.

### Plant CRUD (Lines 185-240)
- **`handleAddPlant` / `handleUpdatePlant`:** These are direct API calls to `createOrganizationPlant` / `updateOrganizationPlant`. They immediately update both the database and the Redux state to keep the UI in sync.

## JSX/Component Tree Micro-Mapping

### Tab Navigation (Lines 265-290)
- Styled buttons that switch between the "Organization" form and "Plants" management.

### Organization Tab (Lines 295-345)
- Standard form fields: Name, Notes, Website, Industry, and `ORGANIZATION_SIZES` dropdown.

### Plants Tab (Lines 350-550)
- **Creation Mode (Lines 355-400):** A dynamic list where users can "Add Plant" rows locally and fill them out. Each row has a "Remove" button.
- **Edit Mode (Lines 405-550):** 
  - List of existing plants with `MapPin` icon and address summary.
  - **Inline Form (Lines 420-475):** Replaces the static row when "Edit" is clicked, providing full address fields.
  - **Add Button:** Opens a fresh form at the bottom of the list.

## Key Logic Flows
- **Transactional Creation:** The backend allows creating an Org and its initial plants in one transaction. This page leverages that via `pendingPlants`.
- **Redux Sync:** Unlike the Lead Form which uses local state for everything, this page uses a dedicated `organizationPlantsSlice` to ensure that if a plant is added here, it appears immediately in lead/contact dropdowns elsewhere.
- **Tab Persistence:** The `tab=plants` URL parameter ensures that if a user refreshes while adding a location, they aren't kicked back to the basic info tab.
