import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { addEditorialVideo } from "@/lib/problems/editorials-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string; language: string }> }) {
  try {
    const actor = await requireActor();
    const { code, language } = await params;
    const body = await readJson(req);
    const video = await addEditorialVideo(code, language, {
      url: String(body.url ?? ""),
      title: body.title ? String(body.title) : undefined,
    }, actor);
    return NextResponse.json({ video }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
