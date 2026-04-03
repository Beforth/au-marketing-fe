# marketing-api.ts Extreme Granularity Context

## File Meta
- **Path:** `lib/marketing-api.ts`
- **Total Lines:** 2,026
- **Exports:** `marketingAPI` (Instance of `MarketingAPIService`), plus ~100 Type Interfaces and Helper Functions.
- **Primary Purpose:** The absolute source of truth for the Marketing module's data models and backend communication. It defines the structure of every entity (Lead, Contact, Order, etc.) and provides a class-based service for REST API interaction.

## Detailed Imports (Line 5)
- **`apiClient`:** The core Axios wrapper from `./api` that handles authentication headers and base URL.

## Core Data Interfaces (Lines 7-217)

### Territory & HRMS (Lines 7-50)
- **`HRMSEmployee` (Lines 7-18):** Mirror of HRMS employee record.
- **`Domain` (Lines 21-34):** High-level territory (e.g., North, West).
- **`Region` (Lines 37-50):** Sub-territory (e.g., Mumbai, Delhi). Links to `Domain`.

### People & Companies (Lines 53-125)
- **`Contact` (Lines 53-82):** Individuals. Features `is_converted` and `series` (CONT-001). Links to `Organization`.
- **`Customer` (Lines 85-114):** Converted contacts or direct company clients. Links to `primary_contact_contact`.
- **`Organization` (Lines 117-130):** High-level corporate entity with `industry` and `organization_size`.
- **`Plant` (Lines 132-148):** Specific physical location for an Organization.

### Lead Workflow (Lines 151-217)
- **`LeadStatusGroup` (Lines 151-163):** Logical buckets for Kanban (e.g., "Initialization"). Includes `expected_duration_days` and `follow_up_interval_days`.
- **`LeadStatusOption` (Lines 166-183):** Individual statuses (e.g., "Enquiry Received"). Features flags: `is_final`, `is_lost`, `is_hot`, `attachment_required_on_kanban_change`.
- **`LeadTypeOption` (Lines 186-194):** "Lead for" (Product, Service).
- **`LeadThroughOption` (Lines 197-205):** Inquiry source (Website, Referral).

### The Lead Entity (Lines 208-243)
- **`Lead`:** The central object. Links all metadata (Domain, Region, Contact, Customer, Status, Type, Through).
- **`LeadActivity` (Lines 261-283):** Log entry in the enquiry history.
- **`LeadActivityAttachment` (Lines 249-260):** Files linked to activities. Features `is_quotation` and `quotation_number`.

## Helper Functions (Lines 245-288)
- **`leadDisplayName(lead)` (Lines 314-324):** Logic: Contact Name -> Contact Email -> Customer Company -> "Lead #ID".
- **`leadDisplayCompany(lead)` (Lines 327-331):** Logic: Contact Org -> Customer Company -> "".
- **`leadDisplayEmail(lead)` (Lines 339-343):** Logic: Contact Email -> Customer Primary Contact Email -> "".

## Order Fulfillment Types (Lines 349-411)
- **`Order` (Lines 371-392):** Created from Won leads. Mirrors Lead structure but for delivery tracking.
- **`OrderActivity` (Lines 411-433):** Log entry for order fulfillment.

## MarketingAPIService Class (Lines 416-1638)

### Lead Management (Lines 418-500)
- **`getLeads(params)` (Lines 418-446):** Highly dynamic query builder. Supports `assigned_to` (array), `include_won_lost`, and `no_limit` flags.
- **`updateLeadSeries(id, data)` (Line 683):** Direct patch for numbering series assignment.

### Activity & File Handling (Lines 608-687)
- **`createLeadActivity(leadId, data)` (Lines 620-635):** Creates log entry.
- **`uploadLeadActivityAttachments` (Lines 638-668):**
  - Uses `FormData`.
  - Sequential processing of `attachment_types`, `titles`, and `quotation_numbers`.
  - Special flag: `is_revised` for quotation logic.
- **`downloadLeadActivityAttachment` (Lines 671-681):** Fetches blob and triggers browser `click()` on temporary link.

### Numbering Series Engine (Lines 1285-1335)
- **`generateNextSeriesNumberByCode(code, context)` (Lines 1325-1335):** Crucial method. Accepts `lead_context` (company name) to resolve dynamic placeholders in patterns like `{lead.company_slug}-{YEAR}-{SEQ}`.

### Reporting & Scopes (Lines 1365-1510)
- **`getReportsScope()` (Line 1365):** Returns `ReportScopeResponse` defining if the user can filter by other employees.
- **`getDomainTargetSummary(year, month)` (Line 1485):** returns the hierarchical data for the Domains Review page.
- **`getHeadDashboardSummary(params)` (Line 1493):** Aggregate conversion and hot case data for Admins.

### Custom Dashboards & AI (Lines 1513-1620)
- **`getSavedDashboard(id, params)` (Lines 1517-1523):** Returns layout + pre-executed `widget_data`.
- **`generateWidgetWithAI(data)` (Lines 1590-1600):** Sends natural language prompt + `getSchema()` result to LLM endpoint.
- **`previewSqlTemplate(data)` (Lines 1601-1611):** Runs SQL with temporary user context to show results in the playground.

### Tasks & Reminders (Lines 1640-1738)
- **`getTodayTasks()` (Line 1640):** Fetches follow-ups and manual tasks.
- **`scheduleLeadFollowUp(id, data)` (Line 1735):** Updates `next_follow_up_at` and `follow_up_reminder_type` (Daily, Weekly, etc.).

## Specialized Response Interfaces (Lines 1754-2024)
- **`ReportSummaryResponse` (Lines 1785-1796):** Object containing `inquiries_by_type` and `leads_by_status` counts.
- **`ScopeTargetStats` (Lines 1845-1855):** Aggregated Monthly Target progress for a user's entire scope (Team/Domain).
- **`DomainTargetSummaryResponse` (Lines 1885-1890):** The deep nested structure for the Territory Hierarchy view.
- **`SavedDashboardResponse` (Lines 1915-1928):** Contains the JSON `layout` and the runtime `widget_data` (keyed by widget UUID).
- **`Series` (Lines 1995-2010):** Config for generation logic. Fields: `pattern`, `next_value`, `reset_period` (day/month/year).

## Technical Implementation Details
- **Instance:** `export const marketingAPI = new MarketingAPIService();` (Line 2026).
- **Request Pattern:** Standardizes on `apiClient.get/post/put/delete/patch`.
- **Search Logic:** Implements specialized `/search` endpoints for Contacts and Customers to optimize Lead Form performance.
- **Form Data:** Uses `postFormData` for all file-related operations to handle `multipart/form-data` correctly.
