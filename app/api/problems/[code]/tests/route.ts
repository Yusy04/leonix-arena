import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { createTest, type TestInput } from "@/lib/problems/tests-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const test = await createTest(code, body as unknown as TestInput, actor);
    return NextResponse.json({ test }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
