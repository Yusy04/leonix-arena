# Leonix Arena → Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the CDN/Babel single-page `arena.html` app into a proper Next.js (App Router) + TypeScript project with real URL-based multi-page routing, preserving the exact visual design.

**Architecture:** A client-rendered app inside the Next.js shell. The root layout (server component) loads fonts + global CSS and mounts a client `AppProvider` (holds `user`, `theme`, and a `login()` helper via React context). A `(main)` route group carries the `TopNav`/`Footer` chrome; an `(auth)` route group is chrome-free. Every page/UI component is ported from its `.jsx` source to a `"use client"` TypeScript module with explicit imports/exports, and `navigate(page)` calls become `useRouter().push('/page')`.

**Tech Stack:** Next.js (App Router), React 18, TypeScript, plain global CSS (imported once).

**Verification model:** This is a mechanical UI port with no business logic, so the meaningful gate for each task is **`npx tsc --noEmit` (typecheck) + `next build` (compile)** plus rendering the affected route in the dev server — not unit tests. Every task ends by confirming the build/typecheck is clean and committing.

**Working branch:** `nextjs-migration` (already created). Do all work here.

---

## File Structure (target)

```
leonix-arena/
  app/
    layout.tsx                     # root: fonts, global CSS, AppProvider
    (main)/layout.tsx              # chrome: TopNav + <main> + Footer
    (main)/page.tsx                # Home
    (main)/archive/page.tsx
    (main)/problem/page.tsx
    (main)/dashboard/page.tsx
    (main)/qr/page.tsx
    (main)/buddy/page.tsx
    (main)/leaderboard/page.tsx
    (main)/wallet/page.tsx         # redirect → /dashboard
    (main)/profile/page.tsx        # redirect → /dashboard
    (auth)/layout.tsx              # chrome-free
    (auth)/login/page.tsx
    (auth)/register/page.tsx
  components/
    providers/AppProvider.tsx      # context: user, theme, toggleTheme, login
    ui/index.tsx                   # Icon, HexChip, Avatar, ProgressRing, Modal, EmptyState, Skeleton, CodeBlock, Section
    nav/index.tsx                  # TopNav, CommandPalette, Footer
    pages/Home.tsx                 # Home (+ Hero, ProblemArchive, GetStarted, Community)
    pages/Archive.tsx
    pages/Problem.tsx
    pages/Dashboard.tsx            # Dashboard, QRPage (+ FakeQR)
    pages/Extras.tsx               # Buddy, Leaderboard
    pages/Auth.tsx                 # Login, Register
  lib/
    data.ts                        # formatDate, formatTime, formatDay, dayKey, relativeDay
    types.ts                       # User + shared types
  styles/                          # the 9 CSS files (unchanged)
  public/assets/                   # moved from ./assets
  next.config.ts, tsconfig.json, next-env.d.ts, package.json
```

Old `arena.html` and `app/*.jsx` are deleted in the final task after parity is confirmed.

---

## Task 1: Scaffold the Next.js + TypeScript project in-place

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `.gitignore` (update), `app/layout.tsx`, `app/(main)/layout.tsx`, `app/(main)/page.tsx`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "leonix-arena",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.5.4",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "typescript": "5.6.3",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "@types/node": "22.9.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` written, no error exit.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "app/*.jsx", "arena.html"]
}
```

