import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { createContest } from "@/lib/problems/contests-service";

export async function POST(req: Request) {
  try {
    const actor = await requireActor();
    const body = await readJson(req);
    const contest = await createContest({
      slug: String(body.slug ?? ""),
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : undefined,
    }, actor);
    return NextResponse.json({ contest }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
