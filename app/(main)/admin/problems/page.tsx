import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canCreateProblem } from "@/lib/problems/authz";
import { prisma } from "@/lib/db";
import { ProblemsAdmin } from "@/components/admin/ProblemsAdmin";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/problems");
  if (!canCreateProblem(user.role)) redirect("/dashboard");

  const where = user.role === "ADMIN"
    ? {}
    : { OR: [{ createdById: user.id }, { collaborators: { some: { userId: user.id } } }] };
  const problems = await prisma.problem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: { code: true, title: true, status: true, visibility: true, difficulty: true, updatedAt: true, createdBy: { select: { handle: true } } },
  });

  return (
    <ProblemsAdmin
      role={user.role}
      problems={problems.map(p => ({
        code: p.code, title: p.title, status: p.status, visibility: p.visibility,
        difficulty: p.difficulty, owner: p.createdBy.handle, updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}
