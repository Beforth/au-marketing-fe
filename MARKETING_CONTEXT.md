# Marketing Module Context - Technical Documentation

This document provides a comprehensive, high-detail overview of the Marketing Module within the `au-marketing-fe` project. It is designed to serve as a primary context source for AI assistants and developers.

---

## 1. Module Overview & Architecture

The Marketing Module is a sophisticated CRM and Sales tracking system built with React, TypeScript, and Redux. It features a hierarchical access control system based on **Domains** (Domestic vs. Export) and **Regions**.

### Core Hierarchy:
- **Domains**: The top-level division (e.g., Domestic, Export).
- **Regions**: Sub-divisions within a Domain (e.g., North America, Europe).
- **Organizations**: Companies or entities.
- **Plants**: Specific locations or units under an Organization.
- **Contacts**: Individual people or initial inquiries (not yet customers).
- **Customers**: Converted contacts with established business relations.
- **Leads**: Opportunities associated with a Contact or Customer.
- **Orders**: Successfully won leads.

---

## 2. Key File Directory & Entry Points

| Feature | Primary File | Description |
|:--- |:--- |:--- |
| **API Service** | `lib/marketing-api.ts` | Centralized service for all marketing-related backend calls and type definitions. |
| **RBAC / Scope** | `lib/marketing-scope.ts` | Logic for frontend domain/region filtering and user role management. |
| **Routing** | `App.tsx` | Main application router and notification provider. |
| **UI Atoms** | `UI/` folder | Core design system components (Table, Input, Button, etc.). |
| **UI Molecules** | `components/ui/` | Complex UI components (DataTable, FilterPopover, Charts). |
| **Leads Kanban** | `pages/LeadsPage.tsx` | Visual pipeline for opportunity management. |
| **Lead Form** | `pages/LeadFormPage.tsx` | Complex form for creating/editing leads with status-driven fields. |
| **Orders Tracking** | `pages/OrdersPage.tsx` | Lifecycle management of won/lost orders. |
| **State (Redux)** | `store/slices/` | `authSlice.ts`, `tasksSlice.ts`, `organizationPlantsSlice.ts`. |

---

## 3. Detailed Data Models (`lib/marketing-api.ts`)

### `Lead` Interface (Lines 163-205)
```typescript
export interface Lead {
  id: number;
  domain_id: number;
  region_id?: number;
  contact_id?: number;
  customer_id?: number;
  plant_id?: number;
  status_id?: number;
  potential_value?: number;
  quote_number?: string | null;
  expected_closing_date?: string;
  // Relations
  domain?: Domain;
  region?: Region;
  contact?: Contact | null;
  customer?: Customer;
  status_option?: LeadStatusOption;
  // ...
}
```

### `Customer` Interface (Lines 76-108)
```typescript
export interface Customer {
  id: number;
  company_name: string;
  domain_id: number;
  region_id?: number;
  organization_id?: number | null;
  plant_id?: number | null;
  primary_contact_contact_id?: number | null;
  // Relations
  organization?: Organization | null;
  plants?: Plant[];
  primary_contact_contact?: Contact | null;
}
```

### `Contact` Interface (Lines 51-74)
```typescript
export interface Contact {
  id: number;
  contact_person_name?: string;
  contact_email?: string;
  is_converted: boolean;
  converted_to_customer_id?: number;
  organization_id?: number | null;
}
```

---

## 4. API Service Breakdown (`MarketingAPIService` class)

The `marketingAPI` instance (exported from `lib/marketing-api.ts`) contains methods for:

### Leads & Activities (Lines 362-588)
- `getLeads(params)`: Supports complex filtering by `domain_id`, `region_id`, `created_by_me`, `include_won_lost`, and `search`.
- `createLeadActivity()`: Logs interactions (Call, Email, Meeting) and handles status transitions.
- `uploadLeadActivityAttachments()`: Handles file uploads for quotations and general attachments.
- `updateLeadSeries()`: Manages lead numbering series (Admin only).

### Orders (Lines 590-711)
- `getOrders()`: Fetches won leads converted to orders.
- `updateOrder()`: Tracks delivery dates and status changes.

### Entity Management (Lines 730-1017)
- `getContacts() / searchContacts()`: For initial lead entry.
- `convertContactToCustomer()`: Critical workflow step.
- `getOrganizations() / createOrganizationPlant()`: Managing the corporate hierarchy.

### Reports & Dashboard (Lines 1084-1234)
- `getReportsSummary()`: Aggregated metrics for employees.
- `getDashboardTargetStats()`: Monthly targets vs. achievements.
- `getHeadDashboardSummary()`: Region-wise breakdown for heads/admins.

---

## 5. Scope & Access Control (`lib/marketing-scope.ts`)

Access control is managed via the `MarketingScope` interface:
```typescript
export type MarketingScopeRole = 'super_admin' | 'domain_head' | 'region_head' | 'employee' | 'self';

export interface MarketingScope {
  role: MarketingScopeRole;
  domain_id?: number;
  region_id?: number;
  region_ids?: number[];
  employee_id?: number;
}
```
Stored in `localStorage` under `marketing_scope`, this determines which data is visible in the UI and which filters are applied to API calls.

---

## 6. UI Component Library (`UI/`)

The system uses a custom high-density design system located in the root `UI/` folder.

| Component | Path | Key Usage |
|:--- |:--- |:--- |
| **Table** | `UI/Table.tsx` | All list views (Leads, Contacts, Orders). |
| **Badge** | `UI/Badge.tsx` | Status indicators (Hot, Won, Lost, Region labels). |
| **Modal** | `UI/Modal.tsx` | Forms and confirmation dialogs. |
| **Skeleton** | `UI/Skeleton.tsx` | Loading states for data-heavy tables. |
| **SearchBar** | `UI/SearchBar.tsx` | Global and local list searching. |

---

## 7. Critical Workflows

### 1. Lead Lifecycle
1. **Contact Creation**: `pages/ContactFormPage.tsx`
2. **Lead Initialization**: `pages/LeadFormPage.tsx` (links to Contact or Customer).
3. **Activity Logging**: Transitions Lead through `LeadStatusGroup` (Initialization -> Follow -> Quotation).
4. **Mark as Won/Lost**:
   - **Won**: Triggers Order creation (`pages/OrdersPage.tsx`).
   - **Lost**: Requires `lost_reason` and `lost_to_competitor`.

### 2. Quotation Management
- Quotations are added as `LeadActivityAttachment` with `is_quotation: true`.
- Tracking is handled in `pages/EnquiryQuotationsPage.tsx`.
- Series generation logic is in `marketingAPI.generateNextSeriesNumberByCode`.

### 3. Reporting
- **Expected Order Report**: Monthly projection (`pages/ExpectedOrderNewPage.tsx`).
- **OD Plan**: Outdoor Duty/Travel planning (`pages/ODPlanPage.tsx`).
- **Dashboard**: `pages/DashboardPage.tsx` uses `getScopeTargetStats` to show performance.

---

## 8. State Management (Redux)

- **`authSlice.ts`**: Handles token, user profile, and permissions.
- **`tasksSlice.ts`**: Manages today's follow-up tasks derived from lead statuses.
- **`organizationPlantsSlice.ts`**: Caches organization and plant data for form selectors.

---

## 9. Formatting & Conventions

- **Dates**: ISO strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Currency**: Handled as numbers in potential/closed values.
- **Statuses**: Driven by `code` and `group_id` rather than raw strings.
- **Filtering**: Most pages use `URLSearchParams` to sync UI state with API queries.
