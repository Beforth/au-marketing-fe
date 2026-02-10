# Marketing Frontend

React + TypeScript frontend for the Marketing module, integrated with HRMS RBAC.

## Features

- ✅ **HRMS RBAC Authentication** - Login with HRMS credentials
- ✅ **Permission-Based Access** - UI elements based on user permissions
- ✅ **Marketing API Integration** - Connected to FastAPI marketing microservice
- ✅ **Modern UI** - Built with React, TypeScript, and Tailwind CSS
- ✅ **Protected Routes** - Automatic redirect to login if not authenticated

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8001
VITE_HRMS_RBAC_API_URL=https://hrms.aureolegroup.com/api/rbac
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Authentication

Users must login with their HRMS credentials. The app will:
1. Authenticate via HRMS RBAC API
2. Store the token in localStorage
3. Use the token for all API requests
4. Check permissions for UI elements and routes

## Permissions

The following HRMS permissions are used:

- `marketing.view_lead` - View leads
- `marketing.create_lead` - Create leads
- `marketing.edit_lead` - Edit leads
- `marketing.delete_lead` - Delete leads
- `marketing.view_campaign` - View campaigns
- `marketing.create_campaign` - Create campaigns
- `marketing.edit_campaign` - Edit campaigns
- `marketing.delete_campaign` - Delete campaigns

## Project Structure

```
marketing-fe/
├── components/        # Reusable UI components
├── context/          # React contexts (Auth, Theme)
├── lib/              # API clients and utilities
│   ├── api.ts        # Base API client
│   ├── hrms-rbac.ts  # HRMS RBAC client
│   └── marketing-api.ts  # Marketing API service
├── pages/            # Page components
├── App.tsx           # Main app component
└── index.tsx         # Entry point
```

## API Integration

The frontend connects to:
- **Marketing API** (FastAPI): `http://localhost:8001`
- **HRMS RBAC API**: `https://hrms.aureolegroup.com/api/rbac`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Development

- Uses Vite for fast development
- Hot module replacement enabled
- TypeScript for type safety
- Tailwind CSS for styling
