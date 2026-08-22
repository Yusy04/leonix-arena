import { NextResponse } from "next/server";
import { requireActor, errorResponse } from "@/lib/problems/route-helpers";
import { removeCollaborator } from "@/lib/problems/collaborators";

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string; userId: string }> }) {
  try {
    const actor = await requireActor();
    const { code, userId } = await params;
    const collaborators = await removeCollaborator(code, userId, actor);
    return NextResponse.json({ collaborators });
  } catch (e) {
    return errorResponse(e);
  }
}
