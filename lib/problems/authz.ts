import type { Role } from "@/lib/types";

export interface Actor {
  id: string;
  role: Role;
}
export interface OwnedResource {
  createdById: string;
}

/** ADMIN and HELPER may author problems; students may not. */
export function canCreateProblem(role: Role): boolean {
  return role === "ADMIN" || role === "HELPER";
}

/** ADMIN manages any problem; HELPER only problems they created. */
export function canManageProblem(actor: Actor, problem: OwnedResource): boolean {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "HELPER") return problem.createdById === actor.id;
  return false;
}
