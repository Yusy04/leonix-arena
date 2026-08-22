import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ServiceError } from "@/lib/problems/service";
import type { Actor } from "@/lib/problems/authz";

/** Resolve the signed-in actor or throw a 401 ServiceError. */
export async function requireActor(): Promise<Actor> {
  const user = await getCurrentUser();
  if (!user) throw new ServiceError(401, "You must be signed in.");
  return { id: user.id, role: user.role as Actor["role"] };
}

/** Map a thrown error to a JSON response. */
export function errorResponse(e: unknown) {
  if (e instanceof ServiceError) {
    const body = e.fieldErrors ? { error: e.message, errors: e.fieldErrors } : { error: e.message };
    return NextResponse.json(body, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  return (await req.json().catch(() => ({}))) as Record<string, unknown>;
}
