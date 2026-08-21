# Leonix Arena

Competitive-programming training UI, built with Next.js (App Router) + TypeScript.

## Develop
    npm install
    npm run dev        # http://localhost:3000

## Build & run
    npm run build
    npm run start

## Structure
- `app/` — routes (App Router). `(main)` = pages with nav chrome, `(auth)` = chrome-free login/register. `app/api/auth/` = auth endpoints.
- `components/` — `ui/` primitives, `nav/` chrome, `pages/` page bodies, `providers/` shared state.
- `lib/` — helpers, types, and `lib/auth/` (password/handle/validation/session).
- `styles/` — global CSS (imported once in `app/layout.tsx`).
- `prisma/` — schema, migrations, seed.

## Backend & Auth (local)

1. `npm install`
2. `npm run db:up` — start local Postgres (Docker, host port 5433). Or set `DATABASE_URL` to a Neon URL in `.env` (copy `.env.example`).
3. `npm run db:migrate` — apply the schema.
4. `npm run db:seed` — create the bootstrap admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) plus demo `helper@leonix.dev` / `student@leonix.dev` (passwords `helper12345` / `student12345`).
5. `npm run dev` — register at `/register`, or sign in with a seeded account.

Roles: everyone registers as `STUDENT`; `npm run db:seed` promotes `ADMIN_EMAIL` to `ADMIN`.
Protected routes (`/dashboard`, `/notifications`, `/settings`, `/qr`) redirect to `/login` when signed out.

Tests: `npm run test` (needs the DB running; uses the `leonix_test` database).

> Note: real auth requires a Node server, so the app is deployed to a Node host (e.g. Vercel), not static GitHub Pages.
