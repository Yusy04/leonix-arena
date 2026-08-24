import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import { sanitizeStatement } from "@/lib/problems/sanitize";
import type { Actor } from "@/lib/problems/authz";

export interface TranslationInput {
  language: string;
  title: string;
  statement: string;
  inputSpec?: string;
  outputSpec?: string;
  constraints?: string;
  notes?: string;
  published?: boolean;
}

export async function addTranslation(code: string, input: TranslationInput, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (!input.language || !input.title || !input.statement) {
    throw new ServiceError(400, "Language, title and statement are required.");
  }
  const dup = await prisma.problemTranslation.findUnique({
    where: { problemId_language: { problemId: problem.id, language: input.language } },
  });
  if (dup) throw new ServiceError(409, "A translation for that language already exists.", { language: "Already exists." });

  return prisma.problemTranslation.create({
    data: {
      problemId: problem.id,
      language: input.language,
      title: input.title,
      statement: sanitizeStatement(input.statement),
      inputSpec: input.inputSpec ? sanitizeStatement(input.inputSpec) : null,
      outputSpec: input.outputSpec ? sanitizeStatement(input.outputSpec) : null,
      constraints: input.constraints ? sanitizeStatement(input.constraints) : null,
      notes: input.notes ? sanitizeStatement(input.notes) : null,
      published: input.published ?? false,
    },
  });
}

export async function updateTranslation(code: string, language: string, input: Partial<TranslationInput>, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const existing = await prisma.problemTranslation.findUnique({
    where: { problemId_language: { problemId: problem.id, language } },
  });
  if (!existing) throw new ServiceError(404, "Translation not found.");
  return prisma.problemTranslation.update({
    where: { id: existing.id },
    data: {
      title: input.title ?? undefined,
      statement: input.statement === undefined ? undefined : sanitizeStatement(input.statement),
      inputSpec: input.inputSpec === undefined ? undefined : (input.inputSpec ? sanitizeStatement(input.inputSpec) : null),
      outputSpec: input.outputSpec === undefined ? undefined : (input.outputSpec ? sanitizeStatement(input.outputSpec) : null),
      constraints: input.constraints === undefined ? undefined : (input.constraints ? sanitizeStatement(input.constraints) : null),
      notes: input.notes === undefined ? undefined : (input.notes ? sanitizeStatement(input.notes) : null),
      published: input.published ?? undefined,
    },
  });
}

export async function removeTranslation(code: string, language: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (language === problem.originalLanguage) {
    throw new ServiceError(400, "Cannot remove the original-language statement — change the original language first.");
  }
  const existing = await prisma.problemTranslation.findUnique({
    where: { problemId_language: { problemId: problem.id, language } },
  });
  if (!existing) throw new ServiceError(404, "Translation not found.");
  await prisma.problemTranslation.delete({ where: { id: existing.id } });
}

export async function setOriginalLanguage(code: string, language: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const t = await prisma.problemTranslation.findUnique({
    where: { problemId_language: { problemId: problem.id, language } },
  });
  if (!t) {
    throw new ServiceError(400, "Original language must be one of the existing statement languages.", {
      originalLanguage: "No statement exists in that language.",
    });
  }
  return prisma.problem.update({ where: { id: problem.id }, data: { originalLanguage: language, updatedById: actor.id } });
}
