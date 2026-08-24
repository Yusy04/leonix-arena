import JSZip from "jszip";
import { ServiceError } from "@/lib/problems/service";

/**
 * Test-package (.zip) format.
 *
 * A problem's tests are uploaded as a single .zip. Every test is a PAIR of
 * plain-text files that share a base name:
 *
 *     <name>.in    input given to the program
 *     <name>.ok    expected output   (".out" is accepted as an alias)
 *
 * Files may sit at the zip root or inside a single "tests/" folder; anything
 * else (READMEs, .DS_Store, __MACOSX) is ignored. Tests run in natural name
 * order (1, 2, 3, … 10, 11), so numbering the files controls ordering.
 */

const INPUT_EXT = "in";
const OUTPUT_EXTS = new Set(["ok", "out"]);
// Same shape the manual test form enforces (lib/problems/tests-service.ts).
const TEST_NAME_RE = /^[a-zA-Z0-9._-]{1,64}$/;

const MAX_TESTS = 1000;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_TOTAL_BYTES = 300 * 1024 * 1024; // 300 MB uncompressed

export interface ParsedTest {
  name: string;
  input: Buffer;
  output: Buffer;
}

/** Natural order so "10" sorts after "2", not after "1". */
function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function baseAndExt(path: string): { base: string; ext: string } {
  const name = path.split("/").pop() ?? path;
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { base: name, ext: "" };
  return { base: name.slice(0, dot), ext: name.slice(dot + 1).toLowerCase() };
}

function isIgnored(path: string): boolean {
  const name = path.split("/").pop() ?? path;
  return (
    path.startsWith("__MACOSX/") ||
    name.startsWith(".") || // .DS_Store, ._foo, etc.
    name === "" // directory entry
  );
}

/**
 * Parse & validate a test-package zip. Throws ServiceError(400) with a
 * human-readable message (and a per-field `errors.zip`) on any problem, so
 * nothing is imported unless the whole package is well-formed.
 */
export async function parseTestsZip(buffer: Buffer): Promise<ParsedTest[]> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new ServiceError(400, "That file is not a valid .zip archive.", { zip: "Not a valid .zip." });
  }

  // Collect candidate entries, detecting name collisions across folders.
  type Slot = { input?: JSZip.JSZipObject; output?: JSZip.JSZipObject; inPath?: string; outPath?: string };
  const slots = new Map<string, Slot>();

  for (const entry of Object.values(zip.files)) {
    if (entry.dir || isIgnored(entry.name)) continue;
    const { base, ext } = baseAndExt(entry.name);
    const isInput = ext === INPUT_EXT;
    const isOutput = OUTPUT_EXTS.has(ext);
    if (!isInput && !isOutput) continue; // README and other files are ignored

    if (!TEST_NAME_RE.test(base)) {
      throw new ServiceError(400, `Test name "${base}" is not allowed — use letters, digits, dots, dashes and underscores (max 64 chars).`, { zip: `Bad test name: ${base}` });
    }

    const slot = slots.get(base) ?? {};
    if (isInput) {
      if (slot.input) throw new ServiceError(400, `Two input files map to the test "${base}" (${slot.inPath} and ${entry.name}). Keep one .in per test.`, { zip: `Duplicate input: ${base}` });
      slot.input = entry; slot.inPath = entry.name;
    } else {
      if (slot.output) throw new ServiceError(400, `Two output files map to the test "${base}" (${slot.outPath} and ${entry.name}). Keep one .ok/.out per test.`, { zip: `Duplicate output: ${base}` });
      slot.output = entry; slot.outPath = entry.name;
    }
    slots.set(base, slot);
  }

  if (slots.size === 0) {
    throw new ServiceError(400, "No tests found. Each test needs a <name>.in and a matching <name>.ok file. Download the template to see the expected layout.", { zip: "No .in/.ok pairs found." });
  }
  if (slots.size > MAX_TESTS) {
    throw new ServiceError(400, `Too many tests (${slots.size}). The limit is ${MAX_TESTS} per problem.`, { zip: "Too many tests." });
  }

  // Every test must have both halves.
  const missingOutput: string[] = [];
  const missingInput: string[] = [];
  for (const [name, slot] of slots) {
    if (!slot.output) missingOutput.push(name);
    if (!slot.input) missingInput.push(name);
  }
  if (missingInput.length || missingOutput.length) {
    const parts: string[] = [];
    if (missingOutput.length) parts.push(`missing output (.ok) for: ${missingOutput.sort(naturalCompare).join(", ")}`);
    if (missingInput.length) parts.push(`missing input (.in) for: ${missingInput.sort(naturalCompare).join(", ")}`);
    throw new ServiceError(400, `Every test needs both an input and an output file — ${parts.join("; ")}.`, { zip: "Unpaired test files." });
  }

  const names = [...slots.keys()].sort(naturalCompare);
  const tests: ParsedTest[] = [];
  let total = 0;
  for (const name of names) {
    const slot = slots.get(name)!;
    const input = await slot.input!.async("nodebuffer");
    const output = await slot.output!.async("nodebuffer");
    if (input.length > MAX_FILE_BYTES || output.length > MAX_FILE_BYTES) {
      throw new ServiceError(400, `Test "${name}" is larger than the ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB per-file limit.`, { zip: "File too large." });
    }
    total += input.length + output.length;
    if (total > MAX_TOTAL_BYTES) {
      throw new ServiceError(400, `The test package exceeds the ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)} MB total limit.`, { zip: "Package too large." });
    }
    tests.push({ name, input, output });
  }
  return tests;
}

