import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { updateSample, deleteSample, type SampleInput } from "@/lib/problems/samples-service";

type Params = { params: Promise<{ code: string; sampleId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code, sampleId } = await params;
    const body = await readJson(req);
    const sample = await updateSample(code, sampleId, body as Partial<SampleInput>, actor);
    return NextResponse.json({ sample });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code, sampleId } = await params;
    await deleteSample(code, sampleId, actor);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
