/**
 * Scoring configuration validation + deterministic test resolution.
 *
 * Supports the three requested scoring shapes uniformly through subtasks:
 *   - Type A (individual test weights): one EXPLICIT subtask per test.
 *   - Type B (sequential groups): RANGE subtasks over the test index.
 *   - Type C (explicit / regex selection): EXPLICIT or REGEX subtasks.
 *
 * `resolveSubtaskTests` makes selection deterministic; `validateScoring`
 * rejects invalid regexes, unknown test references, empty subtasks, duplicate
 * indexes, and totals that don't add up.
 */

export type ScoringType = "INDIVIDUAL" | "SUBTASK";
export type SubtaskSelection = "EXPLICIT" | "RANGE" | "REGEX" | "ALL";

export interface TestRef {
  name: string;
  index: number; // 1-based ordering
}

export interface SubtaskInput {
  index: number;
  name?: string;
  points: number;
  selection: SubtaskSelection;
  testNames?: string[]; // EXPLICIT
  regexPattern?: string; // REGEX
  rangeStart?: number; // RANGE (inclusive test index)
  rangeEnd?: number; // RANGE (inclusive test index)
}

export interface ScoringInput {
  type: ScoringType;
  totalPoints: number;
  subtasks: SubtaskInput[];
}

export interface ScoringValidation {
  ok: boolean;
  errors: string[];
  resolved: Record<number, string[]>; // subtask index → covered test names
}

export function resolveSubtaskTests(sub: SubtaskInput, tests: TestRef[]): { names: string[]; error?: string } {
  switch (sub.selection) {
    case "ALL":
      return { names: tests.map(t => t.name) };
    case "EXPLICIT": {
      const want = sub.testNames ?? [];
      const known = new Set(tests.map(t => t.name));
      const missing = want.filter(n => !known.has(n));
      if (missing.length) return { names: [], error: `subtask ${sub.index}: unknown test(s) ${missing.join(", ")}` };
      return { names: want };
    }
    case "REGEX": {
      if (!sub.regexPattern) return { names: [], error: `subtask ${sub.index}: missing regex pattern` };
      let re: RegExp;
      try {
        re = new RegExp(sub.regexPattern);
      } catch {
        return { names: [], error: `subtask ${sub.index}: invalid regex "${sub.regexPattern}"` };
      }
      return { names: tests.filter(t => re.test(t.name)).map(t => t.name) };
    }
    case "RANGE": {
      const s = sub.rangeStart;
      const e = sub.rangeEnd;
      if (s == null || e == null || s < 1 || e < s) return { names: [], error: `subtask ${sub.index}: invalid range` };
      return { names: tests.filter(t => t.index >= s && t.index <= e).map(t => t.name) };
    }
    default:
      return { names: [], error: `subtask ${sub.index}: unknown selection` };
  }
}

export function validateScoring(input: ScoringInput, tests: TestRef[]): ScoringValidation {
  const errors: string[] = [];
  const resolved: Record<number, string[]> = {};

  if (!Number.isFinite(input.totalPoints) || input.totalPoints < 0) errors.push("invalid total score");
  if (input.subtasks.length === 0) errors.push("scoring has no subtasks");

  const seen = new Set<number>();
  let sum = 0;
  for (const sub of input.subtasks) {
    if (seen.has(sub.index)) errors.push(`duplicate subtask index ${sub.index}`);
    seen.add(sub.index);

    if (!Number.isFinite(sub.points) || sub.points < 0) errors.push(`subtask ${sub.index}: invalid points`);
    else sum += sub.points;

    const r = resolveSubtaskTests(sub, tests);
    if (r.error) errors.push(r.error);
    else if (r.names.length === 0) errors.push(`subtask ${sub.index}: selects no tests`);
    resolved[sub.index] = r.names;
  }

  if (sum !== input.totalPoints) errors.push(`subtask points sum to ${sum}, expected total ${input.totalPoints}`);

  return { ok: errors.length === 0, errors, resolved };
}
