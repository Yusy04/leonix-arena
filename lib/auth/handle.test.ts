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
