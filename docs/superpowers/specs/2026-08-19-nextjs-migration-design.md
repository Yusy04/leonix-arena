# Leonix Arena → Next.js Migration — Design

**Date:** 2026-08-19
**Status:** Approved

## Goal

Transform the current single-page app (everything served through `arena.html`
with in-browser Babel + CDN React and a state-based router) into a proper
**Next.js (App Router) + TypeScript** project with real multi-page, URL-based
routing.

## Current State

- `arena.html` loads React 18 + `@babel/standalone` from a CDN and transpiles
  ten `.jsx` files in the browser via `<script type="text/babel">`.
- All files share globals through `<script>` tags — no module imports/exports.
- Routing is internal React state in `app.jsx`: `{ page, params }` +
  a `navigate(page, params)` function. No real URLs.
- `route.params` is declared but **never read** anywhere — so no dynamic route
  segments are required.
- Browser APIs (`window` / `localStorage` / `document`) are used in 6 files
  (`app.jsx`, `nav.jsx`, `ui.jsx`, `page-extras.jsx`, `page-home.jsx`,
  `page-problem.jsx`).
- Nine global CSS files under `styles/` define the full visual design.
- Static assets (mascots, logos) live under `assets/`.

## Decisions (locked)

- **Framework:** Next.js, App Router.
- **Language:** TypeScript (`.tsx` / `.ts`).
- **Tweaks panel:** DROP the floating "Tweaks" panel, the
  `__activate_edit_mode` / `postMessage` edit protocol, and the `EDITMODE`
  markers in `app.jsx`. KEEP the dark/light theme toggle.
- **Deployment:** Node server — standard `next build` + `next start`
  (no `output: export`).
- **Migration location:** in-place in this repo. Old `arena.html` and
  `app/*.jsx` are removed once parity is confirmed; git history preserves them.

## Architecture & Rendering Model

Nearly every component is interactive (`useState`, `localStorage`,
`postMessage`, DOM APIs), so the app is **client-rendered inside the Next.js
shell**. No SSR data fetching — all data is mock/static.

- **`app/layout.tsx`** — server component. Loads Google Fonts via `next/font`,
  imports the global CSS once, renders `<html>` + `<body>`, and wraps children
  in the client providers + chrome (`TopNav` / `Footer`).
- **`AppProvider`** — a single client component holding the shared state that
  currently lives in `App()`: `user`, `theme` (with `localStorage` persistence
  and `<html data-theme>` application). `navigate(page)` is replaced by Next's
  `useRouter().push('/page')`. State is exposed via React context so any page or
  component can read it.
- **Each route** is a thin `page.tsx` that renders the corresponding page
  component. Interactive components carry `"use client"`.

## Route Map

| URL            | Component   | Source today          |
| -------------- | ----------- | --------------------- |
| `/`            | Home        | `page-home.jsx`       |
| `/archive`     | Archive     | `page-archive.jsx`    |
| `/problem`     | Problem     | `page-problem.jsx`    |
| `/dashboard`   | Dashboard   | `page-dashboard.jsx`  |
| `/qr`          | QRPage      | `page-dashboard.jsx`  |
| `/buddy`       | Buddy       | `page-extras.jsx`     |
| `/leaderboard` | Leaderboard | `page-extras.jsx`     |
| `/login`       | Login       | `page-auth.jsx`       |
| `/register`    | Register    | `page-auth.jsx`       |

- `wallet` and `profile` (aliased to Dashboard today) → redirect routes to
  `/dashboard`.
- `/login` and `/register` render **without** TopNav/Footer chrome, via an
  `(auth)` route group with its own minimal layout — replacing the old
  `noChrome` check.

## Proposed File Structure

```
leonix-arena/
  app/
    layout.tsx            # root: fonts, global CSS, providers, chrome
    page.tsx              # Home
    archive/page.tsx
    problem/page.tsx
    dashboard/page.tsx
    qr/page.tsx
    buddy/page.tsx
    leaderboard/page.tsx
    (auth)/layout.tsx     # chrome-free layout
    (auth)/login/page.tsx
    (auth)/register/page.tsx
  components/
    ui/                   # Icon, HexChip, Avatar, ProgressRing, Modal, ... (ui.jsx)
    nav/                  # TopNav, CommandPalette, Footer (nav.jsx)
    pages/                # Home, Archive, Problem, Dashboard, Buddy, ... (page bodies)
    providers/AppProvider.tsx
  lib/
    data.ts               # helpers from data.jsx (formatDate, etc.)
    types.ts              # shared TS types (User, page props, data shapes)
  public/
    assets/               # moved from ./assets (mascots, logos)
  styles/                 # the 9 CSS files, imported once in layout
  next.config.ts, tsconfig.json, package.json
```

## Conversion Mechanics

- **Modules:** replace shared-global `<script>` loading with explicit
  `import` / `export` per component. `navigate('x')` → `router.push('/x')`, or a
  `<Link href="/x">` where the element is a plain navigation control.
- **TypeScript:** add prop types plus a `User` / data-model types file. Type
  public component props; internal mock-data arrays may be inferred or lightly
  typed. Target is a clean compiling build, not zero-`any` on day one.
- **Drop:** `TweaksUI`, the `__activate_edit_mode` / `postMessage` protocol, and
  the `EDITMODE` markers. **Keep** the dark/light theme toggle.
- **SSR safety:** guard `localStorage` / `window` / `document` reads (initialize
  inside `useEffect`) so the Node server build does not crash during render.
- **CSS:** kept as-is (global imports in the root layout) so the visual design
  is preserved pixel-for-pixel. Asset URLs change from `assets/...` →
  `/assets/...`.

## Verification

- `npm run build` compiles clean (TypeScript + Next) and `npm run start` serves
  the app.
- Manually walk every route, the theme toggle, and cross-page navigation to
  confirm parity with the current `arena.html`.
- Remove the old `arena.html` and `app/*.jsx` only after parity is confirmed.

## Out of Scope

- No visual redesign — pixel parity with the current UI.
- No real backend / data fetching — mock data stays.
- No new features beyond the routing/build transformation.
