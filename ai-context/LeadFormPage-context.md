# LeadFormPage.tsx Extreme Granularity Context

## File Meta
- **Path:** `pages/LeadFormPage.tsx`
- **Total Lines:** 3,497
- **Main Export:** `LeadFormPage` (Functional Component)
- **Primary Purpose:** A complex multi-entity form for managing the lifecycle of a Marketing Lead, from initial inquiry and organization/contact creation to activity logging, quotation management, and final status (Won/Lost).

## Detailed Imports (Lines 5-34)
- **React Core:** `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo` (Line 5).
- **Routing:** `useNavigate`, `useParams`, `useSearchParams` from `react-router-dom` (Line 6).
- **Internal UI Components:** `Card`, `Button`, `Input`, `SearchInput`, `Select`, `DatePicker`, `AsyncSelect`, `SearchSuggestion`, `Modal`, `ConfirmModal` (Lines 7-14, 30-31).
- **Layout:** `PageLayout` (Line 15).
- **Global Context/State:** `useApp` (Toast/App context), `useAppSelector`, `selectHasPermission`, `selectUser`, `selectEmployee` (Lines 16-18).
- **API Service:** `marketingAPI` and ~20 Type Interfaces/Utils from `../lib/marketing-api` (Line 19).
- **Constants:** `NAME_PREFIXES`, `COUNTRY_CODES`, `DEFAULT_COUNTRY_CODE`, etc. (Line 20).
- **Utilities:** `parseNameWithPrefix`, `serializeNameWithPrefix`, `parsePhoneWithCountryCode`, `serializePhoneWithCountryCode` (Line 28).
- **Icons:** ~30 icons from `lucide-react` (Line 32).
- **Styling:** `cn` (Line 33).

## Data Structures (Lines 36-45)
- **`LeadFormData` Interface:** Extends `Partial<Lead>`. Adds virtual fields for inline creation: `first_name`, `last_name`, `company`, `email`, `job_title`, `title`, `organization_id`, `plant_id`.

## Component State Micro-Mapping (Lines 49-228)

### Navigation & Permissions (Lines 49-65)
- `navigate`: Router navigation.
- `id`: Lead ID from URL (null if creating).
- `searchParams`: For `tab` and `view` management.
- `user`, `employee`: Current authenticated user/employee objects.
- `isEdit`: Boolean derived from `id`.
- `canCreate`, `canEdit`, `canChangeLeadSeries`, `canCreateContact`, `canCreateOrg`, `canCreatePlant`: Boolean permission flags from Redux.

### Tab & View Management (Lines 68-79)
- `activeTab`: 'enquiry' | 'status_logs'. Managed via URL search params (`tab`).
- `viewMode`: Boolean (from `view=1` param) for read-only detail view.

### Data Collections (Lines 80-91)
- `isLoading`, `isSubmitting`: Page-level and form-level loading states.
- `domains`, `regions`, `customers`, `plants`: Arrays of entity objects.
- `leadStatuses`, `leadThroughOptions`, `seriesList`: Configuration data from API.
- `reportScope`: Current user's visibility scope (Self, Team, All).

### Activity / Enquiry Log State (Lines 93-138)
- `activities`: Array of `LeadActivity` objects.
- `activityForm`: State for the "Add Log" form (type, title, description, contact details for different person, status transitions).
- `attachmentEntries`: Array of `AttachmentEntry` (id, kind, file, quotationNumber, title) for multi-file upload.
- `editingActivityId`: ID of the log entry currently being edited inline.
- `deleteActivityId`: ID of the log entry queued for deletion.
- `addAttachmentActivityId`: ID of the existing log entry to which new files are being added.

### Entity Search & Inline Creation (Lines 140-192)
- `leadSearchName`: Query for searching contacts/customers by name.
- `contactSuggestions`, `orgSuggestions`: Results for inline search-and-link.
- `showCreateContactModal`, `showCreateOrgModal`: Visibility for entity creation dialogs.
- `inlineContactForm`: State for creating a contact without a modal (Lines 172-184).
- `createContactForm`: State for creating a contact via modal.
- `newOrgForm`, `newPlantForm`: Payload states for Org/Plant creation.
- `inlineNewOrgForm`, `inlineNewPlantForm`: Payload states for inline Org/Plant creation during lead submission.

### Lead Payload (Lines 193-228)
- `formData`: The main `LeadFormData` object that will be sent to the API.
- `referredByType`: 'none' | 'employee' | 'customer' | 'contact'.
- `markWon...`, `markLost...`: States for final status modals (value, PO, reason, competitor, price).

