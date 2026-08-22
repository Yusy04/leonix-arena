import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { addTranslation, type TranslationInput } from "@/lib/problems/translations";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const translation = await addTranslation(code, body as unknown as TranslationInput, actor);
    return NextResponse.json({ translation }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
