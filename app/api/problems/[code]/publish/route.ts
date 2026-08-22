import { NextResponse } from "next/server";
import { requireActor, errorResponse } from "@/lib/problems/route-helpers";
import { publishProblem } from "@/lib/problems/service";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const problem = await publishProblem(code, actor);
    return NextResponse.json({ problem });
  } catch (e) {
    return errorResponse(e);
  }
}
