# LeadsBoard — Frontend

A modern React SPA for the **LeadsBoard** B2B lead management platform. Built with the **Fresh Minimalism** design system — warm ivory surfaces, mint primary, coral accents, and nature-inspired typography.

> ⚠️ **Note:** This repository is the **React UI** only. The Laravel API is located in the [LeadsBoard-BackendAPI](../LeadsBoard-BackendAPI) repository.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| HTTP | Axios (with Sanctum bearer token interceptor) |
| State/Cache | `@tanstack/react-query` (Server-state caching & deduplication) |
| Charts | Recharts |
| Styling | CSS Modules + CSS Custom Properties (design tokens) |

---

## 🔗 Connecting to the Backend

The frontend is completely decoupled and expects the **LeadsBoard Backend API** (Laravel) to be running.

### 1. Local Development Setup

1. Ensure the Laravel backend is running (`php artisan serve` on port 8000).
2. Clone this frontend repository:
   ```bash
   git clone <your-repo-url>
   cd LeadsBoard-Frontend
   npm install
   ```
3. Copy the `.env` file:
   ```bash
   cp .env.example .env
   ```
4. **Crucial:** Set the API base URL to the **IPv4** address of the backend:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
5. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### 2. Authentication & State
- Authentication uses **Laravel Sanctum bearer tokens**.
- On login, the token is stored in `localStorage` and attached to all Axios requests.
- `react-query` aggressively caches responses (e.g., table sorting, dashboard stats) to prevent spamming the backend with duplicate requests.

---

## 🛠️ Troubleshooting & Local Quirks

### 1. The "500ms Delay" (Windows Defender)
If you notice API calls taking exactly ~500ms to resolve locally:
- **Cause:** This is a known issue with the Laravel backend running on the Windows PHP built-in server (`php artisan serve`). Windows Defender intercepts and scans the hundreds of files Laravel opens per request.
- **Fix:** Add your code directory to the Windows Defender **Exclusions list**. In production (Linux), these same requests will execute in 10–30ms.

### 2. "Network Error" or Extreme Latency (Node.js IPv6 bug)
- **Cause:** Modern versions of Node.js prioritize IPv6 DNS resolution. If you set `VITE_API_BASE_URL=http://localhost:8000`, Node will attempt to connect to `[::1]:8000`, hang for ~500ms, fail, and then fall back to IPv4.
- **Fix:** Bypass DNS resolution by using the explicit IPv4 address in your `.env`: `VITE_API_BASE_URL=http://127.0.0.1:8000`.

### 3. CORS Preflight Requests
- Because the frontend (`localhost:5173`) and backend (`127.0.0.1:8000`) operate on different ports, the browser correctly treats them as different origins.
- The browser will send an `OPTIONS` request before every `GET`/`POST`.
- **Laravel handles this automatically.** You will see the 1ms `OPTIONS` requests in the backend terminal logs — this is completely normal and mirrors how production works!

---

## Production Deployment

When deploying both repositories separately (e.g., Backend on Hostinger, Frontend on Vercel/Netlify):

1. **Frontend `.env`:** Change `VITE_API_BASE_URL` to point to your live backend (e.g., `https://api.leadsboard.com`).
2. **Backend CORS:** Ensure the live frontend domain (e.g., `https://app.leadsboard.com`) is allowed in the backend's CORS configuration.
3. Build the frontend:
   ```bash
   npm run build
   ```
   Deploy the resulting `dist/` folder.

---

## Design System

The UI follows the **Fresh Minimalism** design system. Key principles:
- **60/30/10 color balance**: 60% warm ivory, 30% mint, 10% coral
- **Typography**: Poppins Semibold for headlines, Inter for body
- **Shapes**: Soft & rounded (8–24px radii), pill for chips/tags
All tokens are defined in [`src/styles/variables.css`](src/styles/variables.css).

---
## License
Private — CertiCode
