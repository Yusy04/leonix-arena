import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import { canCreateProblem, type Actor } from "@/lib/problems/authz";

const SLUG_RE = /^[a-z0-9-]{2,64}$/;

export async function createContest(input: { slug: string; name: string; description?: string }, actor: Actor) {
  if (!canCreateProblem(actor.role)) throw new ServiceError(403, "You cannot create contests.");
  if (!SLUG_RE.test(input.slug)) throw new ServiceError(400, "Invalid contest slug.", { slug: "2–64 chars: lowercase letters, digits, hyphens." });
  if (await prisma.contest.findUnique({ where: { slug: input.slug } })) throw new ServiceError(409, "Contest slug taken.", { slug: "Already exists." });
  return prisma.contest.create({ data: { slug: input.slug, name: input.name, description: input.description ?? null, createdById: actor.id } });
}

export async function attachToContest(code: string, input: { contestSlug: string; index: string; points?: number; ordering?: number }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const contest = await prisma.contest.findUnique({ where: { slug: input.contestSlug } });
  if (!contest) throw new ServiceError(404, "Contest not found.", { contestSlug: "No such contest." });
  if (!input.index) throw new ServiceError(400, "A problem index/letter is required.", { index: "Required." });

  const dupProblem = await prisma.contestProblem.findUnique({ where: { contestId_problemId: { contestId: contest.id, problemId: problem.id } } });
  if (dupProblem) throw new ServiceError(409, "This problem is already in that contest.");
  const dupIndex = await prisma.contestProblem.findUnique({ where: { contestId_index: { contestId: contest.id, index: input.index } } });
  if (dupIndex) throw new ServiceError(409, "That index is already used in this contest.", { index: "Taken." });

  return prisma.contestProblem.create({
    data: { contestId: contest.id, problemId: problem.id, index: input.index, ordering: input.ordering ?? 0, points: input.points ?? null },
  });
}

export async function detachFromContest(code: string, contestSlug: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const contest = await prisma.contest.findUnique({ where: { slug: contestSlug } });
  if (!contest) throw new ServiceError(404, "Contest not found.");
  await prisma.contestProblem.deleteMany({ where: { contestId: contest.id, problemId: problem.id } });
}
