import { prisma } from "@/lib/db";

/** Leaderboard: users ranked by total best-score across problems. */
export async function leaderboard(limit = 20) {
  const best = await prisma.submission.groupBy({ by: ["userId", "problemId"], _max: { score: true } });
  const agg: Record<string, { total: number; solved: number }> = {};
  for (const b of best) {
    const sc = b._max.score ?? 0;
    const u = (agg[b.userId] ??= { total: 0, solved: 0 });
    u.total += sc;
    if (sc === 100) u.solved += 1;
  }
  const users = await prisma.user.findMany({ select: { id: true, handle: true, name: true, avatarHue: true } });
  return users
    .map(u => ({ handle: u.handle, name: u.name, hue: u.avatarHue, initial: u.name.charAt(0).toUpperCase(), solved: agg[u.id]?.solved ?? 0, score: agg[u.id]?.total ?? 0 }))
    .sort((a, b) => b.score - a.score || b.solved - a.solved)
    .slice(0, limit)
    .map((u, i) => ({ rank: i + 1, ...u }));
}

export async function userProfile(handle: string) {
  const u = await prisma.user.findUnique({ where: { handle } });
  if (!u) return null;

  const best = await prisma.submission.groupBy({ by: ["problemId"], where: { userId: u.id }, _max: { score: true } });
  const solvedIds = best.filter(b => (b._max.score ?? 0) === 100).map(b => b.problemId);
  const submissionCount = await prisma.submission.count({ where: { userId: u.id } });
  const acCount = await prisma.submission.count({ where: { userId: u.id, verdict: "AC" } });

  const recentRaw = await prisma.submission.findMany({
    where: { userId: u.id }, orderBy: { createdAt: "desc" }, take: 6,
    include: { problem: { select: { code: true, title: true } } },
  });
  const tagRows = solvedIds.length
    ? await prisma.problemTag.findMany({ where: { problemId: { in: solvedIds } }, include: { tag: true } })
    : [];
  const byTag: Record<string, number> = {};
  for (const t of tagRows) byTag[t.tag.name] = (byTag[t.tag.name] ?? 0) + 1;

  return {
    handle: u.handle, name: u.name, initial: u.name.charAt(0).toUpperCase(), hue: u.avatarHue, city: u.city,
    joinedAt: u.createdAt.toISOString(), role: u.role,
    solved: solvedIds.length, submissionCount, acceptance: submissionCount ? Math.round((acCount / submissionCount) * 100) : 0,
    recent: recentRaw.map(s => ({ id: s.id, verdict: s.verdict, score: s.score, problemCode: s.problem.code, problemTitle: s.problem.title, submittedAt: s.createdAt.toISOString() })),
    solvedByTopic: Object.entries(byTag).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

export async function userDashboard(userId: string) {
  const recentRaw = await prisma.submission.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 4,
    include: { problem: { select: { code: true, title: true } }, language: { select: { name: true } } },
  });
  const best = await prisma.submission.groupBy({ by: ["problemId"], where: { userId }, _max: { score: true } });
  const solvedIds = best.filter(b => (b._max.score ?? 0) === 100).map(b => b.problemId);
  const attemptedIds = best.map(b => b.problemId);

  const recommendedRaw = await prisma.problem.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC", id: { notIn: attemptedIds } },
    orderBy: { difficulty: "asc" }, take: 3, include: { tags: { include: { tag: true } } },
  });

  return {
    solved: solvedIds.length,
    submissionCount: await prisma.submission.count({ where: { userId } }),
    recent: recentRaw.map(s => ({ id: s.id, verdict: s.verdict, score: s.score, language: s.language?.name ?? "", problemCode: s.problem.code, problemTitle: s.problem.title, submittedAt: s.createdAt.toISOString() })),
    recommended: recommendedRaw.map(p => ({ code: p.code, title: p.title, difficulty: p.difficulty, tag: p.tags[0]?.tag.name ?? "" })),
  };
}

export async function searchCatalog(q: string) {
  const query = q.trim();
  if (!query) return { problems: [], users: [] };
  const [problems, users] = await Promise.all([
    prisma.problem.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC", OR: [{ code: { contains: query, mode: "insensitive" } }, { title: { contains: query, mode: "insensitive" } }] },
      take: 20, include: { tags: { include: { tag: true } }, editorial: { select: { id: true } } },
    }),
    prisma.user.findMany({ where: { OR: [{ handle: { contains: query, mode: "insensitive" } }, { name: { contains: query, mode: "insensitive" } }] }, take: 20, select: { handle: true, name: true, avatarHue: true } }),
  ]);
  return {
    problems: problems.map(p => ({ code: p.code, title: p.title, difficulty: p.difficulty, tags: p.tags.map(t => t.tag.name), editorialOpen: !!p.editorial })),
    users: users.map(u => ({ handle: u.handle, name: u.name, initial: u.name.charAt(0).toUpperCase(), hue: u.avatarHue })),
  };
}
