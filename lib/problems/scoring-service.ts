import type { SubtaskSelection } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";
import { validateScoring, type ScoringInput, type TestRef } from "@/lib/problems/scoring";

/** Validate the scoring config against the problem's tests, then replace the
 * scheme, materializing the resolved test membership for each subtask. */
export async function setScoring(code: string, input: ScoringInput, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const tests = await prisma.problemTest.findMany({ where: { problemId: problem.id }, orderBy: { index: "asc" } });
  const testRefs: TestRef[] = tests.map(t => ({ name: t.name, index: t.index }));

  const v = validateScoring(input, testRefs);
  if (!v.ok) throw new ServiceError(400, "Invalid scoring configuration.", { scoring: v.errors.join("; ") });

  await prisma.scoringScheme.deleteMany({ where: { problemId: problem.id } });
  const scheme = await prisma.scoringScheme.create({
    data: { problemId: problem.id, type: input.type, totalPoints: input.totalPoints, rawConfig: input as object },
  });

  const byName = new Map(tests.map(t => [t.name, t.id]));
  for (const sub of input.subtasks) {
    const subRow = await prisma.subtask.create({
      data: {
        schemeId: scheme.id,
        index: sub.index,
        name: sub.name ?? null,
        points: sub.points,
        selection: sub.selection as SubtaskSelection,
        regexPattern: sub.regexPattern ?? null,
        rangeStart: sub.rangeStart ?? null,
        rangeEnd: sub.rangeEnd ?? null,
      },
    });
    for (const testName of v.resolved[sub.index]) {
      await prisma.subtaskTest.create({ data: { subtaskId: subRow.id, testId: byName.get(testName)! } });
    }
  }

  return prisma.scoringScheme.findUnique({
    where: { problemId: problem.id },
    include: { subtasks: { orderBy: { index: "asc" }, include: { tests: true } } },
  });
}
