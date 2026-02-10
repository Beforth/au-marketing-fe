# HRMS RBAC API - Complete Reference

## Base URL
```
https://hrms.aureolegroup.com/api/rbac/
```

## Authentication Method
- **Type**: Token-based authentication
- **Header Format**: `Authorization: Token your-token-here`
- **Token Source**: Received from `/login/` endpoint

---

## Available Endpoints

### 1. Login
**Endpoint**: `POST /api/rbac/login/`  
**Auth Required**: No  
**Description**: Authenticate user and receive token with user info, roles, and permissions

**Request:**
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "is_superuser": false,
    "last_login": "2024-01-15T10:30:00Z",
    "date_joined": "2024-01-01T00:00:00Z"
  },
  "employee": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "employee_id": "EMP001",
    "department": "Information Technology",
    "designation": "Senior Developer",
    "is_active": true
  },
  "roles": [
    {
      "id": 3,
      "name": "Manager",
      "role_type": "manager",
      "level": 3,
      "is_primary": true,
      "department_scope": null,
      "team_scope": null
    }
  ],
  "permissions": [
    {
      "id": 1,
      "name": "View Employees",
      "code": "employee.view",
      "category": "employee",
      "level": 1,
      "description": "Permission to view employees"
    }
  ],
  "permission_count": 25
}
```

---

### 2. Logout
**Endpoint**: `POST /api/rbac/logout/`  
**Auth Required**: Yes (Token)  
**Description**: Logout user and invalidate token

**Headers:**
```
Authorization: Token your-token-here
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 3. Check Single Permission
**Endpoint**: `POST /api/rbac/check-permission/`  
**Auth Required**: Yes (Token)  
**Description**: Check if user has a specific permission

**Headers:**
```
Authorization: Token your-token-here
Content-Type: application/json
```

**Request:**
```json
{
  "permission": "employee.view"
}
```

**Response:**
```json
{
  "success": true,
  "has_permission": true,
  "permission": {
    "id": 1,
    "name": "View Employees",
    "code": "employee.view",
    "category": "employee",
    "level": 1,
    "description": "Permission to view employees"
  },
  "user": {
    "id": 1,
    "username": "john.doe"
  }
}
```

---

### 4. Check Multiple Permissions
**Endpoint**: `POST /api/rbac/check-permissions/`  
**Auth Required**: Yes (Token)  
**Description**: Check multiple permissions at once (more efficient)

**Headers:**
```
Authorization: Token your-token-here
Content-Type: application/json
```

**Request:**
```json
{
  "permissions": ["employee.view", "employee.create", "attendance.view"]
}
```

**Response:**
```json
{
  "success": true,
  "permissions": {
    "employee.view": true,
    "employee.create": false,
    "attendance.view": true
  },
  "user": {
    "id": 1,
    "username": "john.doe"
  }
}
```

---

### 5. Get User Permissions (Grouped by Category)
**Endpoint**: `GET /api/rbac/user/permissions/`  
**Auth Required**: Yes (Token)  
**Description**: Get all user permissions grouped by category

**Headers:**
```
Authorization: Token your-token-here
```

**Response:**
```json
{
  "success": true,
  "permissions": {
    "Employee Management": [
      {
        "id": 1,
        "name": "View Employees",
        "code": "employee.view",
        "level": 1,
        "description": "Permission to view employees"
      }
    ],
    "Attendance Management": [
      {
        "id": 15,
        "name": "View Attendance",
        "code": "attendance.view",
        "level": 1,
        "description": "Permission to view attendance"
      }
    ]
  },
  "permission_count": 25,
  "user": {
    "id": 1,
    "username": "john.doe"
  }
}
```

---

### 6. Get User Roles
**Endpoint**: `GET /api/rbac/user/roles/`  
**Auth Required**: Yes (Token)  
**Description**: Get user roles with their permissions

**Headers:**
```
Authorization: Token your-token-here
```

**Response:**
```json
{
  "success": true,
  "roles": [
    {
      "id": 3,
      "name": "Manager",
      "role_type": "manager",
      "level": 3,
      "description": "Team management and approval authority",
      "is_primary": true,
      "department_scope": null,
      "team_scope": null,
      "permissions": ["employee.view", "attendance.view", "leave.approve"],
      "permission_count": 15
    }
  ],
  "role_count": 1,
  "user": {
    "id": 1,
    "username": "john.doe"
  }
}
```

---

### 7. Get Complete User Info ⚠️ IMPORTANT
**Endpoint**: `GET /api/rbac/user/info/` (Note: `/user/info/` with forward slash, NOT `/user-info/`)  
**Auth Required**: Yes (Token)  
**Description**: Get complete user information including roles and permissions

**Headers:**
```
Authorization: Token your-token-here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john.doe",
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "is_superuser": false,
    "last_login": "2024-01-15T10:30:00Z",
    "date_joined": "2024-01-01T00:00:00Z"
  },
  "employee": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "employee_id": "EMP001",
    "department": "Information Technology",
    "designation": "Senior Developer",
    "is_active": true
  },
  "roles": [...],
  "permissions": [...],
  "permission_count": 25,
  "role_count": 1
}
```

---

### 8. Get All Permissions (Public)
**Endpoint**: `GET /api/rbac/permissions/`  
**Auth Required**: No  
**Description**: Get all permissions created in HRMS (one list of permission codes).

**Response:**
```json
{
  "success": true,
  "total": 80,
  "permissions": [
    "employee.view",
    "employee.create",
    "marketing.view_domain",
    "marketing.view_contact"
  ]
}
```

**Frontend**: Use `hrmsRBACClient.getAllPermissions()` which returns `AllPermissionsResponse` (`{ success, total, permissions: string[] }`).

---

### 9. Get Available Roles (Public)
**Endpoint**: `GET /api/rbac/roles/`  
**Auth Required**: No  
**Description**: Get all available roles in the system (public endpoint)

**Response:**
```json
{
  "success": true,
  "roles": [
    {
      "id": 1,
      "name": "Administrator",
      "role_type": "admin",
      "level": 5,
      "description": "Full system access",
      "is_system_role": true,
      "permission_count": 80
    }
  ],
  "total_roles": 6
}
```

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid credentials
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Endpoint not found
- `500 Internal Server Error` - Server error
- `429 Too Many Requests` - Rate limit exceeded

---

## Important Notes

### ⚠️ Endpoint URL Correction
- **Correct**: `/api/rbac/user/info/` (with forward slash)
- **Incorrect**: `/api/rbac/user-info/` (with hyphen)
- The documentation shows `/user-info/` but the actual implementation uses `/user/info/`

### Token Format
- Use `Authorization: Token your-token-here` (not Bearer)
- Token is received from login endpoint
- Token is stored in Django's Token model

### Permission Codes
- Format: `{category}.{action}` (e.g., `employee.view`, `marketing.create_lead`)
- Categories: employee, attendance, leave, marketing, etc.
- Actions: view, create, edit, delete, approve, etc.

### Employee Data
- Uses `emp_id` field (not `employee_id`) in database
- Designation uses `title` field (not `name`)
- Department uses `name` field

---

## Current Frontend Implementation

The marketing frontend uses:
- ✅ `/api/rbac/login/` - Login
- ✅ `/api/rbac/user/info/` - Get user info (FIXED: was using `/user-info/`)
- ✅ `/api/rbac/check-permission/` - Check single permission
- ✅ `/api/rbac/check-permissions/` - Check multiple permissions
- ✅ `/api/rbac/logout/` - Logout

All endpoints are properly integrated with Redux for state management.
