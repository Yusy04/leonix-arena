import { notFound } from "next/navigation";
import { getPublicProblem, resolvedLanguageLimits, pickTranslation } from "@/lib/problems/public";
import { problemSubmissions } from "@/lib/submissions/queries";
import Problem, { type ProblemView } from "@/components/pages/Problem";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const problem = await getPublicProblem(code);
  if (!problem) notFound();
  const statement = pickTranslation(problem);

  const view: ProblemView = {
    code: problem.code,
    title: statement?.title ?? problem.title,
    authorName: problem.authorName,
    difficulty: problem.difficulty,
    tags: problem.tags.map(t => t.tag.name),
    source: problem.sources[0]?.source.name ?? null,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    originalLanguage: problem.originalLanguage,
    statementLanguage: statement?.language ?? null,
    languages: problem.translations.map(t => t.language),
    statement: statement
      ? { title: statement.title, statement: statement.statement, inputSpec: statement.inputSpec, outputSpec: statement.outputSpec, constraints: statement.constraints, notes: statement.notes }
      : null,
    samples: problem.samples.map(s => ({ index: s.index, input: s.input, output: s.output, explanation: s.explanation })),
    limits: resolvedLanguageLimits(problem),
    editorial: problem.editorial
      ? {
          translations: problem.editorial.translations.map(tr => ({
            language: tr.language,
            description: tr.description,
            videos: tr.videos.map(v => ({ url: v.url, title: v.title })),
            solutions: tr.solutions.map(so => ({ language: so.language.name, inlineSource: so.inlineSource })),
          })),
        }
      : null,
  };

  const subs = await problemSubmissions(code, {});
  return <Problem view={view} submissions={subs?.rows ?? []} />;
}
