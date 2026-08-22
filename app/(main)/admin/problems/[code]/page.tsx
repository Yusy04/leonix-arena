import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageProblem } from "@/lib/problems/authz";
import { getProblemByCode } from "@/lib/problems/service";
import { prisma } from "@/lib/db";
import { ProblemEditor } from "@/components/admin/ProblemEditor";

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { code } = await params;
  const problem = await getProblemByCode(code);
  if (!problem) notFound();
  if (!canManageProblem({ id: user.id, role: user.role }, problem)) redirect("/dashboard");

  const [allTags, languages] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.programmingLanguage.findMany({ where: { active: true }, orderBy: { ordering: "asc" }, select: { code: true, name: true } }),
  ]);

  return <ProblemEditor initial={problem} allTags={allTags} languages={languages} />;
}
