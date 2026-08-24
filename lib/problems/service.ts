import { Prisma } from "@prisma/client";
import type { ProblemType, IoMode, Visibility, CheckerType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateProblem } from "@/lib/problems/validation";
import { sanitizeStatement } from "@/lib/problems/sanitize";
import { canCreateProblem, canManageProblem, type Actor } from "@/lib/problems/authz";

/** Error carrying an HTTP status + optional field errors for route handlers. */
export class ServiceError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Full graph for a single problem view/editor. */
export const PROBLEM_INCLUDE = {
  translations: { orderBy: { language: "asc" } },
  languageSettings: { include: { language: true } },
  tags: { include: { tag: true } },
  sources: { include: { source: true } },
  images: { orderBy: { ordering: "asc" } },
  attachments: true,
  tests: { orderBy: { index: "asc" } },
  samples: { orderBy: { index: "asc" } },
  scoringScheme: { include: { subtasks: { orderBy: { index: "asc" }, include: { tests: true } } } },
  editorial: { include: { translations: { include: { videos: true, solutions: { include: { language: true } } } } } },
  contestProblems: { include: { contest: true } },
  collaborators: { include: { user: { select: { id: true, handle: true, name: true, avatarHue: true } } } },
  createdBy: { select: { id: true, handle: true, name: true } },
} satisfies Prisma.ProblemInclude;

export function getProblemByCode(code: string) {
  return prisma.problem.findUnique({ where: { code }, include: PROBLEM_INCLUDE });
}

export type FullProblem = NonNullable<Awaited<ReturnType<typeof getProblemByCode>>>;

/** Load a problem the actor is allowed to edit, or throw. */
export async function requireManageableProblem(code: string, actor: Actor) {
  const problem = await prisma.problem.findUnique({ where: { code }, include: { collaborators: { select: { userId: true } } } });
  if (!problem) throw new ServiceError(404, "Problem not found.");
  if (!canManageProblem(actor, { createdById: problem.createdById, collaboratorIds: problem.collaborators.map(c => c.userId) })) {
    throw new ServiceError(403, "You do not have permission to edit this problem.");
  }
  return problem;
}

export interface ListFilters {
  status?: string;
  visibility?: string;
  tag?: string;
  q?: string;
  take?: number;
  skip?: number;
}

export async function listProblems(filters: ListFilters = {}) {
  const where: Prisma.ProblemWhereInput = {};
  if (filters.status) where.status = filters.status as Prisma.ProblemWhereInput["status"];
  if (filters.visibility) where.visibility = filters.visibility as Prisma.ProblemWhereInput["visibility"];
  if (filters.tag) where.tags = { some: { tag: { slug: filters.tag } } };
  if (filters.q) {
    where.OR = [
      { code: { contains: filters.q, mode: "insensitive" } },
      { title: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(filters.take ?? 50, 100),
      skip: filters.skip ?? 0,
      include: { tags: { include: { tag: true } }, createdBy: { select: { handle: true, name: true } } },
    }),
    prisma.problem.count({ where }),
  ]);
  return { items, total };
}

export interface CreateProblemInput {
  code: string;
  title: string;
  authorName?: string;
  type?: string;
  ioMode?: string;
  inputFile?: string;
  outputFile?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  difficulty?: number;
  originalLanguage: string;
  statement: {
    language: string;
    title: string;
    statement: string;
    inputSpec?: string;
    outputSpec?: string;
    constraints?: string;
    notes?: string;
  };
}