## Lifecycle & Sync (Lines 230-264)
- **`useEffect` (Lines 230-249):** Primary initialization.
  - If `isEdit`: Checks `canEdit`, calls `loadLead()`.
  - If `!isEdit`: Checks `canCreate`.
  - Always: Calls `loadDomains()`, `loadCustomers()` (if create), and fetches statuses, through-options, series, and report scope.
- **`useEffect` (Lines 251-259):** Syncs `status_id` from URL params into `formData`.
- **`useEffect` (Lines 261-267):** Triggers `loadRegions()` when `formData.domain_id` changes.
- **`useEffect` (Lines 269-275):** Triggers `marketingAPI.getPlants()` when `formData.customer_id` changes.

## Logic Breakdown: Core Functions

### Search & Linking (Lines 277-530)
- **`searchOrganizationsByName` (Lines 277-286):** Debounced API call for Orgs.
- **`searchContactsByEmailOrPhone` (Lines 288-294):** API call for Contacts.
- **`onOrganizationSearchChange` (Lines 314-323):** Updates query, clears linked ID, and sets timeout for search.
- **`linkLeadToContact` (Lines 477-512):** 
  - Parses name and phone from `Contact` object.
  - Updates `formData` with `contact_id`, `organization_id`, `plant_id`, `domain_id`, `region_id`, and `company`.
  - Auto-loads regions and plants for the linked entity.
- **`linkLeadToCustomer` (Lines 514-539):** Similar to contact linking, but sets `customer_id`.

### Entity Creation (Lines 542-658)
- **`handleCreateOrganizationInContactModal` (Lines 560-590):** 
  - Calls `marketingAPI.createOrganization`.
  - Updates `createContactForm` with the new `organization_id`.
  - Fetches plants for the new Org.
- **`handleCreateContact` (Lines 616-658):** 
  - Validates name and phone.
  - Calls `marketingAPI.createContact`.
  - Invokes `linkLeadToContact` with the result.

### Lead Activity Management (Lines 660-856)
- **`handleAddActivity` (Lines 690-752):** 
  - Validates title based on `activity_type`.
  - For `qtn_submitted`: Validates that at least one quotation file exists in `attachmentEntries`.
  - 1. Calls `createLeadActivity`.
  - 2. If files exist: Calls `uploadLeadActivityAttachments` with specific kinds and quotation series details.
  - 3. Resets form and reloads activities.
- **`handleQuickAddQuotation` (Lines 754-783):** Shortcut that creates a 'qtn_submitted' activity and uploads a single file.

### Lead Data Loading (Lines 858-941)
- **`loadLead` (Lines 858-941):** 
  - Fetches Lead and Customers.
  - Maps `contact` or `customer` fields back into `formData`.
  - Resolves name/phone using `parsePhoneWithCountryCode`.
  - Sets `referredByType` based on which referral ID is present.
  - Sets `followUpTime` from `next_follow_up_at`.

### Main Submission Logic: `handleSubmit` (Lines 943-1249)
- **Lines 943-955:** Validation and prep.
- **Lines 962-1015 (Creation Mode Entity Chain):**
  - **Step 1 (Org):** If no `organization_id` but `company` name exists + `canCreateOrg`, calls `createOrganization` (including any inline plants).
  - **Step 2 (Contact):** If no `primaryContactContactId` but inline fields are filled, calls `createContact` using the Org ID from Step 1.
- **Lines 1017-1065 (Referrer Contact):** If `referredByType === 'contact'` and no existing ID, creates the referrer contact (and their organization/plant if needed) inline.
- **Lines 1067-1096 (Payload Prep):** Gathers IDs, series codes (from LocalStorage if create), and generates ISO inquiry dates.
- **Lines 1145-1249 (Final Save):**
  - Calls `updateLead` (Edit) or `createLead` (Create).
  - **Crucial Hook:** If `initialQuotationFile` exists on create, it *sequentially* calls `createLeadActivity` then `uploadLeadActivityAttachments` to ensure the lead exists before the file is attached.

