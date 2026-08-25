import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { reorderSamples } from "@/lib/problems/samples-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const order = Array.isArray(body.sampleIds) ? (body.sampleIds as unknown[]).map(String) : [];
    const samples = await reorderSamples(code, order, actor);
    return NextResponse.json({ samples });
  } catch (e) {
    return errorResponse(e);
  }
}
