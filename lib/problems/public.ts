import { prisma } from "@/lib/db";
import { resolveLimits } from "@/lib/problems/limits";

export interface ArchiveRow {
  code: string;
  title: string;
  author: string | null;
  source: string | null;
  tags: string[];
  difficulty: number;
  editorialOpen: boolean;
  bestScore: number | null;
  solved: boolean;
  attempted: boolean;
}

/** Published/public problems for the archive, with the viewer's best score. */
export async function listArchive(userId?: string): Promise<ArchiveRow[]> {
  const problems = await prisma.problem.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    orderBy: { createdAt: "asc" },
    include: {
      sources: { include: { source: true } },
      tags: { include: { tag: true } },
      editorial: { include: { translations: true } },
    },
  });

  const best: Record<string, number> = {};
  if (userId) {
    const rows = await prisma.submission.groupBy({ by: ["problemId"], where: { userId }, _max: { score: true } });
    for (const r of rows) best[r.problemId] = r._max.score ?? 0;
  }

  return problems.map(p => ({
    code: p.code,
    title: p.title,
    author: p.authorName,
    source: p.sources[0]?.source.name ?? null,
    tags: p.tags.map(t => t.tag.name),
    difficulty: p.difficulty,
    editorialOpen: !!p.editorial && p.editorial.translations.some(t => t.published),
    bestScore: userId && best[p.id] !== undefined ? best[p.id] : null,
    solved: (best[p.id] ?? 0) === 100,
    attempted: best[p.id] !== undefined,
  }));
}

/** A published problem with everything the public problem page renders. */
export function getPublicProblem(code: string) {
  return prisma.problem.findFirst({
    where: { code, status: "PUBLISHED" },
    include: {
      translations: { where: { published: true } },
      tags: { include: { tag: true } },
      sources: { include: { source: true } },
      samples: { orderBy: { index: "asc" } },
      languageSettings: { include: { language: true }, orderBy: { language: { ordering: "asc" } } },
      editorial: {
        include: {
          translations: {
            where: { published: true },
            include: { solutions: { include: { language: true } }, videos: { orderBy: { ordering: "asc" } } },
          },
        },
      },
    },
  });
}

export type PublicProblem = NonNullable<Awaited<ReturnType<typeof getPublicProblem>>>;

/** Resolve the effective time/memory limit per enabled language. */
export function resolvedLanguageLimits(problem: PublicProblem) {
  return problem.languageSettings
    .filter(s => s.enabled)
    .map(s => {
      const limits = resolveLimits(
        { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb },
        { defaultTimeMultiplier: s.language.defaultTimeMultiplier, defaultMemoryMb: s.language.defaultMemoryMb },
        { timeLimitMs: s.timeLimitMs, memoryLimitMb: s.memoryLimitMb },
      );
      return { code: s.language.code, name: s.language.name, ...limits };
    });
}

/** Pick the best statement for a preferred language, falling back to the original. */
export function pickTranslation(problem: PublicProblem, prefer?: string) {
  return (
    problem.translations.find(t => t.language === prefer) ??
    problem.translations.find(t => t.language === problem.originalLanguage) ??
    problem.translations[0] ??
    null
  );
}
