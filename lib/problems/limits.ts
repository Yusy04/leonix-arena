/**
 * Per-language execution limits with inheritance.
 *
 * A problem has a baseline (C++) time/memory limit. Each programming language
 * carries a `defaultTimeMultiplier` (Python = 5.0 → 5× the baseline). A
 * per-problem/language row may override either limit explicitly. This keeps the
 * 5× relationship out of every row — it lives on the language and is applied
 * only when there's no explicit override.
 */

export interface ProblemLimits {
  timeLimitMs: number;
  memoryLimitMb: number;
}
export interface LanguageDefaults {
  defaultTimeMultiplier: number;
  defaultMemoryMb?: number | null;
}
export interface LimitOverride {
  timeLimitMs?: number | null;
  memoryLimitMb?: number | null;
}

export function resolveLimits(
  base: ProblemLimits,
  language: LanguageDefaults,
  override?: LimitOverride | null,
): ProblemLimits {
  const timeLimitMs =
    override?.timeLimitMs ?? Math.round(base.timeLimitMs * language.defaultTimeMultiplier);
  const memoryLimitMb =
    override?.memoryLimitMb ?? language.defaultMemoryMb ?? base.memoryLimitMb;
  return { timeLimitMs, memoryLimitMb };
}
