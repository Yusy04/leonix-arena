import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { setOriginalLanguage } from "@/lib/problems/translations";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const problem = await setOriginalLanguage(code, String(body.language ?? ""), actor);
    return NextResponse.json({ problem });
  } catch (e) {
    return errorResponse(e);
  }
}
