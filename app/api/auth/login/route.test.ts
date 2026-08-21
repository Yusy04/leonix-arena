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
