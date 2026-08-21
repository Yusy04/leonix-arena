# Authentication & Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real email/password authentication with student/helper/admin roles, server-side sessions, and persisted users, in the full-stack Next.js app.

**Architecture:** Next.js Route Handlers under `app/api/auth/*` back a lightweight custom session (bcrypt hashes + opaque token in a `Session` table + httpOnly cookie). Prisma talks to Postgres. `middleware.ts` guards personal routes; the root layout reads the session server-side and hands the user to `AppProvider`. Pure auth logic and the handlers are covered by Vitest.

**Tech Stack:** Next.js 15 (App Router, server-rendered), Prisma + Postgres, bcryptjs, Vitest, Docker Postgres (local) / Neon (prod).

**Spec:** `docs/superpowers/specs/2026-08-21-auth-and-roles-design.md`.

**⚠️ Deployment change:** server API routes cannot be statically exported, so this plan **retires the GitHub Pages static export** (Task 1) — the app becomes a normal server app for Vercel.

---

## File Structure

| File | Responsibility |
| ---- | -------------- |
| `next.config.ts` (modify) | Revert to a plain server config (drop `output:export`/basePath). |
| `.github/workflows/deploy-pages.yml` (delete) | Retire static Pages deploy. |
| `docker-compose.yml`, `docker/init-test-db.sql` (new) | Local Postgres + a `leonix_test` database. |
| `.env`, `.env.test` (new, gitignored), `.env.example` (new) | DB URL + admin bootstrap vars. |
| `prisma/schema.prisma` (new) | `User`, `Session`, `Role`. |
| `prisma/seed.ts` (new) | Promote `ADMIN_EMAIL` to admin; demo helper/student. |
| `lib/db.ts` (new) | Prisma client singleton. |
| `lib/auth/password.ts` (new) | `hashPassword`, `verifyPassword`. |
| `lib/auth/handle.ts` (new) | `generateHandle` (pure) + `uniqueHandle` (DB). |
| `lib/auth/validation.ts` (new) | `validateRegister`, `validateLogin`. |
| `lib/auth/user.ts` (new) | `toPublicUser`, `toAuthUser`. |
| `lib/auth/session.ts` (new) | token + session record CRUD + cookie helpers + `getCurrentUser`. |
| `app/api/auth/{register,login,logout,me}/route.ts` (new) | The four endpoints. |
| `middleware.ts` (new) | Redirect unauthenticated users from protected paths. |
| `lib/types.ts` (modify) | Add `Role`, `AuthUser`. |
| `components/providers/AppProvider.tsx` (modify) | Hold real user from session; add `logout()`. |
| `app/layout.tsx` (modify) | Read session, pass user to `AppProvider`. |
| `components/pages/Auth.tsx` (modify) | Wire Login + Register to the API + error UI. |
| `components/nav/index.tsx` (modify) | "Sign out" → `logout()`; show role. |
| `vitest.config.ts`, `vitest.setup.ts`, `vitest.global-setup.ts` (new) | Test runner + test-DB lifecycle. |
| `package.json` (modify) | Deps + scripts. |

---

## Task 1: Retire static export, add tooling & DB

**Files:** `next.config.ts`, delete `.github/workflows/deploy-pages.yml`, `docker-compose.yml`, `docker/init-test-db.sql`, `.env`, `.env.test`, `.env.example`, `.gitignore`, `package.json`, `vitest.config.ts`, `vitest.setup.ts`, `vitest.global-setup.ts`

- [ ] **Step 1: Revert `next.config.ts` to a plain server config**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 2: Delete the Pages workflow**

```bash
git rm .github/workflows/deploy-pages.yml
```

- [ ] **Step 3: Install dependencies**

```bash
npm install @prisma/client bcryptjs
npm install -D prisma @types/bcryptjs vitest vite-tsconfig-paths dotenv tsx
```

- [ ] **Step 4: Add scripts + the Prisma seed hook to `package.json`**

Merge these into `package.json` (`scripts` block and a top-level `prisma` block):

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:up": "docker compose up -d",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

- [ ] **Step 5: Create `docker-compose.yml` and `docker/init-test-db.sql`**

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: leonix
      POSTGRES_PASSWORD: leonix
      POSTGRES_DB: leonix
    ports:
      - "5432:5432"
    volumes:
      - leonix_pg:/var/lib/postgresql/data
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql
volumes:
  leonix_pg:
