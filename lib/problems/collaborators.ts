import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";

function collaboratorList(problemId: string) {
  return prisma.problemCollaborator.findMany({
    where: { problemId },
    include: { user: { select: { id: true, handle: true, name: true, avatarHue: true } } },
    orderBy: { addedAt: "asc" },
  });
}

/** Add a co-author (by handle or email). Any manager can add; the target must
 * be an admin/helper. Co-authors then have full manage rights on this problem. */
export async function addCollaborator(code: string, handle: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const needle = handle.trim().toLowerCase();
  if (!needle) throw new ServiceError(400, "A handle or email is required.", { handle: "Required." });

  const user = await prisma.user.findFirst({ where: { OR: [{ handle: needle }, { email: needle }] } });
  if (!user) throw new ServiceError(404, "No user with that handle or email.", { handle: "No such user." });
  if (user.role !== "ADMIN" && user.role !== "HELPER") {
    throw new ServiceError(400, "Only admins and helpers can co-author problems.", { handle: "Must be an admin or helper." });
  }
  if (user.id === problem.createdById) throw new ServiceError(409, "That user is already the problem's author.", { handle: "Already the author." });

  const existing = await prisma.problemCollaborator.findUnique({ where: { problemId_userId: { problemId: problem.id, userId: user.id } } });
  if (existing) throw new ServiceError(409, "That user is already a collaborator.", { handle: "Already added." });

  await prisma.problemCollaborator.create({ data: { problemId: problem.id, userId: user.id } });
  return collaboratorList(problem.id);
}

export async function removeCollaborator(code: string, userId: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  await prisma.problemCollaborator.deleteMany({ where: { problemId: problem.id, userId } });
  return collaboratorList(problem.id);
}
