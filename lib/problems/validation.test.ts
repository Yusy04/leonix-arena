import { describe, it, expect } from "vitest";
import { isValidProblemCode, validateProblem } from "@/lib/problems/validation";

describe("isValidProblemCode", () => {
  it("accepts infoarena-style slugs", () => {
    expect(isValidProblemCode("secv3")).toBe(true);
    expect(isValidProblemCode("round-123")).toBe(true);
  });
  it("rejects invalid slugs", () => {
    expect(isValidProblemCode("Secv3")).toBe(false); // uppercase
    expect(isValidProblemCode("a")).toBe(false); // too short
    expect(isValidProblemCode("has space")).toBe(false);
    expect(isValidProblemCode("-lead")).toBe(false); // must start alphanumeric
  });
});

describe("validateProblem", () => {
  it("accepts a valid STANDARD/STDIN problem", () => {
    expect(validateProblem({ code: "secv3", title: "Secvență 3", type: "STANDARD", ioMode: "STDIN_STDOUT" })).toEqual({});
  });
  it("requires input/output filenames for FILES mode", () => {
    const e = validateProblem({ code: "secv3", title: "x", ioMode: "FILES" });
    expect(e.inputFile).toBeTruthy();
    expect(e.outputFile).toBeTruthy();
  });
  it("rejects a bad code and empty title", () => {
    const e = validateProblem({ code: "Bad Code", title: "" });
    expect(e.code).toBeTruthy();
    expect(e.title).toBeTruthy();
  });
  it("rejects invalid type / io mode / limits", () => {
    const e = validateProblem({ code: "secv3", title: "x", type: "WEIRD", ioMode: "PIPES", timeLimitMs: -1, memoryLimitMb: 0 });
    expect(e.type).toBeTruthy();
    expect(e.ioMode).toBeTruthy();
    expect(e.timeLimitMs).toBeTruthy();
    expect(e.memoryLimitMb).toBeTruthy();
  });
  it("requires the original language to be among statement languages", () => {
    const e = validateProblem({ code: "secv3", title: "x", originalLanguage: "de", statementLanguages: ["ro", "en"] });
    expect(e.originalLanguage).toBeTruthy();
    expect(validateProblem({ code: "secv3", title: "x", originalLanguage: "ro", statementLanguages: ["ro", "en"] }).originalLanguage).toBeUndefined();
  });
});
