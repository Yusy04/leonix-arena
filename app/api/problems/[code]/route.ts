import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { getProblemByCode, updateProblem, deleteProblem, ServiceError, type UpdateProblemInput } from "@/lib/problems/service";

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireActor();
    const { code } = await params;
    const problem = await getProblemByCode(code);
    if (!problem) throw new ServiceError(404, "Problem not found.");
    return NextResponse.json({ problem });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const problem = await updateProblem(code, body as UpdateProblemInput, actor);
    return NextResponse.json({ problem });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    await deleteProblem(code, actor);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
