import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { setScoring } from "@/lib/problems/scoring-service";
import type { ScoringInput } from "@/lib/problems/scoring";

export async function PUT(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const scheme = await setScoring(code, body as unknown as ScoringInput, actor);
    return NextResponse.json({ scheme });
  } catch (e) {
    return errorResponse(e);
  }
}
