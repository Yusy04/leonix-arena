# Leonix Arena — Authentication & Roles — Design

**Date:** 2026-08-21
**Status:** Approved
**Phase:** First backend sub-project. Follow-up sub-project (helper/admin **problem
authoring** CRUD + admin user-management UI) gets its own spec once this lands.

## Goal

Replace the mock "always logged in" front-end with **real authentication**:
functional register and login, a three-role model (`student` / `helper` /
`admin`), server-side sessions, and persisted users — all in the existing
full-stack Next.js app. The role *capabilities* (helpers/admins authoring
problems) are out of scope here; this pass establishes that auth works and roles
exist and are enforced at the routing layer.

## Locked decisions (from brainstorming)

- **Architecture:** full-stack Next.js (App Router) with server-side auth. The
  deployed app moves off static export to a Node host (**Vercel**). The existing
  GitHub Pages site stays as a static, auth-less demo (or retires); Vercel becomes
  the primary deployment.
- **Methods:** email + password only. The Google/GitHub buttons remain visible
  but inert ("coming soon"); real OAuth is a later task.
- **Database:** Postgres + Prisma, prod-parity (same engine locally and in prod).
- **Sessions:** lightweight custom sessions — `bcrypt` password hashing, opaque
  random token in a `Session` table, `httpOnly` `Secure` `SameSite=Lax` cookie.
  No auth library.
- **Roles:** everyone registers `STUDENT`. A seeded bootstrap `ADMIN` (env email).
  Role-promotion UI deferred to the next phase.
- **Registration:** keep the 3-step wizard; persist name/email/password + goals +
  preferred language; auto-generate a unique handle (no new form field).
- **Route protection (model A):** public browsing; login required only for
  personal/action pages.
- **This pass is local-first:** fully working on `localhost` against a Neon (or
  Docker) Postgres. Vercel deployment is a documented follow-up needing the
  user's Vercel + Neon accounts.
- **Tests:** introduce **Vitest** for the pure auth logic + the register/login
  handlers (the repo has no test runner today).

## Non-Goals

- OAuth / social login (buttons stay inert).
- Problem authoring, editing, deleting (next phase).
- Admin user-management / role-promotion UI (next phase).
- Password reset email flow, email verification, rate limiting, 2FA (note as
  future; out of scope now).
- Migrating the mock app data (problems/submissions/leaderboard) to the DB — only
  users/roles/sessions are real this phase.

## Architecture

Next.js **Route Handlers** under `app/api/auth/*` do the auth work; a
`middleware.ts` guards protected routes; server components read the session via a
shared helper. Prisma talks to Postgres.

### Known temporary seam
Problems/submissions/leaderboard remain mock. The **logged-in identity** (real
name/email/handle/role) drives the **nav + account menu**, while mock pages keep
showing sample data (the "you" in mock submissions stays `alexp`). This seam
closes when app data becomes real in a later phase. Accepted.

## File structure

| File | Responsibility |
| ---- | -------------- |
| `prisma/schema.prisma` (new) | `User`, `Session`, `Role` enum. |
| `prisma/seed.ts` (new) | Promote `ADMIN_EMAIL` to admin; optional demo helper/student. |
| `lib/db.ts` (new) | Prisma client singleton (HMR-safe). |
| `lib/auth/password.ts` (new) | `hashPassword`, `verifyPassword` (bcrypt). |
| `lib/auth/handle.ts` (new) | `generateHandle(name, email)` → slug; `uniqueHandle()` de-dupes against DB. |
| `lib/auth/session.ts` (new) | `createSession`, `destroySession`, cookie read/write, `getCurrentUser()`. |
| `lib/auth/validation.ts` (new) | `validateRegister`, `validateLogin` → field errors. |
| `app/api/auth/register/route.ts` (new) | POST: validate → create user + session. |
| `app/api/auth/login/route.ts` (new) | POST: verify → create session. |
| `app/api/auth/logout/route.ts` (new) | POST: destroy session + clear cookie. |
| `app/api/auth/me/route.ts` (new) | GET: current user or `null`. |
| `middleware.ts` (new) | Redirect unauthenticated users away from protected paths. |
| `lib/types.ts` (modify) | Add `Role`; extend the shared user shape with `role`. |
| `components/providers/AppProvider.tsx` (modify) | Hold the real session user; add `logout()`; replace mock `login()`. |
| `components/pages/Auth.tsx` (modify) | Wire Login + Register wizard to the API; add inline error UI. |
| `components/nav/index.tsx` (modify) | "Sign out" → logout; show role; signed-in/out states already exist. |
| `app/(main)/layout.tsx` (modify) | Read session server-side, pass user to `AppProvider`. |
| `.env.example` (new), `.gitignore` (modify) | Env template; ignore `.env`. |
| `package.json` (modify) | Deps (`@prisma/client`, `prisma`, `bcryptjs`, `vitest`, …); scripts (`db:migrate`, `db:seed`, `test`). |
| `vitest.config.ts` (new) | Test runner config. |

## Data model (Prisma)

