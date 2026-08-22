import type { FieldErrors } from "@/lib/auth/validation";

export const PROBLEM_TYPES = ["STANDARD", "FUNCTION", "INTERACTIVE"] as const;
export const IO_MODES = ["STDIN_STDOUT", "FILES"] as const;
export const PROBLEM_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const VISIBILITIES = ["PUBLIC", "PRIVATE", "CONTEST_ONLY"] as const;

// Public code/slug: lowercase letters, digits and hyphens; 2–64 chars; must
// start alphanumeric. Keeps URLs clean and collision-free.
const CODE_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;

export function isValidProblemCode(code: string): boolean {
  return CODE_RE.test(code);
}

export interface ProblemInput {
  code?: string;
  title?: string;
  type?: string;
  ioMode?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  inputFile?: string;
  outputFile?: string;
  originalLanguage?: string;
  statementLanguages?: string[];
}

export function validateProblem(input: ProblemInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.code || !isValidProblemCode(input.code)) {
    errors.code = "Code must be 2–64 chars: lowercase letters, digits, hyphens; start alphanumeric.";
  }
  if (!input.title || !input.title.trim()) errors.title = "Title is required.";

  if (input.type && !PROBLEM_TYPES.includes(input.type as (typeof PROBLEM_TYPES)[number])) {
    errors.type = "Invalid problem type.";
  }
  if (input.ioMode && !IO_MODES.includes(input.ioMode as (typeof IO_MODES)[number])) {
    errors.ioMode = "Invalid I/O mode.";
  }
  if (input.ioMode === "FILES") {
    if (!input.inputFile) errors.inputFile = "File I/O requires an input filename.";
    if (!input.outputFile) errors.outputFile = "File I/O requires an output filename.";
  }

  if (input.timeLimitMs != null && (!Number.isFinite(input.timeLimitMs) || input.timeLimitMs <= 0)) {
    errors.timeLimitMs = "Time limit must be a positive number of milliseconds.";
  }
  if (input.memoryLimitMb != null && (!Number.isFinite(input.memoryLimitMb) || input.memoryLimitMb <= 0)) {
    errors.memoryLimitMb = "Memory limit must be a positive number of megabytes.";
  }

  if (input.originalLanguage && input.statementLanguages && !input.statementLanguages.includes(input.originalLanguage)) {
    errors.originalLanguage = "Original language must be one of the statement languages.";
  }

  return errors;
}
