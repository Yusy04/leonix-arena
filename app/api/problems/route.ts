import { NextResponse } from "next/server";
import { requireActor, errorResponse, readJson } from "@/lib/problems/route-helpers";
import { createProblem, listProblems, type CreateProblemInput } from "@/lib/problems/service";

export async function GET(req: Request) {
  try {
    await requireActor();
    const p = new URL(req.url).searchParams;
    const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
    const res = await listProblems({
      status: p.get("status") ?? undefined,
      visibility: p.get("visibility") ?? undefined,
      tag: p.get("tag") ?? undefined,
      q: p.get("q") ?? undefined,
      take: num("take"),
      skip: num("skip"),
    });
    return NextResponse.json(res);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor();
    const body = await readJson(req);
    const problem = await createProblem(body as unknown as CreateProblemInput, actor);
    return NextResponse.json({ problem }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