```

`docker/init-test-db.sql`:

```sql
CREATE DATABASE leonix_test;
```

- [ ] **Step 6: Create env files and update `.gitignore`**

`.env`:

```
DATABASE_URL="postgresql://leonix:leonix@localhost:5432/leonix?schema=public"
ADMIN_EMAIL="admin@leonix.dev"
ADMIN_PASSWORD="admin12345"
```

`.env.test`:

```
DATABASE_URL="postgresql://leonix:leonix@localhost:5432/leonix_test?schema=public"
```

`.env.example`:

```
# Postgres connection (local Docker default shown; use your Neon URL in prod)
DATABASE_URL="postgresql://leonix:leonix@localhost:5432/leonix?schema=public"
# Bootstrap admin: `npm run db:seed` promotes this email to ADMIN
ADMIN_EMAIL="admin@leonix.dev"
ADMIN_PASSWORD="admin12345"
```

Append to `.gitignore`:

```
# Env
.env
.env.test
.env*.local
```

- [ ] **Step 7: Create Vitest config + test-DB lifecycle files**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globalSetup: ["./vitest.global-setup.ts"],
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
  },
});
```

`vitest.global-setup.ts` (runs migrations against the test DB once):

```ts
import { execSync } from "node:child_process";
import dotenv from "dotenv";

export default function setup() {
  const env = dotenv.config({ path: ".env.test" }).parsed ?? {};
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
  });
}
```

`vitest.setup.ts` (point each test file at the test DB + clean tables between tests):

```ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true });

import { afterEach } from "vitest";
import { prisma } from "@/lib/db";

afterEach(async () => {
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});
```

- [ ] **Step 8: Start the database**

