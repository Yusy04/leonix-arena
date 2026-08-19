# Leonix Arena

Competitive-programming training UI, built with Next.js (App Router) + TypeScript.

## Develop
    npm install
    npm run dev        # http://localhost:3000

## Build & run
    npm run build
    npm run start

## Structure
- `app/` — routes (App Router). `(main)` = pages with nav chrome, `(auth)` = chrome-free login/register.
- `components/` — `ui/` primitives, `nav/` chrome, `pages/` page bodies, `providers/` shared state.
- `lib/` — helpers and types.
- `styles/` — global CSS (imported once in `app/layout.tsx`).
