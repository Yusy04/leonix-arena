import { storage, storagePaths } from "@/lib/storage";

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", avif: "image/avif",
};

// Public: serves an uploaded problem image so statement <img> tags resolve.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string; filename: string }> }) {
  const { code, filename } = await params;
  try {
    const bytes = await storage.get(storagePaths.imageKey(code, decodeURIComponent(filename)));
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(bytes), {
      headers: { "content-type": MIME[ext] ?? "application/octet-stream", "cache-control": "public, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
