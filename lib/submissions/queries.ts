import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export function fmtMs(ms: number | null): string {
  return ms == null ? "—" : `${ms} ms`;
}
export function fmtMb(mb: number | null): string {
  return mb == null ? "—" : `${mb.toFixed(1)} MB`;
}

export interface SubRow {
  id: string;
  verdict: string;
  score: number;
  language: string | null;
  time: string;
  memory: string;
  source: string;
  userHandle: string;
  userName: string;
  userInitial: string;
  userHue: number;
  submittedAt: string;
}

function toRow(s: {
  id: string; verdict: string; score: number; maxTimeMs: number | null; peakMemoryMb: number | null; source: string;
  createdAt: Date; language: { name: string } | null; user: { handle: string; name: string; avatarHue: number };
}): SubRow {
  return {
    id: s.id, verdict: s.verdict, score: s.score, language: s.language?.name ?? null,
    time: fmtMs(s.maxTimeMs), memory: fmtMb(s.peakMemoryMb), source: s.source,
    userHandle: s.user.handle, userName: s.user.name, userInitial: s.user.name.charAt(0).toUpperCase(),
    userHue: s.user.avatarHue, submittedAt: s.createdAt.toISOString(),
  };
}

export interface ProblemSubmissionQuery {
  mineUserId?: string;
  verdict?: string;
  languageCode?: string;
  sort?: "newest" | "score" | "fastest";
  user?: string;
}

/** Submissions for a problem (by code), filtered/sorted for the list + tab. */
export async function problemSubmissions(code: string, q: ProblemSubmissionQuery = {}) {
  const problem = await prisma.problem.findUnique({ where: { code }, select: { id: true, title: true } });
  if (!problem) return null;

  const where: Prisma.SubmissionWhereInput = { problemId: problem.id };
  if (q.mineUserId) where.userId = q.mineUserId;
  if (q.verdict && q.verdict !== "ALL") where.verdict = q.verdict as Prisma.SubmissionWhereInput["verdict"];
  if (q.languageCode && q.languageCode !== "ALL") where.language = { code: q.languageCode };
  if (q.user) where.user = { handle: { contains: q.user, mode: "insensitive" } };

  const orderBy: Prisma.SubmissionOrderByWithRelationInput =
    q.sort === "score" ? { score: "desc" } : q.sort === "fastest" ? { maxTimeMs: "asc" } : { createdAt: "desc" };

  const subs = await prisma.submission.findMany({
    where, orderBy, take: 200,
    include: { language: { select: { name: true } }, user: { select: { handle: true, name: true, avatarHue: true } } },
  });
  return { problemTitle: problem.title, rows: subs.map(toRow), total: subs.length };
}

/** A single submission for the detail page. */
export async function submissionDetail(id: string) {
  const s = await prisma.submission.findUnique({
    where: { id },
    include: {
      language: { select: { name: true } },
      user: { select: { handle: true, name: true, avatarHue: true } },
      problem: { select: { code: true, title: true } },
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    verdict: s.verdict,
    score: s.score,
    language: s.language?.name ?? "—",
    time: fmtMs(s.maxTimeMs),
    memory: fmtMb(s.peakMemoryMb),
    source: s.source,
    groups: (s.groups as unknown) ?? null,
    submittedAt: s.createdAt.toISOString(),
    problemCode: s.problem.code,
    problemTitle: s.problem.title,
    userHandle: s.user.handle,
    userName: s.user.name,
    userInitial: s.user.name.charAt(0).toUpperCase(),
    userHue: s.user.avatarHue,
  };
}

/** Best score a user has on a problem code (for the list summary). */
export async function userBestScore(userId: string, code: string): Promise<number | null> {
  const problem = await prisma.problem.findUnique({ where: { code }, select: { id: true } });
  if (!problem) return null;
  const agg = await prisma.submission.aggregate({ where: { userId, problemId: problem.id }, _max: { score: true } });
  return agg._max.score;
}