```prisma
enum Role { STUDENT HELPER ADMIN }

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  handle       String    @unique
  name         String
  passwordHash String
  role         Role      @default(STUDENT)
  goals        String[]  @default([])
  language     String?
  createdAt    DateTime  @default(now())
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

Email and handle are stored lowercased/normalized for case-insensitive
uniqueness.

## Auth flows

### Register — `POST /api/auth/register`
Body `{ name, email, password, goals: string[], language?: string }`.
1. `validateRegister` → 400 `{ errors: {field: msg} }` on failure (email format,
   password ≥ 8 chars, name non-empty).
2. Reject if email already exists (409 / field error).
3. `uniqueHandle(name, email)` — slugify name (fallback to email local-part),
   strip to `[a-z0-9]`, append `-2`, `-3`, … until unused.
4. `hashPassword`; create `User` with `role = STUDENT`.
5. `createSession(userId)` → set cookie.
6. Return `{ user }` (no `passwordHash`). Client redirects to `/dashboard`.

Client: the wizard collects all three steps in local state and submits once on
**Finish setup** (not on step transitions).

### Login — `POST /api/auth/login`
Body `{ email, password }`. Look up by normalized email; `verifyPassword`; on
success `createSession` + cookie, return `{ user }`; on failure return 401 with a
generic "Invalid email or password" (no user-enumeration).

### Logout — `POST /api/auth/logout`
Read cookie → `destroySession(token)` (delete row) → clear cookie. Wired to the
nav "Sign out".

### Session read — `getCurrentUser()` + `GET /api/auth/me`
`getCurrentUser()` (server) reads the cookie, looks up a non-expired session,
returns the user or `null`. `/api/auth/me` exposes it to the client if needed.
The `(main)` layout calls `getCurrentUser()` and passes the user into
`AppProvider`.

### Sessions
Token: 32+ bytes from `crypto.randomBytes`, base64url. `expiresAt` = now + 30
days; sliding refresh out of scope (fixed expiry). Cookie name `leonix_session`,
`httpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`.

## Route protection (`middleware.ts`)

Protected prefixes → redirect to `/login?next=<path>` when no valid session
cookie: `/dashboard`, `/notifications`, `/settings`, `/qr`. Everything else is
public (home, `/archive`, `/problem*`, `/leaderboard`, `/u/*`, `/search`,
`/login`, `/register`). Middleware does a *cheap* cookie-presence check;
authoritative validation happens server-side in `getCurrentUser()`. After login,
honor `?next=` if present, else `/dashboard`.

## Provider & UI integration

- `lib/types.ts`: add `Role`; the shared user shape gains `role` and the real
  identity fields. Mock-only stats (level/xp/streak) remain as placeholders this
  phase.
- `AppProvider`: initialized with the real user from the layout (or `null`).
  `login()` (mock) removed; add `logout()` that calls `/api/auth/logout` and
  refreshes. The nav account menu shows real name/email and role; signed-out
  visitors see Sign in / Get started (already implemented).
- `Auth.tsx`: Login and the wizard call the API via `fetch`; both render inline
  field/form errors returned by the handlers; disable submit while pending.

## Seed / bootstrap admin

`prisma/seed.ts`: upsert the `ADMIN_EMAIL` user (from env) and set `role = ADMIN`
(creating it with `ADMIN_PASSWORD` if absent). Optionally seed a demo `HELPER`
and `STUDENT` for testing. Run via `npm run db:seed`. Documented in the README /
`.env.example`.

## Configuration

`.env` (gitignored) / `.env.example`:
```
DATABASE_URL=postgresql://...
ADMIN_EMAIL=admin@leonix.dev
ADMIN_PASSWORD=change-me
```
Local dev: a free Neon database (connection string) or Docker Postgres. Prisma
migrations via `npm run db:migrate` (`prisma migrate dev`). Prod (Vercel,
follow-up): set env vars, `prisma migrate deploy` in the build.

## Error handling

- Handlers return structured JSON: `400 {errors}` (validation), `401` (bad
  credentials), `409` (email taken), `500` (unexpected, logged). Never leak
  `passwordHash` or whether an email exists (login stays generic).
- Client shows returned messages inline; a catch-all "Something went wrong" for
  network/500.

## Testing (Vitest)

Add Vitest. Unit-test the pure logic against a test DB or mocks:
- `handle.ts` — slugging, de-duplication, fallbacks.
- `validation.ts` — accepts valid input, rejects each bad case.
- `password.ts` — hash≠plaintext, verify true/false.
- `session.ts` — create yields valid lookup; expired/absent → null; destroy
  invalidates.
- Register/login handlers — happy path creates user+session; duplicate email
  rejected; wrong password rejected; `passwordHash` never returned.

Handler/DB-touching tests run against a disposable Postgres schema (or a
transaction rolled back per test). Pure-function tests need no DB.

## Verification

- `npm run typecheck` + `npm run build` clean.
- `npm run test` green.
- Manual: register a new account (becomes student, lands on dashboard, session
  cookie set); log out; log back in; hit `/dashboard` while logged out →
  redirected to `/login?next=/dashboard`; seeded admin logs in and shows `admin`
  role in the account menu; public pages load logged-out.

## Rollout note

Single implementation plan, sequenced: schema + Prisma + db client → auth lib
(password/handle/session/validation) with tests → API route handlers with tests →
middleware + layout/provider/session wiring → Auth.tsx forms + error UI → seed +
`.env.example` + README. Deployment to Vercel is a separate follow-up.
