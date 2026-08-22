import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";
import { storage, storagePaths } from "@/lib/storage";

async function ensureEditorial(problemId: string) {
  const existing = await prisma.editorial.findUnique({ where: { problemId } });
  return existing ?? prisma.editorial.create({ data: { problemId } });
}

async function requireEditorialTranslation(problemId: string, language: string) {
  const editorial = await prisma.editorial.findUnique({ where: { problemId } });
  if (!editorial) throw new ServiceError(404, "This problem has no editorial yet.");
  const tr = await prisma.editorialTranslation.findUnique({ where: { editorialId_language: { editorialId: editorial.id, language } } });
  if (!tr) throw new ServiceError(404, "No editorial exists in that language.");
  return tr;
}

export async function upsertEditorialTranslation(code: string, language: string, input: { description?: string; published?: boolean }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const editorial = await ensureEditorial(problem.id);
  const existing = await prisma.editorialTranslation.findUnique({ where: { editorialId_language: { editorialId: editorial.id, language } } });
  if (existing) {
    return prisma.editorialTranslation.update({
      where: { id: existing.id },
      data: { description: input.description === undefined ? undefined : input.description, published: input.published ?? undefined },
    });
  }
  return prisma.editorialTranslation.create({ data: { editorialId: editorial.id, language, description: input.description ?? null, published: input.published ?? false } });
}

export async function addEditorialVideo(code: string, language: string, input: { url: string; title?: string }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const tr = await requireEditorialTranslation(problem.id, language);
  if (!input.url) throw new ServiceError(400, "Video URL is required.", { url: "Required." });
  const maxOrder = (await prisma.editorialVideo.aggregate({ where: { translationId: tr.id }, _max: { ordering: true } }))._max.ordering ?? -1;
  return prisma.editorialVideo.create({ data: { translationId: tr.id, url: input.url, title: input.title ?? null, ordering: maxOrder + 1 } });
}

export async function addEditorialSolution(code: string, language: string, input: { languageCode: string; source: string; filename?: string }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const tr = await requireEditorialTranslation(problem.id, language);
  const lang = await prisma.programmingLanguage.findUnique({ where: { code: input.languageCode } });
  if (!lang) throw new ServiceError(400, "Unknown programming language.", { languageCode: "Unknown." });
  const dup = await prisma.editorialSolution.findUnique({ where: { translationId_languageId: { translationId: tr.id, languageId: lang.id } } });
  if (dup) throw new ServiceError(409, "A solution in that programming language already exists for this editorial language.");

  const filename = input.filename ?? `solution.${lang.fileExtension}`;
  const ref = await storage.put(storagePaths.editorialSolutionKey(problem.code, language, filename), input.source, "text/plain");
  const obj = await prisma.storageObject.create({ data: ref });
  return prisma.editorialSolution.create({ data: { translationId: tr.id, languageId: lang.id, storageObjectId: obj.id, ordering: 0 } });
}

export async function removeEditorialSolution(code: string, solutionId: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const sol = await prisma.editorialSolution.findUnique({
    where: { id: solutionId },
    include: { translation: { include: { editorial: true } } },
  });
  if (!sol || sol.translation.editorial.problemId !== problem.id) throw new ServiceError(404, "Solution not found.");
  await prisma.editorialSolution.delete({ where: { id: sol.id } });
}
