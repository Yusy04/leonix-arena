import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { updateTranslation, removeTranslation, type TranslationInput } from "@/lib/problems/translations";

type Params = { params: Promise<{ code: string; language: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code, language } = await params;
    const body = await readJson(req);
    const translation = await updateTranslation(code, language, body as Partial<TranslationInput>, actor);
    return NextResponse.json({ translation });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const actor = await requireActor();
    const { code, language } = await params;
    await removeTranslation(code, language, actor);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
