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
