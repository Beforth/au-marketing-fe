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

### 2.2 Critical Service Methods (Partial List)
- **`getLeads(params)` (L452)**: Fetches leads with support for filtering, sorting, and pagination.
- **`createLeadActivity(leadId, data)` (L598)**: Logs an interaction/enquiry for a lead.
- **`uploadLeadActivityAttachments(leadId, activityId, files, kinds, ...)` (L619)**: Handles multipart file uploads.
- **`convertContactToCustomer(contactId)` (L918)**: Promotes a contact to a customer.
- **`generateNextSeriesNumberByCode(code, context)` (L1082)**: Server-side generation of Lead/Quote numbers.

---

## 3. `pages/LeadFormPage.tsx` - Hyper-Detailed Breakdown (3,442 Lines)

### 3.1 Exhaustive State Mapping (Categorized)
#### Form & Entity State
- `formData` (L238): The master object for Lead creation/editing.
- `leadSourceType` (L105): `'contact' | 'customer' | 'none'`. Controls UI branching.
- `inlineContactForm` (L217): State for the "New Contact" inline creation.
- `newOrgForm` (L180) & `newPlantForm` (L190): Secondary forms for inline entity creation.
- `inlineNewOrgForm` (L233) & `inlineNewPlantForm` (L235): Faster "inline-inline" creation within the lead form.

#### UI & Navigation State
- `activeTab` (L90): `'enquiry' | 'status_logs'`. Controlled by `tab` URL param.
- `viewMode` (L88): Boolean. Controlled by `view=1` URL param. Disables editing.
- `domainRegionCollapsed` (L107): Toggles visibility of the Domain/Region header section.
- `showEditModal` (L208): Toggles the lead info edit overlay.

#### Activity & Attachment State
- `activityForm` (L110): Holds the data for the "Log enquiry" section.
- `attachmentEntries` (L131): Staged files for the current activity.
- `addAttachmentActivityId` (L145): Tracks which existing activity is receiving new files.
- `addAttachmentRows` (L146): Staged files for the "Add attachments" sub-flow.

#### Won/Lost Flow State
- `showMarkWonModal` (L295) & `showMarkLostConfirm` (L296): Modals for final status changes.
- `markWonClosedValue` (L297) & `markWonPO` (L298): Mandatory inputs for "Won".
- `markLostReason` (L303): Mandatory 100-character input for "Lost".

### 3.2 Key Lifecycle Hooks (`useEffect`)
- **Initialization (L452)**: Loads domains and report scopes on mount. If in "create" mode, it loads the user's default domain/region from `localStorage`.
- **Lead Data Load (L482)**: If an `id` is present, it fetches the full Lead object and populates all form states (cascading into `formData`, `leadSourceType`, `selectedContactForDisplay`, etc.).
- **Cascading Dropdowns**:
    - `L540`: When `formData.domain_id` changes, it fetches and updates `regions`.
    - `L550`: When `formData.customer_id` changes, it fetches and updates `plants`.
- **Search Suggestions**:
    - `L562`: Debounced search for existing Contacts/Customers as the user types names.
    - `L620`: Debounced search for Organizations when typing in the inline creation flow.

### 3.3 Critical Logic Handlers
- **`linkLeadToContact` (L342)**:
    - Parses name prefix and phone number from the Contact object.
    - Populates `formData` with `contact_id`, `plant_id`, `domain_id`, and `region_id`.
    - Updates `selectedContactForDisplay` for the UI header.
- **`handleSubmit` (L1082)**:
    - Handles both Create and Update.
    - **Crucial**: If `leadSourceType === 'none'` and inline fields are filled, it calls the inline contact creation logic first.
    - Manages the generation or application of `quote_number` (generated vs. manual).
    - If `initialQuotationFile` is present, it creates the lead *and then* the activity and attachment in sequence.
- **`handleMarkWonSubmit` (L3100)**:
    - Validates that `markWonClosedValue` is a positive number.
    - Updates lead status and closed value.
    - Creates a `lead_status_change` activity log.
    - Redirects to Order creation.
- **`handleMarkLostConfirm` (L3150)**:
    - Validates `markLostReason` length (>= 100 chars).
    - Captures competitor and price info.
    - Updates lead status and creates an activity log.

---

## 4. `pages/LeadsPage.tsx` - Hyper-Detailed Breakdown (2,719 Lines)

### 4.1 Kanban Mechanics
- **Columns (L198)**: `statusGroupsForBoard` groups `LeadStatusOption` records by their `group_id`.
- **Drag & Drop (L540)**:
    - `handleColumnDrop`: Determines the target status ID.
    - **Logic Interruption**: If the target status is "Won" or "Lost", it opens the respective detail modal from `LeadFormPage` logic.

### 4.2 Filtering & Search
- **Employee Filter (L600)**: Multi-select dropdown that hits `marketingAPI.getLeads` with the `assigned_to` param.
- **Date Range**: Uses `FilterPopover` to manage `expected_closing_date` ranges.

---

## 5. UI Library Master Catalog

### 5.1 Atoms (`UI/`)
| Component | Role | Logic |
| :--- | :--- | :--- |
| **Button** | Action | Supports `leftIcon`, `loading` state, and `variant` (primary, ghost, link). |
| **Input** | Text | Includes `inputSize` (sm/md) and standardized focus/error states. |
| **Badge** | Visual | Custom logic in `LeadsPage` for dynamic background colors based on status hex codes. |
| **SearchBar**| Search | Unified debounced input with a clear action. |

### 5.2 Molecules (`components/ui/`)
- **`AsyncSelect`**: The workhorse for linking Organizations and Employees. Fetches data via `loadOptions`.
- **`DataTable`**: Renders large lists with pagination. Used in `ContactsPage`, `LeadsPage` (Table view), and `OrdersPage`.
- **`FilterPopover`**: A floating panel that manages complex filtering state without cluttering the header.

---

## 6. Access Control & Scope

- **Permissions**: Checked using `selectHasPermission`. Common keys: `marketing.create_lead`, `marketing.admin`, `marketing.view_all_regions`.
- **Scope**: `MarketingScope` (stored in `localStorage`) determines which Domain and Region are pre-selected in forms and which filters are applied to list APIs.

---

## 7. Developer Conventions & Standards

- **Numbering**: Always use `marketingAPI.generateNextSeriesNumberByCode` for Quotes/Leads.
- **Currency**: INR (₹) formatting is mandatory using `.toLocaleString('en-IN')`.
- **Dates**: Use ISO strings for API communication. Use `toDatetimeLocalValue` for local input display.
- **State Management**: Prefer local state for form-specific data; use Redux (`slices/`) for global entities like Organizations and Auth.
