# Redux Migration Guide

## Overview

The marketing frontend has been migrated from React Context API to Redux Toolkit for state management. This provides better performance, devtools support, and easier state management.

## What Changed

### 1. Redux Store Setup
- **Location**: `store/index.ts`
- **Store**: Configured with auth slice
- **Middleware**: Added for token expiration handling

### 2. Auth Slice
- **Location**: `store/slices/authSlice.ts`
- **Actions**: 
  - `loadAuthFromStorage` - Loads session from localStorage
  - `login` - Authenticates user
  - `logout` - Logs out user
  - `checkPermission` - Checks user permissions
- **Selectors**: Pre-built selectors for accessing auth state

### 3. Typed Hooks
- **Location**: `store/hooks.ts`
- `useAppDispatch()` - Typed dispatch hook
- `useAppSelector()` - Typed selector hook

## Migration from Context API

### Before (Context API):
```typescript
import { useAuth } from '../context/AuthContext';

const { isAuthenticated, user, login, logout } = useAuth();
```

### After (Redux):
```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, logout, selectIsAuthenticated, selectUser } from '../store/slices/authSlice';

const dispatch = useAppDispatch();
const isAuthenticated = useAppSelector(selectIsAuthenticated);
const user = useAppSelector(selectUser);

// Login
await dispatch(login({ username, password }));

// Logout
await dispatch(logout());
```

## Available Selectors

- `selectIsAuthenticated` - Check if user is authenticated
- `selectToken` - Get auth token
- `selectUser` - Get user object
- `selectEmployee` - Get employee object
- `selectRoles` - Get user roles
- `selectPermissions` - Get user permissions
- `selectUserDisplayName` - Get formatted user name
- `selectUserInitials` - Get user initials
- `selectHasPermission(code)` - Check specific permission
- `selectHasAnyPermission(codes)` - Check any of permissions
- `selectHasAllPermissions(codes)` - Check all permissions

## Session Management

Session is automatically maintained:
- Token stored in `localStorage` as `auth_token`
- User data stored as `auth_user_data`
- Auto-loads on app start
- Auto-clears on token expiration (401 responses)

## Redux DevTools

Install Redux DevTools browser extension to:
- Inspect state changes
- Time-travel debugging
- Action logging
- State inspection

## Benefits

1. **Better Performance**: Redux only re-renders components that use changed state
2. **DevTools**: Full Redux DevTools support
3. **Predictable State**: Single source of truth
4. **Type Safety**: Fully typed with TypeScript
5. **Middleware Support**: Easy to add logging, persistence, etc.
