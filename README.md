# AP | Sales & Marketing Module — Frontend

> **au-marketing-fe** — A high-density, professional ERP-grade frontend for the Aureole Group Sales & Marketing microservice. Built with React 19, TypeScript, and a bespoke Slate/Indigo design system.

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 + custom design tokens |
| State | Redux Toolkit + React Context |
| Routing | React Router DOM v6 |
| Animations | Framer Motion 12 |
| Charts | Recharts |
| UI Primitives | Radix UI (Tooltip, Popover, Dialog, Dropdown) |
| Icons | Lucide React |
| Auth | HRMS RBAC (JWT stored in localStorage) |
| Push Notifications | Firebase Cloud Messaging |

---

## ✨ Features

- 🔐 **HRMS RBAC Authentication** — Login with HRMS credentials, JWT stored securely
- 🛡️ **Permission-Based UI** — Every action/button/route is gated by HRMS permissions
- 📊 **Dashboard & Analytics** — Live KPI stat cards, charts, and activity feeds
- 👥 **Database Module** — Organizations, Customers, and Contacts with unified command bar
- 🎯 **Leads Management** — Full leads lifecycle with server-side sorting, filtering, and pagination
- 📋 **Quotations & Orders** — Enquiry and quotation pipeline
- 🧾 **Invoices** — Invoice tracking and management
- 🔢 **Numbering Series** — Configurable document numbering with live preview
- 📡 **Real-Time Notifications** — Firebase-powered push notifications
- 🔔 **Toast System** — Centralized, global feedback for all user actions
- 🌗 **Theme Support** — Dark/light mode via ThemeProvider

---

## 🏗️ Project Structure

```
au-marketing-fe/
│
├── components/
│   ├── layout/              # DashboardLayout, DatabaseLayout, PageLayout, Navbar, Sidebar
│   └── ui/                  # Full component library (Button, DataTable, Modal, Toast, etc.)
│
├── pages/                   # One file per route
│   ├── DashboardPage.tsx
│   ├── LeadsPage.tsx
│   ├── LeadFormPage.tsx
│   ├── OrganizationsPage.tsx
│   ├── CustomersPage.tsx
│   ├── ContactsPage.tsx
│   ├── NumberingSeriesPage.tsx
│   ├── InvoicesPage.tsx
│   └── ...
│
├── lib/
│   ├── marketing-api.ts     # All API calls to the FastAPI backend
│   └── utils.ts             # cn() utility and helpers
│
├── store/                   # Redux slices (auth, permissions)
│
├── App.tsx                  # Root provider, routes, global toast/notification state
├── UI_COMPONENTS_LIBRARY.md # Source of truth for the design system
├── CHANGELOG.md             # All notable changes, by date
└── index.html
```

---

## ⚙️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Marketing FastAPI backend
VITE_API_BASE_URL=http://localhost:8003

# HRMS RBAC (local)
VITE_HRMS_RBAC_API_URL=http://localhost:8000/api/rbac

# Firebase (optional — for push notifications)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

> If `.env` is absent, the app defaults to `http://localhost:8000/api/rbac` for HRMS.  
> **Always restart the dev server after changing `.env`** — Vite bakes env vars at startup.

### 3. Start Development Server

```bash
npm run dev
```

Runs at **[http://localhost:5173](http://localhost:5173)** (or the port Vite prints).

### 4. Production Build

```bash
npm run build
```

Output goes to `dist/`.

---

## 🔑 Authentication & Permissions

Users log in with HRMS credentials. The app:
1. Authenticates via `VITE_HRMS_RBAC_API_URL`
2. Stores the JWT in `localStorage`
3. Uses the token for every Marketing API request
4. Derives the full permissions list and stores it in Redux

### Key Permissions

| Permission | Description |
|---|---|
| `marketing.view_lead` | Access leads list |
| `marketing.create_lead` | Open lead creation form |
| `marketing.edit_lead` | Edit existing leads |
| `marketing.delete_lead` | Delete leads |
| `marketing.view_contact` | View contacts database |
| `marketing.create_contact` | Add new contacts |
| `marketing.view_customer` | View customer registry |
| `marketing.view_organization` | View organization database |

---

## 🔌 API Connections

| Service | Default URL | Env Var |
|---|---|---|
| Marketing FastAPI | `http://localhost:8003` | `VITE_API_BASE_URL` |
| HRMS RBAC | `http://localhost:8000/api/rbac` | `VITE_HRMS_RBAC_API_URL` |

> **Docker note:** The frontend runs in the **browser**, not in a container. The HRMS URL must be reachable from the browser — use `localhost`, not `host.docker.internal`.

---

## 🎨 Design System

All UI components follow the **Slate/Indigo High-Density ERP** visual language documented in [`UI_COMPONENTS_LIBRARY.md`](./UI_COMPONENTS_LIBRARY.md).

**Key rules:**
- Font: **Outfit** (Google Fonts)
- Border radius: `rounded-xl` for containers, `rounded-full` for pills/capsules
- Headers/labels: `font-black uppercase tracking-widest text-[11px]`
- Interactive elements: `active:scale-[0.98]` click feedback
- Animations: Framer Motion with `spring` transitions
- Loading: Subtle glass overlay on data refetch (no jarring full-table resets)

---

## 🐛 Troubleshooting

**Cannot connect to HRMS from the frontend**
- Use `http://localhost:8000/api/rbac` — not `host.docker.internal` (that's for containers, not browsers).
- Verify HRMS is running: `python manage.py runserver 0.0.0.0:8000`
- Test in browser: open `http://localhost:8000/api/rbac/permissions/` — you should see JSON or a 401.
- Restart dev server: `npm run dev`

**Permissions not loading / all UI locked**
- Check the JWT token in `localStorage` under key `token`.
- Ensure the HRMS user has the relevant `marketing.*` permissions assigned.

---

## 📄 Changelog

See [`CHANGELOG.md`](./CHANGELOG.md) for a full history of changes.

---

_Built with ❤️ for Aureole Group — AP | S&M Module_
