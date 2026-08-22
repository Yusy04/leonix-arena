import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { attachToContest } from "@/lib/problems/contests-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const association = await attachToContest(code, {
      contestSlug: String(body.contestSlug ?? ""),
      index: String(body.index ?? ""),
      points: typeof body.points === "number" ? body.points : undefined,
      ordering: typeof body.ordering === "number" ? body.ordering : undefined,
    }, actor);
    return NextResponse.json({ association }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
