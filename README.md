# LeadsBoard — Frontend

A modern React SPA for the **LeadsBoard** B2B lead management platform. Built with the **Fresh Minimalism** design system — warm ivory surfaces, mint primary, coral accents, and nature-inspired typography.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| HTTP | Axios (with Sanctum bearer token interceptor) |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Styling | CSS Modules + CSS Custom Properties (design tokens) |
| Typography | Poppins (display) + Inter (body) via Google Fonts |

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **LeadsBoard Backend API** running (default: `http://localhost:8000`)

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd LeadsBoard-Frontend
npm install
```

### 2. Environment Setup

Copy the example environment file and adjust values as needed:

```bash
cp .env.example .env
```

**`.env` variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the LeadsBoard backend API (no trailing slash) |
| `VITE_APP_NAME` | `LeadsBoard` | Application display name |

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**. The Vite dev server proxies all `/api` requests to `VITE_API_BASE_URL`, so there are no CORS issues during local development.

### 4. Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

---

## Project Structure

```
src/
├── api/                    # API service modules
│   ├── client.js           # Axios instance (baseURL, token interceptor, 401 redirect)
│   ├── auth.js             # POST /auth/login, GET /auth/me, POST /auth/logout
│   ├── leads.js            # GET/POST/PUT/DELETE /leads, export CSV, get filters
│   └── stats.js            # GET /stats/summary, by-industry, by-title-tier, etc.
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx   # Sidebar + content wrapper with mobile hamburger
│   │   └── Sidebar.jsx     # Collapsible nav with mint-pill active state
│   │
│   ├── ui/                 # Shared design-system components
│   │   ├── Button.jsx      # Primary (mint), Secondary (coral), Ghost, Outline, Danger
│   │   ├── Card.jsx        # Surface-container fill, soft shadow, padding variants
│   │   ├── Chip.jsx        # Label-caps, pill, active/inactive toggle
│   │   ├── EmptyState.jsx  # Centered icon + title + description
│   │   ├── Input.jsx       # Input/Select/Textarea with label, error, mint focus
│   │   ├── Pagination.jsx  # Prev/next, page numbers, record count
│   │   └── StatusBadge.jsx # Color-coded status pills (new/reviewed/qualified/rejected)
│   │
│   └── ProtectedRoute.jsx  # Auth guard — redirects to /login if unauthenticated
│
├── contexts/
│   └── AuthContext.jsx      # Sanctum token state, login/logout, auto-verify on mount
│
├── pages/
│   ├── LoginPage.jsx        # Email/password form → Sanctum token
│   ├── DashboardPage.jsx    # Stat cards, status breakdown, timeline + breakdown charts
│   ├── LeadsPage.jsx        # Search, filters, sortable table, CSV export, pagination
│   └── LeadDetailPage.jsx   # Full lead info, edit status/notes, delete with confirmation
│
├── styles/
│   ├── variables.css        # All design tokens as CSS custom properties
│   └── global.css           # Resets, base typography, scrollbar, utilities
│
├── App.jsx                  # Route definitions + toast provider
├── main.jsx                 # BrowserRouter + AuthProvider + CSS imports
└── index.css                # Design system imports
```

---

## Connecting to the Backend

The frontend expects the **LeadsBoard Backend API** (Laravel) at the URL specified in `VITE_API_BASE_URL`. Authentication uses **Laravel Sanctum bearer tokens**.

### Authentication Flow

1. User enters credentials on `/login`
2. Frontend calls `POST /api/v1/auth/login` → receives `{ token, user }`
3. Token is stored in `localStorage` and attached to all subsequent requests via Axios interceptor
4. On 401 response, token is cleared and user is redirected to `/login`

### API Endpoints Used

| Page | Endpoints |
|------|-----------|
| Login | `POST /auth/login` |
| Dashboard | `GET /stats/summary`, `/stats/timeline`, `/stats/by-industry`, `/stats/by-title-tier`, `/stats/by-country` |
| Leads | `GET /leads`, `GET /leads/filters`, `GET /leads/export/csv` |
| Lead Detail | `GET /leads/{id}`, `PUT /leads/{id}`, `DELETE /leads/{id}` |

See [API_DOCUMENTATION.md](../LeadsBoard-BackendAPI/docs/API_DOCUMENTATION.md) for full endpoint reference.

---

## Design System

The UI follows the **Fresh Minimalism** design system. Key principles:

- **60/30/10 color balance**: 60% warm ivory, 30% mint, 10% coral
- **Typography**: Poppins Semibold for headlines, Inter for body
- **Shapes**: Soft & rounded (8–24px radii), pill for chips/tags
- **Elevation**: Warm-tinted ambient shadows, tonal surface layers
- **Responsive**: 12-column grid, collapsible sidebar, mobile drawer

All tokens are defined in [`src/styles/variables.css`](src/styles/variables.css) and referenced throughout components via CSS custom properties.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint |

---

## License

Private — CertiCode
