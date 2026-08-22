import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { setVisibility } from "@/lib/problems/service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const problem = await setVisibility(code, String(body.visibility ?? ""), actor);
    return NextResponse.json({ problem });
  } catch (e) {
    return errorResponse(e);
  }
}