const README = `LEONIX ARENA — TEST PACKAGE
===========================

Upload a single .zip that contains all the tests for your problem.

HOW TESTS ARE STRUCTURED
------------------------
Every test is a PAIR of plain-text files that share the same base name:

    <name>.in    the input given to the program
    <name>.ok    the expected (correct) output

Valid pairs:
    1.in  / 1.ok
    2.in  / 2.ok
    10.in / 10.ok

RULES
-----
1. Each .in file must have a matching output file with the same name.
2. The output extension can be .ok or .out (both are accepted).
3. Names may contain letters, digits, dots, dashes and underscores
   (e.g. 1, 02, test-03, sub1_04). Keep them short (max 64 chars).
4. Tests run in natural name order (1, 2, 3, ... 10, 11), so numbering
   your files is the easiest way to control the order.
5. Put the files at the top level of the zip OR inside a single "tests/"
   folder — both work.
6. Any other file (like this README) is ignored.

HOW TO UPLOAD
-------------
1. Put your <name>.in / <name>.ok files together.
2. Compress them into a .zip:
     - macOS:   select the files, right-click, "Compress".
     - Windows: select the files, right-click, "Send to" >
                "Compressed (zipped) folder".
     - Linux:   zip tests.zip *.in *.ok
3. In the problem editor, open the "Tests" section and upload the .zip.
4. Choose "Replace all tests" for a fresh set, or "Add to existing" to
   append new tests to what is already there.

The example tests in the "tests/" folder (1, 2, 3) are a working
"sum of N numbers" set — delete them and drop in your own.
`;

const EXAMPLES: { name: string; input: string; output: string }[] = [
  { name: "1", input: "5\n1 2 3 4 5\n", output: "15\n" },
  { name: "2", input: "3\n10 20 30\n", output: "60\n" },
  { name: "3", input: "1\n42\n", output: "42\n" },
];

/** Build the downloadable starter template (README + 3 example test pairs). */
export async function buildTemplateZip(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("README.txt", README);
  const tests = zip.folder("tests")!;
  for (const ex of EXAMPLES) {
    tests.file(`${ex.name}.in`, ex.input);
    tests.file(`${ex.name}.ok`, ex.output);
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
