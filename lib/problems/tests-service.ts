import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";
import { storage, storagePaths } from "@/lib/storage";

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
