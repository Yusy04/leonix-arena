/**
 * Deterministic storage keys for a problem's folder. Layout (driver-agnostic):
 *
 *   problems/{code}/
 *     tests/{name}.in  tests/{name}.out
 *     grader/{filename}
 *     checker/{filename}
 *     images/{filename}
 *     editorials/{lang}/{filename}
 */

/** Reject traversal / absolute keys; normalize separators. */
export function normalizeKey(key: string): string {
  const cleaned = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (cleaned.split("/").some(seg => seg === "." || seg === "..")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
  return cleaned;
}

export function problemRoot(code: string): string {
  return `problems/${code}`;
}
export function testInputKey(code: string, name: string): string {
  return `${problemRoot(code)}/tests/${name}.in`;
}
export function testOutputKey(code: string, name: string): string {
  return `${problemRoot(code)}/tests/${name}.out`;
}
export function graderKey(code: string, filename: string): string {
  return `${problemRoot(code)}/grader/${filename}`;
}
export function checkerKey(code: string, filename: string): string {
  return `${problemRoot(code)}/checker/${filename}`;
}
export function imageKey(code: string, filename: string): string {
  return `${problemRoot(code)}/images/${filename}`;
}
export function editorialSolutionKey(code: string, lang: string, filename: string): string {
  return `${problemRoot(code)}/editorials/${lang}/${filename}`;
}