### Status & Follow-up Actions (Lines 1251-1351)
- **`handleGenerateQuoteNumber` (Lines 1251-1278):** Calls API to get the next series value. In edit mode, it also saves the update immediately.
- **`handleMarkWonSubmit` (Lines 1290-1320):** Updates status to Won, saves closed value, adds an activity log, and redirects to `/orders/new`.
- **`handleMarkLostConfirm` (Lines 1322-1351):** Updates status to Lost, saves reason/competitor/price (mandatory fields), and adds activity log.
- **`saveFollowUp` (Lines 1373-1402):** Calls `scheduleLeadFollowUp` with ISO dates for one-time or HH:mm for recurring tasks.

## JSX/Component Tree Micro-Mapping

### Header & Actions (Lines 1502-1521)
- `PageLayout` with Breadcrumbs.
- **Actions:** Back button (dynamic destination), "Edit lead" button (opens modal).

### Follow-up Toolbar (Lines 1524-1583)
- Quick buttons: "Tomorrow 10:00", "Next week".
- Repeat Select: None, Once, Daily, Weekly, Monthly.
- Time/Date inputs: Conditional rendering based on Repeat Type.

### Tab Switcher (Lines 1586-1602)
- Enquiry log vs. Status logs.

### Lead Info Summary Card (Lines 1605-1660)
- Grid display of Lead No, Latest Quotation (with download link), Name, Email, Company, Status, Territory, Potential Value, and Closed Value.
- **Status Actions (Lines 1637-1658):** "Mark as Won", "Mark as Lost", or "Create Order" (if already Won).

### "Create Lead" Form (Lines 1664-1887)
- **Primary Contact Section (Lines 1668-1771):**
  - Linked View (Line 1673): Show Avatar + Name + Email + Phone + "Change" button.
  - Inline Form (Line 1701): Name Prefix, First/Last Name (with `SearchSuggestion` trigger), Phone Code, Phone Number, Email, Job Title.
- **Organization Section (Lines 1774-1839):**
  - `SearchInput` for Org name.
  - `SearchSuggestion` (Line 1801) for linking.
  - Inline Org Details (Line 1827): Website, Description, Industry, Size.
- **Enquiry Details (Lines 1842-1887):**
  - Through (Source), Closing Date, Potential Value.
  - **Referred By Block:** Conditional inputs for Employee (AsyncSelect), Customer (Select), or Contact (SearchInput + SearchSuggestion).

### Activity Log Tab (Lines 1891-2856)
- **Add Activity Form (Lines 1893-2015):** 
  - Type Selector, Title/Notes.
  - Status Change fields (From/To) (Line 1940).
  - Different Person fields (Line 1957).
  - Multi-file Upload Table (Line 1978).
- **Enquiry List (Lines 2017-2856):**
  - Maps `enquiryActivities`.
  - **Inline Editor (Lines 2511-2580):** Mirrored "Add Activity" fields for editing.
  - **Display View (Lines 2582-2856):** Type label, user tooltip, date, description, status change text, contact info.
  - **Attachments List (Line 2640):** Grouped by Quotation vs Attachment with Download and Remove buttons.
  - **Add More Files (Line 2715):** Inline multi-file upload specialized for adding to existing logs.

### Edit Lead Modal (Lines 3122-3243)
- Grouped sections: Basic Info, Communication & Territory, Lead Information.
- Mirrors the "Create Lead" form but in a modal layout for the Edit page.

### Modals (Lines 2898-3493)
- `CreateContactModal` (Lines 2898-3069): Nested Org/Plant creation flow.
- `CreateOrgModal` (Lines 3072-3118).
- `MarkWonModal` (Lines 3246-3277).
- `MarkLostModal` (Lines 3280-3333).
- `ConfirmDeleteModal` (Lines 3336-3344).

## API Data Flow Mapping
- **Payload to State:** `lead.contact_id -> formData.contact_id`, `lead.domain_id -> formData.domain_id`.
- **State to Payload:** `inlineContactForm` fields are serialized (phone) and sent to `createContact` before the final `createLead` call.
- **File Upload:** `attachmentEntries` -> `uploadLeadActivityAttachments` (Kinds: 'quotation' or 'attachment').

## Key Conditional Triggers
- **Line 1526:** `isEdit && id && !viewMode` -> Renders Follow-up header.
- **Line 1774:** `primaryContactContactId != null` -> Switches between Contact Search and Inline Form.
- **Line 1827:** `!selectedOrganization && canCreateOrg && orgSearchQuery` -> Shows "Create new organization" inline fields.
- **Line 1940:** `activityForm.activity_type === 'lead_status_change'` -> Shows status transition dropdowns.
- **Line 2715:** `addAttachmentActivityId === a.id` -> Shows inline file adder for a specific log entry.
