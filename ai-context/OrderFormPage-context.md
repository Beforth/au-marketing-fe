# OrderFormPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/OrderFormPage.tsx`
- **Total Lines:** 508
- **Main Export:** `OrderFormPage` (Functional Component)
- **Primary Purpose:** Manages individual Orders. It handles the initial creation of an Order from a "Won" Lead and provides a detailed view for activity logging, attachment management, and basic metadata updates (Value, Delivery Date).

## Component State Micro-Mapping (Lines 30-65)
- `isNew`: Boolean derived from route.
- `wonLeads`: List of leads eligible for conversion (used in Create mode).
- `order`, `activities`: The main data objects for the order and its fulfillment history.
- `editForm`: Local state for the "Edit Metadata" modal.
- `activityForm`, `activityAttachmentEntries`: State for the inquiry log and multi-file uploader.

## Lifecycle & Initialization (Lines 67-125)
- **`useEffect` (Creation Init):** Fetches Won Leads and available Numbering Series.
- **`useEffect` (Lead Sync):** If `?lead_id=X` is in the URL, it auto-selects that lead in the dropdown.
- **`useEffect` (Order Load):** Fetches the order details and its entire `OrderActivity` log.

## Logic Breakdown: Core Functions

### Order Conversion (Lines 127-155)
- **`handleCreateOrder` (Lines 127-155):** 
  - Takes the selected Lead ID and chosen Numbering Series.
  - Copies the `closed_value` from the lead as the initial `order_value`.
  - Redirects to the new order's detail page on success.

### Activity Logging (Lines 175-205)
- **`handleAddActivity` (Lines 175-205):** 
  - Creates an `OrderActivity` record.
  - **File Sequence:** If files are selected, it calls `uploadOrderActivityAttachments` immediately after the log is created.
  - Triggers a full refresh of the `activities` list.

## JSX/Component Tree Micro-Mapping

### Creation Mode (Lines 215-265)
- **Lead Selector:** A dropdown restricted to Won Leads.
- **Series Selector:** Allows choosing how the Order Number (e.g., `ORD-001`) is generated.

### Detail View - Header (Lines 285-325)
- **Summary Card:** Displays Order No, linked Lead (with link), Status, Value, and Expected Delivery.
- **Actions:** "Edit Order" (modal) and "Delete" (guarded by permissions).

### Inquiry Log (Lines 330-450)
- **Add Log Form (Lines 335-395):** 
  - Type (Note/Call/Email/Status Change).
  - Multi-file uploader with Title fields.
- **History List (Lines 400-450):** 
  - Reverse-chronological list of logs.
  - Renders Status Transitions (e.g., `Processing → Shipped`).
  - **Attachments (Line 425):** List of downloadable files with filename and title.

## Key Logic Flows
- **Lead -> Order Link:** The page maintains a strong link to the originating Lead, providing a quick navigation button to view the original enquiry.
- **Series Locking:** The Order Number is generated exactly once during `handleCreateOrder` and becomes read-only metadata thereafter.
- **Fulfillment Audit:** Similar to Leads, every update to an Order should ideally be done via the Inquiry Log to maintain a complete history of the production/delivery process.