export async function createProblem(input: CreateProblemInput, actor: Actor) {
  if (!canCreateProblem(actor.role)) throw new ServiceError(403, "You do not have permission to create problems.");

  const errors = validateProblem({
    code: input.code,
    title: input.title,
    type: input.type,
    ioMode: input.ioMode,
    inputFile: input.inputFile,
    outputFile: input.outputFile,
    timeLimitMs: input.timeLimitMs,
    memoryLimitMb: input.memoryLimitMb,
    originalLanguage: input.originalLanguage,
    statementLanguages: input.statement?.language ? [input.statement.language] : [],
  });
  if (!input.statement?.language || !input.statement?.statement) {
    errors.statement = "An initial statement (with its language) is required.";
  }
  if (Object.keys(errors).length) throw new ServiceError(400, "Invalid problem.", errors);

  if (await prisma.problem.findUnique({ where: { code: input.code } })) {
    throw new ServiceError(409, "Code taken.", { code: "That code is already in use." });
  }

  return prisma.problem.create({
    data: {
      code: input.code,
      title: input.title,
      authorName: input.authorName ?? null,
      createdById: actor.id,
      difficulty: input.difficulty ?? 1,
      type: (input.type ?? "STANDARD") as ProblemType,
      ioMode: (input.ioMode ?? "STDIN_STDOUT") as IoMode,
      inputFile: input.inputFile ?? null,
      outputFile: input.outputFile ?? null,
      timeLimitMs: input.timeLimitMs ?? 1000,
      memoryLimitMb: input.memoryLimitMb ?? 256,
      originalLanguage: input.originalLanguage,
      translations: {
        create: [{
          language: input.statement.language,
          title: input.statement.title,
          statement: sanitizeStatement(input.statement.statement),
          inputSpec: input.statement.inputSpec ? sanitizeStatement(input.statement.inputSpec) : null,
          outputSpec: input.statement.outputSpec ? sanitizeStatement(input.statement.outputSpec) : null,
          constraints: input.statement.constraints ? sanitizeStatement(input.statement.constraints) : null,
          notes: input.statement.notes ? sanitizeStatement(input.statement.notes) : null,
          published: true,
        }],
      },
    },
    include: PROBLEM_INCLUDE,
  });
}

export interface UpdateProblemInput {
  title?: string;
  authorName?: string | null;
  difficulty?: number;
  type?: string;
  ioMode?: string;
  inputFile?: string | null;
  outputFile?: string | null;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  checkerType?: string;
}

export async function updateProblem(code: string, input: UpdateProblemInput, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);

  const errors = validateProblem({
    code: problem.code,
    title: input.title ?? problem.title,
    type: input.type,
    ioMode: input.ioMode ?? problem.ioMode,
    inputFile: (input.inputFile ?? problem.inputFile) ?? undefined,
    outputFile: (input.outputFile ?? problem.outputFile) ?? undefined,
    timeLimitMs: input.timeLimitMs,
    memoryLimitMb: input.memoryLimitMb,
  });
  delete errors.code; // code is immutable here and already valid
  if (Object.keys(errors).length) throw new ServiceError(400, "Invalid update.", errors);

  return prisma.problem.update({
    where: { id: problem.id },
    data: {
      title: input.title ?? undefined,
      authorName: input.authorName === undefined ? undefined : input.authorName,
      difficulty: input.difficulty ?? undefined,
      type: (input.type as ProblemType | undefined) ?? undefined,
      ioMode: (input.ioMode as IoMode | undefined) ?? undefined,
      inputFile: input.inputFile === undefined ? undefined : input.inputFile,
      outputFile: input.outputFile === undefined ? undefined : input.outputFile,
      timeLimitMs: input.timeLimitMs ?? undefined,
      memoryLimitMb: input.memoryLimitMb ?? undefined,
      checkerType: (input.checkerType as CheckerType | undefined) ?? undefined,
      updatedById: actor.id,
      version: { increment: 1 },
    },
    include: PROBLEM_INCLUDE,
  });
}

export async function publishProblem(code: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const orig = await prisma.problemTranslation.findUnique({
    where: { problemId_language: { problemId: problem.id, language: problem.originalLanguage } },
  });
  if (!orig) throw new ServiceError(400, "Cannot publish: the original-language statement is missing.");
  return prisma.problem.update({
    where: { id: problem.id },
    data: { status: "PUBLISHED", updatedById: actor.id },
    include: PROBLEM_INCLUDE,
  });
}

export async function setVisibility(code: string, visibility: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (!["PUBLIC", "PRIVATE", "CONTEST_ONLY"].includes(visibility)) {
    throw new ServiceError(400, "Invalid visibility.", { visibility: "Invalid visibility." });
  }
  return prisma.problem.update({
    where: { id: problem.id },
    data: { visibility: visibility as Visibility, updatedById: actor.id },
    include: PROBLEM_INCLUDE,
  });
}

export async function archiveProblem(code: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  return prisma.problem.update({ where: { id: problem.id }, data: { status: "ARCHIVED", updatedById: actor.id } });
}

export async function deleteProblem(code: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  await prisma.problem.delete({ where: { id: problem.id } });
}
