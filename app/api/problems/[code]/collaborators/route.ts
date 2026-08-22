import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { addCollaborator } from "@/lib/problems/collaborators";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const collaborators = await addCollaborator(code, String(body.handle ?? ""), actor);
    return NextResponse.json({ collaborators }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
