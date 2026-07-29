# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend-only React/TypeScript SPA for "BarberCRM", a barbershop booking and management system. Built with Vite. There is no backend code in this repo — it's a pure API client expecting a separate backend service (see "Backend API" below).

## Commands

```
npm run dev       # start Vite dev server
npm run build     # production build (tsc project build via vite build)
npm run lint      # eslint over the whole repo
npm run preview   # preview a production build locally
```

There is no test runner configured in this project (no Jest/Vitest setup, no test scripts).

## Backend API

- The app talks to a REST API at `VITE_API_URL` (env var), defaulting to `http://localhost:5000/api` — see `src/api/index.ts`.
- Auth is a bearer token stored in `localStorage` under `token`, attached to every request via an axios request interceptor (`src/api/index.ts`).
- `src/api/index.ts` exports typed resource clients (`clientApi`, `employeeApi`, `appointmentApi`, `serviceApi`, `reviewApi`) built on a shared axios instance. `BookingPage` and `Settings` call the shared `api` axios instance directly for endpoints not wrapped by those resource clients (`/auth`, `/booking/*`, `/settings`).
- Request/response shapes live in `src/api/types.ts`.

**Important:** `src/api/routes/*.js` and `src/models/*.js` are leftover Express/Mongoose backend source files (CommonJS `require`, Mongoose schemas) that are NOT part of the Vite build and are not imported anywhere in `src/`. Don't treat them as live code — they describe (an older version of) the actual backend, which lives in a separate repository.

## Architecture

- **Routing** (`src/App.tsx`): `react-router-dom` with two public routes (`/login`, `/book` — the public booking flow) and all other routes nested under a `ProtectedRoute` + `Layout` shell.
- **Auth** (`src/context/AuthContext.tsx`): React context providing `user`, `token`, `login`, `logout`, `loading`. On mount it validates any stored token against `GET /auth/me`. Users have a `role` of `admin`, `barber`, or `client`.
- **Route guarding** (`src/components/ProtectedRoute.tsx`): redirects to `/login` if unauthenticated, or to `/` if the user's role isn't in the route's `allowedRoles`. Role gating is also duplicated in `src/components/Sidebar.tsx` to decide which nav items to show — keep both in sync when changing role access.
- **Layout** (`src/components/Layout.tsx` + `Sidebar.tsx` + `Header.tsx`): sidebar navigation (collapsible on mobile) wrapping an `<Outlet />` for the authenticated CRM pages (Dashboard, Clients, ClientDetails, Appointments, Employees, Services, Reports, Settings).
- **Public booking flow** (`src/pages/BookingPage.tsx`): a standalone 5-step wizard (service → employee → date/time → contact info → confirmation) mounted at `/book`, outside the authenticated shell. It defines its own lightweight `Service`/`Employee` interfaces rather than reusing `src/api/types.ts`.
- **Dashboard widgets**: `src/components/dashboard/*` (MetricCard, DailyRevenue, AppointmentList, RecentClients) are presentational components consumed by `src/pages/Dashboard.tsx`.
- UI text is in Ukrainian throughout (labels, validation messages, statuses) — match this when adding user-facing strings.
- Styling is Tailwind CSS utility classes inline in JSX; no CSS modules or styled-components. Icons come from `lucide-react` per the `.bolt/prompt` project convention (don't introduce another icon library).
