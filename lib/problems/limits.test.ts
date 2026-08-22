import { describe, it, expect } from "vitest";
import { resolveLimits } from "@/lib/problems/limits";

const base = { timeLimitMs: 1000, memoryLimitMb: 256 };

describe("resolveLimits", () => {
  it("C++ (multiplier 1) inherits the baseline", () => {
    expect(resolveLimits(base, { defaultTimeMultiplier: 1 })).toEqual({ timeLimitMs: 1000, memoryLimitMb: 256 });
  });
  it("Python (multiplier 5) defaults to 5× the baseline time", () => {
    expect(resolveLimits(base, { defaultTimeMultiplier: 5 })).toEqual({ timeLimitMs: 5000, memoryLimitMb: 256 });
  });
  it("an explicit override takes precedence over the multiplier", () => {
    expect(resolveLimits(base, { defaultTimeMultiplier: 5 }, { timeLimitMs: 3000 }).timeLimitMs).toBe(3000);
  });
  it("memory override and language default memory are honored", () => {
    expect(resolveLimits(base, { defaultTimeMultiplier: 1, defaultMemoryMb: 512 }).memoryLimitMb).toBe(512);
    expect(resolveLimits(base, { defaultTimeMultiplier: 1 }, { memoryLimitMb: 128 }).memoryLimitMb).toBe(128);
  });
});
