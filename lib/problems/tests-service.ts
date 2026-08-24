import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";
import { storage, storagePaths } from "@/lib/storage";
import { parseTestsZip } from "@/lib/problems/tests-zip";

const TEST_NAME_RE = /^[a-zA-Z0-9._-]{1,64}$/;

export interface TestInput {
  name: string;
  input: string;
  output: string;
  enabled?: boolean;
}

export async function createTest(code: string, input: TestInput, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (!TEST_NAME_RE.test(input.name || "")) {
    throw new ServiceError(400, "Invalid test name.", { name: "Use letters, digits, dots, dashes, underscores." });
  }
  const dup = await prisma.problemTest.findUnique({ where: { problemId_name: { problemId: problem.id, name: input.name } } });
  if (dup) throw new ServiceError(409, "A test with that name already exists.", { name: "Already exists." });

  const maxIndex = (await prisma.problemTest.aggregate({ where: { problemId: problem.id }, _max: { index: true } }))._max.index ?? 0;
  const inRef = await storage.put(storagePaths.testInputKey(problem.code, input.name), input.input, "text/plain");
  const outRef = await storage.put(storagePaths.testOutputKey(problem.code, input.name), input.output, "text/plain");
  const inObj = await prisma.storageObject.create({ data: inRef });
  const outObj = await prisma.storageObject.create({ data: outRef });

  return prisma.problemTest.create({
    data: {
      problemId: problem.id,
      name: input.name,
      index: maxIndex + 1,
      inputObjectId: inObj.id,
      outputObjectId: outObj.id,
      enabled: input.enabled ?? true,
    },
  });
}

export type ImportMode = "replace" | "append";

export interface ImportResult {
  imported: number;
  mode: ImportMode;
  total: number;
}

/**
 * Bulk-import tests from an uploaded .zip (see lib/problems/tests-zip.ts for
 * the format). The whole package is parsed & validated first, so a bad zip
 * changes nothing. "replace" wipes the existing tests (which unlinks them from
 * any scoring subtasks via cascade); "append" keeps them and rejects
 * name collisions.
 */
export async function importTestsFromZip(code: string, buffer: Buffer, mode: ImportMode, actor: Actor): Promise<ImportResult> {
  const problem = await requireManageableProblem(code, actor);
  const parsed = await parseTestsZip(buffer); // throws ServiceError(400) on a malformed package

  if (mode === "append") {
    const existing = await prisma.problemTest.findMany({ where: { problemId: problem.id }, select: { name: true } });
    const taken = new Set(existing.map(t => t.name));
    const collisions = parsed.filter(t => taken.has(t.name)).map(t => t.name);
    if (collisions.length) {
      throw new ServiceError(409, `These test names already exist: ${collisions.join(", ")}. Rename them, or choose "Replace all tests".`, { zip: "Name collision." });
    }
  } else {
    const existing = await prisma.problemTest.findMany({ where: { problemId: problem.id } });
    for (const t of existing) {
      await storage.delete(storagePaths.testInputKey(problem.code, t.name)).catch(() => {});
      await storage.delete(storagePaths.testOutputKey(problem.code, t.name)).catch(() => {});
    }
    const storageIds = existing.flatMap(t => [t.inputObjectId, t.outputObjectId].filter((id): id is string => !!id));
    await prisma.problemTest.deleteMany({ where: { problemId: problem.id } });
    if (storageIds.length) await prisma.storageObject.deleteMany({ where: { id: { in: storageIds } } });
  }

  const startIndex = (await prisma.problemTest.aggregate({ where: { problemId: problem.id }, _max: { index: true } }))._max.index ?? 0;
  let index = startIndex;
  for (const t of parsed) {
    index++;
    const inRef = await storage.put(storagePaths.testInputKey(problem.code, t.name), t.input, "text/plain");
    const outRef = await storage.put(storagePaths.testOutputKey(problem.code, t.name), t.output, "text/plain");
    const inObj = await prisma.storageObject.create({ data: inRef });
    const outObj = await prisma.storageObject.create({ data: outRef });
    await prisma.problemTest.create({
      data: { problemId: problem.id, name: t.name, index, inputObjectId: inObj.id, outputObjectId: outObj.id },
    });
  }

  const total = await prisma.problemTest.count({ where: { problemId: problem.id } });
  return { imported: parsed.length, mode, total };
}

export async function updateTest(code: string, testId: string, input: { enabled?: boolean; input?: string; output?: string }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const test = await prisma.problemTest.findFirst({ where: { id: testId, problemId: problem.id } });
  if (!test) throw new ServiceError(404, "Test not found.");
  if (input.input !== undefined) await storage.put(storagePaths.testInputKey(problem.code, test.name), input.input, "text/plain");
  if (input.output !== undefined) await storage.put(storagePaths.testOutputKey(problem.code, test.name), input.output, "text/plain");
  return prisma.problemTest.update({ where: { id: test.id }, data: { enabled: input.enabled ?? undefined } });
}

export async function deleteTest(code: string, testId: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const test = await prisma.problemTest.findFirst({ where: { id: testId, problemId: problem.id } });
  if (!test) throw new ServiceError(404, "Test not found.");
  await storage.delete(storagePaths.testInputKey(problem.code, test.name));
  await storage.delete(storagePaths.testOutputKey(problem.code, test.name));
  await prisma.problemTest.delete({ where: { id: test.id } });
}

export async function reorderTests(code: string, orderedTestIds: string[], actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const tests = await prisma.problemTest.findMany({ where: { problemId: problem.id } });
  const known = new Set(tests.map(t => t.id));
  if (orderedTestIds.length !== tests.length || orderedTestIds.some(id => !known.has(id))) {
    throw new ServiceError(400, "Reorder must list exactly the problem's tests once each.");
  }
  // Two-phase to avoid the @@unique([problemId, index]) collision.
  await prisma.$transaction([
    ...tests.map((t, i) => prisma.problemTest.update({ where: { id: t.id }, data: { index: -(i + 1) } })),
    ...orderedTestIds.map((id, i) => prisma.problemTest.update({ where: { id }, data: { index: i + 1 } })),
  ]);
  return prisma.problemTest.findMany({ where: { problemId: problem.id }, orderBy: { index: "asc" } });
}
