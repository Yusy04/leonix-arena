import { describe, it, expect, vi } from "vitest";

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
