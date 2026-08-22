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
  const problem = { createdById: "owner-1", collaboratorIds: ["collab-1"] };
  it("admin manages any problem", () => {
    expect(canManageProblem({ id: "someone", role: "ADMIN" }, problem)).toBe(true);
  });
  it("the creator manages their own", () => {
    expect(canManageProblem({ id: "owner-1", role: "HELPER" }, problem)).toBe(true);
  });
  it("a collaborator (co-author) manages it too", () => {
    expect(canManageProblem({ id: "collab-1", role: "HELPER" }, problem)).toBe(true);
  });
  it("an unrelated helper cannot manage it", () => {
    expect(canManageProblem({ id: "other", role: "HELPER" }, problem)).toBe(false);
  });
  it("an unrelated student cannot manage it", () => {
    expect(canManageProblem({ id: "student", role: "STUDENT" }, problem)).toBe(false);
  });
});
