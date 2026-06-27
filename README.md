# AP Sales & Marketing Module — Frontend

**Brand:** S&M Hub · **Package:** `aether-erp-dashboard` · **Version:** 1.1.0

A high-density, ERP-grade React SPA for Aureole Group's Sales & Marketing microservice. Built with React 19, TypeScript, Vite 6, and a bespoke Slate/Blue design system. Manages the full sales lifecycle — leads, orders, quotations, contacts, campaigns, exhibitions/roadshows, team performance, and DSR.

---

## Architecture

```
                             ┌─────────────────────────────┐
                             │       S&M Hub Frontend      │
                             │   React 19 + TypeScript     │
                             │   Vite 6  ·  Tailwind 3     │
                             │       Port 3000             │
                             └──────────┬──────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
        ┌───────────────────┐ ┌─────────────────┐ ┌──────────────┐
        │  Marketing API    │ │   HRMS RBAC     │ │   Firebase   │
        │  FastAPI backend  │ │   Auth API      │ │   Cloud Msg  │
        │  Port 8003        │ │   Port 8000     │ │   (Push)     │
        └───────────────────┘ └─────────────────┘ └──────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   PostgreSQL 16   │
        │   marketing_db    │
        └───────────────────┘
```

The frontend talks to three backends independently:
- **Marketing API** for all business CRUD (leads, orders, events, etc.)
- **HRMS RBAC** for login, permissions, and user info
- **Firebase** for push notifications (optional)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.7 |
| Build | Vite 6 |
| Styling | Tailwind CSS 3.4 + custom design tokens |
| State | Redux Toolkit (auth, DSR, plants) + Zustand (calendar) |
| Routing | React Router DOM v6 (nested, protected) |
| Animations | Framer Motion 12 + Lottie (login) |
| Charts | Recharts (area, bar, pie) |
| Icons | Lucide React |
| UI Primitives | Radix UI (Tooltip, Dialog, Popover, Dropdown, Avatar) |
| Auth | HRMS RBAC (JWT) |
| Push | Firebase Cloud Messaging + OneSignal |
| Data | date-fns, clsx, tailwind-merge, class-variance-authority |

---

## Project Structure

```
au-marketing-fe/
│
├── App.tsx                      # Root: routing, contexts, toast, demo mode
├── index.tsx                    # React entry
│
├── components/
│   ├── layout/                  # DashboardLayout, DatabaseLayout, PageLayout
│   ├── ui/                      # 28 components (DataTable, Modal, Button, Sidebar…)
│   └── ProtectedRoute.tsx       # Auth/permission route guard
│
├── pages/                       # 34 route-level page components
│   ├── auth:        LoginPage
│   ├── core:        Dashboard, Leads, LeadForm, Orders, OrderForm
│   ├── quotations:  EnquiryQuotations
│   ├── database:    Organizations, Customers, Contacts + forms
│   ├── admin:       Domains, DomainForm, RegionForm, Employees, Roles,
│   │                Settings, Schema
│   ├── reports:     Reports, ExpectedOrder, ODPlan, MyTeam,
│   │                ReportTemplates, DSR
│   ├── events:      EventsList, EventForm, EventDetail
│   ├── misc:        Inventory, Financials, Support
│   └── lazy-loaded: NumberingSeries
│
├── lib/
│   ├── api.ts                   # Base APIClient (fetch + XHR progress + 401 handling)
│   ├── marketing-api.ts         # ~150 methods, all TypeScript interfaces
│   ├── hrms-rbac.ts             # HRMS RBAC client
│   ├── api-cache.ts, auth-utils.ts, marketing-scope.ts
│   ├── firebase-push.ts         # FCM web push
│   ├── country-codes.ts, deadline-utils.ts, name-phone-utils.ts
│   └── utils.ts                 # cn() (clsx + tailwind-merge)
│
├── store/
│   ├── index.ts                 # Redux store
│   ├── hooks.ts                 # useAppDispatch, useAppSelector
│   ├── middleware.ts             # auth:token-expired handler
│   └── slices/                  # authSlice, dsrSlice, organizationPlantsSlice
│
├── context/                     # ThemeContext, AuthContext
├── UI/                          # Atomic components (Button, Input, Badge…)
├── public/                      # Static assets, logos, SW scripts
│
├── design.md                    # Design system reference
├── UI_COMPONENTS_LIBRARY.md     # Component patterns
├── CHANGELOG.md                 # v1.0.0 → v1.0.10
│
├── vite.config.ts, tsconfig.json, package.json, index.html
└── .env.example
```

---

## Route Map