Run: `npm run db:up`
Expected: container `..._db_1` / `...-db-1` starts; `docker compose ps` shows it healthy/up on port 5432.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore(backend): retire static export; add Prisma/Vitest/Docker tooling"
```

---

## Task 2: Prisma schema, migration, client

**Files:** `prisma/schema.prisma`, `lib/db.ts`

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  HELPER
  ADMIN
}

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

- [ ] **Step 2: Create the migration + generate the client**

Run: `npm run db:migrate -- --name init_auth`
Expected: creates `prisma/migrations/*_init_auth/`, applies it to the dev DB, and generates `@prisma/client`. Output ends with "Your database is now in sync with your schema."

- [ ] **Step 3: Create `lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: clean (the generated client resolves `@prisma/client`).

- [ ] **Step 5: Commit**

```bash
git add prisma lib/db.ts
git commit -m "feat(db): Prisma schema (User/Session/Role) + client singleton"
```

---

## Task 3: Password hashing (TDD, pure)

**Files:** `lib/auth/password.ts`, `lib/auth/password.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/auth/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("hashes to something other than the plaintext", async () => {
    const h = await hashPassword("hunter2pass");
    expect(h).not.toBe("hunter2pass");
    expect(h.length).toBeGreaterThan(20);
  });
  it("verifies the correct password", async () => {
    const h = await hashPassword("hunter2pass");
    expect(await verifyPassword("hunter2pass", h)).toBe(true);
  });
  it("rejects a wrong password", async () => {
    const h = await hashPassword("hunter2pass");
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/password.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/password`.

- [ ] **Step 3: Implement `lib/auth/password.ts`**

```ts
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/auth/password.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/password.ts lib/auth/password.test.ts
git commit -m "feat(auth): password hashing (bcrypt)"
```

---

## Task 4: Handle generation (TDD; pure + DB)

**Files:** `lib/auth/handle.ts`, `lib/auth/handle.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/auth/handle.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateHandle, uniqueHandle } from "@/lib/auth/handle";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

describe("generateHandle (pure)", () => {
  it("slugifies the name", () => {
    expect(generateHandle("Ana Popescu", "ana@example.com")).toBe("anapopescu");
  });
  it("strips accents and punctuation", () => {
    expect(generateHandle("Ștefan O'Neil", "s@x.com")).toBe("stefanoneil");
  });
  it("falls back to the email local-part when name is empty", () => {
    expect(generateHandle("", "cool.coder@x.com")).toBe("coolcoder");
  });
});

describe("uniqueHandle (DB)", () => {
  it("returns the base handle when free", async () => {
    expect(await uniqueHandle("Ana Popescu", "ana@example.com")).toBe("anapopescu");
  });
  it("appends a number when the handle is taken", async () => {
    await prisma.user.create({
      data: { email: "a@x.com", handle: "anapopescu", name: "A", passwordHash: await hashPassword("password123") },
    });
    expect(await uniqueHandle("Ana Popescu", "ana2@example.com")).toBe("anapopescu2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/handle.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/handle`.

- [ ] **Step 3: Implement `lib/auth/handle.ts`**

```ts
import { prisma } from "@/lib/db";

export function generateHandle(name: string, email: string): string {
  const source = (name && name.trim()) || email.split("@")[0] || "user";
  const slug = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return slug || "user";
}

export async function uniqueHandle(name: string, email: string): Promise<string> {
  const base = generateHandle(name, email);
  let candidate = base;
  let n = 2;
  while (await prisma.user.findUnique({ where: { handle: candidate } })) {
    candidate = `${base}${n++}`;
  }
  return candidate;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/auth/handle.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/handle.ts lib/auth/handle.test.ts
git commit -m "feat(auth): unique handle generation"
```

---

## Task 5: Input validation (TDD, pure)

**Files:** `lib/auth/validation.ts`, `lib/auth/validation.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/auth/validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateRegister, validateLogin } from "@/lib/auth/validation";

describe("validateRegister", () => {
  it("accepts valid input (no errors)", () => {
    expect(validateRegister({ name: "Ana", email: "ana@x.com", password: "password123" })).toEqual({});
  });
  it("requires a name", () => {
    expect(validateRegister({ name: "", email: "ana@x.com", password: "password123" }).name).toBeTruthy();
  });
  it("rejects a bad email", () => {
    expect(validateRegister({ name: "Ana", email: "nope", password: "password123" }).email).toBeTruthy();
  });
  it("rejects a short password", () => {
    expect(validateRegister({ name: "Ana", email: "ana@x.com", password: "short" }).password).toBeTruthy();
  });
});

describe("validateLogin", () => {
  it("accepts valid input", () => {
    expect(validateLogin({ email: "ana@x.com", password: "x" })).toEqual({});
  });
  it("rejects a bad email and missing password", () => {
    const e = validateLogin({ email: "nope", password: "" });
    expect(e.email).toBeTruthy();
    expect(e.password).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/validation.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/validation`.

- [ ] **Step 3: Implement `lib/auth/validation.ts`**

```ts
export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(input: { name?: string; email?: string; password?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name || !input.name.trim()) errors.name = "Name is required.";
  if (!input.email || !EMAIL_RE.test(input.email)) errors.email = "Enter a valid email address.";
  if (!input.password || input.password.length < 8) errors.password = "Password must be at least 8 characters.";
  return errors;
}

export function validateLogin(input: { email?: string; password?: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email || !EMAIL_RE.test(input.email)) errors.email = "Enter a valid email address.";
  if (!input.password) errors.password = "Password is required.";
  return errors;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/auth/validation.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/validation.ts lib/auth/validation.test.ts
git commit -m "feat(auth): register/login input validation"
```

---

## Task 6: Sessions + user serialization (TDD; pure + DB)

**Files:** `lib/auth/user.ts`, `lib/auth/session.ts`, `lib/auth/session.test.ts`

- [ ] **Step 1: Create `lib/auth/user.ts`** (serializers, no test needed — trivial)

```ts
import type { User } from "@prisma/client";
import type { AuthUser } from "@/lib/types";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

export function toAuthUser(u: User): AuthUser {
  return { id: u.id, email: u.email, handle: u.handle, name: u.name, role: u.role, goals: u.goals, language: u.language };
}
```

(`AuthUser` is defined in Task 10; this file compiles once Task 10 lands. If implementing strictly in order, do Task 10's `lib/types.ts` edit before this compiles — the session tests below don't import `user.ts`.)

- [ ] **Step 2: Write the failing session test**

`lib/auth/session.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateToken, createSessionRecord, getSessionUser, deleteSessionRecord } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

async function makeUser() {
  return prisma.user.create({
    data: { email: "u@x.com", handle: "u", name: "U", passwordHash: await hashPassword("password123") },
  });
}

describe("generateToken", () => {
  it("returns a long unique token each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});

describe("session records", () => {
  it("creates a session whose token resolves to the user", async () => {
    const user = await makeUser();
    const { token } = await createSessionRecord(user.id);
    const found = await getSessionUser(token);
    expect(found?.id).toBe(user.id);
  });
  it("returns null for an unknown or absent token", async () => {
    expect(await getSessionUser("nope")).toBeNull();
    expect(await getSessionUser(undefined)).toBeNull();
  });
  it("returns null for an expired session", async () => {
    const user = await makeUser();
    const token = generateToken();
    await prisma.session.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() - 1000) } });
    expect(await getSessionUser(token)).toBeNull();
  });
  it("destroy invalidates the token", async () => {
    const user = await makeUser();
    const { token } = await createSessionRecord(user.id);
    await deleteSessionRecord(token);
    expect(await getSessionUser(token)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/auth/session.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/session`.

- [ ] **Step 4: Implement `lib/auth/session.ts`**

```ts
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "leonix_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSessionRecord(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getSessionUser(token: string | undefined | null): Promise<User | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

export async function deleteSessionRecord(token: string | undefined | null): Promise<void> {
  if (token) await prisma.session.deleteMany({ where: { token } });
}

// --- cookie-bound helpers (used by route handlers / server components) ---

export async function startSession(userId: string): Promise<void> {
  const { token, expiresAt } = await createSessionRecord(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSessionUser(token);
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  await deleteSessionRecord(token);
  store.delete(SESSION_COOKIE);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/auth/session.test.ts`
Expected: PASS (5 tests). (The `cookies()`-bound helpers aren't exercised here; they're covered by the handler tests in Tasks 7–8.)

- [ ] **Step 6: Commit**

```bash
git add lib/auth/session.ts lib/auth/user.ts lib/auth/session.test.ts
git commit -m "feat(auth): session records + cookie helpers + user serializers"
```

---

## Task 7: Register handler (TDD; DB + mocked cookies)

**Files:** `app/api/auth/register/route.ts`, `app/api/auth/register/route.test.ts`

- [ ] **Step 1: Write the failing test**

`app/api/auth/register/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory cookie jar so startSession's cookies().set() works outside a request.
vi.mock("next/headers", () => {
  const store = new Map<string, string>();
  return {
    cookies: async () => ({
      get: (k: string) => (store.has(k) ? { value: store.get(k) } : undefined),
      set: (k: string, v: string) => { store.set(k, v); },
      delete: (k: string) => { store.delete(k); },
    }),
  };
});

import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

function post(body: unknown) {
  return POST(new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
}

describe("POST /api/auth/register", () => {
  it("creates a STUDENT with a generated handle and opens a session", async () => {
    const res = await post({ name: "Ana Popescu", email: "Ana@Example.com", password: "password123", goals: ["dp"], language: "C++17" });
    expect(res.status).toBe(201);
    const { user } = await res.json();
    expect(user.role).toBe("STUDENT");
    expect(user.handle).toBe("anapopescu");
    expect(user.email).toBe("ana@example.com");
    expect(user.passwordHash).toBeUndefined();
    const inDb = await prisma.user.findUnique({ where: { email: "ana@example.com" } });
    expect(inDb).not.toBeNull();
    const sessions = await prisma.session.count({ where: { userId: user.id } });
    expect(sessions).toBe(1);
  });

  it("returns 400 with field errors for bad input", async () => {
    const res = await post({ name: "", email: "nope", password: "x" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.name).toBeTruthy();
    expect(body.errors.email).toBeTruthy();
    expect(body.errors.password).toBeTruthy();
  });

  it("returns 409 for a duplicate email", async () => {
    await prisma.user.create({ data: { email: "dup@x.com", handle: "dup", name: "Dup", passwordHash: await hashPassword("password123") } });
    const res = await post({ name: "Dup Two", email: "dup@x.com", password: "password123" });
    expect(res.status).toBe(409);
    expect((await res.json()).errors.email).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/auth/register/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/auth/register/route`.

- [ ] **Step 3: Implement `app/api/auth/register/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateRegister } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { uniqueHandle } from "@/lib/auth/handle";
import { startSession } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password, goals, language } = body ?? {};

  const errors = validateRegister({ name, email, password });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const normEmail = String(email).trim().toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normEmail } })) {
    return NextResponse.json({ errors: { email: "That email is already registered." } }, { status: 409 });
  }

  const handle = await uniqueHandle(String(name), normEmail);
  const passwordHash = await hashPassword(String(password));
  const user = await prisma.user.create({
    data: {
      email: normEmail,
      handle,
      name: String(name).trim(),
      passwordHash,
      goals: Array.isArray(goals) ? goals.map(String) : [],
      language: typeof language === "string" ? language : null,
    },
  });

  await startSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/auth/register/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/register lib/auth/user.ts
git commit -m "feat(auth): POST /api/auth/register"
```

---

## Task 8: Login / logout / me handlers (TDD)

**Files:** `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`, `app/api/auth/login/route.test.ts`

- [ ] **Step 1: Write the failing test**

`app/api/auth/login/route.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => {
  const store = new Map<string, string>();
  return {
    cookies: async () => ({
      get: (k: string) => (store.has(k) ? { value: store.get(k) } : undefined),
      set: (k: string, v: string) => { store.set(k, v); },
      delete: (k: string) => { store.delete(k); },
    }),
  };
});

import { POST } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

async function seedUser() {
  return prisma.user.create({
    data: { email: "log@x.com", handle: "log", name: "Log In", passwordHash: await hashPassword("password123") },
  });
}
function post(body: unknown) {
  return POST(new Request("http://localhost/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  }));
}

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and opens a session", async () => {
    const user = await seedUser();
    const res = await post({ email: "log@x.com", password: "password123" });
    expect(res.status).toBe(200);
    const { user: out } = await res.json();
    expect(out.email).toBe("log@x.com");
    expect(out.passwordHash).toBeUndefined();
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
  });

  it("rejects a wrong password with 401 (generic message)", async () => {
    await seedUser();
    const res = await post({ email: "log@x.com", password: "wrongpass1" });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Invalid email or password.");
  });

  it("rejects an unknown email with 401", async () => {
    const res = await post({ email: "ghost@x.com", password: "password123" });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/auth/login/route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/auth/login/route`.

- [ ] **Step 3: Implement the three handlers**

`app/api/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateLogin } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body ?? {};

  const errors = validateLogin({ email, password });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await startSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
```

`app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth/session";

export async function POST() {
  await endSession();
  return NextResponse.json({ ok: true });
}
```

`app/api/auth/me/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/auth/login/route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm run test`
Expected: all suites pass (password, handle, validation, session, register, login).

- [ ] **Step 6: Commit**

```bash
git add app/api/auth/login app/api/auth/logout app/api/auth/me
git commit -m "feat(auth): login, logout, me handlers"
```

---

## Task 9: Route protection middleware

**Files:** `middleware.ts`

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "leonix_session";
const PROTECTED = ["/dashboard", "/notifications", "/settings", "/qr"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/notifications/:path*", "/settings/:path*", "/qr/:path*"],
};
```

(Cheap cookie-presence check only — the edge runtime can't use Prisma. Authoritative validation happens in `getCurrentUser()` server-side.)

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: compiles; the build summary lists `ƒ Middleware`.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): middleware route protection for personal pages"
```

---

## Task 10: Types + provider + layout wiring

**Files:** `lib/types.ts`, `components/providers/AppProvider.tsx`, `app/layout.tsx`

- [ ] **Step 1: Add auth types to `lib/types.ts`**

Append:

```ts
export type Role = "STUDENT" | "HELPER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  name: string;
  role: Role;
  goals: string[];
  language: string | null;
}
```

- [ ] **Step 2: Rewrite `components/providers/AppProvider.tsx`**

The provider now takes the real session user as a prop and derives the mock-app `user` shape from it (real identity + placeholder mock stats). It exposes `authUser`, `role`, `authed`, and `logout()`; the mock `login()` is removed.

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User, Theme, Notification, AuthUser, Role } from "@/lib/types";
import { NOTIFICATIONS, CURRENT_HANDLE } from "@/lib/mock";

// Placeholder mock stats layered under the real identity until app data is real.
const MOCK_STATS = { hue: 145, city: "București", qrCode: "LNX-Y3K9-77AX", level: 7, xp: 6420, xpNext: 8000, streak: 12 };

function toMockUser(authUser: AuthUser | null): User {
  if (!authUser) {
    return { authed: false, name: "Guest", initial: "G", email: "", ...MOCK_STATS };
  }
  return {
    authed: true,
    name: authUser.name,
    initial: authUser.name.charAt(0).toUpperCase(),
    email: authUser.email,
    ...MOCK_STATS,
  };
}

export type CardStyle = "glass" | "solid" | "outlined";
export type RadiusStyle = "sharp" | "rounded" | "pill";
export interface Appearance { theme: Theme; card: CardStyle; radius: RadiusStyle; }

interface AppContextValue {
  user: User;
  authUser: AuthUser | null;
  role: Role | null;
  currentHandle: string;
  theme: Theme;
  toggleTheme: () => void;
  appearance: Appearance;
  setAppearance: (patch: Partial<Appearance>) => void;
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ initialUser, children }: { initialUser: AuthUser | null; children: React.ReactNode }) {
  const router = useRouter();
  const [authUser] = useState<AuthUser | null>(initialUser);
  const [appearance, setAppearanceState] = useState<Appearance>({ theme: "dark", card: "glass", radius: "rounded" });
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("leonix-theme") as Theme | null;
      const savedCard = localStorage.getItem("leonix-card") as CardStyle | null;
      const savedRadius = localStorage.getItem("leonix-radius") as RadiusStyle | null;
      setAppearanceState(a => ({ theme: savedTheme ?? a.theme, card: savedCard ?? a.card, radius: savedRadius ?? a.radius }));
    } catch {}
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = appearance.theme;
    el.dataset.card = appearance.card;
    el.dataset.radius = appearance.radius;
    try {
      localStorage.setItem("leonix-theme", appearance.theme);
      localStorage.setItem("leonix-card", appearance.card);
      localStorage.setItem("leonix-radius", appearance.radius);
    } catch {}
  }, [appearance]);

  const setAppearance = useCallback((patch: Partial<Appearance>) => setAppearanceState(a => ({ ...a, ...patch })), []);
  const toggleTheme = useCallback(() => setAppearanceState(a => ({ ...a, theme: a.theme === "light" ? "dark" : "light" })), []);
  const markRead = useCallback((id: string) => setNotifications(ns => ns.map(n => (n.id === id ? { ...n, read: true } : n))), []);
  const markAllRead = useCallback(() => setNotifications(ns => ns.map(n => ({ ...n, read: true }))), []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      user: toMockUser(authUser),
      authUser,
      role: authUser?.role ?? null,
      currentHandle: CURRENT_HANDLE,
      theme: appearance.theme, toggleTheme,
      appearance, setAppearance,
      notifications, unreadCount, markRead, markAllRead,
      logout,
    }}>
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

- [ ] **Step 3: Make `app/layout.tsx` read the session and pass the user in**

Change the root layout to `async`, read the session, map to `AuthUser`, and pass it to `AppProvider`:

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
import "../styles/pages-submissions.css";
import "../styles/pages-profile.css";
import "../styles/pages-notifications.css";
import "../styles/pages.css";
import "../styles/theme-light.css";
import { AppProvider } from "@/components/providers/AppProvider";
import { getCurrentUser } from "@/lib/auth/session";
import { toAuthUser } from "@/lib/auth/user";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400","500","600","700","800","900"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-mono-google" });

export const metadata: Metadata = { title: "leonix arena — competitive programming training" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await getCurrentUser();
  const authUser = dbUser ? toAuthUser(dbUser) : null;
  return (
    <html lang="en" className={`${hanken.variable} ${mono.variable}`}>
      <body>
        <AppProvider initialUser={authUser}>{children}</AppProvider>
      </body>
    </html>
  );
}
```

(Confirm the `styles/*` import list matches what's currently in `app/layout.tsx` before overwriting; keep whatever is already there and only add the auth wiring.)

- [ ] **Step 4: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass. Any component reading `useApp().user.name` still works; `login` is gone (fixed in Task 11).

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts components/providers/AppProvider.tsx app/layout.tsx
git commit -m "feat(auth): session-driven provider + server layout wiring"
```

---

## Task 11: Wire the Login & Register forms

**Files:** `components/pages/Auth.tsx`, `components/nav/index.tsx`

- [ ] **Step 1: Rewrite `components/pages/Auth.tsx`**

Both forms call the API, show inline errors, disable while pending, and honor `?next=` on login. The Register wizard collects all steps and submits on Finish.

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || body.errors?.email || body.errors?.password || "Sign in failed.");
        setBusy(false);
        return;
      }
      router.push(params.get("next") || "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again."); setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side">
          <div className="logo-mark"><span className="mono brand-fg">{'{'}</span><span className="mono">leonix</span><span className="mono brand-fg">{'}'}</span></div>
          <h2 style={{marginTop:32}}>Welcome back.</h2>
          <p className="muted t-md">Pick up where you left off — your submissions, streak and rank are waiting.</p>
          <div className="auth-quotes">
            <blockquote>&ldquo;The archive plus instant hints got me from div 2 to div 1 in a summer.&rdquo;</blockquote>
            <cite className="t-xs mono dim">— Andrei P., 12th grade, București</cite>
          </div>
        </div>
        <form className="auth-form stack-4" onSubmit={submit}>
          <span className="eyebrow">// log in</span>
          <h1>Sign in to leonix Arena</h1>
          {error && <div className="auth-error">{error}</div>}
          <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required/></div>
          <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required/></div>
          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>{busy ? "Signing in…" : <>Sign in <Icon name="arrow-r" size={12}/></>}</button>
          <div className="auth-divider"><span>or</span></div>
          <div className="row gap-2">
            <button type="button" className="btn btn-secondary btn-block" disabled title="Coming soon">Google</button>
            <button type="button" className="btn btn-secondary btn-block" disabled title="Coming soon">GitHub</button>
          </div>
          <div className="t-sm dim" style={{textAlign:'center', marginTop:8}}>
            New here? <a onClick={() => router.push('/register')}>Create an account</a>
          </div>
        </form>
      </div>
    </div>
  );
}

const GOALS = [
  { glyph:'∑', name:'Algorithmics' }, { glyph:'◆', name:'Data structures' },
  { glyph:'{}', name:'Dynamic programming' }, { glyph:'◇', name:'Graphs' },
  { glyph:'⚑', name:'Olympiad prep' }, { glyph:'⌘', name:'Interview prep' },
];
const LANGS = [
  { id:'C++17', name:'C++ 17', note:'GCC · the competitive standard' },
  { id:'Python 3', name:'Python 3', note:'CPython · fast to write' },
  { id:'Java 17', name:'Java 17', note:'OpenJDK · strong typing' },
];

export function Register() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [language, setLanguage] = useState("C++17");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const toggleGoal = (g: string) => setGoals(gs => gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]);

  const finish = async () => {
    setBusy(true); setErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, goals, language }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || { form: "Registration failed." });
        setBusy(false);
        if (body.errors?.name || body.errors?.email || body.errors?.password) setStep(0);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ form: "Something went wrong. Try again." }); setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-side">
          <div className="logo-mark"><span className="mono brand-fg">{'{'}</span><span className="mono">leonix</span><span className="mono brand-fg">{'}'}</span></div>
          <h2 style={{marginTop:32}}>Start in 3 steps.</h2>
          <ol className="auth-steps">
            <li className={step>=0?'is-active':''}><span className="step-n mono">01</span> Account basics</li>
            <li className={step>=1?'is-active':''}><span className="step-n mono">02</span> Your goals</li>
            <li className={step>=2?'is-active':''}><span className="step-n mono">03</span> Preferred language</li>
          </ol>
        </div>
        <div className="auth-form stack-4">
          <span className="eyebrow">// step 0{step+1} of 03</span>
          {errors.form && <div className="auth-error">{errors.form}</div>}
          {step === 0 && <>
            <h1>Create account</h1>
            <div className="field"><label>Full name</label><input className="input" value={name} onChange={e => setName(e.target.value)}/>{errors.name && <span className="field-error">{errors.name}</span>}</div>
            <div className="field"><label>Email</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}/>{errors.email && <span className="field-error">{errors.email}</span>}</div>
            <div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}/>{errors.password && <span className="field-error">{errors.password}</span>}</div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep(1)}>Continue <Icon name="arrow-r" size={12}/></button>
          </>}
          {step === 1 && <>
            <h1>What do you want to train?</h1>
            <p className="t-sm muted">We&apos;ll tune your recommended problems. You can pick more than one.</p>
            <div className="grid-2 stack-3">
              {GOALS.map(g => (
                <label key={g.name} className="goal-card">
                  <input type="checkbox" checked={goals.includes(g.name)} onChange={() => toggleGoal(g.name)}/>
                  <span className="goal-glyph mono">{g.glyph}</span>
                  <span className="strong">{g.name}</span>
                </label>
              ))}
            </div>
            <div className="row gap-2"><button className="btn btn-secondary" onClick={() => setStep(0)}>Back</button><button className="btn btn-primary btn-block" onClick={() => setStep(2)}>Continue</button></div>
          </>}
          {step === 2 && <>
            <h1>Pick your default language</h1>
            <p className="t-sm muted">The one your editor opens with. You can switch any time.</p>
            <div className="stack-3">
              {LANGS.map(l => (
                <label key={l.id} className="prod-pick">
                  <input type="radio" name="lang" checked={language === l.id} onChange={() => setLanguage(l.id)}/>
                  <div className="stack-2"><div className="strong">{l.name}</div><div className="t-xs muted">{l.note}</div></div>
                </label>
              ))}
            </div>
            <div className="row gap-2"><button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button><button className="btn btn-primary btn-block" onClick={finish} disabled={busy}>{busy ? "Creating…" : "Finish setup"}</button></div>
          </>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add error styles to `styles/pages.css`**

Append:

```css
.auth-error { border: 1px solid rgba(240,100,100,0.4); background: var(--danger-bg); color: #f0a0a0; border-radius: var(--r-2); padding: 10px 12px; font-size: 13px; }
.field-error { display: block; margin-top: 5px; font-size: 12px; color: var(--danger); }
```

- [ ] **Step 3: Wire "Sign out" in `components/nav/index.tsx`**

Replace the sign-out link's handler to call `logout()` from the provider. Pull `logout` from `useApp()`:

Change the destructure near the top of `TopNav`:

```tsx
const { user, theme, toggleTheme, notifications, unreadCount, markRead, markAllRead, logout } = useApp();
```

Change the profile-menu sign-out line to:

```tsx
<a onClick={() => { setOpenProfile(false); logout(); }}><Icon name="logout" size={14}/> Sign out</a>
```

- [ ] **Step 4: Verify typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both pass; no remaining references to the old `login()`.

- [ ] **Step 5: Commit**

```bash
git add components/pages/Auth.tsx components/nav/index.tsx styles/pages.css
git commit -m "feat(auth): wire login/register forms + sign out to the API"
```

---

## Task 12: Seed, docs, and full verification

**Files:** `prisma/seed.ts`, `README.md`

- [ ] **Step 1: Create `prisma/seed.ts`**

```ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(email: string, name: string, handle: string, password: string, role: Role) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, name, handle, passwordHash, role },
  });
  console.log(`seeded ${role}: ${email}`);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");

  await upsertUser(adminEmail, "Site Admin", "admin", adminPassword, Role.ADMIN);
  await upsertUser("helper@leonix.dev", "Demo Helper", "helper", "helper12345", Role.HELPER);
  await upsertUser("student@leonix.dev", "Demo Student", "student", "student12345", Role.STUDENT);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
```

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: prints `seeded ADMIN: admin@leonix.dev`, `seeded HELPER: …`, `seeded STUDENT: …`.

- [ ] **Step 3: Add a "Backend / Auth" section to `README.md`**

Append:

```markdown
## Backend & Auth (local)

1. `npm install`
2. `npm run db:up` — start local Postgres (Docker). Or set `DATABASE_URL` to a Neon URL in `.env`.
3. `npm run db:migrate` — apply the schema.
4. `npm run db:seed` — create the bootstrap admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) + demo helper/student.
5. `npm run dev` — register at `/register`, or sign in with the seeded accounts.

Roles: everyone registers as `STUDENT`; `npm run db:seed` promotes `ADMIN_EMAIL` to `ADMIN`.
Tests: `npm run test` (needs the DB running; uses the `leonix_test` database).
```

- [ ] **Step 4: Full verification**

Run each and confirm:
- `npm run test` → all suites green.
- `npm run typecheck && npm run build` → clean.
- `npm run dev`, then manually:
  - Register a new user → lands on `/dashboard`; account menu shows the real name; `student` role.
  - Sign out → back to `/login`; visiting `/dashboard` now redirects to `/login?next=/dashboard`.
  - Sign in with `admin@leonix.dev` / `ADMIN_PASSWORD` → account menu reflects the admin.
  - Public pages (`/`, `/archive`, `/leaderboard`, `/u/alexp`, `/search`) load while signed out.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts README.md
git commit -m "feat(auth): admin seed + backend/auth README"
```

---

## Self-Review

- **Spec coverage:** stack/architecture (Task 1–2, 6, 10), email/password only + inert OAuth buttons (Task 11), Postgres+Prisma (Task 1–2), custom sessions/bcrypt/cookie (Task 3, 6), roles + register-as-student + seeded admin (Task 2, 7, 12), keep-wizard + persist goals/language + auto-handle (Task 4, 7, 11), route protection model A (Task 9), provider/nav integration + known seam (Task 10–11), Vitest tests (Tasks 3–8), config/.env (Task 1), error handling (Task 7–8, 11), verification (Task 12). Deployment retirement of static export (Task 1) — covers the incompatibility the spec noted.
- **Placeholders:** none — every code step has full code; every run step has an expected result.
- **Type consistency:** `AuthUser`/`Role` defined in Task 10 and consumed by `toAuthUser` (Task 6 note) + provider (Task 10); `toPublicUser`/`toAuthUser` names consistent across Tasks 6–10; `startSession`/`endSession`/`getCurrentUser`/`createSessionRecord`/`getSessionUser`/`deleteSessionRecord` consistent Tasks 6–10; `SESSION_COOKIE` value `leonix_session` matches middleware; `validateRegister`/`validateLogin` consistent; endpoints `/api/auth/{register,login,logout,me}` consistent across handlers, tests, provider, forms.
- **Ordering note:** `lib/auth/user.ts` (Task 6) imports `AuthUser` from `lib/types.ts` (Task 10). If executing strictly in order, add the `lib/types.ts` `AuthUser`/`Role` export (Task 10 Step 1) *before* Task 6 Step 1, or accept that `user.ts` typechecks only after Task 10. The session **tests** (Task 6) don't import `user.ts`, so TDD for sessions is unaffected.
