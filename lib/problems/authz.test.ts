import { describe, it, expect } from "vitest";
import { canCreateProblem, canManageProblem } from "@/lib/problems/authz";

describe("canCreateProblem", () => {
  it("allows admin and helper, denies student", () => {
    expect(canCreateProblem("ADMIN")).toBe(true);
    expect(canCreateProblem("HELPER")).toBe(true);
    expect(canCreateProblem("STUDENT")).toBe(false);
  });
});

describe("canManageProblem", () => {
  const problem = { createdById: "owner-1" };
  it("admin manages any problem", () => {
    expect(canManageProblem({ id: "someone", role: "ADMIN" }, problem)).toBe(true);
  });
  it("helper manages only their own", () => {
    expect(canManageProblem({ id: "owner-1", role: "HELPER" }, problem)).toBe(true);
    expect(canManageProblem({ id: "other", role: "HELPER" }, problem)).toBe(false);
  });
  it("student manages nothing", () => {
    expect(canManageProblem({ id: "owner-1", role: "STUDENT" }, problem)).toBe(false);
  });
});
