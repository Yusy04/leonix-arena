import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { reorderTests } from "@/lib/problems/tests-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const order = Array.isArray(body.testIds) ? (body.testIds as unknown[]).map(String) : [];
    const tests = await reorderTests(code, order, actor);
    return NextResponse.json({ tests });
  } catch (e) {
    return errorResponse(e);
  }
}
