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

Create a `.env` file in `marketing-fe/`:

**When HRMS is running locally (same machine):**
```env
VITE_API_BASE_URL=http://localhost:8003
VITE_HRMS_RBAC_API_URL=http://localhost:8000/api/rbac
```

**When using production HRMS:**
```env
VITE_API_BASE_URL=http://localhost:8003
VITE_HRMS_RBAC_API_URL=https://hrms.aureolegroup.com/api/rbac
```

If you don't create `.env`, the app defaults to local HRMS at `http://localhost:8000/api/rbac`. Restart the dev server (`npm run dev`) after changing `.env`.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite prints).

### Connecting to local HRMS (including when Marketing API runs in Docker)

The **browser** loads the frontend and calls HRMS. So the HRMS URL must be one the **browser** can reach on your machine: use **`http://localhost:8000/api/rbac`** (do **not** use `host.docker.internal` in the FE – that is for containers, not the browser).

1. **Start HRMS** on the host on port 8000:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
2. **Create or edit `marketing-fe/.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:8003
   VITE_HRMS_RBAC_API_URL=http://localhost:8000/api/rbac
   ```
3. **Restart the marketing dev server** after changing `.env` (Vite bakes env at start): `npm run dev`.
4. **If you run the FE in Docker:** build with these env vars so the built app contains `localhost:8000` for HRMS (the browser will call that on the host).

**Quick check:** open `http://localhost:8000/api/rbac/permissions/` in the browser – you should get JSON (or 401 without auth). If that fails, HRMS isn’t reachable from the browser.

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

The frontend connects to (configurable via `.env`):
- **Marketing API** (FastAPI): default `http://localhost:8003` (`VITE_API_BASE_URL`)
- **HRMS RBAC API**: default `http://localhost:8000/api/rbac` when running locally (`VITE_HRMS_RBAC_API_URL`)

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

## Troubleshooting

**Can’t connect to HRMS from the Marketing FE (e.g. API in Docker, HRMS on host)**  
- The FE runs in the **browser**, so it must call an URL the browser can reach. Use **`http://localhost:8000/api/rbac`** in `.env` (`VITE_HRMS_RBAC_API_URL`), not `host.docker.internal`.
- Ensure HRMS is running on the host: `python manage.py runserver 0.0.0.0:8000`.
- Restart the dev server after changing `.env`: `npm run dev`.
- Test in the browser: open `http://localhost:8000/api/rbac/permissions/`; you should see JSON.
