# OrdersPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/OrdersPage.tsx`
- **Total Lines:** 1,279
- **Main Export:** `OrdersPage` (Functional Component)
- **Primary Purpose:** Management hub for converted "Won" Leads (Orders). It mirrors the Leads Kanban system but focuses on fulfillment tracking. It also includes a specialized "Lost" tab for analyzing failed leads.

## Detailed Imports (Lines 4-23)
- **React Core:** `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef` (Line 4).
- **Routing:** `useNavigate`, `useSearchParams` (Line 5).
- **Internal UI:** `Card`, `Badge`, `DataTable`, `SearchInput`, `Input`, `Button`, `Pagination`, `Modal`, `ConfirmModal`, `SegmentToggle` (Lines 6-15, 23).
- **Icons:** ~15 icons from `lucide-react` (Line 16).
- **State/Hooks:** `useApp` (Toast), `useAppSelector`, `selectHasPermission` (Lines 17-19).
- **API Service:** `marketingAPI` and shared types (`Order`, `OrderStatusOption`, `Lead`, etc.) (Line 21).

## Constants & Helpers (Lines 25-50)
- **`getContrastColor(hex)` (Lines 28-33):** Utility to ensure text readability on dynamic status backgrounds.
- **`STATUS_COLORS` (Lines 36-43):** Default mapping for hardcoded status codes (new, confirmed, in_production, etc.).

## Component State Micro-Mapping (Lines 52-110)

### Tab & View Navigation (Lines 52-75)
- `ordersTab`: 'won' | 'lost'. Synced with URL `tab` param.
- `viewMode`: 'kanban' | 'table'. Synced with URL `view` param.

### Data Collections (Lines 76-88)
- `orders`: Active "Won" orders.
- `lostLeads`: Leads marked as lost.
- `statuses`: All valid `OrderStatusOption` records.
- `orderStatusGroups`: Logical workflow containers.

### Filtering & Pagination (Lines 89-98)
- `searchTerm`: Free-text filter for Order Ref and Lead Name.
- `statusFilter`: Dropdown filter for the Table view.
- `page`, `pageSize`, `total`, `totalPages`: Standard pagination state.

### Kanban & Status Change (Lines 100-115)
- `draggedOrderId`: ID of the order being moved.
- `dragOverStatusId`: ID of the target column.
- `statusChangePending`: Object `{ orderId, currentStatusId, newStatusId }` that triggers the mandatory log modal.
- `statusChangeForm`: Title and Description for the move log.
- `statusChangeAttachments`: Files required/optional for the transition.

## Lifecycle & Initialization (Lines 117-165)
- **`useEffect` (Won Load):** Triggers `loadOrders()` when in the 'won' tab.
- **`useEffect` (Lost Load):** Triggers `loadLostLeads()` when in the 'lost' tab.
- **`useEffect` (Metadata):** Fetches `orderStatuses` and `orderStatusGroups` on mount.

## Logic Breakdown: Core Functions

### Data Fetching (Lines 125-164)
- **`loadOrders` (Lines 125-146):**
  - Uses `pageSize: 100` for Kanban to show all cards.
  - Passes `status_id` filter only for Table mode.
- **`loadLostLeads` (Lines 148-164):**
  - Calls `getLeads` with `lost_only: true`.

### Kanban Workflow (Lines 340-496)
- **`handleOrderDragStart` (Lines 340-348):** Checks `canEdit` and prevents dragging final/lost orders.
- **`handleColumnDrop` (Lines 457-478):** 
  - Validates if the drop was onto a new status.
  - Initializes the mandatory `statusChangeForm`.
- **`applyOrderStatusChange` (Lines 403-455):**
  - **Validation (Line 415):** Checks `pendingStatusRequiresAttachment`. If true, prevents submission without files.
  - **API Flow:**
    1. `createOrderActivity` (Status Change type).
    2. `uploadOrderActivityAttachments`.
    3. `updateOrder` (setting new `status_id` and `status_change_reason`).

### Status Management (Lines 167-336)
- CRUD operations for Groups and Statuses.
- **`saveOrderStatus` (Lines 228-252):** Includes the `attachment_required_on_kanban_change` flag.

## JSX/Component Tree Micro-Mapping

### Tab Switcher (Lines 534-545)
- `SegmentToggle` switching between "Won" (Orders) and "Lost" (Failed Leads).

### "Lost" Leads View (Lines 587-651)
- Standard HTML Table.
- **Columns:** Lead Ref, Company, Date Lost, Reason.
- **Reason Column (Line 633):** Extracts `lost_reason` (synced from the "Marked as Lost" activity log).
- **View Action (Line 641):** Redirects to Lead Form in read-only mode (`view=1`).

### Kanban Board (Lines 653-909)
- **Grouped Columns (Lines 833-909):**
  - Collapsible containers for groups.
  - **Status Column (Line 858):** Highlights on drag over.
  - **Order Cards (Lines 878-900):** Shows Ref, Lead Name, Company, Value, and Delivery Date.
- **"No Status" Column (Lines 660-725):** Fallback for orders without a valid `status_id`.

### Table View (Lines 911-942)
- Paginated `DataTable`.
- Features a "Value" column with currency formatting.

### Modals (Lines 945-1277)
- **`ManageStatusModal` (Lines 945-1153):** Complex table-in-modal UI for configuring the fulfillment pipeline.
- **`StatusChangeModal` (Lines 1156-1270):** 
  - Mandatory Title/Notes.
  - **Conditional File Upload (Line 1230):** Shows red asterisk if the target status requires an attachment.

## Key Logic Flows
- **Conversion Lifecycle:** Lead (Won) -> New Order record -> Fulfillment (Kanban) -> Final Status (Delivered/Closed).
- **Enquiry Integrity:** Every move on the Kanban board creates an `order_activity` entry, ensuring a complete audit trail of who moved what and why.
- **Lost Reason Tracking:** The `Lost` tab acts as a retrospective tool, pulling the reason entered in `LeadFormPage` directly into the summary table.
- **Permission Mapping:** `marketing.edit_lead` is used as the proxy permission for modifying Order status.
