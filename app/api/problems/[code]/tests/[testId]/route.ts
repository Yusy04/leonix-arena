import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { updateTest, deleteTest } from "@/lib/problems/tests-service";

type Params = { params: Promise<{ code: string; testId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code, testId } = await params;
    const body = await readJson(req);
    const test = await updateTest(code, testId, body as { enabled?: boolean; input?: string; output?: string }, actor);
    return NextResponse.json({ test });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code, testId } = await params;
    await deleteTest(code, testId, actor);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
