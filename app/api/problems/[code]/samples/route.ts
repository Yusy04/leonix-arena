import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { createSample, type SampleInput } from "@/lib/problems/samples-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const sample = await createSample(code, body as unknown as SampleInput, actor);
    return NextResponse.json({ sample }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
