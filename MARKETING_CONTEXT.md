# Marketing Module - Hyper-Detailed Technical Master Reference

This document is the absolute, exhaustive source of truth for the Marketing Module in `au-marketing-fe`. It provides a granular, field-by-field, and line-by-line technical roadmap of the architecture, logic, and implementation for the entire marketing ecosystem.

---

## 1. System Architecture & Entity Hierarchy

The Marketing system is a domain-driven CRM designed for high-density sales tracking across international and domestic markets.

### 1.1 Data Entity Hierarchy (Structural Workflow)
1.  **Domain**: (e.g., Domestic, Export) Top-level market isolation.
2.  **Region**: Geographic or logical sub-divisions (North, South, Europe, etc.).
3.  **Organization**: The parent company/entity.
4.  **Plant**: Specific manufacturing or office locations under an Organization.
5.  **Contact**: A person (Lead data) linked to an Org/Plant. **Critical**: Can be "converted" to a Customer.
6.  **Customer**: A verified business account (often promoted from a Contact).
7.  **Lead**: A specific sales opportunity. Must be linked to a **Contact** OR a **Customer**.
8.  **Order**: A successfully closed (Won) lead, transitioned to the production/delivery phase.

---

## 2. API Service Catalog (`lib/marketing-api.ts`)

This 2,006-line file encapsulates the entire communication layer for the marketing module.

### 2.1 Core Interfaces & Field Definitions
- **`Lead` (L208-250)**:
    - `id`: Primary key.
    - `series`: Human-readable lead ID (e.g., AP/LEAD/2024/001).
    - `domain_id` / `region_id`: Scope references.
    - `contact_id` / `customer_id`: Mutually exclusive source links.
    - `plant_id`: Specific delivery location.
    - `status_id`: Current pipeline stage.
    - `lead_type_id`: Categorization (e.g., Standard, Urgent).
    - `lead_through_id`: Source attribution (e.g., Exhibition, Cold Call).
    - `potential_value`: Estimated deal amount.
    - `expected_closing_date`: Target date for "Won" status.
    - `is_hot`: Boolean for high-priority monitoring.
- **`LeadActivity` (L266-302)**:
    - `activity_type`: Enumeration (`note`, `call`, `email`, `meeting`, `qtn_submitted`, etc.).
    - `title`: Short summary of the action.
    - `description`: Detailed notes.
    - `from_status_id` / `to_status_id`: Captured only on status changes to track history.
- **`LeadStatusOption` (L176-196)**:
    - `hex_color`: CSS color for UI elements.
    - `is_final`: Set to true for "Won" statuses.
    - `is_lost`: Set to true for "Lost" statuses.
    - `set_when_quotation_added`: Boolean; if true, adding a quotation auto-updates the lead to this status.

### 2.2 Critical Service Methods
- **`getLeads(params)` (L452)**: Supports complex filtering including `assigned_to`, `created_by_me`, `is_hot`, and `search`.
- **`createLeadActivity(leadId, data)` (L598)**: The primary entry point for the audit log.
- **`uploadLeadActivityAttachments(...)` (L619)**:
    - `files`: File objects.
    - `kinds`: Array of `'quotation' | 'attachment'`.
    - `titles`: Array of custom titles for attachments.
    - `series_code`: Used only when `kinds` includes `quotation`.
- **`generateNextSeriesNumberByCode(code, context)` (L1082)**:
    - `code`: The series type (e.g., `LEAD`, `QUOTE`).
    - `context`: Object containing `lead_id` or `lead_context` (for name parsing).

---

## 3. `pages/LeadFormPage.tsx` - Hyper-Detailed Breakdown (3,442 Lines)

### 3.1 State Mapping (Line-by-Line Context)
- **Form Data (`formData`) (L238)**: The master object for lead creation/editing. Includes `domain_id`, `region_id`, `contact_id`, `potential_value`, and `expected_closing_date`.
- **`leadSourceType` (L105)**: Enum `'contact' | 'customer' | 'none'`. Controls conditional rendering of the person vs. company linking sections.
- **Inline Entity Forms**:
    - `inlineContactForm` (L217): Used for creating a new person. Fields: `title`, `first_name`, `last_name`, `email`, `phone`.
    - `newOrgForm` (L180): Fields: `name`, `code`, `website`, `industry`, `size`.
    - `newPlantForm` (L190): Fields: `plant_name`, `address_line1`, `city`, `state`, `postal_code`.
- **Activity Logging**:
    - `activityForm` (L110): Fields for `activity_type`, `title`, and `description`.
    - `attachmentEntries` (L131): Staged array of file objects and their metadata.
- **Won/Lost Flow**:
    - `markWonClosedValue` (L300): Mandatory value input for winning a deal.
    - `markLostReason` (L303): Mandatory 100-character explanation for losing a deal.

