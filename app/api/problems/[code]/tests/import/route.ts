import { NextResponse } from "next/server";
import { requireActor, errorResponse } from "@/lib/problems/route-helpers";
import { ServiceError } from "@/lib/problems/service";
import { importTestsFromZip, type ImportMode } from "@/lib/problems/tests-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const actor = await requireActor();
    const { code } = await params;

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new ServiceError(400, "Upload a .zip file of your tests.", { zip: "No file uploaded." });
    }
    const mode: ImportMode = form.get("mode") === "append" ? "append" : "replace";
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await importTestsFromZip(code, buffer, mode, actor);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
