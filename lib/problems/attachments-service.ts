import type { AttachmentKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ServiceError, requireManageableProblem } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";
import { storage, storagePaths } from "@/lib/storage";

// ---------- images ----------
export async function addImage(code: string, input: { filename: string; data: string | Buffer; altText?: string; caption?: string }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (!input.filename) throw new ServiceError(400, "Filename is required.", { filename: "Required." });
  const ref = await storage.put(storagePaths.imageKey(problem.code, input.filename), input.data);
  const obj = await prisma.storageObject.create({ data: ref });
  const maxOrder = (await prisma.problemImage.aggregate({ where: { problemId: problem.id }, _max: { ordering: true } }))._max.ordering ?? -1;
  return prisma.problemImage.create({
    data: { problemId: problem.id, filename: input.filename, storageObjectId: obj.id, altText: input.altText ?? null, caption: input.caption ?? null, ordering: maxOrder + 1 },
  });
}

export async function deleteImage(code: string, imageId: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const image = await prisma.problemImage.findFirst({ where: { id: imageId, problemId: problem.id } });
  if (!image) throw new ServiceError(404, "Image not found.");
  await storage.delete(storagePaths.imageKey(problem.code, image.filename));
  await prisma.problemImage.delete({ where: { id: image.id } });
}

export async function reorderImages(code: string, orderedIds: string[], actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const images = await prisma.problemImage.findMany({ where: { problemId: problem.id } });
  const known = new Set(images.map(i => i.id));
  if (orderedIds.length !== images.length || orderedIds.some(id => !known.has(id))) {
    throw new ServiceError(400, "Reorder must list exactly the problem's images once each.");
  }
  await prisma.$transaction(orderedIds.map((id, i) => prisma.problemImage.update({ where: { id }, data: { ordering: i } })));
  return prisma.problemImage.findMany({ where: { problemId: problem.id }, orderBy: { ordering: "asc" } });
}

// ---------- grader / checker / other ----------
function attachmentKey(code: string, kind: AttachmentKind, filename: string): string {
  if (kind === "GRADER") return storagePaths.graderKey(code, filename);
  if (kind === "CHECKER") return storagePaths.checkerKey(code, filename);
  return `${storagePaths.problemRoot(code)}/attachments/${filename}`;
}

/** Upload/replace an attachment. For GRADER/CHECKER the previous active one is
 * deactivated first (the partial unique index allows only one active each). */
export async function setAttachment(code: string, kind: AttachmentKind, input: { filename: string; data: string | Buffer; language?: string }, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  if (!input.filename) throw new ServiceError(400, "Filename is required.", { filename: "Required." });

  const ref = await storage.put(attachmentKey(problem.code, kind, input.filename), input.data);
  const obj = await prisma.storageObject.create({ data: ref });

  if (kind === "GRADER" || kind === "CHECKER") {
    await prisma.problemAttachment.updateMany({ where: { problemId: problem.id, kind, active: true }, data: { active: false } });
    if (kind === "CHECKER") await prisma.problem.update({ where: { id: problem.id }, data: { checkerType: "CUSTOM" } });
  }

  return prisma.problemAttachment.create({
    data: { problemId: problem.id, kind, filename: input.filename, storageObjectId: obj.id, language: input.language ?? null, active: true },
  });
}

export async function removeAttachment(code: string, attachmentId: string, actor: Actor) {
  const problem = await requireManageableProblem(code, actor);
  const att = await prisma.problemAttachment.findFirst({ where: { id: attachmentId, problemId: problem.id } });
  if (!att) throw new ServiceError(404, "Attachment not found.");
  await prisma.problemAttachment.delete({ where: { id: att.id } });
  if (att.kind === "CHECKER") {
    const anyChecker = await prisma.problemAttachment.count({ where: { problemId: problem.id, kind: "CHECKER", active: true } });
    if (anyChecker === 0) await prisma.problem.update({ where: { id: problem.id }, data: { checkerType: "DIFF" } });
  }
}
