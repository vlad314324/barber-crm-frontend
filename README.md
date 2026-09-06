# hirnix

Frontend for **hirnix** — a multi-tenant barbershop booking and CRM system. This repo is a React/TypeScript SPA built with Vite. It talks to a separate REST API; there is no backend code here.

## Features

- Public booking wizard (`/book`, `/book/:salonSlug`)
- Salon registration and password reset
- CRM: dashboard, clients, appointments, employees, services, reports, settings, onboarding
- Role-based access (`admin`, `barber`)
- Platform admin (`/platform-admin`)
- i18n — CRM: Ukrainian / English; booking also Czech / Polish
- Dark / light theme

## Tech stack

- React 18, TypeScript, Vite 5
- React Router 6, Axios, Tailwind CSS 3, lucide-react
- react-hook-form, date-fns, TanStack Table
- Leaflet / react-leaflet, qrcode.react, react-phone-number-input
- Vercel Analytics & Speed Insights

## Prerequisites

- Node.js (modern LTS) and npm
- A running backend API reachable at the URL configured in env (see below)

## Getting started

```bash
npm install
cp .env.example .env
# edit VITE_API_URL if needed
npm run dev
```

The Vite dev server will start and serve the app locally.

## Environment

Copy [`.env.example`](.env.example) to `.env` (local) or `.env.production` (production builds):

| Variable        | Description                                      | Default                     |
|-----------------|--------------------------------------------------|-----------------------------|
| `VITE_API_URL`  | Backend API base URL, including the `/api` prefix | `http://localhost:5000/api` |

If `VITE_API_URL` is unset, the app falls back to `http://localhost:5000/api`.

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Production build                     |
| `npm run lint`    | Run ESLint across the repo           |
| `npm run preview` | Preview a production build locally   |

## Project structure

```
src/
├── api/           # Axios client, resource APIs, types, platform API
├── components/    # Layout, shared UI, dashboard & platform widgets
├── config/        # App config (e.g. onboarding steps)
├── constants/     # Currencies, timezones
├── context/       # Auth, platform auth, theme, settings
├── i18n/          # Translations (CRM + booking)
├── pages/         # Route pages
└── utils/         # Helpers (tenant slug, money, errors, etc.)
```

Key entry points: `src/main.tsx`, `src/App.tsx`.

## Multi-tenant routing

Salon context is stored as a slug in `localStorage`. The shared Axios instance prefixes most API requests with `/{salonSlug}` (see `src/utils/tenant.ts` and `src/api/index.ts`). A few endpoints (salon registration, invitations) are tenant-less.

## Deploy

`npm run build` outputs a static site to `dist/`. [`vercel.json`](vercel.json) rewrites all routes to `index.html` so client-side routing works on Vercel.