- [ ] **Step 4: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: Create `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 6: Update `.gitignore`** — append Next.js entries

```
# Next.js
/.next/
/out/
next-env.d.ts
```

- [ ] **Step 7: Create a minimal `app/layout.tsx` (temporary, expanded in Task 3)**

```tsx
export const metadata = {
  title: "leonix arena — competitive programming training",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create a placeholder `app/(main)/page.tsx`**

```tsx
export default function Page() {
  return <div>Leonix Arena — migration in progress</div>;
}
```

- [ ] **Step 9: Verify the dev server boots**

Run: `npm run dev` then in another shell `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`. Stop the dev server afterward.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts .gitignore app/layout.tsx "app/(main)/page.tsx"
git commit -m "chore: scaffold Next.js + TypeScript project"
```

---

## Task 2: Move static assets and CSS into the Next.js project

**Files:**
- Move: `assets/` → `public/assets/`
- Keep: `styles/*.css` in place (imported in Task 3)

- [ ] **Step 1: Move the assets folder**

Run: `mkdir -p public && git mv assets public/assets`
Expected: `public/assets/mascots/*.png` and `public/assets/*.svg` exist.

- [ ] **Step 2: Confirm no source references the old `assets/` path with a leading-relative form that breaks**

Run: `grep -rn "assets/" app/*.jsx styles/*.css | head`
Expected: note every hit — in Task 8 these become `/assets/...` (absolute) for `.jsx`; CSS `url(...)` paths that reference `../assets` or `assets/` must become `/assets/...`. Fix CSS references now:

Run: `grep -rn "url(" styles/*.css | grep -i asset`
For each hit, edit the path to start with `/assets/` (e.g. `url(../assets/x.png)` → `url(/assets/x.png)`). If there are no hits, nothing to change.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: move assets to public/ and fix CSS asset URLs"
```

---

## Task 3: Global CSS + fonts in the root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx` with the full root layout**

```tsx
import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/components.css";
import "../styles/nav.css";
import "../styles/pages-home.css";
import "../styles/pages-archive.css";
import "../styles/pages-problem.css";
import "../styles/pages.css";
import "../styles/theme-light.css";
import { AppProvider } from "@/components/providers/AppProvider";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-google",
});

export const metadata: Metadata = {
  title: "leonix arena — competitive programming training",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${mono.variable}`}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

Note: the CSS import order matches the `<link>` order in `arena.html`. `AppProvider` is created in Task 4 — this file will not typecheck until then; that is expected and resolved in Task 4.

- [ ] **Step 2: Verify import order matches the original**

Run: `grep -n "styles/" app/layout.tsx`
Expected: order is tokens, base, components, nav, pages-home, pages-archive, pages-problem, pages, theme-light — identical to `arena.html` lines 10–18.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: load global CSS and fonts in root layout"
```

---

## Task 4: AppProvider (shared state via context) + types

**Files:**
- Create: `lib/types.ts`, `components/providers/AppProvider.tsx`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export interface User {
  authed: boolean;
  name: string;
  initial: string;
  email: string;
  hue: number;
  city: string;
  qrCode: string;
  level: number;
  xp: number;
  xpNext: number;
  streak: number;
}

export type Theme = "dark" | "light";
```

- [ ] **Step 2: Create `components/providers/AppProvider.tsx`**

This replaces the `user`/`theme`/`navigate` state that lived in `app.jsx`. `navigate` is gone (components use `useRouter`); `login()` sets `authed` and routes to `/dashboard`.

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, Theme } from "@/lib/types";

const DEFAULT_USER: User = {
  authed: true,
  name: "Alex Popescu",
  initial: "A",
  email: "alex@leonix.dev",
  hue: 145,
  city: "București",
  qrCode: "LNX-Y3K9-77AX",
  level: 7,
  xp: 6420,
  xpNext: 8000,
  streak: 12,
};

interface AppContextValue {
  user: User;
  theme: Theme;
  toggleTheme: () => void;
  login: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [theme, setTheme] = useState<Theme>("dark");

  // Read persisted theme after mount (SSR-safe).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("leonix-theme") as Theme | null;
      if (saved) setTheme(saved);
    } catch {}
  }, []);

  // Apply + persist theme.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("leonix-theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  const login = useCallback(() => {
    setUser((u) => ({ ...u, authed: true }));
    router.push("/dashboard");
  }, [router]);

  return (
    <AppContext.Provider value={{ user, theme, toggleTheme, login }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors (`app/layout.tsx` now resolves `AppProvider`). Components referenced by pages don't exist yet, but nothing imports them at build time until their routes are added — if `tsc` reports errors only in not-yet-created files, that's fine; there should be none at this point.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts components/providers/AppProvider.tsx
git commit -m "feat: add AppProvider context and shared types"
```

---

## Task 5: Port `lib/data.ts` (shared helpers)

**Files:**
- Create: `lib/data.ts` (from `app/data.jsx`)

- [ ] **Step 1: Create `lib/data.ts`** — the helpers, as named exports (drops the `Object.assign(window, ...)` global bridge)

```ts
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", opts || { month: "short", day: "numeric" });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function dayKey(iso: string): string {
  return iso.substring(0, 10);
}

export function relativeDay(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 7 && diff > 0) return formatDate(iso, { weekday: "long" });
  return formatDate(iso, { month: "short", day: "numeric" });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/data.ts
git commit -m "feat: port shared date helpers to lib/data.ts"
```

---

## Task 6: Port UI primitives → `components/ui/index.tsx`

**Files:**
- Create: `components/ui/index.tsx` (from `app/ui.jsx`)

The file has 9 components: `Icon, HexChip, Avatar, ProgressRing, Modal, EmptyState, Skeleton, CodeBlock, Section`. It uses `document.body` and `window.addEventListener/removeEventListener` inside effects → needs `"use client"`.

- [ ] **Step 1: Create `components/ui/index.tsx` by porting `app/ui.jsx`**

Apply this exact recipe to the contents of `app/ui.jsx`:

1. Add `"use client";` as the first line.
2. Delete the header line `/* global React */` and the line `const { useState, useEffect, useRef, ... } = React;`. Replace with a React import listing exactly the hooks the file uses, e.g.:
   ```ts
   import { useState, useEffect, useRef } from "react";
   ```
   (Include only hooks actually referenced — check with `grep -oE "use[A-Z][a-zA-Z]+" app/ui.jsx | sort -u`.)
3. Add `export` before each `function Icon`, `function HexChip`, `function Avatar`, `function ProgressRing`, `function Modal`, `function EmptyState`, `function Skeleton`, `function CodeBlock`, `function Section`.
4. Add prop types: give each component a typed props parameter. For components with no props use `()`. Example signatures (match the existing destructured params in the source):
   ```ts
   export function Icon({ name, size = 16, stroke = 1.6, className }: { name: string; size?: number; stroke?: number; className?: string }) { /* ...body unchanged... */ }
   export function HexChip({ value, unit, size = "md" }: { value: React.ReactNode; unit?: string; size?: "sm" | "md" | "lg" }) { /* ... */ }
   export function Avatar({ initial, hue = 145, size = "md", src }: { initial?: string; hue?: number; size?: "sm" | "md" | "lg"; src?: string }) { /* ... */ }
   export function ProgressRing({ percent = 0, size = 56, label }: { percent?: number; size?: number; label?: React.ReactNode }) { /* ... */ }
   export function Modal({ open, onClose, children, size }: { open: boolean; onClose: () => void; children: React.ReactNode; size?: string }) { /* ... */ }
   export function EmptyState({ glyph = "∅", title, description, action }: { glyph?: string; title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) { /* ... */ }
   export function Skeleton({ w = "100%", h = 16, r = 6, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) { /* ... */ }
   export function CodeBlock({ lines }: { lines: string[] }) { /* ... */ }
   export function Section({ eyebrow, title, action, children, id }: { eyebrow?: React.ReactNode; title?: React.ReactNode; action?: React.ReactNode; children?: React.ReactNode; id?: string }) { /* ... */ }
   ```
   Keep every function body exactly as in the source. If a body accesses a `src` image path like `assets/...`, change it to `/assets/...`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors in `components/ui/index.tsx`. If a prop type is too strict for an actual call site, widen it (e.g. `React.ReactNode`) rather than changing call sites.

- [ ] **Step 3: Commit**

```bash
git add components/ui/index.tsx
git commit -m "feat: port UI primitives to components/ui"
```

---

## Task 7: Port nav → `components/nav/index.tsx`

**Files:**
- Create: `components/nav/index.tsx` (from `app/nav.jsx`)

Exports `TopNav`, `CommandPalette`, `Footer`. Uses `Icon, Avatar, HexChip` and `window.addEventListener/removeEventListener` → `"use client"`. `TopNav` currently takes `{ route, navigate, user, onOpenSearch, theme, onToggleTheme }`; `Footer` takes `{ navigate }`; `CommandPalette` takes `{ onClose, navigate }`.

- [ ] **Step 1: Create `components/nav/index.tsx` by porting `app/nav.jsx`**

Recipe:
1. First line `"use client";`.
2. Remove `/* global ... */` and the `const { ... } = React;` line; add `import { <hooks used> } from "react";` (check: `grep -oE "use[A-Z][a-zA-Z]+" app/nav.jsx | sort -u`).
3. Add imports:
   ```ts
   import { usePathname, useRouter } from "next/navigation";
   import { Icon, Avatar, HexChip } from "@/components/ui";
   import { useApp } from "@/components/providers/AppProvider";
   ```
4. `export` each of `TopNav`, `CommandPalette`, `Footer`.
5. **Remove navigation/user/theme props** and source them from hooks instead:
   - In each component that used `navigate`, add `const router = useRouter();` and replace every `navigate('home')` with `router.push('/')` and every `navigate('X')` with `router.push('/X')`.
   - In `TopNav`, replace the `{ route, navigate, user, theme, onToggleTheme }` params with `()` and, inside, use:
     ```ts
     const pathname = usePathname();
     const router = useRouter();
     const { user, theme, toggleTheme } = useApp();
     ```
     Anywhere the old code compared `route.page === 'x'` for active-link styling, replace with a pathname check, e.g. `pathname === '/x'` (and `pathname === '/'` for home). Replace `onToggleTheme` calls with `toggleTheme`.
   - In `Footer`, replace `{ navigate }` param with `()` and add `const router = useRouter();`.
   - In `CommandPalette`, keep `{ onClose }` and add `const router = useRouter();`; replace `navigate(...)` accordingly. If a palette entry both navigates and closes, call `router.push(...)` then `onClose()`.
6. Type the remaining props: `TopNav()` (no props), `Footer()` (no props), `CommandPalette({ onClose }: { onClose: () => void })`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/nav/index.tsx
git commit -m "feat: port TopNav, CommandPalette, Footer with router-based nav"
```

---

## Task 8: Port page bodies → `components/pages/*.tsx`

Each sub-step ports one source file using the **standard page recipe**:

> **Standard page recipe**
> 1. First line `"use client";`.
> 2. Remove `/* global ... */` and the `const { ... } = React;` line; add `import { <hooks used> } from "react";` (verify hooks with `grep -oE "use[A-Z][a-zA-Z]+" <src> | sort -u`).
> 3. Add `import { useRouter } from "next/navigation";` if the file calls `navigate`.
> 4. Add UI imports for exactly the primitives the file uses (map below).
> 5. Replace the component's `{ navigate, user }` params: drop `navigate` (use `const router = useRouter();`), and where `user` is used add `const { user } = useApp();` with `import { useApp } from "@/components/providers/AppProvider";`.
> 6. Replace every `navigate('home')` → `router.push('/')`, `navigate('X')` → `router.push('/X')`.
> 7. Change any `assets/...` string to `/assets/...`.
> 8. `export` the page component(s); keep internal helper components un-exported.
> 9. Add light prop types to any internal helper components that take props (use `React.ReactNode` / primitive types; widen rather than fight call sites).

UI-import map (from analysis):
- `Home.tsx`: `Avatar, Icon, Section`
- `Archive.tsx`: `Icon`
- `Problem.tsx`: `Icon`
- `Dashboard.tsx`: `Avatar, HexChip, Icon, ProgressRing, Section`
- `Extras.tsx`: `Avatar, HexChip, Icon, ProgressRing, Section`
- `Auth.tsx`: `Icon`

**Files:**
- Create: `components/pages/Home.tsx`, `Archive.tsx`, `Problem.tsx`, `Dashboard.tsx`, `Extras.tsx`, `Auth.tsx`

- [ ] **Step 1: Port `app/page-home.jsx` → `components/pages/Home.tsx`**
  Apply the standard page recipe. UI import: `import { Avatar, Icon, Section } from "@/components/ui";`. Export `Home` (default): `export default function Home(...)`. Keep `Hero`, `ProblemArchive`, `GetStarted`, `Community` internal. `Hero`/`GetStarted`/`Community`/`ProblemArchive` currently take `{ navigate }` — give each `const router = useRouter();` and drop the param, or pass nothing (they're rendered inside `Home`). Simplest: remove their `{ navigate }` param and add `const router = useRouter();` inside each that navigates.
  Typecheck: `npm run typecheck` → clean. Commit: `git add components/pages/Home.tsx && git commit -m "feat: port Home page"`.

- [ ] **Step 2: Port `app/page-archive.jsx` → `components/pages/Archive.tsx`**
  Standard recipe. UI import: `import { Icon } from "@/components/ui";`. Export `Archive` (default). Internal helpers (`CheckBox`, `TreeNodes`, `FlatNodes`, `FilterField`, `DropSearch`, `DropFoot`) stay un-exported — add prop types to each (their params are visible in the source). `Archive` uses `navigate` (rows link to `/problem`) → `router.push('/problem')`.
  Typecheck → clean. Commit: `git commit -am "feat: port Archive page"` (after `git add components/pages/Archive.tsx`).

- [ ] **Step 3: Port `app/page-problem.jsx` → `components/pages/Problem.tsx`**
  Standard recipe. UI import: `import { Icon } from "@/components/ui";`. Uses `window.addEventListener/removeEventListener` (keyboard handlers) inside effects — keep as-is (client component). Export `Problem` (default). Keep the many internal helpers (`CodePane`, `PbEditor`, `PbStatement`, `PbEditorial`, `ScoreBadge`, `OvIcon`, `PbSubmissions`, `SourceModal`, `TestStatus`, `EvalModal`) un-exported; add prop types where they take params (`ScoreBadge({ v })`, `OvIcon({ ov })`, `PbSubmissions({ onSource, onEval })`, `SourceModal({ onClose })`, `TestStatus({ st })`, `EvalModal({ onClose })`). The `PB_*` string/array constants stay as module consts (type them as `string`/`string[]` or let inference handle it).
  Typecheck → clean. Commit: `git add components/pages/Problem.tsx && git commit -m "feat: port Problem page"`.

- [ ] **Step 4: Port `app/page-dashboard.jsx` → `components/pages/Dashboard.tsx`**
  Standard recipe. UI import: `import { Avatar, HexChip, Icon, ProgressRing, Section } from "@/components/ui";`. Export **both** `Dashboard` and `QRPage` (named exports): `export function Dashboard(...)`, `export function QRPage(...)`. Keep `FakeQR` internal with a prop type `{ seed }: { seed: string }`. Both use `const { user } = useApp();`.
  Typecheck → clean. Commit: `git add components/pages/Dashboard.tsx && git commit -m "feat: port Dashboard and QR pages"`.

- [ ] **Step 5: Port `app/page-extras.jsx` → `components/pages/Extras.tsx`**
  Standard recipe. UI import: `import { Avatar, HexChip, Icon, ProgressRing, Section } from "@/components/ui";`. Export **both** `Buddy` and `Leaderboard` (named). **`window.claude` guard:** the `Buddy` `send()` function calls `await window.claude.complete({...})`. `window.claude` does not exist in a standalone app and is not on the `Window` type. Replace the call site so it is TS-safe and degrades gracefully:
  ```ts
  const claude = (window as unknown as { claude?: { complete: (arg: unknown) => Promise<string> } }).claude;
  if (!claude) throw new Error("assistant unavailable");
  const reply = await claude.complete({
    messages: [
      { role: "user", content:
        `You are leonix Arena's AI study buddy for competitive programming. Help the student reason about algorithms and data structures. Be encouraging, concrete, and give hints rather than full solutions unless asked. Reply in 2-4 short paragraphs max. Question: ${text}` }
    ]
  });
  ```
  The existing `try/catch` already appends the fallback assistant message ("I can't reach my brain right now — try again in a moment."), so the page degrades gracefully when `window.claude` is absent. Keep that `catch` block.
  Typecheck → clean. Commit: `git add components/pages/Extras.tsx && git commit -m "feat: port Buddy and Leaderboard pages"`.

- [ ] **Step 6: Port `app/page-auth.jsx` → `components/pages/Auth.tsx`**
  Standard recipe, with an auth-specific change: `Login`/`Register` currently take `{ navigate, onLogin }`. Drop both params. Add `import { useApp } from "@/components/providers/AppProvider";` and `import { useRouter } from "next/navigation";`. Replace `onLogin()` calls with `login()` from `const { login } = useApp();` (this sets `authed` and routes to `/dashboard`). Replace any `navigate('login')`/`navigate('register')` with `router.push('/login')`/`router.push('/register')`, and `navigate('home')` with `router.push('/')`. UI import: `import { Icon } from "@/components/ui";`. Export **both** `Login` and `Register` (named).
  Typecheck → clean. Commit: `git add components/pages/Auth.tsx && git commit -m "feat: port Login and Register pages"`.

---

## Task 9: Wire routes — `(main)` group with chrome

**Files:**
- Create: `app/(main)/layout.tsx`, and page files for each route
- Modify/replace: `app/(main)/page.tsx` (the placeholder from Task 1)

- [ ] **Step 1: Create `app/(main)/layout.tsx`** — the chrome shared by all non-auth pages

```tsx
import { TopNav, Footer } from "@/components/nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root">
      <TopNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/(main)/page.tsx`** (Home)

```tsx
import Home from "@/components/pages/Home";

export default function Page() {
  return <Home />;
}
```

- [ ] **Step 3: Create the remaining `(main)` route files**

`app/(main)/archive/page.tsx`:
```tsx
import Archive from "@/components/pages/Archive";
export default function Page() { return <Archive />; }
```

`app/(main)/problem/page.tsx`:
```tsx
import Problem from "@/components/pages/Problem";
export default function Page() { return <Problem />; }
```

`app/(main)/dashboard/page.tsx`:
```tsx
import { Dashboard } from "@/components/pages/Dashboard";
export default function Page() { return <Dashboard />; }
```

`app/(main)/qr/page.tsx`:
```tsx
import { QRPage } from "@/components/pages/Dashboard";
export default function Page() { return <QRPage />; }
```

`app/(main)/buddy/page.tsx`:
```tsx
import { Buddy } from "@/components/pages/Extras";
export default function Page() { return <Buddy />; }
```

`app/(main)/leaderboard/page.tsx`:
```tsx
import { Leaderboard } from "@/components/pages/Extras";
export default function Page() { return <Leaderboard />; }
```

- [ ] **Step 4: Create the `wallet` and `profile` redirects**

`app/(main)/wallet/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/dashboard"); }
```

`app/(main)/profile/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/dashboard"); }
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add "app/(main)"
git commit -m "feat: wire main routes with nav chrome"
```

---

## Task 10: Wire routes — `(auth)` group (chrome-free)

**Files:**
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`

- [ ] **Step 1: Create `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="app-root" data-screen-label="auth">{children}</main>;
}
```

- [ ] **Step 2: Create `app/(auth)/login/page.tsx`**

```tsx
import { Login } from "@/components/pages/Auth";
export default function Page() { return <Login />; }
```

- [ ] **Step 3: Create `app/(auth)/register/page.tsx`**

```tsx
import { Register } from "@/components/pages/Auth";
export default function Page() { return <Register />; }
```

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: typecheck clean; `next build` completes with a route list including `/`, `/archive`, `/problem`, `/dashboard`, `/qr`, `/buddy`, `/leaderboard`, `/login`, `/register`, `/wallet`, `/profile`.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)"
git commit -m "feat: wire chrome-free auth routes"
```

---

## Task 11: Full build + manual parity walk

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: success, no type errors, all routes listed.

- [ ] **Step 2: Start and smoke-test every route**

Run: `npm run start` (serves on `:3000`), then in another shell:
```bash
for p in "" archive problem dashboard qr buddy leaderboard login register wallet profile; do
  printf "%-12s " "/$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/$p"
