import type { Role } from "@/lib/types";

export interface Actor {
  id: string;
  role: Role;
}
export interface OwnedResource {
  createdById: string;
  collaboratorIds?: string[];
}

/** ADMIN and HELPER may author problems; students may not. */
export function canCreateProblem(role: Role): boolean {
  return role === "ADMIN" || role === "HELPER";
}

/**
 * ADMIN manages any problem; otherwise the creator and any collaborator
 * (co-author) have equal, full manage rights. (Only admins/helpers are ever
 * creators/collaborators — enforced at create/add time.)
 */
export function canManageProblem(actor: Actor, problem: OwnedResource): boolean {
  if (actor.role === "ADMIN") return true;
  if (problem.createdById === actor.id) return true;
  return problem.collaboratorIds?.includes(actor.id) ?? false;
}
