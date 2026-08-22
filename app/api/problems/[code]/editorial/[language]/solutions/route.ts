import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { addEditorialSolution } from "@/lib/problems/editorials-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string; language: string }> }) {
  try {
    const actor = await requireActor();
    const { code, language } = await params;
    const body = await readJson(req);
    const solution = await addEditorialSolution(code, language, {
      languageCode: String(body.languageCode ?? ""),
      source: String(body.source ?? ""),
      filename: body.filename ? String(body.filename) : undefined,
    }, actor);
    return NextResponse.json({ solution }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
