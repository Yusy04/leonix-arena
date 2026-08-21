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