### 3.2 Key `useEffect` Cascades
- **Initialization (L452)**: Loads domains and report scopes on mount. If creating a new lead, it also attempts to pre-load user assignments (Domain/Region).
- **Lead Data Load (L482)**: If `id` exists, it fetches the full Lead object and cascades state into the form.
- **Domain -> Region (L540)**: When `formData.domain_id` changes, it clears and reloads the `regions` list.
- **Customer -> Plant (L550)**: When `formData.customer_id` changes, it clears and reloads the `plants` list.
- **Search Suggestions (L562)**: Triggers `searchContactsAndCustomersByName` when the user types in the search input, with a 300ms debounce.

### 3.3 Logic Flow: `handleCreateContactInline` (L1500)
This is the most critical logic block in the system. It handles the "No-Click" creation flow:
1.  **Organization Resolution**: If a user types a name but hasn't selected an ID, it searches for an exact match. If no match is found and the user has permissions, it creates the Organization first using `inlineNewOrgForm`.
2.  **Plant Resolution**: If a plant name is provided but no ID is selected, it creates the Plant under the resolved Organization using `inlineNewPlantForm`.
3.  **Contact Creation**: Finally, it creates the Contact linked to the resolved Org/Plant and returns the `contact_id` to be used for the Lead submission.

### 3.4 Logic Flow: Won/Lost Transitions
- **Mark as Won (L3100)**:
    - Triggered by `handleMarkWonSubmit`.
    - Updates Lead status to the `Won` ID.
    - Saves `closed_value` (mandatory).
    - Creates a `lead_status_change` activity log.
    - Navigates to `/orders/new?lead_id=...`.
- **Mark as Lost (L3150)**:
    - Triggered by `handleMarkLostConfirm`.
    - Validates `markLostReason` length (>= 100 chars).
    - Captures `lost_to_competitor` and `lost_at_price`.
    - Updates Lead status to the `Lost` ID.

### 3.5 Navigation & Actions (L1450-1490)
- **Back Button**: Navigates to `/leads` or `/orders?tab=lost` (if in view mode).
- **Edit Lead**: Opens the `showEditModal` for inline lead info updates.
- **Create Order**: Visible only for Won leads; redirects to order creation.

---

## 4. `pages/LeadsPage.tsx` - Hyper-Detailed Breakdown (2,719 Lines)

### 4.1 Kanban Mechanics
- **Group Mapping (L198)**: `statusGroupsForBoard` groups all `LeadStatusOption` records by their `group_id`. This determines the vertical columns.
- **Drag & Drop (L540)**:
    - Uses `onDragOver` and `onDrop`.
    - `handleColumnDrop` captures the target status.
    - **Logic Guard**: If the target status is `is_final` or `is_lost`, it prevents the direct update and instead opens the relevant detail modal (`WonClosedValueModal`).

### 4.2 Configuration Modals
- **Status Modal (L320)**: Admin-only UI to manage `LeadStatusOption` records. Controls colors, sorting, and "hot case" triggers.
- **Status Change Modal (L1200)**: Triggered when dragging cards. Requires a title and description for the enquiry log.

---

## 5. UI Library Master Catalog

### 5.1 Atoms (`UI/`)
| Component | Role | Critical Props |
| :--- | :--- | :--- |
| **Button** | Action trigger | `variant` (primary, secondary, ghost, danger), `size`, `leftIcon`. |
| **Input** | Text entry | `label`, `inputSize` (sm/md), `type` (number, text, email). |
| **Badge** | Status pill | `className` (Emerald for Won, Rose for Lost, Amber for Hot). |
| **Select** | Dropdown | `options` (Array of `{value, label}`), `searchable`, `inputSize`. |

### 5.2 Molecules (`components/ui/`)
- **`AsyncSelect`**: Used for Organizations and Employees. Fetches data on-demand via `loadOptions`.
- **`DataTable`**: Handles high-density list views. Implements pagination, sorting, and row clicking.
- **`FilterPopover`**: A floating panel for complex filter logic (Date ranges, Multi-select employees).
- **`ConfirmModal`**: A safety wrapper for critical actions like deletion or bulk updates.

---

## 6. Access Control (RBAC) & Scope

- **Permission Keys (store/slices/authSlice.ts)**:
    - `marketing.view_lead`: Global visibility of lead lists.
    - `marketing.create_lead`: Access to `/leads/new`.
    - `marketing.edit_lead`: Access to `/leads/:id/edit`.
    - `marketing.admin`: Management of statuses, groups, and numbering series.
- **Scoping Logic (lib/marketing-scope.ts)**:
    - The system uses `getStoredMarketingScope()` on every page load to determine the user's current Domain and Region.
    - This scope is passed as `domain_id` and `region_id` to all API calls to ensure data isolation.

---

## 7. Developer Conventions & Standards

- **Numbering Series**: Auto-generated via `marketingAPI.generateNextSeriesNumberByCode`. Manual overrides are discouraged.
- **Currency**: INR (₹) formatting is mandatory using `.toLocaleString('en-IN')`.
- **Date/Time**: Use `toDatetimeLocalValue` for form inputs. Always send ISO strings to the backend.
- **Surgical Edits**: When modifying `LeadFormPage.tsx`, always check for cascading effects in the `useEffect` blocks between lines 450 and 600.
