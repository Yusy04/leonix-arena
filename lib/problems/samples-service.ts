import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";

/**
 * Worked examples shown in the statement: an input, its expected output, and an
 * optional explanation. A problem may have several, kept in display order.
 */
export interface SampleInput {
  input: string;
  output: string;
  explanation?: string | null;
}

function cleanExplanation(v: string | null | undefined): string | null {
  return v && v.trim() ? v : null;
}

export async function createSample(code: string, input: SampleInput, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (!input.output || !input.output.trim()) {
    throw new ServiceError(400, "An example needs its expected output.", { output: "The expected output is required." });
  }
  const maxIndex = (await prisma.sample.aggregate({ where: { problemId: problem.id }, _max: { index: true } }))._max.index ?? 0;
  return prisma.sample.create({
    data: {
      problemId: problem.id,
      index: maxIndex + 1,
      input: input.input ?? "",
      output: input.output,
      explanation: cleanExplanation(input.explanation),
    },
  });
}

export async function updateSample(code: string, sampleId: string, input: Partial<SampleInput>, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const sample = await prisma.sample.findFirst({ where: { id: sampleId, problemId: problem.id } });
  if (!sample) throw new ServiceError(404, "Example not found.");

  const data: { input?: string; output?: string; explanation?: string | null } = {};
  if (input.input !== undefined) data.input = input.input;
  if (input.output !== undefined) {
    if (!input.output.trim()) throw new ServiceError(400, "An example needs its expected output.", { output: "The expected output is required." });
    data.output = input.output;
  }
  if (input.explanation !== undefined) data.explanation = cleanExplanation(input.explanation);
  return prisma.sample.update({ where: { id: sample.id }, data });
}

export async function deleteSample(code: string, sampleId: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const sample = await prisma.sample.findFirst({ where: { id: sampleId, problemId: problem.id } });
  if (!sample) throw new ServiceError(404, "Example not found.");
  await prisma.sample.delete({ where: { id: sample.id } });
}

export async function reorderSamples(code: string, orderedIds: string[], actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const samples = await prisma.sample.findMany({ where: { problemId: problem.id } });
  const known = new Set(samples.map(s => s.id));
  if (orderedIds.length !== samples.length || orderedIds.some(id => !known.has(id))) {
    throw new ServiceError(400, "Reorder must list exactly the problem's examples once each.");
  }
  // Two-phase to avoid the @@unique([problemId, index]) collision.
  await prisma.$transaction([
    ...samples.map((s, i) => prisma.sample.update({ where: { id: s.id }, data: { index: -(i + 1) } })),
    ...orderedIds.map((id, i) => prisma.sample.update({ where: { id }, data: { index: i + 1 } })),
  ]);
  return prisma.sample.findMany({ where: { problemId: problem.id }, orderBy: { index: "asc" } });
}
