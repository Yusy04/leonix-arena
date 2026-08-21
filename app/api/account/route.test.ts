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

import { cookies } from "next/headers";
import { PATCH } from "@/app/api/account/route";
import { POST as changePassword } from "@/app/api/account/password/route";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionRecord, SESSION_COOKIE } from "@/lib/auth/session";

async function signedInUser(overrides: Record<string, unknown> = {}) {
  const user = await prisma.user.create({
    data: { email: "me@x.com", handle: "me", name: "Me", passwordHash: await hashPassword("password123"), ...overrides },
  });
  const { token } = await createSessionRecord(user.id);
  (await cookies()).set(SESSION_COOKIE, token);
  return user;
}
function patch(body: unknown) {
  return PATCH(new Request("http://localhost/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
}

describe("PATCH /api/account", () => {
  it("updates profile fields for the signed-in user", async () => {
    await signedInUser();
    const res = await patch({ name: "New Name", email: "New@X.com", handle: "newhandle", city: "Cluj", language: "Python 3", avatarHue: 300 });
    expect(res.status).toBe(200);
    const { user } = await res.json();
    expect(user.name).toBe("New Name");
    expect(user.email).toBe("new@x.com");
    expect(user.handle).toBe("newhandle");
    expect(user.city).toBe("Cluj");
    expect(user.avatarHue).toBe(300);
    expect(user.passwordHash).toBeUndefined();
  });

  it("rejects when not authenticated", async () => {
    (await cookies()).delete(SESSION_COOKIE);
    const res = await patch({ name: "X", email: "x@x.com", handle: "xx" });
    expect(res.status).toBe(401);
  });

  it("rejects an email already used by another account (409)", async () => {
    await prisma.user.create({ data: { email: "taken@x.com", handle: "taken", name: "T", passwordHash: await hashPassword("password123") } });
    await signedInUser();
    const res = await patch({ name: "Me", email: "taken@x.com", handle: "me" });
    expect(res.status).toBe(409);
    expect((await res.json()).errors.email).toBeTruthy();
  });

  it("lets the user keep their own email/handle", async () => {
    await signedInUser();
    const res = await patch({ name: "Me Again", email: "me@x.com", handle: "me" });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/account/password", () => {
  function post(body: unknown) {
    return changePassword(new Request("http://localhost/api/account/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  }
  it("changes the password when the current one is correct", async () => {
    const user = await signedInUser();
    const res = await post({ currentPassword: "password123", newPassword: "brandnew123" });
    expect(res.status).toBe(200);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(await verifyPassword("brandnew123", updated!.passwordHash)).toBe(true);
  });
  it("rejects a wrong current password", async () => {
    await signedInUser();
    const res = await post({ currentPassword: "wrongpass", newPassword: "brandnew123" });
    expect(res.status).toBe(400);
    expect((await res.json()).errors.currentPassword).toBeTruthy();
  });
});
