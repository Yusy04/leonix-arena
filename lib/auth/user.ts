import type { User } from "@prisma/client";
import type { AuthUser } from "@/lib/types";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

export function toAuthUser(u: User): AuthUser {
  return {
    id: u.id, email: u.email, handle: u.handle, name: u.name, role: u.role,
    goals: u.goals, language: u.language, city: u.city, avatarHue: u.avatarHue,
  };
}