```
/login                              → LoginPage
/                                   → DashboardPage
/database/organizations             → OrganizationsPage
/database/customers                 → CustomersPage
/database/contacts                  → ContactsPage

/leads                              → LeadsPage (Kanban + Table)
/leads/new                          → LeadFormPage (Create)
/leads/:id/edit                     → LeadFormPage (Edit)

/orders                             → OrdersPage (Kanban + Table)
/orders/new                         → OrderFormPage (Create)
/orders/:id                         → OrderFormPage (View/Edit)

/quotations                         → EnquiryQuotationsPage
/events                             → EventsListPage
/events/new                         → EventFormPage
/events/:id                         → EventDetailPage
/events/:id/edit                    → EventFormPage

/domains · /domains/new · /:id/edit → Domains CRUD
/employees · /roles                 → Team management
/numbering-series                   → Auto-numbering (lazy)
/settings                           → Multi-tab settings
/support                            → Support center

*                                   → Redirect to /
```

Protected behind `view_lead` | `create_lead` | `edit_lead` | `view_events` | `view_contact` | etc.

---

## Features

- **Auth & RBAC** — HRMS login, every UI element permission-gated
- **Dashboard** — KPI cards, area/bar/pie charts, saved dashboards, performer of month
- **Leads** — Kanban + table views, dynamic statuses, enquiries, attachments, quotations, follow-ups
- **Orders** — Kanban + table, order-level enquiries, file attachments
- **Database** — Organizations, customers, contacts, plants, contact→customer conversion
- **Domains & Regions** — Hierarchy with heads, coordinators, employee assignments, scoped access
- **Quotations** — Searchable, filterable, sortable list with inline PDF preview
- **Events** — Exhibition/roadshow lifecycle: stall booking, space booking, banners, travel, hotel, local travel, gifting, proofs
- **Numbering Series** — Configurable auto-numbering with pattern builder and live preview
- **Team Performance** — Targets, summaries, expected orders, OD plans
- **DSR** — Monthly task submission with deadline enforcement
- **Push Notifications** — Firebase FCM + in-app toast
- **Settings Engine** — Live-updating visibility rules with role-specific overrides
- **Audit Logging** — Full change history per entity

---

## Auth Flow

```
┌──────────┐     POST /api/rbac/login/     ┌───────────┐
│  Browser │ ──────────────────────────────▶│   HRMS   │
│  (React) │                                │   RBAC   │
│          │◀──────────────────────────────│   API    │
│          │   JWT + permissions + roles    └───────────┘
│          │
│          │     GET /api/leads/            ┌───────────┐
│          │ ──────────────────────────────▶│ Marketing │
│          │   Authorization: Bearer JWT    │   API     │
│          │◀──────────────────────────────│  FastAPI  │
│          │   leads[] (scoped by role)     └───────────┘
└──────────┘
```

Permissions flow: HRMS login → fetch permissions list → store in Redux → gate every button/route via `selectHasPermission()`.

---

## Design System

| Element | Rule |
|---|---|
| Font | Outfit (Google Fonts) |
| Container radius | `rounded-xl` (12px) |
| Pills/Badges | `rounded-full` |
| Labels | `font-black uppercase tracking-widest text-[11px] text-slate-500` |
| Input height | `h-11` with `rounded-xl` and blue focus ring |
| Click feedback | `active:scale-[0.98]` with spring |
| Data density | 8–10px padding, `slate-200/60` borders |
| DataTable | Sticky header, sortable columns, glass overlay loading |
| Modals | Backdrop blur, `rounded-[2rem]`, sm–max sizes |
| Theme | 6 colors (blue/sky/emerald/rose/violet/slate) × 3 densities |

Full reference in [`design.md`](./design.md) and [`UI_COMPONENTS_LIBRARY.md`](./UI_COMPONENTS_LIBRARY.md).

---

## Setup

```bash
npm install
npm run dev        # → http://localhost:3000 (HMR)
npm run build      # → dist/ with sourcemaps
```

---

## Key Decisions

- **Auth split**: HRMS handles auth; Marketing API handles business logic
- **JWT in localStorage**: with awareness of XSS exposure — httpOnly cookie migration is the hardening path
- **No StrictMode**: Disabled to avoid React 19 double-invoke in development
- **Dual push**: Firebase FCM primary + OneSignal legacy
- **Demo mode**: `simulateDemo()` injects mock data for testing
- **Settings versioning**: `X-Marketing-Settings-Version` header triggers live UI reload
- **Upload progress**: XHR-based with percentage tracking in lead forms

---

## Troubleshooting

**Cannot connect to HRMS** — Use `localhost:8000` not `host.docker.internal`. Verify HRMS running: `python manage.py runserver 0.0.0.0:8000`.

**Permissions not loading / UI locked** — Check `auth_token` in localStorage. Re-login.

**Database schema mismatch** — Restart backend: `docker compose restart web`. Startup migration adds missing columns.

**TypeScript errors** — Run `npx tsc --noEmit` to verify types.

---

**Forged by BeForth**
