# ContactFormPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/ContactFormPage.tsx`
- **Total Lines:** 761
- **Main Export:** `ContactFormPage` (Functional Component)
- **Primary Purpose:** CRUD interface for individual Contacts. Similar to `CustomerFormPage`, it handles the complex relationship between a Person, an Organization, and a specific Plant, including inline creation of the company structure.

## Component State Micro-Mapping (Lines 40-100)
- `isEdit`: Derived from URL `id`.
- `namePrefix`, `contactPhoneCountryCode`, `contactPhonePart`: Local split state for combined fields.
- `formData`: The main `Contact` object.
- `orgSuggestions`, `orgSearchQuery`, `selectedOrganization`: For the search-and-link Org flow.
- `newOrgForm`, `newPlantForm`: For inline creation.

## Lifecycle & Initialization (Lines 102-135)
- **`loadContact` (Lines 185-230):** 
  - Fetches contact by ID.
  - **Logic:** Uses `parseNameWithPrefix` and `parsePhoneWithCountryCode` to split combined database strings into UI form parts.
  - Fetches Organization Plants if linked.

## Logic Breakdown: Core Functions

### Submission (Lines 232-290)
- **`handleSubmit` (Lines 232-290):** 
  - Validates mandatory fields (First/Last Name, Phone, Domain).
  - **Organization Step:** If a new name is typed and no Org is linked, calls `createOrganization` first.
  - **Payload Merge:** Combines `namePrefix` + `first_name` and serializes the phone number before calling `updateContact` or `createContact`.

### Territory Logic (Lines 150-183)
- **`loadUserAssignments` (Lines 150-183):** Auto-fills the Domain and Region based on the logged-in user's territory permissions.

## JSX/Component Tree Micro-Mapping

### Personal Info Section (Lines 320-385)
- **Name Block (Lines 322-355):** Title (Mr/Ms), First Name, Last Name.
- **Communication (Lines 357-385):** Phone (Code + Number), Email, Designation.

### Organization Section (Lines 388-550)
- **Link Interface (Lines 395-425):** Search input with a suggest-and-link dropdown.
- **Linked View (Line 465):** Details of the linked company with a "Plant" selector.
- **Inline Create (Line 510):** Fields for Website, Industry, etc., if creating a new company with the contact.

### Territory & Notes (Lines 560-650)
- **Domain & Region (Lines 575-630):** Collapsible vertical section with `AsyncSelect`.
- **Notes & Status (Lines 632-650):** Textarea and "Active" toggle.

## Key Logic Flows
- **String Splitting:** When loading an existing contact, the page must "guess" the prefix and names because they are stored as flat strings in some API versions.
- **Plant Association:** The "Plant" dropdown is dynamically filtered to only show locations belonging to the selected Organization.
- **Sequential Creation:** `handleSubmit` ensures the Organization ID is obtained from the API before the Contact creation payload is sent.
