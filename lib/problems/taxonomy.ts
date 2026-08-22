import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";

const SLUG_RE = /^[a-z0-9-]{2,64}$/;

// --- assign tags to a problem (problem managers) ---
export async function setProblemTags(code: string, tagSlugs: string[], actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const tags = await prisma.tag.findMany({ where: { slug: { in: tagSlugs } } });
  const found = new Set(tags.map(t => t.slug));
  const missing = tagSlugs.filter(s => !found.has(s));
  if (missing.length) throw new ServiceError(400, "Unknown tag(s): " + missing.join(", "), { tags: "Unknown: " + missing.join(", ") });

  await prisma.problemTag.deleteMany({ where: { problemId: problem.id } });
  if (tags.length) await prisma.problemTag.createMany({ data: tags.map(t => ({ problemId: problem.id, tagId: t.id })) });
  return prisma.problemTag.findMany({ where: { problemId: problem.id }, include: { tag: true } });
}

// --- manage the global tag taxonomy (admins) ---
export async function createTag(input: { slug: string; name: string; parentSlug?: string; description?: string; ordering?: number }, actor: Actor) {
  if (actor.role !== "ADMIN") throw new ServiceError(403, "Only admins manage the tag taxonomy.");
  if (!SLUG_RE.test(input.slug)) throw new ServiceError(400, "Invalid tag slug.", { slug: "2–64 chars: lowercase letters, digits, hyphens." });
  if (await prisma.tag.findUnique({ where: { slug: input.slug } })) throw new ServiceError(409, "Tag slug taken.", { slug: "Already exists." });

  let parentId: string | null = null;
  if (input.parentSlug) {
    const parent = await prisma.tag.findUnique({ where: { slug: input.parentSlug } });
    if (!parent) throw new ServiceError(400, "Unknown parent tag.", { parentSlug: "No such tag." });
    parentId = parent.id;
  }
  return prisma.tag.create({ data: { slug: input.slug, name: input.name, parentId, description: input.description ?? null, ordering: input.ordering ?? 0 } });
}

export function listTags() {
  return prisma.tag.findMany({ orderBy: [{ parentId: "asc" }, { ordering: "asc" }, { name: "asc" }] });
}
