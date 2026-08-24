import { notFound } from "next/navigation";
import { getPublicProblem, getDraftProblem, resolvedLanguageLimits, pickTranslation, type PublicProblem } from "@/lib/problems/public";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageProblem } from "@/lib/problems/authz";
import { problemSubmissions } from "@/lib/submissions/queries";
import Problem, { type ProblemView } from "@/components/pages/Problem";

function toView(problem: PublicProblem): ProblemView {
  const statement = pickTranslation(problem);
  return {
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
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getCurrentUser();
  const canManage = (problem: PublicProblem) =>
    !!user && canManageProblem({ id: user.id, role: user.role }, { createdById: problem.createdById, collaboratorIds: problem.collaborators.map(c => c.userId) });

  // Published problems render normally; a manager additionally gets an Edit button.
  const published = await getPublicProblem(code);
  if (published) {
    const subs = await problemSubmissions(code, {});
    return <Problem view={toView(published)} submissions={subs?.rows ?? []} canEdit={canManage(published)} />;
  }

  // Not published — only someone who can manage it may preview the draft.
  const draft = await getDraftProblem(code);
  if (!draft || !canManage(draft)) notFound();
  const subs = await problemSubmissions(code, {});
  return (
    <Problem
      view={toView(draft)}
      submissions={subs?.rows ?? []}
      canEdit
      preview={{ status: draft.status, visibility: draft.visibility }}
    />
  );
}
