import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { createTag, listTags } from "@/lib/problems/taxonomy";

export async function GET() {
  try {
    await requireActor();
    const tags = await listTags();
    return NextResponse.json({ tags });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor();
    const body = await readJson(req);
    const tag = await createTag({
      slug: String(body.slug ?? ""),
      name: String(body.name ?? ""),
      parentSlug: body.parentSlug ? String(body.parentSlug) : undefined,
      description: body.description ? String(body.description) : undefined,
    }, actor);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
