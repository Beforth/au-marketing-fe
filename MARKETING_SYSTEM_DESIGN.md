# Marketing System Design - Domestic & Export with Region-Based Access Control

## Overview

The marketing system will have two main domains:
1. **Domestic Marketing** - Local market operations
2. **Export Marketing** - International operations with multiple regions

## System Architecture

### 1. Domain Structure

```
Marketing System
├── Domestic Marketing
│   ├── Domestic Customers/Leads
│   └── Domestic Campaigns
│
└── Export Marketing
    ├── Region 1 (e.g., North America)
    │   ├── Region Head
    │   ├── Marketing Employees
    │   └── Customers/Leads
    ├── Region 2 (e.g., Europe)
    │   ├── Region Head
    │   ├── Marketing Employees
    │   └── Customers/Leads
    └── Region N (e.g., Asia Pacific)
        ├── Region Head
        ├── Marketing Employees
        └── Customers/Leads
```

### 2. User Roles & Access Levels

#### Role Hierarchy:
1. **Marketing Admin** - Full access to all domains and regions
2. **Domestic Marketing Head** - Access to all domestic customers
3. **Export Marketing Head** - Access to all export customers (all regions)
4. **Region Head** - Access to customers in their assigned region(s)
5. **Marketing Employee** - Access to customers they created + assigned customers

#### Access Rules:

| Role | Domestic Customers | Export Customers (Own Region) | Export Customers (Other Regions) | Customers Created by Self |
|------|-------------------|------------------------------|----------------------------------|---------------------------|
| Marketing Admin | ✅ All | ✅ All | ✅ All | ✅ All |
| Domestic Head | ✅ All | ❌ None | ❌ None | ✅ Yes |
| Export Head | ❌ None | ✅ All | ✅ All | ✅ Yes |
| Region Head | ❌ None | ✅ All in Region | ❌ None | ✅ Yes |
| Marketing Employee | ✅ Created by self | ✅ Created by self | ✅ Created by self | ✅ Yes |

### 3. Data Model Design

#### Customer/Lead Model:
```typescript
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  
  // Domain & Region
  domain: 'domestic' | 'export';
  region_id?: number; // Only for export customers
  region?: Region;    // Region details
  
  // Access Control
  created_by_employee_id: number;
  created_by?: Employee;
  assigned_to_employee_id?: number;
  assigned_to?: Employee;
  
  // Status & Metadata
  status: CustomerStatus;
  created_at: Date;
  updated_at: Date;
}

interface Region {
  id: number;
  name: string;           // e.g., "North America", "Europe"
  code: string;           // e.g., "NA", "EU"
  head_employee_id: number;
  head?: Employee;
  is_active: boolean;
}
```

#### Employee-Region Assignment:
```typescript
interface EmployeeRegionAssignment {
  id: number;
  employee_id: number;
  region_id: number;
  role: 'head' | 'employee';
  is_active: boolean;
}
```

### 4. Permission System

#### HRMS RBAC Permissions Needed:

**Base Permissions:**
- `marketing.view_customer` - Can view customers
- `marketing.create_customer` - Can create customers
- `marketing.edit_customer` - Can edit customers
- `marketing.delete_customer` - Can delete customers

**Domain-Specific Permissions:**
- `marketing.view_domestic_customer` - View domestic customers
- `marketing.view_export_customer` - View export customers
- `marketing.view_all_regions` - View all export regions (Export Head only)

**Region-Specific Permissions:**
- `marketing.view_region.{region_id}` - View specific region
- `marketing.manage_region.{region_id}` - Manage specific region (Head)

**Admin Permissions:**
- `marketing.admin` - Full marketing access

### 5. Access Control Logic

#### Customer Visibility Rules:

```typescript
function canViewCustomer(customer: Customer, user: Employee): boolean {
  // 1. Marketing Admin - can see everything
  if (hasPermission(user, 'marketing.admin')) {
    return true;
  }
  
  // 2. Creator can always see their customers
  if (customer.created_by_employee_id === user.employee_id) {
    return true;
  }
  
  // 3. Assigned employee can see assigned customers
  if (customer.assigned_to_employee_id === user.employee_id) {
    return true;
  }
  
  // 4. Domain-based access
  if (customer.domain === 'domestic') {
    // Domestic customers
    if (hasPermission(user, 'marketing.view_domestic_customer')) {
      return true;
    }
  } else {
    // Export customers
    if (!hasPermission(user, 'marketing.view_export_customer')) {
      return false;
    }
    
    // Check region access
    if (customer.region_id) {
      // Export Head can see all regions
      if (hasPermission(user, 'marketing.view_all_regions')) {
        return true;
      }
      
      // Region Head can see their region
      if (isRegionHead(user, customer.region_id)) {
        return true;
      }
      
      // Regular employee can only see if they created it (already checked above)
      return false;
    }
  }
  
  return false;
}
```

### 6. Backend API Design

