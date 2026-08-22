import { describe, it, expect } from "vitest";
import { validateScoring, resolveSubtaskTests, type TestRef } from "@/lib/problems/scoring";

const tests: TestRef[] = [
  { name: "test-01", index: 1 },
  { name: "test-02", index: 2 },
  { name: "test-03", index: 3 },
  { name: "test-04", index: 4 },
  { name: "test-05", index: 5 },
];

describe("scoring — Type A (individual test weights)", () => {
  it("accepts one explicit subtask per test summing to the total", () => {
    const res = validateScoring({
      type: "INDIVIDUAL", totalPoints: 13,
      subtasks: [
        { index: 1, points: 1, selection: "EXPLICIT", testNames: ["test-01"] },
        { index: 2, points: 2, selection: "EXPLICIT", testNames: ["test-02"] },
        { index: 3, points: 10, selection: "EXPLICIT", testNames: ["test-03"] },
      ],
    }, tests);
    expect(res.ok).toBe(true);
  });
});

describe("scoring — Type B (sequential ranges)", () => {
  it("resolves range subtasks and validates the total", () => {
    const res = validateScoring({
      type: "SUBTASK", totalPoints: 100,
      subtasks: [
        { index: 1, points: 10, selection: "RANGE", rangeStart: 1, rangeEnd: 2 },
        { index: 2, points: 90, selection: "RANGE", rangeStart: 3, rangeEnd: 5 },
      ],
    }, tests);
    expect(res.ok).toBe(true);
    expect(res.resolved[1]).toEqual(["test-01", "test-02"]);
    expect(res.resolved[2]).toEqual(["test-03", "test-04", "test-05"]);
  });
});

describe("scoring — Type C (explicit + regex)", () => {
  it("resolves explicit lists and regex patterns", () => {
    const res = validateScoring({
      type: "SUBTASK", totalPoints: 100,
      subtasks: [
        { index: 1, points: 30, selection: "EXPLICIT", testNames: ["test-01", "test-03"] },
        { index: 2, points: 70, selection: "REGEX", regexPattern: "test-0[245]" },
      ],
    }, tests);
    expect(res.ok).toBe(true);
    expect(res.resolved[2]).toEqual(["test-02", "test-04", "test-05"]);
  });
});

describe("scoring — validation failures", () => {
  it("rejects an invalid regex", () => {
    const res = validateScoring({ type: "SUBTASK", totalPoints: 10, subtasks: [{ index: 1, points: 10, selection: "REGEX", regexPattern: "test-[" }] }, tests);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => /invalid regex/.test(e))).toBe(true);
  });
  it("rejects references to nonexistent tests", () => {
    const res = validateScoring({ type: "SUBTASK", totalPoints: 10, subtasks: [{ index: 1, points: 10, selection: "EXPLICIT", testNames: ["test-99"] }] }, tests);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => /unknown test/.test(e))).toBe(true);
  });
  it("rejects a subtask that selects no tests", () => {
    const res = validateScoring({ type: "SUBTASK", totalPoints: 10, subtasks: [{ index: 1, points: 10, selection: "REGEX", regexPattern: "nomatch" }] }, tests);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => /selects no tests/.test(e))).toBe(true);
  });
  it("rejects totals that don't add up", () => {
    const res = validateScoring({ type: "SUBTASK", totalPoints: 100, subtasks: [{ index: 1, points: 40, selection: "ALL" }] }, tests);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => /expected total/.test(e))).toBe(true);
  });
  it("rejects an empty scoring scheme", () => {
    const res = validateScoring({ type: "SUBTASK", totalPoints: 0, subtasks: [] }, tests);
    expect(res.ok).toBe(false);
    expect(res.errors.some(e => /no subtasks/.test(e))).toBe(true);
  });
});

describe("resolveSubtaskTests — ALL", () => {
  it("selects every test", () => {
    expect(resolveSubtaskTests({ index: 1, points: 100, selection: "ALL" }, tests).names).toHaveLength(5);
  });
});
