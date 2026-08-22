import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { addImage } from "@/lib/problems/attachments-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const image = await addImage(code, {
      filename: String(body.filename ?? ""),
      data: String(body.data ?? ""),
      altText: body.altText ? String(body.altText) : undefined,
      caption: body.caption ? String(body.caption) : undefined,
    }, actor);
    return NextResponse.json({ image }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
