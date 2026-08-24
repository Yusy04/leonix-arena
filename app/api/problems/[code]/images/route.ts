import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { addImage } from "@/lib/problems/attachments-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const filename = String(body.filename ?? "");
    const data = body.encoding === "base64" ? Buffer.from(String(body.data ?? ""), "base64") : String(body.data ?? "");

    const image = await addImage(code, {
      filename,
      data,
      altText: body.altText ? String(body.altText) : undefined,
      caption: body.caption ? String(body.caption) : undefined,
    }, actor);

    return NextResponse.json({ image, url: `/api/problems/${code}/images/${encodeURIComponent(filename)}` }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
