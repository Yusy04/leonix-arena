import { NextResponse } from "next/server";
import { requireActor, errorResponse } from "@/lib/problems/route-helpers";
import { buildTemplateZip } from "@/lib/problems/tests-zip";

export async function GET() {
  try {
    await requireActor();
    const zip = await buildTemplateZip();
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="leonix-tests-template.zip"',
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
