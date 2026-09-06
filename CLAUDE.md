# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend-only React/TypeScript SPA for **hirnix**, a multi-tenant barbershop booking and CRM system. Built with Vite. There is no backend code in this repo — it's a pure API client expecting a separate backend service (see "Backend API" below).

## Commands

```
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # eslint over the whole repo
npm run preview   # preview a production build locally
```

There is no test runner configured in this project (no Jest/Vitest setup, no test scripts).

## Backend API

- The app talks to a REST API at `VITE_API_URL` (env var), defaulting to `http://localhost:5000/api` — see `src/api/index.ts`.
- Salon auth uses a bearer token stored in `localStorage` under `token`, attached to every request via an axios request interceptor (`src/api/index.ts`).
- Multi-tenant: the same interceptor prefixes most request URLs with `/{salonSlug}` from `localStorage` (`src/utils/tenant.ts`). Tenant-less prefixes: `/salons/register`, `/salons/invitations`. On `TENANT_MISMATCH` or 401 (except login), the client clears session state and redirects to `/login`.
- `src/api/index.ts` exports typed resource clients (`salonApi`, `authApi`, `clientApi`, `employeeApi`, `appointmentApi`, `serviceApi`, `categoryApi`, `notificationApi`, `reviewApi`) plus the shared default `api` instance. Pages such as `BookingPage` and `Settings` call `api` directly for endpoints not wrapped by those clients (`/auth`, `/booking/*`, `/settings`).
- Platform admin uses a **separate** axios instance in `src/api/platformApi.ts` (base `${API_BASE_URL}/platform`, token key `platformToken`) so tenant interceptors and salon login never mix with platform sessions.
- Request/response shapes live in `src/api/types.ts`.

## Architecture

- **Providers** (`src/App.tsx`): `ThemeProvider` → `LocaleProvider` → `AuthProvider` → `PlatformAuthProvider`. Route pages are lazy-loaded behind `Suspense` + `PageLoader`.
- **Routing** (`src/App.tsx`): public routes include `/login`, `/login/:salonSlug`, `/forgot-password/:salonSlug`, `/reset-password/:salonSlug/:token`, `/register-salon`, `/platform-admin`, `/book`, `/book/:salonSlug`. Authenticated CRM routes nest under `ProtectedRoute` + `Layout`.
- **Salon auth** (`src/context/AuthContext.tsx`): provides `user`, `token`, `salonSlug`, `login`, `registerSalon`, `forgotPassword`, `resetPassword`, `logout`, `loading`. On mount it requires both a stored token and salon slug, then validates against `GET /auth/me`. Users have a `role` of `admin`, `barber`, or `client`.
- **Platform auth** (`src/context/PlatformAuthContext.tsx`): independent of salon auth; stores `platformToken` / `platformAdmin` in `localStorage`. Used by `/platform-admin`.
- **Route guarding** (`src/components/ProtectedRoute.tsx`): redirects to `/login` if unauthenticated, or to `/` if the user's role isn't in the route's `allowedRoles`. Role gating is also duplicated in `src/components/Sidebar.tsx` to decide which nav items to show — keep both in sync when changing role access.
- **Layout** (`src/components/Layout.tsx` + `Sidebar.tsx` + `Header.tsx`): sidebar navigation (collapsible on mobile) wrapping an `<Outlet />` for authenticated CRM pages (Dashboard, Clients, ClientDetails, Appointments, Employees, Services, Reports, Settings, OnboardingGuide).
- **Public booking flow** (`src/pages/BookingPage.tsx`): a standalone 5-step wizard (service → employee → date/time → contact info → confirmation) at `/book` and `/book/:salonSlug`, outside the authenticated shell. It defines its own lightweight `Service`/`Employee` interfaces rather than reusing `src/api/types.ts`. Booking copy uses `src/i18n/bookingTranslations.ts` (uk/en/cs/pl).
- **i18n**: CRM UI uses `LocaleContext` + `src/i18n/translations.ts` (`uk` | `en`). Prefer `t('…')` / booking helpers for user-facing strings — do not hardcode copy in one language only.
- **Theme** (`src/context/ThemeContext.tsx`): class-based dark mode (`dark` on `<html>`); toggle via `ThemeToggle`.
- **Dashboard widgets**: `src/components/dashboard/MetricCard.tsx` is the presentational metric card used by `src/pages/Dashboard.tsx`.
- Styling is Tailwind CSS utility classes inline in JSX; no CSS modules or styled-components. Icons come from `lucide-react` (don't introduce another icon library).
