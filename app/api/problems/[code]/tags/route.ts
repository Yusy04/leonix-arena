import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { setProblemTags } from "@/lib/problems/taxonomy";

export async function PUT(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;
    const body = await readJson(req);
    const slugs = Array.isArray(body.tags) ? (body.tags as unknown[]).map(String) : [];
    const tags = await setProblemTags(code, slugs, actor);
    return NextResponse.json({ tags });
  } catch (e) {
    return errorResponse(e);
  }
}
