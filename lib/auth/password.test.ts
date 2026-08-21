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
