# CustomerFormPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/CustomerFormPage.tsx`
- **Total Lines:** 850
- **Main Export:** `CustomerFormPage` (Functional Component)
- **Primary Purpose:** A form for creating or editing Customers. It features a complex linkage system where a customer is tied to an Organization, a specific Plant, and a Primary Contact. It supports inline creation of Organizations, Plants, and Contacts if they don't already exist.

## Component State Micro-Mapping (Lines 48-100)
- `isEdit`: Derived from URL `id`.
- `canCreate`, `canEdit`: Permission flags.
- `domains`, `regions`: Territory metadata.
- `orgSuggestions`, `orgSearchQuery`, `selectedOrganization`: State for the "Search and Link Organization" flow.
- `plants`: List of locations for the selected organization.
- `newOrgForm`, `newPlantForm`: Payloads for creating entities on the fly.
- `createContactForm`: Virtual fields for the Primary Contact.
- `formData`: The main `Customer` object.

## Lifecycle & Initialization (Lines 102-130)
- **`useEffect` (Init):** Checks permissions, calls `loadCustomer()` if editing, and `loadDomains()`.
- **`useEffect` (Regions):** Triggers `loadRegions()` when `formData.domain_id` changes.
- **`useEffect` (Plants):** Fetches `getOrganizationPlants` when `formData.organization_id` changes.

## Logic Breakdown: Core Functions

### Search & Linking (Lines 132-230)
- **`searchOrganizationsByName` (Lines 132-143):** Debounced API call for Orgs.
- **`onOrganizationSearchChange` (Lines 145-152):** Clears linked Org state when user types.
- **`loadUserAssignments` (Lines 200-230):** Attempts to find the user's default Domain/Region from cache or HRMS employee record.

### Main Submission Logic: `handleSubmit` (Lines 300-380)
- **Step 1 (Organization Chain):** If no `organization_id` but name is present, calls `createOrganization` (including inline `plants`).
- **Step 2 (Contact Chain):** If no `primaryContactId` but inline fields are filled, calls `createContact` linking it to the Org from Step 1.
- **Step 3 (Customer):** Final call to `createCustomer` or `updateCustomer` merging all linked IDs.

## JSX/Component Tree Micro-Mapping

### Organization Section (Lines 430-580)
- **Search Input (Lines 435-465):** Search-and-link interface with a dropdown of suggestions.
- **Inline Create Block (Lines 530-580):** Fields for Website, Industry, Size, and Description shown if no Org is linked.
- **Plant Selector (Lines 495-510):** Dropdown of locations for the organization.

### Primary Contact Section (Lines 585-680)
- **Search by Email/Phone (Line 630):** To link existing contacts.
- **Inline Contact Form (Lines 650-680):** Name, Phone (with country code), and Email.

### Territory & Notes (Lines 685-750)
- **Domain & Region (Lines 715-745):** Collapsible section with `AsyncSelect` components.
- **Notes (Line 688):** Large textarea for customer metadata.

## Key Logic Flows
- **The "On Save" Creation:** This page is unique because it doesn't create the Org or Contact immediately; it queues them up and executes the creation chain sequentially in `handleSubmit`.
- **Plant Sync:** `useEffect` at Line 290 ensures the Contact's linked plant stays in sync with the Customer's selected plant.