#### Customer List Endpoint:
```
GET /api/marketing/customers/
Query Parameters:
  - domain?: 'domestic' | 'export'
  - region_id?: number
  - status?: string
  - created_by?: number
  - assigned_to?: number
```

**Response Filtering Logic:**
- Automatically filters based on user's permissions
- Region heads only see their region
- Employees see customers they created
- Admins see everything

#### Customer Create Endpoint:
```
POST /api/marketing/customers/
Body:
  - domain: 'domestic' | 'export'
  - region_id?: number (required if domain='export')
  - ...customer fields
```

**Validation:**
- If domain='export', region_id is required
- User must have permission to create in that domain/region
- Automatically sets created_by_employee_id

### 7. Frontend Implementation

#### Redux State Structure:
```typescript
interface MarketingState {
  customers: {
    items: Customer[];
    filters: {
      domain?: 'domestic' | 'export';
      region_id?: number;
      status?: string;
    };
    loading: boolean;
  };
  regions: Region[];
  currentUser: {
    employee_id: number;
    roles: string[];
    permissions: string[];
    assigned_regions: number[];
    is_region_head: boolean;
  };
}
```

#### Component Access Control:
```typescript
// Customer List Component
const CustomerList = () => {
  const { domain, region_id } = useAppSelector(selectMarketingFilters);
  const canViewAllDomestic = useAppSelector(selectHasPermission('marketing.view_domestic_customer'));
  const canViewAllExport = useAppSelector(selectHasPermission('marketing.view_export_customer'));
  const assignedRegions = useAppSelector(selectAssignedRegions);
  
  // Filter customers based on permissions
  const visibleCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Creator can always see
      if (customer.created_by_employee_id === currentUser.employee_id) {
        return true;
      }
      
      // Domain-based filtering
      if (customer.domain === 'domestic') {
        return canViewAllDomestic;
      } else {
        // Export customers
        if (!canViewAllExport && !assignedRegions.includes(customer.region_id)) {
          return false;
        }
        return true;
      }
    });
  }, [customers, canViewAllDomestic, canViewAllExport, assignedRegions]);
  
  return <CustomerTable customers={visibleCustomers} />;
};
```

### 8. Database Schema (FastAPI/SQLAlchemy)

```python
class Region(Base):
    __tablename__ = "regions"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    head_employee_id = Column(Integer, ForeignKey("employees.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    
    # Domain & Region
    domain = Column(Enum('domestic', 'export'), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    
    # Access Control
    created_by_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    assigned_to_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Status
    status = Column(String(50), default='new')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmployeeRegionAssignment(Base):
    __tablename__ = "employee_region_assignments"
    
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    role = Column(Enum('head', 'employee'), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 9. Implementation Phases

#### Phase 1: Core Structure
1. ✅ Create Region model and API
2. ✅ Update Customer model with domain/region fields
3. ✅ Create EmployeeRegionAssignment model
4. ✅ Add domain/region filters to customer API

#### Phase 2: Access Control
1. ✅ Implement permission checking in customer API
2. ✅ Add region-based filtering
3. ✅ Add creator-based access
4. ✅ Update frontend to use filtered data

#### Phase 3: UI/UX
1. ✅ Add domain selector (Domestic/Export)
2. ✅ Add region selector for export
3. ✅ Show region badges on customers
4. ✅ Add access control indicators

#### Phase 4: Advanced Features
1. ✅ Region management UI
2. ✅ Employee-region assignment UI
3. ✅ Access audit logs
4. ✅ Reports by domain/region

### 10. Security Considerations

1. **Backend Validation**: Always validate access on backend, never trust frontend
2. **Permission Checks**: Check permissions on every API call
3. **Data Filtering**: Filter data at database level, not just in application
4. **Audit Logging**: Log all access attempts and data changes
5. **Role Hierarchy**: Respect role hierarchy (admin > head > employee)

### 11. Example Scenarios

#### Scenario 1: Region Head Views Customers
- User: John (Region Head - North America)
- Can see: All customers in North America region + customers he created in other regions
- Cannot see: Customers in Europe region (unless he created them)

#### Scenario 2: Marketing Employee Creates Customer
- User: Sarah (Marketing Employee - Europe)
- Creates customer in North America region
- Can see: This customer (because she created it)
- Cannot see: Other North America customers (unless created by her)

#### Scenario 3: Export Head Views All
- User: Mike (Export Marketing Head)
- Can see: All export customers in all regions
- Cannot see: Domestic customers (unless he created them)

### 12. Questions to Consider

1. **Can a region head see customers in multiple regions?**
   - Answer: Only if assigned to multiple regions, or if they created the customer

2. **Can domestic employees see export customers?**
   - Answer: Only if they created them

3. **What happens when a region head is reassigned?**
   - Answer: They lose access to old region, gain access to new region, but keep access to customers they created

4. **Can customers be reassigned between regions?**
   - Answer: Yes, but only by admins or export heads

5. **How do we handle region deletion?**
   - Answer: Archive region, reassign customers, or prevent deletion if customers exist
