import { NextResponse } from "next/server";
import type { AttachmentKind } from "@prisma/client";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { setAttachment } from "@/lib/problems/attachments-service";
import { ServiceError } from "@/lib/problems/service";

const KINDS: AttachmentKind[] = ["GRADER", "CHECKER", "OTHER"];

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const kind = String(body.kind ?? "") as AttachmentKind;
    if (!KINDS.includes(kind)) throw new ServiceError(400, "Invalid attachment kind.", { kind: "GRADER | CHECKER | OTHER" });
    const attachment = await setAttachment(code, kind, {
      filename: String(body.filename ?? ""),
      data: String(body.data ?? ""),
      language: body.language ? String(body.language) : undefined,
    }, actor);
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
