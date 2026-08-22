import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { upsertEditorialTranslation } from "@/lib/problems/editorials-service";

export async function PUT(req: Request, { params }: { params: Promise<{ code: string; language: string }> }) {
  try {
    const actor = await requireActor();
    const { code, language } = await params;
    const body = await readJson(req);
    const translation = await upsertEditorialTranslation(code, language, {
      description: body.description === undefined ? undefined : String(body.description),
      published: typeof body.published === "boolean" ? body.published : undefined,
    }, actor);
    return NextResponse.json({ translation });
  } catch (e) {
    return errorResponse(e);
  }
}