done
```
Expected: `200` for all (wallet/profile may show `200`/`307` depending on redirect handling — either is acceptable as long as they land on `/dashboard` in a browser).

- [ ] **Step 3: Manual browser parity check**

Run: `open http://localhost:3000/`
Verify against the original `arena.html` behavior:
- Home renders with hero, fonts, and background grid identical to the CDN version.
- Top nav links move between `/archive`, `/problem`, `/dashboard`, `/leaderboard`, `/buddy` and the URL bar updates.
- Theme toggle flips dark/light and **persists across a full page reload** (localStorage).
- `/login` and `/register` render **without** the TopNav/Footer chrome; submitting login lands on `/dashboard`.
- Buddy page loads; sending a message shows the graceful fallback assistant reply (since `window.claude` is absent) rather than crashing.
- Command palette (if triggered by its shortcut) navigates and closes.
Stop the server when done.

- [ ] **Step 4: Fix any parity gaps**

If a route errors or a visual regression appears, diagnose with the dev server (`npm run dev`) and fix in the relevant `components/**` file. Re-run `npm run build` until clean. Commit each fix with a descriptive message.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: parity adjustments after migration walk"
```
(Skip if there were no changes.)

---

## Task 12: Remove the legacy CDN app

**Files:**
- Delete: `arena.html`, `app/ui.jsx`, `app/data.jsx`, `app/nav.jsx`, `app/app.jsx`, `app/page-home.jsx`, `app/page-archive.jsx`, `app/page-problem.jsx`, `app/page-dashboard.jsx`, `app/page-extras.jsx`, `app/page-auth.jsx`

- [ ] **Step 1: Confirm nothing imports the legacy files**

Run: `grep -rn "app/ui.jsx\|app/data.jsx\|arena.html\|/app/app.jsx" app components lib next.config.ts 2>/dev/null`
Expected: no results.

- [ ] **Step 2: Delete the legacy source**

Run: `git rm arena.html app/*.jsx`
Expected: all 11 legacy files staged for deletion. (The `app/` directory now contains only the Next.js route files under `(main)`/`(auth)` and `layout.tsx`.)

- [ ] **Step 3: Remove the obsolete tsconfig excludes** (no `.jsx` left to exclude)

Edit `tsconfig.json`: change `"exclude": ["node_modules", "app/*.jsx", "arena.html"]` to `"exclude": ["node_modules"]`.

- [ ] **Step 4: Final build**

Run: `npm run build`
Expected: success, identical route list to Task 10.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove legacy CDN/Babel app (superseded by Next.js)"
```

---

## Task 13: Update README / run notes and finish

**Files:**
- Create or modify: `README.md`

- [ ] **Step 1: Write a short `README.md`**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README for Next.js app"
```

- [ ] **Step 3: (Optional) Merge to main / open PR**

Use the `superpowers:finishing-a-development-branch` skill to decide how to integrate `nextjs-migration` (merge to `main`, push, or open a PR).

---

## Self-Review Notes (author checklist — completed)

- **Spec coverage:** framework (Next.js/TS) ✓ Task 1; routing/route map ✓ Tasks 9–10; providers/state ✓ Task 4; drop Tweaks/postMessage ✓ (never ported — legacy `app.jsx` deleted in Task 12, no Task recreates `TweaksUI`); keep theme toggle ✓ Task 4/7; SSR-safe browser APIs ✓ Task 4 (theme), Task 8 (window.claude guard); CSS as-is ✓ Tasks 2–3; assets → public ✓ Task 2; Node-server deploy ✓ Task 1 scripts + Task 11; in-place migration + delete legacy after parity ✓ Task 12.
- **Placeholder scan:** none — every code step contains concrete content or an exact transformation recipe against a named source file.
- **Type consistency:** `useApp()` returns `{ user, theme, toggleTheme, login }` (Task 4) and is consumed consistently in Tasks 7, 8, 9, 10. Named vs default exports are consistent between the port tasks (Task 8) and the route wrappers (Tasks 9–10): `Home`/`Archive`/`Problem` default; `Dashboard`/`QRPage`/`Buddy`/`Leaderboard`/`Login`/`Register` named.
